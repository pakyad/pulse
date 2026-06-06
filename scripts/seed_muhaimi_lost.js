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

async function seedMuhaimiLostItem() {
  const muhaimiUid = 'd70EDKWvFrZj266Q2ae6dWPgNRp1';
  const muhaimiName = 'Muhaimi';
  
  const radarRef = db.collection('campus_radar');
  const newItem = {
    type: 'LOST',
    title: 'Lost: Black Leather Wallet (Coach)',
    detail: 'Left at MIIT Level 2 student lounge after my lunch break. Contains student ID and some cash. If found, please return it. Appreciate the help!',
    reward: 'RM 20 reward',
    contact: 'Contact via Pulse Messages',
    reporter_uid: muhaimiUid,
    reporter_name: muhaimiName,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    resolved: false
  };

  const docRef = await radarRef.add(newItem);
  console.log(`✅ Lost item created for Muhaimi! ID: ${docRef.id}`);
}

seedMuhaimiLostItem().then(() => process.exit(0)).catch(console.error);
