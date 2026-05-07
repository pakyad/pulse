"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeOrder = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * placeOrder (V3 Multi-Vendor Splitting)
 * Handles atomic cart decomposition into merchant-specific sub-orders.
 */
exports.placeOrder = (0, https_1.onCall)({
    cors: true,
    maxInstances: 10,
    region: "us-central1"
}, async (request) => {
    var _a;
    const data = request.data || {};
    const { userId, cartItems, deliveryType } = data;
    const buyerId = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!buyerId && !userId) {
        throw new https_1.HttpsError("unauthenticated", "Pulse Authorization Required.");
    }
    const finalUserId = userId || buyerId;
    try {
        return await db.runTransaction(async (transaction) => {
            var _a;
            // 1. THE CHECK (Stock Validation)
            const itemRefs = cartItems.map((item) => db.collection('items').doc(item.productId));
            const itemDocs = await Promise.all(itemRefs.map((ref) => transaction.get(ref)));
            for (let i = 0; i < itemDocs.length; i++) {
                const itemData = itemDocs[i].data();
                if (!itemDocs[i].exists || ((_a = itemData === null || itemData === void 0 ? void 0 : itemData.stock_count) !== null && _a !== void 0 ? _a : 0) < cartItems[i].qty) {
                    throw new https_1.HttpsError("resource-exhausted", `SOLD_OUT: ${(itemData === null || itemData === void 0 ? void 0 : itemData.title) || 'Item'} is unavailable!`);
                }
            }
            // 2. THE SPLIT (Grouping by Vendor)
            const ordersByVendor = {};
            cartItems.forEach((item) => {
                if (!ordersByVendor[item.vendorId]) {
                    ordersByVendor[item.vendorId] = [];
                }
                ordersByVendor[item.vendorId].push(item);
            });
            const parentOrderId = `PULSE-${Date.now()}`;
            let totalAmount = 0;
            cartItems.forEach((item) => totalAmount += (item.price * item.qty));
            // 3. ATOMIC DECREMENT & SUB-ORDER CREATION
            for (const vendorId in ordersByVendor) {
                const subOrderRef = db.collection('orders').doc();
                const itemsForThisVendor = ordersByVendor[vendorId];
                let subtotal = 0;
                itemsForThisVendor.forEach((i) => subtotal += (i.price * i.qty));
                itemsForThisVendor.forEach((item) => {
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
                items_summary: cartItems.map((i) => i.title).join(", "),
                created_at: admin.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, parentId: parentOrderId };
        });
    }
    catch (error) {
        console.error("Order Transaction Failed: ", error.message);
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError("internal", error.message || "Institutional Transaction Failed");
    }
});
//# sourceMappingURL=index.js.map