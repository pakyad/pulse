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

async function reassignListings() {
  const muhaimiUid = 'd70EDKWvFrZj266Q2ae6dWPgNRp1';
  const muhaimiName = 'Muhaimi';

  console.log("🔍 Locating users and items...");

  // 1. Find Wei Jian's UID
  const usersRef = db.collection('users');
  const weiJianSnap = await usersRef.where('full_name', '==', 'Wei Jian').get();
  
  if (weiJianSnap.empty) {
    console.log("❌ Could not find user 'Wei Jian' in database.");
    return;
  }

  const weiJianUid = weiJianSnap.docs[0].id;
  console.log(`✅ Found Wei Jian (UID: ${weiJianUid})`);

  // 2. Remove Muhaimi's CURRENT listings
  const itemsRef = db.collection('items');
  const muhaimiItems = await itemsRef.where('seller_id', '==', muhaimiUid).get();
  console.log(`🗑️ Deleting ${muhaimiItems.size} existing listings for Muhaimi...`);
  const deleteBatch = db.batch();
  muhaimiItems.forEach(doc => deleteBatch.delete(doc.ref));
  await deleteBatch.commit();

  // 3. Reassign Wei Jian's listings to Muhaimi
  const weiJianItems = await itemsRef.where('seller_id', '==', weiJianUid).get();
  console.log(`🔄 Reassigning ${weiJianItems.size} listings from Wei Jian to Muhaimi...`);
  
  const updateBatch = db.batch();
  weiJianItems.forEach(doc => {
    updateBatch.update(doc.ref, {
      seller_id: muhaimiUid,
      seller_name: muhaimiName,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  await updateBatch.commit();

  // 4. Delete Wei Jian from Users DB
  console.log(`🔥 Deleting user Wei Jian (UID: ${weiJianUid}) from database...`);
  await usersRef.doc(weiJianUid).delete();

  console.log("✨ Database operations complete!");
}

reassignListings().then(() => process.exit(0)).catch(console.error);
