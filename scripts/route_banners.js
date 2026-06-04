const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
  });
}

const db = admin.firestore();

async function run() {
  const targetUrl = 'https://cas.unikl.edu.my/cas-web/login?service=https://portal.unikl.edu.my/j_spring_cas_security_check?spring-security-redirect=/home.htm';
  console.log(`Updating all announcement links to ${targetUrl} ...`);
  
  const announcements = await db.collection('announcements').get();
  const batch = db.batch();
  let count = 0;
  
  announcements.forEach(doc => {
    batch.update(doc.ref, { ctaPath: targetUrl });
    count++;
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`✅ Successfully redirected ${count} announcements!`);
  }

  process.exit(0);
}

run().catch(console.error);
