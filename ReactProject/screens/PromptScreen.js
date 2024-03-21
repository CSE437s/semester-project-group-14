import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from "react-native";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, doc, addDoc, updateDoc, increment } from "firebase/firestore";
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import PromptContext from "../contexts/PromptContext";

const PromptScreen = ({ navigation }) => {
  const [prompts, setPrompts] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [prompt, setPrompt, isPromptAnswered, setIsPromptAnswered] = useContext(PromptContext);
  const [newPotentialPrompt, setNewPotentialPrompt] = useState("");
  const [sortBy, setSortBy] = useState(""); // State to track sorting method

  useEffect(() => {
    fetchPromptsAndVotes();
  }, []);

  const fetchPromptsAndVotes = async () => {
    const promptsRef = collection(db, "potentialPrompts");
    const snapshot = await getDocs(promptsRef);
    let totalUpvotes = 0;
    let totalDownvotes = 0;
    const fetchedPrompts = snapshot.docs.map((doc) => {
      const promptData = { id: doc.id, ...doc.data() };
      totalUpvotes += promptData.upvotes.length;
      totalDownvotes += promptData.downvotes.length;
      return promptData;
    });

    setPrompts(fetchedPrompts);
    setTotalVotes({ upvotes: totalUpvotes, downvotes: totalDownvotes });
  };
  

  const handleVote = async (promptId, voteType) => {
    const userId = auth.currentUser?.uid;
    const promptIndex = prompts.findIndex((prompt) => prompt.id === promptId);
  
    if (promptIndex === -1) {
      return;
    }
  
    const updatedPrompts = [...prompts];
    const updatedPrompt = { ...updatedPrompts[promptIndex] };
  
    let voteField;
    let oppositeField;
  
    if (voteType === "upvote") {
      voteField = "upvotes";
      oppositeField = "downvotes";
    } else {
      voteField = "downvotes";
      oppositeField = "upvotes";
    }
  
    // Fetch existing prompt data
    const upvotes = updatedPrompt.upvotes || [];
    const downvotes = updatedPrompt.downvotes || [];
  
    // Check if the user has already voted
    const hasVoted = upvotes.includes(userId) || downvotes.includes(userId);
  
    // If the user has already voted, switch their vote
    if (hasVoted) {
      updatedPrompt[voteField] = updatedPrompt[voteField].includes(userId)
        ? updatedPrompt[voteField].filter((id) => id !== userId)
        : [...updatedPrompt[voteField], userId];
  
      if (updatedPrompt[oppositeField].includes(userId)) {
        updatedPrompt[oppositeField] = updatedPrompt[oppositeField].filter((id) => id !== userId);
      }
    } else {
      // Add the user's vote
      updatedPrompt[voteField] = [...updatedPrompt[voteField], userId];
    }
  
    updatedPrompts[promptIndex] = updatedPrompt;
    setPrompts(updatedPrompts);
  
    // Update Firestore data
    const promptRef = doc(db, "potentialPrompts", promptId);
    await updateDoc(promptRef, {
      [voteField]: updatedPrompt[voteField],
      [oppositeField]: updatedPrompt[oppositeField],
    });
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
  
    // Firestore schema update
    const potentialPrompt = {
      Description: newPotentialPrompt,
      createdAt: new Date(),
      userId: userId,
      upvotes: [], // Initialize as an empty array
      downvotes: [], // Initialize as an empty array
    };
  
    addDoc(collection(db, `potentialPrompts`), potentialPrompt)
      .then(() => {
        setNewPotentialPrompt("");
        fetchPromptsAndVotes();
      })
      .catch((error) => {
        console.error("Error adding prompt: ", error);
        alert("An error occurred while adding prompt. Please try again.");
      });
  };
  
  const sortPrompts = (sortBy) => {
    let sortedPrompts = [...prompts];
    if (sortBy === "upvotes") {
      sortedPrompts.sort((a, b) => b.upvotes.length - a.upvotes.length);
    } else if (sortBy === "recent") {
      sortedPrompts.sort((a, b) => b.createdAt - a.createdAt);
    }
    setPrompts(sortedPrompts);
  };

  return (
    <ScrollView style={styles.container}>
     {!isPromptAnswered ? (
  <View style={styles.addSubmissionContainer}>
    <Text style={styles.addSubmissionText}>
      You haven't responded to the prompt yet! Once you respond you can submit for next week.
    </Text>
    <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("Feed")}>
      <Text style={styles.addButtonLabel}>Go to Feed</Text>
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

      <View style={styles.sortButtonsContainer}>
        <TouchableOpacity
          style={[styles.sortButton, {backgroundColor: '#FFF'}]}
          onPress={() => {
            sortPrompts("upvotes");
            setSortBy("upvotes");
          }}
        >
          <Text style={[styles.sortButtonText, {color: '#3B82F6'}]}>Sort by Upvotes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, {backgroundColor: '#FFF'}]}
          onPress={() => {
            sortPrompts("recent");
            setSortBy("recent");
          }}
        >
          <Text style={[styles.sortButtonText, {color: '#3B82F6'}]}>Sort by Recent</Text>
        </TouchableOpacity>
      </View>

      {prompts.map((prompt) => (
        <View key={prompt.id} style={styles.promptContainer}>
          <Text style={styles.promptText}>{prompt.Description}</Text>
          <View style={styles.voteContainer}>
            <View style={styles.voteSection}>
              <TouchableOpacity onPress={() => handleVote(prompt.id, "upvote")} >
                <Ionicons name="caret-up" size={18} color="#3B82F6" />
              </TouchableOpacity>
              <Text style={styles.voteCount}>{prompt.upvotes.length}</Text>
            </View>
            <View style={styles.voteSection}>
              <TouchableOpacity onPress={() => handleVote(prompt.id, "downvote")}>
                <Ionicons name="caret-down" size={18} color="#FF6347" />
              </TouchableOpacity>
              <Text style={styles.voteCount}>{prompt.downvotes.length}</Text>
            </View>
          </View>
        </View>
      ))}
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
  promptContainer: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    margin: 10,
  },
  promptText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "bold",
  },
  voteContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voteSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  voteCount: {
    marginLeft: 5,
  },
  input: {
    backgroundColor: "#F0F0F0",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  addButtonLabel: {
    color: "#FFF",
    fontWeight: "bold",
  },
  sortButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  sortButton: {
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
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
  voteCount: {
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 10,
    backgroundColor: "#F0F0F0",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#0782F9",
    width: "50%",
    backgroundColor: "#3B82F6",
    borderRadius: 5,
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
  sortButtonText: {
    fontWeight: "bold",
  },
  
});

export default PromptScreen;
