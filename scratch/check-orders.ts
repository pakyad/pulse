import { adminDb } from './lib/firebase-admin';

async function checkOrders() {
  const snapshot = await adminDb.collection('orders').get();
  console.log(`Total orders: ${snapshot.size}`);
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`ID: ${doc.id} | Status: ${data.status} | Delivery: ${data.delivery_type} | Runner: ${data.runner_id}`);
  });
}

checkOrders();
