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

async function query() {
  const snap = await db.collection('items').get();
  const sellers = {};
  const cats = {};
  
  snap.forEach(doc => {
    const d = doc.data();
    const s = d.seller_name || 'UNKNOWN';
    const c = d.category || 'UNKNOWN';
    sellers[s] = (sellers[s] || 0) + 1;
    cats[c] = (cats[c] || 0) + 1;
    
    if (s.toLowerCase().includes('unikl') || s.toLowerCase().includes('unistore') || d.is_official) {
      console.log(`[${doc.id}] ${d.title} | seller: ${s} | cat: ${c} | status: ${d.status} | img: ${d.image_url || 'none'} | official: ${d.is_official}`);
    }
  });
  
  console.log('\nAll seller_names:');
  Object.entries(sellers).sort().forEach(([k, v]) => console.log(`  ${k}: ${v} items`));
  
  console.log('\nAll categories:');
  Object.entries(cats).sort().forEach(([k, v]) => console.log(`  ${k}: ${v} items`));

  process.exit(0);
}

query().catch(e => { console.error('Error:', e); process.exit(1); });
