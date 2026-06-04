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

async function run() {
  const snapshot = await db.collection('orders').get();
  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    // Delete anything that isn't completely finished
    if (data.status !== 'DELIVERED' && data.status !== 'CANCELLED' && data.status !== 'PAID_OUT') {
      console.log(`Deleting ongoing order: ${doc.id} (Status: ${data.status})`);
      batch.delete(doc.ref);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`✅ Successfully deleted ${count} ongoing orders!`);
  } else {
    console.log(`✅ No ongoing orders found to delete.`);
  }

  // Also clean up parent_orders
  const parentSnapshot = await db.collection('parent_orders').get();
  const parentBatch = db.batch();
  let pCount = 0;
  parentSnapshot.forEach(doc => {
     const data = doc.data();
     if (data.status !== 'DELIVERED' && data.status !== 'CANCELLED' && data.status !== 'PAID_OUT') {
        parentBatch.delete(doc.ref);
        pCount++;
     }
  });
  if (pCount > 0) {
     await parentBatch.commit();
     console.log(`✅ Successfully deleted ${pCount} ongoing parent orders!`);
  }

  process.exit(0);
}

run().catch(console.error);
