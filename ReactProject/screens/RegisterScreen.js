import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/core";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { H1, H3 } from "tamagui";

const RegisterScreen = () => {
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // New state for username
  const navigation = useNavigation();

  const handleSignUp = async () => {
    createUserWithEmailAndPassword(auth, loginInput, password)
      .then(async (userCredentials) => {
        const user = userCredentials.user;
        console.log("Registered with:", user.email);

        // Set user data including the username
        await setDoc(doc(db, "users", user.uid), {
          email: loginInput,
          username: username, // Include username
        });
        navigation.navigate("Home");
      })
      .catch((error) => alert(error.message));
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View>
        <H1>Essence</H1>
        <H3>What makes you, you? </H3>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
                        autoCorrect={false} 

          autoCapitalize="none"
          placeholder="Email"
          value={loginInput}
          onChangeText={setLoginInput}
          style={styles.input}
        />
        <TextInput
                        autoCorrect={false} 

          placeholder="Username" 
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
                        autoCorrect={false} 

          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleSignUp} style={styles.button}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={[styles.button, styles.buttonOutline]}>
          <Text style={styles.buttonOutlineText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#e6e6e6",
  },
  inputContainer: {
    width: "80%",
    marginTop: 10,
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    borderRadius: 10,
    marginTop: 10, // Adjusted margin for consistency
    height: 50,
  },
  buttonContainer: {
    width: "60%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  button: {
    backgroundColor: "#0782F9",
    width: "100%",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10, // Adjusted margin for consistency
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonOutline: {
    backgroundColor: "white",
    marginTop: 10, // Adjusted margin for consistency
    borderColor: "#0782F9",
    borderWidth: 2,
  },
  buttonOutlineText: {
    color: "#0782F9",
    fontWeight: "700",
    fontSize: 16,
  },
});
