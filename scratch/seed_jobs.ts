
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB...", // Needs real config from lib/firebase.ts
  authDomain: "pulse-codep.firebaseapp.com",
  projectId: "pulse-codep",
  storageBucket: "pulse-codep.appspot.com",
  messagingSenderId: "302302194689",
  appId: "1:302302194689:web:34305f2bc8802905187d5b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const JOBS = [
  {
    source: "Cafe Block A",
    dest: "MIIT Lvl 4",
    fee: 4.50,
    type: "FOOD",
    zone: "MIIT",
    status: "AVAILABLE",
    created_at: new Date()
  },
  {
    source: "Mail Hub",
    dest: "V1 Block B",
    fee: 5.00,
    type: "PARCEL",
    zone: "V1 HOSTEL",
    status: "AVAILABLE",
    created_at: new Date()
  },
  {
    source: "Library Kiosk",
    dest: "Admin Office",
    fee: 3.50,
    type: "PRINT",
    zone: "LIBRARY",
    status: "AVAILABLE",
    created_at: new Date()
  }
];

async function seed() {
  console.log(" Initializing Handshake Seeding...");
  for (const job of JOBS) {
    await addDoc(collection(db, "delivery_jobs"), job);
    console.log(` Seeded: ${job.source} -> ${job.dest}`);
  }
  console.log(" Seeding Complete. Check your Terminal.");
}

seed();
