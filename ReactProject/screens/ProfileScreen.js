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
import { useNavigation } from "@react-navigation/core";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  onSnapshot,
  query,
setDoc,
  orderBy,
  updateDoc
} from "firebase/firestore";
import { fetchFollowerCount, fetchFollowingCount } from "../services/UserService";
import * as ImagePicker from 'expo-image-picker';
import { followUser, unfollowUser } from '../services/UserService';


const ProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [essencesData, setEssencesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const userId = route.params.userId;
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState(null); 
  const [followedUserIds, setFollowedUserIds] = useState([]);

  useEffect(() => {
    const fetchFollowing = async () => {
      if (userId) {
        const followingRef = collection(db, 'users', userId, 'following');
        const snapshot = await getDocs(followingRef);
        const followingIds = snapshot.docs.map(doc => doc.id);
        setFollowedUserIds(followingIds);
      }
    };

    fetchFollowing();
  }, [userId]);

  useEffect(() => {
    // const userId = auth.currentUser?.uid;
    const q = query(
      collection(db, `users/${userId}/essences`),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const essences = [];
      snapshot.forEach((doc) => {
        essences.push({ id: doc.id, ...doc.data() });
      });
      setEssencesData(essences);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    // const userId = auth.currentUser?.uid;
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


  const EssenceItem = ({ prompt, response }) => (
    <TouchableOpacity style={styles.essenceItem}>
      <Text style={styles.essenceTitle}>{prompt}</Text>
      <Text style={styles.essenceResponse}>{response}</Text>
    </TouchableOpacity>
  );

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
            } else {
              console.log("Profile picture not found for current user");
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
  
  const handleProfilePictureSelect = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Denied',
          'Please enable permissions to access the camera roll to select a profile picture.'
        );
        return;
      }
  
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
  
      if (!pickerResult.cancelled) {
        const uri = pickerResult.assets[0].uri;

        
        if (userId) {
          try {
            const userDocRef = doc(db, "users", userId);
            await updateDoc(userDocRef, { profilePicUrl: uri });
            setProfilePic(uri);
          } catch (error) {
            console.error("Error updating profile picture URL:", error);
          }
        } else {
          console.error("Current user ID is not available");
        }
      }
    } catch (error) {
      console.error("Error selecting profile picture:", error);
    }
  };
  
  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image   source={profilePic ? { uri: profilePic } : require("./../assets/profile-pic.jpg")} style={styles.profilePicture} />
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Welcome, {username || auth.currentUser?.email}</Text>
          <Text style={styles.userBio}>Share and discover the small joys in life.</Text>
        </View>
      </View>
  
      <View style={styles.statsContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Followers', {userId: userId})} style={styles.statsBox}>
          <Text style={styles.statsCount}>{followerCount}</Text>
          <Text style={styles.statsLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Following', {userId: userId})} style={styles.statsBox}>
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
            {followedUserIds.includes(userId) ? 'Unfollow' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
  
      <View style={styles.separator}></View>
  
      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 20 }}
          size="large"
          color="#3B82F6"
        />
      ) : (
        <FlatList
          data={essencesData}
          renderItem={({ item }) => (
            <EssenceItem prompt={item.prompt} response={item.response} />
          )}
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
    backgroundColor: '#c0e0ed',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  separator: {
    height: 2,
    backgroundColor: '#c2ecfc', // Light gray color for the separator
    marginVertical: 20,
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  userBio: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  promptButton: {
    backgroundColor: "#00008B",
    borderRadius: 20,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10, // Adjust as necessary
  },
  promptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
      padding: 15,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 2.5,
      marginBottom: 5, 
      width: 100,
      marginLeft: 125,
    },
    signOutButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      marginBottom: 20,
    },
    statsBox: {
      alignItems: 'center',
      flex: 1,
    },
    statsCount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    statsLabel: {
      fontSize: 14,
      color: '#666',
      marginTop: 5,
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
  
  });
  
  export default ProfileScreen;
  
