const admin = require('firebase-admin');
const dotenv = require('dotenv');
const { getJson } = require('serpapi');
const https = require('https');

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
const bucket = admin.storage().bucket('codep-pulse.firebasestorage.app');
const SERP_API_KEY = process.env.SERP_API_KEY;

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function searchImage(title) {
  try {
    const res = await getJson({
      engine: 'google_images',
      q: `${title} product Malaysia`,
      api_key: SERP_API_KEY,
      tbs: 'isz:m',
      num: 1,
    });
    const image = res.images_results?.[0];
    return image?.original || image?.thumbnail || null;
  } catch (e) {
    console.error(`  SerpAPI error for "${title}":`, e.message);
    return null;
  }
}

async function uploadToStorage(buffer, itemId) {
  const file = bucket.file(`listing_images/${itemId}.jpg`);
  await file.save(buffer, { metadata: { contentType: 'image/jpeg' } });
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '01-01-2036',
  });
  return url;
}

async function run() {
  const snapshot = await db.collection('items').get();
  const items = [];
  snapshot.forEach(doc => {
    const d = doc.data();
    if (d.title && !d.image_url) {
      items.push({ id: doc.id, title: d.title, category: d.category });
    }
  });

  console.log(`Found ${items.length} items without images\n`);

  for (const item of items) {
    process.stdout.write(`[${items.indexOf(item)+1}/${items.length}] "${item.title}" → searching...`);

    const imageUrl = await searchImage(item.title);
    if (!imageUrl) {
      console.log(' ❌ no image found');
      continue;
    }

    try {
      const buffer = await downloadImage(imageUrl);
      const storageUrl = await uploadToStorage(buffer, item.id);
      await db.collection('items').doc(item.id).update({
        image_url: storageUrl,
        images: [storageUrl],
        images_updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(` ✅ ${storageUrl.substring(0, 60)}...`);
    } catch (e) {
      console.log(` ❌ download/upload failed: ${e.message}`);
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\nDone!');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
