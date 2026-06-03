const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

async function run() {
  try {
    // We need the credential. Let's try to get it from .env.local
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const getEnv = (key) => {
      const match = envContent.match(new RegExp(`${key}=(.*)`));
      return match ? match[1].trim().replace(/^"|"$|'$|^'/g, '') : null;
    };

    const projectId = getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    const clientEmail = getEnv('FIREBASE_CLIENT_EMAIL');
    let privateKey = getEnv('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      console.log('Missing credentials in .env.local!');
      return;
    }

    privateKey = privateKey.replace(/\\n/g, '\n');

    const app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey })
    });
    const db = getFirestore(app);

    console.log('Connected to Firestore');

    // 1. Find yatkeat
    const usersSnap = await db.collection('users').get();
    let yatkeatId = null;
    let yatkeatName = null;

    usersSnap.forEach(doc => {
      const data = doc.data();
      if ((data.full_name && data.full_name.toLowerCase().includes('yatkeat')) ||
          (data.email && data.email.toLowerCase().includes('yatkeat')) ||
          (data.full_name && data.full_name.toLowerCase().includes('yat keat'))) {
        yatkeatId = doc.id;
        yatkeatName = data.full_name;
      }
    });

    if (!yatkeatId) {
      console.log('Could not find user yatkeat. Seeding a new user instead.');
      yatkeatId = 'yatkeat_demo_user';
      yatkeatName = 'Yat Keat';
      await db.collection('users').doc(yatkeatId).set({
        full_name: yatkeatName,
        email: 'yatkeat@s.unikl.edu.my',
        role: 'STUDENT',
        is_verified_runner: true,
        created_at: new Date().toISOString()
      });
    }

    console.log(`Found/Created Yat Keat UID: ${yatkeatId}`);

    // 2. Insert dummy transactions for yatkeat
    const txRef = db.collection('transactions');

    // Delivery 1
    await txRef.add({
      runner_id: yatkeatId,
      status: 'DELIVERED',
      item_name: 'Calculus Textbook 8th Ed',
      runner_fee: 3.50,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
    });

    // Delivery 2
    await txRef.add({
      runner_id: yatkeatId,
      status: 'DELIVERED',
      item_name: 'Nasi Lemak Ayam Goreng',
      runner_fee: 5.00,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
    });

    // Sale 1
    await txRef.add({
      merchant_id: yatkeatId,
      status: 'COMPLETED',
      item_name: 'Official Jersey Pre-Order 2026',
      total_amount: 35.00,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
      updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
    });

    console.log('Successfully injected 3 transactions for Yat Keat (RM 8.50 deliveries + RM 35.00 sales)');

  } catch (err) {
    console.error('Error seeding data:', err);
  }
}

run();
