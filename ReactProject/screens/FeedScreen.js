import React, { useContext, useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator, Text, Image, FlatList, Modal } from "react-native";
import { Card, Button } from "tamagui";
import PromptContext from "../contexts/PromptContext";
import { getDocs, query, collectionGroup, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets, } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';


export default function FeedScreen() {
  const navigation = useNavigation();
  const prompt = useContext(PromptContext);
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState([]);
  const { isPromptAnswered } = useContext(PromptContext);
  const insets = useSafeAreaInsets();


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={require("../assets/profile-pic.jpg")} style={styles.avatar} />
        <Text style={styles.username}>{item.username}</Text>
      </View>
      <Text style={styles.prompt}>{item.prompt}</Text>
      <Text style={styles.response}>{item.response}</Text>
    </View>
  );

  return (
      <View style={styles.container}>
        {/* <BlurView style={styles.overlay} intensity={10}>
          <View style={styles.popup}>
          <Text>Insert Prompt Here</Text>
          <Button></Button>
          </View>
        </BlurView> */}
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : (
          <FlatList
            data={feedData}
            renderItem={renderItem}
            keyExtractor={item => item.id}
          />
        )}
      </View>
  );  
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#F0F2F5",
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
      marginHorizontal: 100,
      marginVertical: 200,
      backgroundColor: "grey",
    }
});
