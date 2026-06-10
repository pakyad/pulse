"use server"

import { adminDb, getAdminDb, getAdminAuth } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

/**
 * COMPLETE DELIVERY HANDSHAKE
 * Finalizes the order with visual proof and credits the runner's wallet.
 */
export async function completeDelivery(orderId: string, proofUrl: string, callerUid: string) {
  try {
    if (!callerUid) {
      return { success: false, message: "Authentication required." };
    }

    const orderRef = adminDb.collection("orders").doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return { success: false, message: "Order not found." };
    }

    const orderData = orderDoc.data()!;
    if (orderData.runner_id !== callerUid) {
      return { success: false, message: "You are not the assigned runner for this order." };
    }

    // 1. Credit runner's wallet
    const runnerFee = Number(orderData.runner_fee || orderData.delivery_fee || orderData.payout || 4.50);
    const runnerRef = adminDb.collection("users").doc(callerUid);
    const runnerDoc = await runnerRef.get();
    const currentBalance = runnerDoc.exists ? (runnerDoc.data()!.balance || 0) : 0;

    const db = getAdminDb();
    await db.runTransaction(async (tx) => {
      tx.update(orderRef, {
        status: 'DELIVERED',
        delivered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        delivery_proof_url: proofUrl,
        finalized_at: new Date().toISOString()
      });

      tx.update(runnerRef, {
        balance: currentBalance + runnerFee,
        current_missions: []
      });

      const txRef = db.collection("users").doc(callerUid).collection("transactions").doc();
      tx.set(txRef, {
        item: orderData.title || 'Delivery Completed',
        price: runnerFee,
        latest_balance: currentBalance + runnerFee,
        type: 'EARNING',
        date: new Date().toISOString(),
        timestamp: new Date()
      });
    });

    revalidatePath("/run/terminal");
    revalidatePath("/me/orders");
    revalidatePath(`/orders/${orderId}`);

    return { success: true, message: "Delivery Handshake Complete." };
  } catch (error) {
    console.error("Delivery Completion Error:", error);
    return { success: false, message: "Failed to finalize delivery." };
  }
}
