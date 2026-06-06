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

async function removeSarah() {
  const sarahUid = 'fFiX6vSM3xbd3O26suwtiFzqaQk2';

  console.log(`🔥 Commencing purge of Sarah J (${sarahUid})...`);

  // 1. Delete all items associated with Sarah J
  const itemsRef = db.collection('items');
  const sarahItems = await itemsRef.where('seller_id', '==', sarahUid).get();
  console.log(`🗑️ Deleting ${sarahItems.size} listings associated with Sarah J...`);
  const delBatch = db.batch();
  sarahItems.forEach(doc => delBatch.delete(doc.ref));
  await delBatch.commit();

  // 2. Delete Sarah J from Users DB
  console.log(`🔥 Deleting user record for Sarah J...`);
  await db.collection('users').doc(sarahUid).delete();

  console.log("✨ Sarah J has been purged from the system.");
}

removeSarah().then(() => process.exit(0)).catch(console.error);
