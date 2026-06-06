const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envRaw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envRaw.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return;
  const eq = trimmed.indexOf('=');
  const k = trimmed.substring(0, eq);
  let v = trimmed.substring(eq + 1);
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  if (v.includes('\\n')) v = v.replace(/\\n/g, '\n');
  env[k] = v;
});

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY
  })
});

const db = admin.firestore();

const users = [
  { uid: 'UMgBPjJQNaTLGZC6oDtLTz5gbkG3', name: 'Iyad Mohmad' },
  { uid: 'd70EDKWvFrZj266Q2ae6dWPgNRp1', name: 'Muhaimi' },
  { uid: 'Zc5xiFVxIAWkUJowsS1X2qZJldu1', name: 'Amirul S' }
];

const templateListings = [
  { title: 'USB-C Hub 7-in-1', category: 'TECH', subcategory: 'Accessories', price: 45, desc: 'Compact hub with HDMI and USB 3.0. Price verified as campus-compliant.', zone: 'green' },
  { title: 'Engineering Mathematics Vol 1', category: 'ACADEMIC', subcategory: 'Textbooks', price: 35, desc: 'Essential for Year 1. Good condition. Price verified as campus-compliant.', zone: 'green' },
  { title: 'UniKL Varsity Hoodie', category: 'APPAREL', subcategory: 'Streetwear', price: 65, desc: 'Official design, size L. Very comfortable.', zone: 'skipped' },
  { title: 'Homemade Choc Chip Cookies', category: 'HUNGER', subcategory: 'Snacks', price: 12, desc: 'Freshly baked every morning. 200g pack.', zone: 'skipped' }
];

async function seedRequestedListings() {
  console.log("🚀 Seeding 12 targeted listings...");
  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const user of users) {
    templateListings.forEach((item, i) => {
      const docRef = db.collection('items').doc();
      batch.set(docRef, {
        title: item.title,
        description: item.desc,
        category: item.category,
        subcategory: item.subcategory,
        price: item.price,
        stock_count: 5,
        seller_id: user.uid,
        seller_name: user.name,
        status: 'active',
        price_tier: item.zone === 'green' ? 'COMPLIANT' : 'REGULAR',
        validation: item.zone === 'green' ? {
          zone: 'green',
          canPublish: true,
          message: 'Campus-Compliant Price ✓',
          proposedPrice: item.price,
          maxCampusPrice: 100, // Placeholder ceiling
          marketBaseline: 110
        } : null,
        is_official: false,
        created_at: now,
        updated_at: now,
        fulfillment_mode: 'MEETUP_ONLY',
        image_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${item.title.replace(/ /g, '')}${user.uid.slice(0,5)}`
      });
    });
  }

  await batch.commit();
  console.log("✅ Successfully seeded 4 listings for each user (12 total).");
}

seedRequestedListings().then(() => process.exit(0)).catch(console.error);
