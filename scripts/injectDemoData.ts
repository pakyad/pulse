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

const EMAILS = [
  "iyadmohmadnazri@s.unikl.edu.my",
  "muhaimi@s.unikl.edu.my",
  "amiruls@s.unikl.edu.my",
  "irfan@s.unikl.edu.my",
  "sports@s.unikl.edu.my",
  "techsociety@s.unikl.edu.my"
];

async function inject() {
  console.log("🚀 Starting data injection...");

  const userMap: Record<string, string> = {};

  // 1. Get UIDs
  console.log("🔍 Fetching user UIDs...");
  const usersRef = db.collection("users");
  for (const email of EMAILS) {
    const snap = await usersRef.where("email", "==", email).get();
    if (!snap.empty) {
      userMap[email] = snap.docs[0].id;
      console.log(`✅ Found ${email}: ${userMap[email]}`);
    } else {
      console.warn(`⚠️ User not found for ${email}, using mock UID`);
      userMap[email] = `MOCK_${email.split('@')[0].toUpperCase()}`;
    }
  }

  const iyadUid = userMap["iyadmohmadnazri@s.unikl.edu.my"];
  const muhaimiUid = userMap["muhaimi@s.unikl.edu.my"];
  const amirulUid = userMap["amiruls@s.unikl.edu.my"];
  const irfanUid = userMap["irfan@s.unikl.edu.my"];
  const sportsUid = userMap["sports@s.unikl.edu.my"];
  const techUid = userMap["techsociety@s.unikl.edu.my"];

  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  // 2. ITEMS
  console.log("📦 Injecting ITEMS...");
  const items = [
    { title: "Badminton Racket Yonex Astrox 77", price: 180, stock_count: 8, category: "SPORTS", subcategory: "Racket Sports", seller_id: sportsUid, seller_name: "Sports Council", status: "ACTIVE", merchant: true, pcs_certified: true, pcs_status: "APPROVED", pcs_market_price: 220, pcs_max_allowed: 198, description: "Lightly used, excellent condition. Comes with original cover.", drop_off_location: "Ground Floor Lobby", created_at: timestamp },
    { title: "Official UniKL MIIT Jersey 2026", price: 45, stock_count: 50, category: "APPAREL", subcategory: "Jerseys", seller_id: sportsUid, seller_name: "Sports Council", status: "ACTIVE", merchant: true, pcs_certified: true, pcs_status: "APPROVED", pcs_market_price: 65, pcs_max_allowed: 58, description: "Official 2026 sports jersey. Available in all sizes.", drop_off_location: "Ground Floor Lobby", created_at: timestamp },
    { title: "Swimming Goggles Speedo Biofuse", price: 55, stock_count: 12, category: "SPORTS", subcategory: "Swimming", seller_id: sportsUid, seller_name: "Sports Council", status: "ACTIVE", merchant: true, pcs_certified: true, pcs_status: "APPROVED", pcs_market_price: 75, pcs_max_allowed: 67, description: "Brand new sealed. Anti-fog lenses.", drop_off_location: "Ground Floor Lobby", created_at: timestamp },
    { title: "Raspberry Pi 4 Model B 8GB", price: 220, stock_count: 3, category: "TECH", subcategory: "Single Board Computers", seller_id: techUid, seller_name: "Tech Society", status: "ACTIVE", merchant: true, pcs_certified: true, pcs_status: "APPROVED", pcs_market_price: 280, pcs_max_allowed: 252, description: "Brand new sealed box. Great for IoT projects.", drop_off_location: "Level 8 Database Labs", created_at: timestamp },
    { title: "Arduino Uno Starter Kit", price: 85, stock_count: 15, category: "TECH", subcategory: "Microcontrollers", seller_id: techUid, seller_name: "Tech Society", status: "ACTIVE", merchant: true, pcs_certified: true, pcs_status: "APPROVED", pcs_market_price: 110, pcs_max_allowed: 99, description: "Complete kit with components, cables and manual.", drop_off_location: "Level 8 Database Labs", created_at: timestamp },
    { title: "Mechanical Keyboard Keychron K2", price: 280, stock_count: 2, category: "TECH", subcategory: "Peripherals", seller_id: techUid, seller_name: "Tech Society", status: "ACTIVE", merchant: true, pcs_certified: true, pcs_status: "APPROVED", pcs_market_price: 350, pcs_max_allowed: 315, description: "RGB backlit, hot-swappable switches. Used 3 months.", drop_off_location: "Level 8 Database Labs", created_at: timestamp },
    { title: "Casio FX-570EX Scientific Calculator", price: 48, stock_count: 20, category: "ACADEMIC", subcategory: "Calculators", seller_id: iyadUid, seller_name: "Iyad", status: "ACTIVE", merchant: false, pcs_certified: true, pcs_status: "APPROVED", pcs_market_price: 65, pcs_max_allowed: 58, description: "Perfect condition. Required for engineering subjects.", drop_off_location: "Level 4 Teater Perdana", created_at: timestamp },
    { title: "A4 Lecture Notes Bundle - Sem 1", price: 25, stock_count: 30, category: "ACADEMIC", subcategory: "Notes", seller_id: muhaimiUid, seller_name: "Muhaimi", status: "ACTIVE", merchant: false, pcs_certified: false, pcs_status: "FREE_MARKET", description: "Complete sem 1 notes, all subjects. Printed and bound.", drop_off_location: "Level 4 Teater Perdana", created_at: timestamp },
  ];

  for (const item of items) {
    await db.collection("items").add(item);
  }

  // 3. ORDERS
  console.log("🛒 Injecting ORDERS...");
  const createDelivered = (b: string, s: string, r: string, t: string, p: number) => ({
    title: t, price: p, total: p, status: "DELIVERED", buyer_id: b, seller_id: s, runner_id: r,
    customer_name: "Student", seller_name: "Merchant", drop_off_location: "Campus Hub",
    delivery_method: "runner", created_at: timestamp, delivered_at: timestamp
  });

  for (let i=0; i<5; i++) await db.collection("orders").add(createDelivered(iyadUid, sportsUid, irfanUid, "Official UniKL MIIT Jersey 2026", 45));
  for (let i=0; i<3; i++) await db.collection("orders").add(createDelivered(amirulUid, techUid, irfanUid, "Arduino Uno Starter Kit", 85));
  for (let i=0; i<2; i++) await db.collection("orders").add(createDelivered(muhaimiUid, sportsUid, irfanUid, "Badminton Racket Yonex Astrox 77", 180));
  for (let i=0; i<3; i++) await db.collection("orders").add({ title: "Raspberry Pi 4 Model B 8GB", price: 220, total: 220, status: "PENDING", buyer_id: iyadUid, seller_id: techUid, customer_name: "Iyad", created_at: timestamp });
  for (let i=0; i<2; i++) await db.collection("orders").add({ title: "Swimming Goggles Speedo Biofuse", price: 55, total: 55, status: "PREPARING", buyer_id: amirulUid, seller_id: sportsUid, customer_name: "Amirul", created_at: timestamp });
  for (let i=0; i<2; i++) await db.collection("orders").add({ title: "Mechanical Keyboard Keychron K2", price: 280, total: 280, status: "READY", buyer_id: muhaimiUid, seller_id: techUid, runner_id: irfanUid, created_at: timestamp });
  for (let i=0; i<3; i++) await db.collection("orders").add(createDelivered(amirulUid, iyadUid, irfanUid, "Casio FX-570EX Scientific Calculator", 48));

  // 4. FLAGGED ITEMS (Prompt says PriceGuidelines, but these are flagged items for Price Review)
  console.log("🚩 Injecting FLAGGED ITEMS...");
  const flagged = [
    { title: "iPhone 15 Pro Max 256GB", price: 5500, listed_price: 5500, market_price: 4800, max_allowed: 4320, seller_id: iyadUid, status: "active", is_price_flagged: true, flagged_at: timestamp, category: "TECH", created_at: timestamp },
    { title: "Sony WH-1000XM5 Headphones", price: 1800, listed_price: 1800, market_price: 1399, max_allowed: 1259, seller_id: muhaimiUid, status: "active", is_price_flagged: true, flagged_at: timestamp, category: "TECH", created_at: timestamp },
    { title: "MacBook Air M2 8GB", price: 5200, listed_price: 5200, market_price: 4499, max_allowed: 4049, seller_id: amirulUid, status: "active", is_price_flagged: true, flagged_at: timestamp, category: "TECH", created_at: timestamp },
    { title: "Nike Air Jordan 1 Retro", price: 950, listed_price: 950, market_price: 750, max_allowed: 675, seller_id: iyadUid, status: "active", is_price_flagged: true, flagged_at: timestamp, category: "APPAREL", created_at: timestamp },
    { title: "Dyson V12 Vacuum", price: 3200, listed_price: 3200, market_price: 2499, max_allowed: 2249, seller_id: muhaimiUid, status: "active", is_price_flagged: true, flagged_at: timestamp, category: "TECH", created_at: timestamp },
  ];
  for (const f of flagged) {
    await db.collection("items").add(f);
  }

  // 5. APPEALS
  console.log("⚖️ Injecting APPEALS...");
  const appeals = [
    { itemTitle: "iPhone 15 Pro Max 256GB", reason: "I bought this at full price from Apple Store, receipt attached. Fair resale price.", seller_id: iyadUid, status: "PENDING", type: "PRICE_APPEAL", created_at: timestamp },
    { itemTitle: "Sony WH-1000XM5 Headphones", reason: "Limited edition colorway not available in Malaysia. Price reflects scarcity.", seller_id: muhaimiUid, status: "PENDING", type: "PRICE_APPEAL", created_at: timestamp },
    { itemTitle: "MacBook Air M2 8GB", reason: "Upgraded RAM to 16GB after purchase, increasing value.", seller_id: amirulUid, status: "PENDING", type: "PRICE_APPEAL", created_at: timestamp },
    { itemTitle: "Nike Air Jordan 1 Retro", reason: "DS deadstock pair with original receipt. Resale market price is RM950.", seller_id: iyadUid, status: "PENDING", type: "PRICE_APPEAL", created_at: timestamp },
    { itemTitle: "Dyson V12 Vacuum", reason: "Bought as a gift, never used. Original price was RM3200 from Dyson Malaysia.", seller_id: muhaimiUid, status: "PENDING", type: "PRICE_APPEAL", created_at: timestamp },
  ];
  for (const a of appeals) {
    await db.collection("appeals").add(a);
  }

  // 6. DISPUTES
  console.log("🚫 Injecting DISPUTES...");
  const disputes = [
    { orderId: "demo1", buyerId: iyadUid, sellerId: sportsUid, title: "Item not as described", description: "Jersey received has a tear on the collar. Photos attached.", status: "OPEN", amount: 45, created_at: timestamp },
    { orderId: "demo2", buyerId: amirulUid, sellerId: techUid, title: "Wrong item delivered", description: "Ordered Arduino Uno but received Arduino Nano.", status: "OPEN", amount: 85, created_at: timestamp },
    { orderId: "demo3", buyerId: muhaimiUid, sellerId: sportsUid, title: "Item never arrived", description: "Runner marked as delivered but I never received the racket.", status: "OPEN", amount: 180, created_at: timestamp },
  ];
  for (const d of disputes) {
    await db.collection("disputes").add(d);
  }

  // 7. REVIEWS
  console.log("⭐ Injecting REVIEWS...");
  const buyers = [iyadUid, muhaimiUid, amirulUid];
  const sellers = [sportsUid, techUid];
  const comments = ["Fast delivery, great product!", "Exactly as described, highly recommend", "Good seller, responsive communication", "Quality item at fair campus price"];

  for (let i=0; i<8; i++) {
    await db.collection("Reviews").add({
      buyerId: buyers[i % 3],
      sellerId: sellers[i % 2],
      rating: Math.floor(Math.random() * 2) + 4,
      comment: comments[i % 4],
      created_at: timestamp
    });
  }

  console.log("✨ Demo data injection complete!");
}

inject().catch(console.error);
