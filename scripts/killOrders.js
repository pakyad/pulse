const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function killOrders() {
  const snap = await db.collection('orders')
    .where('status', 'in', ['PENDING', 'PREPARING'])
    .get();

  console.log(`Found ${snap.size} orders to kill.`);

  if (snap.empty) {
    console.log('No orders need updating.');
    return;
  }

  const batch = db.batch();
  snap.forEach(doc => {
    batch.update(doc.ref, {
      status: 'DELIVERED',
      delivered_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log(`Updated ${snap.size} orders to DELIVERED.`);
}

killOrders().catch(console.error);
