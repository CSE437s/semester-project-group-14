import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/core";
import { useFocusEffect } from "@react-navigation/native";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { fetchFollowerCount, fetchFollowingCount } from "../services/UserService";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [essencesData, setEssencesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [username, setUsername] = useState('');


  useEffect(() => {
    const userId = auth.currentUser?.uid;
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
  }, []);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
  
    const fetchCounts = async () => {
      const followers = await fetchFollowerCount(userId);
      const following = await fetchFollowingCount(userId);
      setFollowerCount(followers);
      setFollowingCount(following);
    };
  
    fetchCounts();
  }, [auth.currentUser]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchFollowingCountOnFocus = async () => {
        const currentUserId = auth.currentUser?.uid;
        if (currentUserId) {
          const updatedFollowingCount = await fetchFollowingCount(currentUserId);
          setFollowingCount(updatedFollowingCount);
        }
      };
  
      fetchFollowingCountOnFocus();
    }, [])
  );

  useEffect(() => {
    const fetchUsername = async () => {
      const currentUserId = auth.currentUser?.uid;
      if (currentUserId) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUserId));
          if (userDoc.exists()) {
            setUsername(userDoc.data().username);
          }
        } catch (error) {
          console.error("Error getting username:", error);
        }
      }
    };
  
    fetchUsername();
  }, []);
  

  const handleSignOut = () => {
    auth
      .signOut()
      .then(() => {
        navigation.navigate("Login");
      })
      .catch((error) => alert(error.message));
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("./../assets/profile-pic.jpg")}
          style={styles.profilePicture}
        />
        <View style={styles.userInfo}>
          <Text style={styles.greeting}>Welcome, {username || auth.currentUser?.email}</Text>
          <Text style={styles.userBio}>Share and discover the small joys in life.</Text>
        </View>
      </View>
  
      <View style={styles.statsContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Followers')} style={styles.statsBox}>
          <Text style={styles.statsCount}>{followerCount}</Text>
          <Text style={styles.statsLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Following')} style={styles.statsBox}>
          <Text style={styles.statsCount}>{followingCount}</Text>
          <Text style={styles.statsLabel}>Following</Text>
        </TouchableOpacity>
      </View>
  
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
      <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
        <Text style={styles.signOutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#87CEEB',
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
});

export default HomeScreen;
