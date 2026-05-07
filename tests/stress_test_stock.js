/**
 * 🏛️ Pulse Institutional Stress Test: Atomic Stock Shield
 * Simulates high-concurrency checkout to verify transaction integrity.
 * 
 * Usage: node tests/stress_test_stock.js <productId>
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// 1. Initialize for Local Stress Testing
// Note: Requires serviceAccountKey.json in the root for admin access
const serviceAccount = require('../serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

/**
 * MOCK: placeOrderAtomic
 * This simulates the behavior of the placeOrder Cloud Function 
 * using the same Transactional logic for local verification.
 */
async function placeOrderAtomic(userId, productId, quantity) {
  const itemRef = db.collection("items").doc(productId);
  const orderRef = db.collection("orders").doc();

  return await db.runTransaction(async (transaction) => {
    const itemDoc = await transaction.get(itemRef);
    if (!itemDoc.exists) throw new Error("Asset not found.");

    const itemData = itemDoc.data();
    const stock = itemData.stock_count ?? itemData.stock ?? 0;

    if (stock < quantity) {
      throw new Error(`SOLD_OUT: Asset '${itemData.title}' undersupplied.`);
    }

    // 🏛️ ATOMIC DECREMENT
    transaction.update(itemRef, {
      stock_count: FieldValue.increment(-quantity),
      stock: FieldValue.increment(-quantity)
    });

    // 🏛️ ORDER REGISTRY
    transaction.set(orderRef, {
      order_id: orderRef.id,
      buyer_id: userId,
      item_id: productId,
      title: itemData.title,
      status: "PENDING_VENDOR",
      created_at: FieldValue.serverTimestamp(),
    });

    return { orderId: orderRef.id };
  });
}

async function runStockStressTest(productId) {
  console.log("🚀 Initializing Stress Test: Atomic Stock Shield");
  console.log(`Target Asset: ${productId}\n`);

  // Ensure stock is set to exactly 1 for the test to prove only one succeeds
  await db.collection("items").doc(productId).update({ stock_count: 1, stock: 1 });
  console.log("🛠️ Registry Primed: Stock set to 1. Expecting 1 Success, 2 Failures.\n");

  const users = ["User_Muhaimin", "User_Iyad", "User_Naim"];
  
  const tasks = users.map(async (userId) => {
    try {
      // Small random jitter to simulate network variance
      await new Promise(r => setTimeout(r, Math.random() * 50));
      
      console.log(`[${userId}] Attempting to checkout...`);
      const res = await placeOrderAtomic(userId, productId, 1); 
      return { user: userId, status: "🟢 SUCCESS", orderId: res.orderId };
    } catch (error) {
      return { user: userId, status: "🔴 FAILED", reason: error.message };
    }
  });

  const results = await Promise.all(tasks);
  
  console.log("\n📊 AUDIT LOG:");
  console.table(results);
  
  // Verify final stock
  const finalDoc = await db.collection("items").doc(productId).get();
  console.log(`\n🏁 Final Registry Stock: ${finalDoc.data().stock_count}`);
  console.log("Stress Test Complete.");
  process.exit(0);
}

// Execution
const targetId = process.argv[2];
if (!targetId) {
  console.error("Usage: node tests/stress_test_stock.js <productId>");
  process.exit(1);
}

runStockStressTest(targetId);
