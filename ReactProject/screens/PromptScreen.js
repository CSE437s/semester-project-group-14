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
    const promptRef = doc(db, "potentialPrompts", promptId);
    let voteField;
  
    if (voteType === "upvote") {
      voteField = "upvotes";
    } else {
      voteField = "downvotes";
    }
  
    // Fetch existing prompt data
    const promptData = prompts.find(prompt => prompt.id === promptId);
    const upvotes = promptData.upvotes || [];
    const downvotes = promptData.downvotes || [];
  
    // Check if the user has already voted
    const hasVotedUp = upvotes.includes(userId);
    const hasVotedDown = downvotes.includes(userId);
  
    // If the user has already voted in the same direction, remove their vote
    if ((voteType === "upvote" && hasVotedUp) || (voteType === "downvote" && hasVotedDown)) {
      await updateDoc(promptRef, {
        [voteField]: promptData[voteField].filter(id => id !== userId)
      });
    } else {
      // Add the user's vote
      await updateDoc(promptRef, {
        [voteField]: [...promptData[voteField], userId]
      });
  
      // If the user has voted in the opposite direction, remove their vote from the opposite field
      const oppositeField = voteType === "upvote" ? "downvotes" : "upvotes";
      if (promptData[oppositeField].includes(userId)) {
        await updateDoc(promptRef, {
          [oppositeField]: promptData[oppositeField].filter(id => id !== userId)
        });
      }
    }
  
    setHasVoted(true);
    fetchPromptsAndVotes();
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
});



export default PromptScreen;