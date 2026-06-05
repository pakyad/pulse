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

async function rollback() {
  console.log("🚨 INITIATING EMERGENCY ROLLBACK 🚨\n");

  try {
    // 1. PURGE MOCK DATA FROM FIRESTORE
    console.log("[1/3] Purging mock data...");
    
    // Delete PriceGuidelines
    const guidelines = ["FOOD_LIMIT", "BOOKS_LIMIT", "TECH_LIMIT", "HOSTEL_LIMIT"];
    for (const g of guidelines) {
      await db.collection('PriceGuidelines').doc(g).delete();
      console.log(`- Deleted PriceGuideline: ${g}`);
    }

    // Delete mock items
    const mockTitles = [
      "Nasi Kandar Ayam Merah Preorder", 
      "MacBook Pro M3 Max", 
      "Engineering Software Lab Guidebook"
    ];
    
    const itemsSnapshot = await db.collection('items').get();
    let deletedItems = 0;
    itemsSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.title && mockTitles.some(title => data.title.includes(title))) {
        doc.ref.delete();
        console.log(`- Deleted Item: ${data.title}`);
        deletedItems++;
      }
    });
    if (deletedItems === 0) console.log("- No mock items found to delete.");

    // Delete governance vault mock
    await db.collection('governance_vault').doc('mock_vault_item_001').delete();
    console.log(`- Deleted Vault Item: mock_vault_item_001`);

    // 2. RESTORE ORIGINAL USER PROFILE STATE
    console.log("\n[2/3] Restoring user profile state...");
    const targetEmail = "iyadmohmadnazri@s.unikl.edu.my";
    const userQuery = await db.collection('users').where('email', '==', targetEmail).get();
    
    if (!userQuery.empty) {
      for (const docSnap of userQuery.docs) {
        const data = docSnap.data();
        
        // Build the safe, clean native state
        const safeData = {
          email: data.email,
          full_name: data.full_name || 'Iyad Mohmad',
          role: 'STUDENT',
          created_at: data.created_at || new Date().toISOString()
        };
        
        // Force overwrite the document to scrub injected fields
        await docSnap.ref.set(safeData);
        console.log(`- Profile scrubbed and restored to native state: ${docSnap.id}`);
      }
    } else {
      console.log(`- Target user ${targetEmail} not found.`);
    }

    console.log("\n[3/3] Rollback operations completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("🔥 Rollback Failed:", error);
    process.exit(1);
  }
}

rollback();
