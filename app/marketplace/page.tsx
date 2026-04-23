'use client'

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { Search, Settings, Bell, ChevronLeft, Heart, Plus, X, ShieldCheck } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import SearchOverlay from '@/components/shared/SearchOverlay';
import FeaturedBanner, { BannerSlide } from '@/components/shared/FeaturedBanner';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

// ── Category Data ──
const CATEGORIES = [
  { id: 'Official', label: 'Official Store',  count: '24 items', filter: 'Official', bg: '#07101f', glow: '#1e3a8a' },
  { id: 'Tech',     label: 'Tech & Gadgets',  count: '18 items', filter: 'Tech',     bg: '#07101a', glow: '#0c4a6e' },
  { id: 'Academic', label: 'Books & Refs',    count: '32 items', filter: 'Academic', bg: '#160d00', glow: '#451a03' },
  { id: 'Services', label: 'Campus Services', count: '9 items',  filter: 'Services', bg: '#071210', glow: '#052e16' },
  { id: 'Apparel',  label: 'Club Apparel',    count: '15 items', filter: 'Official', bg: '#0d0720', glow: '#2e1065' },
  { id: 'Other',    label: 'Miscellaneous',   count: '41 items', filter: 'Other',    bg: '#0f1117', glow: '#1e2535' },
];

// ── Abstract 3D SVG Visuals ──
function CategoryVisual({ id }: { id: string }) {
  const commonProps = {
    width: "80",
    height: "80",
    viewBox: "0 0 24 24",
    className: "absolute -right-2 top-1/2 -translate-y-1/2 opacity-20",
    style: { imageRendering: 'pixelated' as any }
  };

  if (id === 'Official') return (
    <svg {...commonProps}>
      <rect x="6" y="4" width="12" height="16" fill="#fde68a" />
      <rect x="4" y="6" width="16" height="12" fill="#fde68a" />
      <rect x="8" y="8" width="8" height="8" fill="#fbbf24" opacity="0.5" />
      <rect x="11" y="10" width="2" height="4" fill="white" />
    </svg>
  );
  if (id === 'Tech') return (
    <svg {...commonProps}>
      <rect x="4" y="6" width="16" height="10" fill="#22d3ee" />
      <rect x="6" y="8" width="12" height="6" fill="#0891b2" />
      <rect x="10" y="16" width="4" height="2" fill="#22d3ee" />
      <rect x="8" y="18" width="8" height="1" fill="#22d3ee" />
    </svg>
  );
  if (id === 'Academic') return (
    <svg {...commonProps}>
      <rect x="6" y="4" width="12" height="16" fill="#fbbf24" />
      <rect x="8" y="4" width="10" height="14" fill="#fef3c7" opacity="0.4" />
      <rect x="6" y="18" width="12" height="2" fill="#d97706" />
      <rect x="8" y="7" width="6" height="2" fill="#f59e0b" />
    </svg>
  );
  if (id === 'Services') return (
    <svg {...commonProps}>
      <rect x="8" y="4" width="8" height="2" fill="#34d399" />
      <rect x="6" y="6" width="12" height="12" fill="#34d399" />
      <rect x="8" y="8" width="8" height="8" fill="#059669" opacity="0.4" />
      <rect x="11" y="11" width="2" height="2" fill="white" />
    </svg>
  );
  if (id === 'Apparel') return (
    <svg {...commonProps}>
      <rect x="6" y="6" width="12" height="14" fill="#a78bfa" />
      <rect x="4" y="8" width="16" height="4" fill="#a78bfa" />
      <rect x="9" y="6" width="6" height="4" fill="#c4b5fd" opacity="0.5" />
      <rect x="10" y="12" width="4" height="4" fill="#7c3aed" opacity="0.3" />
    </svg>
  );
  return (
    <svg {...commonProps}>
      <rect x="4" y="4" width="16" height="16" fill="#94a3b8" />
      <rect x="7" y="7" width="10" height="10" fill="#475569" />
      <rect x="10" y="10" width="4" height="4" fill="#f1f5f9" opacity="0.5" />
    </svg>
  );
}

