const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envRaw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envRaw.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
  const eq = trimmed.indexOf('=');
  const k = trimmed.substring(0, eq);
  let v = trimmed.substring(eq + 1);
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  if (v.includes('\\n')) v = v.replace(/\\n/g, '\n');
  env[k] = v;
});

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY
  })
});

const db = admin.firestore();

(async () => {
  // 1. Check Reviews collection
  console.log('=== ALL REVIEWS ===');
  const rSnap = await db.collection('Reviews').get();
  console.log('Total reviews:', rSnap.size);
  rSnap.forEach(d => {
    const data = d.data();
    console.log('ID:', d.id);
    console.log('  sellerId:', JSON.stringify(data.sellerId));
    console.log('  buyerId:', JSON.stringify(data.buyerId));
    console.log('  orderId:', JSON.stringify(data.orderId));
    console.log('  rating:', data.rating);
    console.log('  comment:', data.comment);
    console.log('  ALL KEYS:', Object.keys(data));
    console.log('  createdAt:', data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : '---');
  });

  // 2. Check Muhaimi user doc
  console.log('\n=== MUHAIMI USER ===');
  const uSnap = await db.collection('users').doc('d70EDKWvFrZj266Q2ae6dWPgNRp1').get();
  if (uSnap.exists) {
    const data = uSnap.data();
    console.log('trustRating:', data.trustRating);
    console.log('totalReviews:', data.totalReviews);
    console.log('full_name:', data.full_name || data.fullName);
    console.log('ALL keys:', Object.keys(data));
  } else {
    console.log('Muhaimi user NOT FOUND');
    const all = await db.collection('users').get();
    console.log('Total users:', all.size);
    all.forEach(d => console.log('  ', d.id, d.data().email || d.data().full_name || d.data().fullName));
  }

  // 3. Check Amirul user doc
  console.log('\n=== AMIRUL USER ===');
  const aSnap = await db.collection('users').doc('Zc5xiFVxIAWkUJowsS1X2qZJldu1').get();
  if (aSnap.exists) {
    const data = aSnap.data();
    console.log('trustRating:', data.trustRating);
    console.log('totalReviews:', data.totalReviews);
    console.log('full_name:', data.full_name || data.fullName);
  } else {
    console.log('Amirul user NOT FOUND');
  }

  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
