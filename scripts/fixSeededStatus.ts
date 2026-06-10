import admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function initialize() {
  if (admin.apps.length > 0) return admin.apps[0]!;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin Credentials in .env.local");
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

const app = initialize();
const db = admin.firestore();

async function fixStatus() {
  console.log("Fixing seeded status to 'ACTIVE'...");
  const snapshot = await db.collection("items").where("status", "==", "AVAILABLE").get();
  
  if (snapshot.empty) {
    console.log("No items with status 'AVAILABLE' found.");
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { status: "ACTIVE" });
  });

  await batch.commit();
  console.log(`✅ Successfully updated ${snapshot.size} listings to 'ACTIVE'.`);
}

fixStatus().catch(console.error);
