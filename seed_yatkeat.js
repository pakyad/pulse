const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

async function run() {
  try {
    // We need the credential. Let's try to get it from .env.local
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const getEnv = (key) => {
      const match = envContent.match(new RegExp(`${key}=(.*)`));
      return match ? match[1].trim().replace(/^"|"$|'$|^'/g, '') : null;
    };

    const projectId = getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    const clientEmail = getEnv('FIREBASE_CLIENT_EMAIL');
    let privateKey = getEnv('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      console.log('Missing credentials in .env.local!');
      return;
    }

    privateKey = privateKey.replace(/\\n/g, '\n');

    const app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey })
    });
    const db = getFirestore(app);

    console.log('Connected to Firestore');

    // 1. Find yatkeat
    const usersSnap = await db.collection('users').get();
    let yatkeatId = null;
    let yatkeatName = null;

    usersSnap.forEach(doc => {
      const data = doc.data();
      if ((data.full_name && data.full_name.toLowerCase().includes('yatkeat')) ||
          (data.email && data.email.toLowerCase().includes('yatkeat')) ||
          (data.full_name && data.full_name.toLowerCase().includes('yat keat'))) {
        yatkeatId = doc.id;
        yatkeatName = data.full_name;
      }
    });

    if (!yatkeatId) {
      console.log('Could not find user yatkeat. Seeding a new user instead.');
      yatkeatId = 'yatkeat_demo_user';
      yatkeatName = 'Yat Keat';
      await db.collection('users').doc(yatkeatId).set({
        full_name: yatkeatName,
        email: 'yatkeat@s.unikl.edu.my',
        role: 'STUDENT',
        is_verified_runner: true,
        created_at: new Date().toISOString()
      });
    }

    console.log(`Found/Created Yat Keat UID: ${yatkeatId}`);

    // 2. Seed PriceGuidelines with is_price_controlled per subcategory
    const guidelinesRef = db.collection('PriceGuidelines');

    // Delete any Food category documents
    const allGuidesSnap = await guidelinesRef.get();
    const deletePromises = [];
    allGuidesSnap.forEach(doc => {
      if (doc.id.toLowerCase() === 'food') {
        deletePromises.push(doc.ref.delete());
        console.log(`- Deleted Food category guideline`);
      }
    });
    await Promise.all(deletePromises);

    const priceGuidelinesData = [
      {
        id: 'academic',
        max_price: 200,
        governance_type: 'REGULATED',
        subcategories: [
          { label: 'IT & Computing Books', is_price_controlled: true },
          { label: 'Engineering Textbooks', is_price_controlled: true },
          { label: 'Business & Law Books', is_price_controlled: true },
          { label: 'Casio Calculators', is_price_controlled: true },
          { label: 'Other Calculators', is_price_controlled: true },
          { label: 'Lab Coats & Goggles', is_price_controlled: true },
          { label: 'Drawing & Architecture Tools', is_price_controlled: true },
          { label: 'Stationery Bundles', is_price_controlled: true },
          { label: 'Handwritten Notes (IT & CS)', is_price_controlled: false },
          { label: 'Handwritten Notes (Engineering)', is_price_controlled: false },
          { label: 'Handwritten Notes (Business)', is_price_controlled: false },
          { label: 'Past Year Papers', is_price_controlled: false },
        ],
      },
      {
        id: 'hostel',
        max_price: 500,
        governance_type: 'OPEN',
        subcategories: [
          { label: 'Stand & Table Fans', is_price_controlled: true },
          { label: 'Rice Cookers & Kettles', is_price_controlled: true },
          { label: 'Irons & Laundry', is_price_controlled: true },
          { label: 'Study Tables & Chairs', is_price_controlled: true },
          { label: 'Racks & Storage Boxes', is_price_controlled: true },
          { label: 'Bedding & Linen', is_price_controlled: true },
          { label: 'Room Decor & Lighting', is_price_controlled: false },
        ],
      },
      {
        id: 'tech',
        max_price: 3500,
        governance_type: 'OPEN',
        subcategories: [
          { label: 'Laptops', is_price_controlled: true },
          { label: 'Smartphones', is_price_controlled: true },
          { label: 'Tablets', is_price_controlled: true },
          { label: 'Keyboards & Mice', is_price_controlled: true },
          { label: 'Headphones & Audio', is_price_controlled: true },
          { label: 'Cables, Hubs & Chargers', is_price_controlled: true },
          { label: 'Gaming Consoles & Games', is_price_controlled: true },
          { label: 'Software Licences', is_price_controlled: false },
        ],
      },
      {
        id: 'apparel',
        max_price: 300,
        governance_type: 'OPEN',
        subcategories: [
          { label: 'Club & Society Jerseys', is_price_controlled: false },
          { label: 'Campus Event Tees', is_price_controlled: false },
          { label: 'Preloved Menswear', is_price_controlled: true },
          { label: 'Preloved Womenswear', is_price_controlled: true },
          { label: 'Shoes & Sneakers', is_price_controlled: true },
          { label: 'Bags & Backpacks', is_price_controlled: true },
        ],
      },
      {
        id: 'services',
        max_price: 100,
        governance_type: 'OPEN',
        subcategories: [
          { label: 'Tutoring & Mentoring', is_price_controlled: false },
          { label: 'Photography & Videography', is_price_controlled: false },
          { label: 'Graphic Design', is_price_controlled: false },
          { label: 'Event Planning', is_price_controlled: false },
          { label: 'Delivery & Errands', is_price_controlled: false },
          { label: 'Tech Support', is_price_controlled: false },
          { label: 'Other Services', is_price_controlled: false },
        ],
      },
    ];

    for (const g of priceGuidelinesData) {
      await guidelinesRef.doc(g.id).set({
        category: g.id.toUpperCase(),
        max_price: g.max_price,
        governance_type: g.governance_type,
        subcategories: g.subcategories,
        updated_at: new Date().toISOString(),
      });
      console.log(`✅ Seeded PriceGuideline: ${g.id} with ${g.subcategories.length} subcategories`);
    }

    // 3. Insert dummy transactions for yatkeat
    const txRef = db.collection('transactions');

    // Delivery 1
    await txRef.add({
      runner_id: yatkeatId,
      status: 'DELIVERED',
      item_name: 'Calculus Textbook 8th Ed',
      runner_fee: 3.50,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    });

    // Delivery 2
    await txRef.add({
      runner_id: yatkeatId,
      status: 'DELIVERED',
      item_name: 'Nasi Lemak Ayam Goreng',
      runner_fee: 5.00,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
    });

    // Sale 1
    await txRef.add({
      merchant_id: yatkeatId,
      status: 'COMPLETED',
      item_name: 'Official Jersey Pre-Order 2026',
      total_amount: 35.00,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
    });

    console.log('Successfully injected 3 transactions for Yat Keat (RM 8.50 deliveries + RM 35.00 sales)');

  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

run();
