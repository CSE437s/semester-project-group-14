import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  addDoc,
  collection,
  getDocs,
  query,
  doc,
  where,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { PromptContext } from "../App";

const PromptScreen = () => {
  const [newEssence, setNewEssence] = useState("");
  const prompt = useContext(PromptContext);
  const handleAddEssence = async () => {
    if (newEssence.trim() === "") {
      return;
    }

    const userId = auth.currentUser?.uid;

    const essencesRef = collection(db, `users/${userId}/essences`);

    const querySnapshot = await getDocs(
      query(essencesRef, where("prompt", "==", prompt))
    );
    if (!querySnapshot.empty) {
      alert("You have already responded to this prompt.");
      return;
    }

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

  return (
    <View style={styles.container}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#87CEEB",
    padding: 10,
    borderRadius: 10,
    flex: 1,
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
});

export default PromptScreen;
