'use client'

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { Search, Plus, X, Flame, ArrowRight, Package, Clock, Zap, Terminal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchOverlay from '@/components/shared/SearchOverlay';


// ── Mandated Pixelate Cute Icon Categories (Restored) ──
const CATEGORIES = [
  { id: 'fb', label: 'Official Store', filter: 'F&B', icon: '🍔', bg: '#4A90E2', glow: '#63A1FF', count: '24 Items' }, 
  { id: 'lab', label: 'Tech & Gadgets', filter: 'Lab Kits', icon: '🧪', bg: '#4481EB', glow: '#04BEFE', count: '18 Items' }, 
  { id: 'study', label: 'Books & Refs', filter: 'Study Materials', icon: '📚', bg: '#F2994A', glow: '#F2C94C', count: '32 Items' }, 
  { id: 'merch', label: 'Campus Services', filter: 'Club Merch', icon: '👕', bg: '#27AE60', glow: '#34D399', count: '9 Items' }, 
  { id: 'med', label: 'Club Apparel', filter: 'Club Merch', icon: '👕', bg: '#9B51E0', glow: '#A855F7', count: '15 Items' }, 
  { id: 'misc', label: 'Miscellaneous', filter: 'Medicine', icon: '💊', bg: '#4B6CB7', glow: '#182848', count: '41 Items' }, 
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
          <div className="flex items-center justify-between pr-6 mb-5">
            <h3 className="text-[22px] font-black text-[#0A0F1E] tracking-tight">Browse Categories</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pr-6">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(prev => prev === cat.filter ? null : cat.filter)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all shrink-0
                  ${activeCategory === cat.filter ? 'border-navy bg-slate-50 shadow-sm' : 'border-slate-100 bg-white shadow-sm hover:bg-slate-50'}`}
              >
                <span className="text-[18px] leading-none">{cat.icon}</span>
                <span className={`text-[14px] font-bold whitespace-nowrap
                  ${activeCategory === cat.filter ? 'text-navy' : 'text-[#0A0F1E]'}`}
                >
                  {cat.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── LIVE DROPS ── */}
        {!activeCategory && (
          <div>
            <div className="px-6 mb-6 flex items-center justify-between">
              <h3 className="text-[22px] font-black text-navy tracking-tight">Live Drops</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest leading-none text-[9px]">ACTIVE NODE</span>
              </div>
            </div>
            <div className="flex gap-5 overflow-x-auto px-6 no-scrollbar pb-4">
              {discoveryItems.slice(0, 4).map((item) => (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => router.push(`/marketplace/${item.id}`)}
                  className="shrink-0 w-[160px] group cursor-pointer"
                >
                  <div className="relative aspect-square bg-white rounded-[2rem] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.04)] border border-slate-50 mb-4">
                    <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="px-1 space-y-1">
                    <h4 className="text-[13px] font-bold text-navy truncate tracking-tight">{item.title}</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-black text-navy">RM {Number(item.price).toFixed(0)}</p>
                      <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest">UNI</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── DISCOVERY GRID ── */}
        <div className="px-6">
          <div className="mb-6 px-1">
            <h3 className="text-[22px] font-bold text-gray-900 tracking-tight">Discovery</h3>
            <p className="text-[14px] text-[#9CA3AF] font-medium">All campus listings</p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10">
            {!activeCategory && (
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/marketplace/rog-zephyrus-special`)}
                className="flex flex-col cursor-pointer group"
              >
                <div className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm mb-3">
                  <img src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600" className="w-full h-full object-cover" />
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
                <div className="relative aspect-square bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm mb-3">
                  <img src={item.image_url} className="w-full h-full object-cover" alt={item.title} />
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
