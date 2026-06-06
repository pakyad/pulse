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

async function findWeiJianByListings() {
  const itemsRef = db.collection('items');
  const snapshot = await itemsRef.get();
  
  const matches = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.seller_name && data.seller_name.includes('Wei')) {
      matches.push({ uid: data.seller_id, name: data.seller_name });
    }
  });

  if (matches.length > 0) {
    console.log("Potential matches found in listings:");
    console.log(JSON.stringify([...new Set(matches.map(m => JSON.stringify(m)))].map(m => JSON.parse(m)), null, 2));
  } else {
    console.log("No listings found containing 'Wei'.");
  }
}

findWeiJianByListings().then(() => process.exit(0)).catch(console.error);
