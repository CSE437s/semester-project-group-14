import React, { useState, useEffect } from 'react';
import { Image, View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { useNavigation, useIsFocused } from "@react-navigation/core";
import { collection, query, doc, getDoc, where, getDocs } from 'firebase/firestore';
import { followUser, unfollowUser } from '../services/UserService';

const FollowScreen = () => {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const [followedUserIds, setFollowedUserIds] = useState([]);
  const featuredUsers = [
    { id: 'ethan', username: 'ethan', profilePicUrl: null },
    { id: 'coolkyle1', username: 'coolkyle1', profilePicUrl: null },
    { id: 'sam', username: 'sam', profilePicUrl: null },
    { id: 'test125', username: 'test125', profilePicUrl: null },

  ];

  useEffect(() => {
    const fetchFollowing = async () => {
      const currentUserId = auth.currentUser?.uid;
      if (currentUserId) {
        const followingRef = collection(db, 'users', currentUserId, 'following');
        const snapshot = await getDocs(followingRef);
        const followingIds = snapshot.docs.map(doc => doc.id);
        setFollowedUserIds(followingIds);
      }
    };

    fetchFollowing();
  }, [isFocused]);

  useEffect(() => {
    const fetchFeaturedUsers = async () => {
      const updatedFeaturedUsers = await Promise.all(featuredUsers.map(async user => {
        const userQuery = query(collection(db, 'users'), where('username', '==', user.username));
        const userSnap = await getDocs(userQuery);
        let userDocData = user;
        userSnap.forEach(doc => { // Should only be one doc since usernames are unique
          userDocData = { ...user, ...doc.data(), id: doc.id }; // Use Firestore document id
        });
        return userDocData;
      }));
      setUsers(updatedFeaturedUsers);
    };
    
    

    if (!searchTerm.trim()) {
      fetchFeaturedUsers();
      setLoading(false);
      return;
    }
    setLoading(true);

    const search = async () => {
      const q = query(
        collection(db, 'users'),
        where('username', '>=', searchTerm),
        where('username', '<=', searchTerm + '\uf8ff')
      );

      try {
        const querySnapshot = await getDocs(q);
        const usersList = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(doc => doc.id !== auth.currentUser?.uid);

        const usersWithProfilePics = await Promise.all(usersList.map(async user => {
          const userDocRef = doc(db, "users", user.id);
          const userDocSnapshot = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            return { ...user, profilePicUrl: userData.profilePicUrl };
          }
        }));

        setUsers(usersWithProfilePics);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    };

    const handler = setTimeout(() => {
      search();
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleFollowUnfollow = async (userId, isFollowing) => {
    if (isFollowing) {
      await unfollowUser(auth.currentUser.uid, userId);
      setFollowedUserIds(followedUserIds.filter(id => id !== userId));
    } else {
      await followUser(auth.currentUser.uid, userId);
      setFollowedUserIds([...followedUserIds, userId]);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        autoCorrect={false}
        autoCapitalize="none"
        style={styles.input}
        placeholder="Search users..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <>
          {!searchTerm && <Text style={styles.sectionHeader}>Featured Users:</Text>}
          <FlatList
            data={users}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.userItem}>
                  <TouchableOpacity onPress={() => {
                    console.log("Navigating to profile of user:", item.id); // Debug log
                    navigation.navigate('Profile', { userId: item.id });
                  }} style={styles.userContent}>
                  <Image
                    source={item.profilePicUrl ? { uri: item.profilePicUrl } : require("./../assets/profile-pic.jpg")}
                    style={styles.avatar}
                  />
                  <Text style={styles.username}>{item.username}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    followedUserIds.includes(item.id) ? styles.unfollowButton : styles.followButton,
                  ]}
                  onPress={() => handleFollowUnfollow(item.id, followedUserIds.includes(item.id))}
                >
                  <Text style={styles.buttonText}>
                    {followedUserIds.includes(item.id) ? 'Unfollow' : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e6e6e6',
  },
  input: {
    height: 50,
    backgroundColor: 'white',
    borderColor: '#B0BEC5',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CFD8DC',
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 5,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    color: "#37474F",
    marginLeft: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButton: {
    backgroundColor: "#007BFF", // Follow button is now blue
  },
  unfollowButton: {
    backgroundColor: "#d1d1d1", // Unfollow button is now grey
  },
  buttonText: {
    color: 'white', // Making text color white for better visibility on blue
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: "#37474F",
  },
  sectionHeader: {
    fontSize: 18,
    color: '#37474F',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  }
});

export default FollowScreen;
