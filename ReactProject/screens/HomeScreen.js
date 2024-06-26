import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  TextInput
} from "react-native";
import { useNavigation } from "@react-navigation/core";
import { useFocusEffect } from "@react-navigation/native";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  onSnapshot,
  query,
  setDoc,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { fetchFollowerCount, fetchFollowingCount } from "../services/UserService";
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons";
import { Card } from 'react-native-paper';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [essencesData, setEssencesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState(null); 
  const [bio, setBio] = useState(''); 
  const [bioEditMode, setBioEditMode] = useState(false);
  const [selectedPost, setSelectedEssence] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  

  // Function to open the modal and set the selected essence
  const openModal = (item) => {
    setSelectedEssence(item);
    setModalVisible(true);
  };

  // Function to close the modal and clear the selected essence
  const closeModal = () => {
    setSelectedEssence(null);
    setModalVisible(false);
  };

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    const q = query(
      collection(db, `users/${userId}/essences`),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const essences = [];
      for (const doc of snapshot.docs) {
        const essenceData = doc.data();
        const likesQuerySnapshot = await getDocs(collection(db, `users/${userId}/essences/${doc.id}/likes`));
        const commentsQuerySnapshot = await getDocs(collection(db, `users/${userId}/essences/${doc.id}/comments`));
        const likes = likesQuerySnapshot.docs.map(likeDoc => likeDoc.data());
        const comments = commentsQuerySnapshot.docs.map(commentDoc => commentDoc.data());
        essences.push({ id: doc.id, ...essenceData, likes, comments });
      }
      setEssencesData(essences);
      setLoading(false);
    });
  
    return () => unsubscribe();
  }, []);
  

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
  
    const fetchCounts = async () => {
      const followers = await fetchFollowerCount(userId);
      const following = await fetchFollowingCount(userId);
      setFollowerCount(followers);
      setFollowingCount(following);
    };
  
    fetchCounts();
  }, [auth.currentUser]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchFollowingCountOnFocus = async () => {
        const currentUserId = auth.currentUser?.uid;
        if (currentUserId) {
          const updatedFollowingCount = await fetchFollowingCount(currentUserId);
          setFollowingCount(updatedFollowingCount);
        }
      };
  
      fetchFollowingCountOnFocus();
    }, [])
  );

  useEffect(() => {
    const fetchUsername = async () => {
      const currentUserId = auth.currentUser?.uid;
      if (currentUserId) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUserId));
          if (userDoc.exists()) {
            setUsername(userDoc.data().username);
          }
        } catch (error) {
          console.error("Error getting username:", error);
        }
      }
    };
  
    fetchUsername();
  }, []);

  const handleSignOut = () => {
    auth
      .signOut()
      .then(() => {
        navigation.navigate("Login");
      })
      .catch((error) => alert(error.message));
  };
  
  const EssenceItem = ({ item,prompt, response, imageUri, likes, comments, onPress }) => {
    console.log("item:", item);

    console.log("Likes:", likes);
    console.log("Comments:", comments);
  
    return (
      <TouchableOpacity style={styles.essenceItem} onPress={() => onPress(item)}>
        <Text style={styles.essenceTitle}>{prompt}</Text>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.essenceImage} />}
        <Text style={styles.essenceResponse}>{response}</Text>
        <View style={styles.iconContainer}>
          <View style={styles.iconItem}>
            <Ionicons name="heart-outline" size={20} color="grey" />
            <Text style={styles.iconText}>{likes ? likes.length : 0}</Text>
          </View>
          <View style={styles.iconItem}>
            <Ionicons name="chatbubble-outline" size={20} color="grey" />
            <Text style={styles.iconText}>{comments ? comments.length : 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  
  const navigateToPromptScreen = () => {
    navigation.navigate("Prompt");
  };

  useEffect(() => {
    const fetchProfilePic = async () => {
      const currentUserId = auth.currentUser?.uid;
      if (currentUserId) {
        try {
          const userDocRef = doc(db, "users", currentUserId);
          const userDocSnapshot = await getDoc(userDocRef);
  
          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            if (userData && userData.profilePicUrl) {
              setProfilePic(userData.profilePicUrl);
            } else {
              console.log("Profile picture not found for current user");
            }
            if (userData && userData.bio) { 
              setBio(userData.bio);
            }
          } else {
            console.error("User document does not exist for current user");
          }
        } catch (error) {
          console.error("Error getting profile picture:", error);
        }
      } else {
        console.error("Current user ID is not available");
      }
    };
  
    fetchProfilePic();
  }, []);

  const updateBio = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (currentUserId && bio.trim() !== '') { // Check if bio is not empty
      try {
        const userDocRef = doc(db, "users", currentUserId);
        await updateDoc(userDocRef, { bio });
      } catch (error) {
        console.error("Error updating bio:", error);
      }
    } else {
      console.log("Bio is empty or invalid");
    }
  };
  
  
  const handleProfilePictureSelect = async () => {
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

      if (pickerResult.canceled) {
        // Handle the case when the user cancels the operation
        console.log('User canceled profile picture selection.');
        return;
      }  
  
      if (!pickerResult.cancelled) {
        const uri = pickerResult.assets[0].uri;

        const currentUserId = auth.currentUser?.uid;
        
        if (currentUserId) {
          try {
            const userDocRef = doc(db, "users", currentUserId);
            await updateDoc(userDocRef, { profilePicUrl: uri });
            setProfilePic(uri);
          } catch (error) {
            console.error("Error updating profile picture URL:", error);
          }
        } else {
          console.error("Current user ID is not available");
        }
      }
    } catch (error) {
      console.error("Error selecting profile picture:", error);
    }
  };

  
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleProfilePictureSelect}>
            <Image source={profilePic ? { uri: profilePic } : require("./../assets/profile-pic.jpg")} style={styles.profilePicture} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.userInfo} onPress={() => setBioEditMode(true)}>
            <Text style={styles.greeting}>Welcome, {username || auth.currentUser?.email}</Text>
            <View style={styles.bioContainer}>
              {bioEditMode ? (
                <View style={styles.bioEditContainer}>
                  <TextInput
                    style={styles.userBioInput}
                    value={bio}
                    onChangeText={setBio}
                    autoFocus={true}
                    multiline={true}
                    placeholder="Write your bio..."
                  />
                  <TouchableOpacity style={styles.saveBioButton} onPress={() => { setBioEditMode(false); updateBio(); }}>
                    <Text style={styles.saveBioButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1, maxWidth: '80%' }}> 
                    <Text style={styles.userBio}>{bio || "Write a bio..."}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setBioEditMode(true)}>
                    <Ionicons name="pencil-outline" size={20} color="#3B82F6" style={{ marginLeft: 10 }} /> 
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
    
        <View style={styles.statsContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Followers', {userId: auth.currentUser?.uid})} style={styles.statsBox}>
            <Text style={styles.statsCount}>{followerCount}</Text>
            <Text style={styles.statsLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Following', {userId: auth.currentUser?.uid})} style={styles.statsBox}>
            <Text style={styles.statsCount}>{followingCount}</Text>
            <Text style={styles.statsLabel}>Following</Text>
          </TouchableOpacity>
        </View>
  
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
    
        <View style={styles.separator}></View>
    
        {loading ? (
          <ActivityIndicator
            style={{ marginTop: 20 }}
            size="large"
            color="#3B82F6"
          />
        ) : (
          <FlatList
            data={essencesData}
            renderItem={({ item }) => (
              <EssenceItem item={item} comments={item.comments} likes={item.likes} imageUri={item.imageUri} prompt={item.prompt} response={item.response} onPress={openModal} />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.essencesGrid}
          />
        )}
  
        <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPost && (
              <View style={styles.selectedPostCard}>
                <Text style={styles.selectedPostTitle}>{selectedPost.prompt}</Text>
                {selectedPost.imageUri && (
                  <Image source={{ uri: selectedPost.imageUri }} style={styles.selectedPostImage} />
                )}
                <Text style={styles.selectedPostResponse}>{selectedPost.response}</Text>
                <View style={styles.iconRow}>
                  <Ionicons name="heart-outline" size={20} color="grey" />
                  <Text style={styles.iconText}>{selectedPost.likes ? selectedPost.likes.length : 0}</Text>
                  <Ionicons name="chatbubble-outline" size={20} color="grey" />
                  <Text style={styles.iconText}>{selectedPost.comments ? selectedPost.comments.length : 0}</Text>
                </View>
                <View style={styles.commentsSection}>
                  <FlatList
                    data={selectedPost.comments}
                    keyExtractor={(item, index) => 'comment-' + index}
                    renderItem={({ item }) => (
                      <View style={styles.commentContainer}>
                        <Text style={styles.commentText}>{item.text}</Text>
                      </View>
                    )}
                    style={{
                      ...styles.commentsList,
                      height: selectedPost.comments.length * 40 // Assuming each comment's height is 40 pixels
                    }}
                  />
                </View>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name="close-circle-outline" size={32} color="black" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>





        
        {modalVisible && (
          <View style={styles.modalBackground} />
        )}
      </View>
    </View>
  );
  
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e6e6e6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  commentsSection: {
    width: '100%',
    backgroundColor: "#f8f8f8",
    marginTop: 10,
    borderRadius: 5,
    padding: 5,
    overflow: 'hidden' // Ensures nothing spills outside the container
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  separator: {
    height: 2,
    marginVertical: 20,
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  iconRow: {
    flexDirection: 'row',  // Ensures that the icons are laid out horizontally
    justifyContent: 'space-around',  // Distributes space around all child components evenly
    alignItems: 'center',  // Vertically centers the icons in the row
    marginTop: 0,
    width: '50%',  // Ensures the row takes the full width of its parent container
  },  
  greeting: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userBio: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    fontStyle: 'italic',
    textAlign: 'justify',
  },
  bioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promptButton: {
    backgroundColor: "#00008B",
    borderRadius: 20,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  promptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  essenceItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    margin: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  essenceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  essenceResponse: {
    fontSize: 14,
    color: "#666",
  },
  signOutButton: {
    backgroundColor: "#d1d1d1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 5,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2.5,
    width: 100,
    marginLeft: 105,
  },
  signOutButtonText: {
    color: 'grey',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statsBox: {
    alignItems: 'center',
    flex: 1,
  },
  statsCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statsLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  essenceImage: {
    width: 100,
    height: 100,
    marginVertical: 10,
    borderRadius: 10,
  },
  iconItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconText: {
    marginLeft: 0,
    color: "grey",
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
    width: 100,
  },
  modalContainer: {
    minWidth: '90%', // Ensuring a minimum width for the modal
    maxWidth: '90%', // Limiting the maximum width to maintain uniformity
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  
  closeButton: {
    alignSelf: 'flex-center',
    padding: 0,
  },
  selectedPostCard: {
    minWidth: '50%', // Ensures that the card stretches to the edges of the modalContainer
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedPostImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedPostTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  selectedPostResponse: {
    fontSize: 16,
    marginBottom: 10,
  },
  commentSection: {
    width: '100%',
    maxHeight: 200,
    // backgroundColor: "#f8f8f8",
    marginTop: 10,
    borderRadius: 5,
    padding: 5,
  },
  comments: {
    width: "100%",
  },
  commentText: {
    fontSize: 16,
    color: "#333",
  },
  commentContainer: {
    // backgroundColor: "#f2f2f2",
    borderRadius: 5,
    padding: 10,
    marginBottom: 5,
  },
  comment: {
    fontSize: 16,
    color: "#333",
  },
  commentsList: {
    width: '100%',
    height: 10, // Ensuring the comments section does not make the modal overly tall
    marginTop: 10,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
});


  
  export default HomeScreen;
