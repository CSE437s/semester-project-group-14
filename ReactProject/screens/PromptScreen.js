import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, doc, updateDoc, increment } from "firebase/firestore";

const PromptScreen = () => {
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [totalVotes, setTotalVotes] = useState(0);

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
          {/* Overlay to represent vote percentage */}
          {/* <View style={[styles.percentageOverlay, { width: `${Math.round((prompt.Votes || 0) / totalVotes * 100)}%` === '100' ? '100%' : `${Math.round((prompt.Votes || 0) / totalVotes * 100)}%` }]} /> */}
          <Text style={styles.promptText}>{prompt.Description}</Text>
          <Text style={styles.votePercentage}>
            {Math.round((prompt.Votes || 0) / totalVotes * 100)}%
          </Text>
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
    backgroundColor: '#FFFFFF', // Light background color for the bubble
    padding: 15, // Padding around the text and separator for spacing
    borderRadius: 10, // Rounded corners for the bubble
    shadowColor: "#000", // Shadow color for depth
    shadowOffset: {
      width: 0,
      height: 2, // Vertical offset for the shadow
    },
    shadowOpacity: 0.25, // Shadow opacity for a subtle effect
    shadowRadius: 3.84, // Blur radius of the shadow
    elevation: 5, // Elevation for Android to create shadow effect
    marginHorizontal: 10, // Horizontal margin to keep the bubble centered and within bounds
    marginBottom: 20, // Bottom margin to space out from content below
  },
  headerText: {
    fontSize: 18, // Text size for readability
    textAlign: 'center', // Center alignment for the text
    paddingHorizontal: 10, // Horizontal padding to ensure text does not touch the bubble edges
    paddingTop: 5, // Top padding for spacing above the text, adjust as needed
  },
  separatorLine: {
    height: 2, // Height of the separator line to keep it thin
    backgroundColor: '#DDD', // Grey color for the separator line
    alignSelf: 'stretch', // Stretch to the width of the container
    marginVertical: 10, // Vertical margin to create space above and below the line
    width: '95%', // Make the line width 80% of its container width
    alignSelf: 'center', // Center the line within its container
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
