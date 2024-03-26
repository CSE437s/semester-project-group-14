import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

const FollowingScreen = () => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowing = async () => {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) return;

      setLoading(true);
      try {
        const followingRef = collection(db, "users", currentUserId, "following");
        const snapshot = await getDocs(followingRef);
        const followingListPromises = snapshot.docs.map(async (docRef) => {
          const userDocRef = doc(db, "users", docRef.id);
          const userSnapshot = await getDoc(userDocRef);
          if (userSnapshot.exists()) {
            return { id: userSnapshot.id, ...userSnapshot.data() };
          } else {
            console.error("No such document for following with ID:", docRef.id);
            return null;
          }
        });
        const followingList = (await Promise.all(followingListPromises)).filter(following => following !== null);
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
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
            data={following}
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
    backgroundColor: '#c0e0ed', 
    padding: 20
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
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

export default FollowingScreen;
