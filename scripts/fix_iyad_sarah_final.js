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
    clientEmail: env.BASE_CLIENT_EMAIL || env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY
  })
});

const db = admin.firestore();

async function fixIyadSarah() {
  const targetUid = 'UMgBPjJQNaTLGZC6oDtLTz5gbkG3'; // Iyad
  const targetName = 'Iyad Mohmad';
  const sarahUid = 'fFiX6vSM3xbd3O26suwtiFzqaQk2';

  console.log("🚀 Restoring listings to Iyad Mohmad and purging Sarah J...");

  // 1. Ensure Iyad User Record exists (if deleted previously)
  const iyadRef = db.collection('users').doc(targetUid);
  const iyadSnap = await iyadRef.get();
  if (!iyadSnap.exists) {
    console.log("📝 Creating missing user record for Iyad...");
    await iyadRef.set({
      full_name: 'Iyad Mohmad',
      email: 'iyadmohmadnazri@s.unikl.edu.my',
      role: 'STUDENT',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // 2. Find and Reassign Sarah's listings (Sarah J, Sarah Merchant, etc.)
  const itemsRef = db.collection('items');
  const itemsSnap = await itemsRef.get();
  
  const updateBatch = db.batch();
  let count = 0;

  itemsSnap.forEach(doc => {
    const data = doc.data();
    if (data.seller_name && (data.seller_name.includes('Sarah') || data.seller_id === sarahUid)) {
       updateBatch.update(doc.ref, {
         seller_id: targetUid,
         seller_name: targetName,
         updated_at: admin.firestore.FieldValue.serverTimestamp()
       });
       console.log(`✅ Reassigned: ${data.title}`);
       count++;
    }
  });

  if (count > 0) await updateBatch.commit();
  console.log(`📦 Reassigned ${count} listings to Iyad.`);

  // 3. Purge Sarah from DB
  console.log("🔥 Purging Sarah from users collection...");
  await db.collection('users').doc(sarahUid).delete();

  console.log("✨ Operations complete!");
}

fixIyadSarah().then(() => process.exit(0)).catch(console.error);
