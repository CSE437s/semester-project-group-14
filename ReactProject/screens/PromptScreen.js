import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, doc, updateDoc, increment } from "firebase/firestore";

const PromptScreen = () => {
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false); // New state to track if the user has voted


  const fetchPromptsAndVotes = async () => {
    const promptsRef = collection(db, "potentialPrompts");
    const snapshot = await getDocs(promptsRef);
    let totalVotesTemp = 0;
    const fetchedPrompts = snapshot.docs.map(doc => {
      const promptData = { id: doc.id, ...doc.data() };
      totalVotesTemp += promptData.Votes || 0;
      return promptData;
    });
    setPrompts(fetchedPrompts);
    setTotalVotes(totalVotesTemp);
  };

  useEffect(() => {
    fetchPromptsAndVotes();
  }, []);

  const handleSelectPrompt = async (promptId) => {
    // Check if the prompt is already selected
    if (promptId !== selectedPrompt) {
      // Increment the new prompt's Votes
      const newPromptRef = doc(db, "potentialPrompts", promptId);
      await updateDoc(newPromptRef, { Votes: increment(1) });

      // Decrement the old prompt's Votes if there was a previously selected prompt
      if (selectedPrompt) {
        const oldPromptRef = doc(db, "potentialPrompts", selectedPrompt);
        await updateDoc(oldPromptRef, { Votes: increment(-1) });
      }

      setSelectedPrompt(promptId); // Update selected prompt
      setHasVoted(true); // Update the hasVoted state to true after voting
      fetchPromptsAndVotes(); // Refresh data after voting
    }
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
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
});



export default PromptScreen;
