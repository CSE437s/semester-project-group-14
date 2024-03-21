import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const FollowersScreen = () => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      setLoading(true);
      try {
        const followersRef = collection(db, "users", currentUserId, "followers");
        const snapshot = await getDocs(followersRef);
        const followersListPromises = snapshot.docs.map(async (docRef) => {
          const userDocRef = doc(db, "users", docRef.id);
          const userSnapshot = await getDoc(userDocRef);
          return userSnapshot.exists() ? { id: userSnapshot.id, ...userSnapshot.data() } : null;
        });
        const followersList = (await Promise.all(followersListPromises)).filter(follower => follower !== null);
        setFollowers(followersList);
      } catch (error) {
        console.error("Error fetching followers:", error);
      }
      setLoading(false);
    };

    fetchFollowers();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={followers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.userItem}>
              <Image
                source={require("../assets/profile-pic.jpg")} // Use a dynamic source if available
                style={styles.avatar}
              />
              <Text style={styles.username}>{item.username}</Text>
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
    backgroundColor: '#FFF', 
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Subtle separation
  },
  avatar: {
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 10,
  },
  username: {
    fontSize: 16,
  },
});

export default FollowersScreen;
