
import { db } from './lib/firebase';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';

async function fixScarfAlignment() {
  console.log("🏛️ Pulse Registry Audit: Aligning UniKL Scarf...");
  
  const itemsRef = collection(db, "items");
  const q = query(itemsRef);
  const snap = await getDocs(q);
  
  let fixedCount = 0;
  for (const d of snap.docs) {
    if (d.id.startsWith("cicMuv")) {
      console.log(`Found Target Node: ${d.id} (${d.data().title})`);
      await updateDoc(doc(db, "items", d.id), {
        seller_id: "2GSboliteBeTsO3eeVCIoBseLB62",
        seller_name: "Kelab Bola"
      });
      console.log("✅ Registry Update: Force-aligned to Kelab Bola (2GSboliteBeTsO3eeVCIoBseLB62)");
      fixedCount++;
    }
  }
  
  if (fixedCount === 0) console.log("⚠️ No matching item found with prefix cicMuv.");
}

// Since this is a scratch script for me to run, I'll just keep the logic here.
// I will execute this via a temporary page or just assume I can't run it directly
// and instead write a one-off useEffect in NavigationGate or similar?
// Actually, I can use the run_command if I have a script. 
// But I don't have a direct firestore-admin CLI.
// I'll provide the fix in a way the user can see/run or I'll run it in the background if possible.
