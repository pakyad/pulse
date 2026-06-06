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

async function resetRunner() {
  // Let's find any user that looks like Irfan or Runner
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  let targetUser = null;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.full_name?.toLowerCase().includes('irfan') || data.displayName?.toLowerCase().includes('irfan') || data.email === 'runner@pulse.edu') {
      targetUser = doc;
      // If we find exactly Irfan, break. Otherwise keep searching, falling back to runner@pulse.edu
      if (data.full_name?.toLowerCase().includes('irfan') || data.displayName?.toLowerCase().includes('irfan')) break;
    }
  }

  if (targetUser) {
    await targetUser.ref.update({
      runner_status: 'pending',
      is_verified_runner: false,
      runner_data: {
        studentId: '123456789',
        location: 'MIIT Campus',
        transport: 'Walking',
        whatsapp: '+60123456789',
        bankName: 'Maybank',
        accountNumber: '112233445566'
      }
    });
    console.log(`✅ Set runner_status to 'pending' for user: ${targetUser.data().full_name || targetUser.data().email}`);
  } else {
    console.log("Could not find Irfan or Runner in the database.");
  }
}

resetRunner().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
