import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";

import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/core";
import { auth, db } from "../firebaseConfig";

const homeScreen = () => {
  const navigation = useNavigation();
  const [newEssence, setNewEssence] = useState("");
  const [prompt, setPrompt] = useState("What's your favorite song this week?");
  const [essencesData, setEssencesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEssences = async () => {
      try {
        const userId = auth.currentUser?.uid;
        const querySnapshot = await getDocs(
          query(
            collection(db, `users/${userId}/essences`),
            orderBy("createdAt", "desc")
          )
        );
        const essences = [];
        querySnapshot.forEach((doc) => {
          essences.push({ id: doc.id, ...doc.data() });
        });
        setEssencesData(essences);
      } catch (error) {
        console.error("Error loading essences: ", error);
      } finally {
        setLoading(false);
      }
    };

    loadEssences();
  }, []);

  const handleSignOut = () => {
    auth
      .signOut()
      .then(() => {
        navigation.replace("Login");
      })
      .catch((error) => alert(error.message));
  };
  const handleAddEssence = () => {
    if (newEssence.trim() === "") {
      return;
    }

    const userId = auth.currentUser?.uid;

    const essenceData = {
      prompt: prompt,
      response: newEssence,
      createdAt: new Date(),
    };

    addDoc(collection(db, `users/${userId}/essences`), essenceData)
      .then(() => {
        setNewEssence("");

        alert("Essence added successfully!");
      })
      .catch((error) => {
        console.error("Error adding essence: ", error);
        alert("An error occurred while adding essence. Please try again.");
      });
  };

  const EssenceItem = ({ title }) => (
    <TouchableOpacity style={styles.essenceItem}>
      <Text style={styles.essenceTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
      <View style={styles.promptContainer}>
        <Text style={styles.promptText}>{prompt}</Text>
        <TextInput
          style={styles.responseInput}
          value={newEssence}
          onChangeText={setNewEssence}
          placeholder="Your response"
        />
        <TouchableOpacity onPress={handleAddEssence} style={styles.button}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 20 }}
          size="large"
          color="#3B82F6"
        />
      ) : (
        <FlatList
          data={essencesData}
          renderItem={({ item }) => <EssenceItem title={item.response} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.essencesGrid}
        />
      )}

      <TouchableOpacity onPress={handleSignOut} style={styles.button}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default homeScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 20,
    paddingTop: 20,
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
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 5,
  },
  bio: {
    marginBottom: 5,
  },
  followCounts: {
    flexDirection: "row",
  },
  followText: {
    marginRight: 10,
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
    paddingVertical: 15,
    aspectRatio: 1,
  },
  essenceTitle: {
    fontSize: 16,
  },
  button: {
    backgroundColor: "#3B82F6",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  promptContainer: {
    backgroundColor: "#E5E7EB",
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  promptText: {
    fontSize: 18,
    marginBottom: 10,
  },
  responseInput: {
    backgroundColor: "white",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    padding: 10,
    marginBottom: 10,
  },
});
