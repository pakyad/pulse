import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

const SE_CLUB_EMAIL = 'se-club@s.unikl.edu.my';

const SE_CLUB_ITEMS = [
    {
        title: 'Official MIIT Engineering Hoodie',
        description: 'High-quality heavyweight cotton hoodie with embroidered MIIT crest. Limited edition.',
        price: 85,
        stock_count: 50,
        category: 'Apparel',
        image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600',
        is_official: true,
        is_active: true,
        status: 'active'
    },
    {
        title: 'Arduino Uno R3 Ultimate Starter Kit',
        description: 'Complete kit for Microcontroller & IoT subjects. Includes sensors, LEDs, and jumper wires.',
        price: 45,
        stock_count: 20,
        category: 'Tech',
        image_url: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?q=80&w=600',
        is_official: true,
        is_active: true,
        status: 'active'
    },
    {
        title: 'Software Engineering Club Lanyard',
        description: 'Official club lanyard with safety breakaway. Perfect for matric card attachment.',
        price: 15,
        stock_count: 100,
        category: 'Stationery',
        image_url: 'https://images.unsplash.com/photo-1622219809260-ce065fc5277f?q=80&w=600',
        is_official: true,
        is_active: true,
        status: 'active'
    },
    {
        title: 'Keychron K2 V2 Wireless Keyboard',
        description: 'Tactile typing experience for long coding sessions. RGB backlit with aluminum frame.',
        price: 350,
        stock_count: 5,
        category: 'Tech',
        image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=600',
        is_official: true,
        is_active: true,
        status: 'active'
    },
    {
        title: 'Mastering React 18 Handbook',
        description: 'Curated engineering guide for modern web development. Official club documentation.',
        price: 60,
        stock_count: 15,
        category: 'Books',
        image_url: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=600',
        is_official: true,
        is_active: true,
        status: 'active'
    }
];

export async function seedSEClubItems(sellerId: string) {
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('seller_id', '==', sellerId));
    const snap = await getDocs(q);

    if (snap.empty) {
        console.log(`[Pulse Seed] Seeding SE Club items for ${sellerId}`);
        for (const item of SE_CLUB_ITEMS) {
            await addDoc(itemsRef, {
                ...item,
                seller_id: sellerId,
                seller_name: 'Software Engineering Club',
                created_at: serverTimestamp()
            });
        }
    }
}
