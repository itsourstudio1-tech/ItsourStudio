
// Ensure we're reading .env files
import { config } from 'dotenv';
config();

console.log("Script execution started...");

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Fallback to hardcoded for script execution if dotenv fails or envs are missing
// Ideally we should read from .env but for quick script execution we can reuse the config values
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD6BBWMs6yuWrkwxFkTXui44gdymo1VDa8",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "it-s-our-studio.firebaseapp.com",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "it-s-our-studio",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "it-s-our-studio.firebasestorage.app",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1040611577378",
    appId: process.env.VITE_FIREBASE_APP_ID || "1:1040611577378:web:7e0510d41cfbafe63a847b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const generateTestNotification = async () => {
    try {
        const types = ['booking', 'report', 'system'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const titles = {
            booking: 'New Booking Request',
            report: 'System Issue Reported',
            system: 'System Update Available'
        };

        console.log(`Generating test notification of type: ${randomType}...`);

        const docRef = await addDoc(collection(db, 'notifications'), {
            type: randomType,
            title: titles[randomType],
            message: `Terminal Generated: Test notification at ${new Date().toLocaleTimeString()}`,
            timestamp: serverTimestamp(),
            isRead: false,
            link: randomType === 'booking' ? 'bookings' : randomType === 'report' ? 'reports' : null
        });

        console.log(`✅ Notification created successfully! ID: ${docRef.id}`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating test notification:", error);
        process.exit(1);
    }
};

generateTestNotification();
