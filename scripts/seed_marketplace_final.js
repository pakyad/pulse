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

const users = [
  // 1. Official Clubs
  { email: 'src@unikl.edu.my', password: 'password123', displayName: 'UniKL SRC', is_official: true, bio: 'Student Representative Council.' },
  { email: 'esports@unikl.edu.my', password: 'password123', displayName: 'UniKL E-Sports', is_official: true, bio: 'Gaming community.' },
  { email: 'bizclub@unikl.edu.my', password: 'password123', displayName: 'Biz Club', is_official: true, bio: 'Student entrepreneurs network.' },
  { email: 'islamic@unikl.edu.my', password: 'password123', displayName: 'PMI UniKL', is_official: true, bio: 'Islamic Society.' },
  { email: 'arts@unikl.edu.my', password: 'password123', displayName: 'Arts & Music Club', is_official: true, bio: 'Creative hub.' },
  { email: 'sports@unikl.edu.my', password: 'password123', displayName: 'Sports Club', is_official: true, bio: 'Futsal, Netball, etc.' },

  // 2. Student Runners
  { email: 'runner.ali@unikl.edu.my', password: 'password123', displayName: 'Ali (Runner)', is_official: false, is_verified_runner: true, runner_status: 'ACTIVE', bio: 'Fast and reliable delivery.' },
  { email: 'runner.devi@unikl.edu.my', password: 'password123', displayName: 'Devi (Runner)', is_official: false, is_verified_runner: true, runner_status: 'ACTIVE', bio: 'Usually around Block B.' },

  // 3. Student Sellers
  { email: 'amirul@unikl.edu.my', password: 'password123', displayName: 'Amirul', is_official: false, bio: 'IT student.' },
  { email: 'sarah.j@unikl.edu.my', password: 'password123', displayName: 'Sarah J.', is_official: false, bio: 'Preloved clothes!' },
  { email: 'weijian@unikl.edu.my', password: 'password123', displayName: 'Wei Jian', is_official: false, bio: 'Tech enthusiast.' }
];

