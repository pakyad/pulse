import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { auth } from "firebase-functions/v1";

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
  const { userId, cartItems, deliveryType, dropOffLocation, receiptUrl } = data;
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
        const itemDoc = itemDocs[i];
        const itemData = itemDoc.data();
        
        if (!itemDoc.exists) {
          throw new HttpsError("not-found", `Item ${cartItems[i].title} no longer exists in registry.`);
        }

        const currentStock = itemData?.stock_count ?? 0;
        if (currentStock < cartItems[i].qty) {
          throw new HttpsError("resource-exhausted", `SOLD_OUT: Only ${currentStock} units of ${itemData?.title} remain.`);
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

      // Use Firestore prices, not client-supplied prices
      const actualPrices: Record<string, number> = {};
      for (let i = 0; i < cartItems.length; i++) {
        const itemData = itemDocs[i]?.data();
        actualPrices[cartItems[i].productId] = itemData?.price ?? cartItems[i].price;
      }

      let totalAmount = 0;
      cartItems.forEach((item: any) => totalAmount += ((actualPrices[item.productId] || item.price) * item.qty));

      // 3. ATOMIC DECREMENT & SUB-ORDER CREATION
      for (const vendorId in ordersByVendor) {
        const subOrderRef = db.collection('orders').doc();
        const itemsForThisVendor = ordersByVendor[vendorId];
        let subtotal = 0;
        itemsForThisVendor.forEach((i: any) => subtotal += ((actualPrices[i.productId] || i.price) * i.qty));

        // Stock decrement moved to Merchant "Prepare Order" stage per REQ_FIX_5

        transaction.set(subOrderRef, {
          order_id: subOrderRef.id,
          parent_id: parentOrderId,
          buyer_id: finalUserId,
          seller_id: vendorId,
          items: itemsForThisVendor.map((item: any) => ({
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

/**
 *  Price Sentinel (UC_1801)
 * Autonomous enforcement of institutional category ceilings.
 */
export const priceSentinel = onCall({ 
  cors: true,
  region: "us-central1"
}, async (request) => {
  const data = request.data || {};
  const { itemId, price, category } = data;
  
  const CEILINGS: Record<string, number> = {
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
export const adjudicateAppeal = onCall({ cors: true }, async (request) => {
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
export const completeHandshake = onCall({ 
  cors: true,
  region: "us-central1"
}, async (request) => {
  const data = request.data || {};
  const { orderId, role, coords } = data; // role: 'seller' | 'buyer'
  
  if (!orderId || !role || !coords) {
    throw new HttpsError("invalid-argument", "Missing handshake parameters.");
  }

  const orderRef = db.collection('orders').doc(orderId);
  
  await db.runTransaction(async (transaction) => {
    const orderDoc = await transaction.get(orderRef);
    if (!orderDoc.exists) throw new HttpsError("not-found", "Order not found.");
    
    const order = orderDoc.data()!;
    const handshake = order.handshake || {};

    if (role === 'seller') {
      handshake.seller_confirmed = true;
      handshake.seller_coords = coords;
    } else {
      handshake.buyer_confirmed = true;
      handshake.buyer_coords = coords;
    }

    // Logic: If both confirmed, perform the Proximity Audit
    if (handshake.seller_confirmed && handshake.buyer_confirmed) {
      const dist = calculateDistance(
        handshake.seller_coords.lat, handshake.seller_coords.lng,
        handshake.buyer_coords.lat, handshake.buyer_coords.lng
      );
      
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
    } else {
      transaction.update(orderRef, { handshake });
    }
  });

  return { success: true };
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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
export const onOrderStatusChanged = onDocumentUpdated("orders/{orderId}", async (event) => {
  const dataBefore = event.data?.before.data();
  const dataAfter = event.data?.after.data();

  if (!dataBefore || !dataAfter) return null;

  const oldStatus = dataBefore.status;
  const newStatus = dataAfter.status;

  if (oldStatus === newStatus) return null;

  const buyerId = dataAfter.buyer_id;
  if (!buyerId) return null;

  // Get buyer's FCM token
  const userDoc = await db.collection('users').doc(buyerId).get();
  const userData = userDoc.data();
  const fcmToken = userData?.fcmToken;

  if (!fcmToken) {
    logger.log(`No FCM token found for user ${buyerId}`);
    return null;
  }

  let title = "Order Update";
  let body = "";

  if (newStatus === 'ACCEPTED_BY_RUNNER' || newStatus === 'ON_THE_WAY') {
    body = "Your order is on the way to pickup the order!";
  } else if (newStatus === 'PICKED_UP') {
    body = "Rider is on the way to you.";
  }

  if (!body) return null;

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
  } catch (error) {
    logger.error("Error sending push notification:", error);
    return null;
  }
});

/**
 * onOrderCreated
 * Fires when a new order document is created. Writes a notification to the seller
 * and creates a POST_PURCHASE conversation thread between buyer and seller.
 */
export const onOrderCreated = onDocumentCreated("orders/{orderId}", async (event) => {
  const snap = event.data;
  if (!snap) return;

  const order = snap.data();
  const orderId = event.params.orderId;

  const itemName = order.title || order.items?.[0]?.title || "Item";
  const sellerId = order.seller_id;
  const buyerId = order.buyer_id;
  const handoverNode = order.drop_off_location || "Main Campus";
  const itemId = order.items?.[0]?.productId || "";

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
      const d = buyerSnap.data()!;
      buyerName = d.fullName || d.full_name || d.name || buyerName;
    }
    if (sellerSnap.exists) {
      const d = sellerSnap.data()!;
      sellerName = d.fullName || d.full_name || d.name || sellerName;
    }
  } catch (e) {
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
  } catch (error) {
    logger.error(`[onOrderCreated] Error processing order ${orderId}:`, error);
  }
});

/**
 * onReviewCreated
 * Fires when a new review document is created in the "Reviews" collection.
 * Recalculates the seller's trustRating and totalReviews.
 */
export const onReviewCreated = onDocumentCreated("Reviews/{reviewId}", async (event) => {
  const snap = event.data;
  if (!snap) return;

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
      ...reviewsBySellerIdSnap.docs.map((doc) => [doc.id, doc] as const),
      ...reviewsBySellerIdSnakeSnap.docs.map((doc) => [doc.id, doc] as const),
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
  } catch (error) {
    logger.error(`[onReviewCreated] Error processing review ${event.params.reviewId}:`, error);
  }
});

import { Anthropic } from "@anthropic-ai/sdk";

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");
const resendApiKey = defineSecret("RESEND_API_KEY");

export const pcsValidate = onCall(
  {
    secrets: [anthropicApiKey],
    region: "us-central1",
    maxInstances: 10,
  },
  async (request) => {
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
    const subcategory = String(data.subcategory || "");
    const listedPrice = parseFloat(itemPrice) || 0;

    // Try block removed
      if (!itemId) {
        throw new Error("Missing itemId for PCS validation.");
      }

      // Check for Soft Warning categories
      const softWarningCategories = ['Handwritten Notes (IT & CS)', 'Handwritten Notes (Engineering)', 'Handwritten Notes (Business)', 'Past Year Papers', 'Study Tables & Chairs', 'Bedding & Linen'];
      if (softWarningCategories.includes(subcategory)) {
        let softCap = 0;
        if (subcategory.includes('Handwritten Notes')) softCap = 20;
        else if (subcategory.includes('Past Year Papers')) softCap = 10;
        else if (subcategory.includes('Study Tables')) softCap = 400;
        else if (subcategory.includes('Bedding')) softCap = 100;

        if (listedPrice > softCap) {
          return {
            isApproved: false,
            pcsStatus: "SOFT_WARNING",
            justification: `Market Advice: Similar items usually sell for around RM ${softCap} or less. Lowering your price might help you sell faster!`,
            marketBaselinePrice: softCap,
            maxAllowedStudentPrice: softCap,
          };
        } else {
           await db.collection("items").doc(itemId).set({
            pcs_status: "FREE_MARKET",
            pcs_certified: true,
            pcs_reason: "Priced within reasonable expected range for unique item.",
            pcs_checked_at: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });

          return {
            isApproved: true,
            pcsStatus: "FREE_MARKET",
            justification: "Priced within reasonable expected range for unique item.",
            marketBaselinePrice: softCap,
            maxAllowedStudentPrice: softCap,
          };
        }
      }

      const copyrightKeywords = ['pdf', 'softcopy', 'soft copy', 'ebook', 'e-book', 'digital copy', 'scanned', 'send via whatsapp', 'send via telegram', 'send via email', 'digital file'];
      const originalContentKeywords = ['my notes', 'my summary', 'my handwritten', 'my typed', 'original notes', 'my study notes'];
      const titleLower = itemTitle.toLowerCase();
      const hasCopyrightSignal = copyrightKeywords.some((keyword) => titleLower.includes(keyword));
      const hasOriginalSignal = originalContentKeywords.some((keyword) => titleLower.includes(keyword));

      if (hasCopyrightSignal && !hasOriginalSignal) {
        await db.collection("items").doc(itemId).set({
          pcs_status: "COPYRIGHT_BLOCKED",
          pcs_certified: false,
          pcs_reason: "Selling digital copies is not allowed on Pulse.",
          pcs_checked_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        return {
          isApproved: false,
          pcsStatus: "COPYRIGHT_BLOCKED",
          justification: "Selling digital copies is not allowed on Pulse.",
          marketBaselinePrice: 0,
          maxAllowedStudentPrice: 0,
        };
      }

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

      const accessoryKeywords = ['case', 'protector', 'screen protector', 'cable', 'charger', 'adapter', 'stand', 'holder', 'mount', 'strap', 'skin', 'sticker', 'tempered glass'];
      const hasAccessorySignal = accessoryKeywords.some((keyword) => titleLower.includes(keyword));

      if (hasAccessorySignal) {
        await db.collection("items").doc(itemId).set({
          pcs_status: "FREE_MARKET",
          pcs_certified: true,
          pcs_reason: "Accessory item — subjective pricing, no validation required.",
          pcs_checked_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        return {
          isApproved: true,
          pcsStatus: "FREE_MARKET",
          justification: "Accessory item — subjective pricing, no validation required.",
          marketBaselinePrice: 0,
          maxAllowedStudentPrice: 0,
        };
      }

      const freeMarketCategories = ['SERVICES', 'FOOD', 'HANDMADE', 'CUSTOM', 'APPAREL', 'TECH'];
      const categoryUpper = (category || '').toUpperCase();

      if (freeMarketCategories.some((freeMarketCategory) => categoryUpper.includes(freeMarketCategory))) {
        await db.collection("items").doc(itemId).set({
          pcs_status: "FREE_MARKET",
          pcs_certified: true,
          pcs_reason: "Free Market category. No price validation required.",
          pcs_checked_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        return {
          isApproved: true,
          pcsStatus: "FREE_MARKET",
          justification: "Free Market category. No price validation required.",
          marketBaselinePrice: 0,
          maxAllowedStudentPrice: 0,
        };
      }



      const cacheKey = itemTitle.toLowerCase().trim().replace(/\s+/g, ' ');
      const cacheRef = db.collection("price_cache").doc(cacheKey);
      const cacheSnap = await cacheRef.get();
      if (cacheSnap.exists) {
        const cached = cacheSnap.data()!;
        if (cached.expiresAt?.toMillis() > Date.now()) {
          floorPrice = cached.floorPrice || 0;
          ceilingPrice = cached.ceilingPrice || 0;
          source = cached.source || '';
          console.log('Cache hit for:', cacheKey, '→ ceiling:', ceilingPrice);
        }
      }

      if (ceilingPrice === 0) {
        const anthropic = new Anthropic({
          apiKey: anthropicApiKey.value(),
        });

        let categoryContext = "";
        if (categoryUpper.includes("ACADEMIC") || categoryUpper.includes("BOOK")) {
          categoryContext = "For academic books and textbooks, find prices from Malaysian bookstores such as MPH, Popular, or Kinokuniya, or the publisher official website.";
        } else {
          categoryContext = "For this item, find prices from official brand stores on Shopee Mall or Lazada Mall, or the brand official Malaysian website.";
        }

        const prompt = `You are a price validator for a Malaysian campus marketplace.

A student listed "${itemTitle}". This may contain typos, abbreviations, or incomplete names.

Step 1: Identify what the actual PRODUCT being sold is (the item itself, not just a brand/model keyword).
- If the title includes accessory words like "case", "protector", "charger", "cable", "adapter", "stand", "holder", "mount", "strap", "screen protector", "battery", "earphone", "buds", "keyboard", "mouse" — those are the actual product, not the phone/laptop brand that follows.
- Example: "iPhone 13 Clear Case" → the product is a "clear phone case for iPhone 13", NOT an iPhone 13.
- Example: "MacBook Pro Charger" → the product is a "laptop charger", NOT a MacBook Pro.
Step 2: Search for prices of the ACTUAL product in Malaysia.
Examples: "xm5" → "Sony WH-1000XM5", "ps5" → "PlayStation 5", "ipad 10th gen" → "iPad 10th generation".

Find the price band for the inferred product available to Malaysian buyers today.

${categoryContext}

Identify:
1. floorPrice: the cheapest legitimate physical copy from a real authorized seller in Malaysia (ignore pirated copies, PDF versions, damaged goods, and suspiciously cheap outliers below RM5)
2. ceilingPrice: the official new retail price from an authorized Malaysian retailer or brand store

Rules:
- Only use Malaysian Ringgit prices
- Do not use international prices or currency conversions unless absolutely no Malaysian price exists
- Do not use bundle prices that include other products
- Do not use pirated or digital copies as floor reference
- The ceiling must be from an authorized seller not an individual reseller

Return ONLY this raw JSON with no markdown no explanation:
{"floorPrice": number, "ceilingPrice": number, "source": "where ceiling price was found"}

You MUST always return a valid JSON object regardless of whether you find a price or not. If you cannot find a Malaysian retail price, return: {"floorPrice": 0, "ceilingPrice": 0, "source": "not found"}. Never refuse to output JSON. The calling system handles zero values as Free Market approval.`;

        const tools: any = [{ type: "web_search_20250305", name: "web_search" }];
        let messages: any[] = [{ role: "user", content: prompt }];
        let rawText = '';
        let firstAttemptDone = false;

        for (let turn = 0; turn < 4; turn++) {
          const msg = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 1000,
            tools,
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
              if (testCeiling > 0) break;
            } catch (_) {}
          }

          const toolUse = msg.content.filter((b: any) => b.type === 'tool_use');
          if (toolUse.length === 0) {
            if (!firstAttemptDone) {
              firstAttemptDone = true;
              messages.push({ role: "assistant", content: msg.content });
              messages.push({ role: "user", content: "No prices found. The item name may be a typo or abbreviation. Think carefully about what product this could be and search again with the corrected full product name." });
            } else {
              break;
            }
          } else {
            firstAttemptDone = true;
            messages.push({ role: "assistant", content: msg.content });
            for (const block of toolUse) {
              messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: (block as any).id, content: "done" }] });
            }
          }
        }
        console.log('Claude SDK raw text:', rawText);

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error('No JSON found in Claude SDK response');
          floorPrice = 0;
          ceilingPrice = 0;
          source = "not found";
        } else {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            floorPrice = parseFloat(parsed.floorPrice) || 0;
            ceilingPrice = parseFloat(parsed.ceilingPrice) || 0;
            source = String(parsed.source || "");
          } catch (e) {
            console.error('JSON parse error from Claude SDK text:', e);
            floorPrice = 0;
            ceilingPrice = 0;
            source = "not found";
          }
        }

        if (ceilingPrice > 0) {
          await cacheRef.set({
            floorPrice,
            ceilingPrice,
            source,
            cachedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 86400000),
          });
          console.log('Cached result for:', cacheKey);
        }
      }

      if (ceilingPrice === 0) {
        if (listedPrice > 500) {
          isApproved = false;
          pcsStatus = "BLOCKED_NO_REFERENCE";
          justification = "Items above RM500 need verified market price.";
        } else {
          isApproved = true;
          pcsStatus = "FREE_MARKET";
          justification = "No market reference found. Listed as Free Market item.";
        }
      } else {
        const campusCap = Math.round(ceilingPrice * 0.90 * 100) / 100;
        maxAllowedPrice = campusCap;
        isApproved = listedPrice <= campusCap;
        pcsStatus = isApproved ? "APPROVED" : "FLAGGED";
        justification = isApproved
          ? "Price is within campus cap of RM" + campusCap + " based on official retail of RM" + ceilingPrice
          : "Price exceeds campus cap of RM" + campusCap + ". Official retail price found at RM" + ceilingPrice + " from " + source;
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

  }
);

/**
 * sendWelcomeEmail
 * Sends a welcome email via Resend when a new user signs up.
 */
export const sendWelcomeEmail = auth
  .user()
  .onCreate(async (user) => {
      const email = user.email;
      if (!email) return;

      try {
        const userDoc = await db.collection("users").doc(user.uid).get();
        const userData = userDoc.data();
        const fullName: string = userData?.fullName || "Student";
        const matricNumber: string = userData?.matricNumber || "";
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
        } else {
          logger.info(`[sendWelcomeEmail] Welcome email sent to ${email}`);
        }
      } catch (error) {
        logger.error(`[sendWelcomeEmail] Error for ${email}:`, error);
      }
    }
  );
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
