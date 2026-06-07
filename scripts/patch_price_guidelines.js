/**
 * Patch script: Updates PriceGuidelines with the new PCS plan fields.
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

async function patch() {
  console.log('Patching PriceGuidelines for 3-Layer PCS...');
  
  const snap = await db.collection('PriceGuidelines').get();
  const batch = db.batch();

  snap.docs.forEach(doc => {
    const data = doc.data();
    batch.update(doc.ref, {
      is_price_controlled: true,
      pcs_discount_pct: 10,
      ceiling_rm: data.max_price || 500,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  await batch.commit();
  console.log('✅ PriceGuidelines patched successfully.');
  process.exit(0);
}

patch().catch(e => { console.error(e); process.exit(1); });
