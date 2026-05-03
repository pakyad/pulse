import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const KELAB_BOLA_EMAIL = 'kelabbola@s.unikl.edu.my';

const KELAB_BOLA_ITEMS = [
    {
        title: 'Official UniKL FC Jersey 2026',
        description: 'Elite performance jersey with moisture-wicking technology. Home Kit.',
        price: 65,
        stock_count: 30,
        category: 'Apparel',
        image_url: 'https://images.unsplash.com/photo-1580087443545-73f55694276f?q=80&w=600',
        is_official: true,
        status: 'active'
    },
    {
        title: 'Training Football (Size 5)',
        description: 'High-durability match ball for campus tournaments.',
        price: 45,
        stock_count: 15,
        category: 'Sports',
        image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=600',
        is_official: true,
        status: 'active'
    },
    {
        title: 'UniKL Football Club Scarf',
        description: 'Double-knit acrylic scarf. Perfect for match days.',
        price: 25,
        stock_count: 50,
        category: 'Accessories',
        image_url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=600',
        is_official: true,
        status: 'active'
    }
];

export async function seedKelabBolaItems(sellerId: string) {
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('seller_id', '==', sellerId));
    const snap = await getDocs(q);

    if (snap.empty) {
        console.log(`[Pulse Seed] Seeding Kelab Bola items for ${sellerId}`);
        for (const item of KELAB_BOLA_ITEMS) {
            await addDoc(itemsRef, {
                ...item,
                seller_id: sellerId,
                seller_name: 'Kelab Bola UniKL',
                created_at: serverTimestamp()
            });
        }
    }
}
