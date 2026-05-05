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
        status: 'active',
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
        status: 'inactive',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString()
    });
    
    revalidatePath("/admin/dashboard");
    return { success: true, message: "Listing Rejected." };
  } catch (error) {
    return { success: false, message: "Failed to reject listing." };
  }
}
