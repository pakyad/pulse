'use client'

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { ShoppingBag, Laptop, BookOpen, Shirt, Box, Sparkles, Zap, ChevronLeft, Search, Plus, ArrowUpRight } from 'lucide-react';
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
  { id: 'camp1', club_name: 'Badminton Club', initials: 'BC', tag: 'Merch Drop', title: '2026 Varsity Jerseys Pre-Order', color: 'bg-[#7C3AED]', accent: 'text-purple-200', theme: 'Badminton' },
  { id: 'camp2', club_name: 'Basketball Club', initials: 'BB', tag: 'Selections', title: 'Open Tryouts for Campus Team', color: 'bg-[#0F172A]', accent: 'text-slate-400', theme: 'Basketball' },
  { id: 'camp3', club_name: 'MIDI Council', initials: 'MD', tag: 'Tickets', title: 'Final Year Dinner Registration', color: 'bg-[#059669]', accent: 'text-emerald-200', theme: 'Digital' }
];

const DISCOVERY_FALLBACK = [
  { id: 'd1', title: 'UniKL Premium Lanyard (Black Edition)', price: 15, image_url: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?q=80&w=400', seller_name: 'Official Store', time_ago: '1h ago', is_official: true, category: 'Official' },
  { id: 'd2', title: 'Casio Scientific Calculator fx-570MS', price: 45, image_url: 'https://images.unsplash.com/photo-1574607383476-f517f220d356?q=80&w=400', seller_name: 'Student', time_ago: '3h ago', category: 'Tech' },
  { id: 'd3', title: 'Engineering Graphics Drafting Set', price: 120, image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=400', seller_name: 'Student', time_ago: '5h ago', category: 'Misc' },
  { id: 'd4', title: 'Pulse Campus Life Hoodie (Oversized)', price: 85, image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400', seller_name: 'Official Store', time_ago: '1d ago', is_official: true, category: 'Merch' },
  { id: 'd5', title: 'Mechanical Keyboard (Silent Brown Switches)', price: 210, image_url: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=400', seller_name: 'Student', time_ago: '1d ago', category: 'Tech' },
  { id: 'd6', title: 'Python Programming: A Modern Approach', price: 38, image_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=400', seller_name: 'Student', time_ago: '2d ago', category: 'Books' },
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
    return list.filter(i => i.category?.toLowerCase() === activeCategory.toLowerCase());
  }, [items, activeCategory]);

  return (
    <main className="min-h-screen bg-white pb-32 font-sans antialiased text-[#1A1A1A]">
      
      {/* ── FIXED NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-5 pt-4 pb-4 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b border-slate-50">
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

      <div className="pt-20 space-y-12">

        {/* ── 1. CAMPUS UPDATES (HOME SCALE) ── */}
        <div className="!mt-0">
          <div className="px-6 !mt-[32px] !mb-[12px] flex items-baseline justify-between">
             <h3 className="text-[18px] font-bold text-navy tracking-tight">Club Pulse</h3>
             <button className="text-[12px] font-medium text-[#8E8E93]">View All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar pb-8">
            {OFFICIAL_CAMPAIGNS.map((camp) => (
              <motion.div
                key={camp.id}
                whileTap={{ scale: 0.98 }}
                className={`shrink-0 w-[280px] p-8 rounded-[22px] ${camp.color} text-white flex flex-col justify-between min-h-[200px] group cursor-pointer transition-all overflow-hidden relative border border-[#F2F2F7]/10`}
              >
                {/* Thematic Background Accent */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                  <span className="text-[120px] font-black leading-none tracking-tighter select-none">{camp.initials}</span>
                </div>

                {/* Neon Pixel Accent */}
                <div className="relative z-10 flex items-start justify-between">
                   <div className="flex flex-col gap-1">
                     <span className={`pl-2 border-l-2 border-white text-[8px] font-black uppercase tracking-[0.3em] text-white/90`}>
                       {camp.tag}
                     </span>
                   </div>
                </div>
                
                <div className="relative z-10 space-y-2 mt-auto">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">
                    {camp.club_name}
                  </p>
                  <h4 className="text-[18px] font-bold text-white leading-tight tracking-tight pr-4">
                    {camp.title}
                  </h4>
                </div>

                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <ArrowUpRight size={18} className="text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── 2. MARKETPLACE HEADER ── */}
        <div className="px-6 !mt-[32px] !mb-[12px] flex items-baseline justify-between">
          <h3 className="text-[18px] font-bold text-navy tracking-tight">Marketplace</h3>
          <button className="text-[12px] font-medium text-[#8E8E93]">View All</button>
        </div>

        {/* ── 3. CATEGORY PICKER (MICRO PILLS) ── */}
        <div className="!mt-4">
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pl-6 pr-6 pb-4 border-b border-[#F2F2F7]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(prev => prev === cat.filter ? null : cat.filter)}
                className={`relative cursor-pointer shrink-0 h-[36px] px-4 rounded-full border transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeCategory === cat.filter 
                    ? `bg-navy text-white border-navy shadow-md shadow-navy/10` 
                    : `bg-white border-slate-100 text-navy hover:border-slate-200`
                }`}
              >
                <div className={`scale-[0.8] ${activeCategory === cat.filter ? 'text-white' : 'text-navy/40'}`}>
                  <cat.icon />
                </div>
                <span className="text-[11px] font-bold whitespace-nowrap tracking-tight">
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. DISCOVERY GRID (DYNAMIC EDITORIAL RHYTHM) ── */}
        <div className="-mt-4">
          {discoveryItems.length === 0 ? (
            <div className="px-8 py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag size={24} className="text-slate-200" />
              </div>
              <div>
                <h4 className="text-[16px] font-bold text-navy">No listings found</h4>
                <p className="text-[12px] text-slate-400">Be the first to list something in this category.</p>
              </div>
              <button 
                onClick={() => setActiveCategory(null)}
                className="text-[12px] font-bold text-navy hover:opacity-60 transition-all border-b border-navy/20 pb-0.5"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            Array.from({ length: Math.ceil(discoveryItems.length / 16) }).map((_, chunkIndex) => (
              <div key={chunkIndex} className="space-y-2">
                <section className="px-6 space-y-6">
                  <div className="grid grid-cols-2 gap-x-2.5 gap-y-10">
                    {discoveryItems.slice(chunkIndex * 16, (chunkIndex + 1) * 16).map((item) => (
                      <motion.div
                        key={item.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push(`/marketplace/${item.id}`)}
                        className="flex flex-col cursor-pointer group bg-white rounded-[22px] p-4 border border-[#F2F2F7]"
                      >
                        <div className="relative aspect-square bg-slate-50 rounded-[18px] overflow-hidden mb-4 p-2">
                          <img 
                            src={item.image_url} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 rounded-[12px]" 
                            alt={item.title} 
                            onError={(e: any) => {
                              e.target.src = 'https://images.unsplash.com/photo-1621944190310-e3cca1564bd7?q=80&w=400';
                              e.target.onerror = null;
                            }}
                          />
                          {loading && (
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 animate-shimmer" />
                          )}
                        </div>
                        <div className="px-1.5 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-[14px] font-bold text-navy leading-snug line-clamp-2 flex-1 tracking-tight">{item.title}</h4>
                            <span className="text-[10px] font-medium text-slate-300 shrink-0 mt-0.5">{item.time_ago || '2d'}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-100 shrink-0">
                                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.seller_name}`} className="w-full h-full object-cover" alt="" />
                              </div>
                              <span className="text-[11px] font-medium text-slate-400 truncate max-w-[70px]">{item.seller_name}</span>
                            </div>
                            <p className="text-[16px] font-black text-navy leading-none tracking-tighter">RM {Number(item.price).toLocaleString()}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                {/* Dynamic Institutional Interrupter (Fully Centered & Compact) */}
                {discoveryItems.length > (chunkIndex + 1) * 16 && (
                  <section className="px-6 !mt-6 mb-8">
                    <motion.div 
                      whileTap={{ scale: 0.98 }}
                      className={`rounded-[22px] p-6 flex flex-col items-center text-center cursor-pointer group border border-[#F2F2F7] ${
                        chunkIndex % 3 === 0 ? 'bg-[#14B8A6] text-white' : 
                        chunkIndex % 3 === 1 ? 'bg-[#0F172A] text-white' : 
                        'bg-[#7C3AED] text-white'
                      }`}
                    >
                       <div className="space-y-1.5 mb-4">
                          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Institutional Sync</p>
                          <h3 className="text-[17px] font-bold tracking-tight px-4 leading-tight">
                            {chunkIndex % 3 === 0 ? 'Need a Pulse Runner?' : 
                             chunkIndex % 3 === 1 ? 'Join the Official Store' : 
                             'Campus Safety Protocol'}
                          </h3>
                          <p className="text-[11px] text-white/60 font-medium px-6">
                            {chunkIndex % 3 === 0 ? 'Instant logistics and printing support.' : 
                             chunkIndex % 3 === 1 ? 'Verified listings from campus clubs.' : 
                             'Report suspicious activities to security.'}
                          </p>
                       </div>
                       <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-navy transition-all">
                          <ArrowUpRight size={18} />
                       </div>
                    </motion.div>
                  </section>
                )}
              </div>
            ))
          )}
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



      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </main>
  );
}
