const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

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

async function purgeOrders() {
  console.log("🧹 Starting Order Purge...");
  try {
    const ordersRef = db.collection("orders");
    const snapshot = await ordersRef.get();

    if (snapshot.empty) {
      console.log("✅ No orders found. Database is already clean.");
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      console.log(`🗑️ Deleting order: ${doc.id}`);
    });

    await batch.commit();
    console.log(`✅ Successfully deleted ${snapshot.size} orders.`);
  } catch (error) {
    console.error("❌ Error purging orders:", error);
  }
}

purgeOrders().then(() => process.exit(0));
