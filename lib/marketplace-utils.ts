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
  // Store images in a structured path: items/{userId}/{timestamp}_{filename}
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
