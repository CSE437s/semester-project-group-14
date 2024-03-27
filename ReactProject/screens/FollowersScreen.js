import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useRoute} from '@react-navigation/native';
import { useNavigation } from "@react-navigation/core";

const FollowersScreen = () => {
  const navigation = useNavigation();
  const userId = useRoute().params.userId;
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const followersRef = collection(db, "users", userId, "followers");
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
  }, [userId]);

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={followers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style>
              <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.id, username: item.username })} style={styles.userItem}>
                <Image
                  source={require("../assets/profile-pic.jpg")} // Use a dynamic source if available
                  style={styles.avatar}
                />
                <Text style={styles.username}>{item.username}</Text>
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
    backgroundColor: '#c0e0ed', 
    padding: 20,
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

export default FollowersScreen;
