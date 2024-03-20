import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from "react-native";
import { db, auth } from "../firebaseConfig"; // Import auth from firebaseConfig
import { collection, getDocs, doc, updateDoc, increment, addDoc } from "firebase/firestore";
import PromptContext from "../contexts/PromptContext";

const PromptScreen = ({ navigation }) => {
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [prompt, setPrompt, isPromptAnswered, setIsPromptAnswered] = useContext(PromptContext);
  const [newPotentialPrompt, setNewPotentialPrompt] = useState("");

  useEffect(() => {
    fetchPromptsAndVotes();
  }, []);

  const fetchPromptsAndVotes = async () => {
    const promptsRef = collection(db, "potentialPrompts");
    const snapshot = await getDocs(promptsRef);
    let totalVotesTemp = 0;
    const fetchedPrompts = snapshot.docs.map((doc) => {
      const promptData = { id: doc.id, ...doc.data() };
      totalVotesTemp += promptData.Votes || 0;
      return promptData;
    });
    setPrompts(fetchedPrompts);
    setTotalVotes(totalVotesTemp);
  };

  const handleSelectPrompt = async (promptId) => {
    if (promptId !== selectedPrompt) {
      const newPromptRef = doc(db, "potentialPrompts", promptId);
      await updateDoc(newPromptRef, { Votes: increment(1) });

      if (selectedPrompt) {
        const oldPromptRef = doc(db, "potentialPrompts", selectedPrompt);
        await updateDoc(oldPromptRef, { Votes: increment(-1) });
      }

      setSelectedPrompt(promptId);
      setHasVoted(true);
      fetchPromptsAndVotes();
    }
  };

  const handleAddPotentialPrompt = async () => {
    if (newPotentialPrompt.trim() === "") {
      return;
    }

    const userId = auth.currentUser?.uid;

    const potentialPrompt = {
      prompt: newPotentialPrompt, // Change to Description as per your prompt schema
      createdAt: new Date(),
      userId: userId,
      upvotes: 0,
      downvotes: 0,
    };

    addDoc(collection(db, `potentialPrompts`), potentialPrompt)
      .then(() => {
        setNewPotentialPrompt("");
        fetchPromptsAndVotes(); // Refresh the prompt list after adding a new prompt
      })
      .catch((error) => {
        console.error("Error adding prompt: ", error);
        alert("An error occurred while adding prompt. Please try again.");
      });
      
  };

  return (
    <ScrollView style={styles.container}>
      {!isPromptAnswered ? (
        <View>
          <Text style={styles.headerText}>
            {"You haven't responded to the prompt yet! Once you respond you can submit for next week."}
          </Text>

          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Feed")}>
            <Text style={styles.buttonText}>Go to Feed</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.addSubmissionContainer}>
          <Text style={styles.addSubmissionText}>Add a submission for next week's prompt!</Text> 
          <TextInput
                    value={newPotentialPrompt}
                    onChangeText={setNewPotentialPrompt}
            style={styles.input}
            autoCapitalize="none"
            placeholder="Your question"
          /> 
          <TouchableOpacity onPress={handleAddPotentialPrompt} style={styles.addButton}>
            <Text style={styles.addButtonLabel}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* <View style={styles.headerContainer}>
        <Text style={styles.headerText}>
          <Text style={{fontWeight: 'bold'}}>Vote on what's essential!</Text>
        </Text>
        <View style={styles.separatorLine} />
        <Text style={styles.headerText}>
          Tap a prompt below, see how others voted, and share your essentials.
        </Text>
      </View>

      {prompts.map((prompt) => (
        <TouchableOpacity
          key={prompt.id}
          style={[
            styles.promptOption,
            selectedPrompt === prompt.id ? styles.selectedPromptOption : {},
          ]}
          onPress={() => handleSelectPrompt(prompt.id)}
        >
          {hasVoted && (
            <View style={[styles.percentageOverlay, 
              { width: Math.round((prompt.Votes || 0) / totalVotes * 100) >= 100 ? '100%' : `${Math.round((prompt.Votes || 0) / totalVotes * 100)}%` }]} />
          )}
          <Text style={styles.promptText}>{prompt.Description}</Text>
          {hasVoted && (
            <Text style={styles.votePercentage}>
              {Math.round((prompt.Votes || 0) / totalVotes * 100)}%
            </Text>
          )}
        </TouchableOpacity>
      ))} */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#87CEEB",
    padding: 20,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF', 
    padding: 15, 
    borderRadius: 10, 
    shadowColor: "#000", 
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84, 
    elevation: 5, 
    marginHorizontal: 10, 
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18, 
    textAlign: 'center', 
    paddingHorizontal: 10, 
    paddingTop: 5, 
  },
  separatorLine: {
    height: 2,
    backgroundColor: '#DDD', 
    alignSelf: 'stretch', 
    marginVertical: 10,  
    width: '95%', 
    alignSelf: 'center',
  },
  promptOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#ddd",
    position: 'relative',
    marginBottom: 10,
    overflow: 'hidden', // Ensure the overlay does not exceed the prompt option boundaries
  },
  promptText: {
    fontSize: 16,
    color: "#333",
    zIndex: 2, // Ensure text appears above the overlay
  },
  votePercentage: {
    fontSize: 16,
    zIndex: 2, // Ensure percentage appears above the overlay
  },
  selectedPromptOption: { // Adjusted style for selected prompts
    borderColor: "#007BFF", // Darker blue for the border to stand out
    borderWidth: 2, // Make the border thicker
    backgroundColor: "#D9E8FF", // Lighter shade for the background to stand out
  },
  percentageOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,123,255,0.2)', // Semi-transparent overlay for percentage
    zIndex: 1, // Ensure it's below the text
  },
  button: {
    backgroundColor: "#0782F9",
    width: "70%",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "center", 
    marginVertical: 10, 
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  addSubmissionContainer: {
    backgroundColor: '#FFFFFF', 
    padding: 15, 
    borderRadius: 10, 
    shadowColor: "#000", 
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84, 
    elevation: 5, 
    marginHorizontal: 10, 
    marginBottom: 20,
  },
  addSubmissionText: {
    fontSize: 18, 
    textAlign: 'center', 
    paddingHorizontal: 10, 
    paddingTop: 5, 
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#0782F9",
    width: "50%",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: "center",
  },
  addButtonLabel: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});

export default PromptScreen;
