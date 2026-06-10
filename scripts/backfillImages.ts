import admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function initialize() {
  if (admin.apps.length > 0) return admin.apps[0]!;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin Credentials in .env.local");
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
}

const app = initialize();
const db = admin.firestore();
const SERP_API_KEY = process.env.SERP_API_KEY;

async function fetchGoogleImage(query: string): Promise<string | null> {
  if (!SERP_API_KEY) {
    console.error("Missing SERP_API_KEY in .env.local");
    return null;
  }
  
  try {
    const response = await fetch(`https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}`);
    const data = await response.json();
    
    if (data.images_results && data.images_results.length > 0) {
      // Return the first image result's original URL
      return data.images_results[0].original;
    }
  } catch (error) {
    console.error(`Failed to fetch image for query "${query}":`, error);
  }
  return null;
}

async function backfillImages() {
  console.log("Fetching listings...");
  const snapshot = await db.collection("items").get();
  
  let updatedCount = 0;
  let skippedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Check if the image is missing, empty, or contains a known placeholder URL (like dicebear or picsum)
    const hasNoImages = !data.images || data.images.length === 0;
    const isPlaceholderUrl = !data.image_url || data.image_url.trim() === '' || data.image_url.includes('dicebear') || data.image_url.includes('picsum');

    // If it's a placeholder AND it actually has a title we can search for
    if (isPlaceholderUrl && data.title) {
      console.log(`Replacing abstract placeholder for: "${data.title}" (ID: ${doc.id}). Searching Google Images...`);
      
      const imageUrl = await fetchGoogleImage(data.title);
      
      if (imageUrl) {
        await doc.ref.update({
          image_url: imageUrl,
          images: [imageUrl],
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Successfully attached image: ${imageUrl}`);
        updatedCount++;
      } else {
        console.log(`❌ No image found on Google for: "${data.title}"`);
        skippedCount++;
      }
      
      // Artificial delay to prevent overwhelming SerpApi rate limits
      await new Promise(resolve => setTimeout(resolve, 800));
    } else if (hasNoImages && data.image_url) {
        // Just sync the arrays if they have an image_url but no images array
        await doc.ref.update({ images: [data.image_url] });
    }
  }

  console.log(`\n--- Backfill Complete ---`);
  console.log(`Successfully updated ${updatedCount} listings.`);
  console.log(`Failed to find images for ${skippedCount} listings.`);
}

backfillImages().catch(console.error);
