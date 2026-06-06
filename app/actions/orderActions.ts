"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

export async function releaseEscrow(orderId: string, callerUid?: string) {
  try {
    const db = getAdminDb();

    if (!callerUid) {
      return { success: false, message: "Authentication required." };
    }

    // Verify caller is admin
    const callerDoc = await db.collection("users").doc(callerUid).get();
    const callerData = callerDoc.data();
    if (!callerData || callerData.role !== 'ADMIN') {
      return { success: false, message: "Only admins can release escrow." };
    }

    const orderRef = db.collection("orders").doc(orderId);

    await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) throw new Error("Order not found");
      
      const orderData = orderDoc.data()!;
      if (orderData.escrow_status === "RELEASED") {
        throw new Error("Escrow already released for this order.");
      }

      const merchantTotal = Number(orderData.price || orderData.item_total || orderData.items_total || 0);
      const runnerFee = Number(orderData.runner_fee || orderData.delivery_fee || orderData.delivery_fee_amount || 0);
      const sellerId = orderData.seller_id;
      const runnerId = orderData.runner_id;

      // 1. Pay Merchant
      if (sellerId && merchantTotal > 0) {
        const sellerRef = db.collection("users").doc(sellerId);
        const sellerDoc = await transaction.get(sellerRef);
        const currentBalance = sellerDoc.exists ? (sellerDoc.data()!.balance || 0) : 0;
        
        transaction.update(sellerRef, {
          balance: currentBalance + merchantTotal
        });

        const ledgerRef = db.collection("ledger").doc();
        transaction.set(ledgerRef, {
          user_id: sellerId,
          order_id: orderId,
          type: "SALE_REVENUE",
          title: orderData.items?.[0]?.title || 'Marketplace Sale',
          amount: merchantTotal,
          status: "CLEARED",
          created_at: new Date().toISOString()
        });
      }

      // 2. Pay Runner
      if (runnerId && runnerFee > 0) {
        const runnerRef = db.collection("users").doc(runnerId);
        const runnerDoc = await transaction.get(runnerRef);
        const currentBalance = runnerDoc.exists ? (runnerDoc.data()!.balance || 0) : 0;
        
        transaction.update(runnerRef, {
          balance: currentBalance + runnerFee
        });

        const ledgerRef = db.collection("ledger").doc();
        transaction.set(ledgerRef, {
          user_id: runnerId,
          order_id: orderId,
          type: "DELIVERY_FEE",
          title: 'Campus Delivery',
          amount: runnerFee,
          status: "CLEARED",
          created_at: new Date().toISOString()
        });
      }

      // 3. Complete Escrow
      transaction.update(orderRef, {
        escrow_status: "RELEASED",
        status: "COMPLETED",
        released_at: new Date().toISOString()
      });
    });

    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Escrow Release Error:", error);
    return { success: false, message: error.message || "Failed to release escrow" };
  }
}

