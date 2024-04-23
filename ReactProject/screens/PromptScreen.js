import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from "react-native";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, onSnapshot, increment } from "firebase/firestore";
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import PromptContext from "../contexts/PromptContext";
import moment from 'moment';

const PromptScreen = ({ navigation }) => {

  const getNextFridayNoon = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7; // Number of days until next Friday
    const nextFriday = new Date(today.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
    nextFriday.setHours(12, 0, 0, 0); // Set time to noon
    return nextFriday;
  };
  
  const calculateCountdown = () => {
    const nextFridayNoon = getNextFridayNoon();
    const now = new Date();
    const difference = nextFridayNoon - now;
  
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };
  
  const [prompts, setPrompts] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [prompt, setPrompt, isPromptAnswered, setIsPromptAnswered] = useContext(PromptContext);
  const [newPotentialPrompt, setNewPotentialPrompt] = useState("");
  const [sortBy, setSortBy] = useState(""); // State to track sorting method
  const [showComments, setShowComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [countdown, setCountdown] = useState(calculateCountdown());



  useEffect(() => {
    fetchPromptsAndVotes();
  }, []);
  

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateCountdown());
    }, 1000);
  
    return () => clearInterval(interval);
  }, []);

  const fetchPromptsAndVotes = async () => {
    const promptsRef = collection(db, "potentialPrompts");
    const unsubscribe = onSnapshot(promptsRef, (snapshot) => {
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
    });
  
    return unsubscribe; 
  };
  


  const toggleCommentsVisibility = async (promptId, postUserId) => {
    setShowComments(prev => ({ ...prev, [promptId]: !prev[promptId] }));
  
    if (!showComments[promptId]) {
      await fetchCommentsForEssence(promptId,postUserId);
    }
  };
  
  
  

  
  
  const fetchCommentsForEssence = async (promptId, postUserId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error("User is not authenticated.");
        return;
      }
  
      const promptIndex = prompts.findIndex((prompt) => prompt.id === promptId);
  
      if (promptIndex === -1) {
        console.error("Prompt not found.");
        return;
      }
  
      const commentsSnapshot = await getDocs(collection(db, `potentialPrompts/${promptId}/comments`));
      const commentsList = [];
      for (const docSnapshot of commentsSnapshot.docs) {
        const commentData = docSnapshot.data();
        const userDocRef = doc(db, "users", commentData.userId);
        const userSnapshot = await getDoc(userDocRef);
        const username = userSnapshot.exists() ? userSnapshot.data().username : "Unknown";
        commentsList.push({ ...commentData, username });
      }
      setComments(prev => ({ ...prev, [promptId]: commentsList }));
    } catch (error) {
      console.error("Error fetching comments: ", error);
    }
  };
  
  
  
  
  const handlePostComment = async (promptId, postUserId) => {
    const userId = auth.currentUser?.uid;
    const newCommentText = commentText[promptId] || '';
  
    if (newCommentText.trim() && userId) {
      try {
        await addDoc(collection(db, `potentialPrompts/${promptId}/comments`), {
          userId,
          text: newCommentText,
          createdAt: new Date(),
        });
  
        console.log("Comment added");
        fetchCommentsForEssence(promptId);
        setCommentText(prevState => ({ ...prevState, [promptId]: '' }));
  
        fetchCommentsForEssence(promptId, postUserId);
      } catch (error) {
        console.error("Error adding comment: ", error);
        alert("Failed to post comment. Please try again.");
      }
    } else {
      alert("Comment cannot be empty.");
    }
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
  
    const upvotes = updatedPrompt.upvotes || [];
    const downvotes = updatedPrompt.downvotes || [];
  
    const hasVoted = upvotes.includes(userId) || downvotes.includes(userId);
  
    if (hasVoted) {
      updatedPrompt[voteField] = updatedPrompt[voteField].includes(userId)
        ? updatedPrompt[voteField].filter((id) => id !== userId)
        : [...updatedPrompt[voteField], userId];
  
      if (updatedPrompt[oppositeField].includes(userId)) {
        updatedPrompt[oppositeField] = updatedPrompt[oppositeField].filter((id) => id !== userId);
      }
    } else {
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
  
  useEffect(() => {
    fetchPromptsAndVotes();
  }, []);
  
  
  
  
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
      comments:[],
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
    } else if (sortBy === "downvotes") {
      sortedPrompts.sort((a, b) => b.downvotes.length - a.downvotes.length);
    }
    setPrompts(sortedPrompts);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.countdownText}> Time until next prompt:</Text>
      <Text style={styles.countdown}> {countdown}</Text>
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
                    autoCorrect={false} 

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
            sortPrompts("downvotes");
            setSortBy("downvotes");
          }}
        >
          <Text style={[styles.sortButtonText, {color: '#3B82F6'}]}>Sort by Downvotes</Text>
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
    <View style={styles.bottomContainer}>
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
      <TouchableOpacity onPress={() => toggleCommentsVisibility(prompt.id, auth.currentUser?.uid)} style={styles.commentButton}>
        <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
      </TouchableOpacity>
    </View>
    {showComments[prompt.id] && (
      <View style={styles.commentsSection}>
  <View style={styles.commentInputContainer}>
    <TextInput
                    autoCorrect={false} 

      style={styles.commentInput}
      value={commentText[prompt.id] || ''}
      onChangeText={(text) => setCommentText(prev => ({ ...prev, [prompt.id]: text }))}
      placeholder="Write a comment..."
    />
    <TouchableOpacity onPress={() => handlePostComment(prompt.id, auth.currentUser?.uid)} style={styles.postCommentButton}>
      <Text style={styles.postCommentButtonText}>Post</Text>
    </TouchableOpacity>
  </View>
  {comments[prompt.id] && comments[prompt.id].map((comment, index) => (
    <View key={index} style={styles.comment}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentUsername}>{comment.username}</Text>
        <Text style={styles.timestamp}>{moment(comment.createdAt.toDate()).fromNow()}</Text> 
      </View>
      <Text style={styles.commentText}>{comment.text}</Text>
    </View>
  ))}
</View>

    )}
  </View>
))}


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#e6e6e6",
    padding: 25,
  },
  promptContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,

  },
  promptText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "bold",
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voteContainer: {
    width: 50,
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
    backgroundColor: "#d1d1d1",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  addButtonLabel: {
    color: "grey",
    fontWeight: "bold",
  },
  sortButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    marginBottom: 15
  },
  sortButton: {
    flex: 0.3, // Reduce the flex value to make buttons slimmer
    marginHorizontal: 5, // Add some horizontal margin between buttons
    paddingVertical: 10, // Increase vertical padding for better touch target
    alignItems: "center",
    justifyContent: "center", // Vertically center the content
    backgroundColor: "#FFF",
    borderRadius: 5,
  },
  sortButtonText: {
    fontWeight: "bold",
    color: "grey",
    textAlign: "center", // Center text horizontally
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

  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    marginRight: 10,
  },
  postCommentButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 5,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCommentButtonText: {
    color: 'white',
  },
  commentsSection: {
    marginTop: 10,
    flexDirection: 'column', 
    
  },
  comment: {
    marginTop: 5,
    padding: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
  },
  commentUsername: {
    fontWeight: 'bold',
    color: '#3B82F6', 
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentUsername: {
    fontWeight: 'bold',
    color: '#3B82F6',
    fontSize: 14,
  },
  timestamp: {
    color: '#999',    
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  countdown: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#3B82F6', // Adjust the color to your preference
  },
  countdownText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 5,
  },
  
  
});

export default PromptScreen;
