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

const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const privateKey = env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error('Missing credentials. projectId:', !!projectId, 'email:', !!clientEmail, 'key:', !!privateKey);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
});

const db = admin.firestore();

const seedData = [
  { title: 'Nasi Lemak Ayam Rendang', description: 'Home-cooked nasi lemak with rendang ayam, sambal, egg, cucumber.', category: 'HUNGER', subcategory: 'Home Cook', price: 8.50, metadata: { pickup_location: 'MIIT Cafeteria' }, governance_ceiling: 20.00 },
  { title: 'Mee Goreng Special + Iced Teh', description: 'Mee goreng special with chicken satay and iced teh tarik.', category: 'HUNGER', subcategory: 'Campus Meal', price: 10.00, metadata: { pickup_location: 'Block A Lobby' }, governance_ceiling: 12.00 },
  { title: 'Kuih Lapis 6pc Pack', description: '6 pieces homemade kuih lapis. Perfect for study group snacks.', category: 'HUNGER', subcategory: 'Snacks & Drinks', price: 5.00, metadata: { pickup_location: 'MIIT Canteen' }, governance_ceiling: 15.00 },
  { title: 'Casio fx-570ES PLUS Scientific Calculator', description: 'Brand new Casio fx-570ES PLUS. Still sealed in box.', category: 'ACADEMIC', subcategory: 'Casio Calculators', price: 78.00, metadata: { program: 'Software Engineering', year_semester: 'Year 1 Sem 2' }, governance_ceiling: 120.00 },
  { title: 'Thomas Calculus Early Transcendentals 14th Ed', description: 'Like new. No highlights or markings. Original cover.', category: 'ACADEMIC', subcategory: 'Engineering Textbooks', price: 85.00, metadata: { program: 'Mechanical Engineering', year_semester: 'Year 2 Sem 1', subject_code: 'MEC2105' }, governance_ceiling: 250.00 },
  { title: 'Lab Coat White Cotton Size M', description: 'Brand new lab coat, 100% cotton. Unopened packaging.', category: 'ACADEMIC', subcategory: 'Lab Coats & Goggles', price: 35.00, metadata: {}, governance_ceiling: 80.00 },
  { title: 'Stabilo Boss Highlighter Set 6pc', description: 'Set of 6 Stabilo Boss highlighters. Assorted neon colours.', category: 'ACADEMIC', subcategory: 'Stationery Bundles', price: 18.00, metadata: { program: 'Information Technology', year_semester: 'Year 1 Sem 1' }, governance_ceiling: 60.00 },
  { title: 'Data Structures in C++ Handwritten Notes', description: 'Complete CSC3109 semester notes. Arrays, linked lists, trees, graphs, sorting.', category: 'ACADEMIC', subcategory: 'Handwritten Notes (IT & CS)', price: 15.00, metadata: { program: 'Computer Science', year_semester: 'Year 2 Sem 1', subject_code: 'CSC3109' }, governance_ceiling: 20.00 },
  { title: 'CSC2106 OOP Past Year Papers 2022-2024', description: 'Complete set of past year papers with answer schemes.', category: 'ACADEMIC', subcategory: 'Past Year Papers', price: 8.00, metadata: { program: 'Software Engineering', year_semester: 'Year 2 Sem 1', subject_code: 'CSC2106' }, governance_ceiling: 10.00 },
  { title: 'Introduction to Java Programming', description: 'Good condition. Minor wear on cover, no markings inside.', category: 'ACADEMIC', subcategory: 'IT & Computing Books', price: 55.00, metadata: { program: 'Information Technology', year_semester: 'Year 1 Sem 2', subject_code: 'ITC1101' }, governance_ceiling: 200.00 },
  { title: 'Khind KS-1626 16" Stand Fan', description: 'Used 6 months, good condition. Remote control included. Quiet operation.', category: 'HOSTEL', subcategory: 'Stand & Table Fans', price: 89.00, metadata: { brand: 'Khind', pickup_difficulty: 'Easy (Fits in Car)' }, governance_ceiling: 200.00 },
  { title: 'Pensonic PRC-10 Rice Cooker 1.0L', description: '1 litre rice cooker. Used 1 semester. Non-stick pot, measuring cup included.', category: 'HOSTEL', subcategory: 'Rice Cookers & Kettles', price: 65.00, metadata: { brand: 'Pensonic', pickup_difficulty: 'Easy (Fits in Car)' }, governance_ceiling: 300.00 },
  { title: 'IKEA MICKE Desk White 105x50cm', description: 'Used IKEA MICKE study table. White. Minor scuffs on edges.', category: 'HOSTEL', subcategory: 'Study Tables & Chairs', price: 120.00, metadata: { pickup_difficulty: 'Moderate (Needs 2 People)' }, governance_ceiling: 400.00 },
  { title: 'IKEA SAMLA Storage Box 45L Clear', description: '2x IKEA SAMLA storage boxes. Stackable, 45L each. Great for hostel room organisation.', category: 'HOSTEL', subcategory: 'Racks & Storage Boxes', price: 35.00, metadata: { pickup_difficulty: 'Easy (Fits in Car)' }, governance_ceiling: 150.00 },
  { title: 'Single Bed Mattress Topper Quilted', description: 'Quilted mattress topper, single bed size. Used 2 months, professionally cleaned.', category: 'HOSTEL', subcategory: 'Bedding & Linen', price: 45.00, metadata: {}, governance_ceiling: 100.00 },
  { title: 'MacBook Air M2 Midnight 8GB 256GB', description: 'Apple MacBook Air M2 chip. 8GB unified memory, 256GB SSD. Battery cycle 45. Original charger included.', category: 'TECH', subcategory: 'Laptops', price: 3200.00, metadata: { brand: 'Apple', specs: 'M2 / 8GB RAM / 256GB SSD / Midnight', condition: 'Like New (< 3 months)', warranty: 'Manufacturer Warranty Active' }, governance_ceiling: 3500.00 },
  { title: 'Sony WH-1000XM5 Headphones Black', description: 'Industry-leading noise cancelling. Used 3 months, like new. Carry case and USB-C cable included.', category: 'TECH', subcategory: 'Headphones & Audio', price: 750.00, metadata: { brand: 'Sony', specs: 'WH-1000XM5 / Wireless / NC / 30hr Battery', condition: 'Like New (< 3 months)', warranty: 'No Warranty' }, governance_ceiling: 800.00 },
  { title: 'Logitech MX Master 3S Mouse Graphite', description: 'Logitech MX Master 3S ergonomic mouse. Graphite. Silent clicks, 8000 DPI. USB-C charging.', category: 'TECH', subcategory: 'Keyboards & Mice', price: 199.00, metadata: { brand: 'Logitech', specs: 'MX Master 3S / Wireless / 8000 DPI / Graphite', condition: 'Good (Normal Use)', warranty: 'No Warranty' }, governance_ceiling: 500.00 },
  { title: 'Nike Dri-FIT Training Tee Black L', description: 'Preloved Nike Dri-FIT tee. Size L, black. Worn 3 times, excellent condition.', category: 'APPAREL', subcategory: 'Preloved Menswear', price: 45.00, metadata: { size: 'L', condition: 'Like New' }, governance_ceiling: null },
  { title: 'Herschel Little America Backpack Navy', description: 'Herschel Little America backpack. Midnight navy. Used 1 semester. Minor wear on zipper pull.', category: 'APPAREL', subcategory: 'Bags & Backpacks', price: 120.00, metadata: { size: 'Free Size', condition: 'Used - Good' }, governance_ceiling: null },
];

