"use server"

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

// ── CAMPUS DEFAULT CEILINGS ────────────────────────────────────────────────────
const CAMPUS_DEFAULTS: Record<string, number> = {
  HUNGER: 25, ACADEMIC: 200, HOSTEL: 500, TECH: 3500, APPAREL: 300,
};

// ── INTERNAL: Send notification to a user ─────────────────────────────────────
async function sendNotification(
  userId: string,
  payload: {
    type: string;
    title: string;
    body: string;
    item_id?: string;
    item_title?: string;
    action_url?: string;
  }
) {
  await adminDb
    .collection("notifications")
    .add({
      ...payload,
      user_id: userId,
      category: "COMMERCE",
      is_read: false,
      created_at: FieldValue.serverTimestamp(),
    });
}

// ── INTERNAL: Write to Governance Vault ──────────────────────────────────────
async function writeToVault(
  itemData: Record<string, any>,
  action: string,
  reason: string,
  adminId: string
) {
  await adminDb.collection("governance_vault").add({
    ...itemData,
    vault_action: action,
    vault_reason: reason,
    vault_admin_id: adminId,
    vault_timestamp: FieldValue.serverTimestamp(),
    is_permanently_deleted: false,
  });
}

// ── INTERNAL: Write Governance Log ───────────────────────────────────────────
async function writeLog(type: string, targetId: string, details: string) {
  await adminDb.collection("governance_logs").add({
    type,
    target_id: targetId,
    details,
    timestamp: FieldValue.serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. APPROVE LISTING
// ─────────────────────────────────────────────────────────────────────────────
export async function approveItem(itemId: string, adminId: string) {
  try {
    await adminDb.collection("items").doc(itemId).update({
      status: "active",
      is_price_flagged: false,
      price_flag_count: 0,
      report_count: 0,
      flag_source: null,
      approved_by: adminId,
      approved_at: FieldValue.serverTimestamp(),
    });
    await writeLog("ADJUDICATION", itemId, `Listing approved by admin.`);
    revalidatePath("/admin/price-review");
    return { success: true };
  } catch (e) {
    console.error("[adminActions] approveItem:", e);
    return { success: false, message: "Failed to approve listing." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HOLD FOR REVISION  (replaces quarantine)
// ─────────────────────────────────────────────────────────────────────────────
export async function holdForRevision(
  itemId: string,
  sellerId: string,
  adminId: string,
  reason: string,      // e.g. "PRICE_TOO_HIGH"
  message: string      // the final notification body
) {
  try {
    const itemSnap = await adminDb.collection("items").doc(itemId).get();
    const item = itemSnap.data();
    if (!item) return { success: false, message: "Item not found." };

    // 1. Hide item from feed
    await adminDb.collection("items").doc(itemId).update({
      status: "HELD_FOR_REVISION",
      is_price_flagged: false,
      held_reason: reason,
      governance_message: message,
      held_by: adminId,
      held_at: FieldValue.serverTimestamp(),
    });

    // 2. Send in-app notification to seller
    await sendNotification(sellerId, {
      type: "PRICE_REVISION_REQUIRED",
      title: "Action Required on Your Listing",
      body: message,
      item_id: itemId,
      item_title: item.title,
      action_url: "/merchant/listings",
    });

    // 3. Log it
    await writeLog("HOLD_FOR_REVISION", itemId, `Listing held for revision. Reason: ${reason}`);

    revalidatePath("/admin/price-review");
    return { success: true };
  } catch (e) {
    console.error("[adminActions] holdForRevision:", e);
    return { success: false, message: "Failed to hold listing." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ISSUE WARNING
// ─────────────────────────────────────────────────────────────────────────────
export async function issueWarning(
  itemId: string,
  sellerId: string,
  adminId: string,
  itemTitle: string
) {
  try {
    const userRef = adminDb.collection("users").doc(sellerId);
    const userSnap = await userRef.get();
    const currentStrikes = userSnap.data()?.strike_count ?? 0;
    const newStrikes = currentStrikes + 1;

    // 1. Increment strike
    await userRef.update({ strike_count: newStrikes });

    // 2. Write warning record to user's sub-collection
    await adminDb
      .collection("users")
      .doc(sellerId)
      .collection("warnings")
      .add({
        item_id: itemId,
        item_title: itemTitle,
        issued_by: adminId,
        issued_at: FieldValue.serverTimestamp(),
        strike_number: newStrikes,
      });

    // 3. Auto-suspend at 3 strikes
    let autoSuspended = false;
    if (newStrikes >= 3) {
      await userRef.update({ is_seller: false, is_suspended_merchant: true });
      autoSuspended = true;
      await sendNotification(sellerId, {
        type: "MERCHANT_SUSPENDED",
        title: "Merchant Access Suspended",
        body: `Your merchant account has been suspended after accumulating 3 pricing strikes. Contact admin@pulse.edu for reinstatement.`,
        action_url: "/campus/support",
      });
      await writeLog("SUSPENSION", sellerId, `Merchant auto-suspended after 3 strikes.`);
    } else {
      // 4. Send warning notification
      await sendNotification(sellerId, {
        type: "FORMAL_WARNING",
        title: `Formal Warning — Strike ${newStrikes} of 3`,
        body: `Your listing "${itemTitle}" has been flagged for a pricing violation. This is strike ${newStrikes} of 3. A third strike will result in automatic merchant suspension.`,
        item_id: itemId,
        item_title: itemTitle,
        action_url: "/merchant/listings",
      });
    }

    // Clear item flag so it leaves the review queue
    await adminDb.collection("items").doc(itemId).update({
      is_price_flagged: false,
    });

    await writeLog("WARNING_ISSUED", itemId, `Strike ${newStrikes} issued to seller ${sellerId}. Auto-suspended: ${autoSuspended}`);
    revalidatePath("/admin/price-review");
    return { success: true, strikes: newStrikes, autoSuspended };
  } catch (e) {
    console.error("[adminActions] issueWarning:", e);
    return { success: false, message: "Failed to issue warning." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. REJECT & REMOVE (to vault)
// ─────────────────────────────────────────────────────────────────────────────
export async function rejectItem(
  itemId: string,
  sellerId: string,
  adminId: string
) {
  try {
    const itemSnap = await adminDb.collection("items").doc(itemId).get();
    const item = itemSnap.data();
    if (!item) return { success: false, message: "Item not found." };

    // 1. Mark as rejected
    await adminDb.collection("items").doc(itemId).update({
      status: "REJECTED_FRAUDULENT",
      is_price_flagged: false,
      governance_rejected_by: adminId,
      governance_rejected_at: FieldValue.serverTimestamp(),
    });

    // 2. Snapshot to vault
    await writeToVault(
      { ...item, item_id: itemId },
      "REJECTED",
      "Price violation — rejected by admin",
      adminId
    );

    // 3. Notify seller
    await sendNotification(sellerId, {
      type: "LISTING_REMOVED",
      title: "Your Listing Has Been Removed",
      body: `Your listing "${item.title}" has been removed from the Pulse marketplace due to a pricing policy violation. You may relist with a revised price.`,
      item_id: itemId,
      item_title: item.title,
      action_url: "/merchant/listings",
    });

    await writeLog("PRICE_BLOCK", itemId, `Listing "${item.title}" rejected and moved to vault.`);
    revalidatePath("/admin/price-review");
    revalidatePath("/admin/vault");
    return { success: true };
  } catch (e) {
    console.error("[adminActions] rejectItem:", e);
    return { success: false, message: "Failed to reject listing." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SUSPEND SELLER (removes item + kills merchant access)
// ─────────────────────────────────────────────────────────────────────────────
export async function suspendSeller(
  itemId: string,
  sellerId: string,
  adminId: string
) {
  try {
    const itemSnap = await adminDb.collection("items").doc(itemId).get();
    const item = itemSnap.data();
    if (!item) return { success: false, message: "Item not found." };

    // 1. Remove item + snapshot to vault
    await adminDb.collection("items").doc(itemId).update({
      status: "REJECTED_FRAUDULENT",
      is_price_flagged: false,
      governance_rejected_by: adminId,
      governance_rejected_at: FieldValue.serverTimestamp(),
    });
    await writeToVault(
      { ...item, item_id: itemId },
      "SELLER_SUSPENDED",
      "Listing removed — seller suspended",
      adminId
    );

    // 2. Revoke merchant access
    await adminDb.collection("users").doc(sellerId).update({
      is_seller: false,
      is_suspended_merchant: true,
      suspended_by: adminId,
      suspended_at: FieldValue.serverTimestamp(),
    });

    // 3. Notify seller
    await sendNotification(sellerId, {
      type: "MERCHANT_SUSPENDED",
      title: "Merchant Access Revoked",
      body: `Your merchant account has been suspended due to a severe pricing violation. Your listing "${item.title}" has been removed. Contact admin@pulse.edu to appeal this decision.`,
      item_id: itemId,
      item_title: item.title,
      action_url: "/campus/support",
    });

    await writeLog("SUSPENSION", sellerId, `Seller suspended. Item "${item.title}" removed and vaulted.`);
    revalidatePath("/admin/price-review");
    revalidatePath("/admin/vault");
    return { success: true };
  } catch (e) {
    console.error("[adminActions] suspendSeller:", e);
    return { success: false, message: "Failed to suspend seller." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. VAULT: RESTORE ITEM
// ─────────────────────────────────────────────────────────────────────────────
export async function restoreFromVault(vaultId: string, itemId: string, sellerId: string) {
  try {
    // 1. Restore item
    await adminDb.collection("items").doc(itemId).update({
      status: "active",
      is_price_flagged: false,
      governance_rejected_by: null,
      governance_rejected_at: null,
    });

    // 2. Mark vault entry as restored
    await adminDb.collection("governance_vault").doc(vaultId).update({
      vault_action: "RESTORED",
      restored_at: FieldValue.serverTimestamp(),
    });

    // 3. Notify seller
    await sendNotification(sellerId, {
      type: "LISTING_RESTORED",
      title: "Your Listing Has Been Restored",
      body: `Good news! Your listing has been reviewed and restored to the Pulse marketplace. It is now visible to buyers.`,
      item_id: itemId,
      action_url: "/merchant/listings",
    });

    await writeLog("ADJUDICATION", itemId, `Listing restored from governance vault.`);
    revalidatePath("/admin/vault");
    return { success: true };
  } catch (e) {
    console.error("[adminActions] restoreFromVault:", e);
    return { success: false, message: "Failed to restore listing." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. VAULT: PERMANENTLY DELETE
// ─────────────────────────────────────────────────────────────────────────────
export async function permanentlyDelete(vaultId: string, itemId: string) {
  try {
    // 1. Delete original item document
    await adminDb.collection("items").doc(itemId).delete();

    // 2. Mark vault entry as permanently deleted (keep record for audit)
    await adminDb.collection("governance_vault").doc(vaultId).update({
      is_permanently_deleted: true,
      permanently_deleted_at: FieldValue.serverTimestamp(),
    });

    await writeLog("PERMANENT_DELETE", itemId, `Listing permanently deleted from system.`);
    revalidatePath("/admin/vault");
    return { success: true };
  } catch (e) {
    console.error("[adminActions] permanentlyDelete:", e);
    return { success: false, message: "Failed to permanently delete." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. UPDATE PRICE GUIDELINE
// ─────────────────────────────────────────────────────────────────────────────
export async function updatePriceGuideline(
  category: string,
  newMaxPrice: number,
  governanceType: "REGULATED" | "PREMIUM" = "REGULATED"
) {
  try {
    const docId = category.toLowerCase();
    await adminDb.collection("PriceGuidelines").doc(docId).set(
      {
        category: category.toUpperCase(),
        max_price: newMaxPrice,
        governance_type: governanceType,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
    await writeLog("POLICY_UPDATE", category, `Price ceiling for ${category} set to RM ${newMaxPrice} (${governanceType})`);
    revalidatePath("/admin/price-terminal");
    revalidatePath("/admin/settings");
    return { success: true, message: `Limit for ${category} set to RM ${newMaxPrice}` };
  } catch (e) {
    console.error("[adminActions] updatePriceGuideline:", e);
    return { success: false, message: "Failed to save limit." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. RESOLVE DISPUTE
// ─────────────────────────────────────────────────────────────────────────────
export async function resolveDispute(disputeId: string, action: "REFUND" | "RELEASE" | "SPLIT" | "PENALTY") {
  try {
    const disputeRef = adminDb.collection("disputes").doc(disputeId);
    const disputeDoc = await disputeRef.get();
    if (!disputeDoc.exists) return { success: false, message: "Dispute not found." };

    const data    = disputeDoc.data();
    const orderId = data?.order_id;

    if (orderId) {
      let finalStatus = "COMPLETED";
      if (action === "REFUND") finalStatus = "REFUNDED";
      if (action === "SPLIT") finalStatus = "RESOLVED_SPLIT";
      if (action === "PENALTY") finalStatus = "REFUNDED_PENALTY";

      await adminDb.collection("orders").doc(orderId).update({
        status: finalStatus,
        resolution_type: action,
        resolved_at: new Date().toISOString(),
      });
    }

    await disputeRef.update({
      status: "RESOLVED",
      resolution: action,
      resolved_at: new Date().toISOString(),
    });

    if (action === "REFUND" && data?.seller_id) {
      await adminDb.collection("users").doc(data.seller_id).update({
        reputation: FieldValue.increment(-5),
      });
    }

    if (action === "PENALTY" && data?.runner_id) {
      await adminDb.collection("users").doc(data.runner_id).update({
        reputation: FieldValue.increment(-10),
      });
    }

    await writeLog("ADJUDICATION", disputeId, `Dispute resolved via ${action}.`);
    revalidatePath("/admin/disputes");
    return { success: true, message: `Dispute resolved: ${action}` };
  } catch (e) {
    console.error("[adminActions] resolveDispute:", e);
    return { success: false, message: "Failed to resolve dispute." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. RESOLVE APPEAL
// ─────────────────────────────────────────────────────────────────────────────
export async function resolveAppeal(appealId: string, itemId: string, adminId: string, action: "APPROVE" | "REJECT") {
  try {
    if (action === "APPROVE") {
      await adminDb.collection("items").doc(itemId).update({
        status: "active",
        is_price_flagged: false,
        price_flag_count: 0,
        report_count: 0,
        flag_source: null,
        appeal_approved_by: adminId,
        appeal_approved_at: FieldValue.serverTimestamp(),
      });
      await adminDb.collection("appeals").doc(appealId).update({ status: "APPROVED" });
    } else {
      await adminDb.collection("items").doc(itemId).update({
        status: "REJECTED_POLICY_VIOLATION",
        is_price_flagged: false,
        governance_rejected_by: adminId,
        governance_rejected_at: FieldValue.serverTimestamp(),
      });
      await adminDb.collection("appeals").doc(appealId).update({ status: "REJECTED" });
    }
    revalidatePath("/admin/appeals");
    return { success: true };
  } catch (e) {
    console.error("[adminActions] resolveAppeal:", e);
    return { success: false, message: "Failed to resolve appeal." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. ESCROW CONTROLS
// ─────────────────────────────────────────────────────────────────────────────
export async function holdEscrow(orderId: string) {
  try {
    await adminDb.collection("orders").doc(orderId).update({
      escrow_status: "HELD_BY_ADMIN",
      held_at: FieldValue.serverTimestamp(),
    });
    revalidatePath("/admin/escrow");
    return { success: true };
  } catch (e) {
    console.error("[adminActions] holdEscrow:", e);
    return { success: false, message: "Failed to hold escrow." };
  }
}
// ─────────────────────────────────────────────────────────────────────────────
// 12. RUNNER APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export async function approveRunner(userId: string) {
  try {
    await adminDb.collection("users").doc(userId).update({
      runner_status: "approved",
      is_verified_runner: true,
      runner_approved_at: FieldValue.serverTimestamp()
    });

    await sendNotification(userId, {
      type: "RUNNER_APPROVED",
      title: "Application Approved!",
      body: "You are now a verified Pulse Runner. You can access the logistics terminal and start accepting orders.",
      action_url: "/run"
    });

    revalidatePath("/admin/runners");
    return { success: true };
  } catch (e) {
    console.error("[adminActions] approveRunner:", e);
    return { success: false, message: "Failed to approve runner." };
  }
}

export async function rejectRunner(userId: string) {
  try {
    await adminDb.collection("users").doc(userId).update({
      runner_status: "none",
      is_verified_runner: false
    });

    await sendNotification(userId, {
      type: "RUNNER_REJECTED",
      title: "Application Status Update",
      body: "Your runner application was not approved at this time. Please contact administration for more details."
    });

    revalidatePath("/admin/runners");
    return { success: true };
  } catch (e) {
    console.error("[adminActions] rejectRunner:", e);
    return { success: false, message: "Failed to reject runner." };
  }
}
export async function refundEscrow(orderId: string) {
  try {
    await adminDb.collection("orders").doc(orderId).update({
      status: "REFUNDED",
      escrow_status: "REFUNDED",
      refunded_at: FieldValue.serverTimestamp(),
    });
    revalidatePath("/admin/escrow");
    return { success: true };
  } catch (e) {
    console.error("[adminActions] refundEscrow:", e);
    return { success: false, message: "Failed to refund escrow." };
  }
}
