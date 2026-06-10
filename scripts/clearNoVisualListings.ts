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

async function clearNoVisuals() {
  console.log("Fetching listings...");
  const snapshot = await db.collection("items").get();
  
  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    
    // A listing has "no visual" if images array is missing/empty AND image_url string is missing/empty
    const hasNoImages = !data.images || data.images.length === 0;
    const hasNoImageUrl = !data.image_url || data.image_url.trim() === '';

    if (hasNoImages && hasNoImageUrl) {
      batch.delete(doc.ref);
      count++;
      console.log(`Queueing deletion for item: ${data.title} (ID: ${doc.id})`);
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`\nSuccessfully deleted ${count} listings with no visuals.`);
  } else {
    console.log("\nNo listings without visuals found. Your marketplace is clean!");
  }
}

clearNoVisuals().catch(console.error);
