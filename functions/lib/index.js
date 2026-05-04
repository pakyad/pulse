"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeOrder = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
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
exports.placeOrder = (0, https_1.onCall)({
    cors: true,
    maxInstances: 10,
    region: "us-central1"
}, async (request) => {
    var _a;
    console.log("🏛️ TERMINAL_INVOKED:", {
        uid: (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid,
        data: request.data
    });
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "Pulse Authorization Required.");
    }
    const data = request.data || {};
    const { itemId, sellerId, price } = data;
    if (!itemId || !sellerId) {
        throw new https_1.HttpsError("invalid-argument", "Institutional payload incomplete.");
    }
    const orderId = db.collection("orders").doc().id;
    const itemRef = db.collection("items").doc(itemId);
    const orderRef = db.collection("orders").doc(orderId);
    try {
        const result = await db.runTransaction(async (transaction) => {
            var _a, _b;
            const itemDoc = await transaction.get(itemRef);
            if (!itemDoc.exists)
                throw new https_1.HttpsError("not-found", "Item node not found.");
            const itemData = itemDoc.data();
            const currentStock = Number((_b = (_a = itemData === null || itemData === void 0 ? void 0 : itemData.stock_count) !== null && _a !== void 0 ? _a : itemData === null || itemData === void 0 ? void 0 : itemData.stock) !== null && _b !== void 0 ? _b : 1);
            if (currentStock <= 0)
                throw new https_1.HttpsError("out-of-range", "This item just sold out!");
            transaction.update(itemRef, { stock_count: currentStock - 1 });
            transaction.set(orderRef, {
                order_id: orderId,
                item_id: itemId,
                title: data.title || (itemData === null || itemData === void 0 ? void 0 : itemData.title) || "Marketplace Item",
                price: Number(price) || Number(itemData === null || itemData === void 0 ? void 0 : itemData.price) || 0,
                image_url: data.imageUrl || (itemData === null || itemData === void 0 ? void 0 : itemData.image_url) || null,
                receipt_url: data.receiptUrl || null,
                buyer_id: request.auth.uid,
                buyer_name: data.buyerName || "Verified Student",
                seller_id: sellerId,
                seller_name: data.sellerName || "Verified Vendor",
                status: "PENDING_VENDOR",
                delivery_type: data.deliveryType || "SELF_COLLECT",
                drop_off_location: data.dropOffLocation || null,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                order_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
            });
            return { success: true, orderId };
        });
        return result;
    }
    catch (error) {
        console.error("🏛️ TERMINAL_CRASH:", error);
        if (error.code && error.message)
            throw error;
        throw new https_1.HttpsError("internal", `Transaction failed: ${error.message}`);
    }
});
//# sourceMappingURL=index.js.map