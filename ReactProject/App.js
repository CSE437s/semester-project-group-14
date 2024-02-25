import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import "@tamagui/core/reset.css";
import { TamaguiProvider } from "tamagui";
import tamaguiConfig from "./tamagui.config";
import FooterNavigator from "./Components/FooterNavigator";
import LoginScreen from "./screens/LoginScreen";
import { auth } from "./firebaseConfig";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  return (
    <TamaguiProvider config={tamaguiConfig}>
      <NavigationContainer>
        {user ? <FooterNavigator /> : <LoginScreen />}
      </NavigationContainer>
    </TamaguiProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
