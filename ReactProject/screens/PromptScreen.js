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
  // const prompt = useContext(PromptContext);
  const [prompt, setPrompt] = useState("");
  const [userResponse, setUserResponse] = useState(null);
  const [answeredCurrentPrompt, setAnsweredCurrentPrompt] = useState(false);

  useEffect(() => {
    const fetchPromptAndCheckResponse = async () => {
      // Store the selected prompt in a local variable
      setAnsweredCurrentPrompt(false);
      let selectedPrompt = '';
  
      const getRandomPrompt = async () => {
        const promptsRef = collection(db, "prompts");
        const promptSnapshot = await getDocs(promptsRef);
        const promptList = [];
        promptSnapshot.forEach((doc) => {
          doc.data().questions.forEach((question) => {
            promptList.push(question);
          });
        });
        
        const randomIndex = Math.floor(Math.random() * promptList.length);
        selectedPrompt = promptList[randomIndex];
      };
  
      const checkResponse = async () => {
        const userId = auth.currentUser?.uid;
        const essencesRef = collection(db, `users/${userId}/essences`);
        const querySnapshot = await getDocs(
          query(essencesRef, where("prompt", "==", selectedPrompt))
        );
        if (!querySnapshot.empty) {
          setUserResponse(querySnapshot.docs[0].data().response);
        } else {
          setUserResponse(null);
        }
      };
  
      await getRandomPrompt();
      setPrompt(selectedPrompt); // Set the prompt outside of getRandomPrompt
      checkResponse();
    };
  
    const interval = setInterval(fetchPromptAndCheckResponse, 10 * 1000);
  
    fetchPromptAndCheckResponse(); // Initial fetch
  
    return () => clearInterval(interval);
  }, []);
  

  const handleAddEssence = async () => {
    setAnsweredCurrentPrompt(true);

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
      <View style={styles.promptContainer}>
        <Text style={styles.promptText}>{prompt}</Text>
        {userResponse ? ( // Check if user has responded
          <View style={styles.userResponseText}>
            <Text >{userResponse}</Text>
          </View>
        ) : (
          <View style={styles.userResponseInputContainer}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#87CEEB",
    padding: 20,
    borderRadius: 10,
    flex: 1,
  },
  promptContainer: {
    // margin: 20,
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
    backgroundColor: "white",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
    padding: 10,
  },
});

export default PromptScreen;