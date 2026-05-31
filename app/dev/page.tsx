'use client'

import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';

const DEMO_ACCOUNTS = [
    {
        email: 'techsociety@s.unikl.edu.my',
        password: 'password123',
        fullName: 'MIIT Tech Club',
        role: 'CLUB',
        uid: 'tech_society_123',
        data: { is_official: true, is_verified_merchant: true, seller_name: 'MIIT Tech Club', photo_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=150&auto=format&fit=crop' }
    },
    {
        email: 'sports@s.unikl.edu.my',
        password: 'password123',
        fullName: 'Sports Council',
        role: 'CLUB',
        uid: 'sports_council_123',
        data: { is_official: true, is_verified_merchant: true, seller_name: 'Sports Council', photo_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=150&auto=format&fit=crop' }
    },
    {
        email: 'caferasa@s.unikl.edu.my',
        password: 'password123',
        fullName: 'Cafe Rasa',
        role: 'MERCHANT',
        uid: 'cafe_rasa_123',
        data: { is_official: true, is_verified_merchant: true, seller_name: 'Cafe Rasa', photo_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=150&auto=format&fit=crop' }
    },
    {
        email: 'amirul@s.unikl.edu.my',
        password: 'password123',
        fullName: 'Amirul',
        role: 'SELLER',
        uid: 'student_amirul_123',
        data: { is_verified_runner: false, seller_name: 'Amirul', photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amirul' }
    },
    {
        email: 'sarah@s.unikl.edu.my',
        password: 'password123',
        fullName: 'Sarah',
        role: 'SELLER',
        uid: 'student_sarah_123',
        data: { is_verified_runner: false, seller_name: 'Sarah', photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' }
    }
];

const DEMO_LISTINGS = [
    // --- TECH SOCIETY (Merchant/Club) ---
    {
        id: 'item_tech_1', seller_id: 'tech_society_123', seller_name: 'Tech Society',
        title: 'Mechanical Keyboard K8', price: 120.00, stock_count: 5, domain: 'TECH', subcategory: 'Peripherals', governance_status: 'OPEN_MARKET',
        image_url: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop',
        description: 'Brand new 75% mechanical keyboard with brown switches. Perfect for coding.',
        metadata: { specs: 'Brown Switches, RGB', warranty: 'Seller Warranty' }
    },
    {
        id: 'item_tech_2', seller_id: 'tech_society_123', seller_name: 'Tech Society',
        title: 'USB-C Hub (7 in 1)', price: 45.00, stock_count: 10, domain: 'TECH', subcategory: 'Cables & Accessories', governance_status: 'OPEN_MARKET',
        image_url: 'https://images.unsplash.com/photo-1616410011236-7a42121dd981?q=80&w=800&auto=format&fit=crop',
        description: 'Essential for MacBooks. HDMI, USB 3.0, SD Card reader.',
        metadata: { specs: '7 ports', warranty: 'None' }
    },
    {
        id: 'item_tech_3', seller_id: 'tech_society_123', seller_name: 'Tech Society',
        title: 'Official IT Faculty Hoodie', price: 60.00, stock_count: 50, domain: 'APPAREL', subcategory: 'Official Merch', governance_status: 'OPEN_MARKET',
        image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop',
        description: 'The official 2026 IT Faculty hoodie. Pre-order now.',
        metadata: { size: 'Free Size', condition: 'Brand New' }
    },
    {
        id: 'item_tech_4', seller_id: 'tech_society_123', seller_name: 'Tech Society',
        title: 'PC Formatting Service', price: 30.00, stock_count: 100, domain: 'SERVICES', subcategory: 'Tech Support', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=800&auto=format&fit=crop',
        description: 'Fast Windows 11 installation and formatting. Data backup included.',
        metadata: { duration_type: 'Per Session', available_slots: 'Weekdays 5PM-8PM' }
    },
    {
        id: 'item_tech_5', seller_id: 'tech_society_123', seller_name: 'Tech Society',
        title: '3D Printing Service', price: 15.00, stock_count: 100, domain: 'SERVICES', subcategory: 'Creative Work', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=800&auto=format&fit=crop',
        description: 'Send us your STL file. Price is per 100g of PLA filament.',
        metadata: { duration_type: 'Per Project', available_slots: 'Anytime' }
    },

    // --- CAFE RASA (Merchant) ---
    {
        id: 'item_cafe_1', seller_id: 'cafe_rasa_123', seller_name: 'Cafe Rasa',
        title: 'Nasi Lemak Ayam Berempah', price: 8.00, stock_count: 20, domain: 'HUNGER', subcategory: 'Campus Canteen', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1626804475297-4160ebcecbfa?q=80&w=800&auto=format&fit=crop',
        description: 'Freshly packed. Best seller.',
        metadata: { active_until: 'Today 2:00 PM', pickup_location: 'Cafe Rasa Lobby' }
    },
    {
        id: 'item_cafe_2', seller_id: 'cafe_rasa_123', seller_name: 'Cafe Rasa',
        title: 'Iced Caramel Latte', price: 7.00, stock_count: 30, domain: 'HUNGER', subcategory: 'Snacks & Drinks', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?q=80&w=800&auto=format&fit=crop',
        description: 'Perfect for a hot day between classes.',
        metadata: { active_until: 'Today 5:00 PM', pickup_location: 'Cafe Rasa Counter' }
    },
    {
        id: 'item_cafe_3', seller_id: 'cafe_rasa_123', seller_name: 'Cafe Rasa',
        title: 'Double Choc Muffin', price: 4.50, stock_count: 15, domain: 'HUNGER', subcategory: 'Snacks & Drinks', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?q=80&w=800&auto=format&fit=crop',
        description: 'Baked fresh every morning.',
        metadata: { active_until: 'Today 5:00 PM', pickup_location: 'Cafe Rasa Counter' }
    },
    {
        id: 'item_cafe_4', seller_id: 'cafe_rasa_123', seller_name: 'Cafe Rasa',
        title: 'Student Combo Deal', price: 10.00, stock_count: 50, domain: 'HUNGER', subcategory: 'Campus Canteen', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop',
        description: '1 Main Meal + 1 Drink + 1 Snack. Flash your ID upon collection.',
        metadata: { active_until: 'Today 5:00 PM', pickup_location: 'Cafe Rasa Counter' }
    },
    {
        id: 'item_cafe_5', seller_id: 'cafe_rasa_123', seller_name: 'Cafe Rasa',
        title: 'Catering Pre-order (Event)', price: 25.00, stock_count: 100, domain: 'HUNGER', subcategory: 'Preorder Catering', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800&auto=format&fit=crop',
        description: 'Per pax price for club events. Minimum order 20 pax.',
        metadata: { active_until: 'Requires 2 Days Notice', pickup_location: 'Delivery to Hall' }
    },

    // --- AMIRUL (Student) ---
    {
        id: 'item_amirul_1', seller_id: 'student_amirul_123', seller_name: 'Amirul',
        title: 'Engineering Math Textbook', price: 40.00, stock_count: 1, domain: 'ACADEMIC', subcategory: 'Textbooks', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop',
        description: 'Used for 1 semester. Very good condition, no highlights.',
        metadata: { department: 'Engineering', year_semester: 'Year 1' }
    },
    {
        id: 'item_amirul_2', seller_id: 'student_amirul_123', seller_name: 'Amirul',
        title: 'Used Rice Cooker', price: 35.00, stock_count: 1, domain: 'HOSTEL', subcategory: 'Appliances', governance_status: 'OPEN_MARKET',
        image_url: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b?q=80&w=800&auto=format&fit=crop',
        description: 'Moving out soon. Works perfectly. 1.8L capacity.',
        metadata: { pickup_difficulty: 'Easy (Fits in Car)' }
    },
    {
        id: 'item_amirul_3', seller_id: 'student_amirul_123', seller_name: 'Amirul',
        title: 'Lab Coat (Size M)', price: 20.00, stock_count: 1, domain: 'ACADEMIC', subcategory: 'Lab Equipment', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop',
        description: 'Washed and clean. Bought last year.',
        metadata: { department: 'Science', year_semester: 'All' }
    },
    {
        id: 'item_amirul_4', seller_id: 'student_amirul_123', seller_name: 'Amirul',
        title: 'Standing Fan', price: 45.00, stock_count: 1, domain: 'HOSTEL', subcategory: 'Appliances', governance_status: 'OPEN_MARKET',
        image_url: 'https://images.unsplash.com/photo-1616593452442-835467332766?q=80&w=800&auto=format&fit=crop',
        description: 'Essential for hostel life without aircon.',
        metadata: { pickup_difficulty: 'Moderate (Needs 2 People)' }
    },
    {
        id: 'item_amirul_5', seller_id: 'student_amirul_123', seller_name: 'Amirul',
        title: 'Calculus Notes (A+ Graded)', price: 10.00, stock_count: 10, domain: 'ACADEMIC', subcategory: 'Digital Scripts', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=800&auto=format&fit=crop',
        description: 'PDF copy of my handwritten notes. I scored an A+.',
        metadata: { department: 'Engineering', year_semester: 'Year 1 Sem 2' }
    },

    // --- SARAH (Student) ---
    {
        id: 'item_sarah_1', seller_id: 'student_sarah_123', seller_name: 'Sarah',
        title: 'Preloved Zara Denim Jacket', price: 40.00, stock_count: 1, domain: 'APPAREL', subcategory: 'Preloved Clothes', governance_status: 'OPEN_MARKET',
        image_url: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=800&auto=format&fit=crop',
        description: 'Worn twice. Excellent condition.',
        metadata: { size: 'M', condition: 'Like New' }
    },
    {
        id: 'item_sarah_2', seller_id: 'student_sarah_123', seller_name: 'Sarah',
        title: 'Graphic Design Service', price: 50.00, stock_count: 5, domain: 'SERVICES', subcategory: 'Creative Work', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=800&auto=format&fit=crop',
        description: 'I will design a professional poster or banner for your club event.',
        metadata: { duration_type: 'Per Project', available_slots: 'Weekends' }
    },
    {
        id: 'item_sarah_3', seller_id: 'student_sarah_123', seller_name: 'Sarah',
        title: 'Programming Tutor (Python)', price: 30.00, stock_count: 5, domain: 'SERVICES', subcategory: 'Tutoring', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop',
        description: 'Struggling with assignments? I can help you understand the basics.',
        metadata: { duration_type: 'Per Hour', available_slots: 'Thursdays 8PM' }
    },
    {
        id: 'item_sarah_4', seller_id: 'student_sarah_123', seller_name: 'Sarah',
        title: 'Storage Box Set (x3)', price: 15.00, stock_count: 1, domain: 'HOSTEL', subcategory: 'Storage', governance_status: 'OPEN_MARKET',
        image_url: 'https://images.unsplash.com/photo-1595054117820-22c60c878fce?q=80&w=800&auto=format&fit=crop',
        description: 'Great for organizing your closet. 3 boxes included.',
        metadata: { pickup_difficulty: 'Easy (Fits in Car)' }
    },
    {
        id: 'item_sarah_5', seller_id: 'student_sarah_123', seller_name: 'Sarah',
        title: 'Photography for Events', price: 100.00, stock_count: 2, domain: 'SERVICES', subcategory: 'Photography', governance_status: 'COMPLIANT',
        image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop',
        description: 'Half day shooting for club events. Photos edited in Lightroom.',
        metadata: { duration_type: 'Per Session', available_slots: 'Weekends Only' }
    }
];

const DEMO_CAMPAIGNS = [
    {
        id: 'camp_1',
        status: 'active',
        seller_id: 'sports_council_123',
        club_name: 'Sports Council',
        title: 'Official Jersey Pre-Order 2026',
        tag: 'Merchandise',
        urgency: 'Ends in 2 Days',
        cta: 'Pre-Order Now',
        image_url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=800&auto=format&fit=crop'
    },
    {
        id: 'camp_2',
        status: 'active',
        seller_id: 'tech_society_123',
        club_name: 'MIIT Tech Club',
        title: 'Developer Summit Tickets',
        tag: 'Event',
        urgency: 'Only 15 Left',
        cta: 'Book Seat',
        image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800&auto=format&fit=crop'
    }
];

export default function DevSeedPage() {
    const [status, setStatus] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const log = (msg: string) => {
        setStatus(prev => [...prev, msg]);
    }

    const wipeAndSeed = async () => {
        setLoading(true);
        setStatus([]);
        log("🚀 Starting System Override...");

        try {
            // 1. Wipe existing items & campaigns
            log("🧹 Wiping all existing marketplace listings and campaigns...");
            const itemsSnap = await getDocs(collection(db, "items"));
            let deleted = 0;
            for (const docSnap of itemsSnap.docs) {
                await deleteDoc(doc(db, "items", docSnap.id));
                deleted++;
            }
            
            const campsSnap = await getDocs(collection(db, "campaigns"));
            let deletedCamps = 0;
            for (const docSnap of campsSnap.docs) {
                await deleteDoc(doc(db, "campaigns", docSnap.id));
                deletedCamps++;
            }
            
            const ordersSnap = await getDocs(collection(db, "orders"));
            let deletedOrders = 0;
            for (const docSnap of ordersSnap.docs) {
                await deleteDoc(doc(db, "orders", docSnap.id));
                deletedOrders++;
            }
            
            log(`✅ Wiped ${deleted} dummy items, ${deletedCamps} campaigns, & ${deletedOrders} orders.`);

            // 2. Provision Accounts
            log("👤 Provisioning 4 Demo Accounts...");
            for (const account of DEMO_ACCOUNTS) {
                try {
                    // We use setDoc directly to the user profile instead of Auth for simplicity 
                    // in this demo if auth fails (e.g. email already exists).
                    try {
                       const cred = await createUserWithEmailAndPassword(auth, account.email, account.password);
                       account.uid = cred.user.uid;
                    } catch(e:any) {
                       // If already exists, log in to get the TRUE uid
                       if (e.code === 'auth/email-already-in-use') {
                           const { signInWithEmailAndPassword } = await import('firebase/auth');
                           const cred = await signInWithEmailAndPassword(auth, account.email, account.password);
                           account.uid = cred.user.uid;
                       }
                    }

                    await setDoc(doc(db, "users", account.uid), {
                        uid: account.uid,
                        email: account.email,
                        full_name: account.fullName,
                        role: account.role,
                        created_at: serverTimestamp(),
                        ...account.data
                    });
                } catch (err: any) {
                    log(`⚠️ Note on ${account.email}: ${err.message}`);
                }
            }
            log("✅ Accounts ready.");

            // 3. Insert 20 New Listings & Campaigns
            log("📦 Injecting 20 High-Quality Demo Listings...");
            for (const item of DEMO_LISTINGS) {
                const matchedAccount = DEMO_ACCOUNTS.find(a => a.fullName === item.seller_name);
                const actualUid = matchedAccount ? matchedAccount.uid : item.seller_id;
                await setDoc(doc(db, "items", item.id), {
                    ...item,
                    seller_id: actualUid,
                    status: 'active',
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                });
            }
            
            log("🚀 Injecting Official Campaigns & Syncing to Marketplace...");
            for (const camp of DEMO_CAMPAIGNS) {
                const matchedAccount = DEMO_ACCOUNTS.find(a => a.fullName === camp.club_name);
                const actualUid = matchedAccount ? matchedAccount.uid : camp.seller_id;
                // Insert into Campaigns for the Banner
                await setDoc(doc(db, "campaigns", camp.id), {
                    ...camp,
                    seller_id: actualUid,
                    created_at: serverTimestamp(),
                });
                
                // Also insert into Items so the end-to-end process works (detail page -> checkout)
                await setDoc(doc(db, "items", camp.id), {
                    id: camp.id,
                    seller_id: 'official_store_123',
                    seller_name: camp.club_name,
                    title: camp.title,
                    price: camp.id === 'camp_1' ? 60.00 : 25.00, // Dummy prices
                    stock_count: 50,
                    domain: 'APPAREL',
                    subcategory: camp.tag,
                    governance_status: 'OPEN_MARKET',
                    image_url: camp.image_url,
                    description: 'This is an official campaign item. Limited stock available.',
                    metadata: { type: camp.tag, priority: 'High' },
                    status: 'active',
                    is_official: true,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp(),
                });
            }
            
            log("✅ Successfully injected new listings and campaigns.");
            log("🎉 OVERRIDE COMPLETE. System is ready for presentation.");

        } catch (error: any) {
            log(`❌ CRITICAL ERROR: ${error.message}`);
        }
        
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-12 font-sans flex flex-col items-center">
            <div className="w-full max-w-2xl bg-white p-10 rounded-2xl shadow-md border border-slate-100">
                <h1 className="text-2xl font-black text-[#000000] mb-2 tracking-tight">Pulse Database Override</h1>
                <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">
                    This will wipe all existing dummy listings and inject 20 carefully planned, presentation-ready listings divided across 4 specific accounts (2 Merchants, 2 Students).
                </p>
                
                <button 
                    onClick={wipeAndSeed}
                    disabled={loading}
                    className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[14px] uppercase tracking-widest disabled:opacity-50 hover:bg-red-600 transition-colors shadow-md shadow-red-500/20"
                >
                    {loading ? 'Overriding System...' : 'Execute Full Wipe & Seed'}
                </button>

                {status.length > 0 && (
                    <div className="mt-8 p-6 bg-blue-600 rounded-2xl border border-slate-800 text-emerald-400 font-mono text-xs space-y-2 overflow-y-auto max-h-60">
                        {status.map((s, i) => (
                            <p key={i}>{s}</p>
                        ))}
                    </div>
                )}

                {!loading && status.includes("🎉 OVERRIDE COMPLETE. System is ready for presentation.") && (
                    <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="font-black text-emerald-800 mb-4 text-[14px] uppercase tracking-widest">Demo Accounts (Password: password123)</p>
                        <ul className="space-y-3 text-sm text-emerald-700 font-medium">
                            <li className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-emerald-100"><span className="font-bold">Tech Society (Club)</span> <span>techsociety@s.unikl.edu.my</span></li>
                            <li className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-emerald-100"><span className="font-bold">Cafe Rasa (Merchant)</span> <span>caferasa@s.unikl.edu.my</span></li>
                            <li className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-emerald-100"><span className="font-bold">Amirul (Student)</span> <span>amirul@s.unikl.edu.my</span></li>
                            <li className="flex justify-between items-center bg-white px-4 py-2 rounded-xl border border-emerald-100"><span className="font-bold">Sarah (Student)</span> <span>sarah@s.unikl.edu.my</span></li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
