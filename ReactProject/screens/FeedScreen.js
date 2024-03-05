import React, { useContext, useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator, Text, Image, FlatList, Modal, TextInput, TouchableOpacity, } from "react-native";
import { Card, Button } from "tamagui";
import PromptContext from "../contexts/PromptContext";
import { getDocs, addDoc, query, collectionGroup, where, doc, getDoc, collection } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets, } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';


export default function FeedScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState([]);
  const [userResponse, setUserResponse] = useState(null);
  const [prompt, setPrompt, isPromptAnswered, setIsPromptAnswered] = useContext(PromptContext); // Destructuring context values
  const [newEssence, setNewEssence] = useState("");
  const insets = useSafeAreaInsets();


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!prompt) {
          // If prompt is undefined, do not execute the query
          setLoading(false);
          return;
        }

        const essencesRef = collectionGroup(db, "essences");
        const q = query(essencesRef, where("prompt", "==", prompt));
        const querySnapshot = await getDocs(q);
  
        const essencesDataPromises = querySnapshot.docs.map(async (essenceDoc) => {
          const essenceData = essenceDoc.data();
          
          let username = "USER"; // Default username
          if (essenceData.userId) {
            const userDocRef = doc(db, "users", essenceData.userId);
            const userDoc = await getDoc(userDocRef);
            username = userDoc.exists() ? userDoc.data().username || "USER" : "Unknown User";
          }
          return {
            id: essenceDoc.id,
            ...essenceData,
            username,
          };
        });
  
        const essencesWithData = await Promise.all(essencesDataPromises);
        setFeedData(essencesWithData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [prompt]);

  useEffect(() => { // Set navigation options in this useEffect
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.buttonWrapper}>
          <Button onPress={() => navigation.navigate('Follow')}>
            Search Users
          </Button>
        </View>
      ),
    });
  }, [navigation]);

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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={require("../assets/profile-pic.jpg")} style={styles.avatar} />
        <Text style={styles.username}>{item.username}</Text>
      </View>
      {/* <Text style={styles.prompt}>{item.prompt}</Text> */}
      <Text style={styles.response}>{item.response}</Text>
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
  safeContainer: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#87CEEB",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
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
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,

  }
});
