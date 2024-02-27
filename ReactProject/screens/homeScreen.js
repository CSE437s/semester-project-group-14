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
import { auth, db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

const HomeScreen = () => {
  const navigation = useNavigation();
  const [essencesData, setEssencesData] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <View style={styles.profileSection}>
        <Image
          source={require("./../assets/profile-pic.jpg")}
          style={styles.profilePicture}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.title}>Welcome, {auth.currentUser?.email}</Text>
          <Text style={styles.subtitle}>
            Share and discover the small joys in life.
          </Text>
          <Text style={styles.bio}>Write your bio here...</Text>
          <View style={styles.followCounts}>
            <Text style={styles.followText}>Followers: 100</Text>
            <Text style={styles.followText}>Following: 50</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity onPress={navigateToPromptScreen} style={styles.button}>
        <Text style={styles.buttonText}>Go to Prompt</Text>
      </TouchableOpacity>
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
      <View style={styles.signOutContainer}>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#87CEEB",
    padding: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  profileInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 10,
  },
  bio: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 10,
  },
  followCounts: {
    flexDirection: "row",
    marginBottom: 10,
  },
  followText: {
    marginRight: 20,
    fontSize: 14,
    color: "#6B7280",
  },
  essencesGrid: {
    paddingBottom: 20,
  },
  essenceItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    margin: 5,
    padding: 15,
    aspectRatio: 1,
  },
  essenceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  essenceResponse: {
    fontSize: 14,
    color: "#4B5563",
  },
  button: {
    backgroundColor: "#3B82F6",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  signOutContainer: {
    alignItems: "center",
  },
  signOutButton: {
    backgroundColor: "#3B82F6",
    width: "50%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
});

export default HomeScreen;
