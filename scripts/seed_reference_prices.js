/**
 * Seed script: Injects reference market prices for common demo items into Firestore.
 * Run once before the FYP demo: node scripts/seed_reference_prices.js
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

// ── REFERENCE PRICES (manually verified from Shopee Malaysia) ──────────────────
// Update these prices the day before your presentation for maximum accuracy.
const REFERENCE_PRICES = [
  // ── TECH ──
  { title: 'AirPods Max', category: 'TECH', keywords: ['airpods max', 'apple airpods max'], market_price: 1899.00 },
  { title: 'Logitech M650 Wireless Mouse', category: 'TECH', keywords: ['logitech m650', 'm650', 'logitech wireless mouse'], market_price: 149.00 },
  { title: 'Logitech MX Master 3', category: 'TECH', keywords: ['mx master 3', 'logitech mx master'], market_price: 399.00 },
  { title: 'Apple AirPods Pro', category: 'TECH', keywords: ['airpods pro', 'apple airpods pro 2'], market_price: 999.00 },
  { title: 'Samsung Galaxy Buds2 Pro', category: 'TECH', keywords: ['galaxy buds2', 'samsung buds'], market_price: 599.00 },
  { title: 'Mechanical Keyboard', category: 'TECH', keywords: ['mechanical keyboard', 'gaming keyboard'], market_price: 250.00 },
  { title: 'USB-C Hub', category: 'TECH', keywords: ['usb hub', 'usb-c hub', 'usb c hub'], market_price: 89.00 },
  { title: 'Webcam 1080p', category: 'TECH', keywords: ['webcam', '1080p webcam', 'logitech webcam'], market_price: 199.00 },
  { title: 'Laptop Stand', category: 'TECH', keywords: ['laptop stand', 'notebook stand'], market_price: 79.00 },
  { title: 'Power Bank 20000mAh', category: 'TECH', keywords: ['power bank', 'powerbank', 'portable charger'], market_price: 129.00 },

  // ── ACADEMIC ──
  { title: 'Calculus Textbook', category: 'ACADEMIC', keywords: ['calculus', 'calculus textbook', 'thomas calculus'], market_price: 120.00 },
  { title: 'Engineering Mathematics', category: 'ACADEMIC', keywords: ['engineering mathematics', 'stroud engineering'], market_price: 95.00 },
  { title: 'Programming in Python', category: 'ACADEMIC', keywords: ['python programming', 'python textbook', 'learn python'], market_price: 85.00 },
  { title: 'Data Structures Textbook', category: 'ACADEMIC', keywords: ['data structures', 'algorithms textbook'], market_price: 110.00 },

  // ── APPAREL ──
  { title: 'Nike Hoodie', category: 'APPAREL', keywords: ['nike hoodie', 'nike sweatshirt'], market_price: 180.00 },
  { title: 'Uniqlo T-Shirt', category: 'APPAREL', keywords: ['uniqlo', 'uniqlo t-shirt', 'uniqlo tshirt'], market_price: 49.90 },
  { title: 'Adidas Jacket', category: 'APPAREL', keywords: ['adidas jacket', 'adidas windbreaker'], market_price: 220.00 },

  // ── HOSTEL ──
  { title: 'Study Table', category: 'HOSTEL', keywords: ['study table', 'study desk', 'student desk'], market_price: 350.00 },
  { title: 'Mini Fridge', category: 'HOSTEL', keywords: ['mini fridge', 'mini refrigerator', 'small fridge'], market_price: 499.00 },
  { title: 'Electric Fan', category: 'HOSTEL', keywords: ['electric fan', 'standing fan', 'table fan'], market_price: 89.00 },
];

async function seed() {
  console.log(`Seeding ${REFERENCE_PRICES.length} reference prices...`);

  // Clear existing docs
  const snap = await db.collection('market_reference_prices').get();
  const batch1 = db.batch();
  snap.docs.forEach(d => batch1.delete(d.ref));
  await batch1.commit();
  console.log(`  ✓ Cleared ${snap.size} old docs`);

  // Write new docs
  const batch2 = db.batch();
  REFERENCE_PRICES.forEach(item => {
    const ref = db.collection('market_reference_prices').doc();
    batch2.set(ref, {
      ...item,
      max_campus_price: parseFloat((item.market_price * 0.90).toFixed(2)),
      last_verified: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch2.commit();
  console.log(`  ✓ Seeded ${REFERENCE_PRICES.length} reference prices`);
  console.log('\nDone. market_reference_prices collection is ready.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
