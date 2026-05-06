"use server"

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

/**
 * AUTHORIZE OVERRIDE
 * Moves a listing from 'pending_review' to 'approved' and sets status to 'active'.
 */
export async function approveListing(productId: string) {
  try {
    await adminDb.collection("items").doc(productId).update({
        adminStatus: 'approved',
        is_active: true, // Visible to marketplace
        isFlagged: false, 
        reviewed_at: new Date().toISOString()
    });
    
    revalidatePath("/admin/dashboard");
    return { success: true, message: "Listing Authorized." };
  } catch (error) {
    return { success: false, message: "Failed to authorize listing." };
  }
}

/**
 * REJECT & REQUIRE ADJUSTMENT
 * Marks the listing as rejected, requiring the vendor to lower the price.
 */
export async function rejectListing(productId: string, reason: string) {
  try {
    await adminDb.collection("items").doc(productId).update({
        adminStatus: 'rejected',
        is_active: false, // Hidden from marketplace
        rejection_reason: reason,
        reviewed_at: new Date().toISOString()
    });
    
    revalidatePath("/admin/dashboard");
    return { success: true, message: "Listing Rejected." };
  } catch (error) {
    return { success: false, message: "Failed to reject listing." };
  }
}

/**
 * RESOLVE DISPUTE
 * Marks a dispute ticket as resolved in the central registry.
 */
export async function resolveDispute(disputeId: string) {
  try {
    await adminDb.collection("disputes").doc(disputeId).update({
        status: 'RESOLVED',
        resolved_at: new Date().toISOString()
    });
    
    revalidatePath("/admin/dashboard");
    return { success: true, message: "Dispute Resolved." };
  } catch (error) {
    console.error("Dispute Resolution Failure:", error);
    return { success: false, message: "Failed to resolve dispute." };
  }
}
