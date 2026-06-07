/**
 * Patch script: Syncs PriceGuidelines subcategories with lib/marketplace/categories.ts
 */
const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// Exact labels from categories.ts
const CATEGORY_MAP = {
  'HOSTEL': ['Stand & Table Fans', 'Rice Cookers & Kettles', 'Irons & Laundry', 'Study Tables & Chairs', 'Racks & Storage Boxes', 'Bedding & Linen', 'Room Decor & Lighting'],
  'TECH': ['Laptops', 'Smartphones', 'Tablets', 'Keyboards & Mice', 'Headphones & Audio', 'Cables, Hubs & Chargers', 'Gaming Consoles & Games', 'Software Licences'],
  'ACADEMIC': ['IT & Computing Books', 'Engineering Textbooks', 'Business & Law Books', 'Casio Calculators', 'Other Calculators', 'Lab Coats & Goggles', 'Drawing & Architecture Tools', 'Stationery Bundles'],
  'APPAREL': ['Club & Society Jerseys', 'Campus Event Tees', 'Preloved Menswear', 'Preloved Womenswear', 'Shoes & Sneakers', 'Bags & Backpacks']
};

async function sync() {
  console.log('Syncing PriceGuidelines with Category Registry...');
  
  for (const [catId, labels] of Object.entries(CATEGORY_MAP)) {
    const docRef = db.collection('PriceGuidelines').doc(catId);
    
    const subcategories = labels.map(label => ({
      label,
      is_price_controlled: true // Enable for all since these are "Governed" categories
    }));

    await docRef.set({
      is_price_controlled: true,
      pcs_discount_pct: 10,
      ceiling_rm: catId === 'TECH' ? 3500 : (catId === 'HOSTEL' ? 500 : 200),
      subcategories,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // Also sync the lowercase version just in case
    await db.collection('PriceGuidelines').doc(catId.toLowerCase()).set({
      is_price_controlled: true,
      pcs_discount_pct: 10,
      ceiling_rm: catId === 'TECH' ? 3500 : (catId === 'HOSTEL' ? 500 : 200),
      subcategories,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`✅ Synced ${catId}`);
  }

  process.exit(0);
}

sync().catch(e => { console.error(e); process.exit(1); });
