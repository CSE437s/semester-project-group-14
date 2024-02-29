import React, { useContext, useState, useEffect } from "react";
import { StyleSheet, View, ActivityIndicator, Text, Image, FlatList } from "react-native";
import { Card, Button } from "tamagui";
import PromptContext from "../contexts/PromptContext";
import { getDocs, query, collectionGroup, where, doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigation } from '@react-navigation/native';

export default function FeedScreen() {
  const navigation = useNavigation();
  const prompt = useContext(PromptContext);
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState([]);

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
  container: {
    flex: 1,
    backgroundColor: "#F0F2F5",
    padding: 10,
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
});
