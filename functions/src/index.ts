import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// 🏛️ EMULATOR DETECTION & SYNC
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  db.settings({
    host: 'localhost:8080',
    ssl: false
  });
}

/**
 * placeOrder (V2 Institutional)
 * Zero-config regional architecture for high-stability commerce.
 */
export const placeOrder = onCall({ 
  cors: true,
  maxInstances: 10,
  region: "us-central1"
}, async (request) => {
  console.log("🏛️ TERMINAL_INVOKED:", { 
    uid: request.auth?.uid,
    data: request.data 
  });

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Pulse Authorization Required.");
  }

  const data = request.data || {};
  const { itemId, sellerId, price } = data;

  if (!itemId || !sellerId) {
    throw new HttpsError("invalid-argument", "Institutional payload incomplete.");
  }

  const orderId = db.collection("orders").doc().id;
  const itemRef = db.collection("items").doc(itemId);
  const orderRef = db.collection("orders").doc(orderId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const itemDoc = await transaction.get(itemRef);
      if (!itemDoc.exists) throw new HttpsError("not-found", "Item node not found.");

      const itemData = itemDoc.data();
      const currentStock = Number(itemData?.stock_count ?? itemData?.stock ?? 1);

      if (currentStock <= 0) throw new HttpsError("out-of-range", "This item just sold out!");

      transaction.update(itemRef, { stock_count: currentStock - 1 });

      transaction.set(orderRef, {
        order_id: orderId,
        item_id: itemId,
        title: data.title || itemData?.title || "Marketplace Item",
        price: Number(price) || Number(itemData?.price) || 0,
        image_url: data.imageUrl || itemData?.image_url || null,
        receiptUrl: data.receiptUrl || null,
        buyer_id: request.auth!.uid,
        buyerName: data.buyerName || "Verified Student",
        seller_id: sellerId,
        sellerName: data.sellerName || "Verified Vendor",
        status: "PENDING_VENDOR",
        deliveryType: data.deliveryType || "SELF_COLLECT",
        dropOffLocation: data.dropOffLocation || null,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        order_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });

      return { success: true, orderId };
    });

    return result;
  } catch (error: any) {
    console.error("🏛️ TERMINAL_CRASH:", error);
    if (error.code && error.message) throw error;
    throw new HttpsError("internal", `Transaction failed: ${error.message}`);
  }
});
