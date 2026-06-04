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

async function patch() {
  console.log("Patching orders...");
  const ordersSnap = await db.collection('orders').get();
  
  let count = 0;
  for (const doc of ordersSnap.docs) {
    const data = doc.data();
    if (data.image_url) continue; // Already has it
    
    // Try to get from items[0].productId
    let imageUrl = null;
    if (data.items && data.items.length > 0 && data.items[0].productId) {
      const itemSnap = await db.collection('items').doc(data.items[0].productId).get();
      if (itemSnap.exists) {
        const itemData = itemSnap.data();
        imageUrl = itemData.images?.[0] || itemData.image_url || itemData.item_image || null;
      }
    }
    
    if (imageUrl) {
      await doc.ref.update({ image_url: imageUrl });
      console.log(`Updated order ${doc.id}`);
      count++;
    }
  }
  console.log(`Patched ${count} orders successfully.`);
  process.exit(0);
}

patch().catch(console.error);
