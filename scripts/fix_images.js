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

const IMAGE_MAP = {
  // TECH
  'Mechanical Keyboard RK61': 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1000&auto=format&fit=crop',
  'Logitech G102 Mouse': 'https://images.unsplash.com/photo-1527814050087-379381547969?q=80&w=1000&auto=format&fit=crop',
  'Used Dell Monitor 24"': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1000&auto=format&fit=crop',
  'Arduino Starter Kit': 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=1000&auto=format&fit=crop',
  'Baseus 20000mAh Powerbank': 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?q=80&w=1000&auto=format&fit=crop',

  // HOSTEL
  'Mini Desk Fan': 'https://images.unsplash.com/photo-1618342416041-3b76bfbb1a99?q=80&w=1000&auto=format&fit=crop',
  'IKEA Storage Box': 'https://images.unsplash.com/photo-1595514535311-667dc97034b7?q=80&w=1000&auto=format&fit=crop',
  'Clothes Hangers (Pack of 20)': 'https://images.unsplash.com/photo-1583091934988-cb73d40ec387?q=80&w=1000&auto=format&fit=crop',
  'Study Lamp (Warm Light)': 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=1000&auto=format&fit=crop',
  
  // HUNGER
  'SRC Bake Sale - Brownies': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=1000&auto=format&fit=crop',
  'Red Bull Energy Drink': 'https://images.unsplash.com/photo-1622619409893-6c841bbcefa0?q=80&w=1000&auto=format&fit=crop',
  'Nasi Lemak Ayam Goreng': 'https://images.unsplash.com/photo-1626804475297-41609ea084eb?q=80&w=1000&auto=format&fit=crop',
  'Campus Cafe Voucher RM10': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1000&auto=format&fit=crop',

  // ACADEMIC
  'Calculus Early Transcendentals': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1000&auto=format&fit=crop',
  'Safety Goggles (Lab)': 'https://images.unsplash.com/photo-1584988944510-48ee7149a888?q=80&w=1000&auto=format&fit=crop',
  'Scientific Calculator Casio 570EX': 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?q=80&w=1000&auto=format&fit=crop',
  'FYP Printing Service': 'https://images.unsplash.com/photo-1563240619-44ce02d84dbd?q=80&w=1000&auto=format&fit=crop',

  // APPAREL
  'UniKL Official Lanyard': 'https://images.unsplash.com/photo-1606013620959-1e35fbb73d32?q=80&w=1000&auto=format&fit=crop',
  'Preloved Zara Denim Jacket': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop',
  'E-Sports Club Official Jersey': 'https://images.unsplash.com/photo-1556815302-0e9bd51a13e5?q=80&w=1000&auto=format&fit=crop',
  'Business Club Corporate Shirt': 'https://images.unsplash.com/photo-1620012253295-c15bc3e6594d?q=80&w=1000&auto=format&fit=crop',

  // SERVICES
  'Laptop Formatting Service': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=1000&auto=format&fit=crop',
  'Graduation Photo Shoot': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop',
  'Resume Review': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1000&auto=format&fit=crop',
  'Futsal Court Booking Transfer': 'https://images.unsplash.com/photo-1534158914592-062992fbe900?q=80&w=1000&auto=format&fit=crop'
};

async function run() {
  const snapshot = await db.collection('items').get();
  const batch = db.batch();
  let count = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    const newImage = IMAGE_MAP[data.title];
    
    if (newImage && data.image_url !== newImage) {
      console.log(`Updating image for: ${data.title}`);
      batch.update(doc.ref, { 
        image_url: newImage,
        images: [newImage] // In case the frontend expects an array
      });
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`✅ Successfully injected realistic high-res images to ${count} marketplace listings!`);
  } else {
    console.log(`✅ All items already have realistic images.`);
  }

  process.exit(0);
}

run().catch(console.error);
