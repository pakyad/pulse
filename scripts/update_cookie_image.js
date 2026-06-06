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

async function updateCookieImage() {
  const itemsRef = db.collection('items');
  const q = itemsRef.where('title', '==', 'Homemade Choc Chip Cookies').where('seller_name', '==', 'Amirul S');
  const snapshot = await q.get();

  if (snapshot.empty) {
    console.log('No matching listing found.');
    return;
  }

  const doc = snapshot.docs[0];
  await doc.ref.update({
    image_url: '/images/choc-chip-cookies.png',
    images: ['/images/choc-chip-cookies.png']
  });

  console.log(`Updated listing: ${doc.id}`);
}

updateCookieImage().then(() => process.exit(0)).catch(console.error);
