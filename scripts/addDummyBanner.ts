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
const ts = admin.firestore.FieldValue.serverTimestamp;

async function run() {
  const bRef = db.collection("banners");
  
  const banners = [
    {
      headline: "Hostel Registration Semester 2",
      subline: "Secure your on-campus accommodation. Priority given to final-year UniKL MIIT students.",
      imageUrl: "",
      destination: "/announcements",
      active: true,
      order: 4,
      created_at: ts()
    },
    {
      headline: "Final Exam Schedule Released",
      subline: "Check your ECITIE student portal for the updated timetable and examination venues.",
      imageUrl: "",
      destination: "/announcements",
      active: true,
      order: 5,
      created_at: ts()
    }
  ];

  for (const b of banners) {
    await bRef.add(b);
    console.log("✓ Added dummy banner:", b.headline);
  }
  
  console.log("Dummy banners added successfully.");
}

run().catch(console.error);
