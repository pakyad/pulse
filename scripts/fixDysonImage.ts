import admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env vars from .env.local
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

async function fixDyson() {
  console.log(" Querying for Dyson V12 Vacuum...");
  const snap = await db.collection("items").where("title", "==", "Dyson V12 Vacuum").get();

  if (snap.empty) {
    console.log(" No Dyson item found with that exact title.");
    return;
  }

  const dysonUrl = "https://www.dyson.com.my/content/dam/dyson/images/products/vacuum/v12-detect-slim/v12-detect-slim-absolute/dyson-v12-detect-slim-absolute-nickel-purple.png";

  for (const doc of snap.docs) {
    console.log(` Updating Dyson item: ${doc.id}`);
    await doc.ref.update({
      image_url: dysonUrl,
      imageUrls: [dysonUrl]
    });
  }
  console.log(" Done!");
}

fixDyson().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
