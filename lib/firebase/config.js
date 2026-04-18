/**
 * Firebase configuration for the application
 * Author: Kavin Ramesh
 * 
 * Purpose:
 * This configuration file contains the Firebase settings and initialization code
 * required for the application to connect to the Firebase services.
 * This will later initialize and export:
 * - Firebase authentication
 * - Firestore database
 * - Firebase storage
 * 
 * Current Status: 
 * Basic implementation completed
 * can be used by storage and firestore service files
 */

// Firebase imports (will be used when implementing)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase configuration will be filled with real values later
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app (will be implemented later)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Export services
export default app;