import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, inMemoryPersistence } from "firebase/auth";
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

// ── EMULATOR BRIDGE ──
// Josh: connect to the local voxel engine if we're in dev mode.
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const { connectFirestoreEmulator } = require('firebase/firestore');
  const { connectAuthEmulator } = require('firebase/auth');
  const { connectStorageEmulator } = require('firebase/storage');
  const { connectFunctionsEmulator } = require('firebase/functions');

  try {
    // Only connect if not already connected (to avoid hot-reload crashes)
    if (!(db as any)._emulatorConnected) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectStorageEmulator(storage, 'localhost', 9199);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      (db as any)._emulatorConnected = true;
      console.log("🏛️ Institutional Emulators Connected");
    }
  } catch (e) {
    console.warn("Emulator bridge active but connection skipped:", e);
  }
}

// ZERO-DISK PERSISTENCE PROTOCOL
// Forces the identity session to reside in RAM only, bypassing the full C: drive.
if (typeof window !== 'undefined') {
  setPersistence(auth, inMemoryPersistence)
    .catch((err) => console.error("Persistence Handshake Failed:", err));
}

export { db, auth, storage, functions };
