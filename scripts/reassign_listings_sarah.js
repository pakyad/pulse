const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envRaw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envRaw.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
  const eq = trimmed.indexOf('=');
  const k = trimmed.substring(0, eq);
  let v = trimmed.substring(eq + 1);
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  if (v.includes('\\n')) v = v.replace(/\\n/g, '\n');
  env[k] = v;
});

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY
  })
});

const db = admin.firestore();

async function reassignListingsSarah() {
  const sourceUid = 'UMgBPjJQNaTLGZC6oDtLTz5gbkG3';
  const targetUid = 'fFiX6vSM3xbd3O26suwtiFzqaQk2';
  const targetName = 'Sarah J';

  console.log(`🚀 Reassigning from Iyad Mohmad (${sourceUid}) to Sarah J (${targetUid})...`);

  // 1. Remove Sarah's current listings
  const itemsRef = db.collection('items');
  const sarahItems = await itemsRef.where('seller_id', '==', targetUid).get();
  console.log(`🗑️ Deleting ${sarahItems.size} existing listings for Sarah...`);
  const delBatch = db.batch();
  sarahItems.forEach(doc => delBatch.delete(doc.ref));
  await delBatch.commit();

  // 2. Reassign Iyad's listings to Sarah J
  const iyadItems = await itemsRef.where('seller_id', '==', sourceUid).get();
  console.log(`🔄 Reassigning ${iyadItems.size} listings from Iyad to Sarah J...`);
  const reBatch = db.batch();
  iyadItems.forEach(doc => {
    reBatch.update(doc.ref, {
      seller_id: targetUid,
      seller_name: targetName,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await reBatch.commit();

  // 3. Delete Iyad from Users DB
  console.log(`🔥 Deleting user Iyad Mohmad from database...`);
  await db.collection('users').doc(sourceUid).delete();
  await db.collection('users').doc('gD0irnDg4FQIAYvjGNPUjFfvMZE2').delete(); // Also delete duplicate

  console.log("✨ Operations complete!");
}

reassignListingsSarah().then(() => process.exit(0)).catch(console.error);
