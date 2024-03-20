import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import React, { useState, useEffect } from "react";
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

const LoginScreen = () => {
  const [loginInput, setLoginInput] = useState(""); // Use for both email/username on login
  const [password, setPassword] = useState("");
  const navigation = useNavigation();

  // useEffect(() => {
  //   const unsubscribe = auth.onAuthStateChanged((user) => {
  //     if (user) {
  //       navigation.navigate("Home");
  //     }
  //   });

  //   return unsubscribe;
  // }, []);

    //check for username unique
    const checkUsernameUnique = async (username) => {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username)); //check where equal
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty; //this would only be true if username was alr taken
    }

    const handleLogin = async () => {
      let email = loginInput;
      if (!loginInput.includes('@')) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", loginInput));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          alert('Username not found.');
          return;
        }
        const userData = querySnapshot.docs[0].data();
        email = userData.email;
      }
  
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredentials) => {
          const user = userCredentials.user;
          console.log("Logged in with:", user.email);
          navigation.navigate("Home");
        })
        .catch((error) => alert(error.message));
    };

  const handleForgotPassword = () => {
    let email = loginInput;
    if (email) { //if email not empty
      sendPasswordResetEmail(auth, loginInput)
        .then(() => {
          alert('Password reset link sent! Check your email.');
        })
        .catch((error) => {
          alert(error.message);
        });
    } else { //if empty put something in to reset
      alert('Please enter your email address.');
    }
  };




  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View>
        <H1>Essence</H1>
        <H3>What makes you, you? </H3>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
        autoCapitalize="none"
          placeholder="Email or Username"
          value={loginInput}
          onChangeText={setLoginInput}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleLogin} style={styles.button}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={[styles.button, styles.buttonOutline]}>
          <Text style={styles.buttonOutlineText}>Go to Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordButton}>
          <Text style={styles.forgotPasswordButtonText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#87CEEB",
  },

  inputContainer: {
    width: "80%",
    marginTop: 10,
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 5,
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
  },
  buttonOutline: {
    backgroundColor: "white",
    marginTop: 5,
    borderColor: "#0782F9",
    borderWidth: 2,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonOutlineText: {
    color: "#0782F9",
    fontWeight: "700",
    fontSize: 16,
  },
  forgotPasswordButton: {
    marginTop: 15, 
  },
  forgotPasswordButtonText: {
    color: "#0782F9", 
    textDecorationLine: 'underline',
  }
});