const listings = [
  // TECH
  { title: 'Mechanical Keyboard RK61', category: 'TECH', price: 120, sellerIndex: 10, desc: 'Used for 1 semester. Blue switches.', stock: 1 },
  { title: 'Logitech G102 Mouse', category: 'TECH', price: 45, sellerIndex: 8, desc: 'Perfect condition, slightly used.', stock: 1 },
  { title: 'Used Dell Monitor 24"', category: 'TECH', price: 300, sellerIndex: 10, desc: 'Graduating, no longer need it. Meetup only.', stock: 1 },
  { title: 'Arduino Starter Kit', category: 'TECH', price: 85, sellerIndex: 8, desc: 'Complete with breadboard and components. Perfect for FYP.', stock: 2 },
  { title: 'Baseus 20000mAh Powerbank', category: 'TECH', price: 70, sellerIndex: 10, desc: 'Brand new in box, accidentally bought two.', stock: 1 },

  // HOSTEL
  { title: 'Mini Desk Fan', category: 'HOSTEL', price: 25, sellerIndex: 8, desc: 'USB powered desk fan, essential for hot nights.', stock: 1 },
  { title: 'IKEA Storage Box', category: 'HOSTEL', price: 15, sellerIndex: 9, desc: 'Clear storage box, fits under the bed.', stock: 4 },
  { title: 'Clothes Hangers (Pack of 20)', category: 'HOSTEL', price: 10, sellerIndex: 10, desc: 'Plastic hangers.', stock: 2 },
  { title: 'Study Lamp (Warm Light)', category: 'HOSTEL', price: 35, sellerIndex: 8, desc: 'Good for late-night studying.', stock: 1 },
  
  // HUNGER
  { title: 'SRC Bake Sale - Brownies', category: 'HUNGER', price: 8, sellerIndex: 0, desc: 'Freshly baked brownies by the SRC team! Fundraiser.', stock: 20 },
  { title: 'Red Bull Energy Drink', category: 'HUNGER', price: 5, sellerIndex: 1, desc: 'Exam week essential.', stock: 50 },
  { title: 'Nasi Lemak Ayam Goreng', category: 'HUNGER', price: 6.5, sellerIndex: 3, desc: 'Fundraising breakfast by Islamic Society.', stock: 30 },
  { title: 'Campus Cafe Voucher RM10', category: 'HUNGER', price: 9, sellerIndex: 0, desc: 'Valid at any campus cafeteria.', stock: 15 },

  // ACADEMIC
  { title: 'Calculus Early Transcendentals', category: 'ACADEMIC', price: 80, sellerIndex: 9, desc: 'Used textbook for Year 1. Slight highlights.', stock: 1 },
  { title: 'Safety Goggles (Lab)', category: 'ACADEMIC', price: 12, sellerIndex: 8, desc: 'Used for Chemistry lab. Scratch-free.', stock: 1 },
  { title: 'Scientific Calculator Casio 570EX', category: 'ACADEMIC', price: 50, sellerIndex: 10, desc: 'Upgraded to a graphing calc, letting this go.', stock: 1 },
  { title: 'FYP Printing Service', category: 'ACADEMIC', price: 25, sellerIndex: 2, desc: 'We print and bind your thesis.', stock: 99 },

  // APPAREL
  { title: 'UniKL Official Lanyard', category: 'APPAREL', price: 15, sellerIndex: 0, desc: 'Official SRC lanyard for 2026.', stock: 100 },
  { title: 'Preloved Zara Denim Jacket', category: 'APPAREL', price: 50, sellerIndex: 9, desc: 'Size M. Perfect for cold lecture halls.', stock: 1 },
  { title: 'E-Sports Club Official Jersey', category: 'APPAREL', price: 45, sellerIndex: 1, desc: 'Show your support! Available in sizes S-XL.', stock: 50 },
  { title: 'Business Club Corporate Shirt', category: 'APPAREL', price: 60, sellerIndex: 2, desc: 'Professional attire for presentations.', stock: 20 },

  // SERVICES
  { title: 'Laptop Formatting Service', category: 'SERVICES', price: 40, sellerIndex: 10, desc: 'Windows 11 fresh install + basic software.', stock: 99 },
  { title: 'Graduation Photo Shoot', category: 'SERVICES', price: 150, sellerIndex: 4, desc: '1 hour session around campus. By Arts Club.', stock: 10 },
  { title: 'Resume Review', category: 'SERVICES', price: 20, sellerIndex: 2, desc: 'Get your resume ready for internship by Biz Club.', stock: 50 },
  { title: 'Futsal Court Booking Transfer', category: 'SERVICES', price: 30, sellerIndex: 5, desc: 'Booked Court 1 for Friday 8PM but cant make it.', stock: 1 }
];

async function seed() {
  console.log("🌱 Starting Database Seed...");
  let userDocs = [];

  // 1. Create Users
  for (let u of users) {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(u.email);
      console.log(`User ${u.email} already exists.`);
    } catch (e) {
      console.log(`Creating user ${u.email}...`);
      userRecord = await auth.createUser({
        email: u.email,
        password: u.password,
        displayName: u.displayName,
      });
    }

    const uid = userRecord.uid;
    const userDocData = {
      uid,
      email: u.email,
      name: u.displayName,
      is_official: u.is_official || false,
      is_verified_runner: u.is_verified_runner || false,
      runner_status: u.runner_status || null,
      bio: u.bio || '',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${u.displayName}`
    };

    await db.collection('users').doc(uid).set(userDocData, { merge: true });
    userDocs.push(userDocData);
  }

  console.log("✅ Users seeded successfully!");

  // 2. Create Items
  const batch = db.batch();
  for (let item of listings) {
    const seller = userDocs[item.sellerIndex];
    if (!seller) continue;

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
      governance_status: 'APPROVED',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      image_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${item.title.replace(/ /g, '')}`
    });
  }

  await batch.commit();
  console.log(`✅ Successfully seeded ${listings.length} marketplace listings!`);
  process.exit(0);
}

seed().catch(console.error);
