import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestBooking() {
    console.log("🚀 Initializing Test Reminder Script...");

    // We set the booking for (Now + 32 minutes)
    // The server checks (Now + 30 minutes)
    // So in 2 minutes, (Server Now) + 30 will equal (Booking Time).
    const MINUTES_DELAY = 2;
    const now = new Date();
    const testTime = new Date(now.getTime() + (30 + MINUTES_DELAY) * 60000);

    const formatterDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
    const formatterTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Manila',
        hour: '2-digit', minute: '2-digit', hour12: false
    });

    const dateStr = formatterDate.format(testTime);
    const timeStr = formatterTime.format(testTime);

    console.log(`\n📅 Generating Booking:`);
    console.log(`   - Date: ${dateStr}`);
    console.log(`   - Time: ${timeStr} (Manila Time)`);
    console.log(`   - Setup: This is set ~${30 + MINUTES_DELAY} minutes from now.`);
    console.log(`   - Trigger: The server looks for bookings 30 minutes out.`);
    console.log(`   - Result: Alert should fire in ~${MINUTES_DELAY} minute(s).`);

    if (!process.env.EMAIL_USER) {
        console.error("❌ ERROR: EMAIL_USER not found in .env");
        process.exit(1);
    }

    try {
        await addDoc(collection(db, 'bookings'), {
            fullName: "Test User (Terminal Cron)",
            email: process.env.EMAIL_USER, // Send to self so valid email is used
            phone: "09000000000",
            package: "Test Package (Cron)",
            date: dateStr,
            time: timeStr,
            status: "confirmed", // Cron only checks confirmed bookings
            referenceNumber: "TEST-" + Math.floor(Math.random() * 10000),
            createdAt: new Date(),
            totalPrice: 0
        });

        console.log("\n✅ Test booking created successfully!");
        console.log("---------------------------------------");
        console.log("👉 STEP 1: Restart your server to load the new Cron logic.");
        console.log("   (Ctrl+C then 'npm run dev')");
        console.log(`👉 STEP 2: Wait approx ${MINUTES_DELAY} minute(s) for the clock to hit.`);
        console.log("👉 STEP 3: Watch the server console for:");
        console.log(`   '🔔 Sending reminder for Test User (Terminal Cron) (${timeStr})'`);
        console.log("---------------------------------------");
    } catch (e) {
        console.error("❌ Error creating booking:", e);
    }
    // Exit after short delay to ensure logs flush
    setTimeout(() => process.exit(0), 500);
}

createTestBooking();
