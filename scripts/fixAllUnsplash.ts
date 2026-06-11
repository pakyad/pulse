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

async function fixAllUnsplash() {
  const itemsRef = db.collection('items');
  const items = await itemsRef.get();
  
  let count = 0;
  for (const doc of items.docs) {
    const data = doc.data();
    
    // Check if the image_url or any image in the array is from unsplash
    let needsUpdate = false;
    let newImageUrl = data.image_url;
    let newImages = [...(data.images || [])];
    
    if (newImageUrl && newImageUrl.includes('placehold.co')) {
      needsUpdate = true;
      const safeTitle = encodeURIComponent(data.title.substring(0, 30));
      newImageUrl = `https://placehold.co/600x600/f8fafc/0f172a?text=${safeTitle}`;
    }
    
    for (let i = 0; i < newImages.length; i++) {
      if (newImages[i] && newImages[i].includes('placehold.co')) {
        needsUpdate = true;
        const safeTitle = encodeURIComponent(data.title.substring(0, 30));
        newImages[i] = `https://placehold.co/600x600/f8fafc/0f172a?text=${safeTitle}`;
      }
    }
    
    if (needsUpdate) {
      await doc.ref.update({
        image_url: newImageUrl,
        images: newImages
      });
      console.log(`Updated images for: ${data.title}`);
      count++;
    }
  }
  
  console.log(`Successfully updated ${count} items to use Placehold.co static images.`);
}

fixAllUnsplash().then(() => {
    console.log('Done');
    process.exit(0);
}).catch(console.error);
