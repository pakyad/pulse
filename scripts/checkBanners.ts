import admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function initialize() {
  if (admin.apps.length > 0) return admin.apps[0]!;
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const app = initialize();
const db = admin.firestore();

async function checkBanners() {
  console.log("Checking banners collection...");
  const snap = await db.collection("banners").get();
  console.log(`Total banners found: ${snap.size}`);
  
  snap.forEach(doc => {
    console.log(`ID: ${doc.id}`, doc.data());
  });
}

checkBanners().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
