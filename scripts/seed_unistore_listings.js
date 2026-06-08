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

const listings = [
  // Official UniStore Items (is_official: true)
  { title: 'UniKL MIIT Polo Tee Navy Blue', category: 'APPAREL', subcategory: 'Campus Event Tees', price: 45, desc: 'Official UniKL MIIT polo tee. Navy blue with embroidered logo. 100% cotton, breathable fabric.', stock: 80, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=MIITPolo', is_official: true },
  { title: 'UniKL Hoodie Maroon Zip-Up', category: 'APPAREL', subcategory: 'Campus Event Tees', price: 89, desc: 'Premium maroon hoodie with UniKL crest. Zip-up style, fleece lining. Perfect for chilly lecture halls.', stock: 40, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=UniKLHoodie', is_official: true },
  { title: 'Faculty of Engineering Lanyard', category: 'APPAREL', subcategory: 'Campus Event Tees', price: 12, desc: 'Official Faculty of Engineering lanyard with ID holder. Durable woven polyester.', stock: 200, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=EngLanyard', is_official: true },
  { title: 'UniKL Sports Bottle 750ml', category: 'APPAREL', subcategory: 'Bags & Backpacks', price: 25, desc: 'BPA-free sports bottle with UniKL logo. 750ml capacity. Leak-proof lid, dishwasher safe.', stock: 120, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=UniKLBottle', is_official: true },
  { title: 'Graduation Bear Plush 12"', category: 'APPAREL', subcategory: 'Campus Event Tees', price: 55, desc: 'Commemorative graduation bear in cap and gown. UniKL graduate sash included. 12 inches tall.', stock: 30, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=GradBear', is_official: true },
  { title: 'Notebook Set A5 UniKL (3pc)', category: 'ACADEMIC', subcategory: 'Stationery Bundles', price: 18, desc: 'Set of 3 A5 notebooks with UniKL cover. 80 pages each, ruled. Perfect for lecture notes.', stock: 150, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=UniKLNotebook', is_official: true },
  { title: 'UniKL Pen Pack (10pc)', category: 'ACADEMIC', subcategory: 'Stationery Bundles', price: 10, desc: '10 ballpoint pens with UniKL branding. Blue ink, medium tip. Smooth writing.', stock: 300, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=UniKLPen', is_official: true },
  { title: 'Laptop Sleeve 13" UniKL', category: 'TECH', subcategory: 'Cables, Hubs & Chargers', price: 35, desc: 'Neoprene laptop sleeve with UniKL logo. Fits 13-inch laptops. Padded interior.', stock: 60, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=LapSleeve', is_official: true },
  { title: 'UniKL Umbrella Compact Foldable', category: 'APPAREL', subcategory: 'Campus Event Tees', price: 22, desc: 'Compact foldable umbrella with UniKL print. Wind-resistant frame. Auto-open.', stock: 90, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=UniKLUmbrella', is_official: true },
  { title: 'UniKL Sticker Pack (Set of 8)', category: 'APPAREL', subcategory: 'Campus Event Tees', price: 8, desc: 'Set of 8 vinyl stickers featuring UniKL landmarks and mascot. Waterproof. 5cm each.', stock: 250, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=StickerPack', is_official: true },

  // Student Peer-to-Peer Items (merchant: false)
  { title: 'Engineering Mathematics Textbook', category: 'ACADEMIC', subcategory: 'Engineering Textbooks', price: 50, desc: 'Advanced Engineering Mathematics by Kreyszig. 10th edition. Good condition, minor highlights.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=EngMath', merchant: false, seller_name_override: 'Aiman R.' },
  { title: 'C++ Programming: Objects & Data Abstraction', category: 'ACADEMIC', subcategory: 'IT & Computing Books', price: 35, desc: 'Used for CSC3109 course. No markings, like new condition.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=CppBook', merchant: false, seller_name_override: 'Sarah L.' },
  { title: 'Casio fx-570ES PLUS Scientific Calculator', category: 'ACADEMIC', subcategory: 'Casio Calculators', price: 60, desc: 'Used Casio fx-570ES PLUS. Works perfectly. Battery replaced last month.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=CasioCalc', merchant: false, seller_name_override: 'Kevin T.' },
  { title: 'Handwritten Notes Software Engineering Full Sem', category: 'ACADEMIC', subcategory: 'Handwritten Notes (IT & CS)', price: 15, desc: 'Complete semester notes for Software Engineering. Covers SDLC, Agile, UML, testing. 40 pages.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=SENotes', merchant: false, seller_name_override: 'Diana M.' },
  { title: 'Past Year Papers: Database Design CSC4101', category: 'ACADEMIC', subcategory: 'Past Year Papers', price: 8, desc: 'Past year papers from 2022-2024 with answer scheme. 5 papers total.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=DBPapers', merchant: false, seller_name_override: 'Amir H.' },
  { title: 'Pensonic Rice Cooker 1.0L', category: 'HOSTEL', subcategory: 'Rice Cookers & Kettles', price: 55, desc: 'Used 1 semester. Non-stick pot, comes with measuring cup and spatula. Clean condition.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=RiceCooker', merchant: false, seller_name_override: 'Fatin N.' },
  { title: 'Khind Stand Fan 16 inch', category: 'HOSTEL', subcategory: 'Stand & Table Fans', price: 75, desc: 'Used for 3 months. Remote control works. Very quiet, strong airflow.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=StandFan', merchant: false, seller_name_override: 'Hakim Z.' },
  { title: 'IKEA SAMLA Storage Box 45L (2x)', category: 'HOSTEL', subcategory: 'Racks & Storage Boxes', price: 30, desc: 'Two IKEA SAMLA boxes. Clear plastic, stackable. Great for hostel storage.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=StorageBox', merchant: false, seller_name_override: 'Liyana K.' },
  { title: 'Ergonomic Study Chair', category: 'HOSTEL', subcategory: 'Study Tables & Chairs', price: 150, desc: 'Mesh back ergonomic chair. Adjustable height and armrests. Used 6 months.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=StudyChair', merchant: false, seller_name_override: 'Raj S.' },
  { title: 'RGB LED Strip 5m with Remote', category: 'HOSTEL', subcategory: 'Room Decor & Lighting', price: 25, desc: 'RGB LED strip lights. 5 metres. Remote controlled. Multiple colours and modes.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=LEDStrip', merchant: false, seller_name_override: 'Wei C.' },
  { title: 'Mechanical Keyboard RK61 Bluetooth', category: 'TECH', subcategory: 'Keyboards & Mice', price: 120, desc: 'Royal Kludge RK61. Red switches. Bluetooth 5.0 + wired. Used 2 months. Like new.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=RK61KB', merchant: false, seller_name_override: 'Zack A.' },
  { title: 'JBL Flip 5 Speaker Blue', category: 'TECH', subcategory: 'Headphones & Audio', price: 180, desc: 'JBL Flip 5 portable speaker. Blue colour. IPX7 waterproof. Great bass.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=JBLFlip', merchant: false, seller_name_override: 'Maya R.' },
  { title: 'iPhone 13 Clear Case + Screen Protector', category: 'TECH', subcategory: 'Cables, Hubs & Chargers', price: 15, desc: 'Brand new clear case and tempered glass for iPhone 13. Never used.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=iPhoneCase', merchant: false, seller_name_override: 'Ben L.' },
  { title: 'Nintendo Switch OLED Console', category: 'TECH', subcategory: 'Gaming Consoles & Games', price: 900, desc: 'Nintendo Switch OLED white. Used 3 months. Includes dock, joy-cons, original box.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=SwitchOLED', merchant: false, seller_name_override: 'Ivan G.' },
  { title: 'Club Badminton T-Shirt Size M', category: 'APPAREL', subcategory: 'Club & Society Jerseys', price: 25, desc: 'UniKL Badminton Club shirt. Size M. Worn once. In excellent condition.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=BadmintonShirt', merchant: false, seller_name_override: 'Chris W.' },
  { title: 'Nike Air Force 1 White Size UK8', category: 'APPAREL', subcategory: 'Shoes & Sneakers', price: 200, desc: 'Genuine Nike Air Force 1 Triple White. Size UK8. Used lightly, clean condition.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=AF1Shoes', merchant: false, seller_name_override: 'Danial P.' },
  { title: 'Zara Blazer Women Size S', category: 'APPAREL', subcategory: 'Preloved Womenswear', price: 80, desc: 'Zara black blazer. Size S. Worn twice for events. Like new condition.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=ZaraBlazer', merchant: false, seller_name_override: 'Aina B.' },
  { title: 'Herschel Retreat Backpack Navy', category: 'APPAREL', subcategory: 'Bags & Backpacks', price: 140, desc: 'Herschel Retreat backpack. Navy colour. 23L capacity. Padded sleeve for 15" laptop.', stock: 1, img: 'https://api.dicebear.com/7.x/shapes/svg?seed=HerschelBag', merchant: false, seller_name_override: 'Joel T.' },
];

async function seed() {
  console.log('🚀 Seeding UniStore + Student listings...\n');

  let sellerId = 'SEED_SRC';
  let sellerName = 'UniStore Official';

  try {
    const userRecord = await auth.getUserByEmail('src@unikl.edu.my');
    const userSnap = await db.collection('users').doc(userRecord.uid).get();
    if (userSnap.exists) {
      sellerId = userRecord.uid;
      sellerName = userSnap.data().full_name || 'UniStore Official';
      console.log(`✓ Bound to SRC account: ${sellerName} (${userRecord.uid})`);
    } else {
      console.log('⚠ SRC user doc missing, using fallback seller ID');
    }
  } catch (e) {
    console.log('⚠ SRC account not found, using fallback seller ID');
  }

  const batch = db.batch();
  let count = 0;

  for (const item of listings) {
    const ref = db.collection('items').doc();
    const docData = {
      title: item.title,
      category: item.category,
      subcategory: item.subcategory || null,
      price: item.price,
      description: item.desc,
      seller_id: sellerId,
      seller_name: item.seller_name_override || sellerName,
      is_official: item.is_official === true,
      stock_count: item.stock || 1,
      status: 'active',
      governance_status: 'APPROVED',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      image_url: item.img,
      delivery_options: ['meetup', 'runner'],
    };

    if (item.merchant === false) {
      docData.merchant = false;
    }

    // Student peer-to-peer items get PCS-certified status
    if (item.merchant === false) {
      docData.pcs_certified = true;
      docData.pcs_status = 'APPROVED';
    }

    if (item.is_official) {
      docData.condition = 'Brand New';
      docData.price_tier = 'COMPLIANT';
    } else {
      docData.condition = item.title.toLowerCase().includes('brand new') ? 'Brand New' : 'Used - Good';
      docData.price_tier = 'FREE_MARKET';
    }

    batch.set(ref, docData);
    count++;
    const tag = item.is_official ? '🏪 OFFICIAL' : '👤 STUDENT';
    console.log(`${tag}  ${item.title} (RM ${item.price})`);
  }

  await batch.commit();
  console.log(`\n✅ Successfully seeded ${count} listings!`);
  process.exit(0);
}

seed().catch(e => {
  console.error('❌ Failed:', e.message);
  process.exit(1);
});
