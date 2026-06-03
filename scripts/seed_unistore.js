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
  { title: 'Enamel Pin Captain UniKL (Set of 3)', category: 'APPAREL', price: 30, desc: 'Official Captain UniKL enamel pin set. Includes 3 unique designs. Plastic material, 3cm dimension.', stock: 50, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=EnamelPin' },
  { title: 'Plush Toy Captain UniKL (With Box)', category: 'APPAREL', price: 70, desc: 'Premium crystal plush toy of Captain UniKL. 30-40cm dimension. Perfect for alumni or student gifts.', stock: 20, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=PlushToy' },
  { title: 'Key Chain Captain UniKL', category: 'APPAREL', price: 18, desc: 'PVC material key chain with lanyard. 7cm x 2.5cm dimension.', stock: 100, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=KeyChain' },
  { title: 'Balloon Captain UniKL', category: 'APPAREL', price: 10, desc: 'Aluminium foil balloon shaped like Captain UniKL. 55cm. Comes in a set of 5 for RM 40 or RM 10 each.', stock: 200, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=Balloon' },
  { title: 'Woven Bag Captain UniKL', category: 'APPAREL', price: 3, desc: 'Eco-friendly woven bag. 42cm x 32cm x 10cm. Great for groceries or carrying books.', stock: 150, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=WovenBag' },
  { title: 'UniKL Virtual Run Mask', category: 'APPAREL', price: 10, desc: 'Official face mask from the UniKL Virtual Run 2021. High-quality fabric.', stock: 50, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=RunMask' },
  { title: 'UniKL Virtual Run Medal', category: 'APPAREL', price: 20, desc: 'Commemorative medal from the UniKL Virtual Run 2021.', stock: 30, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=RunMedal' },
  { title: 'UniKL Virtual Run Race Bag', category: 'APPAREL', price: 13, desc: 'Drawstring race bag from the UniKL Virtual Run 2021. Durable and lightweight.', stock: 80, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=RaceBag' }
];

async function seed() {
  console.log("🚀 Starting UniStore Merch Injection...");
  
  const batch = db.batch();
  let count = 0;

  try {
    // We will bind these items to the SRC account so checkout works flawlessly
    const userRecord = await auth.getUserByEmail('src@unikl.edu.my');
    const userSnap = await db.collection('users').doc(userRecord.uid).get();
    
    if (!userSnap.exists) {
       console.log(`User src@unikl.edu.my doc not found in Firestore. Please ensure the user exists.`);
       process.exit(1);
    }
    const seller = userSnap.data();

    for (let item of unistoreItems) {
      const itemRef = db.collection('items').doc();
      batch.set(itemRef, {
        title: item.title,
        category: item.category,
        price: item.price,
        description: item.desc,
        seller_id: seller.uid,
        seller_name: 'UniStore Official', // Hard override for the premium branding
        is_official: true,
        stock_count: item.stock,
        status: 'active',
        governance_status: 'APPROVED', 
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        image_url: item.img
      });
      count++;
      console.log(`Prepared: ${item.title} (RM ${item.price})`);
    }

    await batch.commit();
    console.log(`✅ Successfully injected ${count} official UniStore items!`);
  } catch (e) {
    console.error(`Error during injection:`, e.message);
  }

  process.exit(0);
}

seed().catch(console.error);
