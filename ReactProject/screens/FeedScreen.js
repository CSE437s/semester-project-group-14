import React, { useContext, useState, useEffect } from "react";
import { Button, Card, H2, Image, Paragraph, XStack, YStack } from "tamagui";
import { PromptContext } from "../App";
import { getDocs, query, collectionGroup, where } from "firebase/firestore";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { db, auth } from "../firebaseConfig";

export default function FeedScreen() {
  const prompt = useContext(PromptContext);
  const [loading, setLoading] = useState(true);
  const [feedData, setFeedData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const essencesRef = collectionGroup(db, "essences");
        const querySnapshot = await getDocs(
          query(essencesRef, where("prompt", "==", prompt))
        );

        const essencesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Essences Data:", essencesData);
        setFeedData(essencesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();

    return () => {};
  }, [prompt]);

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
                <Paragraph theme="alt2">User: {data.userId}</Paragraph>
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
});
