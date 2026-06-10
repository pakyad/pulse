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

const ACTIVE_STATUSES = [
  'PENDING', 'PENDING_VENDOR', 'PENDING_RUNNER', 'PREPARING',
  'READY_FOR_PICKUP', 'AWAITING_RUNNER', 'PICKED_UP', 'READY',
  'IN_TRANSIT', 'ON_THE_WAY', 'ARRIVED_AT_DESTINATION',
];

async function clearOrders() {
  console.log("Fetching orders...");
  const snapshot = await db.collection("orders").get();
  
  const batch = db.batch();
  let count = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (ACTIVE_STATUSES.includes(data.status)) {
      batch.delete(doc.ref);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`Deleted ${count} ongoing orders.`);
  } else {
    console.log("No ongoing orders found.");
  }
}

clearOrders().catch(console.error);
