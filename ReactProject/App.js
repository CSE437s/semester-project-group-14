import React, { useState, useEffect, createContext } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import "@tamagui/core/reset.css";
import { TamaguiProvider } from "tamagui";
import tamaguiConfig from "./tamagui.config";
import FooterNavigator from "./Components/FooterNavigator";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import FollowScreen from "./screens/FollowScreen";
import FollowersScreen from "./screens/FollowersScreen";
import FollowingScreen from "./screens/FollowingScreen";
import { db, auth } from "./firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import PromptContext from "./contexts/PromptContext";


// const PromptContext = createContext();
const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [isPromptAnswered, setIsPromptAnswered] = useState(false);

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
    <PromptContext.Provider value={ [prompt, setPrompt, isPromptAnswered, setIsPromptAnswered] }>
      <TamaguiProvider config={tamaguiConfig}>
        <NavigationContainer>
          <Stack.Navigator>
            {user ? (
              <>
                {/* User is signed in, show the main app with FooterNavigator and other screens */}
                <Stack.Screen name="Main" component={FooterNavigator} options={{ headerShown: false }} />
                <Stack.Screen name="Follow" component={FollowScreen} />
                <Stack.Screen name="Followers" component={FollowersScreen} />
                <Stack.Screen name="Following" component={FollowingScreen} />
                {/* would put screens that user is required to be logged in to see here */}
              </>
            ) : (
              // No user is signed in, show the Login screen
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </TamaguiProvider>
    </PromptContext.Provider>
  );
}
// export { PromptContext };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
