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

async function injectListing() {
  console.log("injecting flagged listing for Iyad...");

  const sellerUid = "UMgBPjJQNaTLGZC6oDtLTz5gbkG3";
  const sellerName = "Iyad Mohmad";

  const flaggedItem = {
    title: "AirPods Max (Space Gray)",
    description: "Brand new AirPods Max. Selling because I need the cash urgently. Price is firm.",
    price: 4500, // Tech ceiling is 3500
    category: "TECH",
    seller_id: sellerUid,
    seller_name: sellerName,
    status: "FLAGGED_FOR_REVIEW",
    is_price_flagged: true,
    flag_source: "SYSTEM",
    report_count: 0,
    strike_count: 0,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    image_url: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=600&auto=format&fit=crop",
    images: ["https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?q=80&w=600&auto=format&fit=crop"]
  };

  try {
    const docRef = await db.collection('items').add(flaggedItem);
    console.log(`✅ Successfully injected flagged item: ${docRef.id}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to inject item", err);
    process.exit(1);
  }
}

injectListing();
