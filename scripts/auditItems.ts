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

function boolOrMissing(value: any) {
  return typeof value === 'boolean' ? String(value) : 'missing';
}

function formatItem(item: any) {
  return [
    `ID: ${item.id}`,
    `title: ${item.title || '(missing)'}`,
    `status: ${item.status || '(missing)'}`,
    `merchant: ${boolOrMissing(item.merchant)}`,
    `is_official: ${boolOrMissing(item.is_official)}`,
    `pcs_status: ${item.pcs_status || '(missing)'}`,
    `seller_name: ${item.seller_name || '(missing)'}`,
    `image_url: ${item.image_url ? 'HAS IMAGE' : 'NO IMAGE'}`,
    `price: ${item.price ?? '(missing)'}`,
  ].join(' | ');
}

function getCategory(item: any) {
  const sellerName = String(item.seller_name || '');
  const isUniStoreOfficial =
    item.is_official === true ||
    sellerName.includes('UniStore') ||
    sellerName.includes('Official');

  if (isUniStoreOfficial) return 'UniStore Official items';
  if (item.merchant === true && item.is_official !== true) return 'Club/Merchant items';
  if (item.merchant !== true && item.is_official !== true && item.pcs_status === 'APPROVED') return 'Student PCS Approved';
  if (item.pcs_status === 'FREE_MARKET') return 'Student Free Market';
  return 'Uncategorized';
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  const snapshot = await db.collection('items').get();
  const groups: Record<string, any[]> = {
    'UniStore Official items': [],
    'Club/Merchant items': [],
    'Student PCS Approved': [],
    'Student Free Market': [],
    'Uncategorized': [],
  };

  snapshot.docs.forEach((doc: any) => {
    const item = { id: doc.id, ...doc.data() };
    groups[getCategory(item)].push(item);
  });

  console.log('PULSE ITEMS AUDIT');
  console.log('=================');
  console.log(`Total items: ${snapshot.size}`);

  for (const [groupName, items] of Object.entries(groups)) {
    items.sort((a: any, b: any) => String(a.title || '').localeCompare(String(b.title || '')));

    console.log(`\n${groupName.toUpperCase()}`);
    console.log('-'.repeat(groupName.length));
    console.log(`Count: ${items.length}`);

    if (items.length === 0) {
      console.log('(none)');
      continue;
    }

    items.forEach((item: any) => {
      console.log(`- ${formatItem(item)}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error('Failed to audit items:', error);
    process.exit(1);
  });
