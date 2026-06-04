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
  const snapshot = await db.collection('items').where('title', '==', 'Mini Desk Fan').get();
  if (snapshot.empty) {
    console.log("No Mini Desk Fan found!");
    return;
  }

  const batch = db.batch();
  snapshot.forEach(doc => {
    console.log(`Updating ${doc.id} (${doc.data().title}) to stock_count: 1`);
    batch.update(doc.ref, { stock_count: 1 });
  });

  await batch.commit();
  console.log("✅ Successfully restored Mini Desk Fan stock to 1!");
  process.exit(0);
}

run().catch(console.error);
