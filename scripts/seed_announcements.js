const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
  });
}

const db = admin.firestore();

async function run() {
  console.log("Cleaning up old announcements...");
  const oldAnnouncements = await db.collection('announcements').get();
  const deleteBatch = db.batch();
  oldAnnouncements.forEach(doc => deleteBatch.delete(doc.ref));
  await deleteBatch.commit();
  console.log("Cleaned up old announcements.");

  const announcements = [
    {
      id: 'ann_hostel',
      tag: 'HOUSING',
      headline: 'Student Hostel Registration',
      body: 'Apply now for the upcoming semester accommodations at UniKL Campus.',
      imageUrl: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1000&auto=format&fit=crop',
      ctaPath: 'https://www.unikl.edu.my/campus-life/accommodation/',
      created_at: new Date(Date.now() - 1000)
    },
    {
      id: 'ann_ecitie',
      tag: 'ACADEMIC',
      headline: 'E-Citie Student Portal',
      body: 'Check your academic calendar, timetables, and exam results securely.',
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop',
      ctaPath: 'https://v2.ecitie.my/',
      created_at: new Date(Date.now() - 2000)
    },
    {
      id: 'ann_career',
      tag: 'CAREER',
      headline: 'Career & Alumni Network',
      body: 'Explore internships, career counseling, and job placement opportunities.',
      imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1000&auto=format&fit=crop',
      ctaPath: 'https://www.unikl.edu.my/campus-life/alumni/',
      created_at: new Date(Date.now() - 3000)
    },
    {
      id: 'ann_clubs',
      tag: 'COMMUNITY',
      headline: 'Clubs & Student Societies',
      body: 'Join the pulse of campus life. Find sports, tech, and cultural clubs.',
      imageUrl: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1000&auto=format&fit=crop',
      ctaPath: 'https://www.unikl.edu.my/campus-life/clubs-societies/',
      created_at: new Date(Date.now() - 4000)
    }
  ];

  console.log("Seeding new official UniKL announcements...");
  const addBatch = db.batch();
  for (const ann of announcements) {
    const ref = db.collection('announcements').doc(ann.id);
    addBatch.set(ref, ann);
  }
  
  await addBatch.commit();
  console.log("✅ Successfully seeded 4 official UniKL announcements!");

  process.exit(0);
}

run().catch(console.error);
