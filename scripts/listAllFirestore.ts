const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

function initAdmin() {
  if (admin.apps.length) return admin.app();

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials in .env.local');
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

async function getCollectionSummary(collectionRef: any) {
  const snapshot = await collectionRef.get();
  const sampleIds = snapshot.docs.slice(0, 3).map((doc: any) => doc.id);

  return {
    name: collectionRef.id,
    count: snapshot.size,
    sampleIds,
  };
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  console.log('PULSE FIRESTORE COLLECTION INVENTORY');
  console.log('=====================================');

  const collections = await db.listCollections();
  const sortedCollections = collections.sort((a: any, b: any) => a.id.localeCompare(b.id));

  console.log('\nTOP-LEVEL COLLECTIONS');
  console.log('---------------------');

  for (const collectionRef of sortedCollections) {
    const summary = await getCollectionSummary(collectionRef);
    const samples = summary.sampleIds.length ? summary.sampleIds.join(', ') : '(no documents)';
    console.log(`- ${summary.name}`);
    console.log(`  Total documents: ${summary.count}`);
    console.log(`  First 3 IDs: ${samples}`);
  }

  console.log('\nUSERS SUBCOLLECTIONS');
  console.log('--------------------');

  const usersRef = db.collection('users');
  const usersSnap = await usersRef.get();
  let foundSubcollections = 0;

  for (const userDoc of usersSnap.docs) {
    const subcollections = await userDoc.ref.listCollections();
    const sortedSubcollections = subcollections.sort((a: any, b: any) => a.id.localeCompare(b.id));

    for (const subcollectionRef of sortedSubcollections) {
      foundSubcollections++;
      const summary = await getCollectionSummary(subcollectionRef);
      const samples = summary.sampleIds.length ? summary.sampleIds.join(', ') : '(no documents)';
      console.log(`- users/${userDoc.id}/${summary.name}`);
      console.log(`  Total documents: ${summary.count}`);
      console.log(`  First 3 IDs: ${samples}`);
    }
  }

  if (foundSubcollections === 0) {
    console.log('- No subcollections found under users documents.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error('Failed to list Firestore collections:', error);
    process.exit(1);
  });