const MARKET_SLIDES: BannerSlide[] = [
  { id: 'm1', tag: '🔥 FLASH SALE', headline: "Badminton Club Jersey — Official '26", subline: 'RM 95 · Limited 50 units', ctaText: 'Claim Now', ctaPath: '/marketplace', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000&auto=format&fit=crop' },
  { id: 'm2', tag: 'NEW ARRIVAL',   headline: 'MUET Reference Pack 2026 Edition', subline: 'Latest edition with past year papers', ctaText: 'View Item', ctaPath: '/marketplace', img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=1000&auto=format&fit=crop' },
  { id: 'm3', tag: 'PRESTIGE TECH', headline: 'Keychron K2 Mechanical Keyboard', subline: 'RGB backlit · Hot-swappable · Pre-owned', ctaText: 'Browse Tech', ctaPath: '/marketplace', img: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=1000&auto=format&fit=crop' },
];

const FLASH_FALLBACK = [
  { id: 'fl1', title: 'Calculus III Ref Pack', price: 45, img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop', seller: 'MIIT Academic' },
  { id: 'fl2', title: 'BAC Official Jersey', price: 95, img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400&auto=format&fit=crop', seller: 'BAC Club' },
  { id: 'fl3', title: 'Campus Med Kit', price: 38, img: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=400&auto=format&fit=crop', seller: 'Health Hub' },
  { id: 'fl4', title: 'Python Mastery Pro', price: 120, img: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=400&auto=format&fit=crop', seller: 'CS Society' },
];

export default function MarketplacePage() {
  const [items, setItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isSeller = profile?.is_seller === true || profile?.role === 'CLUB';

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;
      onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
      const qN = query(collection(db, 'transactions'), where('buyer_id', '==', user.uid), where('status', '==', 'PENDING'));
      onSnapshot(qN, s => setNotificationCount(s.docs.length));
    });
    const q = query(collection(db, 'items'), where('status', '==', 'active'), orderBy('created_at', 'desc'));
    const unsubItems = onSnapshot(q, s => { setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    return () => { unsubAuth(); unsubItems(); };
  }, []);

  const filtered = useMemo(() => {
    if (!activeCategory) return items;
    return items.filter(i => i.category === activeCategory || (activeCategory === 'Official' && i.is_official));
  }, [items, activeCategory]);

  const displayItems = filtered.length > 0 ? filtered : (loading ? [] : FLASH_FALLBACK);
  const flashItems = items.length > 0 ? items.slice(0, 4) : FLASH_FALLBACK;

  return (
    <main className="min-h-screen bg-[#F8F9FA] pb-32 font-sans antialiased text-navy">

      {/* ── MASTER NAV (Standardized) ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-5 pt-8 pb-4 flex items-center gap-3 bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-navy/40 hover:text-navy transition-all active:scale-90">
          <ChevronLeft size={28} strokeWidth={2} />
        </button>
        <div className="flex-1">
          <button onClick={() => setIsSearchOpen(true)} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl flex items-center px-4 gap-3 transition-all">
            <Search size={18} className="text-slate-300" />
            <span className="text-[13px] font-bold text-slate-300">Search Pulse</span>
          </button>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => router.push('/activity')} className="relative p-2 active:scale-90 text-navy/40 hover:text-navy">
            <Bell size={22} strokeWidth={2} />
            {notificationCount > 0 && (
              <div className="absolute top-1.5 right-1.5 bg-accent text-white text-[8px] font-black h-3.5 w-3.5 rounded-md flex items-center justify-center border-2 border-[#FDFDFD]">
                {notificationCount}
              </div>
            )}
          </button>
          <AvatarDropdown 
            photoUrl={profile?.photo_url} 
            userName={profile?.full_name || 'P'} 
          />
        </div>
      </nav>

      <div className="pt-28 space-y-10 pb-24">


        {/* ── CATEGORIES (Blinkist-style 2-col grid) ── */}
        <div className="px-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[17px] font-bold text-navy tracking-tight">Browse Categories</h3>
            {activeCategory && (
              <button onClick={() => setActiveCategory(null)} className="flex items-center gap-1.5 text-[11px] font-bold text-accent">
                <X size={12} /> Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveCategory(prev => prev === cat.filter ? null : cat.filter)}
                className={`relative h-28 rounded-2xl overflow-hidden text-left transition-all ${activeCategory === cat.filter ? 'ring-2 ring-white/30 ring-offset-1 ring-offset-transparent' : ''}`}
                style={{ backgroundColor: cat.bg }}
              >
                {/* Radial glow light source */}
                <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 75% 40%, ${cat.glow}99 0%, transparent 65%)` }} />
                {/* 3D abstract SVG shape */}
                <CategoryVisual id={cat.id} />
                {/* Text overlay */}
                <div className="relative h-full p-4 flex flex-col justify-end">
                  <h4 className="text-white font-bold text-[14px] leading-tight">{cat.label}</h4>
                  <p className="text-white/35 text-[10px] font-medium mt-0.5">{cat.count}</p>
                </div>
                {activeCategory === cat.filter && (
                  <div className="absolute top-3 left-3 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <ShieldCheck size={11} className="text-navy" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── FLASH DROPS ── */}
        <div>
          <div className="px-5 mb-4 flex items-center justify-between">
            <h3 className="text-[17px] font-bold text-navy tracking-tight">Flash Drops</h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] font-bold text-accent">Live</span>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 no-scrollbar pb-1">
            {flashItems.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/marketplace/${item.id}`)}
                className="shrink-0 w-[140px] bg-white border border-slate-100 rounded-2xl p-3 cursor-pointer shadow-sm"
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 bg-slate-50">
                  <img src={item.image_url || item.img} className="w-full h-full object-cover" alt={item.title} />
                </div>
                <div className="space-y-0.5 mt-1">
                  <p className="text-[12px] font-bold text-navy truncate">{item.title}</p>
                  <p className="text-[14px] font-black text-navy mt-0.5">RM {Number(item.price).toFixed(0)}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">{item.seller || 'Verified Club'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── DISCOVERY GRID ── */}
        <div className="px-5">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-[17px] font-bold text-navy tracking-tight">Discovery</h3>
              {activeCategory
                ? <p className="text-[11px] font-bold text-accent mt-0.5 uppercase tracking-widest">{activeCategory}</p>
                : <p className="text-[11px] text-slate-400 font-medium mt-0.5">All campus listings</p>
              }
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(n => <div key={n} className="aspect-[4/5] bg-navy/5 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 pt-2">
              {/* SHARP COMPACT LISTING: ROG Zephyrus G14 Override */}
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/marketplace/rog-zephyrus-special`)}
                className="flex flex-col cursor-pointer group"
              >
                <div className="relative aspect-[3.5/4] rounded-xl overflow-hidden bg-white border border-navy/10 shadow-sm transition-all group-hover:border-navy/30">
                  <div className="h-[65%] w-full bg-slate-900 relative">
                    <img src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600" className="w-full h-full object-cover opacity-80" alt="ROG Zephyrus" />
                    {/* JOSH PIXEL BADGE */}
                    <div className="absolute top-2 left-2">
                      <div className="bg-navy px-2 py-0.5 border-[1.5px] border-white/20 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]">
                        <span className="text-[7px] font-black text-white uppercase tracking-[0.2em] font-mono">Student-Seller</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[35%] w-full bg-white px-3 py-2.5 flex flex-col justify-between">
                    <h4 className="text-[12px] font-bold text-navy leading-tight line-clamp-2">ROG Zephyrus G14 (2026) GA403</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-black text-navy tabular-nums">RM 13,999</p>
                      <div className="w-5 h-5 rounded-md bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                        <img src={profile?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=AbuCutiepie`} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {displayItems.filter(i => !i.title.toLowerCase().includes('sarang burung')).map((item) => (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/marketplace/${item.id}`)}
                  className="flex flex-col cursor-pointer group"
                >
                  <div className="relative aspect-[3.5/4] rounded-xl overflow-hidden bg-white border border-navy/10 shadow-sm transition-all group-hover:border-navy/20">
                    <div className="h-[65%] w-full bg-slate-50 relative">
                      <img src={item.image_url} className="w-full h-full object-cover" alt={item.title} />
                      {/* JOSH PIXEL BADGE */}
                      <div className="absolute top-2 left-2">
                        <div className={`${item.is_official ? 'bg-emerald-600' : 'bg-navy'} px-2 py-0.5 border-[1.5px] border-white/20 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]`}>
                          <span className="text-[7px] font-black text-white uppercase tracking-[0.2em] font-mono">
                            {item.is_official ? 'Unistore' : 'Student-Seller'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[35%] w-full bg-white px-3 py-2.5 flex flex-col justify-between">
                      <h4 className="text-[12px] font-bold text-navy leading-tight line-clamp-2">{item.title}</h4>
                      <div className="flex items-center justify-between">
                        <p className="text-[15px] font-black text-navy tabular-nums">RM {Number(item.price).toFixed(0)}</p>
                        <div className="w-5 h-5 rounded-md bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                           {item.seller_name ? <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.seller_name}`} /> : <div className="w-full h-full flex items-center justify-center text-[7px] font-black text-slate-300">P</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── FLOATING POST BUTTON ── */}
      {isSeller && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => router.push('/post')}
          className="fixed bottom-28 right-5 bg-navy text-white h-14 px-6 rounded-full font-bold text-[13px] flex items-center gap-2 shadow-2xl shadow-navy/25 active:scale-95 transition-all border border-white/10"
        >
          <Plus size={18} strokeWidth={3} /> Post Item
        </motion.button>
      )}

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  );
}
