"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

/**
 * ATOMIC ORDER CANCELLATION
 * Strict cancellation protocol ensuring stock is released automatically.
 */
export async function cancelOrder(orderId: string, role: 'BUYER' | 'MERCHANT', userId: string) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    
    await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) throw new Error("Order not found");
      
      const orderData = orderDoc.data()!;
      const currentStatus = orderData.status?.toUpperCase() || 'PENDING';
      
      // Strict Cancellation Rules
      if (role === 'BUYER') {
        const allowed = ['PENDING', 'PENDING_VENDOR', 'PENDING_RUNNER'];
        if (!allowed.includes(currentStatus)) {
          throw new Error("Cannot cancel after order has been accepted by merchant or runner.");
        }
      } else if (role === 'MERCHANT') {
        if (currentStatus !== 'PENDING_VENDOR') {
          throw new Error("Merchant can only reject pending orders.");
        }
      }
      
      // Release Stock (if it's a marketplace item with inventory)
      if (orderData.items && Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
          // checkout/page.tsx saves the ID as productId and collection is 'items'
          const targetId = item.productId || item.id;
          if (targetId) {
            const productRef = db.collection("items").doc(targetId);
            const productDoc = await transaction.get(productRef);
            if (productDoc.exists) {
              const currentStock = productDoc.data()!.stock_count || productDoc.data()!.stock || 0;
              transaction.update(productRef, {
                stock_count: currentStock + (item.qty || 1)
              });
            }
          }
        }
      }
      
      // Update Order Status
      transaction.update(orderRef, {
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancelled_by: role.toLowerCase()
      });
    });
    
    // Revalidate relevant pages
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/me/orders");
    revalidatePath("/merchant/orders");
    
    return { success: true };
  } catch (error: any) {
    console.error("Order Cancellation Error:", error);
    return { success: false, message: error.message || "Failed to cancel order" };
  }
}
