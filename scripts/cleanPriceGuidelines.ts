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

function isValidCategoryRecord(doc: any) {
  const data = doc.data();
  return data.id === doc.id && Object.prototype.hasOwnProperty.call(data, 'ceiling_rm');
}

async function main() {
  initAdmin();
  const db = admin.firestore();
  const priceGuidelinesRef = db.collection('PriceGuidelines');

  console.log('PULSE PRICE GUIDELINES CLEANUP');
  console.log('==============================');
  console.log('Reading PriceGuidelines collection...\n');

  const lowercaseDuplicateIds = [
    'academic',
    'apparel',
    'books',
    'tech',
    'hostel',
    'food',
    'services',
    'hunger',
  ];

  const deletedLowercaseDuplicates: string[] = [];
  const deletedJunkDocs: string[] = [];

  const initialSnapshot = await priceGuidelinesRef.get();
  const initialIds = new Set(initialSnapshot.docs.map((doc: any) => doc.id));

  const step1Batch = db.batch();
  for (const id of lowercaseDuplicateIds) {
    if (initialIds.has(id)) {
      step1Batch.delete(priceGuidelinesRef.doc(id));
      deletedLowercaseDuplicates.push(id);
    }
  }

  if (deletedLowercaseDuplicates.length > 0) {
    await step1Batch.commit();
  }

  const afterLowercaseSnapshot = await priceGuidelinesRef.get();
  const step2Batch = db.batch();

  for (const doc of afterLowercaseSnapshot.docs) {
    if (!isValidCategoryRecord(doc)) {
      step2Batch.delete(doc.ref);
      deletedJunkDocs.push(doc.id);
    }
  }

  if (deletedJunkDocs.length > 0) {
    await step2Batch.commit();
  }

  const finalSnapshot = await priceGuidelinesRef.get();
  const remainingDocs = finalSnapshot.docs
    .map((doc: any) => ({
      id: doc.id,
      ceiling_rm: doc.data().ceiling_rm,
    }))
    .sort((a: any, b: any) => a.id.localeCompare(b.id));

  console.log('STEP 1 - LOWERCASE DUPLICATES DELETED');
  console.log('-------------------------------------');
  console.log(deletedLowercaseDuplicates.length ? deletedLowercaseDuplicates.join(', ') : '(none found)');

  console.log('\nSTEP 2 - JUNK DOCUMENTS DELETED');
  console.log('-------------------------------');
  console.log(deletedJunkDocs.length ? deletedJunkDocs.join(', ') : '(none found)');

  console.log('\nSTEP 3 - REMAINING CLEAN CATEGORY DOCUMENTS');
  console.log('-------------------------------------------');
  if (remainingDocs.length === 0) {
    console.log('(none remaining)');
  } else {
    for (const doc of remainingDocs) {
      console.log(`- ${doc.id}: ceiling_rm=${doc.ceiling_rm}`);
    }
  }

  console.log('\nSUMMARY');
  console.log('-------');
  console.log(`Initial documents: ${initialSnapshot.size}`);
  console.log(`Lowercase duplicates deleted: ${deletedLowercaseDuplicates.length}`);
  console.log(`Junk documents deleted: ${deletedJunkDocs.length}`);
  console.log(`Remaining documents: ${remainingDocs.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error('Failed to clean PriceGuidelines:', error);
    process.exit(1);
  });
