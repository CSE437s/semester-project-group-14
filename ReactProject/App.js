import React, { useState, useEffect, createContext } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import "@tamagui/core/reset.css";
import { TamaguiProvider } from "tamagui";
import tamaguiConfig from "./tamagui.config";
import FooterNavigator from "./Components/FooterNavigator";
import LoginScreen from "./screens/LoginScreen";
import { db, auth } from "./firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const PromptContext = createContext();

export default function App() {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);
  useEffect(() => {
    const getRandomPrompt = async () => {
      const promptsRef = collection(db, "prompts");
      const promptSnapshot = await getDocs(promptsRef);
      const promptList = [];
      promptSnapshot.forEach((doc) => {
        promptList.push(doc.data().question);
      });
      const randomIndex = Math.floor(Math.random() * promptList.length);
      setPrompt(promptList[randomIndex]);
    };

    getRandomPrompt();

    const interval = setInterval(() => {
      getRandomPrompt();
    }, 604800000);

    return () => clearInterval(interval);
  }, []);

  return (
    <PromptContext.Provider value={prompt}>
      <TamaguiProvider config={tamaguiConfig}>
        <NavigationContainer>
          {user ? <FooterNavigator /> : <LoginScreen />}
        </NavigationContainer>
      </TamaguiProvider>
    </PromptContext.Provider>
  );
}
export { PromptContext };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
