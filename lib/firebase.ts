import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton pattern: prevent re-initialization on hot-reloads
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

//  EMULATOR BRIDGE 
// Josh: Only connect if explicitly requested via environment variable.
// This prevents "functions/internal" crashes if the Java-based emulators aren't running.
if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true' && typeof window !== 'undefined') {
  const { connectFirestoreEmulator } = require('firebase/firestore');
  const { connectAuthEmulator } = require('firebase/auth');
  const { connectStorageEmulator } = require('firebase/storage');
  const { connectFunctionsEmulator } = require('firebase/functions');

  try {
    if (!(db as any)._emulatorConnected) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectStorageEmulator(storage, 'localhost', 9199);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      (db as any)._emulatorConnected = true;
      console.log(" Institutional Emulators Connected");
    }
  } catch (e) {
    console.warn("Emulator bridge connection failed:", e);
  }
} else {
  if (typeof window !== 'undefined') {
    console.log(" Pulse Live: Connecting to Cloud Production Node");
  }
}

//  INSTITUTIONAL PERSISTENCE PROTOCOL
// Upgraded to browserLocalPersistence to ensure session continuity across navigations.
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence)
    .catch((err) => console.error("Persistence Handshake Failed:", err));
}

export { db, auth, storage, functions };
/* FIREBASE CONFIGURATION
   What: Initializes all Firebase services for the app
   Exports: auth, db, storage, app
   Used by: Every page and component that needs Firebase
   DO NOT initialize Firebase anywhere else - always import from here
*/
