import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const KELAB_BOLA_ITEMS = [
    {
        title: 'Official UniKL Football Jersey 2026',
        description: 'Boutique-grade dry-fit jersey with 3D crest and institutional sponsors. Performance cut.',
        price: 95,
        stock_count: 30,
        category: 'Apparel',
        image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600',
        is_official: true,
        is_active: true,
        deliveryType: 'RUNNER',
        status: 'active'
    },
    {
        title: 'UniKL Football Club Scarf',
        description: 'Knitted wool scarf for match days and chilly labs. Classic forest green/slate.',
        price: 25,
        stock_count: 50,
        category: 'Accessories',
        image_url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=600',
        is_official: true,
        is_active: true,
        deliveryType: 'RUNNER',
        status: 'active'
    },
    {
        title: 'Official UniKL Football Match-Day Kit (PRO)',
        description: 'Institutional performance jersey for active match-day participation. Limited edition.',
        price: 120,
        stock_count: 15,
        category: 'Apparel',
        image_url: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=600',
        is_official: true,
        is_active: true,
        deliveryType: 'RUNNER',
        status: 'active'
    }
];

export async function seedKelabBolaItems(sellerId: string) {
    const itemsRef = collection(db, 'items');
    
    //  Institutional Asset Mapping (Deterministic IDs)
    const ASSET_MAP: Record<string, any> = {
        'd_jersey_2026': KELAB_BOLA_ITEMS[0],
        'd_scarf_fix': KELAB_BOLA_ITEMS[1],
        'd_pro_kit': KELAB_BOLA_ITEMS[2]
    };

    for (const [id, item] of Object.entries(ASSET_MAP)) {
        const ref = doc(db, 'items', id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            console.log(`[Pulse Seed] Registering asset: ${item.title} -> ${id}`);
            await setDoc(ref, {
                ...item,
                seller_id: sellerId,
                seller_name: 'Kelab Bola UniKL',
                created_at: serverTimestamp()
            });
        } else {
            // Institutional Reconciliation: Fix orphan assets
            if (snap.data().seller_id !== sellerId) {
                console.log(`[Pulse Seed] Reconciling asset owner: ${id} -> ${sellerId}`);
                await updateDoc(ref, {
                    seller_id: sellerId,
                    seller_name: 'Kelab Bola UniKL',
                    status: 'active',
                    is_active: true
                });
            }
        }
    }
}
