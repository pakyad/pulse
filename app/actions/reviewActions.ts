"use server"

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

/**
 * SUBMIT ECOSYSTEM REVIEW
 * For student sellers: review attaches to the ITEM (one sale = one review).
 * For club merchants: review attaches to the SELLER (accumulates).
 */
export async function submitReview(payload: {
  orderId: string,
  buyerId: string,
  vendorRating: number,
  runnerRating: number,
  vendorId: string,
  runnerId: string,
  comment: string,
  itemId: string,
  targetType: 'ITEM' | 'SELLER'
}) {
  try {
    // 1. Security Check
    const orderDoc = await adminDb.collection("orders").doc(payload.orderId).get();
    if (!orderDoc.exists || orderDoc.data()?.buyer_id !== payload.buyerId) {
      return { success: false, message: "Security Violation: Unauthorized Review Attempt." };
    }
    
    const status = orderDoc.data()?.status?.toLowerCase();
    if (status !== 'delivered' && status !== 'completed') {
      return { success: false, message: "Review Locked: Order must be delivered first." };
    }

    if (orderDoc.data()?.isReviewed) {
        return { success: false, message: "Security Violation: Order already reviewed." };
    }

    // 2. Write Review Document
    const batch = adminDb.batch();
    const reviewsRef = adminDb.collection("Reviews");

    // Product/Item Review
    const reviewRef = reviewsRef.doc();
    batch.set(reviewRef, {
      order_id: payload.orderId,
      item_id: payload.itemId,
      reviewer_id: payload.buyerId,
      seller_id: payload.vendorId,
      target_type: payload.targetType,
      rating: payload.vendorRating,
      comment: payload.comment,
      reply: null,
      created_at: new Date().toISOString()
    });

    // Runner Review (only if runner exists)
    if (payload.runnerId) {
      const rReviewRef = reviewsRef.doc();
      batch.set(rReviewRef, {
        order_id: payload.orderId,
        item_id: payload.itemId,
        reviewer_id: payload.buyerId,
        seller_id: payload.vendorId,
        target_type: 'RUNNER',
        rating: payload.runnerRating,
        comment: payload.comment,
        reply: null,
        created_at: new Date().toISOString()
      });
    }

    // Mark order as reviewed
    batch.update(adminDb.collection("orders").doc(payload.orderId), {
        isReviewed: true
    });

    // 3. Aggregation — only for club sellers (target_type = 'SELLER')
    if (payload.targetType === 'SELLER' && payload.vendorId) {
      const userRef = adminDb.collection("users").doc(payload.vendorId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const data = userSnap.data() || {};
        const currentAvg = data.averageRating || 0;
        const totalReviews = data.totalReviews || 0;
        const newAvg = ((currentAvg * totalReviews) + payload.vendorRating) / (totalReviews + 1);
        await userRef.update({
          averageRating: Number(newAvg.toFixed(2)),
          totalReviews: totalReviews + 1
        });
      }
    }

    await batch.commit();
    
    revalidatePath("/me/orders");
    revalidatePath(`/marketplace/${payload.itemId}`);
    return { success: true, message: "Review submitted." };

  } catch (error) {
    console.error("Review Engine Failure:", error);
    return { success: false, message: "Internal Engine Error." };
  }
}

/**
 * SELLER REPLY TO REVIEW (Club merchants only)
 */
export async function replyToReview(reviewId: string, sellerId: string, text: string) {
  try {
    if (!text.trim()) {
      return { success: false, message: "Reply cannot be empty." };
    }

    const reviewRef = adminDb.collection("Reviews").doc(reviewId);
    const reviewDoc = await reviewRef.get();
    if (!reviewDoc.exists) {
      return { success: false, message: "Review not found." };
    }

    const reviewData = reviewDoc.data()!;
    if (reviewData.seller_id !== sellerId) {
      return { success: false, message: "You can only reply to reviews on your own listings." };
    }

    await reviewRef.update({
      reply: {
        text: text.trim(),
        replied_at: new Date().toISOString(),
        replied_by: sellerId
      }
    });

    revalidatePath(`/marketplace/${reviewData.item_id}`);
    return { success: true, message: "Reply posted." };
  } catch (error) {
    console.error("Reply Error:", error);
    return { success: false, message: "Failed to post reply." };
  }
}
