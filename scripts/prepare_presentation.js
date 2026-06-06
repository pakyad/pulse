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

const USERS = [
  { email: 'admin@pulse.edu',    password: 'password123', role: 'ADMIN',   name: 'Pulse Admin', is_seller: false, is_runner: false, runner_status: 'none' },
  { email: 'student@pulse.edu',  password: 'password123', role: 'STUDENT', name: 'Adam Student', is_seller: false, is_runner: false, runner_status: 'none' },
  { email: 'merchant@pulse.edu', password: 'password123', role: 'STUDENT', name: 'Sarah Merchant', is_seller: true, is_runner: false, runner_status: 'none' },
  { email: 'runner@pulse.edu',   password: 'password123', role: 'STUDENT', name: 'Zack Runner', is_seller: false, is_runner: true, runner_status: 'approved' },
];

async function ensureUser(userDef) {
  try {
    const userRecord = await auth.getUserByEmail(userDef.email);
    console.log(`User ${userDef.email} exists: ${userRecord.uid}`);
    return userRecord.uid;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      const userRecord = await auth.createUser({
        email: userDef.email,
        password: userDef.password,
        displayName: userDef.name,
      });
      console.log(`Created user ${userDef.email}: ${userRecord.uid}`);
      
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: userDef.email,
        name: userDef.name,
        role: userDef.role,
        is_seller: userDef.is_seller,
        is_runner: userDef.is_runner,
        runner_status: userDef.runner_status,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      return userRecord.uid;
    }
    throw error;
  }
}

async function cleanGhostData() {
  console.log("🧹 Cleaning up ghost data from admin dashboard...");
  
  // Clean Disputes
  const disputes = await db.collection('disputes').get();
  for (let d of disputes.docs) {
    const data = d.data();
    if (!data.reporter_id || data.reporter_name === 'Unknown' || data.reporter_name === '—') {
      await d.ref.delete();
      console.log(`Deleted ghost dispute ${d.id}`);
    }
  }

  // Clean Appeals
  const appeals = await db.collection('appeals').get();
  for (let a of appeals.docs) {
    const data = a.data();
    if (!data.sellerId || data.sellerName === 'Unknown Seller') {
      await a.ref.delete();
      console.log(`Deleted ghost appeal ${a.id}`);
    }
  }

  // Clean Orders (Only the ones stuck with Unknown users in escrow)
  const orders = await db.collection('orders').get();
  for (let o of orders.docs) {
    const data = o.data();
    if (!data.buyer_id || data.seller_name === 'Unknown' || !data.seller_id) {
      await o.ref.delete();
      console.log(`Deleted ghost order ${o.id}`);
    }
  }

  // Clean Items (Only if seller is undefined)
  const items = await db.collection('items').get();
  for (let i of items.docs) {
    const data = i.data();
    if (!data.seller_id) {
      await i.ref.delete();
      console.log(`Deleted ghost item ${i.id}`);
    }
  }
}

async function seedPresentationState() {
  console.log("🚀 Ensuring Presentation Accounts Exist...");
  const adminId = await ensureUser(USERS[0]);
  const buyerId = await ensureUser(USERS[1]);
  const sellerId = await ensureUser(USERS[2]);
  const runnerId = await ensureUser(USERS[3]);

  await cleanGhostData();

  console.log("🌱 Seeding Presentation Data...");

  const batch = db.batch();

  // 1. Price Review "Bait" Listing (Flagged automatically due to price)
  const item1Ref = db.collection('items').doc('demo_item_ipad');
  batch.set(item1Ref, {
    title: 'iPad Pro M2 (1TB) with Magic Keyboard',
    category: 'TECH',
    price: 4500, // Tech ceiling is 3500 usually
    description: 'Pristine condition iPad Pro. Selling because I need to pay tuition fees immediately.',
    seller_id: sellerId,
    seller_name: USERS[2].name,
    status: 'active',
    is_price_flagged: true,
    flag_source: 'SYSTEM_AUDIT',
    report_count: 0,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800'
  });

  // 2. Pending Appeal
  const item2Ref = db.collection('items').doc('demo_item_sony');
  batch.set(item2Ref, {
    title: 'Sony WH-1000XM5 Headphones',
    category: 'TECH',
    price: 1500,
    description: 'Barely used noise-canceling headphones.',
    seller_id: sellerId,
    seller_name: USERS[2].name,
    status: 'HELD_FOR_REVISION',
    is_price_flagged: false,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800'
  });
  
  const appealRef = db.collection('appeals').doc('demo_appeal_sony');
  batch.set(appealRef, {
    itemId: 'demo_item_sony',
    itemTitle: 'Sony WH-1000XM5 Headphones',
    price: 1500,
    sellerId: sellerId,
    sellerName: USERS[2].name,
    justification_text: "The default ceiling for basic tech accessories is low, but these are premium headphones retailing at RM 1700. I am selling them almost brand new.",
    status: 'PENDING',
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });

  // 3. Escrow Locked Order
  const order1Ref = db.collection('orders').doc('demo_order_escrow');
  batch.set(order1Ref, {
    buyer_id: buyerId,
    buyer_name: USERS[1].name,
    seller_id: sellerId,
    seller_name: USERS[2].name,
    runner_id: runnerId,
    runner_name: USERS[3].name,
    status: 'DELIVERED',
    escrow_status: 'LOCKED',
    item_total: 120,
    runner_fee: 5,
    grand_total: 125,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    items: [{ title: 'Nike Air Force 1', price: 120, quantity: 1 }]
  });

  // 4. Disputed Order
  const order2Ref = db.collection('orders').doc('demo_order_disputed');
  batch.set(order2Ref, {
    buyer_id: buyerId,
    buyer_name: USERS[1].name,
    seller_id: sellerId,
    seller_name: USERS[2].name,
    runner_id: runnerId,
    runner_name: USERS[3].name,
    status: 'DELIVERED',
    escrow_status: 'LOCKED',
    item_total: 350,
    runner_fee: 10,
    grand_total: 360,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    items: [{ title: 'Keychron K8 Pro Keyboard', price: 350, quantity: 1 }]
  });

  const disputeRef = db.collection('disputes').doc('demo_dispute_keyboard');
  batch.set(disputeRef, {
    order_id: 'demo_order_disputed',
    reporter_id: buyerId,
    reporter_name: USERS[1].name,
    seller_id: sellerId,
    runner_id: runnerId,
    reason: "Item arrived with a broken switch and dented box. Runner denies dropping it.",
    status: 'AWAITING_ADMIN',
    created_at: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();

  console.log("✅ Database Seeded Successfully!");
  console.log("--------------------------------------------------");
  console.log("FYP2 PRESENTATION ACCOUNTS (Password: password123)");
  console.log("--------------------------------------------------");
  console.log("👑 ADMIN:    admin@pulse.edu");
  console.log("🛒 BUYER:    student@pulse.edu");
  console.log("🏪 SELLER:   merchant@pulse.edu");
  console.log("🏃 RUNNER:   runner@pulse.edu");
  console.log("--------------------------------------------------");

  process.exit(0);
}

seedPresentationState().catch(console.error);
