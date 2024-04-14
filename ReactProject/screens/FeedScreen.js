import React, { useContext, useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator, Text, Image, FlatList, Modal, TextInput, TouchableOpacity, } from "react-native";
import { Card, Button } from "tamagui";
import PromptContext from "../contexts/PromptContext";
import { getDocs, deleteDoc, addDoc, query, collectionGroup, where, doc, getDoc, collection,onSnapshot, ref, uploadBytes, getDownloadURL } from "firebase/firestore";
import { db, auth, storage } from "../firebaseConfig"; 
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets, } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Ionicons from 'react-native-vector-icons/Ionicons';
import moment from 'moment';
import * as ImagePicker from 'expo-image-picker';


export default function FeedScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [userResponse, setUserResponse] = useState(null);
  const [prompt, setPrompt, isPromptAnswered, setIsPromptAnswered] = useContext(PromptContext);
  const [newEssence, setNewEssence] = useState("");
  const [showComments, setShowComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [comments, setComments] = useState({});
  const [pickedImage, setPickedImage] = useState(null);


  

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
              const commentsQuerySnapshot = await getDocs(collection(db, `users/${essenceData.userId}/essences/${essenceDoc.id}/comments`));
              const numComments = commentsQuerySnapshot.size;
              const likesRef = collection(db, `users/${essenceData.userId}/essences/${essenceDoc.id}/likes`);
              const querySnapshot = await getDocs(
                query(likesRef, where("userId", "==", currentUserId))
              );
    
              const liked = !querySnapshot.empty;
    
              let username = "USER";
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
                  numComments,
                  liked,
                  profilePicUrl, 
                };
              } else {
                return null;
              }
            });
    
            const essencesWithData = await Promise.all(essencesDataPromises);
            const filteredEssences = essencesWithData.filter(essence => essence !== null);
    
            filteredEssences.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
    
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
          setUserResponse(null);
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
  
    let imageUri = ''; 
  
    if (pickedImage) {
      imageUri =pickedImage;
    }
  
    const userId = auth.currentUser?.uid;
    const essenceData = {
      prompt: prompt,
      response: newEssence,
      createdAt: new Date(),
      userId: userId,
      imageUri: imageUri,
    };
  
    addDoc(collection(db, `users/${userId}/essences`), essenceData)
      .then(() => {
        setNewEssence("");
        setUserResponse(newEssence); 
        setIsPromptAnswered(true);
      })
      .catch((error) => {
        console.error("Error adding essence: ", error);
        alert("An error occurred while adding essence. Please try again.");
      });
  };
  
  const handleImageSelection = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Denied',
          'Please enable permissions to access the camera roll to select a profile picture.'
        );
        return;
      }
  
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
  
      if (!pickerResult.cancelled) {
        const uri = pickerResult.assets[0].uri;
        setPickedImage(uri);
         
      
      }
    } catch (error) {
      console.error("Error selecting profile picture:", error);
    }

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


  const toggleCommentsVisibility = async (essenceId, postUserId) => {
    setShowComments(prev => ({ ...prev, [essenceId]: !prev[essenceId] }));
  
    if (!showComments[essenceId]) {
      await fetchCommentsForEssence(essenceId, postUserId);
    }
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
        setCommentText(prevState => ({ ...prevState, [essenceId]: '' }));
  
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
        const userDocRef = doc(db, "users", commentData.userId);
        const userSnapshot = await getDoc(userDocRef);
        const username = userSnapshot.exists() ? userSnapshot.data().username : "Unknown";
        commentsList.push({ ...commentData, username });
      }
      setComments(prev => ({ ...prev, [essenceId]: commentsList }));
    } catch (error) {
      console.error("Error fetching comments: ", error);
    }
  };
  
  
  const renderItem = ({ item }) => {
    const timeAgo = moment(item.createdAt.toDate()).fromNow();
    console.log("Image URI:", item.imageUri); 
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: item.userId })} style={styles.cardHeader}>
            <Image source={item.profilePicUrl ? { uri: item.profilePicUrl } : require("./../assets/profile-pic.jpg")} style={styles.avatar} />
            <Text style={styles.username}>{item.username}</Text>
          </TouchableOpacity>
          <View style={styles.timestampContainer}>
            <Text style={styles.timestamp}>{timeAgo}</Text> 
          </View>
        </View>
        
        {item.imageUri && 
        <Image  style={styles.essenceImage} source={{ uri: item.imageUri }}></Image>
      }

        <Text style={styles.response}>{item.response}</Text>
        <View style={styles.interactionBar}>
          <TouchableOpacity onPress={() => handleLike(item.id, item.userId)} style={styles.likeButton}>
            <Ionicons name={item.liked ? 'heart' : 'heart-outline'} size={20} color={item.liked ? "#3B82F6" : "#3B82F6"} />
            <Text style={styles.likeCount}>{item.numLikes}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleCommentsVisibility(item.id, item.userId)} style={styles.commentButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
            <Text style={styles.likeCount}>{item.numComments}</Text>
          </TouchableOpacity>
        </View>
        {showComments[item.id] && (
          <View style={styles.commentsSection}>
            <View style={styles.commentInputContainer}>
              <TextInput
                autoCorrect={false} 
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
                <View style={styles.timestampContainer}>
                <Text style={styles.commentUsername}>{comment.username}</Text>
                 <Text style={styles.timestamp}>{moment(comment.createdAt.toDate()).fromNow()}</Text> 
              </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };
  

  
  
  
  

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
    autoCorrect={false} 
    autoCapitalize="none"
    style={styles.responseInput}
    value={newEssence}
    onChangeText={setNewEssence}
    placeholder="Your response"
  />

  <TouchableOpacity onPress={handleImageSelection} style={styles.popupButton}>
    <Ionicons name="image" size={24} color="white" />
  </TouchableOpacity>

  <TouchableOpacity onPress={handleAddEssence} style={styles.popupButton}>
    <Text style={styles.buttonText}>Add Essence</Text>
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
    textAlignVertical:'center',
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  essenceImage: {
    width: 80,
    height: 80,
    alignSelf: 'center', 
    marginBottom: 10, 
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
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
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
  timestampContainer: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',

    
  },
  timestamp: {
    color: '#999',
    marginLeft: 'auto',

  },

  
});
