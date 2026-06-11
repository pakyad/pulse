import admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

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
const SERP_API_KEY = process.env.SERP_API_KEY;

// fetchGoogleImage has been removed to lock visuals.

const MOCK_ITEMS = [
  {
    title: "Thomas Calculus 14th Edition",
    category: "ACADEMIC",
    subcategory: "Textbooks & Reference Books",
    price: 85.00,
    seller_name: "Adam Q.",
    condition: "Used - Good",
    image_url: "https://plus.unsplash.com/premium_photo-1724266846347-bd10efdd330e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    title: "Casio fx-570EX ClassWiz",
    category: "ACADEMIC",
    subcategory: "Scientific Calculators",
    price: 60.00,
    seller_name: "Sarah Lim",
    condition: "Used - Like New",
    image_url: "https://plus.unsplash.com/premium_photo-1722124804439-f8ef7440d778?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    title: "White Lab Coat Size M",
    category: "ACADEMIC",
    subcategory: "Lab Equipment & Safety Gear",
    price: 25.00,
    seller_name: "Farhan Y.",
    condition: "Used - Good",
    image_url: "https://plus.unsplash.com/premium_photo-1673953886001-d866feca057f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    title: "A4 Sketchbook 135gsm",
    category: "ACADEMIC",
    subcategory: "Art & Studio Supplies",
    price: 15.00,
    seller_name: "Maya T.",
    condition: "New",
    image_url: "https://plus.unsplash.com/premium_photo-1664368832368-9d6b5f88a516?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    title: "UniKL Engineering Faculty Shirt",
    category: "APPAREL",
    subcategory: "Campus & Faculty Merch",
    price: 35.00,
    seller_name: "Ahmad F.",
    condition: "Used - Like New",
    image_url: "https://plus.unsplash.com/premium_photo-1718913936342-eaafff98834b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    title: "Maggi Hot Cup Curry (Box of 6)",
    category: "HOSTEL",
    subcategory: "Snacks & Instant Food",
    price: 12.00,
    seller_name: "Hostel Mart",
    condition: "New",
    image_url: "https://plus.unsplash.com/premium_photo-1675435644687-562e8042b9db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    title: "Mini Desk Fan USB",
    category: "HOSTEL",
    subcategory: "Cooling & Ventilation",
    price: 18.00,
    seller_name: "Daniel R.",
    condition: "Used - Good",
    image_url: "https://plus.unsplash.com/premium_photo-1774048160942-70487d02f336?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    title: "Pineng Power Bank 10000mAh",
    category: "TECH",
    subcategory: "Power Banks & Chargers",
    price: 40.00,
    seller_name: "Lisa Wong",
    condition: "Used - Good",
    image_url: "https://plus.unsplash.com/premium_photo-1686743401891-bdfc1afe923e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    title: "SanDisk Cruzer Glide 64GB",
    category: "TECH",
    subcategory: "Storage & Drives",
    price: 20.00,
    seller_name: "Kevin T.",
    condition: "New",
    image_url: "https://plus.unsplash.com/premium_photo-1726837308560-cb371e1cbb16?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    title: "Format Laptop & Reinstall Windows 11",
    category: "SERVICES",
    subcategory: "IT Support & Repair",
    price: 50.00,
    seller_name: "Tech Guru Sam",
    condition: "Service",
    image_url: "https://plus.unsplash.com/premium_photo-1681302427948-2fd0eca629b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    title: "Campbell Biology 12th Edition",
    category: "ACADEMIC",
    subcategory: "Textbooks & Reference Books",
    price: 120.00,
    seller_name: "Sarah Lim",
    condition: "Used - Good",
    image_url: "https://m.media-amazon.com/images/I/81xU2W0mXTL._AC_UF1000,1000_QL80_.jpg"
  },
  {
    title: "Texas Instruments TI-84 Plus CE Graphing Calculator",
    category: "ACADEMIC",
    subcategory: "Scientific Calculators",
    price: 350.00,
    seller_name: "Adam Q.",
    condition: "Used - Like New",
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/TI-84_Plus_CE.png/1200px-TI-84_Plus_CE.png"
  },
  {
    title: "Engineering Drafting Tool Set (Compass & Rulers)",
    category: "ACADEMIC",
    subcategory: "Art & Studio Supplies",
    price: 45.00,
    seller_name: "Maya T.",
    condition: "New",
    image_url: "https://images.unsplash.com/photo-1611078519129-9e8c47f3b89b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    title: "Medical Scrubs Dark Blue Size L",
    category: "ACADEMIC",
    subcategory: "Lab Equipment & Safety Gear",
    price: 60.00,
    seller_name: "Farhan Y.",
    condition: "New",
    image_url: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  },
  {
    title: "Organic Chemistry Molecular Model Kit",
    category: "ACADEMIC",
    subcategory: "Lab Equipment & Safety Gear",
    price: 80.00,
    seller_name: "Ahmad F.",
    condition: "Used - Like New",
    image_url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
  }
];

async function seedStudentMarket() {
  console.log("Seeding 15 authentic Student Market listings...");
  
  for (const item of MOCK_ITEMS) {
    console.log(`\nCreating listing: ${item.title}`);
    
    // Using hardcoded locked image URL instead of Google Image Search
    const imageUrl = item.image_url;
    
    const listingRef = db.collection("items").doc();
    
    // Add logic to fake PCS verification if the item is typically regulated
    // Textbooks, Calculators, Lab gear are comparable: true
    const requiresPCS = ["Textbooks & Reference Books", "Scientific Calculators", "Lab Equipment & Safety Gear"].includes(item.subcategory);
    
    await listingRef.set({
      id: listingRef.id,
      title: item.title,
      price: item.price,
      seller_id: "mock_student_seller",
      seller_name: item.seller_name,
      category: item.category,
      subcategory: item.subcategory,
      condition: item.condition,
      image_url: imageUrl,
      images: [imageUrl],
      status: "ACTIVE",
      stock_count: 1,
      is_official: false,
      pcs_certified: requiresPCS,
      pcs_status: requiresPCS ? "APPROVED" : "FREE_MARKET",
      time_ago: "Just now",
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`✅ Seeded successfully with locked image`);
  }
  
  console.log("\nStudent Market Seeding Complete!");
}

seedStudentMarket().catch(console.error);
