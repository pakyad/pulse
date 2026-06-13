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

async function run() {
  const snapshot = await db.collection("items")
    .where("title", "==", "UniKL MIIT Sofa")
    .get();

  if (snapshot.empty) {
    // Try partial match
    const all = await db.collection("items")
      .orderBy("created_at", "desc")
      .limit(20)
      .get();
    
    console.log("Could not find exact title. Recent 20 items:");
    all.forEach(doc => {
      const d = doc.data();
      const pcs = {
        pcs_certified: d.pcs_certified,
        pcs_status: d.pcs_status,
        pcs_market_price: d.pcs_market_price,
        pcs_max_allowed: d.pcs_max_allowed,
      };
      console.log(`\n--- ${doc.id} ---`);
      console.log("title:", d.title);
      console.log("price:", d.price);
      console.log("pcs:", JSON.stringify(pcs, null, 2));
      console.log("ALL pcs fields:", Object.keys(d).filter(k => k.startsWith("pcs")));
    });
    return;
  }

  snapshot.forEach(doc => {
    const d = doc.data();
    const pcsFields = Object.keys(d).filter(k => k.startsWith("pcs"));
    console.log("=== UniKL MIIT Sofa ===");
    console.log("Document ID:", doc.id);
    console.log("All pcs* fields:", pcsFields);
    pcsFields.forEach(f => {
      console.log(`  ${f}:`, JSON.stringify(d[f], null, 2), `(type: ${typeof d[f]})`);
    });
  });
}

run().catch(console.error).then(() => process.exit(0));
