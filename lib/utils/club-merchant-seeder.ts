import { db } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export const seedClubMerchants = async () => {
  const data = {
    "vendors": [
      {
        "id": "VND_FOOTBALL_001",
        "full_name": "UniKL MIIT Football Club",
        "email": "football.miit@s.unikl.edu.my",
        "role": "CLUB",
        "is_verified": true,
        "is_verified_merchant": true,
        "is_official": true,
        "campus_id": "MIIT"
      },
      {
        "id": "VND_HISOC_002",
        "full_name": "UniKL MIIT Islamic Society",
        "email": "hisoc.miit@s.unikl.edu.my",
        "role": "CLUB",
        "is_verified": true,
        "is_verified_merchant": true,
        "is_official": true,
        "campus_id": "MIIT"
      },
      {
        "id": "VND_ESPORTS_003",
        "full_name": "UniKL MIIT Esports Club",
        "email": "esports.miit@s.unikl.edu.my",
        "role": "CLUB",
        "is_verified": true,
        "is_verified_merchant": true,
        "is_official": true,
        "campus_id": "MIIT"
      },
      {
        "id": "VND_ARTS_004",
        "full_name": "UniKL MIIT Arts & Culture Club",
        "email": "arts.miit@s.unikl.edu.my",
        "role": "CLUB",
        "is_verified": true,
        "is_verified_merchant": true,
        "is_official": true,
        "campus_id": "MIIT"
      },
      {
        "id": "VND_ENTREP_005",
        "full_name": "UniKL MIIT Entrepreneurship Club",
        "email": "entrep.miit@s.unikl.edu.my",
        "role": "CLUB",
        "is_verified": true,
        "is_verified_merchant": true,
        "is_official": true,
        "campus_id": "MIIT"
      }
    ],
    "items": [
      {
        "id": "ITEM_FOOTBALL_01",
        "seller_id": "VND_FOOTBALL_001",
        "seller_name": "UniKL MIIT Football Club",
        "title": "MIIT FC Official Jersey",
        "description": "High-performance moisture-wicking fabric with institutional embroidery. Size L.",
        "price": 45.00,
        "category": "Apparel",
        "stock_count": 12,
        "status": "active",
        "campus_id": "MIIT",
        "image_url": "https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80&w=800"
      },
      {
        "id": "ITEM_HISOC_02",
        "seller_id": "VND_HISOC_002",
        "seller_name": "UniKL MIIT Islamic Society",
        "title": "Premium Travel Prayer Mat",
        "description": "Minimalist geometric pattern. Ultra-thin, foldable, and lightweight for campus use.",
        "price": 25.00,
        "category": "Lifestyle",
        "stock_count": 20,
        "status": "active",
        "campus_id": "MIIT",
        "image_url": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800"
      },
      {
        "id": "ITEM_ESPORTS_03",
        "seller_id": "VND_ESPORTS_003",
        "seller_name": "UniKL MIIT Esports Club",
        "title": "Large RGB Desk Mat",
        "description": "Institutional-grade surface for high-precision tracking. 900x400mm.",
        "price": 35.00,
        "category": "Tech",
        "stock_count": 8,
        "status": "active",
        "campus_id": "MIIT",
        "image_url": "https://images.unsplash.com/photo-1616422285623-13ff0167c958?auto=format&fit=crop&q=80&w=800"
      },
      {
        "id": "ITEM_ARTS_04",
        "seller_id": "VND_ARTS_004",
        "seller_name": "UniKL MIIT Arts & Culture Club",
        "title": "Handmade Batik Tote",
        "description": "Authentic Terengganu batik pattern. Durable canvas lining for textbooks.",
        "price": 18.00,
        "category": "Fashion",
        "stock_count": 15,
        "status": "active",
        "campus_id": "MIIT",
        "image_url": "https://images.unsplash.com/photo-1544816153-097305942664?auto=format&fit=crop&q=80&w=800"
      },
      {
        "id": "ITEM_ENTREP_05",
        "seller_id": "VND_ENTREP_005",
        "seller_name": "UniKL MIIT Entrepreneurship Club",
        "title": "Vegan Leather Organizer",
        "description": "A5 professional planner with MIIT Entrepreneurship insignia. Embossed finish.",
        "price": 28.00,
        "category": "Stationery",
        "stock_count": 25,
        "status": "active",
        "campus_id": "MIIT",
        "image_url": "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&q=80&w=800"
      }
    ]
  };

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Seed Vendors
      for (const vendor of data.vendors) {
        const vRef = doc(db, "users", vendor.id);
        transaction.set(vRef, { ...vendor, created_at: serverTimestamp() });
      }

      // 2. Seed Items
      for (const item of data.items) {
        const iRef = doc(db, "items", item.id);
        transaction.set(iRef, { ...item, created_at: serverTimestamp() });
      }
    });
    console.log("🏛️ Institutional Seeding Complete: 5 Club Merchants Online.");
    return { success: true };
  } catch (e) {
    console.error("Seeding Failed:", e);
    return { success: false, error: e };
  }
};
