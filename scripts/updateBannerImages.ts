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

const db = initialize().firestore();

const IMAGE_URLS = [
  "https://images.unsplash.com/photo-1523240715639-963c7a094ce7?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=800&auto=format&fit=crop"
];

async function run() {
  const snapshot = await db.collection("banners").orderBy("order", "asc").get();
  let idx = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.imageUrl) {
      const url = IMAGE_URLS[idx % IMAGE_URLS.length];
      await doc.ref.update({ imageUrl: url });
      console.log(`Updated banner "${data.headline}" (${doc.id}) → ${url}`);
      idx++;
    } else {
      console.log(`Skipped "${data.headline}" — already has imageUrl`);
    }
  }

  console.log("Done — banners updated.");
}

run().catch(console.error).then(() => process.exit(0));
