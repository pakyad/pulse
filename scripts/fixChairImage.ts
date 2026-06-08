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

async function fixChairImage() {
  console.log(" Querying for Herman Miller Embody Chair (Logitech G)...");
  const snap = await db.collection("items")
    .where("title", "==", "Herman Miller Embody Chair (Logitech G)")
    .get();

  if (snap.empty) {
    console.log(" No item found with that exact title.");
    return;
  }

  const chairUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Herman_Miller_Embody_Chair.jpg/800px-Herman_Miller_Embody_Chair.jpg";

  for (const doc of snap.docs) {
    console.log(` Updating Chair item: ${doc.id}`);
    await doc.ref.update({
      image_url: chairUrl,
      imageUrls: [chairUrl]
    });
  }
  console.log(" Done!");
}

fixChairImage().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
