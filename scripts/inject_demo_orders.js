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

async function injectDemoOrders() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  let targetUser = null;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.full_name?.toLowerCase().includes('irfan') || data.displayName?.toLowerCase().includes('irfan') || data.email === 'runner@pulse.edu') {
      targetUser = doc;
      if (data.full_name?.toLowerCase().includes('irfan') || data.displayName?.toLowerCase().includes('irfan')) break;
    }
  }

  if (targetUser) {
    const runnerId = targetUser.id;
    const runnerName = targetUser.data().full_name || 'Pulse Runner';

    // 1. First Demo Order (Parcel)
    const order1Ref = db.collection('orders').doc('demo_completed_1');
    await order1Ref.set({
      title: "Logitech MX Master 3S Mouse",
      status: "DELIVERED",
      buyer_id: "demo_buyer_999",
      buyer_name: "Adam M.",
      seller_id: "demo_merchant_999",
      seller_name: "TechStore Campus",
      runner_id: runnerId,
      runner_name: runnerName,
      delivery_type: "RUNNER",
      category: "PARCEL",
      price: 250,
      item_total: 250,
      runner_fee: 8.50,
      surge_fee: 1.50,
      grand_total: 260,
      created_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
      delivered_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1800000))
    });

    // 2. Second Demo Order (Food)
    const order2Ref = db.collection('orders').doc('demo_completed_2');
    await order2Ref.set({
      title: "Mamak Nasi Goreng Kampung",
      status: "DELIVERED",
      buyer_id: "demo_buyer_888",
      buyer_name: "Sarah Ali",
      seller_id: "demo_merchant_888",
      seller_name: "Cafe Block B",
      runner_id: runnerId,
      runner_name: runnerName,
      delivery_type: "RUNNER",
      category: "FOOD",
      price: 8.00,
      item_total: 8.00,
      runner_fee: 4.50,
      surge_fee: 0,
      grand_total: 12.50,
      created_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 86400000)), // 1 day ago
      delivered_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 84600000))
    });

    console.log(`✅ Successfully injected real completed orders into Firestore for runner: ${runnerName}`);
  } else {
    console.log("Could not find Irfan or Runner in the database.");
  }
}

injectDemoOrders().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
