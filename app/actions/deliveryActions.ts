"use server"

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

/**
 * COMPLETE DELIVERY HANDSHAKE
 * Finalizes the order with visual proof and updates the logistics ledger.
 */
export async function completeDelivery(orderId: string, proofUrl: string) {
  try {
    // 1. Update the Order Registry
    await adminDb.collection("orders").doc(orderId).update({
        status: 'DELIVERED',
        proofOfDeliveryUrl: proofUrl,
        deliveredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });
    
    revalidatePath("/run/active");
    revalidatePath("/me/orders");
    
    return { success: true, message: "Delivery Handshake Complete." };
  } catch (error) {
    console.error("Delivery Completion Error:", error);
    return { success: false, message: "Failed to finalize delivery." };
  }
}
