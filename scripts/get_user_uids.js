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

const auth = admin.auth();
const emails = [
  'iyadmohmadnazri@s.unikl.edu.my',
  'muhaimi@s.unikl.edu.my',
  'amiruls@s.unikl.edu.my'
];

async function getUids() {
  for (const email of emails) {
    try {
      const user = await auth.getUserByEmail(email);
      console.log(`${email}: ${user.uid}`);
    } catch (e) {
      console.log(`${email}: NOT_FOUND`);
    }
  }
}

getUids().then(() => process.exit(0));
