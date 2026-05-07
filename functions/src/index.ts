import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * placeOrder (V3 Multi-Vendor Splitting)
 * Handles atomic cart decomposition into merchant-specific sub-orders.
 */
export const placeOrder = onCall({ 
  cors: true,
  maxInstances: 10,
  region: "us-central1"
}, async (request) => {
  const data = request.data || {};
  const { userId, cartItems, deliveryType } = data;
  const buyerId = request.auth?.uid;

  if (!buyerId && !userId) {
    throw new HttpsError("unauthenticated", "Pulse Authorization Required.");
  }

  const finalUserId = userId || buyerId;

  try {
    return await db.runTransaction(async (transaction) => {
      // 1. THE CHECK (Stock Validation)
      const itemRefs = cartItems.map((item: any) => db.collection('items').doc(item.productId));
      const itemDocs = await Promise.all(itemRefs.map((ref: any) => transaction.get(ref)));

      for (let i = 0; i < itemDocs.length; i++) {
        const itemData = itemDocs[i].data();
        if (!itemDocs[i].exists || (itemData?.stock_count ?? 0) < cartItems[i].qty) {
          throw new HttpsError("resource-exhausted", `SOLD_OUT: ${itemData?.title || 'Item'} is unavailable!`);
        }
      }

      // 2. THE SPLIT (Grouping by Vendor)
      const ordersByVendor: { [key: string]: any[] } = {};
      cartItems.forEach((item: any) => {
        if (!ordersByVendor[item.vendorId]) {
          ordersByVendor[item.vendorId] = [];
        }
        ordersByVendor[item.vendorId].push(item);
      });

      const parentOrderId = `PULSE-${Date.now()}`;
      let totalAmount = 0;
      cartItems.forEach((item: any) => totalAmount += (item.price * item.qty));

      // 3. ATOMIC DECREMENT & SUB-ORDER CREATION
      for (const vendorId in ordersByVendor) {
        const subOrderRef = db.collection('orders').doc();
        const itemsForThisVendor = ordersByVendor[vendorId];
        let subtotal = 0;
        itemsForThisVendor.forEach((i: any) => subtotal += (i.price * i.qty));

        itemsForThisVendor.forEach((item: any) => {
          const ref = db.collection('items').doc(item.productId);
          transaction.update(ref, {
            stock_count: admin.firestore.FieldValue.increment(-item.qty),
            stock: admin.firestore.FieldValue.increment(-item.qty)
          });
        });

        transaction.set(subOrderRef, {
          order_id: subOrderRef.id,
          parent_id: parentOrderId,
          buyer_id: finalUserId,
          seller_id: vendorId, // Institutional Sync: Must be 'seller_id'
          items: itemsForThisVendor,
          price: subtotal, // Root field for Merchant Analytics
          title: itemsForThisVendor.length > 1 
            ? `${itemsForThisVendor.length} Items Bundle` 
            : itemsForThisVendor[0].title,
          delivery_type: deliveryType || 'RUNNER',
          status: 'PENDING_VENDOR',
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      // 4. CREATE PARENT REGISTRY
      const parentRef = db.collection('parent_orders').doc(parentOrderId);
      transaction.set(parentRef, {
        id: parentOrderId,
        buyer_id: finalUserId,
        total_price: totalAmount,
        item_count: cartItems.length,
        status: 'PAID',
        items_summary: cartItems.map((i: any) => i.title).join(", "),
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, parentId: parentOrderId };
    });

  } catch (error: any) {
    console.error("Order Transaction Failed: ", error.message);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", error.message || "Institutional Transaction Failed");
  }
});