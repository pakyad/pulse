import admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function initialize() {
  if (admin.apps.length > 0) return admin.apps[0]!;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin Credentials in .env.local");
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

const app = initialize();
const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

const EMAILS = [
  "iyadmohmadnazri@s.unikl.edu.my",
  "muhaimi@s.unikl.edu.my",
  "amiruls@s.unikl.edu.my",
  "irfan@s.unikl.edu.my",
  "sports@s.unikl.edu.my",
  "techsociety@s.unikl.edu.my"
];

async function prepareDemo() {
  console.log(" Starting Demo Preparation Script...");

  const userMap: Record<string, string> = {};

  // 0. Fetch UIDs
  console.log(" [0] Fetching user UIDs...");
  const usersRef = db.collection("users");
  for (const email of EMAILS) {
    const snap = await usersRef.where("email", "==", email).get();
    if (!snap.empty) {
      userMap[email] = snap.docs[0].id;
      console.log(`     Found ${email}: ${userMap[email]}`);
    } else {
      console.error(`     CRITICAL: User not found for ${email}`);
      process.exit(1);
    }
  }

  const iyadUid = userMap["iyadmohmadnazri@s.unikl.edu.my"];
  const muhaimiUid = userMap["muhaimi@s.unikl.edu.my"];
  const amirulUid = userMap["amiruls@s.unikl.edu.my"];
  const irfanUid = userMap["irfan@s.unikl.edu.my"];
  const techUid = userMap["techsociety@s.unikl.edu.my"];

  // STEP 1 - Clean up test data
  console.log(" [1] Cleaning up test data...");
  
  // Orders cleanup
  const ordersToDelete = await db.collection("orders")
    .get();
  let deletedOrders = 0;
  for (const doc of ordersToDelete.docs) {
    const data = doc.data();
    if (data.title?.includes("Razer DeathAdder") || data.price > 10000 || data.total > 10000) {
      await doc.ref.delete();
      deletedOrders++;
    }
  }
  console.log(`     Deleted ${deletedOrders} test orders.`);

  // Items cleanup
  const itemsToDelete = await db.collection("items").get();
  let deletedItems = 0;
  for (const doc of itemsToDelete.docs) {
    const data = doc.data();
    if (data.title?.toLowerCase().includes("test") || data.price > 5000) {
      await doc.ref.delete();
      deletedItems++;
    }
  }
  console.log(`     Deleted ${deletedItems} test items.`);

  // STEP 2 - Add 3 clean items for techsociety
  console.log(" [2] Adding clean items for Tech Society...");
  const newItems = [
    { 
      title: "Raspberry Pi 4 Model B 8GB", 
      price: 220, 
      stock_count: 5, 
      category: "TECH", 
      subcategory: "Single Board Computers", 
      seller_id: techUid, 
      seller_name: "Tech Society", 
      status: "ACTIVE", 
      merchant: true, 
      pcs_certified: true, 
      pcs_status: "APPROVED", 
      pcs_market_price: 280, 
      pcs_max_allowed: 252, 
      description: "Brand new sealed. Perfect for IoT and CS projects.", 
      drop_off_location: "Level 8 Database Labs", 
      image_url: "https://images.unsplash.com/photo-1629739884842-c33501657df5?q=80&w=800&auto=format&fit=crop", 
      created_at: serverTimestamp() 
    },
    { 
      title: "Arduino Uno Starter Kit", 
      price: 85, 
      stock_count: 15, 
      category: "TECH", 
      subcategory: "Microcontrollers", 
      seller_id: techUid, 
      seller_name: "Tech Society", 
      status: "ACTIVE", 
      merchant: true, 
      pcs_certified: true, 
      pcs_status: "APPROVED", 
      pcs_market_price: 110, 
      pcs_max_allowed: 99, 
      description: "Complete kit with components and manual. Great for beginners.", 
      drop_off_location: "Level 8 Database Labs", 
      image_url: "https://images.unsplash.com/photo-1553406830-ef2513450d76?q=80&w=800&auto=format&fit=crop", 
      created_at: serverTimestamp() 
    },
    { 
      title: "Mechanical Keyboard Keychron K2", 
      price: 280, 
      stock_count: 3, 
      category: "TECH", 
      subcategory: "Peripherals", 
      seller_id: techUid, 
      seller_name: "Tech Society", 
      status: "ACTIVE", 
      merchant: true, 
      pcs_certified: true, 
      pcs_status: "APPROVED", 
      pcs_market_price: 350, 
      pcs_max_allowed: 315, 
      description: "RGB backlit hot-swappable switches. Used 3 months only.", 
      drop_off_location: "Level 8 Database Labs", 
      image_url: "https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop", 
      created_at: serverTimestamp() 
    }
  ];

  for (const it of newItems) {
    await db.collection("items").add(it);
  }

  // STEP 3 - Add 5 DELIVERED orders
  console.log(" [3] Adding delivered orders for analytics...");
  const buyers = [
    { id: iyadUid, name: "Iyad" },
    { id: muhaimiUid, name: "Muhaimi" },
    { id: amirulUid, name: "Amirul" },
    { id: iyadUid, name: "Iyad" },
    { id: muhaimiUid, name: "Muhaimi" }
  ];

  for (const buyer of buyers) {
    await db.collection("orders").add({
      title: "Arduino Uno Starter Kit",
      price: 85,
      total: 85,
      status: "DELIVERED",
      buyer_id: buyer.id,
      seller_id: techUid,
      runner_id: irfanUid,
      seller_name: "Tech Society",
      customer_name: buyer.name,
      drop_off_location: "Level 8 Database Labs",
      delivered_at: serverTimestamp(),
      created_at: serverTimestamp()
    });
  }

  // STEP 4 - Add 2 PENDING orders
  console.log(" [4] Adding pending orders for live demo...");
  await db.collection("orders").add({ 
    title: "Raspberry Pi 4 Model B 8GB", 
    price: 220, 
    total: 220, 
    status: "PENDING", 
    buyer_id: iyadUid, 
    seller_id: techUid, 
    runner_id: irfanUid, 
    customer_name: "Iyad", 
    seller_name: "Tech Society", 
    drop_off_location: "Level 4 Teater Perdana", 
    created_at: serverTimestamp() 
  });
  await db.collection("orders").add({ 
    title: "Mechanical Keyboard Keychron K2", 
    price: 280, 
    total: 280, 
    status: "READY", 
    buyer_id: muhaimiUid, 
    seller_id: techUid, 
    runner_id: irfanUid, 
    customer_name: "Muhaimi", 
    seller_name: "Tech Society", 
    drop_off_location: "Ground Floor Lobby", 
    created_at: serverTimestamp() 
  });

  // STEP 5 - Add 5 items for Price Review
  console.log(" [5] Adding items for price review...");
  const flagItems = [
    { title: "iPhone 15 Pro Max 256GB", listed_price: 5500, market_price: 4800, max_allowed: 4320, seller_id: iyadUid, status: "PENDING_REVIEW", flagged_at: serverTimestamp() },
    { title: "Sony WH-1000XM5 Headphones", listed_price: 1800, market_price: 1399, max_allowed: 1259, seller_id: muhaimiUid, status: "PENDING_REVIEW", flagged_at: serverTimestamp() },
    { title: "MacBook Air M2 8GB", listed_price: 5200, market_price: 4499, max_allowed: 4049, seller_id: amirulUid, status: "PENDING_REVIEW", flagged_at: serverTimestamp() },
    { title: "DJI Mini 3 Pro Drone", listed_price: 3200, market_price: 2799, max_allowed: 2519, seller_id: iyadUid, status: "PENDING_REVIEW", flagged_at: serverTimestamp() },
    { title: "Samsung Galaxy Tab S9", listed_price: 2800, market_price: 2299, max_allowed: 2069, seller_id: muhaimiUid, status: "PENDING_REVIEW", flagged_at: serverTimestamp() }
  ];
  for (const it of flagItems) {
    await db.collection("price_reviews").add(it); // Assuming collection name is price_reviews or matching existing schema
  }

  // STEP 6 - Add 3 appeals
  console.log(" [6] Adding appeals...");
  const appeals = [
    { itemTitle: "iPhone 15 Pro Max 256GB", reason: "Bought from Apple Store with receipt. Fair resale value for campus.", seller_id: iyadUid, status: "PENDING", type: "PRICE_APPEAL", created_at: serverTimestamp() },
    { itemTitle: "Sony WH-1000XM5 Headphones", reason: "Limited edition colorway, not available in Malaysia retail.", seller_id: muhaimiUid, status: "PENDING", type: "PRICE_APPEAL", created_at: serverTimestamp() },
    { itemTitle: "MacBook Air M2 8GB", reason: "Upgraded RAM after purchase. Price reflects upgraded specs.", seller_id: amirulUid, status: "PENDING", type: "PRICE_APPEAL", created_at: serverTimestamp() }
  ];
  for (const it of appeals) {
    await db.collection("appeals").add(it);
  }

  // STEP 7 - Add 2 disputes
  console.log(" [7] Adding disputes...");
  const disputes = [
    { orderId: "demo1", buyerId: iyadUid, sellerId: techUid, title: "Wrong item delivered", description: "Ordered Raspberry Pi 4 8GB but received 4GB version.", status: "OPEN", amount: 220, created_at: serverTimestamp() },
    { orderId: "demo2", buyerId: muhaimiUid, sellerId: techUid, title: "Item not as described", description: "Keyboard switches are not hot-swappable as listed.", status: "OPEN", amount: 280, created_at: serverTimestamp() }
  ];
  for (const it of disputes) {
    await db.collection("disputes").add(it);
  }

  console.log(" DEMO PREPARATION COMPLETE!");
}

prepareDemo().then(() => process.exit(0)).catch(err => {
  console.error("FAILED:", err);
  process.exit(1);
});
