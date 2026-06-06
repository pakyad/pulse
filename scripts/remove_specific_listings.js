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

async function removeListings() {
  const merchantsToRemove = [
    "Campus Dripper",
    "Dr. Study",
    "Comfort Seating",
    "Pulse Student"
  ];

  console.log("Removing listings for merchants:", merchantsToRemove);

  const itemsRef = db.collection('items');
  const snapshot = await itemsRef.get();

  let count = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (merchantsToRemove.includes(data.seller_name)) {
      await doc.ref.delete();
      console.log(`Deleted item: ${data.title} from ${data.seller_name}`);
      count++;
    }
  }

  console.log(`Removed ${count} items.`);
}

removeListings().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
