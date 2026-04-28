'use client'

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { ShoppingBag, Laptop, BookOpen, Shirt, Box, Sparkles, Zap, ChevronLeft, Search, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchOverlay from '@/components/shared/SearchOverlay';
import CreateListing from '@/components/CreateListing';
import AvatarDropdown from '@/components/shared/AvatarDropdown';


const PixelAll = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="image-rendering-pixelated">
    <rect x="4" y="4" width="2" height="2" fill="currentColor" />
    <rect x="9" y="4" width="2" height="2" fill="currentColor" />
    <rect x="14" y="4" width="2" height="2" fill="currentColor" />
    <rect x="4" y="9" width="2" height="2" fill="currentColor" />
    <rect x="9" y="9" width="2" height="2" fill="currentColor" />
    <rect x="14" y="9" width="2" height="2" fill="currentColor" />
    <rect x="4" y="14" width="2" height="2" fill="currentColor" />
    <rect x="9" y="14" width="2" height="2" fill="currentColor" />
    <rect x="14" y="14" width="2" height="2" fill="currentColor" />
  </svg>
);

const PixelOfficial = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="image-rendering-pixelated">
    <rect x="4" y="6" width="12" height="10" fill="currentColor" opacity="0.8" />
    <rect x="6" y="8" width="8" height="6" fill="white" opacity="0.4" />
    <rect x="8" y="3" width="4" height="4" fill="currentColor" />
  </svg>
);

const PixelTech = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="image-rendering-pixelated">
    <rect x="3" y="5" width="14" height="10" fill="currentColor" opacity="0.8" />
    <rect x="5" y="7" width="10" height="6" fill="white" opacity="0.3" />
    <rect x="7" y="16" width="6" height="1" fill="currentColor" />
  </svg>
);

const PixelBooks = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="image-rendering-pixelated">
    <rect x="4" y="4" width="5" height="12" fill="currentColor" opacity="0.8" />
    <rect x="11" y="4" width="5" height="12" fill="currentColor" opacity="0.8" />
    <rect x="5" y="6" width="3" height="1" fill="white" opacity="0.3" />
    <rect x="12" y="8" width="3" height="1" fill="white" opacity="0.3" />
  </svg>
);

const PixelApparel = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="image-rendering-pixelated">
    <rect x="6" y="4" width="8" height="12" fill="currentColor" opacity="0.8" />
    <rect x="3" y="6" width="14" height="4" fill="currentColor" opacity="0.8" />
    <rect x="9" y="4" width="2" height="2" fill="white" opacity="0.3" />
  </svg>
);

const PixelMisc = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="image-rendering-pixelated">
    <rect x="4" y="4" width="12" height="12" fill="currentColor" opacity="0.8" />
    <rect x="6" y="6" width="8" height="8" fill="white" opacity="0.2" />
    <rect x="9" y="2" width="2" height="4" fill="currentColor" />
  </svg>
);

const PixelServices = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="image-rendering-pixelated">
    <rect x="9" y="3" width="2" height="14" fill="currentColor" opacity="0.8" />
    <rect x="3" y="9" width="14" height="2" fill="currentColor" opacity="0.8" />
    <rect x="6" y="6" width="8" height="8" fill="currentColor" opacity="0.2" />
  </svg>
);

