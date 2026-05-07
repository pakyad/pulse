const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function findAndClear() {
  console.log('--- PULSE REGISTRY PURGE START ---');
  const snap = await db.collection('users').get();
  const muhaimin = snap.docs.find(d => {
    const name = d.data().full_name || '';
    return name.toLowerCase().includes('muhaimin');
  });
  
  if (!muhaimin) {
    console.log('ERROR: No Muhaimin account detected in the registry.');
    process.exit(1);
  }
  
  console.log('TARGET IDENTIFIED:', muhaimin.id, '(', muhaimin.data().full_name, ')');
  
  const orders = await db.collection('orders').where('buyer_id', '==', muhaimin.id).get();
  console.log('ACTIVE ORDERS DETECTED:', orders.size);
  
  const batch = db.batch();
  orders.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log('--- PURGE SUCCESSFUL: REGISTRY NEUTRALIZED ---');
  process.exit(0);
}

findAndClear().catch(err => {
  console.error('CRITICAL ERROR:', err);
  process.exit(1);
});
