const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function restoreListing() {
  console.log("Restoring AirPods Max to the review queue...");

  const sellerUid = "UMgBPjJQNaTLGZC6oDtLTz5gbkG3";

  try {
    // 1. Reset user's strike count to 0 so the user can test cleanly
    await db.collection('users').doc(sellerUid).update({
      strike_count: 0
    });
    console.log("✅ Reset Iyad's strike_count to 0.");

    // 2. Find the AirPods Max listing and flag it again
    const itemsRef = db.collection('items');
    const q = itemsRef.where('seller_id', '==', sellerUid).where('title', '==', 'AirPods Max (Space Gray)');
    const snapshot = await q.get();

    if (snapshot.empty) {
      console.error("❌ Could not find the AirPods Max listing.");
      process.exit(1);
    }

    const docId = snapshot.docs[0].id;
    await db.collection('items').doc(docId).update({
      is_price_flagged: true,
      status: "FLAGGED_FOR_REVIEW",
      governance_message: admin.firestore.FieldValue.delete()
    });

    console.log(`✅ Restored listing ${docId} to the review queue.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to restore item", err);
    process.exit(1);
  }
}

restoreListing();
