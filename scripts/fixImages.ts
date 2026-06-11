import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

async function fixImages() {
  const itemsRef = db.collection('items');
  const items = await itemsRef.get();
  
  for (const doc of items.docs) {
    const data = doc.data();
    if (data.title === 'Texas Instruments TI-84 Plus CE Graphing Calculator') {
      const safeTitle = encodeURIComponent('Texas Instruments TI-84');
      const newUrl = `https://placehold.co/600x600/f8fafc/0f172a?text=${safeTitle}`;
      await doc.ref.update({
        image_url: newUrl,
        images: [newUrl]
      });
      console.log('Fixed calculator image');
    }
    if (data.title === 'Campbell Biology 12th Edition') {
      const safeTitle = encodeURIComponent('Campbell Biology');
      const newUrl = `https://placehold.co/600x600/f8fafc/0f172a?text=${safeTitle}`;
      await doc.ref.update({
        image_url: newUrl,
        images: [newUrl]
      });
      console.log('Fixed biology book image');
    }
  }
}

fixImages().then(() => {
    console.log('Done');
    process.exit(0);
}).catch(console.error);
