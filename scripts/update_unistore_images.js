const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

const imageMapping = {
  'Plush Toy Captain UniKL': '/images/unistore/cropped_plush_toy.png',
  'Enamel Pin Captain UniKL': '/images/unistore/clean_enamel_pin.png',
  'Key Chain Captain UniKL': '/images/unistore/clean_keychain.png',
  'Balloon Captain UniKL': '/images/unistore/balloon.png',
  'Woven Bag Captain UniKL': '/images/unistore/clean_woven_bag.png',
  'UniKL Virtual Run Mask': '/images/unistore/mask.png',
  'UniKL Virtual Run Medal': '/images/unistore/medal.png',
  'UniKL Virtual Run Race Bag': '/images/unistore/race_bag.png'
};

async function updateImages() {
  console.log("🚀 Updating UniStore Item Images to cropped versions...");
  
  const snap = await db.collection('items').where('is_official', '==', true).get();
  const batch = db.batch();
  let count = 0;

  snap.docs.forEach(doc => {
    const data = doc.data();
    if (imageMapping[data.title]) {
      batch.update(doc.ref, { image_url: imageMapping[data.title] });
      count++;
      console.log(`Matched and updated: ${data.title}`);
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`✅ Successfully updated ${count} official UniStore item images!`);
  } else {
    console.log(`⚠️ No matches found.`);
  }

  process.exit(0);
}

updateImages().catch(console.error);
