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

function hasNonEmptyTitle(data: any) {
  return typeof data.title === 'string' && data.title.trim().length > 0;
}

function hasPositivePrice(data: any) {
  return typeof data.price === 'number' && data.price > 0;
}

function isGhostItem(data: any) {
  const titleMissingOrEmpty = data.title === undefined || data.title === null || String(data.title).trim() === '';
  const priceMissingOrInvalid = data.price === undefined || data.price === null || Number(data.price) <= 0;
  const statusMissing = data.status === undefined || data.status === null || String(data.status).trim() === '';

  return titleMissingOrEmpty && priceMissingOrInvalid && statusMissing;
}

function shouldFixFreeMarket(data: any) {
  const pcsMissing = data.pcs_status === undefined || data.pcs_status === null;
  const notMerchant = data.merchant !== true;
  const notOfficial = data.is_official !== true;
  const activeStatus = data.status === 'ACTIVE' || data.status === 'active';

  return pcsMissing && notMerchant && notOfficial && activeStatus && hasNonEmptyTitle(data) && hasPositivePrice(data);
}

async function main() {
  initAdmin();
  const db = admin.firestore();
  const itemsRef = db.collection('items');
  const snapshot = await itemsRef.get();

  const ghostDeletes: any[] = [];
  const freeMarketUpdates: any[] = [];
  const statusUpdates: any[] = [];

  snapshot.docs.forEach((doc: any) => {
    const data = doc.data();

    if (isGhostItem(data)) {
      ghostDeletes.push(doc);
      return;
    }

    if (shouldFixFreeMarket(data)) {
      freeMarketUpdates.push(doc);
    }

    if (data.status === 'active') {
      statusUpdates.push(doc);
    }
  });

  console.log('PULSE UNCATEGORIZED ITEMS FIX');
  console.log('=============================');

  let batch = db.batch();
  ghostDeletes.forEach((doc: any) => batch.delete(doc.ref));
  if (ghostDeletes.length > 0) await batch.commit();

  console.log('\nSTEP 1 - Delete ghost/broken items');
  console.log(`Deleted: ${ghostDeletes.length}`);
  if (ghostDeletes.length > 0) {
    console.log(`IDs: ${ghostDeletes.map((doc: any) => doc.id).join(', ')}`);
  }

  batch = db.batch();
  freeMarketUpdates.forEach((doc: any) => {
    batch.update(doc.ref, {
      pcs_status: 'FREE_MARKET',
      pcs_certified: true,
      pcs_is_custom: false,
      pcs_reason: 'Listed before PCS implementation. Approved as Free Market item.',
    });
  });
  if (freeMarketUpdates.length > 0) await batch.commit();

  console.log('\nSTEP 2 - Fix uncategorized student listings');
  console.log(`Updated: ${freeMarketUpdates.length}`);
  if (freeMarketUpdates.length > 0) {
    console.log(`IDs: ${freeMarketUpdates.map((doc: any) => doc.id).join(', ')}`);
  }

  batch = db.batch();
  statusUpdates.forEach((doc: any) => {
    batch.update(doc.ref, {
      status: 'ACTIVE',
    });
  });
  if (statusUpdates.length > 0) await batch.commit();

  console.log('\nSTEP 3 - Normalize status field');
  console.log(`Updated: ${statusUpdates.length}`);
  if (statusUpdates.length > 0) {
    console.log(`IDs: ${statusUpdates.map((doc: any) => doc.id).join(', ')}`);
  }

  console.log('\nFULL SUMMARY');
  console.log('------------');
  console.log(`Ghost/broken items deleted: ${ghostDeletes.length}`);
  console.log(`Student listings marked FREE_MARKET: ${freeMarketUpdates.length}`);
  console.log(`Lowercase active statuses normalized: ${statusUpdates.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error('Failed to fix uncategorized items:', error);
    process.exit(1);
  });
