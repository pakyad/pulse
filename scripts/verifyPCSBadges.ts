import admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";
import { MARKETPLACE_CATEGORIES, CategoryID } from "../lib/marketplace/categories";

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

async function verifyPCSBadges() {
  console.log("Fetching listings to verify PCS authenticity...");
  const snapshot = await db.collection("items").get();
  
  const batch = db.batch();
  let strippedCount = 0;
  let verifiedCount = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    
    // Check if it claims to have the PCS Approved Badge
    const hasPcsBadge = data.pcs_certified === true && data.pcs_status === 'APPROVED';

    if (hasPcsBadge) {
      // Let's verify if this category is actually allowed to have a PCS Approved badge
      const categoryId = data.category as CategoryID;
      const categoryConfig = MARKETPLACE_CATEGORIES[categoryId];
      
      let isEligibleForPCS = false;

      if (categoryConfig) {
        const subConfig = categoryConfig.subcategories.find(sub => sub.label === data.subcategory);
        // It is eligible for PCS Approval ONLY if comparable is true (meaning it goes through AI SerpAPI)
        if (subConfig && subConfig.comparable === true) {
          isEligibleForPCS = true;
        }
      }

      if (!isEligibleForPCS) {
        // It's a fraudulent badge! This item bypassed AI but was seeded with a badge.
        // We will remove the badge by resetting it to FREE_MARKET.
        console.log(`[STRIPPING BADGE] ${data.title} (${data.subcategory}) is not eligible for PCS AI approval.`);
        batch.update(doc.ref, {
          pcs_certified: false,
          pcs_status: 'FREE_MARKET',
          pcs_reason: 'Removed: Category does not undergo PCS AI validation.'
        });
        strippedCount++;
      } else {
        // It is legally allowed to have the badge
        verifiedCount++;
      }
    }
  });

  if (strippedCount > 0) {
    await batch.commit();
    console.log(`\n✅ Swept the database! Stripped fraudulent PCS badges from ${strippedCount} listings.`);
  } else {
    console.log(`\n✅ All good! No fraudulent PCS badges found.`);
  }
  
  console.log(`Verified ${verifiedCount} legitimate PCS approved listings.`);
}

verifyPCSBadges().catch(console.error);
