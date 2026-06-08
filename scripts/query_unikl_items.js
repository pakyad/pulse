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

async function query() {
  const itemsRef = db.collection('items');
  const results = [];

  // Query 1: seller_name contains "UniKL" (Firestore doesn't support partial match, so get all and filter)
  const allSnap = await itemsRef.get();
  allSnap.forEach(doc => {
    const d = doc.data();
    const sellerName = (d.seller_name || '').toLowerCase();
    const category = (d.category || '').toLowerCase();
    const sellerId = (d.seller_id || '').toLowerCase();

    if (
      sellerName.includes('unikl') ||
      sellerId === 'unikl_official_store' ||
      category.includes('unikl')
    ) {
      results.push({ id: doc.id, title: d.title, status: d.status, image_url: d.image_url || null, seller_name: d.seller_name, price: d.price });
    }
  });

  if (results.length === 0) {
    console.log('No items found matching UniKL criteria.');
  } else {
    console.log(`Found ${results.length} items:\n`);
    results.forEach(r => {
      console.log(`  ID:    ${r.id}`);
      console.log(`  Title: ${r.title}`);
      console.log(`  Price: RM ${r.price}`);
      console.log(`  Seller: ${r.seller_name}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Image:  ${r.image_url || '(none)'}`);
      console.log('');
    });
  }

  process.exit(0);
}

query().catch(e => { console.error('Error:', e); process.exit(1); });
