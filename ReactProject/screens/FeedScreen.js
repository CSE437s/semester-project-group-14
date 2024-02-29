import React, { useContext, useState, useEffect } from "react";
import { Button, Card, H2, Paragraph, YStack } from "tamagui";
import PromptContext from "../contexts/PromptContext";
import { getDocs, query, collectionGroup, where, doc, getDoc } from "firebase/firestore";
import { StyleSheet, View, ActivityIndicator } from "react-native";
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
          
          if (essenceData.userId) {
            const userDocRef = doc(db, "users", essenceData.userId);
            const userDoc = await getDoc(userDocRef);
            const username = userDoc.exists() ? (userDoc.data().username || "USER") : "Unknown User";
            return {
              id: essenceDoc.id,
              ...essenceData,
              username, // add username to collected data
            };
          } else {
            return { // if no userid (old posts) default to USER
              id: essenceDoc.id,
              ...essenceData,
              username: "USER",
            };
          }
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

  useEffect(() => {
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

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" />
      ) : (
        <YStack
          $sm={{ flexDirection: "column" }}
          paddingHorizontal="$4"
          margin="$2"
          space
        >
          {feedData.map((data, index) => (
            <Card key={index} elevate size="$4" bordered>
              <Card.Header padded>
                <H2>{data.prompt}</H2>
                <Paragraph theme="alt2">{data.username}</Paragraph>
              </Card.Header>
              <Card.Footer padded>
                <Paragraph>User Response: {data.response}</Paragraph>
              </Card.Footer>
            </Card>
          ))}
        </YStack>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#87CEEB",
  },
  buttonWrapper: {
    paddingRight:10,
  }
});
