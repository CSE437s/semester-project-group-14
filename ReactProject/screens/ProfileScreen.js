import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/core";
import { useFocusEffect } from "@react-navigation/native";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  getDoc,
  getDocs,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { fetchFollowerCount, fetchFollowingCount } from "../services/UserService";
import { followUser, unfollowUser } from "../services/UserService";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [essencesData, setEssencesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const userId = route.params.userId;
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [followedUserIds, setFollowedUserIds] = useState([]);
  const [bio, setBio] = useState(""); 

  useEffect(() => {
    const fetchBio = async () => {
      if (userId) {
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            setBio(userDoc.data().bio || ""); 
          }
        } catch (error) {
          console.error("Error getting bio:", error);
        }
      }
    };

    fetchBio();
  }, [userId]);

  useEffect(() => {
    const fetchFollowing = async () => {
      if (userId) {
        const followingRef = collection(db, "users", auth.currentUser.uid, "following");
        const snapshot = await getDocs(followingRef);
        const followingIds = snapshot.docs.map((doc) => doc.id);
        setFollowedUserIds(followingIds);
      }
    };

    fetchFollowing();
  }, []);


  useEffect(() => {
    setEssencesData([]);
    const q = query(
      collection(db, `users/${userId}/essences`),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const essences = [];
      for (const doc of snapshot.docs) {
        const essenceData = doc.data();
        const likesQuerySnapshot = await getDocs(collection(db, `users/${userId}/essences/${doc.id}/likes`));
        const commentsQuerySnapshot = await getDocs(collection(db, `users/${userId}/essences/${doc.id}/comments`));
        const likes = likesQuerySnapshot.docs.map(likeDoc => likeDoc.data());
        const comments = commentsQuerySnapshot.docs.map(commentDoc => commentDoc.data());
        essences.push({ id: doc.id, ...essenceData, likes, comments });
      }
      setEssencesData(essences);
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);
  


  useEffect(() => {
    if (!userId) return;

    const fetchCounts = async () => {
      const followers = await fetchFollowerCount(userId);
      const following = await fetchFollowingCount(userId);
      setFollowerCount(followers);
      setFollowingCount(following);
    };

    fetchCounts();
  }, [userId, followedUserIds]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchFollowingCountOnFocus = async () => {
        if (userId) {
          const updatedFollowingCount = await fetchFollowingCount(userId);
          setFollowingCount(updatedFollowingCount);
        }
      };
  
      fetchFollowingCountOnFocus();
    }, [userId, followedUserIds])
  );

  useEffect(() => {
    const fetchUsername = async () => {
      if (userId) {
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            setUsername(userDoc.data().username);
          }
        } catch (error) {
          console.error("Error getting username:", error);
        }
      }
    };

    fetchUsername();
  }, [userId]);

  const handleSignOut = () => {
    auth
      .signOut()
      .then(() => {
        navigation.navigate("Login");
      })
      .catch((error) => alert(error.message));
  };

  const handleFollowUnfollow = async (userId, isFollowing) => {
    if (isFollowing) {
      await unfollowUser(auth.currentUser.uid, userId);
      setFollowedUserIds(followedUserIds.filter(id => id !== userId));
    } else {
      await followUser(auth.currentUser.uid, userId);
      setFollowedUserIds([...followedUserIds, userId]);
    }
  };



  const navigateToPromptScreen = () => {
    navigation.navigate("Prompt");
  };

  useEffect(() => {
    const fetchProfilePic = async () => {
      if (userId) {
        try {
          const userDocRef = doc(db, "users", userId);
          const userDocSnapshot = await getDoc(userDocRef);

          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            if (userData && userData.profilePicUrl) {
              setProfilePic(userData.profilePicUrl);
            } 
          } else {
            console.error("User document does not exist for current user");
          }
        } catch (error) {
          console.error("Error getting profile picture:", error);
        }
      } else {
        console.error("Current user ID is not available");
      }
    };

    fetchProfilePic();
  }, [userId]);

  const EssenceItem = ({ item }) => (
    <TouchableOpacity style={styles.essenceItem}>
      <Text style={styles.essenceTitle}>{item.prompt}</Text>
      {item.imageUri && <Image source={{ uri: item.imageUri }} style={styles.essenceImage} />}

      <Text style={styles.essenceResponse}>{item.response}</Text>
      <View style={styles.iconContainer}>
        <View style={styles.iconItem}>
          <Ionicons name="heart-outline" size={20} color="#3B82F6" />
          <Text style={styles.iconText}>{item.likes ? item.likes.length : 0}</Text>
        </View>
        <View style={styles.iconItem}>
          <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
          <Text style={styles.iconText}>{item.comments ? item.comments.length : 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
 <View style={styles.header}>
  <Image
    source={profilePic ? { uri: profilePic } : require("./../assets/profile-pic.jpg")}
    style={styles.profilePicture}
  />
  <View style={styles.userInfo}>
    <Text style={styles.greeting}>Welcome, {username || auth.currentUser?.email}</Text>
    <Text style={styles.userBio}>{bio}</Text>
  </View>
</View>


      <View style={styles.statsContainer}>
      <TouchableOpacity onPress={() => {
  navigation.navigate("Followers", { userId: userId });
}} style={styles.statsBox}>
  <Text style={styles.statsCount}>{followerCount}</Text>
  <Text style={styles.statsLabel}>Followers</Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => {
  navigation.navigate("Following", { userId: userId });
}} style={styles.statsBox}>
  <Text style={styles.statsCount}>{followingCount}</Text>
  <Text style={styles.statsLabel}>Following</Text>
</TouchableOpacity>

      </View>

      {userId == auth.currentUser?.uid ? (
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.button,
            followedUserIds.includes(userId) ? styles.unfollowButton : styles.followButton,
          ]}
          onPress={() => handleFollowUnfollow(userId, followedUserIds.includes(userId))}
        >
          <Text style={styles.buttonText}>
            {followedUserIds.includes(userId) ? "Unfollow" : "Follow"}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.separator}></View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#3B82F6" />
      ) : (
        <FlatList
          data={essencesData}
          renderItem={({ item }) => <EssenceItem item={item} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.essencesGrid}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#e6e6e6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  separator: {
    height: 2,
    // backgroundColor: "#c2ecfc", // Light gray color for the separator
    marginVertical: 20,
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  userBio: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    fontStyle: 'italic',
    textAlign: 'justify',
  },
  
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  
  essenceItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    margin: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  essenceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  essenceResponse: {
    fontSize: 14,
    color: "#666",
  },
  signOutButton: {
    backgroundColor: "#FF7F7F",
    borderRadius: 20,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2.5,
    width: 100,
    marginLeft: 125,
  },
  signOutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statsBox: {
    alignItems: "center",
    flex: 1,
  },
  statsCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statsLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  followButton: {
    marginRight: 0,
    backgroundColor: "#fff", // Unfollow button with darker red background

  },
  unfollowButton: {
    backgroundColor: "#d1d1d1",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: "grey",
    fontSize: 14,
  },
  essenceImage: {
    width: 100,
    height: 100,
    marginVertical: 10,
    borderRadius: 10,
  },
  iconItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconText: {
    marginLeft: 5,
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    width: 100,
  },
});

export default ProfileScreen;
