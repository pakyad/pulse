"use server"

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

/**
 * UPDATE PRICE GUIDELINE
 * Modifies the institutional price ceiling for a category.
 */
export async function updatePriceGuideline(category: string, newMaxPrice: number, governanceType: 'REGULATED' | 'PREMIUM' = 'REGULATED') {
  try {
    const docId = category.toLowerCase();
    await adminDb.collection("PriceGuidelines").doc(docId).set({
      category: category,
      max_price: newMaxPrice,
      governance_type: governanceType,
      updated_at: new Date().toISOString()
    }, { merge: true });

    revalidatePath("/admin/dashboard");
    return { success: true, message: `Guideline for ${category} updated to RM ${newMaxPrice}` };
  } catch (error) {
    console.error("Guideline Update Error:", error);
    return { success: false, message: "Failed to update guideline." };
  }
}

/**
 * RESOLVE DISPUTE (Financial Mediation)
 */
export async function resolveDispute(disputeId: string, action: 'REFUND' | 'RELEASE') {
    try {
        const disputeRef = adminDb.collection("disputes").doc(disputeId);
        const disputeDoc = await disputeRef.get();
        
        if (!disputeDoc.exists) return { success: false, message: "Dispute not found." };
        
        const data = disputeDoc.data();
        const orderId = data?.order_id;
        
        // 1. Update Order Status
        const newStatus = action === 'REFUND' ? 'REFUNDED' : 'COMPLETED';
        await adminDb.collection("orders").doc(orderId).update({
            status: newStatus,
            resolution_type: action,
            resolved_at: new Date().toISOString()
        });
        
        // 2. Update Dispute Registry
        await disputeRef.update({
            status: 'RESOLVED',
            resolution: action,
            resolved_at: new Date().toISOString()
        });

        // 3. Penalty Logic (Example: If refund, merchant gets strike)
        if (action === 'REFUND') {
            const sellerId = data?.seller_id;
            if (sellerId) {
                await adminDb.collection("users").doc(sellerId).update({
                    reputation: adminDb.firestore.FieldValue.increment(-5)
                });
            }
        }
        
        revalidatePath("/admin/dashboard");
        return { success: true, message: `Dispute resolved via ${action}` };
    } catch (error) {
        console.error("Dispute Resolution Error:", error);
        return { success: false, message: "Failed to resolve dispute." };
    }
}
