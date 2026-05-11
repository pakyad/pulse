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
    const guideline = guidelineSnap.exists ? guidelineSnap.data() : null;

    const maxPrice = guideline ? (guideline.max_price || guideline.maxBasePrice) : Infinity;
    const govType = guideline?.governance_type || formData.get("governance_type") as string || 'PREMIUM';
    
    // STEP B: Compare & Categorize
    let isFlagged = false;
    let adminStatus: 'approved' | 'pending' = 'approved';
    let message = "Listing published successfully.";

    if (price > maxPrice) {
        if (govType === 'REGULATED') {
            const isExemptionRequest = formData.get("is_exemption_request") === 'true';
            if (isExemptionRequest) {
                isFlagged = true;
                adminStatus = 'pending';
                message = "Institutional Review Initiated: Your exemption request has been queued for Admin vetting.";
                // We'll use 'PENDING_EXEMPTION' as a visual status for the merchant
            } else {
                return { success: false, message: `Institutional Violation: ${category} assets are capped at RM ${maxPrice}.00.` };
            }
        } else {
            // STEP D: Flagged Execution for PREMIUM
            isFlagged = true;
            adminStatus = 'pending';
            message = "Price exceeds suggested guidelines. Listing saved and sent to Admin for manual review.";
        }
    }

    // STEP C/D: Central Registry Commit
    const productPayload = {
        seller_id: vendorId,
        title,
        price,
        category,
        stock_count: stockCount,
        image_url: imageUrl,
        status: (formData.get("is_exemption_request") === 'true') ? 'pending_exemption' : (adminStatus === 'approved' ? 'active' : 'pending'),
        isFlagged,
        adminStatus,
        governance_type: govType,
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
