import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const FollowersScreen = () => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      try {
        // Assuming there's a 'followers' sub-collection under the current user's document
        const followersRef = collection(db, "users", currentUserId, "followers");
        const snapshot = await getDocs(followersRef);
        const followersListPromises = snapshot.docs.map(async (docRef) => {
          // This assumes that the followers collection contains documents named after the follower's userId
          // And that you need to fetch each follower's user data from the users collection
          const userDocRef = doc(db, "users", docRef.id);
          const userSnapshot = await getDoc(userDocRef);
          if (userSnapshot.exists()) {
            return { id: userSnapshot.id, ...userSnapshot.data() };
          } else {
            // Handle the case where the user document might not exist
            console.error("No such document for follower with ID:", docRef.id);
            return null; // or handle differently
          }
        });
        const followersList = (await Promise.all(followersListPromises)).filter(follower => follower !== null);
        setFollowers(followersList);
      } catch (error) {
        console.error("Error fetching followers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
            data={followers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <View style={styles.userItem}>
                <Text>{item.username}</Text>
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
  userItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
  },
});

export default {FollowersScreen, fetchFollowers};
