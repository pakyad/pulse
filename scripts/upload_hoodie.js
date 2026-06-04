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
  const filePath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\71f67706-eb65-47ff-b1aa-08b4bf53fdc8\\media__1780587216991.png';
  const destination = 'items/official_it_faculty_hoodie.png';

  console.log("Uploading custom Hoodie image to Storage...");
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

  const snapshot = await db.collection('items').get();
  const batch = db.batch();
  
  let updated = 0;
  snapshot.forEach(doc => {
    const title = doc.data().title.toLowerCase();
    if (title.includes('shirt') || title.includes('hoodie')) {
      batch.update(doc.ref, { 
        title: 'Official IT Faculty Hoodie',
        image_url: publicUrl,
        images: [publicUrl]
      });
      console.log(`Updated document: ${doc.id} (Old title: ${doc.data().title})`);
      updated++;
    }
  });

  if (updated > 0) {
    await batch.commit();
    console.log(`✅ Successfully updated ${updated} apparel listings to the new Hoodie title and image!`);
  } else {
    console.log("❌ Could not find any matching apparel listing to update.");
  }

  process.exit(0);
}

run().catch(console.error);