// ── Relaxed "Clay" Palette Categories ──
const CATEGORIES = [
  { id: 'all', label: 'All', filter: null, icon: PixelAll, color: 'bg-slate-100 text-slate-800 border-slate-300' }, 
  { id: 'store', label: 'Official', filter: 'Official', icon: PixelOfficial, color: 'bg-blue-50 text-blue-700 border-blue-200' }, 
  { id: 'tech', label: 'Tech', filter: 'Tech', icon: PixelTech, color: 'bg-[#F0F4F8] text-slate-700 border-slate-300' }, 
  { id: 'books', label: 'Books', filter: 'Books', icon: PixelBooks, color: 'bg-purple-50 text-purple-700 border-purple-200' }, 
  { id: 'apparel', label: 'Apparel', filter: 'Merch', icon: PixelApparel, color: 'bg-[#FDF2F2] text-pink-700 border-pink-200' }, 
  { id: 'misc', label: 'Misc', filter: 'Misc', icon: PixelMisc, color: 'bg-orange-50 text-orange-700 border-orange-200' }, 
  { id: 'services', label: 'Services', filter: 'Services', icon: PixelServices, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, 
];

const OFFICIAL_CAMPAIGNS = [
  { id: 'camp1', club_name: 'Badminton Club', initials: 'BC', tag: 'Merch Drop', title: '2026 Varsity Jerseys Pre-Order', tagColor: 'bg-blue-50/50 text-blue-500' },
  { id: 'camp2', club_name: 'Basketball Club', initials: 'BB', tag: 'Selections', title: 'Open Tryouts for Campus Team', tagColor: 'bg-orange-50/50 text-orange-500' },
  { id: 'camp3', club_name: 'MIDI Council', initials: 'MD', tag: 'Tickets', title: 'Final Year Dinner Registration', tagColor: 'bg-purple-50/50 text-purple-500' }
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showSellLabel, setShowSellLabel] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleScroll = () => setShowSellLabel(window.scrollY < 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      
      {/* ── FIXED NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-5 pt-8 pb-4 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b border-slate-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-navy/40 hover:text-navy transition-all active:scale-90">
          <ChevronLeft size={28} strokeWidth={2} />
        </button>
        <div className="flex-1">
          <div className="relative group">
            <button onClick={() => setIsSearchOpen(true)} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-full flex items-center px-4 gap-3">
              <Search size={18} className="text-slate-300" />
              <span className="text-[13px] font-bold text-slate-300">Search Marketplace</span>
            </button>
            <AnimatePresence>
              {showSellLabel && (
                <motion.button 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={() => setIsCreateOpen(true)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 py-1 px-3 bg-white/80 rounded-full border border-slate-100 shadow-sm hover:border-accent group-hover:bg-white transition-all"
                >
                  <Sparkles size={12} className="text-accent" />
                  <span className="text-[10px] font-bold text-navy/40">Sell something?</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <AvatarDropdown 
            photoUrl={profile?.photo_url} 
            userName={profile?.full_name || 'P'} 
          />
        </div>
      </nav>

      <div className="pt-40 space-y-12">

        {/* ── BROWSE CATEGORIES (NEO-RETRO PIXEL OVERHAUL) ── */}
        <div className="pl-8">
          <div className="flex items-center justify-between pr-8 mb-5">
            <h3 className="text-[17px] font-bold text-navy tracking-tight">Browse Categories</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 pr-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(prev => prev === cat.filter ? null : cat.filter)}
                className={`relative cursor-pointer shrink-0 h-[48px] px-6 rounded-2xl border transition-all duration-200 flex items-center justify-center gap-3 ${
                  activeCategory === cat.filter 
                    ? `${cat.color} border-2 translate-y-[3px] translate-x-[2px] shadow-none ring-2 ring-inset ring-white/30` 
                    : `bg-[#FDFDFD] border-slate-100 text-slate-400 hover:border-slate-200 shadow-[3px_4px_0_0_rgba(0,0,0,0.04)] ring-2 ring-inset ring-slate-50/50`
                }`}
              >
                <div className={`${activeCategory === cat.filter ? 'text-current' : 'text-slate-300'}`}>
                  <cat.icon />
                </div>
                <span className="text-[13px] font-medium whitespace-nowrap tracking-wider">
                  {cat.label}
                </span>
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
                  className="shrink-0 w-[260px] p-7 rounded-[2.5rem] bg-[#FDFDFD] border border-slate-100 flex flex-col justify-between min-h-[160px] group cursor-pointer hover:border-slate-200 transition-all"
                >
                  <div className="flex items-start mb-6">
                     <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${camp.tagColor} opacity-70`}>
                       {camp.tag}
                     </span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">
                      {camp.club_name} <span className="opacity-40">({camp.initials})</span>
                    </p>
                    <h4 className="text-[15px] font-bold text-navy leading-tight tracking-tight">
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
            {discoveryItems.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/marketplace/${item.id}`)}
                className="flex flex-col cursor-pointer group"
              >
                {/* Strict 1:1 Square Aspect Ratio */}
                <div className="relative aspect-square bg-[#FDFDFD] rounded-2xl overflow-hidden border border-slate-50 shadow-sm mb-3">
                  <img src={item.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={item.title} />
                  
                  {/* Subtle Condition Indicator */}
                  <div className="absolute top-2 left-2">
                    <div className="flex gap-0.5 opacity-40">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="px-1 space-y-1">
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="text-[14px] font-semibold text-navy leading-tight line-clamp-1 flex-1">
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-medium text-slate-300 shrink-0">
                      {item.time_ago || '2d'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-0.5">
                    <p className="text-[15px] font-black text-navy leading-none tracking-tighter">
                      RM {Number(item.price).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1.5 opacity-60">
                      <p className="text-[10px] font-medium text-slate-400 truncate max-w-[60px]">
                        {item.seller_name}
                      </p>
                      <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.seller_name}`} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>




      
      <AnimatePresence>
        {isCreateOpen && profile && (
          <CreateListing 
            userId={auth.currentUser?.uid || ''} 
            role={profile.role || 'STUDENT'} 
            onClose={() => setIsCreateOpen(false)} 
          />
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ── MORPHING SELL FAB ── */}
      <motion.button
        layout
        onClick={() => setIsCreateOpen(true)}
        initial={false}
        animate={{
          width: showSellLabel ? 110 : 56,
          height: 56,
          borderRadius: 28,
        }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20
        }}
        className="fixed bottom-10 right-8 z-[90] bg-navy text-white shadow-2xl flex items-center justify-center overflow-hidden hover:scale-105 active:scale-95 transition-transform"
      >
        <motion.div className="flex items-center gap-3 px-6">
          <Plus size={24} className="shrink-0" />
          <AnimatePresence mode="wait">
            {showSellLabel && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-[14px] font-bold whitespace-nowrap"
              >
                Sell
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.button>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
