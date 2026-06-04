const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
  });
}

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('items').where('title', '==', 'Preloved Zara Denim Jacket').get();
  
  if (snapshot.size > 1) {
    const docs = snapshot.docs;
    // Keep the first one, delete the rest
    const batch = db.batch();
    for (let i = 1; i < docs.length; i++) {
      console.log(`Deleting duplicate jacket listing with ID: ${docs[i].id}`);
      batch.delete(docs[i].ref);
    }
    await batch.commit();
    console.log(`✅ Successfully removed ${docs.length - 1} duplicate listing(s).`);
  } else {
    console.log(`No duplicates found.`);
  }

  process.exit(0);
}

run().catch(console.error);
