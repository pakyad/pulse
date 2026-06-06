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

// Get email from command line or fallback to runner
const TARGET_EMAIL = process.argv[2] || 'runner@pulse.edu';

async function seedWalletData() {
  console.log(`🚀 Seeding Expanded Wallet Demo Data for ${TARGET_EMAIL}...`);

  try {
    const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
    const userId = userRecord.uid;
    const transactionsRef = db.collection('users').doc(userId).collection('transactions');

    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const userName = userData.full_name || userData.name || 'Pulse User';

    // 1. Clear existing transactions
    const existing = await transactionsRef.get();
    for (const doc of existing.docs) {
      await doc.ref.delete();
    }
    console.log("🧹 Cleared old transactions.");

    // 2. Define diverse transactions across months
    const DUMMY_TXS = [
      // APRIL
      { item: 'Wallet Top Up', price: 100.00, type: 'TOPUP', date: '10 Apr 2026, 09:00' },
      { item: 'Delivery Fee: Campus Loop', price: 4.50, type: 'EARNING', date: '15 Apr 2026, 14:00' },
      { item: 'Withdrawal: Monthly Payout', price: -50.00, type: 'WITHDRAWAL', date: '30 Apr 2026, 17:00' },
      
      // MAY
      { item: 'Wallet Top Up', price: 50.00, type: 'TOPUP', date: '20 May 2026, 10:00' },
      { item: 'Delivery Fee: Parcel Pickup', price: 4.50, type: 'EARNING', date: '21 May 2026, 14:15' },
      { item: 'Withdrawal Request', price: -25.00, type: 'WITHDRAWAL', date: '22 May 2026, 09:00' },
      
      // JUNE
      { item: 'Delivery Fee: Food Delivery', price: 4.00, type: 'EARNING', date: '01 Jun 2026, 12:30' },
      { item: 'Tip: Presentation Bonus', price: 10.00, type: 'EARNING', date: '05 Jun 2026, 15:45' },
      { item: 'Wallet Top Up', price: 20.00, type: 'TOPUP', date: '06 Jun 2026, 11:00' },
    ];

    let currentBalance = 0;
    const batch = db.batch();

    for (const tx of DUMMY_TXS) {
      currentBalance += tx.price;
      const ref = transactionsRef.doc();
      batch.set(ref, {
        ...tx,
        latest_balance: currentBalance,
        timestamp: admin.firestore.Timestamp.fromDate(new Date(tx.date))
      });
    }

    batch.update(db.collection('users').doc(userId), {
      balance: currentBalance
    });

    // Add multiple payout requests for variety
    const payouts = [
      { id: `payout_1_${userId}`, status: 'completed', amount: 50.00, date: Date.now() - 86400000 * 30 },
      { id: `payout_2_${userId}`, status: 'pending', amount: 15.00, date: Date.now() }
    ];

    for (const p of payouts) {
      batch.set(db.collection('payout_requests').doc(p.id), {
        user_id: userId,
        user_name: userName,
        amount: p.amount,
        net_payout: p.amount,
        status: p.status,
        created_at: p.date,
        type: 'WITHDRAWAL'
      });
    }

    await batch.commit();
    console.log(`✅ Successfully seeded ${DUMMY_TXS.length} transactions across April, May, and June.`);
    console.log(`💰 Final Balance: RM ${currentBalance.toFixed(2)}`);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }

  process.exit(0);
}

seedWalletData();
