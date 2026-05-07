const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Manually load .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  envFile.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ Missing environment variables in .env.local");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

async function seed() {
  console.log("🏛️ Pulse Administrative Seeding: Price Guidelines...");
  
  const guidelines = [
    { id: 'tech', maxBasePrice: 50.00 },
    { id: 'books', maxBasePrice: 30.00 },
    { id: 'apparel', maxBasePrice: 40.00 },
    { id: 'services', maxBasePrice: 20.00 }
  ];

  for (const g of guidelines) {
    await db.collection("PriceGuidelines").doc(g.id).set({
      maxBasePrice: g.maxBasePrice,
      updated_at: new Date().toISOString()
    });
    console.log(`✅ Established: ${g.id} limit set to RM ${g.maxBasePrice.toFixed(2)}`);
  }

  console.log("🚀 Seeding Complete.");
  process.exit(0);
}

seed();
