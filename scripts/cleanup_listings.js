const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables
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

// 2. Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY
  })
});

const auth = admin.auth();
const db = admin.firestore();

const keepEmails = [
  'iyadmohmadnazri@s.unikl.edu.my',
  'muhaimi@s.unikl.edu.my',
  'amiruls@s.unikl.edu.my',
  'irfan@s.unikl.edu.my',
  'sports@s.unikl.edu.my',
  'techsociety@s.unikl.edu.my'
];

async function cleanup() {
  console.log('--- PULSE LISTING CLEANUP ---');
  
  // 3. Get UIDs for accounts to keep
  const keepUids = [];
  for (const email of keepEmails) {
    try {
      const user = await auth.getUserByEmail(email);
      keepUids.push(user.uid);
      console.log(`Keeping user: ${email} (${user.uid})`);
    } catch (e) {
      console.warn(`Warning: Could not find user for ${email}`);
    }
  }

  if (keepUids.length === 0) {
    console.error('Error: No users found to keep. Aborting to prevent full wipe.');
    return;
  }

  // 4. Fetch all items
  console.log('Fetching items...');
  const itemsSnap = await db.collection('items').get();
  console.log(`Found ${itemsSnap.size} total items.`);

  let deletedCount = 0;
  const batch = db.batch();
  let batchSize = 0;

  for (const doc of itemsSnap.docs) {
    const item = doc.data();
    if (!keepUids.includes(item.seller_id)) {
      console.log(`Deleting item: ${item.title} (Seller ID: ${item.seller_id})`);
      batch.delete(doc.ref);
      deletedCount++;
      batchSize++;

      if (batchSize >= 400) {
        await batch.commit();
        batchSize = 0;
      }
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }

  console.log(`Cleanup complete. Deleted ${deletedCount} listings.`);
}

cleanup().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
