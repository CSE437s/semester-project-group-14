import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import {getFirestore} from "firebase/firestore";

import AsyncStorage from '@react-native-async-storage/async-storage';

// Optionally import other Firebase services that you want to use
// import { ... } from "firebase/database";
// import { ... } from "firebase/firestore";
// import { ... } from "firebase/functions";
// import { ... } from "firebase/storage";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD_tce6u2hQDPKmqR2krMP7acbQ9X4M29Y",
  authDomain: "project-3ca92.firebaseapp.com",
  projectId: "project-3ca92",
  storageBucket: "project-3ca92.appspot.com",
  messagingSenderId: "613022982323",
  appId: "1:613022982323:web:3a47a4424fae1ccf8250c6",
  measurementId: "G-CMRFEH005E",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
// const questions = [
//   "What's your essential song recently?",
// "What's your essential book recently?",

//   "What's an essential dish you've cooked recently?",
//   "What's your essential hobby recently?",
//   "What's an essential skill you've been honing recently?",
//   "What's your essential workout routine recently?",
//   "What's an essential podcast you've been listening to recently?",
//   "What's your essential productivity tip recently?",
//   "What's an essential piece of technology you've been using recently?",
//   "What's your essential self-care practice recently?",
//   "What's an essential quote that's resonated with you recently?",
//   "What's your essential place to visit locally recently?",
//   "What's an essential app you've discovered recently?",
//   "What's your essential way to relax recently?",
//   "What's an essential goal you've set for yourself recently?",
//   "What's your essential piece of advice you've received recently?",
//   "What's an essential documentary you've watched recently?",
//   "What's your essential morning routine recently?",
//   "What's an essential piece of clothing you've been wearing recently?",
//   "What's your essential way to unwind after a long day recently?",
//   "What's an essential life hack you've learned recently?",
//   "What's your essential podcast episode recently?",
//   "What's an essential news source you've been following recently?",
//   "What's your essential creative outlet recently?",
//   "What's an essential memory you've cherished recently?",
//   "What's your essential piece of music equipment recently?",
//   "What's an essential social activity you've engaged in recently?",
//   "What's your essential method for staying focused recently?",
//   "What's an essential conversation you've had recently?",
//   "What's your essential travel destination recently?",
//   "What's an essential way you've been giving back to your community recently?",
// ];

// async function addQuestionsToFirestore() {
//   try {
//     questions.forEach(async (question) => {
//       await addDoc(collection(db, "prompts"), { question });
//     });
//     console.log("Questions added to Firestore!");
//   } catch (error) {
//     console.error("Error adding questions to Firestore: ", error);
//   }
// }

// addQuestionsToFirestore();

export { app, auth, db };
