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
 * placeOrder (V2)
 * Atomic transaction to decrement stock and create an order.
 * Optimized for Firebase Functions v2.
 */
exports.placeOrder = (0, https_1.onCall)(async (request) => {
    // 1. Authentication Check
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Only signed-in students can place orders.");
    }
    const data = request.data;
    const { itemId, title, price, imageUrl, receiptUrl, sellerId, sellerName, deliveryType, dropOffLocation, buyerName, notes, } = data;
    // 2. Data Validation
    if (!itemId || price === undefined || !sellerId) {
        throw new https_1.HttpsError("invalid-argument", "Missing required fields: itemId, price, or sellerId.");
    }
    const orderId = db.collection("orders").doc().id;
    const itemRef = db.collection("items").doc(itemId);
    const orderRef = db.collection("orders").doc(orderId);
    try {
        return await db.runTransaction(async (transaction) => {
            var _a, _b;
            const itemDoc = await transaction.get(itemRef);
            if (!itemDoc.exists) {
                throw new Error("ITEM_NOT_FOUND");
            }
            const itemData = itemDoc.data();
            const currentStock = (_b = (_a = itemData === null || itemData === void 0 ? void 0 : itemData.stock_count) !== null && _a !== void 0 ? _a : itemData === null || itemData === void 0 ? void 0 : itemData.stock) !== null && _b !== void 0 ? _b : 0;
            // 3. Stock Check
            if (currentStock <= 0) {
                throw new Error("OUT_OF_STOCK");
            }
            // 4. Update Stock
            transaction.update(itemRef, {
                stock_count: currentStock - 1,
            });
            // 5. Create Order document
            transaction.set(orderRef, {
                order_id: orderId,
                item_id: itemId,
                title: title || (itemData === null || itemData === void 0 ? void 0 : itemData.title) || "Marketplace Item",
                price: price,
                image_url: imageUrl || (itemData === null || itemData === void 0 ? void 0 : itemData.image_url) || null,
                receipt_url: receiptUrl || null,
                buyer_id: request.auth.uid,
                buyer_name: buyerName || "Verified Student",
                seller_id: sellerId,
                seller_name: sellerName || "Verified Vendor",
                status: "PENDING_VENDOR",
                delivery_type: deliveryType || "SELF_COLLECT",
                drop_off_location: dropOffLocation || null,
                notes: notes || null,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                order_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            });
            return {
                success: true,
                orderId: orderId,
                message: "Order placed successfully.",
            };
        });
    }
    catch (error) {
        console.error("ORDER_TRANSACTION_FAILED:", error);
        let message = "Something went wrong while placing your order.";
        if (error.message === "OUT_OF_STOCK")
            message = "This item just sold out!";
        if (error.message === "ITEM_NOT_FOUND")
            message = "This item is no longer available.";
        throw new https_1.HttpsError("internal", message);
    }
});
//# sourceMappingURL=index.js.map