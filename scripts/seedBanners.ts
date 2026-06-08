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
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

async function seedBanners() {
  console.log("Seeding banners collection...");
  
  const banners = [
    { 
      headline: "Welcome to Pulse", 
      subline: "Campus marketplace powered by AI", 
      imageUrl: "https://images.unsplash.com/photo-1523240715639-963c7a094ce7?q=80&w=800&auto=format&fit=crop",
      destination: "marketplace",
      active: true, 
      order: 1, 
      created_at: serverTimestamp() 
    },
    { 
      headline: "AI Price Protection", 
      subline: "Every listing verified against real market prices", 
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
      destination: "pulse",
      active: true, 
      order: 2, 
      created_at: serverTimestamp() 
    },
    { 
      headline: "Campus Delivery", 
      subline: "Get items delivered by verified UniKL runners", 
      imageUrl: "https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?q=80&w=800&auto=format&fit=crop",
      destination: "marketplace",
      active: true, 
      order: 3, 
      created_at: serverTimestamp() 
    }
  ];

  for (const b of banners) {
    const docRef = await db.collection("banners").add(b);
    console.log(`Added banner: ${b.headline} (${docRef.id})`);
  }
  
  console.log("Seeding complete!");
}

seedBanners().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
