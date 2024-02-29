import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const FollowingScreen = () => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowing = async () => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      try {
        const followingRef = collection(db, "users", currentUserId, "following");
        const snapshot = await getDocs(followingRef);
        const followingListPromises = snapshot.docs.map(async (docRef) => {
          const userDocRef = doc(db, "users", docRef.id);
          const userSnapshot = await getDoc(userDocRef);
          return { id: userSnapshot.id, ...userSnapshot.data() };
        });
        const followingList = await Promise.all(followingListPromises);
        setFollowing(followingList);
      } catch (error) {
        console.error("Error fetching following:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
            data={following}
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

export default FollowingScreen;
