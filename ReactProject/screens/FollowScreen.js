import React, { useState, useEffect } from 'react';
import { Image, View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { followUser, unfollowUser } from '../services/UserService';

const FollowScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followedUserIds, setFollowedUserIds] = useState([]);

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
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setUsers([]);
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

        setUsers(usersList);
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
        autoCapitalize="none"
        style={styles.input}
        placeholder="Search users..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <Image
                    source={require("../assets/profile-pic.jpg")} // Use a dynamic source if available
                    style={styles.avatar}
                  />
              <Text style={styles.username}>{item.username}</Text>
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#c0e0ed',
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
    justifyContent: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  username: {
    flex: 1,
    fontSize: 16,
    color: "#37474F",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followButton: {
    marginRight: 0,
    backgroundColor: "#1E88E5", // Follow button with blue background
  },
  unfollowButton: {
    backgroundColor: "#E53935", // Unfollow button with darker red background
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: "#37474F",
  },
  avatar: {
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 10,
    backgroundColor: "black"
  },
});

export default FollowScreen;