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

async function findOrder() {
  console.log("Searching for USB-C Hub orders...");
  const snapshot = await db.collection('orders').get();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.title?.toLowerCase().includes('usb-c') || 
        data.order_code?.toUpperCase() === 'JZLUNU' ||
        data.display_id?.toUpperCase() === 'JZLUNU' ||
        JSON.stringify(data).includes('JZLUNU')) {
      console.log(`FOUND DOC: ${doc.id}`);
      console.log(JSON.stringify(data, null, 2));
    }
  });
}

findOrder().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