export async function placeSingleOrder(params: {
  itemId: string;
  qty: number;
  choice: 'SELF_COLLECT' | 'RUNNER';
  dropOffStr: string;
  itemPrice: number;
  total: number;
  buyerId: string;
  buyerName: string;
  image_url: string;
}) {
  try {
    const db = getAdminDb();
    const parentOrderId = `PULSE-${Date.now()}`;
    
    await db.runTransaction(async (transaction) => {
      const itemRef = db.collection('items').doc(params.itemId);
      const itemDoc = await transaction.get(itemRef);
      
      if (!itemDoc.exists) throw new Error("ITEM_NOT_FOUND");
      
      const item = itemDoc.data()!;
      const currentStock = item.stock_count;
      
      if (currentStock !== undefined && currentStock !== null) {
         if (currentStock < params.qty) {
            throw new Error("SOLD_OUT");
         }
         transaction.update(itemRef, { stock_count: currentStock - params.qty });
      }

      // Sub-order
      const subOrderRef = db.collection('orders').doc();
      const initialStatus = params.choice === 'RUNNER' ? 'PENDING_RUNNER' : 'PENDING_VENDOR';

      transaction.set(subOrderRef, {
        order_id: subOrderRef.id,
        parent_id: parentOrderId,
        buyer_id: params.buyerId,
        seller_id: item.seller_id,
        seller_name: item.seller_name || 'Merchant',
        customer_name: params.buyerName || 'Student',
        title: item.title,
        price: params.itemPrice * params.qty,
        total: params.total,
        items: [{ 
           productId: params.itemId, 
           title: item.title, 
           price: params.itemPrice, 
           qty: params.qty, 
           vendorId: item.seller_id, 
           image_url: params.image_url 
        }],
        image_url: params.image_url,
        delivery_type: params.choice,
        drop_off_location: params.dropOffStr,
        status: initialStatus,
        handshake: {
          seller_confirmed: false,
          buyer_confirmed: false,
          seller_coords: null,
          buyer_coords: null,
          verification_type: 'PENDING'
        },
        created_at: new Date().toISOString()
      });

      // Parent Order
      const parentRef = db.collection('parent_orders').doc(parentOrderId);
      transaction.set(parentRef, {
        id: parentOrderId,
        buyer_id: params.buyerId,
        total_price: params.total,
        item_count: 1,
        status: 'PAID',
        items_summary: item.title,
        created_at: new Date().toISOString()
      });
    });

    return { success: true, parentId: parentOrderId };
  } catch (error: any) {
    console.error("placeSingleOrder Error:", error);
    return { success: false, message: error.message };
  }
}

/**
 * ATOMIC ORDER CANCELLATION
 * Strict cancellation protocol ensuring stock is released automatically.
 */
export async function cancelOrder(orderId: string, role: 'BUYER' | 'MERCHANT', userId: string) {
  try {
    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    
    await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) throw new Error("Order not found");
      
      const orderData = orderDoc.data()!;

      // Verify caller is the buyer or seller
      if (role === 'BUYER' && orderData.buyer_id !== userId) {
        throw new Error("You can only cancel your own orders.");
      }
      if (role === 'MERCHANT' && orderData.seller_id !== userId) {
        throw new Error("You can only cancel orders for your own store.");
      }

      const currentStatus = orderData.status?.toUpperCase() || 'PENDING';
      
      // Strict Cancellation Rules
      if (role === 'BUYER') {
        const allowed = ['PENDING', 'PENDING_VENDOR', 'PENDING_RUNNER'];
        if (!allowed.includes(currentStatus)) {
          throw new Error("Cannot cancel after order has been accepted by merchant or runner.");
        }
      } else if (role === 'MERCHANT') {
        if (currentStatus !== 'PENDING_VENDOR') {
          throw new Error("Merchant can only reject pending orders.");
        }
      }
      
      // Release Stock (if it's a marketplace item with inventory)
      if (orderData.items && Array.isArray(orderData.items)) {
        for (const item of orderData.items) {
          // checkout/page.tsx saves the ID as productId and collection is 'items'
          const targetId = item.productId || item.id;
          if (targetId) {
            const productRef = db.collection("items").doc(targetId);
            const productDoc = await transaction.get(productRef);
            if (productDoc.exists) {
              const currentStock = productDoc.data()!.stock_count || productDoc.data()!.stock || 0;
              transaction.update(productRef, {
                stock_count: currentStock + (item.qty || 1)
              });
            }
          }
        }
      }
      
      // Update Order Status
      transaction.update(orderRef, {
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancelled_by: role.toLowerCase()
      });
    });
    
    // Revalidate relevant pages
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/me/orders");
    revalidatePath("/merchant/orders");
    
    return { success: true };
  } catch (error: any) {
    console.error("Order Cancellation Error:", error);
    return { success: false, message: error.message || "Failed to cancel order" };
  }
}
