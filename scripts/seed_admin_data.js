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

async function seedData() {
  console.log("Starting data seeding for Admin Dashboard...");

  // 1. Seed Price Review Items
  const items = [
    {
      title: "PlayStation 5 Slim Edition",
      price: 2800,
      category: "TECH",
      subcategory: "Consoles",
      seller_id: "seller-101",
      seller_name: "Gamer Hub UniKL",
      is_price_flagged: true,
      price_flag_count: 8,
      report_count: 8,
      flag_source: "COMMUNITY",
      status: "active",
      governance_ceiling: 2500,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      title: "Bulk Indomie (20 Cartons)",
      price: 150,
      category: "HUNGER",
      subcategory: "Groceries",
      seller_id: "seller-105",
      seller_name: "Hostel Mart",
      is_price_flagged: true,
      price_flag_count: 3,
      report_count: 3,
      flag_source: "COMMUNITY",
      status: "active",
      governance_ceiling: 50,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  for (const item of items) {
    await db.collection("items").add(item);
  }
  console.log(`Seeded ${items.length} Price Review Items.`);

  // 2. Seed Disputes
  const disputes = [
    {
      reason: "Item arrived severely damaged",
      reporter_name: "Aliya Maisarah",
      status: "AWAITING_ADMIN",
      order_id: "order-991",
      seller_id: "seller-201",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      reason: "Runner marked as delivered but item missing",
      reporter_name: "Daniel Hakim",
      status: "AWAITING_ADMIN",
      order_id: "order-992",
      seller_id: "seller-202",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      reason: "Received wrong textbook edition",
      reporter_name: "Sarah Wong",
      status: "AWAITING_ADMIN",
      order_id: "order-993",
      seller_id: "seller-203",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      reason: "Seller refused to accept return for defective tech",
      reporter_name: "Kevin Raj",
      status: "AWAITING_ADMIN",
      order_id: "order-994",
      seller_id: "seller-204",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      reason: "Food was cold and packaging was broken",
      reporter_name: "Nurul Izzah",
      status: "AWAITING_ADMIN",
      order_id: "order-995",
      seller_id: "seller-205",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  for (const dispute of disputes) {
    await db.collection("disputes").add(dispute);
  }
  console.log(`Seeded ${disputes.length} Disputes.`);

  // 3. Seed Price Appeals
  const appeals = [
    {
      status: "PENDING",
      itemId: "item-appeal-1",
      itemTitle: "Custom Built Gaming PC (RTX 4080)",
      sellerName: "Tech Customizer",
      justification_text: "This is a custom built high-end PC with premium parts, not a standard laptop. The ceiling is too low for this tier of hardware.",
      price: 8500,
      category: "TECH",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      status: "PENDING",
      itemId: "item-appeal-2",
      itemTitle: "Rare Signed First Edition Textbook",
      sellerName: "Collector Books",
      justification_text: "It is a rare collector's item signed by the author, hence the premium pricing over standard academic books.",
      price: 450,
      category: "ACADEMIC",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      status: "PENDING",
      itemId: "item-appeal-3",
      itemTitle: "Designer Brand Hostel Decor Set",
      sellerName: "Chic Decor",
      justification_text: "Imported from Italy, full set of premium bedding and curtains.",
      price: 1200,
      category: "HOSTEL",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      status: "PENDING",
      itemId: "item-appeal-4",
      itemTitle: "Exclusive Club Anniversary Hoodie",
      sellerName: "Engineering Club",
      justification_text: "Special 10th-anniversary edition with high-quality embroidery and premium fabric.",
      price: 180,
      category: "APPAREL",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      status: "PENDING",
      itemId: "item-appeal-5",
      itemTitle: "Catered Feast for 50 Pax",
      sellerName: "Grand Catering",
      justification_text: "This is a bulk order for an entire event, not a single meal. Pricing reflects the volume.",
      price: 1250,
      category: "HUNGER",
      created_at: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  for (const appeal of appeals) {
    await db.collection("appeals").add(appeal);
  }
  console.log(`Seeded ${appeals.length} Price Appeals.`);

  // 4. Seed Activity Logs
  const logs = [
    {
      type: "POLICY_UPDATE",
      target_id: "TECH",
      details: "Updated TECH category hard ceiling to RM 3500",
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      type: "PRICE_BLOCK",
      target_id: "item-7712",
      details: "System automatically blocked listing 'MacBook Pro M1' priced at RM 6000",
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      type: "SUSPENSION",
      target_id: "user-883",
      details: "Suspended merchant access for 'Scam Store'",
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      type: "ADJUDICATION",
      target_id: "appeal-992",
      details: "Approved price appeal for 'Vintage Engineering Jacket'",
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    },
    {
      type: "ADJUDICATION",
      target_id: "dispute-102",
      details: "Resolved dispute via REFUND for order 'order-881'",
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    }
  ];

  for (const log of logs) {
    await db.collection("governance_logs").add(log);
  }
  console.log(`Seeded ${logs.length} Activity Logs.`);

  console.log("Seeding complete!");
}

seedData().catch(console.error);
