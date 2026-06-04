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
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function run() {
  const filePath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\71f67706-eb65-47ff-b1aa-08b4bf53fdc8\\media__1780586750719.png';
  const destination = 'items/safety_goggles_custom.png';

  console.log("Uploading custom Goggles image to Storage...");
  await bucket.upload(filePath, {
    destination: destination,
    metadata: {
      contentType: 'image/png'
    }
  });

  const file = bucket.file(destination);
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

  console.log("Image uploaded! URL:", publicUrl);

  const snapshot = await db.collection('items').where('title', '==', 'Safety Goggles (Lab)').get();
  const batch = db.batch();
  
  let updated = 0;
  snapshot.forEach(doc => {
    batch.update(doc.ref, { 
      image_url: publicUrl,
      images: [publicUrl]
    });
    updated++;
  });

  if (updated > 0) {
    await batch.commit();
    console.log(`✅ Successfully updated ${updated} Safety Goggles listings with the custom image!`);
  }

  process.exit(0);
}

run().catch(console.error);
