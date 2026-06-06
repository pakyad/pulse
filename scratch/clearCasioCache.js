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
  const snap = await db.collection('price_cache').get();
  let count = 0;
  const batch = db.batch();

  snap.docs.forEach(d => {
    if (d.id.toLowerCase().includes('casio')) {
      batch.delete(d.ref);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`✅ Cache cleared: ${count} Casio entries removed.`);
  } else {
    console.log('✅ No Casio entries found in cache.');
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
