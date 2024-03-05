import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { followUser, unfollowUser, fetchFollowingCount } from '../services/UserService';

const FollowScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingCount, setFollowingCount] = useState(0);
  const [followedUserIds, setFollowedUserIds] = useState([]);

  const searchUsers = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    const currentUserId = auth.currentUser?.uid;

    try {
      const q = query(collection(db, "users"), where("username", ">=", searchTerm), where("username", "<=", searchTerm + '\uf8ff'));
      const querySnapshot = await getDocs(q);
      const usersList = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== currentUserId) {
          usersList.push({ id: doc.id, ...doc.data() });
        }
      });
      setUsers(usersList);
    } catch (error) {
      console.error("Error searching users:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;
  
    const fetchFollowingUsers = async () => {
      const followingRef = collection(db, "users", currentUserId, "following");
      const snapshot = await getDocs(followingRef);
      const followingIds = snapshot.docs.map(doc => doc.id);
      setFollowedUserIds(followingIds);
    };
  
    fetchFollowingUsers();
  }, [auth.currentUser]);

  useEffect(() => {
    const handler = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleFollow = async (userIdToFollow) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      console.log('No current user ID found');
      return;
    }

    if (followedUserIds.includes(userIdToFollow)) {
      alert('You are already following this user.');
      return;
    }

    try {
        await followUser(currentUserId, userIdToFollow);
        console.log(`Followed user: ${userIdToFollow}`);
        // Update the list of followed user IDs
        setFollowedUserIds(prevIds => [...prevIds, userIdToFollow]);

        const updatedFollowingCount = await fetchFollowingCount(currentUserId);
        setFollowingCount(updatedFollowingCount);
        // alert('You have successfully followed the user!');
      } catch (error) {
        console.error("Error following user:", error);
      }
  };

  const handleUnfollow = async (userIdToUnfollow) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      console.log('No current user ID found');
      return;
    }

    try {
        await unfollowUser(currentUserId, userIdToUnfollow);
        setFollowedUserIds(prevIds => prevIds.filter(id => id !== userIdToUnfollow));
        // Fetch and update the following count after unfollowing
        const updatedFollowingCount = await fetchFollowingCount(currentUserId);
        setFollowingCount(updatedFollowingCount);
        // alert('You have successfully unfollowed the user!');
      } catch (error) {
        console.error("Error unfollowing user:", error);
      }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search users..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <Text>{item.username}</Text>
              {followedUserIds.includes(item.id) ? (
                <TouchableOpacity onPress={() => handleUnfollow(item.id)}>
                  <Text style={styles.unfollowButton}>Unfollow</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handleFollow(item.id)}>
                  <Text style={styles.followButton}>Follow</Text>
                </TouchableOpacity>
              )}
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
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    justifyContent: 'space-between',
  },
  followButton: {
    color: 'blue',
  },
  unfollowButton: {
    color: 'red',
  },
});

export default FollowScreen;
