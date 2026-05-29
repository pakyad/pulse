const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })
});

const db = admin.firestore();

async function clearOrders() {
  console.log("Wiping active orders...");
  const snapshot = await db.collection('orders').get();
  const batch = db.batch();
  
  snapshot.forEach(doc => {
    // Only delete active/preparing ones to make the registry "fresh"
    const data = doc.data();
    if (['PENDING_VENDOR', 'PREPARING', 'READY_FOR_PICKUP', 'PENDING_RUNNER', 'AWAITING_RUNNER'].includes(data.status)) {
        batch.delete(doc.ref);
        console.log(`Deleted order ${doc.id}`);
    }
  });

  await batch.commit();
  console.log("Registry cleared!");
  process.exit(0);
}

clearOrders();
