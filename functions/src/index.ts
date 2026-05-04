import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * placeOrder (V2 Institutional)
 * Zero-config regional architecture for high-stability commerce.
 */
export const placeOrder = onCall({ 
  cors: true,
  maxInstances: 10 
}, async (request) => {
  console.log("🏛️ TERMINAL_INVOKED:", { 
    uid: request.auth?.uid,
    data: request.data 
  });

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Login required.");
  }

  const data = request.data || {};
  const {
    itemId,
    title,
    price,
    imageUrl,
    receiptUrl,
    sellerId,
    sellerName,
    deliveryType,
    dropOffLocation,
    buyerName,
  } = data;

  if (!itemId || price === undefined || !sellerId) {
    throw new HttpsError("invalid-argument", "Missing required fields.");
  }

  const orderId = db.collection("orders").doc().id;
  const itemRef = db.collection("items").doc(itemId);
  const orderRef = db.collection("orders").doc(orderId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const itemDoc = await transaction.get(itemRef);
      if (!itemDoc.exists) throw new HttpsError("not-found", "Item not found.");

      const itemData = itemDoc.data();
      const currentStock = itemData?.stock_count ?? itemData?.stock ?? 1;

      if (currentStock <= 0) throw new HttpsError("out-of-range", "Sold out.");

      transaction.update(itemRef, { stock_count: currentStock - 1 });

      transaction.set(orderRef, {
        order_id: orderId,
        item_id: itemId,
        title: title || itemData?.title || "Marketplace Item",
        price: Number(price) || 0,
        image_url: imageUrl || itemData?.image_url || null,
        receipt_url: receiptUrl || null,
        buyer_id: request.auth!.uid,
        buyer_name: buyerName || "Verified Student",
        seller_id: sellerId,
        seller_name: sellerName || "Verified Vendor",
        status: "PENDING_VENDOR",
        delivery_type: deliveryType || "SELF_COLLECT",
        drop_off_location: dropOffLocation || null,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        order_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });

      return { success: true, orderId };
    });

    return result;
  } catch (error: any) {
    console.error("🏛️ TERMINAL_CRASH:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Institutional transaction failed.");
  }
});

/**
 * createRunDirective (V2)
 * Creates a logistics directive in the unified 'orders' collection.
 */
export const createRunDirective = onCall({ cors: true }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Auth required.");
  
  const orderId = db.collection("orders").doc().id;
  const orderRef = db.collection("orders").doc(orderId);

  await orderRef.set({
    order_id: orderId,
    buyer_id: request.auth.uid,
    buyer_name: request.auth.token.name || "Student",
    status: "WAITING_FOR_RUNNER",
    delivery_type: "RUNNER",
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    order_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    ...request.data
  });

  return { success: true, orderId };
});
