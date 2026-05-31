"use server"

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

/**
 * SUBMIT ECOSYSTEM REVIEW
 * Validates the buyer session and recalculates averages for both targets.
 */
export async function submitReview(payload: {
  orderId: string,
  buyerId: string,
  vendorRating: number,
  runnerRating: number,
  vendorId: string,
  runnerId: string,
  comment: string
}) {
  try {
    // 1. Security Check: Verify order ownership and status
    const orderDoc = await adminDb.collection("orders").doc(payload.orderId).get();
    if (!orderDoc.exists || orderDoc.data()?.buyer_id !== payload.buyerId) {
      return { success: false, message: "Security Violation: Unauthorized Review Attempt." };
    }
    
    // Note: We use case-insensitive check or common status names
    const status = orderDoc.data()?.status?.toLowerCase();
    if (status !== 'delivered' && status !== 'completed') {
      return { success: false, message: "Review Locked: Order must be delivered first." };
    }

    // Check if already reviewed to prevent spam
    if (orderDoc.data()?.isReviewed) {
        return { success: false, message: "Security Violation: Order already reviewed." };
    }

    // 2. Commit Review Documents
    const batch = adminDb.batch();
    const reviewsRef = adminDb.collection("Reviews");

    // Vendor Review
    const vReviewRef = reviewsRef.doc();
    batch.set(vReviewRef, {
      orderId: payload.orderId,
      reviewerId: payload.buyerId,
      targetId: payload.vendorId,
      targetType: 'vendor',
      rating: payload.vendorRating,
      comment: payload.comment,
      createdAt: new Date().toISOString()
    });

    // Runner Review (only if runner exists)
    if (payload.runnerId) {
      const rReviewRef = reviewsRef.doc();
      batch.set(rReviewRef, {
        orderId: payload.orderId,
        reviewerId: payload.buyerId,
        targetId: payload.runnerId,
        targetType: 'runner',
        rating: payload.runnerRating,
        comment: payload.comment,
        createdAt: new Date().toISOString()
      });
    }

    // Update order status to reviewed
    batch.update(adminDb.collection("orders").doc(payload.orderId), {
        isReviewed: true
    });

    // 3. Mathematical Recalculation (Aggregation)
    const updateTargetRating = async (targetId: string, newRating: number) => {
       const userRef = adminDb.collection("users").doc(targetId);
       const userSnap = await userRef.get();
       if (!userSnap.exists) return; // Silent skip for non-user targets

       const data = userSnap.data() || {};
       const currentAvg = data.averageRating || 0;
       const totalReviews = data.totalReviews || 0;

       const newAvg = ((currentAvg * totalReviews) + newRating) / (totalReviews + 1);
       
       await userRef.update({
         averageRating: Number(newAvg.toFixed(2)),
         totalReviews: totalReviews + 1
       });
    };

    // Execute sequential updates for stability
    if (payload.vendorId) await updateTargetRating(payload.vendorId, payload.vendorRating);
    if (payload.runnerId) await updateTargetRating(payload.runnerId, payload.runnerRating);

    await batch.commit();
    
    revalidatePath("/me/orders");
    return { success: true, message: "Ecosystem Data Updated." };

  } catch (error) {
    console.error("Review Engine Failure:", error);
    return { success: false, message: "Internal Engine Error during aggregation." };
  }
}
