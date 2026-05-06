"use server"

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

/**
 * SMART PRICE MONITORING ENGINE (Server Action)
 * Enforces institutional price ceilings and handles flagging logic.
 */
export async function submitProductListing(formData: FormData) {
  // 1. Secure Field Extraction
  const title = formData.get("title") as string;
  const price = parseFloat(formData.get("price") as string);
  const category = formData.get("category") as string;
  const justification = formData.get("justification") as string || "";
  const vendorId = formData.get("vendorId") as string;
  const imageUrl = formData.get("image_url") as string;
  const stockCount = parseInt(formData.get("stock_count") as string) || 1;

  // Basic Validation Guard
  if (!title || isNaN(price) || !category || !vendorId || !imageUrl) {
    return { success: false, message: "Protocol Violation: Missing required listing assets." };
  }

  try {
    // STEP A: Fetch Institutional Guideline
    const guidelineRef = adminDb.collection("PriceGuidelines").doc(category);
    const guidelineSnap = await guidelineRef.get();

    if (!guidelineSnap.exists) {
        console.warn(`[Pulse Audit] Missing guideline for category: ${category}. Proceeding with default vetting.`);
    }

    const maxBasePrice = guidelineSnap.exists ? guidelineSnap.data()?.maxBasePrice : Infinity;
    
    // STEP B: Compare & Categorize
    let isFlagged = false;
    let adminStatus: 'approved' | 'pending' = 'approved';
    let message = "Listing published successfully.";

    if (price > maxBasePrice) {
        // STEP D: Flagged Execution
        isFlagged = true;
        adminStatus = 'pending';
        message = "Price exceeds campus guidelines. Listing saved and sent to Admin for manual review.";
    }

    // STEP C/D: Central Registry Commit
    const productPayload = {
        seller_id: vendorId,
        title,
        price,
        category,
        stock_count: parseInt(formData.get("stock_count") as string) || 1,
        image_url: imageUrl,
        status: adminStatus === 'approved' ? 'active' : 'pending',
        isFlagged,
        adminStatus,
        justification,
        created_at: new Date().toISOString()
    };

    // Commit to the central 'items' collection
    const docRef = await adminDb.collection("items").add(productPayload);

    // Refresh relevant UI segments
    revalidatePath("/merchant");
    revalidatePath("/marketplace");

    return { 
        success: true, 
        isFlagged, 
        message,
        id: docRef.id 
    };

  } catch (error: any) {
    console.error("Critical Price Engine Failure:", error);
    return { success: false, message: "Internal Registry Error during price audit." };
  }
}
