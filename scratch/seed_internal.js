const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

const DEMO_LISTINGS = [
    // --- TECH SOCIETY (Merchant/Club) ---
    {
        id: 'item_tech_1', seller_email: 'techsociety@s.unikl.edu.my', seller_name: 'MIIT Tech Club',
        title: 'Mechanical Keyboard K8', price: 120.00, stock_count: 5, domain: 'TECH', subcategory: 'Peripherals', governance_status: 'OPEN_MARKET',
        image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop',
        description: 'Brand new 75% mechanical keyboard with brown switches. Perfect for coding.',
        metadata: { specs: 'Brown Switches, RGB', warranty: 'Seller Warranty' }
    },
    {
        id: 'item_tech_3', seller_email: 'techsociety@s.unikl.edu.my', seller_name: 'MIIT Tech Club',
        title: 'Official IT Faculty Hoodie', price: 60.00, stock_count: 50, domain: 'APPAREL', subcategory: 'Official Merch', governance_status: 'OPEN_MARKET',
        image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop',
        description: 'The official 2026 IT Faculty hoodie. Pre-order now.',
        metadata: { size: 'Free Size', condition: 'Brand New' }
    },
    {
        id: 'item_tech_4', seller_email: 'techsociety@s.unikl.edu.my', seller_name: 'MIIT Tech Club',
        title: 'PC Formatting Service', price: 30.00, stock_count: 100, domain: 'SERVICES', subcategory: 'Tech Support', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=800&auto=format&fit=crop',
        description: 'Fast Windows 11 installation and formatting. Data backup included.',
        metadata: { duration_type: 'Per Session', available_slots: 'Weekdays 5PM-8PM' }
    },

    // --- SPORTS COUNCIL (Merchant/Club) ---
    {
        id: 'item_sports_1', seller_email: 'sports@s.unikl.edu.my', seller_name: 'Sports Council',
        title: 'Official Jersey Pre-Order 2026', price: 60.00, stock_count: 50, domain: 'APPAREL', subcategory: 'Official Merch', governance_status: 'OPEN_MARKET',
        image_url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=800&auto=format&fit=crop',
        description: 'Pre-order the official sports jersey. Closes in 2 days.',
        metadata: { size: 'Free Size', condition: 'Brand New' }
    },

    // --- CAFE RASA (Merchant) ---
    {
        id: 'item_cafe_1', seller_email: 'caferasa@s.unikl.edu.my', seller_name: 'Cafe Rasa',
        title: 'Nasi Lemak Ayam Berempah', price: 8.00, stock_count: 20, domain: 'HUNGER', subcategory: 'Campus Canteen', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1626804475297-4160ebcecbfa?q=80&w=800&auto=format&fit=crop',
        description: 'Freshly packed. Best seller.',
        metadata: { active_until: 'Today 2:00 PM', pickup_location: 'Cafe Rasa Lobby' }
    },
    {
        id: 'item_cafe_2', seller_email: 'caferasa@s.unikl.edu.my', seller_name: 'Cafe Rasa',
        title: 'Iced Caramel Latte', price: 7.00, stock_count: 30, domain: 'HUNGER', subcategory: 'Snacks & Drinks', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=800&auto=format&fit=crop',
        description: 'Perfect for a hot day between classes.',
        metadata: { active_until: 'Today 5:00 PM', pickup_location: 'Cafe Rasa Counter' }
    },

    // --- AMIRUL (Student) ---
    {
        id: 'item_amirul_1', seller_email: 'amirul@s.unikl.edu.my', seller_name: 'Amirul',
        title: 'Engineering Math Textbook', price: 40.00, stock_count: 1, domain: 'ACADEMIC', subcategory: 'Textbooks', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop',
        description: 'Used for 1 semester. Very good condition, no highlights.',
        metadata: { department: 'Engineering', year_semester: 'Year 1' }
    },

    // --- SARAH (Student) ---
    {
        id: 'item_sarah_1', seller_email: 'sarah@s.unikl.edu.my', seller_name: 'Sarah',
        title: 'Preloved Zara Denim Jacket', price: 40.00, stock_count: 1, domain: 'APPAREL', subcategory: 'Preloved Clothes', governance_status: 'OPEN_MARKET',
        image_url: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=800&auto=format&fit=crop',
        description: 'Worn twice. Excellent condition.',
        metadata: { size: 'M', condition: 'Like New' }
    }
];

const DEMO_CAMPAIGNS = [
    {
        id: 'camp_1',
        status: 'active',
        seller_email: 'sports@s.unikl.edu.my',
        club_name: 'Sports Council',
        title: 'Official Jersey Pre-Order 2026',
        tag: 'Merchandise',
        urgency: 'Ends in 2 Days',
        cta: 'Pre-Order Now',
        image_url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=800&auto=format&fit=crop'
    },
    {
        id: 'camp_2',
        status: 'active',
        seller_email: 'techsociety@s.unikl.edu.my',
        club_name: 'MIIT Tech Club',
        title: 'Developer Summit Tickets',
        tag: 'Event',
        urgency: 'Only 15 Left',
        cta: 'Book Seat',
        image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop'
    }
];

async function seedInternal() {
  console.log("🚀 Starting internal data injection...");
  const uidCache = {};

  for (const item of DEMO_LISTINGS) {
    try {
      if (!uidCache[item.seller_email]) {
         const user = await admin.auth().getUserByEmail(item.seller_email);
         uidCache[item.seller_email] = user.uid;
      }
      const actualUid = uidCache[item.seller_email];
      
      await db.collection("items").doc(item.id).set({
          ...item,
          seller_id: actualUid,
          status: 'active',
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Injected item: ${item.title}`);
    } catch(e) {
      console.log(`⚠️ Failed to inject ${item.title}: ${e.message}`);
    }
  }

  for (const camp of DEMO_CAMPAIGNS) {
    try {
      if (!uidCache[camp.seller_email]) {
         const user = await admin.auth().getUserByEmail(camp.seller_email);
         uidCache[camp.seller_email] = user.uid;
      }
      const actualUid = uidCache[camp.seller_email];
      
      await db.collection("campaigns").doc(camp.id).set({
          ...camp,
          seller_id: actualUid,
          created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Injected campaign: ${camp.title}`);
    } catch(e) {
      console.log(`⚠️ Failed to inject campaign ${camp.title}: ${e.message}`);
    }
  }
}

seedInternal().then(() => {
  console.log("🎉 Internal data injection complete.");
  process.exit(0);
});
