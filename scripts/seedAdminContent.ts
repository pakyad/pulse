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

async function seed() {
  // STEP 1 — Banners
  const banners = [
    { headline: "Welcome to Pulse", subline: "Campus marketplace powered by AI — buy, sell and deliver on campus", imageUrl: "", destination: "/marketplace", active: true, order: 1, created_at: ts() },
    { headline: "AI Price Protection", subline: "Every listing verified against real Shopee and Lazada prices automatically", imageUrl: "", destination: "/marketplace/create", active: true, order: 2, created_at: ts() },
    { headline: "Campus Runners", subline: "Get items delivered by verified UniKL MIIT students", imageUrl: "", destination: "/run", active: true, order: 3, created_at: ts() },
  ];
  const bRef = db.collection("banners");
  for (const b of banners) {
    await bRef.add(b);
    console.log("  ✓ banner:", b.headline);
  }

  // STEP 2 — Announcements
  const announcements = [
    { title: "Price Control System Now Live", body: "All marketplace listings are now automatically verified by AI against real market prices.", category: "System", published: true, status: "published", created_at: ts(), published_at: ts() },
    { title: "New Runner Applications Open", body: "Earn money delivering items on campus. Apply to become a verified Pulse Runner today.", category: "Community", published: true, status: "published", created_at: ts(), published_at: ts() },
    { title: "Tech Society Store Now Open", body: "Browse the latest tech items from Tech Society — Arduino kits, Raspberry Pi, keyboards and more.", category: "Merchant", published: true, status: "published", created_at: ts(), published_at: ts() },
    { title: "Student Hostel Registration", body: "Apply now for the upcoming semester accommodations at UniKL Campus.", category: "Housing", published: true, status: "published", created_at: ts(), published_at: ts() },
    { title: "Career and Alumni Network", body: "Explore internships, career counseling and job placement opportunities.", category: "Career", published: true, status: "published", created_at: ts(), published_at: ts() },
  ];
  const aRef = db.collection("announcements");
  for (const a of announcements) {
    await aRef.add(a);
    console.log("  ✓ announcement:", a.title);
  }

  console.log("\nDone — 3 banners + 5 announcements seeded.");
}

seed().catch(console.error);
