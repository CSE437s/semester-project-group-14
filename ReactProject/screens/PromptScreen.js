import React, { useState, useEffect, useContext } from "react";
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
  const [userResponse, setUserResponse] = useState(null);

  useEffect(() => {
    const fetchPromptAndCheckResponse = async () => {
      const getRandomPrompt = async () => {
        const promptsRef = collection(db, "prompts");
        const promptSnapshot = await getDocs(promptsRef);
        const promptList = [];
        promptSnapshot.forEach((doc) => {
          promptList.push(doc.data().question);
        });
        const randomIndex = Math.floor(Math.random() * promptList.length);
        setPrompt(promptList[randomIndex]);
      };

      const checkResponse = async () => {
        const userId = auth.currentUser?.uid;
        const essencesRef = collection(db, `users/${userId}/essences`);
        const querySnapshot = await getDocs(
          query(essencesRef, where("prompt", "==", prompt))
        );
        if (!querySnapshot.empty) {
          setUserResponse(querySnapshot.docs[0].data().response);
        } else {
          setUserResponse(null); // Reset user response if they haven't responded
        }
      };

      getRandomPrompt();
      checkResponse();
    };

    // const interval = setInterval(fetchPromptAndCheckResponse, 24 * 60 * 60 * 1000); // Fetch prompt and check response every 24 hours
    const interval = setInterval(fetchPromptAndCheckResponse, 60 * 1000); // Fetch prompt and check response every 24 hours

    // Initial fetch
    fetchPromptAndCheckResponse();

    // Clean up interval
    return () => clearInterval(interval);
  }, []);

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
        setUserResponse(newEssence); // Update userResponse state with the new response
      })
      .catch((error) => {
        console.error("Error adding essence: ", error);
        alert("An error occurred while adding essence. Please try again.");
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.promptText}>{prompt}</Text>
      {userResponse ? ( // Check if user has responded
        <View>
          <Text style={styles.userResponseText}>{userResponse}</Text>
        </View>
      ) : (
        <View>
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#87CEEB",
    padding: 10,
    borderRadius: 10,
    flex: 1,
    margin: 20,
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
  userResponseText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default PromptScreen;
