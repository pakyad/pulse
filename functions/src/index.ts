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
            // Maintain legacy field for compatibility
            stock: admin.firestore.FieldValue.increment(-item.qty)
          });
        });

        transaction.set(subOrderRef, {
          order_id: subOrderRef.id,
          parent_id: parentOrderId,
          buyer_id: finalUserId,
          seller_id: vendorId,
          items: itemsForThisVendor,
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
 * 🏛️ Price Sentinel (UC_1801)
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
 * 🏛️ Adjudicate Appeal
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
 * 🛰️ completeHandshake (UC_1901)
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
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}