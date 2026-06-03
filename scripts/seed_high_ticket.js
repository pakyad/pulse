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

const highTicketListings = [
  { title: 'Pioneer XDJ-XZ DJ System', category: 'TECH', price: 4500, sellerEmail: 'arts@unikl.edu.my', desc: 'Club is upgrading their studio gear, selling the old flagship deck. Minor scratches but 100% functional.', stock: 1 },
  { title: 'Fanatec Podium DD2 Sim Racing Rig', category: 'TECH', price: 4800, sellerEmail: 'esports@unikl.edu.my', desc: 'Liquidating the racing simulator from the campus e-sports lounge. Comes with pedals and steering wheel.', stock: 1 },
  { title: 'Specialized Tarmac SL7 Carbon Road Bike', category: 'HOSTEL', price: 4900, sellerEmail: 'sports@unikl.edu.my', desc: 'Varsity cycling team clearing out last year\'s sponsored tournament bikes. Size 54.', stock: 1 },
  { title: 'Complete POS System + iPad Pro Bundle', category: 'TECH', price: 3500, sellerEmail: 'bizclub@unikl.edu.my', desc: 'Leftover hardware from the student-run campus cafe project. iPad is pristine.', stock: 1 },
  { title: 'Premium Alumni Corporate Gift Box', category: 'APPAREL', price: 1200, sellerEmail: 'src@unikl.edu.my', desc: 'High-end fundraising merch for alumni. Includes a solid 916 Gold UniKL pin.', stock: 10 },
  { title: 'MacBook Pro M3 Max (64GB RAM, 2TB)', category: 'TECH', price: 5000, sellerEmail: 'weijian@unikl.edu.my', desc: 'Graduating, switching to a desktop. Heavily discounted for quick cash sale. Screen perfect.', stock: 1 },
  { title: 'Custom RTX 4090 Gaming PC', category: 'TECH', price: 4999, sellerEmail: 'amirul@unikl.edu.my', desc: 'Need cash for final year tuition immediately. Will throw in a free mechanical keyboard.', stock: 1 },
  { title: 'DJI Mavic 3 Pro Cine Drone', category: 'TECH', price: 4750, sellerEmail: 'weijian@unikl.edu.my', desc: 'Used for freelance videography around campus. Upgrading to Inspire series.', stock: 1 },
  { title: 'Supreme x Louis Vuitton Hoodie (Authentic)', category: 'APPAREL', price: 3800, sellerEmail: 'sarah.j@unikl.edu.my', desc: 'Hypebeast limited edition, never worn, with stockX tags attached. Size M.', stock: 1 },
  { title: 'Herman Miller Embody Chair (Logitech G)', category: 'HOSTEL', price: 4200, sellerEmail: 'amirul@unikl.edu.my', desc: 'Moving back to home country, too bulky to ship. Ultimate ergonomic support for long study nights.', stock: 1 }
];

async function seed() {
  console.log("🚀 Starting High-Ticket Injection...");
  
  const batch = db.batch();
  let count = 0;

  for (let item of highTicketListings) {
    try {
      const userRecord = await auth.getUserByEmail(item.sellerEmail);
      const userSnap = await db.collection('users').doc(userRecord.uid).get();
      
      if (!userSnap.exists) {
         console.log(`User ${item.sellerEmail} doc not found in Firestore. Skipping.`);
         continue;
      }
      const seller = userSnap.data();

      const itemRef = db.collection('items').doc();
      batch.set(itemRef, {
        title: item.title,
        category: item.category,
        price: item.price,
        description: item.desc,
        seller_id: seller.uid,
        seller_name: seller.name,
        is_official: seller.is_official,
        stock_count: item.stock,
        status: 'active',
        governance_status: 'APPROVED', // Since they are OPEN categories, they bypass auto-flag
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        image_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${item.title.replace(/ /g, '')}`
      });
      count++;
      console.log(`Prepared: ${item.title} (RM ${item.price}) by ${seller.name}`);
    } catch (e) {
      console.error(`Error processing ${item.title}:`, e.message);
    }
  }

  await batch.commit();
  console.log(`✅ Successfully injected ${count} high-ticket listings!`);
  process.exit(0);
}

seed().catch(console.error);
