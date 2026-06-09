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

function getListingType(data: any) {
  const sellerName = String(data.seller_name || '');

  if (
    data.is_official === true ||
    sellerName.includes('UniStore') ||
    sellerName.includes('Official') ||
    sellerName === 'UniKL Official Store'
  ) {
    return 'UNISTORE';
  }

  if (data.merchant === true) {
    return 'CLUB';
  }

  return 'STUDENT';
}

function getListingGroup(listingType: string) {
  if (listingType === 'UNISTORE') return 'UniStore Official';
  if (listingType === 'CLUB') return 'Campus Club';
  return 'Student Listing';
}

async function commitInChunks(db: any, operations: Array<(batch: any) => void>) {
  for (let i = 0; i < operations.length; i += 450) {
    const batch = db.batch();
    operations.slice(i, i + 450).forEach((op) => op(batch));
    await batch.commit();
  }
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  const snapshot = await db.collection('items').get();
  const groups: Record<string, string[]> = {
    UNISTORE: [],
    CLUB: [],
    STUDENT: [],
  };
  const operations: Array<(batch: any) => void> = [];

  snapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    const listingType = getListingType(data);
    const listingGroup = getListingGroup(listingType);

    groups[listingType].push(data.title || `(missing title: ${doc.id})`);

    operations.push((batch) => {
      batch.update(doc.ref, {
        listing_type: listingType,
        listing_group: listingGroup,
      });
    });
  });

  await commitInChunks(db, operations);

  console.log('PULSE LISTING ORGANIZATION');
  console.log('==========================');
  console.log(`Total items updated: ${snapshot.size}`);

  for (const key of ['UNISTORE', 'CLUB', 'STUDENT']) {
    const titles = groups[key].sort((a, b) => a.localeCompare(b));
    console.log(`\n${key} items: ${titles.length}`);
    titles.forEach((title) => console.log(`- ${title}`));
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error('Failed to organize listings:', error);
    process.exit(1);
  });
