'use client'

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { ShoppingBag, Laptop, BookOpen, Shirt, Box, Sparkles, Zap } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchOverlay from '@/components/shared/SearchOverlay';


// ── Premium 3D Voxel-Style Categories (Full-Color Pill) ──
const CATEGORIES = [
  { id: 'store', label: 'Official', filter: 'Official', icon: ShoppingBag, color: 'bg-[#1877F2]', shadow: 'bg-[#1E40AF]' }, 
  { id: 'tech', label: 'Tech', filter: 'Tech', icon: Laptop, color: 'bg-[#4A5568]', shadow: 'bg-[#334155]' }, 
  { id: 'books', label: 'Books', filter: 'Books', icon: BookOpen, color: 'bg-[#9B51E0]', shadow: 'bg-[#581C87]' }, 
  { id: 'apparel', label: 'Apparel', filter: 'Merch', icon: Shirt, color: 'bg-[#E83E8C]', shadow: 'bg-[#BE185D]' }, 
  { id: 'misc', label: 'Misc', filter: 'Misc', icon: Box, color: 'bg-[#F2994A]', shadow: 'bg-[#C2410C]' }, 
  { id: 'services', label: 'Services', filter: 'Services', icon: Sparkles, color: 'bg-[#27AE60]', shadow: 'bg-[#166534]' }, 
];

