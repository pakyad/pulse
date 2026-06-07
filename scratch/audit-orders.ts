
import { db } from './lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

async function auditOrders() {
  console.log(" Pulse Audit: Fetching recent orders...");
  const q = query(collection(db, "orders"), orderBy("created_at", "desc"), limit(5));
  const snap = await getDocs(q);
  
  snap.docs.forEach(d => {
    console.log(`Order ID: ${d.id}`);
    console.log(JSON.stringify(d.data(), null, 2));
    console.log("---");
  });
}
