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

async function fetchGoogleImage(query: string): Promise<string | null> {
  if (!SERP_API_KEY) return null;
  try {
    const response = await fetch(`https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}`);
    const data = await response.json();
    if (data.images_results && data.images_results.length > 0) {
      return data.images_results[0].original;
    }
  } catch (error) {
    console.error(`Failed to fetch image for query "${query}":`, error);
  }
  return null;
}

const MOCK_ITEMS = [
  {
    title: "Thomas Calculus 14th Edition",
    category: "ACADEMIC",
    subcategory: "Textbooks & Reference Books",
    price: 85.00,
    seller_name: "Adam Q.",
    condition: "Used - Good",
  },
  {
    title: "Casio fx-570EX ClassWiz",
    category: "ACADEMIC",
    subcategory: "Scientific Calculators",
    price: 60.00,
    seller_name: "Sarah Lim",
    condition: "Used - Like New",
  },
  {
    title: "White Lab Coat Size M",
    category: "ACADEMIC",
    subcategory: "Lab Equipment & Safety Gear",
    price: 25.00,
    seller_name: "Farhan Y.",
    condition: "Used - Good",
  },
  {
    title: "A4 Sketchbook 135gsm",
    category: "ACADEMIC",
    subcategory: "Art & Studio Supplies",
    price: 15.00,
    seller_name: "Maya T.",
    condition: "New",
  },
  {
    title: "UniKL Engineering Faculty Shirt",
    category: "APPAREL",
    subcategory: "Campus & Faculty Merch",
    price: 35.00,
    seller_name: "Ahmad F.",
    condition: "Used - Like New",
  },
  {
    title: "Maggi Hot Cup Curry (Box of 6)",
    category: "HOSTEL",
    subcategory: "Snacks & Instant Food",
    price: 12.00,
    seller_name: "Hostel Mart",
    condition: "New",
  },
  {
    title: "Mini Desk Fan USB",
    category: "HOSTEL",
    subcategory: "Cooling & Ventilation",
    price: 18.00,
    seller_name: "Daniel R.",
    condition: "Used - Good",
  },
  {
    title: "Pineng Power Bank 10000mAh",
    category: "TECH",
    subcategory: "Power Banks & Chargers",
    price: 40.00,
    seller_name: "Lisa Wong",
    condition: "Used - Good",
  },
  {
    title: "SanDisk Cruzer Glide 64GB",
    category: "TECH",
    subcategory: "Storage & Drives",
    price: 20.00,
    seller_name: "Kevin T.",
    condition: "New",
  },
  {
    title: "Format Laptop & Reinstall Windows 11",
    category: "SERVICES",
    subcategory: "IT Support & Repair",
    price: 50.00,
    seller_name: "Tech Guru Sam",
    condition: "Service",
  }
];

async function seedStudentMarket() {
  console.log("Seeding 10 authentic Student Market listings...");
  
  for (const item of MOCK_ITEMS) {
    console.log(`\nCreating listing: ${item.title}`);
    
    // Fetch real Google Image for realism
    console.log(`Fetching Google Image for: ${item.title}...`);
    const imageUrl = await fetchGoogleImage(item.title);
    
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
      image_url: imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.title}`,
      images: imageUrl ? [imageUrl] : [],
      status: "AVAILABLE",
      stock_count: 1,
      is_official: false,
      pcs_certified: requiresPCS,
      pcs_status: requiresPCS ? "APPROVED" : "FREE_MARKET",
      time_ago: "Just now",
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`✅ Seeded successfully with image: ${imageUrl ? 'YES' : 'NO'}`);
    
    // Wait 1.5 seconds to avoid SerpApi rate limits
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log("\nStudent Market Seeding Complete!");
}

seedStudentMarket().catch(console.error);
