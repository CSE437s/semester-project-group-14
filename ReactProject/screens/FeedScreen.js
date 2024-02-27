import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Card, H2, Image, Paragraph, XStack, YStack } from "tamagui";

export default function FeedScreen() {
  // Dummy data
  const questions = [
    {
      prompt: "What is your favorite song recently?",
      response: "Cudi Zone",
      user: "Alice",
    },
    {
      prompt: "What is your favorite song recently?",
      response: "Hotel California",
      user: "Bob",
    },
  ];

  return (
    <View>
      <YStack
        $sm={{ flexDirection: "column" }}
        paddingHorizontal="$4"
        margin="$2"
        space
      >
        {questions.map((question, index) => (
          <Card key={index} elevate size="$4" bordered>
            <Card.Header padded style={styles.header}>
              <H2>{question.prompt}</H2>
              <Paragraph theme="alt2">{question.user}</Paragraph>
            </Card.Header>
            <Card.Footer padded style={styles.footer}>
              <Paragraph>{question.response}</Paragraph>
            </Card.Footer>
            {/* You can add the user image in the Card.Background if needed */}
          </Card>
        ))}
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 18,
  }
});