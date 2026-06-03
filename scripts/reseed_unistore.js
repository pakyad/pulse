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
const auth = admin.auth();

const unistoreItems = [
  {
    title: 'Plush Toy Captain UniKL',
    category: 'APPAREL',
    price: 60,
    desc: `Brand: Yayasan UniKL C103 (1st Generation)\nMaterial: Crystal plush\nDimension: 30-40 cm\nPrice: RM60.00 (no box) / RM 70.00 (with box)`,
    stock: 20,
    img: '/images/unistore/cropped_plush_toy.png'
  },
  {
    title: 'Key Chain Captain UniKL',
    category: 'APPAREL',
    price: 18,
    desc: `Brand: Yayasan UniKL C101 (1st Generation)\nMaterial: PVC\nDimension: 7cm x 2.5cm x 2cm / 70 x 31 x 20 mm\nPrice: RM18.00 each`,
    stock: 100,
    img: '/images/unistore/cropped_keychain.png'
  },
  {
    title: 'Enamel Pin Captain UniKL',
    category: 'APPAREL',
    price: 12,
    desc: `Brand: Yayasan UniKL C102 (1st Generation)\nMaterial: Plastic\nDimension: 3cm\nPrice: RM12.00 each / RM30.00 3 pcs in set`,
    stock: 50,
    img: '/images/unistore/cropped_enamel_pin.png'
  },
  {
    title: 'Balloon Captain UniKL',
    category: 'APPAREL',
    price: 10,
    desc: `Brand: Yayasan UniKL C104 (1st Generation)\nMaterial: Aluminum Foil\nDimension: 55cm\nPrice: RM10.00 each / RM 40.00 for 5 pcs`,
    stock: 200,
    img: 'https://api.dicebear.com/7.x/shapes/svg?seed=Balloon' // No image was provided by the user
  },
  {
    title: 'Woven Bag Captain UniKL',
    category: 'APPAREL',
    price: 3,
    desc: `Brand: Yayasan UniKL C105 (1st Generation)\nMaterial: Woven\nDimension: 42cm (W) 32cm (H) 10cm\nPrice: RM3.00 each / RM 25.00 for 10 pcs`,
    stock: 150,
    img: '/images/unistore/cropped_woven_bag.png'
  },
  {
    title: 'UniKL Virtual Run Mask',
    category: 'APPAREL',
    price: 10,
    desc: 'Official face mask from the UniKL Virtual Run 2021. High-quality fabric.',
    stock: 50,
    img: '/images/unistore/mask.png'
  },
  {
    title: 'UniKL Virtual Run Medal',
    category: 'APPAREL',
    price: 20,
    desc: 'Commemorative medal from the UniKL Virtual Run 2021.',
    stock: 30,
    img: '/images/unistore/medal.png'
  },
  {
    title: 'UniKL Virtual Run Race Bag',
    category: 'APPAREL',
    price: 13,
    desc: 'Drawstring race bag from the UniKL Virtual Run 2021. Durable and lightweight.',
    stock: 80,
    img: '/images/unistore/race_bag.png'
  }
];

async function seed() {
  console.log("🚀 Starting UniStore Overhaul...");
  
  const batch = db.batch();

  try {
    // 1. Delete all existing official items to prevent duplicates
    const oldItemsSnap = await db.collection('items').where('is_official', '==', true).get();
    console.log(`Deleting ${oldItemsSnap.size} old official items...`);
    oldItemsSnap.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 2. Fetch the UniStore admin user
    const userRecord = await auth.getUserByEmail('src@unikl.edu.my');
    const userSnap = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userSnap.exists) {
       console.log(`User src@unikl.edu.my doc not found.`);
       process.exit(1);
    }
    const seller = userSnap.data();

    // 3. Inject new items with exact descriptions and sort_order
    let count = 0;
    for (let i = 0; i < unistoreItems.length; i++) {
      const item = unistoreItems[i];
      const itemRef = db.collection('items').doc();
      batch.set(itemRef, {
        title: item.title,
        category: item.category,
        price: item.price,
        description: item.desc,
        seller_id: seller.uid,
        seller_name: 'UniStore Official',
        is_official: true,
        stock_count: item.stock,
        status: 'active',
        governance_status: 'APPROVED', 
        // We use sort_order to explicitly control the left-to-right order 
        sort_order: i,
        // We also stagger created_at just in case any UI still sorts by it
        created_at: new Date(Date.now() - i * 10000), 
        image_url: item.img
      });
      count++;
    }

    await batch.commit();
    console.log(`✅ Successfully injected ${count} perfectly ordered UniStore items!`);
  } catch (e) {
    console.error(`Error during injection:`, e.message);
  }

  process.exit(0);
}

seed().catch(console.error);
