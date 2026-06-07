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

  // Use the admin.app.credential.cert style or fallback
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

// Try a different import style if the above fails in execution
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

async function seed() {
  console.log(" Starting demo data seed (Admin Mode)...");

  const userMap: Record<string, string> = {};

  // 1. Get UIDs for all emails
  console.log(" Fetching user UIDs...");
  const usersRef = db.collection("users");
  
  for (const email of EMAILS) {
    try {
      const snap = await usersRef.where("email", "==", email).get();
      if (!snap.empty) {
        userMap[email] = snap.docs[0].id;
        console.log(` Found ${email}: ${userMap[email]}`);
      } else {
        console.warn(` User not found for email: ${email}`);
        userMap[email] = `MOCK_${email.split('@')[0]}`;
      }
    } catch (e) {
      console.error(` Error fetching user ${email}:`, e);
      userMap[email] = `MOCK_${email.split('@')[0]}`;
    }
  }

  const sportsUid = userMap["sports@s.unikl.edu.my"];
  const techsocietyUid = userMap["techsociety@s.unikl.edu.my"];
  const iyadUid = userMap["iyadmohmadnazri@s.unikl.edu.my"];
  const muhaimiUid = userMap["muhaimi@s.unikl.edu.my"];
  const amirulUid = userMap["amiruls@s.unikl.edu.my"];
  const irfanUid = userMap["irfan@s.unikl.edu.my"];

  // 2. ITEMS Collection
  console.log(" Seeding ITEMS...");
  const items = [
    { title: "Official Sports Jersey 2026", price: 45, stock_count: 50, category: "APPAREL", seller_id: sportsUid, seller_name: "Sports Council", status: "ACTIVE", merchant: true, pcs_certified: true, pcs_status: "APPROVED", image_url: "", description: "Official UniKL MIIT Sports Council jersey for 2026. Limited edition.", drop_off_location: "Ground Floor Lobby", created_at: admin.firestore.FieldValue.serverTimestamp() },
    { title: "Badminton Racket - Yonex Astrox 77", price: 180, stock_count: 10, category: "SPORTS", seller_id: sportsUid, seller_name: "Sports Council", status: "ACTIVE", merchant: true, pcs_certified: true, pcs_status: "APPROVED", image_url: "", description: "Lightly used Yonex Astrox 77. Excellent condition.", drop_off_location: "Ground Floor Lobby", created_at: admin.firestore.FieldValue.serverTimestamp() },
    { title: "Raspberry Pi 4 Model B 8GB", price: 220, stock_count: 5, category: "TECH", seller_id: techsocietyUid, seller_name: "Tech Society", status: "ACTIVE", merchant: true, pcs_certified: true, pcs_status: "APPROVED", image_url: "", description: "Brand new sealed Raspberry Pi 4 8GB. Great for projects.", drop_off_location: "Level 8 Database Labs", created_at: admin.firestore.FieldValue.serverTimestamp() },
    { title: "Arduino Starter Kit", price: 85, stock_count: 15, category: "TECH", seller_id: techsocietyUid, seller_name: "Tech Society", status: "ACTIVE", merchant: true, pcs_certified: true, pcs_status: "APPROVED", image_url: "", description: "Complete Arduino starter kit with components.", drop_off_location: "Level 8 Database Labs", created_at: admin.firestore.FieldValue.serverTimestamp() }
  ];

  for (const item of items) {
    const docRef = await db.collection("items").add(item);
    console.log(`   Added item: ${item.title} (${docRef.id})`);
  }

  // 3. ORDERS Collection
  console.log(" Seeding ORDERS...");
  const orders = [
    { title: "Official Sports Jersey 2026", price: 45, total: 45, status: "DELIVERED", buyer_id: iyadUid, seller_id: sportsUid, runner_id: irfanUid, customer_name: "Iyad Mohmad Nazri", seller_name: "Sports Council", drop_off_location: "Level 4 Teater Perdana", delivery_method: "runner", created_at: admin.firestore.FieldValue.serverTimestamp(), delivered_at: admin.firestore.FieldValue.serverTimestamp() },
    { title: "Badminton Racket - Yonex Astrox 77", price: 180, total: 180, status: "DELIVERED", buyer_id: amirulUid, seller_id: sportsUid, runner_id: irfanUid, customer_name: "Amirul", seller_name: "Sports Council", drop_off_location: "Ground Floor Lobby", delivery_method: "runner", created_at: admin.firestore.FieldValue.serverTimestamp(), delivered_at: admin.firestore.FieldValue.serverTimestamp() },
    { title: "Raspberry Pi 4 Model B 8GB", price: 220, total: 220, status: "DELIVERED", buyer_id: iyadUid, seller_id: techsocietyUid, runner_id: irfanUid, customer_name: "Iyad Mohmad Nazri", seller_name: "Tech Society", drop_off_location: "Level 8 Database Labs", delivery_method: "runner", created_at: admin.firestore.FieldValue.serverTimestamp(), delivered_at: admin.firestore.FieldValue.serverTimestamp() },
    { title: "Arduino Starter Kit", price: 85, total: 85, status: "PENDING", buyer_id: muhaimiUid, seller_id: techsocietyUid, customer_name: "Muhaimi", seller_name: "Tech Society", drop_off_location: "Level 4 Teater Perdana", delivery_method: "runner", created_at: admin.firestore.FieldValue.serverTimestamp() },
    { title: "Official Sports Jersey 2026", price: 45, total: 45, status: "PREPARING", buyer_id: muhaimiUid, seller_id: sportsUid, customer_name: "Muhaimi", seller_name: "Sports Council", drop_off_location: "Ground Floor Lobby", delivery_method: "runner", created_at: admin.firestore.FieldValue.serverTimestamp() }
  ];

  const orderIds: string[] = [];
  for (const order of orders) {
    const docRef = await db.collection("orders").add(order);
    orderIds.push(docRef.id);
    console.log(`   Added order: ${order.title} (${docRef.id})`);
  }

  // 4. REVIEWS Collection
  console.log(" Seeding REVIEWS...");
  const reviews = [
    { orderId: orderIds[0], sellerId: sportsUid, buyerId: iyadUid, rating: 5, comment: "Fast delivery, jersey quality is excellent!", created_at: admin.firestore.FieldValue.serverTimestamp() },
    { orderId: orderIds[2], sellerId: techsocietyUid, buyerId: iyadUid, rating: 4, comment: "Good product, well packaged.", created_at: admin.firestore.FieldValue.serverTimestamp() }
  ];

  for (const review of reviews) {
    const docRef = await db.collection("Reviews").add(review);
    console.log(`   Added review for order ${review.orderId} (${docRef.id})`);
  }

  console.log(" Seed complete!");
}

seed().catch(console.error);
