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
  const itemId = data.item_id || data.itemId;
  const price = data.price;

  if (!itemId) {
    throw new HttpsError("invalid-argument", "Institutional payload incomplete: Missing Item ID.");
  }

  const orderId = db.collection("orders").doc().id;
  const itemRef = db.collection("items").doc(itemId);
  const orderRef = db.collection("orders").doc(orderId);

  try {
    return await db.runTransaction(async (transaction) => {
      let itemDoc = await transaction.get(itemRef);
      let itemData: any = null;

      if (!itemDoc.exists) {
        // 🏛️ Pulse Institutional Fallback: Self-Healing Registry
        if (itemId.startsWith('d_')) {
          console.log("🏛️ Initializing Virtual Asset Handshake:", itemId);
          const FALLBACK_MAP: Record<string, any> = {
            'd_pro_kit': { title: 'Official UniKL Football Match-Day Kit (PRO)', price: 120, seller_id: '2GSboliteBeTsO3eeVCIoBseLB62', seller_name: 'Kelab Bola UniKL' },
            'd_scarf_fix': { title: 'UniKL Football Club Scarf', price: 25, seller_id: '2GSboliteBeTsO3eeVCIoBseLB62', seller_name: 'Kelab Bola UniKL' },
            'd_jersey_2026': { title: 'Official UniKL Football Jersey 2026', price: 95, seller_id: '2GSboliteBeTsO3eeVCIoBseLB62', seller_name: 'Kelab Bola UniKL' }
          };
          itemData = FALLBACK_MAP[itemId];
          if (!itemData) throw new HttpsError("not-found", "Target asset unknown to registry.");
        } else {
          throw new HttpsError("not-found", "Target asset not found in registry.");
        }
      } else {
        itemData = itemDoc.data();
      }

      const verifiedSellerId = itemData?.seller_id || itemData?.sellerId || data.seller_id || data.sellerId;
      
      if (!verifiedSellerId) {
        throw new HttpsError("failed-precondition", "Target asset has no verified owner node.");
      }

      const stock = itemData?.stock_count ?? itemData?.stock ?? 100;
      if (stock <= 0) {
        throw new HttpsError("out-of-resource", "Asset sold out during handshake.");
      }

      // Update Inventory (Only for real documents)
      if (itemDoc.exists) {
        transaction.update(itemRef, { 
          stock_count: stock - 1,
          stock: stock - 1 
        });
      }

      // Register Entry
      transaction.set(orderRef, {
        order_id: orderId,
        item_id: itemId,
        title: data.title || itemData?.title || "Marketplace Item",
        price: Number(price) || Number(itemData?.price) || 0,
        image_url: data.image_url || data.imageUrl || itemData?.image_url || null,
        receipt_url: data.receipt_url || data.receiptUrl || null,
        buyer_id: request.auth!.uid,
        buyer_name: data.buyer_name || data.buyerName || "Verified Student",
        seller_id: verifiedSellerId,
        seller_name: data.seller_name || data.sellerName || itemData?.seller_name || "Verified Vendor",
        status: "PENDING_VENDOR",
        delivery_type: data.delivery_type || data.deliveryType || "RUNNER",
        drop_off_location: data.drop_off_location || data.dropOffLocation || null,
        runner_id: null,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        order_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });

      return { success: true, orderId: orderId };
    });
  } catch (e: any) {
    console.error("[Pulse Transaction Failure]:", e);
    throw new HttpsError("internal", e.message || "Transaction Handshake Failed");
  }
});
