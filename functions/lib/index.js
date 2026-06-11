"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = exports.pcsValidate = exports.onReviewCreated = exports.onOrderCreated = exports.onOrderStatusChanged = exports.completeHandshake = exports.adjudicateAppeal = exports.priceSentinel = exports.placeOrder = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const params_1 = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const v1_1 = require("firebase-functions/v1");
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
    const { userId, cartItems, deliveryType, dropOffLocation, receiptUrl } = data;
    const buyerId = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!buyerId && !userId) {
        throw new https_1.HttpsError("unauthenticated", "Pulse Authorization Required.");
    }
    const finalUserId = userId || buyerId;
    try {
        return await db.runTransaction(async (transaction) => {
            var _a, _b, _c;
            // 1. THE CHECK (Stock Validation)
            const itemRefs = cartItems.map((item) => db.collection('items').doc(item.productId));
            const itemDocs = await Promise.all(itemRefs.map((ref) => transaction.get(ref)));
            for (let i = 0; i < itemDocs.length; i++) {
                const itemDoc = itemDocs[i];
                const itemData = itemDoc.data();
                if (!itemDoc.exists) {
                    throw new https_1.HttpsError("not-found", `Item ${cartItems[i].title} no longer exists in registry.`);
                }
                const currentStock = (_a = itemData === null || itemData === void 0 ? void 0 : itemData.stock_count) !== null && _a !== void 0 ? _a : 0;
                if (currentStock < cartItems[i].qty) {
                    throw new https_1.HttpsError("resource-exhausted", `SOLD_OUT: Only ${currentStock} units of ${itemData === null || itemData === void 0 ? void 0 : itemData.title} remain.`);
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
            // Use Firestore prices, not client-supplied prices
            const actualPrices = {};
            for (let i = 0; i < cartItems.length; i++) {
                const itemData = (_b = itemDocs[i]) === null || _b === void 0 ? void 0 : _b.data();
                actualPrices[cartItems[i].productId] = (_c = itemData === null || itemData === void 0 ? void 0 : itemData.price) !== null && _c !== void 0 ? _c : cartItems[i].price;
            }
            let totalAmount = 0;
            cartItems.forEach((item) => totalAmount += ((actualPrices[item.productId] || item.price) * item.qty));
            // 3. ATOMIC DECREMENT & SUB-ORDER CREATION
            for (const vendorId in ordersByVendor) {
                const subOrderRef = db.collection('orders').doc();
                const itemsForThisVendor = ordersByVendor[vendorId];
                let subtotal = 0;
                itemsForThisVendor.forEach((i) => subtotal += ((actualPrices[i.productId] || i.price) * i.qty));
                // Stock decrement moved to Merchant "Prepare Order" stage per REQ_FIX_5
                transaction.set(subOrderRef, {
                    order_id: subOrderRef.id,
                    parent_id: parentOrderId,
                    buyer_id: finalUserId,
                    seller_id: vendorId,
                    items: itemsForThisVendor.map((item) => ({
                        ...item,
                        price: actualPrices[item.productId] || item.price // Store actual price in item record
                    })),
                    price: subtotal,
                    title: itemsForThisVendor.length > 1
                        ? `${itemsForThisVendor.length} Items Bundle`
                        : itemsForThisVendor[0].title,
                    delivery_type: deliveryType || 'RUNNER',
                    drop_off_location: dropOffLocation || null,
                    receipt_url: receiptUrl || null,
                    status: 'PENDING_VENDOR',
                    handshake: {
                        seller_confirmed: false,
                        buyer_confirmed: false,
                        seller_coords: null,
                        buyer_coords: null,
                        verification_type: 'PENDING'
                    },
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
/**
 *  Price Sentinel (UC_1801)
 * Autonomous enforcement of institutional category ceilings.
 */
exports.priceSentinel = (0, https_1.onCall)({
    cors: true,
    region: "us-central1"
}, async (request) => {
    const data = request.data || {};
    const { itemId, price, category } = data;
    const CEILINGS = {
        'Food': 30,
        'Tech': 500,
        'Apparel': 150,
        'Stationery': 50,
        'Institutional': 200
    };
    const ceiling = CEILINGS[category] || 9999;
    if (price > ceiling) {
        await admin.firestore().collection('items').doc(itemId).update({
            status: 'FLAGGED_FOR_REVIEW',
            is_active: false,
            flagged_at: admin.firestore.FieldValue.serverTimestamp()
        });
        // Atomic Governance Log
        await admin.firestore().collection('governance_logs').add({
            target_id: itemId,
            type: 'PRICE_BLOCK',
            details: `Price RM${price} exceeds RM${ceiling} ceiling for ${category}.`,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        return { flagged: true, ceiling };
    }
    return { flagged: false };
});
/**
 *  Adjudicate Appeal
 */
exports.adjudicateAppeal = (0, https_1.onCall)({ cors: true }, async (request) => {
    const data = request.data || {};
    const { itemId, appealId, action, adminId } = data;
    const status = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED_PERMANENTLY';
    const isActive = action === 'APPROVE';
    await admin.firestore().runTransaction(async (t) => {
        t.update(admin.firestore().collection('items').doc(itemId), { status, is_active: isActive });
        t.update(admin.firestore().collection('appeals').doc(appealId), {
            status: 'RESOLVED',
            resolution: action,
            resolved_at: admin.firestore.FieldValue.serverTimestamp()
        });
        const logRef = admin.firestore().collection('governance_logs').doc();
        t.set(logRef, {
            target_id: itemId,
            type: 'ADJUDICATION',
            details: `Admin ${adminId} ${action} item price.`,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    });
    return { success: true };
});
/**
 *  completeHandshake (UC_1901)
 * Proximity-based Double-Check Handshake.
 */
exports.completeHandshake = (0, https_1.onCall)({
    cors: true,
    region: "us-central1"
}, async (request) => {
    const data = request.data || {};
    const { orderId, role, coords } = data; // role: 'seller' | 'buyer'
    if (!orderId || !role || !coords) {
        throw new https_1.HttpsError("invalid-argument", "Missing handshake parameters.");
    }
    const orderRef = db.collection('orders').doc(orderId);
    await db.runTransaction(async (transaction) => {
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists)
            throw new https_1.HttpsError("not-found", "Order not found.");
        const order = orderDoc.data();
        const handshake = order.handshake || {};
        if (role === 'seller') {
            handshake.seller_confirmed = true;
            handshake.seller_coords = coords;
        }
        else {
            handshake.buyer_confirmed = true;
            handshake.buyer_coords = coords;
        }
        // Logic: If both confirmed, perform the Proximity Audit
        if (handshake.seller_confirmed && handshake.buyer_confirmed) {
            const dist = calculateDistance(handshake.seller_coords.lat, handshake.seller_coords.lng, handshake.buyer_coords.lat, handshake.buyer_coords.lng);
            handshake.distance = dist;
            const isSafe = dist <= 50;
            handshake.verification_type = isSafe ? 'IN_PERSON_SAFE' : 'REMOTE';
            transaction.update(orderRef, {
                status: isSafe ? 'COMPLETED' : 'DELIVERED',
                handshake,
                completed_at: admin.firestore.FieldValue.serverTimestamp(),
                auto_adjudicated: isSafe
            });
            // Log the outcome in the Governance Ledger
            const logRef = db.collection('governance_logs').doc();
            transaction.set(logRef, {
                target_id: orderId,
                type: isSafe ? 'AUTO_COMPLETION' : 'HANDSHAKE_COMPLETED',
                details: isSafe
                    ? `Order ${orderId} automatically finalized via Absolute Trust Proximity Audit.`
                    : `Order ${orderId} verified as ${handshake.verification_type} (${Math.round(dist)}m).`,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        else {
            transaction.update(orderRef, { handshake });
        }
    });
    return { success: true };
});
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // in metres
}
/**
 *  Push Notification Engine
 * Listens for order status changes and sends FCM push notifications to the buyer.
 */
exports.onOrderStatusChanged = (0, firestore_1.onDocumentUpdated)("orders/{orderId}", async (event) => {
    var _a, _b;
    const dataBefore = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const dataAfter = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!dataBefore || !dataAfter)
        return null;
    const oldStatus = dataBefore.status;
    const newStatus = dataAfter.status;
    if (oldStatus === newStatus)
        return null;
    const buyerId = dataAfter.buyer_id;
    if (!buyerId)
        return null;
    // Get buyer's FCM token
    const userDoc = await db.collection('users').doc(buyerId).get();
    const userData = userDoc.data();
    const fcmToken = userData === null || userData === void 0 ? void 0 : userData.fcmToken;
    if (!fcmToken) {
        logger.log(`No FCM token found for user ${buyerId}`);
        return null;
    }
    let title = "Order Update";
    let body = "";
    if (newStatus === 'ACCEPTED_BY_RUNNER' || newStatus === 'ON_THE_WAY') {
        body = "Your order is on the way to pickup the order!";
    }
    else if (newStatus === 'PICKED_UP') {
        body = "Rider is on the way to you.";
    }
    if (!body)
        return null;
    const message = {
        notification: {
            title,
            body
        },
        token: fcmToken
    };
    try {
        await admin.messaging().send(message);
        logger.log(`Push notification sent to ${buyerId} for order ${event.params.orderId}`);
        return null;
    }
    catch (error) {
        logger.error("Error sending push notification:", error);
        return null;
    }
});
/**
 * onOrderCreated
 * Fires when a new order document is created. Writes a notification to the seller
 * and creates a POST_PURCHASE conversation thread between buyer and seller.
 */
exports.onOrderCreated = (0, firestore_1.onDocumentCreated)("orders/{orderId}", async (event) => {
    var _a, _b, _c, _d;
    const snap = event.data;
    if (!snap)
        return;
    const order = snap.data();
    const orderId = event.params.orderId;
    const itemName = order.title || ((_b = (_a = order.items) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.title) || "Item";
    const sellerId = order.seller_id;
    const buyerId = order.buyer_id;
    const handoverNode = order.drop_off_location || "Main Campus";
    const itemId = ((_d = (_c = order.items) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.productId) || "";
    if (!sellerId || !buyerId) {
        logger.warn(`[onOrderCreated] Missing seller or buyer on order ${orderId}`);
        return;
    }
    let buyerName = order.customer_name || "Buyer";
    let sellerName = order.seller_name || "Seller";
    try {
        const [buyerSnap, sellerSnap] = await Promise.all([
            db.collection("users").doc(buyerId).get(),
            db.collection("users").doc(sellerId).get(),
        ]);
        if (buyerSnap.exists) {
            const d = buyerSnap.data();
            buyerName = d.fullName || d.full_name || d.name || buyerName;
        }
        if (sellerSnap.exists) {
            const d = sellerSnap.data();
            sellerName = d.fullName || d.full_name || d.name || sellerName;
        }
    }
    catch (e) {
        logger.warn(`[onOrderCreated] Could not fetch user profiles for order ${orderId}`);
    }
    try {
        // 1. Write notification to seller
        await db.collection("notifications").add({
            user_id: sellerId,
            type: "SALE",
            title: "Item Sold! ",
            body: `Your ${itemName} was just purchased. Drop it at ${handoverNode} for the runner.`,
            order_id: orderId,
            is_read: false,
            category: "COMMERCE",
            created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`[onOrderCreated] Notification written for seller ${sellerId} on order ${orderId}`);
        // 2. Create post-purchase conversation thread
        const chatId = `post_${sellerId}_${buyerId}_${orderId}`;
        const chatRef = db.collection("chats").doc(chatId);
        const lastMessageText = `Hi! I just purchased your ${itemName} (Order #${orderId.slice(0, 8).toUpperCase()}). Looking forward to receiving it! `;
        await chatRef.set({
            members: [sellerId, buyerId],
            participant_names: {
                [sellerId]: sellerName,
                [buyerId]: buyerName,
            },
            type: "MARKETPLACE",
            context_title: itemName,
            context_id: itemId,
            orderId: orderId,
            context: "POST_PURCHASE",
            lastMessage: lastMessageText,
            last_message_sender_id: buyerId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            unread_count: 1,
        });
        await chatRef.collection("messages").add({
            senderId: buyerId,
            text: lastMessageText,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isSystemMessage: true,
        });
        logger.info(`[onOrderCreated] Post-purchase chat ${chatId} created for order ${orderId}`);
        // 3. Store chatId on the order for easy lookup
        await snap.ref.update({ conversationId: chatId });
    }
    catch (error) {
        logger.error(`[onOrderCreated] Error processing order ${orderId}:`, error);
    }
});
/**
 * onReviewCreated
 * Fires when a new review document is created in the "Reviews" collection.
 * Recalculates the seller's trustRating and totalReviews.
 */
exports.onReviewCreated = (0, firestore_1.onDocumentCreated)("Reviews/{reviewId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const review = snap.data();
    const sellerId = review.sellerId || review.seller_id;
    const itemId = review.itemId || review.item_id;
    const rating = Number(review.rating);
    if (!sellerId || !rating || rating < 1 || rating > 5) {
        logger.warn(`[onReviewCreated] Invalid review data for ${event.params.reviewId}`);
        return;
    }
    try {
        const reviewsBySellerIdSnap = await db
            .collection("Reviews")
            .where("sellerId", "==", sellerId)
            .get();
        const reviewsBySellerIdSnakeSnap = await db
            .collection("Reviews")
            .where("seller_id", "==", sellerId)
            .get();
        let total = 0;
        let count = 0;
        const reviewDocs = new Map([
            ...reviewsBySellerIdSnap.docs.map((doc) => [doc.id, doc]),
            ...reviewsBySellerIdSnakeSnap.docs.map((doc) => [doc.id, doc]),
        ]);
        reviewDocs.forEach((doc) => {
            const r = doc.data().rating;
            if (r && r >= 1 && r <= 5) {
                total += r;
                count++;
            }
        });
        const trustRating = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
        await db.collection("users").doc(sellerId).update({
            trustRating,
            totalReviews: count,
        });
        logger.info(`[onReviewCreated] Updated trustRating=${trustRating} totalReviews=${count} for user ${sellerId} after review on item ${itemId || "unknown"}`);
    }
    catch (error) {
        logger.error(`[onReviewCreated] Error processing review ${event.params.reviewId}:`, error);
    }
});
const sdk_1 = require("@anthropic-ai/sdk");
const anthropicApiKey = (0, params_1.defineSecret)("ANTHROPIC_API_KEY");
const resendApiKey = (0, params_1.defineSecret)("RESEND_API_KEY");
exports.pcsValidate = (0, https_1.onCall)({
    secrets: [anthropicApiKey],
    region: "us-central1",
    maxInstances: 10,
}, async (request) => {
    var _a;
    console.log('pcsValidate called with:', request.data);
    const data = request.data || {};
    const itemTitle = String(data.itemTitle || "");
    const itemPrice = data.itemPrice;
    const category = String(data.category || "");
    const itemId = String(data.itemId || "");
    const sellerId = String(data.sellerId || "");
    let isApproved = false;
    let ceilingPrice = 0;
    let floorPrice = 0;
    let maxAllowedPrice = 0;
    let justification = "";
    let pcsStatus = "ERROR";
    let source = "";
    const listedPrice = parseFloat(itemPrice) || 0;
    if (!itemId) {
        throw new Error("Missing itemId for PCS validation.");
    }
    // --- 1. FIRESTORE CONFIG SEEDING ---
    let configDoc = await db.collection("settings").doc("pcs_config").get();
    if (!configDoc.exists) {
        await db.collection("settings").doc("pcs_config").set({
            forcePcsKeywords: ["casio", "fx-570", "fx-991", "fx-82", "fx-350", "fx-115", "scientific calculator", "texas instruments", "ti-84", "ti-83", "ti-nspire", "sharp calculator", "el-w531", "hp calculator", "hp prime", "graphing calculator", "textbook", "edition", "isbn", "volume", "pearson", "mcgraw", "oxford", "cengage", "wiley", "springer", "elsevier", "prentice hall", "fundamentals of", "introduction to", "principles of", "engineering mathematics", "calculus", "physics textbook", "chemistry textbook", "biology textbook", "statistics textbook", "discrete mathematics", "data structures", "algorithms", "operating systems", "computer networks", "database systems", "software engineering", "lab coat", "safety goggles", "lab apron", "dissection kit", "lab tools", "microscope slide", "pipette", "burette", "beaker", "lab gloves", "bunsen burner", "measuring cylinder", "conical flask", "t-square", "drawing board", "set square", "compass set", "technical pen", "drafting pencil", "ruling pen", "french curve", "drafting machine", "parallel ruler", "scale ruler", "architectural scale", "drawing kit", "engineering drawing set", "clean code", "design patterns", "introduction to algorithms", "the pragmatic programmer", "code complete", "refactoring", "computer organization", "digital design", "operating system concepts", "database system concepts", "safety boots", "hard hat", "high visibility vest", "safety gloves", "safety helmet", "steel toe boots", "ppe equipment", "personal protective equipment", "safety harness", "ear protection", "face shield", "respirator mask", "safety shoes", "vernier caliper", "micrometer", "multimeter", "oscilloscope", "breadboard kit", "soldering iron", "stethoscope", "blood pressure monitor", "anatomy model", "medical textbook", "nursing handbook", "pharmacology guide", "medical dictionary", "clinical manual", "dissection manual", "physiology atlas"],
            freeMarketKeywords: ["usb cable", "screen protector", "phone case", "sticker", "food", "drinks", "cookies", "meals", "homemade", "service", "tutoring", "printing", "photography", "jersey", "club shirt", "hoodie custom", "notes bundle", "past year paper", "handmade", "preloved", "vintage", "bundle", "thrifted", "antique", "replica", "customized", "second hand", "aesthetic", "designer"],
            campusCapPercentage: 0.90,
            freeMarketThreshold: 300
        });
        configDoc = await db.collection("settings").doc("pcs_config").get();
    }
    const pcsConfig = configDoc.data();
    const forcePcsKeywords = pcsConfig.forcePcsKeywords || [];
    const freeMarketKeywords = pcsConfig.freeMarketKeywords || [];
    const campusCapPercentage = pcsConfig.campusCapPercentage || 0.90;
    const freeMarketThreshold = pcsConfig.freeMarketThreshold || 300;
    const titleLower = itemTitle.toLowerCase();
    // --- 2. COPYRIGHT FILTER ---
    const copyrightKeywords = ['pdf', 'softcopy', 'soft copy', 'ebook', 'e-book', 'digital copy', 'scanned', 'send via whatsapp', 'send via telegram', 'send via email', 'digital file'];
    const originalContentKeywords = ['my notes', 'my summary', 'my handwritten', 'my typed', 'original notes', 'my study notes'];
    const hasCopyrightSignal = copyrightKeywords.some((keyword) => titleLower.includes(keyword));
    const hasOriginalSignal = originalContentKeywords.some((keyword) => titleLower.includes(keyword));
    if (hasCopyrightSignal && !hasOriginalSignal) {
        await db.collection("items").doc(itemId).set({
            pcs_status: "COPYRIGHT_BLOCKED",
            pcs_certified: false,
            pcs_reason: "For copyright and safety reasons, Pulse currently doesn't support the sale of digital materials or PDFs. Thanks for understanding!",
            pcs_checked_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return {
            isApproved: false,
            pcsStatus: "COPYRIGHT_BLOCKED",
            justification: "For copyright and safety reasons, Pulse currently doesn't support the sale of digital materials or PDFs. Thanks for understanding!",
            marketBaselinePrice: 0,
            maxAllowedStudentPrice: 0,
        };
    }
    // --- 3. SUBJECTIVE KEYWORD FILTER ---
    const subjectiveKeywords = ['handmade', 'preloved', 'bundle', 'secondhand', 'used', 'vintage', 'rare', 'collection', 'service', 'repair', 'print', 'tutor', 'clean', 'install', 'format', 'design', 'photography', 'rent'];
    const hasSubjectiveSignal = subjectiveKeywords.some((keyword) => titleLower.includes(keyword));
    if (hasSubjectiveSignal) {
        await db.collection("items").doc(itemId).set({
            pcs_status: "FREE_MARKET",
            pcs_certified: true,
            pcs_reason: "Subjective or unique item — no validation required.",
            pcs_checked_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return {
            isApproved: true,
            pcsStatus: "FREE_MARKET",
            justification: "Subjective or unique item — no validation required.",
            marketBaselinePrice: 0,
            maxAllowedStudentPrice: 0,
        };
    }
    // --- 4. STUDENT ESSENTIAL CHECK (NEW BYPASS) ---
    const hasFreeMarketKeyword = freeMarketKeywords.some((keyword) => titleLower.includes(keyword));
    if (hasFreeMarketKeyword) {
        await db.collection("items").doc(itemId).set({
            pcs_status: "FREE_MARKET",
            pcs_certified: true,
            pcs_reason: "Item identified as Free Market by config.",
            pcs_checked_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return {
            isApproved: true,
            pcsStatus: "FREE_MARKET",
            justification: "Item identified as Free Market by config.",
            marketBaselinePrice: 0,
            maxAllowedStudentPrice: 0,
        };
    }
    const hasForcePcsKeyword = forcePcsKeywords.some((keyword) => titleLower.includes(keyword));
    if (!hasForcePcsKeyword) {
        if (listedPrice <= freeMarketThreshold) {
            await db.collection("items").doc(itemId).set({
                pcs_status: "FREE_MARKET",
                pcs_certified: true,
                pcs_reason: "Price below free market threshold.",
                pcs_checked_at: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            return {
                isApproved: true,
                pcsStatus: "FREE_MARKET",
                justification: "Price below free market threshold.",
                marketBaselinePrice: 0,
                maxAllowedStudentPrice: 0,
            };
        }
        else {
            await db.collection("items").doc(itemId).set({
                pcs_status: "BLOCKED_NO_REFERENCE",
                pcs_certified: false,
                pcs_reason: "Your price requires manual verification because we couldn't find a matching retail product. Please double-check for typos, or update the item name to include the specific brand/model.",
                pcs_checked_at: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            return {
                isApproved: false,
                pcsStatus: "BLOCKED_NO_REFERENCE",
                justification: "Your price requires manual verification because we couldn't find a matching retail product. Please double-check for typos, or update the item name to include the specific brand/model.",
                marketBaselinePrice: 0,
                maxAllowedStudentPrice: 0,
            };
        }
    }
    // --- 5. FIRESTORE CACHE CHECK ---
    const cacheKey = itemTitle.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    const cacheRef = db.collection("price_cache").doc(cacheKey);
    const cacheSnap = await cacheRef.get();
    if (cacheSnap.exists) {
        const cached = cacheSnap.data();
        if (((_a = cached.expiresAt) === null || _a === void 0 ? void 0 : _a.toMillis()) > Date.now()) {
            floorPrice = cached.floorPrice || 0;
            ceilingPrice = cached.ceilingPrice || 0;
            source = cached.source || '';
            console.log('Cache hit for:', cacheKey, '→ ceiling:', ceilingPrice);
        }
    }
    // --- 6. SERP API + CLAUDE CHECK ---
    if (ceilingPrice === 0) {
        let serpApiResults = '';
        const serpApiKey = process.env.SERP_API_KEY;
        if (serpApiKey) {
            const query = encodeURIComponent(`${itemTitle}`);
            const url = `https://serpapi.com/search.json?engine=google_shopping&q=${query}&gl=my&hl=en&currency=MYR&api_key=${serpApiKey}`;
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 6000);
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeout);
                if (res.ok) {
                    const resultData = await res.json();
                    const results = (resultData === null || resultData === void 0 ? void 0 : resultData.shopping_results) || [];
                    if (results.length > 0) {
                        serpApiResults = JSON.stringify(results.slice(0, 10).map(r => ({ title: r.title, price: r.price, source: r.source })));
                    }
                }
            }
            catch (e) {
                console.error('SerpAPI fetch error:', e);
            }
        }
        const anthropic = new sdk_1.Anthropic({
            apiKey: anthropicApiKey.value(),
        });
        let prompt = "";
        if (serpApiResults) {
            prompt = `Malaysian campus marketplace price validator.
Item: ${itemTitle}
Prices from Google Shopping Malaysia: ${serpApiResults}

From this data identify:
- floorPrice: cheapest from authorized seller
- ceilingPrice: official new retail price

Ignore: below RM5, PDFs, bundles, grey market.
Return ONLY JSON:
{"floorPrice": number, "ceilingPrice": number, "source": string}`;
        }
        else {
            const categoryUpper = (category || '').toUpperCase();
            prompt = `Malaysian campus marketplace price validator.
Item: ${itemTitle}
Category: ${categoryUpper}

Find current Malaysian retail prices only.
Textbooks: check MPH, Popular, Kinokuniya.
Other items: check authorized brand stores.

Return ONLY JSON:
{"floorPrice": number, "ceilingPrice": number, "source": string}

Rules: ignore PDFs, bundles, used copies, international prices.
If no price found: {"floorPrice": 0, "ceilingPrice": 0, "source": "not found"}`;
        }
        const messages = [{ role: "user", content: prompt }];
        let rawText = '';
        let firstAttemptDone = false;
        for (let turn = 0; turn < 4; turn++) {
            const msg = await anthropic.messages.create({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 1000,
                messages,
            });
            for (const block of msg.content) {
                if (block.type === 'text') {
                    rawText += block.text;
                }
            }
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    const testCeiling = parseFloat(parsed.ceilingPrice) || 0;
                    if (testCeiling > 0 || parsed.source === "not found")
                        break;
                }
                catch (_) { }
            }
            if (!firstAttemptDone) {
                firstAttemptDone = true;
                messages.push({ role: "assistant", content: msg.content });
                messages.push({ role: "user", content: "Invalid JSON format. You must output raw JSON only." });
            }
            else {
                break;
            }
        }
        console.log('Claude SDK raw text:', rawText);
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('No JSON found in Claude SDK response');
            floorPrice = 0;
            ceilingPrice = 0;
            source = "not found";
        }
        else {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                floorPrice = parseFloat(parsed.floorPrice) || 0;
                ceilingPrice = parseFloat(parsed.ceilingPrice) || 0;
                source = String(parsed.source || "");
            }
            catch (e) {
                console.error('JSON parse error from Claude SDK text:', e);
                floorPrice = 0;
                ceilingPrice = 0;
                source = "not found";
            }
        }
        if (ceilingPrice > 0 || source !== "not found") {
            await cacheRef.set({
                floorPrice,
                ceilingPrice,
                source,
                itemTitle,
                cachedAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 86400000),
            });
            console.log('Cached result for:', cacheKey);
        }
    }
    if (ceilingPrice === 0) {
        if (listedPrice > freeMarketThreshold) {
            isApproved = false;
            pcsStatus = "BLOCKED_NO_REFERENCE";
            justification = "Your price requires manual verification because we couldn't find a matching retail product. Please double-check for typos, or update the item name to include the specific brand/model.";
        }
        else {
            isApproved = true;
            pcsStatus = "FREE_MARKET";
            justification = "No market reference found. Listed as Free Market item.";
        }
    }
    else {
        const campusCap = Math.round(ceilingPrice * campusCapPercentage * 100) / 100;
        maxAllowedPrice = campusCap;
        isApproved = listedPrice <= campusCap;
        pcsStatus = isApproved ? "APPROVED" : "FLAGGED";
        justification = isApproved
            ? "Price is within campus cap of RM" + campusCap + " based on official retail of RM" + ceilingPrice
            : "The official retail price for this is RM " + ceilingPrice + ". To keep the campus marketplace fair, student prices are capped at 90% of retail (Max: RM " + campusCap + "). Please adjust your price or share a reason.";
    }
    await db.collection("items").doc(itemId).set({
        pcs_status: pcsStatus,
        pcs_certified: isApproved,
        pcs_market_price: ceilingPrice,
        pcs_floor_price: floorPrice,
        pcs_max_allowed: maxAllowedPrice,
        pcs_reason: justification,
        pcs_checked_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    if (pcsStatus === "FLAGGED" || pcsStatus === "BLOCKED_NO_REFERENCE") {
        await db.collection("PriceGuidelines").doc(itemId).set({
            title: itemTitle,
            listed_price: listedPrice,
            market_price: ceilingPrice,
            floor_price: floorPrice,
            max_allowed: maxAllowedPrice,
            seller_id: sellerId,
            status: "PENDING_REVIEW",
            flagged_at: admin.firestore.FieldValue.serverTimestamp(),
            reason: justification,
            source,
        });
    }
    console.log('PCS verdict:', isApproved, ceilingPrice, maxAllowedPrice, 'Listed:', listedPrice, 'Status:', pcsStatus);
    return {
        isApproved,
        pcsStatus,
        justification,
        marketBaselinePrice: ceilingPrice,
        maxAllowedStudentPrice: maxAllowedPrice,
        floorPrice,
        source
    };
});
/**
 * sendWelcomeEmail
 * Sends a welcome email via Resend when a new user signs up.
 */
exports.sendWelcomeEmail = v1_1.auth
    .user()
    .onCreate(async (user) => {
    const email = user.email;
    if (!email)
        return;
    try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userData = userDoc.data();
        const fullName = (userData === null || userData === void 0 ? void 0 : userData.fullName) || "Student";
        const matricNumber = (userData === null || userData === void 0 ? void 0 : userData.matricNumber) || "";
        const firstName = fullName.split(" ")[0];
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:32px;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">Hi ${firstName},</h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;font-size:16px;line-height:26px;color:#334155;">
                Your Pulse account is ready. You're now part of the UniKL MIIT student marketplace.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:12px;font-size:14px;font-weight:600;color:#0f172a;">Here's what you can do:</td>
                </tr>
                <tr>
                  <td style="padding-bottom:8px;font-size:15px;color:#334155;line-height:24px;">&bull; Buy &amp; sell at student prices</td>
                </tr>
                <tr>
                  <td style="padding-bottom:8px;font-size:15px;color:#334155;line-height:24px;">&bull; Request Pulse Runner deliveries</td>
                </tr>
                <tr>
                  <td style="padding-bottom:8px;font-size:15px;color:#334155;line-height:24px;">&bull; Browse Student Market verified deals</td>
                </tr>
              </table>
            </td>
          </tr>
          ${matricNumber ? `
          <tr>
            <td style="padding:16px 20px;background:#f8fafc;border-radius:12px;margin-bottom:24px;">
              <p style="margin:0;font-size:15px;color:#334155;">
                Your matric number <strong style="color:#0f172a;">${matricNumber}</strong> is linked to your account.
              </p>
            </td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding-top:24px;">
              <p style="margin:0;font-size:15px;color:#475569;line-height:24px;">
                See you on campus.<br>
                <strong style="color:#0f172a;"> The Pulse Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${resendApiKey.value()}`,
            },
            body: JSON.stringify({
                from: "Pulse Campus <onboarding@resend.dev>",
                to: [email],
                subject: `Welcome to Pulse, ${firstName} `,
                html: htmlBody,
            }),
        });
        if (!res.ok) {
            const errText = await res.text();
            logger.error(`[sendWelcomeEmail] Resend error ${res.status}: ${errText}`);
        }
        else {
            logger.info(`[sendWelcomeEmail] Welcome email sent to ${email}`);
        }
    }
    catch (error) {
        logger.error(`[sendWelcomeEmail] Error for ${email}:`, error);
    }
});
/* FIREBASE CLOUD FUNCTIONS
   What: All server-side logic for Pulse

   EXTERNAL APIs USED HERE:
   - Claude AI (Anthropic): pcsValidate function
     Model: claude-haiku-4-5-20251001
     Tool: web_search_20250305
   - Resend Email API: sendWelcomeEmail function
   - Firebase Admin SDK: all functions

   FUNCTIONS:
   - pcsValidate: AI price validation (MAIN INNOVATION)
   - placeOrder: checkout and order creation
   - priceSentinel: legacy price ceiling check
   - adjudicateAppeal: admin appeal resolution
   - completeHandshake: delivery confirmation
   - onOrderStatusChanged: push notifications
   - onOrderCreated: post-purchase chat creation
   - onReviewCreated: seller trust rating update
   - sendWelcomeEmail: welcome email on signup
*/
//# sourceMappingURL=index.js.map