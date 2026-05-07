import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

async function seedPriceGuidelines() {
  console.log("🏛️ Pulse Administrative Seeding: Price Guidelines...");
  
  const guidelines = [
    { id: 'Tech Assets', maxBasePrice: 5.00 },
    { id: 'Student Apparel', maxBasePrice: 10.00 },
    { id: 'Food', maxBasePrice: 15.00 },
    { id: 'Stationery', maxBasePrice: 3.00 }
  ];

  for (const g of guidelines) {
    await setDoc(doc(db, "PriceGuidelines", g.id), {
      maxBasePrice: g.maxBasePrice,
      updated_at: new Date().toISOString()
    });
    console.log(`✅ Established: ${g.id} limit set to RM ${g.maxBasePrice.toFixed(2)}`);
  }

  console.log("🚀 Seeding Complete. Restart the Admin Terminal to see violations.");
  process.exit(0);
}

seedPriceGuidelines();
