import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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
const auth = getAuth(app);
