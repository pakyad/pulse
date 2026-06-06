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
    clientEmail: env.BASE_CLIENT_EMAIL || env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY
  })
});

const db = admin.firestore();

async function reassignArduino() {
  const itemId = 'cisOJauKclWESMaMrsaS';
  const seClubUid = 'VHUVOED39zTeki1owXEci7489CD3';
  const seClubName = 'SE Club (Software Engineering Society)';

  console.log(`🔄 Reassigning Arduino Starter Kit to ${seClubName}...`);

  await db.collection('items').doc(itemId).update({
    seller_id: seClubUid,
    seller_name: seClubName,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log("✅ Arduino Starter Kit successfully reassigned to SE Club.");
}

reassignArduino().then(() => process.exit(0)).catch(console.error);
