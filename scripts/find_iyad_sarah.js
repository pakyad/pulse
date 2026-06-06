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

async function findUserUids() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  const results = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.full_name && (data.full_name.includes('Iyad') || data.full_name.includes('Sarah'))) {
      results.push({ uid: doc.id, name: data.full_name });
    }
  });

  console.log("Matching users found:");
  console.log(JSON.stringify(results, null, 2));
}

findUserUids().then(() => process.exit(0)).catch(console.error);
