const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ Missing environment variables in .env.local");
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

async function fixAccounts() {
  console.log("🚀 Starting backend override for Merchant Accounts...");
  
  const accountsToFix = [
    { email: 'sports@s.unikl.edu.my', name: 'Sports Council', role: 'CLUB' },
    { email: 'techsociety@s.unikl.edu.my', name: 'MIIT Tech Club', role: 'CLUB' }
  ];

  for (const acc of accountsToFix) {
    try {
      const userRecord = await admin.auth().getUserByEmail(acc.email);
      const uid = userRecord.uid;
      
      console.log(`✅ Found TRUE UID for ${acc.email}: ${uid}`);
      
      // Patch the user document
      await db.collection('users').doc(uid).set({
        uid: uid,
        email: acc.email,
        full_name: acc.name,
        role: acc.role,
        is_official: true,
        is_verified_merchant: true,
        seller_name: acc.name,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log(`✅ Patched Firestore user document for ${acc.name}.`);
      
      // Now update campaigns and items that belong to this merchant
      // For campaigns:
      const camps = await db.collection('campaigns').where('club_name', '==', acc.name).get();
      camps.forEach(async (doc) => {
         await doc.ref.update({ seller_id: uid });
         console.log(`✅ Linked campaign ${doc.id} to ${acc.name}`);
      });
      
      // For items (if any match seller_name):
      const items = await db.collection('items').where('seller_name', '==', acc.name).get();
      items.forEach(async (doc) => {
         await doc.ref.update({ seller_id: uid });
         console.log(`✅ Linked item ${doc.id} to ${acc.name}`);
      });
      
    } catch(e) {
       console.log(`⚠️ Could not process ${acc.email}: ${e.message}`);
    }
  }
}

fixAccounts().then(() => {
  console.log("🎉 Backend override complete.");
  process.exit(0);
});
