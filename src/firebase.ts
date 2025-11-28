import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD6BBWMs6yuWrkwxFkTXui44gdymo1VDa8",
    authDomain: "it-s-our-studio.firebaseapp.com",
    projectId: "it-s-our-studio",
    storageBucket: "it-s-our-studio.firebasestorage.app",
    messagingSenderId: "1040611577378",
    appId: "1:1040611577378:web:7e0510d41cfbafe63a847b",
    measurementId: "G-ESW9MMDL7Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, db, storage };
