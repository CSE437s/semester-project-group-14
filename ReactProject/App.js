import { createStackNavigator } from "@react-navigation/stack";
import React, { useState, useEffect, createContext, useRef } from "react";
import { StyleSheet,Button, View,Text, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import "@tamagui/core/reset.css";
import { TamaguiProvider } from "tamagui";
import tamaguiConfig from "./tamagui.config";
import FooterNavigator from "./Components/FooterNavigator";
// import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import FollowScreen from "./screens/FollowScreen";
import FollowersScreen from "./screens/FollowersScreen";
import FollowingScreen from "./screens/FollowingScreen";
import { db, auth } from "./firebaseConfig";
import { collection,addDoc, deleteDoc,getDocs } from "firebase/firestore";
import PromptContext from "./contexts/PromptContext";
import ProfileScreen from "./screens/ProfileScreen";





// const PromptContext = createContext();
const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [isPromptAnswered, setIsPromptAnswered] = useState(false);
  const [countdown, setCountdown] = useState("");


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  
useEffect(() => {
    let isMounted = true;

    const getTopVotedPrompt = async () => {
      const promptsRef = collection(db, "potentialPrompts");
      const promptSnapshot = await getDocs(promptsRef);
  
      if (promptSnapshot.empty) {
        const promptsCollectionRef = collection(db, "prompts");
        const promptsSnapshot = await getDocs(promptsCollectionRef);
        if (!promptsSnapshot.empty) {
            setPrompt(promptsSnapshot.docs[0].data().question);
        } else {
            console.error("No prompts found in the database.");
        }
        return;
    }
  
      let topPrompt = null;
      let maxVotes = -Infinity;
  
      promptSnapshot.forEach((doc) => {
          const data = doc.data();
          const netVotes = data.upvotes - data.downvotes;
  
          if (netVotes > maxVotes) {
              maxVotes = netVotes;
              topPrompt = data.Description;
          }
      });
  
      if (isMounted && topPrompt) {
          setPrompt(topPrompt);
          promptSnapshot.forEach(async (doc) => {
              await deleteDoc(doc.ref);
          });
          const promptsCollectionRef = collection(db, "prompts");
          const promptsSnapshot = await getDocs(promptsCollectionRef);
  
          promptsSnapshot.forEach(async (doc) => {
              await deleteDoc(doc.ref);
          });
          console.log(topPrompt);
          await addDoc(collection(db, "prompts"), { question: topPrompt });
      }
  };
  

    getTopVotedPrompt();
    const calculateMillisecondsUntilFridayNoon = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
      const millisecondsUntilFriday = daysUntilFriday * 24 * 60 * 60 * 1000; 
      const fridayNoon = new Date(now.getTime() + millisecondsUntilFriday);
      fridayNoon.setHours(12, 0, 0, 0); 

      return fridayNoon.getTime() - now.getTime();
    };
    const updateCountdown = () => {
      const millisecondsUntilFridayNoon = calculateMillisecondsUntilFridayNoon();
      const days = Math.floor(millisecondsUntilFridayNoon / (1000 * 60 * 60 * 24));
      const hours = Math.floor((millisecondsUntilFridayNoon % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((millisecondsUntilFridayNoon % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((millisecondsUntilFridayNoon % (1000 * 60)) / 1000);
      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);

    };


    const interval = setInterval(() => {
      getTopVotedPrompt();
    }, calculateMillisecondsUntilFridayNoon());

    updateCountdown();
    return () => {
      isMounted = false;
      clearInterval(interval);
    };

}, []);


  

  return (
    <PromptContext.Provider value={ [prompt, setPrompt, isPromptAnswered, setIsPromptAnswered] }>
       <TamaguiProvider config={tamaguiConfig}>
         <NavigationContainer>
           <Stack.Navigator>
             {user ? (
              <>
                <Stack.Screen name="Main" component={FooterNavigator} options={{ headerShown: false }} />
              </>
            ) : (
              // No user is signed in, show the Login screen
              <>
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
              </>
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