async function seed() {
  const batch = db.batch();
  const now = Date.now();
  const seller_id = 'SEED_ADMIN';
  const seller_name = 'Pulse Admin';

  seedData.forEach((item, i) => {
    const docRef = db.collection('items').doc(`seed_${String(i + 1).padStart(2, '0')}`);
    batch.set(docRef, {
      title: item.title,
      description: item.description,
      category: item.category,
      subcategory: item.subcategory,
      price: item.price,
      stock_count: 3,
      metadata: item.metadata,
      images: [],
      image_url: null,
      seller_id,
      seller_name,
      status: 'active',
      price_tier: 'COMPLIANT',
      governance_ceiling: item.governance_ceiling,
      market_baseline: null,
      market_source: 'STATIC_CEILING',
      is_price_flagged: false,
      price_flag_count: 0,
      flag_source: null,
      price_appeal: '',
      price_justification: '',
      is_official: true,
      created_at: new Date(now - (seedData.length - i) * 60000),
      updated_at: new Date(now - (seedData.length - i) * 60000),
      fulfillment_mode: 'MEETUP_ONLY',
      handover_node: 'HQ',
    });
  });

  await batch.commit();
  console.log('SUCCESS: ' + seedData.length + ' listings seeded!');
  process.exit(0);
}

seed().catch(e => { console.error('FAILED:', e); process.exit(1); });