const OFFICIAL_CAMPAIGNS = [
  { id: 'camp1', club_name: 'Badminton Club', tag: 'Merch Drop', title: '2026 Varsity Jerseys Pre-Order', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=BC', tagColor: 'bg-blue-50 text-blue-600' },
  { id: 'camp2', club_name: 'Basketball Club', tag: 'Selections', title: 'Open Tryouts for Campus Team', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=BB', tagColor: 'bg-orange-50 text-orange-600' },
  { id: 'camp3', club_name: 'MIDI Council', tag: 'Tickets', title: 'Final Year Dinner Registration', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=MD', tagColor: 'bg-purple-50 text-purple-600' }
];

const DISCOVERY_FALLBACK = [
  { id: 'd1', title: 'Entrepreneurship for Students', price: 42, image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400', seller_name: 'Official Store', time_ago: '2d ago', is_official: true },
  { id: 'd2', title: 'Software Engineering Principles', price: 85, image_url: 'https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=400', seller_name: 'Student', time_ago: '2d ago' },
  { id: 'd3', title: 'Data Structures in Java', price: 75, image_url: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=400', seller_name: 'Student', time_ago: '2d ago' },
  { id: 'd4', title: 'MUET Complete Reference 2026', price: 38, image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400', seller_name: 'Official Store', time_ago: '2d ago', is_official: true },
  { id: 'd5', title: 'Introduction to Algorithms (CLRS)', price: 210, image_url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=400', seller_name: 'Student', time_ago: '2d ago' },
  { id: 'd6', title: 'Milk and Honey', price: 28, image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400', seller_name: 'Student', time_ago: '2d ago' },
];

export default function MarketplacePage() {
  const [items, setItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeItemsCount, setActiveItemsCount] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;
      onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
      const qCount = query(collection(db, 'items'), where('seller_id', '==', user.uid), where('is_active', '==', true));
      onSnapshot(qCount, s => setActiveItemsCount(s.docs.length));
    });

    const q = query(collection(db, 'items'), where('is_active', '==', true));
    const unsubItems = onSnapshot(q, s => { 
      const docs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      // Client-side sort to bypass Firestore missing composite index error
      docs.sort((a: any, b: any) => {
        const tA = a.created_at?.toMillis ? a.created_at.toMillis() : 0;
        const tB = b.created_at?.toMillis ? b.created_at.toMillis() : 0;
        return tB - tA;
      });
      setItems(docs); 
      setLoading(false); 
    });

    return () => { unsubAuth(); unsubItems(); };
  }, []);

  const discoveryItems = useMemo(() => {
    const list = items.length > 0 ? items : DISCOVERY_FALLBACK;
    if (!activeCategory) return list;
    return list.filter(i => i.category === activeCategory);
  }, [items, activeCategory]);

  return (
    <main className="min-h-screen bg-white pb-32 font-sans antialiased text-[#1A1A1A]">
      <div className="pt-28 space-y-12 pb-24">

        {/* ── BROWSE CATEGORIES ── */}
        <div className="pl-6">
          <div className="flex items-center justify-between pr-6 mb-4">
            <h3 className="text-[18px] font-bold text-navy tracking-tight">Browse Categories</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-8 pr-6 pt-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(prev => prev === cat.filter ? null : cat.filter)}
                className={`relative cursor-pointer shrink-0 transition-opacity ${activeCategory === cat.filter ? 'opacity-100' : activeCategory ? 'opacity-40 hover:opacity-100' : 'opacity-100'} group h-[48px]`}
              >
                 {/* 3D Base (Shadow/Extrusion) */}
                 <div className={`absolute inset-0 translate-y-1.5 translate-x-1 rounded-full ${cat.shadow} transition-all duration-300 group-hover:translate-y-2.5 group-hover:translate-x-1.5`} />
                 
                 {/* Main Block (Full Color Pill) */}
                 <div className={`relative h-full px-6 rounded-full ${cat.color} border-2 border-black/10 flex items-center justify-center gap-3 transition-all duration-300 group-hover:-translate-y-1 group-hover:-translate-x-0.5 group-active:translate-y-0.5 group-active:translate-x-0.5 shadow-inner`}>
                    <div className="absolute inset-0 bg-black/5 rounded-full pointer-events-none" />
                    <cat.icon size={18} strokeWidth={2.5} className={`text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.15)] group-hover:scale-110 transition-transform duration-300 relative z-10`} />
                    <span className="text-[14px] font-bold text-white whitespace-nowrap pt-0.5 drop-shadow-[1px_1px_0_rgba(0,0,0,0.15)] relative z-10">
                      {cat.label}
                    </span>
                 </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── OFFICIAL CAMPAIGNS (Clubs & Merchants) ── */}
        {!activeCategory && (
          <div className="mt-2 border-t border-slate-100 pt-10">
            <div className="px-6 mb-6">
              <h3 className="text-[18px] font-bold text-navy tracking-tight">Official Campaigns</h3>
              <p className="text-[13px] text-slate-400 font-medium mt-0.5">Exclusive drops from campus clubs</p>
            </div>
            <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar pb-6">
              {OFFICIAL_CAMPAIGNS.map((camp) => (
                <motion.div
                  key={camp.id}
                  whileTap={{ scale: 0.98 }}
                  className="shrink-0 w-[240px] p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between min-h-[140px] group cursor-pointer hover:border-slate-200 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                     <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${camp.tagColor}`}>
                       {camp.tag}
                     </span>
                     <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                        <img src={camp.logo} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                     </div>
                  </div>
                  
                  <div>
                    <p className="text-[12px] font-medium text-slate-400 mb-1">{camp.club_name}</p>
                    <h4 className="text-[16px] font-bold text-navy leading-snug tracking-tight">
                      {camp.title}
                    </h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── DISCOVERY GRID ── */}
        <div className="px-6 mt-12">
          <div className="mb-6 px-1">
            <h3 className="text-[18px] font-bold text-navy tracking-tight">Discovery</h3>
            <p className="text-[12px] text-slate-400 font-medium mt-1">All campus listings</p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10">
            {!activeCategory && (
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/marketplace/rog-zephyrus-special`)}
                className="flex flex-col cursor-pointer group"
              >
                <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-slate-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-3">
                  <img src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="space-y-1.5 px-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-[15px] font-bold text-gray-900 leading-snug flex-1">ROG Zephyrus G14<br/>(2026) GA403</h4>
                    <p className="text-[12px] font-medium text-[#9CA3AF] shrink-0 mt-0.5">3h ago</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                         <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Abu" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <p className="text-[12px] font-medium text-[#6B7280] truncate max-w-[80px]">AbuCutiepie</p>
                    </div>
                    <p className="text-[15px] font-bold text-gray-900 leading-none">RM 13,999</p>
                  </div>
                </div>
              </motion.div>
            )}

            {discoveryItems.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/marketplace/${item.id}`)}
                className="flex flex-col cursor-pointer group"
              >
                <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-slate-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-3">
                  <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={item.title} />
                  <div className="absolute top-2 left-2 w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <div className="grid grid-cols-2 gap-0.5">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                       <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 px-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-[15px] font-bold text-gray-900 leading-snug flex-1 line-clamp-2">{item.title}</h4>
                    <p className="text-[12px] font-medium text-[#9CA3AF] shrink-0 mt-0.5">{item.time_ago || '2d ago'}</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.is_official ? 'bg-blue-100' : 'bg-slate-100'}`}>
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.seller_name}`} className="w-full h-full rounded-full object-cover" />
                      </div>
                      <p className="text-[12px] font-medium text-[#6B7280] truncate max-w-[80px]">{item.seller_name}</p>
                    </div>
                    <p className="text-[15px] font-bold text-gray-900 leading-none">RM {Number(item.price).toFixed(0)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>




      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
