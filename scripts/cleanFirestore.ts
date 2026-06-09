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

async function deleteAllDocs(db: any, collectionName: string) {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();

  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });

  if (!snapshot.empty) {
    await batch.commit();
  }

  return {
    collectionName,
    deleted: snapshot.size,
    ids: snapshot.docs.map((doc: any) => doc.id),
  };
}

async function deleteCampaignSeedsOnly(db: any) {
  const allowedIds = ['camp_1', 'camp_2'];
  const snapshot = await db.collection('campaigns').get();
  const allIds = snapshot.docs.map((doc: any) => doc.id);
  const seedIds = allIds.filter((id: string) => allowedIds.includes(id));
  const nonSeedIds = allIds.filter((id: string) => !allowedIds.includes(id));

  const batch = db.batch();
  for (const id of seedIds) {
    batch.delete(db.collection('campaigns').doc(id));
  }

  if (seedIds.length > 0) {
    await batch.commit();
  }

  return {
    collectionName: 'campaigns',
    deleted: seedIds.length,
    ids: seedIds,
    skipped: nonSeedIds,
    confirmedSeedOnly: nonSeedIds.length === 0 && allIds.every((id: string) => allowedIds.includes(id)),
  };
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  const collectionsToDelete = [
    'price_cache',
    'price_reviews',
    'market_reference_prices',
    'sellerTrustScores',
    'campus_radar',
  ];

  console.log('PULSE FIRESTORE CLEANUP');
  console.log('=======================');
  console.log('Deleting only explicitly allowlisted collections/documents.\n');

  const results = [];

  for (const collectionName of collectionsToDelete) {
    results.push(await deleteAllDocs(db, collectionName));
  }

  results.push(await deleteCampaignSeedsOnly(db));

  console.log('DELETE SUMMARY');
  console.log('--------------');

  let totalDeleted = 0;
  for (const result of results) {
    totalDeleted += result.deleted;
    console.log(`- ${result.collectionName}: deleted ${result.deleted} document(s)`);
    console.log(`  IDs: ${result.ids.length ? result.ids.join(', ') : '(none)'}`);

    if (result.collectionName === 'campaigns') {
      console.log(`  Confirmed seed data only: ${result.confirmedSeedOnly ? 'yes' : 'no'}`);
      if (result.skipped.length) {
        console.log(`  Skipped non-seed campaign IDs: ${result.skipped.join(', ')}`);
      }
    }
  }

  console.log(`\nTotal documents deleted: ${totalDeleted}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error('Failed to clean Firestore:', error);
    process.exit(1);
  });
