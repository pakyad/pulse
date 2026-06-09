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

function normalizeRole(data: any) {
  if (data.role === 'ADMIN') return 'ADMIN';

  if (
    data.is_verified_runner === true ||
    data.runner_status === 'approved' ||
    data.role === 'RUNNER' ||
    data.role === 'runner'
  ) {
    return 'RUNNER';
  }

  if (
    data.is_verified_merchant === true ||
    data.role === 'MERCHANT' ||
    data.role === 'merchant' ||
    data.role === 'CLUB' ||
    data.role === 'seller' ||
    data.merchant_status === 'approved'
  ) {
    return 'CLUB';
  }

  return 'STUDENT';
}

function displayRole(role: string) {
  if (role === 'ADMIN') return 'Platform Admin';
  if (role === 'RUNNER') return 'Campus Runner';
  if (role === 'CLUB') return 'Campus Club';
  return 'Student';
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  console.log('PULSE ITEM DELETE + USER ROLE NORMALIZATION');
  console.log('===========================================');

  const itemIds = ['gDP8msjZrENOrdz0QXL7', 'OrjQIh14h2T0JoPvAeNw'];
  let deletedItems = 0;

  for (const itemId of itemIds) {
    const ref = db.collection('items').doc(itemId);
    const snap = await ref.get();
    if (snap.exists) {
      await ref.delete();
      deletedItems++;
      console.log(`Deleted item: ${itemId}`);
    } else {
      console.log(`Item already missing: ${itemId}`);
    }
  }

  const usersSnap = await db.collection('users').get();
  const counts: Record<string, number> = {
    ADMIN: 0,
    RUNNER: 0,
    CLUB: 0,
    STUDENT: 0,
  };

  let updatedUsers = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const role = normalizeRole(data);
    const roleLabel = displayRole(role);

    counts[role]++;

    batch.update(userDoc.ref, {
      role,
      display_role: roleLabel,
    });
    updatedUsers++;
    batchCount++;

    if (batchCount === 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log('\nSUMMARY');
  console.log('-------');
  console.log(`Specific item documents deleted: ${deletedItems}`);
  console.log(`Users updated: ${updatedUsers}`);
  console.log(`ADMIN: ${counts.ADMIN}`);
  console.log(`RUNNER: ${counts.RUNNER}`);
  console.log(`CLUB: ${counts.CLUB}`);
  console.log(`STUDENT: ${counts.STUDENT}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error('Failed to delete items and normalize roles:', error);
    process.exit(1);
  });
