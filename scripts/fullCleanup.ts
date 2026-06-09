const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const VALID_ORDER_STATUSES = new Set(['PENDING', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED', 'CANCELLED']);

const ORDER_STATUS_MAP: Record<string, string> = {
  PENDING_VENDOR: 'PENDING',
  PENDING_RUNNER: 'PENDING',
  COMPLETED: 'DELIVERED',
  READY_FOR_PICKUP: 'READY',
  AWAITING_RUNNER: 'READY',
  RUNNER_ASSIGNED: 'PICKED_UP',
  ACCEPTED_BY_RUNNER: 'PICKED_UP',
  ON_THE_WAY: 'PICKED_UP',
  IN_TRANSIT: 'PICKED_UP',
  ARRIVED_AT_BUYER: 'PICKED_UP',
  ISSUE_REPORTED: 'CANCELLED',
  REFUNDED: 'CANCELLED',
  RESOLVED_SPLIT: 'CANCELLED',
  REFUNDED_PENALTY: 'CANCELLED',
  PAID_OUT: 'DELIVERED',
};

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

function isMissing(value: any) {
  return value === undefined || value === null || String(value).trim() === '';
}

function getMillis(value: any) {
  if (!value) return null;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return null;
}

async function commitInChunks(db: any, operations: Array<(batch: any) => void>) {
  let committed = 0;
  for (let i = 0; i < operations.length; i += 450) {
    const batch = db.batch();
    const chunk = operations.slice(i, i + 450);
    chunk.forEach((op) => op(batch));
    await batch.commit();
    committed += chunk.length;
  }
  return committed;
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  const summary: any = {
    ordersDeleted: [],
    ordersStatusUpdated: [],
    usersRoleDefaulted: [],
    usersFullNameCopied: [],
    notificationsDeleted: [],
    chatsChanged: 0,
    itemsStatusDefaulted: [],
    itemsSellerNameDefaulted: [],
  };

  console.log('PULSE FULL CLEANUP');
  console.log('==================');

  const orderOps: Array<(batch: any) => void> = [];
  const ordersSnap = await db.collection('orders').get();
  ordersSnap.docs.forEach((doc: any) => {
    const data = doc.data();
    if (isMissing(data.buyer_id) && isMissing(data.seller_id) && isMissing(data.title)) {
      summary.ordersDeleted.push(doc.id);
      orderOps.push((batch) => batch.delete(doc.ref));
      return;
    }

    const status = String(data.status || '').trim();
    if (!VALID_ORDER_STATUSES.has(status) && ORDER_STATUS_MAP[status]) {
      const mappedStatus = ORDER_STATUS_MAP[status];
      summary.ordersStatusUpdated.push({ id: doc.id, from: status, to: mappedStatus });
      orderOps.push((batch) => batch.update(doc.ref, { status: mappedStatus }));
    }
  });
  await commitInChunks(db, orderOps);

  const userOps: Array<(batch: any) => void> = [];
  const usersSnap = await db.collection('users').get();
  usersSnap.docs.forEach((doc: any) => {
    const data = doc.data();
    const update: any = {};

    if (isMissing(data.role)) {
      update.role = 'STUDENT';
      summary.usersRoleDefaulted.push(doc.id);
    }

    if (isMissing(data.full_name) && !isMissing(data.fullName)) {
      update.full_name = data.fullName;
      summary.usersFullNameCopied.push(doc.id);
    }

    if (Object.keys(update).length > 0) {
      userOps.push((batch) => batch.update(doc.ref, update));
    }
  });
  await commitInChunks(db, userOps);

  const notificationOps: Array<(batch: any) => void> = [];
  const notificationsSnap = await db.collection('notifications').get();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  notificationsSnap.docs.forEach((doc: any) => {
    const data = doc.data();
    const createdAtMs = getMillis(data.created_at);
    if (createdAtMs !== null && createdAtMs < sevenDaysAgo) {
      summary.notificationsDeleted.push(doc.id);
      notificationOps.push((batch) => batch.delete(doc.ref));
    }
  });
  await commitInChunks(db, notificationOps);

  const itemOps: Array<(batch: any) => void> = [];
  const itemsSnap = await db.collection('items').get();
  itemsSnap.docs.forEach((doc: any) => {
    const data = doc.data();
    const update: any = {};

    if (isMissing(data.status)) {
      update.status = 'ACTIVE';
      summary.itemsStatusDefaulted.push(doc.id);
    }

    if (isMissing(data.seller_name) && !isMissing(data.seller_id)) {
      update.seller_name = 'Campus Seller';
      summary.itemsSellerNameDefaulted.push(doc.id);
    }

    if (Object.keys(update).length > 0) {
      itemOps.push((batch) => batch.update(doc.ref, update));
    }
  });
  await commitInChunks(db, itemOps);

  console.log('\nORDERS COLLECTION cleanup');
  console.log(`Deleted broken orders: ${summary.ordersDeleted.length}`);
  if (summary.ordersDeleted.length) console.log(`IDs: ${summary.ordersDeleted.join(', ')}`);
  console.log(`Normalized order statuses: ${summary.ordersStatusUpdated.length}`);
  summary.ordersStatusUpdated.forEach((entry: any) => console.log(`- ${entry.id}: ${entry.from} -> ${entry.to}`));

  console.log('\nUSERS COLLECTION cleanup');
  console.log(`Defaulted missing role to STUDENT: ${summary.usersRoleDefaulted.length}`);
  if (summary.usersRoleDefaulted.length) console.log(`IDs: ${summary.usersRoleDefaulted.join(', ')}`);
  console.log(`Copied fullName to full_name: ${summary.usersFullNameCopied.length}`);
  if (summary.usersFullNameCopied.length) console.log(`IDs: ${summary.usersFullNameCopied.join(', ')}`);

  console.log('\nNOTIFICATIONS COLLECTION cleanup');
  console.log(`Deleted notifications older than 7 days: ${summary.notificationsDeleted.length}`);
  if (summary.notificationsDeleted.length) console.log(`IDs: ${summary.notificationsDeleted.join(', ')}`);

  console.log('\nCHATS COLLECTION cleanup');
  console.log('No changes made. All chats kept.');

  console.log('\nITEMS COLLECTION final pass');
  console.log(`Set missing item status to ACTIVE: ${summary.itemsStatusDefaulted.length}`);
  if (summary.itemsStatusDefaulted.length) console.log(`IDs: ${summary.itemsStatusDefaulted.join(', ')}`);
  console.log(`Set missing seller_name to Campus Seller: ${summary.itemsSellerNameDefaulted.length}`);
  if (summary.itemsSellerNameDefaulted.length) console.log(`IDs: ${summary.itemsSellerNameDefaulted.join(', ')}`);

  console.log('\nFULL SUMMARY');
  console.log('------------');
  console.log(`Orders deleted: ${summary.ordersDeleted.length}`);
  console.log(`Orders status-normalized: ${summary.ordersStatusUpdated.length}`);
  console.log(`Users role-defaulted: ${summary.usersRoleDefaulted.length}`);
  console.log(`Users full_name backfilled: ${summary.usersFullNameCopied.length}`);
  console.log(`Notifications deleted: ${summary.notificationsDeleted.length}`);
  console.log(`Chats changed: ${summary.chatsChanged}`);
  console.log(`Items status-defaulted: ${summary.itemsStatusDefaulted.length}`);
  console.log(`Items seller_name defaulted: ${summary.itemsSellerNameDefaulted.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error('Failed to run full cleanup:', error);
    process.exit(1);
  });
