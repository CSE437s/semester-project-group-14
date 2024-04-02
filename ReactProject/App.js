import React, { useState, useEffect, createContext } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
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

    const interval = setInterval(() => {
        getTopVotedPrompt();
    },  600);

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
                {/* User is signed in, show the main app with FooterNavigator and other screens */}
                <Stack.Screen name="Main" component={FooterNavigator} options={{ headerShown: false }} />
                <Stack.Screen name="Follow" component={FollowScreen} />
                <Stack.Screen name="Followers" component={FollowersScreen} />
                <Stack.Screen name="Following" component={FollowingScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                {/* would put screens that user is required to be logged in to see here */}
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