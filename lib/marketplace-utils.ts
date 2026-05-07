import { db, storage } from "./firebase";
import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Creates a new marketplace listing with inventory policing.
 */
export const createItemListing = async (userId: string, role: string, itemData: any, imageFile: File) => {
  // 1. Enforce the "Hustle Cap" (Student sellers only)
  if (role === 'STUDENT' || role === 'ELITE RUNNER') {
    const q = query(
        collection(db, "items"), 
        where("seller_id", "==", userId), 
        where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.size >= 5) {
      throw new Error("Hustle Capacity Reached. Students are limited to 5 active listings. Finalize or remove items to proceed.");
    }
  }

  // 2. Tactical Asset Management (Firebase Storage)
  if (!imageFile) throw new Error("Visual asset required for registry entry.");
  
  const fileExt = imageFile.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, `items/${userId}/${fileName}`);
  
  const uploadResult = await uploadBytes(storageRef, imageFile);
  const imageUrl = await getDownloadURL(uploadResult.ref);

  // 3. Central Registry Update (Firestore)
  return await addDoc(collection(db, "items"), {
    title: itemData.title,
    price: parseFloat(itemData.price),
    stock_count: parseInt(itemData.stock) || 1,
    image_url: imageUrl,
    seller_id: userId,
    status: 'active',
    is_official: role === 'CLUB' || role === 'ADMIN',
    created_at: new Date().toISOString()
  });
};

/**
 * Real-time Pulse Subscription for the Marketplace
 */
export const subscribeToMarketplace = (callback: (items: any[]) => void) => {
  const q = query(
    collection(db, "items"), 
    where("status", "==", "active"),
    orderBy("created_at", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  });
};

/**
 * Transition an item to SOLD status.
 */
export const markItemAsSold = async (itemId: string) => {
  const { doc, updateDoc } = await import("firebase/firestore");
  const itemRef = doc(db, "items", itemId);
  return await updateDoc(itemRef, {
    status: 'SOLD',
    sold_at: new Date().toISOString()
  });
};

/**
 * updateOrderStatus (Logistics Handshake)
 * Manages the state machine for marketplace orders.
 */
export const updateOrderStatus = async (orderId: string, status: string, userId: string) => {
  const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
  const orderRef = doc(db, "orders", orderId);
  
  return await updateDoc(orderRef, {
    status: status,
    updated_at: serverTimestamp(),
    [`status_history.${status}`]: serverTimestamp()
  });
};

/**
 * Remove a listing from the registry.
 */
export const deleteItemListing = async (itemId: string) => {
  const { doc, deleteDoc } = await import("firebase/firestore");
  const itemRef = doc(db, "items", itemId);
  return await deleteDoc(itemRef);
};

/**
 * reportOrderIssue
 * Synchronizes student conflicts with the Admin Dispute Mediation Terminal.
 */
export const reportOrderIssue = async (orderId: string, data: any, evidence?: File) => {
  const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
  
  let evidenceUrl = '';
  if (evidence) {
    const fileName = `${Date.now()}_dispute_${orderId}.jpg`;
    const storageRef = ref(storage, `disputes/${orderId}/${fileName}`);
    const uploadResult = await uploadBytes(storageRef, evidence);
    evidenceUrl = await getDownloadURL(uploadResult.ref);
  }

  // 1. Create Dispute Record
  await addDoc(collection(db, "disputes"), {
    order_id: orderId,
    buyer_id: data.buyer_id || 'UNKNOWN_BUYER',
    seller_id: data.seller_id || 'UNKNOWN_SELLER',
    reporter_name: data.reporter_name,
    order_code: data.order_code,
    reason: data.reason,
    narrative: data.narrative,
    evidence_url: evidenceUrl,
    status: 'AWAITING_ADMIN',
    created_at: serverTimestamp(),
  });

  // 2. Flag Order as DISPUTED
  const orderRef = doc(db, "orders", orderId);
  return await updateDoc(orderRef, {
    is_disputed: true,
    dispute_status: 'AWAITING_ADMIN',
    updated_at: serverTimestamp()
  });
};
