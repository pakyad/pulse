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

async function createRunner() {
  const email = `runner_${Date.now()}@pulse.edu.my`;
  const password = "Password123!";
  
  try {
    const userRecord = await auth.createUser({
      email: email,
      emailVerified: true,
      password: password,
      displayName: "Official Pulse Runner",
      disabled: false,
    });

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      full_name: "Official Pulse Runner",
      role: "RUNNER",
      is_verified_runner: true,
      matric_no: "RN-" + Math.floor(1000 + Math.random() * 9000),
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("-----------------------------------------");
    console.log("RUNNER ACCOUNT CREATED SUCCESSFULLY!");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log("-----------------------------------------");
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating new runner user:", error);
    process.exit(1);
  }
}

createRunner();
