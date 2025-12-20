import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// NOTE: These use environment variables with fallbacks for backward compatibility
// In production, set VITE_FIREBASE_* environment variables and remove the fallbacks
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD6BBWMs6yuWrkwxFkTXui44gdymo1VDa8",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "it-s-our-studio.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "it-s-our-studio",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "it-s-our-studio.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1040611577378",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1040611577378:web:7e0510d41cfbafe63a847b",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ESW9MMDL7Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, db, storage };
