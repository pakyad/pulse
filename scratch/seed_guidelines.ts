import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

async function seedPriceGuidelines() {
  console.log(" Pulse Administrative Seeding: Price Guidelines...");
  
  const guidelines = [
    { id: 'tech', maxBasePrice: 50.00 },
    { id: 'books', maxBasePrice: 30.00 },
    { id: 'apparel', maxBasePrice: 40.00 },
    { id: 'services', maxBasePrice: 20.00 }
  ];

  for (const g of guidelines) {
    await setDoc(doc(db, "PriceGuidelines", g.id), {
      maxBasePrice: g.maxBasePrice,
      updated_at: new Date().toISOString()
    });
    console.log(` Established: ${g.id} limit set to RM ${g.maxBasePrice.toFixed(2)}`);
  }

  console.log(" Seeding Complete. Restart the Admin Terminal to see violations.");
  process.exit(0);
}

seedPriceGuidelines();
