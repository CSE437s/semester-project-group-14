import React, { useContext, useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator, Text, Image, FlatList, Modal, TextInput, TouchableOpacity, } from "react-native";
import { Card, Button } from "tamagui";
import PromptContext from "../contexts/PromptContext";
import { getDocs, deleteDoc, addDoc, query, collectionGroup, where, doc, getDoc, collection,onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets, } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Ionicons from 'react-native-vector-icons/Ionicons';



export default function FeedScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [userResponse, setUserResponse] = useState(null);
  const [prompt, setPrompt, isPromptAnswered, setIsPromptAnswered] = useContext(PromptContext); // Destructuring context values
  const [newEssence, setNewEssence] = useState("");
  const [showComments, setShowComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [comments, setComments] = useState({});

  

  const insets = useSafeAreaInsets();
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!prompt) {
          setLoading(false);
          return;
        }
    
        const currentUserId = auth.currentUser?.uid;
    
        const followingRef = collection(db, "users", currentUserId, "following");
        const unsubscribeFollowing = onSnapshot(followingRef, async (snapshot) => {
          const followingIds = snapshot.docs.map(doc => doc.id);
    
          const essencesRef = collectionGroup(db, "essences");
          const q = query(essencesRef, where("prompt", "==", prompt));
          const unsubscribeEssences = onSnapshot(q, async (querySnapshot) => {
            const essencesDataPromises = querySnapshot.docs.map(async (essenceDoc) => {
              const essenceData = essenceDoc.data();
              const likesQuerySnapshot = await getDocs(collection(db, `users/${essenceData.userId}/essences/${essenceDoc.id}/likes`));
              const numLikes = likesQuerySnapshot.size;
              const likesRef = collection(db, `users/${essenceData.userId}/essences/${essenceDoc.id}/likes`);
              const querySnapshot = await getDocs(
                query(likesRef, where("userId", "==", currentUserId))
              );
    
              const liked = !querySnapshot.empty;
    
              let username = "USER"; // Default username
              let profilePicUrl = ""; 
              if (essenceData.userId) {
                const userDocRef = doc(db, "users", essenceData.userId);
                const userDocSnapshot = await getDoc(userDocRef);
                if (userDocSnapshot.exists()) {
                  const userData = userDocSnapshot.data();
                  username = userData.username || "USER";
                  profilePicUrl = userData.profilePicUrl || ""; 
                }
              }
    
              if (followingIds.includes(essenceData.userId)) {
                return {
                  id: essenceDoc.id,
                  ...essenceData,
                  username,
                  numLikes,
                  liked,
                  profilePicUrl, 
                };
              } else {
                return null;
              }
            });
    
            const essencesWithData = await Promise.all(essencesDataPromises);
            const filteredEssences = essencesWithData.filter(essence => essence !== null);
            setFeedData(filteredEssences);
          });
    
          return () => {
            unsubscribeEssences();
          };
        });
    
        return () => {
          unsubscribeFollowing();
        };
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
  
    fetchData();
  }, [prompt]);


  //FOR PROMPT HANDLING
  useEffect(() => {
    const fetchPromptAndCheckResponse = async () => {
      const checkResponse = async () => {
        const userId = auth.currentUser?.uid;
        const essencesRef = collection(db, `users/${userId}/essences`);
        const querySnapshot = await getDocs(
          query(essencesRef, where("prompt", "==", prompt))
        );
        if (!querySnapshot.empty) {
          setUserResponse(querySnapshot.docs[0].data().response);
          setIsPromptAnswered(true);
        } else {
          setIsPromptAnswered(false);
          setUserResponse(null); // Reset user response if they haven't responded
        }
      };
      checkResponse();
    };
    fetchPromptAndCheckResponse();
  }, [prompt]);


  
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
      userId: userId,
    };

    addDoc(collection(db, `users/${userId}/essences`), essenceData)
      .then(() => {
        setNewEssence("");
        setUserResponse(newEssence); // Update userResponse state with the new response
        setIsPromptAnswered(true);
      })
      .catch((error) => {
        console.error("Error adding essence: ", error);
        alert("An error occurred while adding essence. Please try again.");
      });
      
  };

  const handleLike = async (essenceId, postUserId) => {
    const userId = auth.currentUser?.uid;
    const likesRef = collection(db, `users/${postUserId}/essences/${essenceId}/likes`);
    const querySnapshot = await getDocs(
      query(likesRef, where("userId", "==", userId))
    );
  
    if (!querySnapshot.empty) {
      querySnapshot.forEach(async (doc) => {
        try {
          await deleteDoc(doc.ref);
          console.log("removed like");
        } catch (error) {
          console.error("Error removing like: ", error);
          alert("An error occurred while removing like. Please try again.");
        }
      });
    } else {
      const likeData = {
        userId: userId,
        likedAt: new Date(),
      };
  
      try {
        await addDoc(likesRef, likeData);
        console.log("added like");
      } catch (error) {
        console.error("Error adding like: ", error);
        alert("An error occurred while adding like. Please try again.");
      }
    }
  
    const updatedFeedData = feedData.map(essence => {
      if (essence.id === essenceId) {
        return {
          ...essence,
          liked: !essence.liked, 
          numLikes: essence.liked ? essence.numLikes - 1 : essence.numLikes + 1, 
        };
      }
      return essence;
    });
  
    setFeedData(updatedFeedData);
  };


  const toggleCommentsVisibility = (essenceId) => {
    setShowComments(prev => ({ ...prev, [essenceId]: !prev[essenceId] }));
  };
  
  

  const handlePostComment = async (essenceId, postUserId) => {
    const userId = auth.currentUser?.uid;
    const newCommentText = commentText[essenceId] || '';
  
    if (newCommentText.trim() && userId) {
      try {
        await addDoc(collection(db, `users/${postUserId}/essences/${essenceId}/comments`), {
          userId,
          text: newCommentText,
          createdAt: new Date(),
        });
  
        console.log("Comment added");
        fetchCommentsForEssence(essenceId);
        // Reset the comment input field
        setCommentText(prevState => ({ ...prevState, [essenceId]: '' }));
  
        // Refresh comments to show the newly added one
        fetchCommentsForEssence(essenceId, postUserId);
      } catch (error) {
        console.error("Error adding comment: ", error);
        alert("Failed to post comment. Please try again.");
      }
    } else {
      alert("Comment cannot be empty.");
    }
  };
  
  

  const fetchCommentsForEssence = async (essenceId, postUserId) => {
    try {
      const commentsSnapshot = await getDocs(collection(db, `users/${postUserId}/essences/${essenceId}/comments`));
      const commentsList = [];
      for (const docSnapshot of commentsSnapshot.docs) {
        const commentData = docSnapshot.data();
        // Ensure the 'doc' function is correctly imported and used here
        const userDocRef = doc(db, "users", commentData.userId);
        const userSnapshot = await getDoc(userDocRef);
        const username = userSnapshot.exists() ? userSnapshot.data().username : "Unknown";
        commentsList.push({ ...commentData, username }); // Include username in the comment data
      }
      setComments(prev => ({ ...prev, [essenceId]: commentsList }));
    } catch (error) {
      console.error("Error fetching comments: ", error);
    }
  };
  
  
  
  
  
  

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={item.profilePicUrl ? { uri: item.profilePicUrl } : require("./../assets/profile-pic.jpg")} style={styles.avatar} />
        <Text style={styles.username}>{item.username}</Text>
      </View>
      <Text style={styles.response}>{item.response}</Text>
      <View style={styles.interactionBar}>
        {/* Like button */}
        <TouchableOpacity onPress={() => handleLike(item.id, item.userId)} style={styles.likeButton}>
          <Ionicons name={item.liked ? 'heart' : 'heart-outline'} size={20} color={item.liked ? "#3B82F6" : "#3B82F6"} />
          <Text style={styles.likeCount}>{item.numLikes}</Text>
        </TouchableOpacity>
        
        {/* Comments button */}
        <TouchableOpacity onPress={() => toggleCommentsVisibility(item.id)} style={styles.commentButton}>
          <Ionicons name="chatbubble-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>
  
      {showComments[item.id] && (
        <View style={styles.commentsSection}>
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              value={commentText[item.id] || ''}
              onChangeText={(text) => setCommentText(prev => ({ ...prev, [item.id]: text }))}
              placeholder="Write a comment..."
            />
            <TouchableOpacity onPress={() => handlePostComment(item.id, item.userId)} style={styles.postCommentButton}>
              <Text style={styles.postCommentButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
          {comments[item.id] && comments[item.id].map((comment, index) => (
            <View key={index} style={styles.comment}>
              <Text style={styles.commentText}>{comment.username} {comment.text}</Text>
            </View>
          ))}
      </View>
      )}
    </View>
  );
  
  

  return (
    <View style={styles.container}>
      <View style={styles.displayContainer}>
        <Text style={styles.promptDisplay}>{prompt}</Text>
        <Text style={styles.responseDisplay}>{userResponse}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" />
      ) : (
        <FlatList
          data={feedData}
          renderItem={renderItem}
          keyExtractor={item => item.id}
        />
      )}
      {!isPromptAnswered && <BlurView style={styles.overlay} intensity={10}>
        <View style={styles.popup}>
        <Text styles={styles.popupPrompt}>{prompt}</Text>

        <TextInput
        autoCapitalize="none"
          style={styles.responseInput}
          value={newEssence}
          onChangeText={setNewEssence}
          placeholder="Your response"
        />

        <TouchableOpacity onPress={handleAddEssence} style={styles.popupButton}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
        </View>
      </BlurView>}
    </View>
  );  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#c0e0ed",
  },
  card: {
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
  prompt: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  response: {
    fontSize: 16,
    color: "#333",
  },
  buttonWrapper: {
    marginRight: 10,
  },
  modalBox: {
    backgroundColor: "green",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    backgroundColor: "purple",
    margin: 100,
  },
  overlay: {
    position: "absolute",
    borderRadius: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,    
  },
  popup: {
    marginHorizontal: 50,
    marginVertical: 200,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,

    borderRadius: 10,
    padding: 20,
  },
  popupButton: {
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
  popupPrompt: {
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
  displayContainer: {
    padding: 20,
    backgroundColor: "white",
    marginBottom: 10,
    borderRadius: 10,
  },
  promptDisplay: {
    fontSize: 18,
    marginBottom: 10,
  },
  responseDisplay: {
    padding: 10,
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
  },
  likeButton: {
    display: "flex",
    flexDirection: "row",
    paddingTop: 10,
  },
  likeCount: {
    color: "#3B82F6",
    marginLeft: 5,
  },
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsSection: {
    marginTop: 10,
  },
  commentInput: {
    flex: 1, // Take up all space but leave room for button
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
  },
  postCommentButton: {
    marginLeft: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  postCommentButtonText: {
    color: 'white',
  },
  comment: {
    marginTop: 5,
    padding: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  commentInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
