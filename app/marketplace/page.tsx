'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, limit } from 'firebase/firestore';
import {
  Laptop, BookOpen, Shirt, Box, ChevronLeft,
  Search, LayoutGrid, ShieldCheck, HeartPulse,
  ArrowUpRight, Filter, Store, X
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import ProductCard from '@/components/shared/ProductCard';
import MarketplaceFilterOverlay, { FilterState } from '@/components/shared/MarketplaceFilterOverlay';
import ActiveOrderBanner from '@/components/shared/ActiveOrderBanner';
import FloatingActiveTask from '@/components/runner/FloatingActiveTask';

// ── TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[15px] font-bold text-slate-900 tracking-tight ${className}`}>{children}</h2>
);

const Subtext = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[11px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>{children}</p>
);

// ── CATEGORY CONFIG ──
// 'all' is handled separately as a dedicated button (active when activeCategory === null)
const CATEGORIES = [
  { id: 'store',    label: 'Official', filter: 'Official', icon: ShieldCheck },
  { id: 'tech',     label: 'Tech',     filter: 'Tech',     icon: Laptop      },
  { id: 'books',    label: 'Academic', filter: 'Books',    icon: BookOpen    },
  { id: 'apparel',  label: 'Apparel',  filter: 'Merch',    icon: Shirt       },
  { id: 'services', label: 'Services', filter: 'Services', icon: HeartPulse  },
];

function MarketplacePage() {
  const [items,          setItems]          = useState<any[]>([]);
  const [campaigns,      setCampaigns]      = useState<any[]>([]);
  const [profile,        setProfile]        = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isFilterOpen,   setIsFilterOpen]   = useState(false);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [isSearchOpen,   setIsSearchOpen]   = useState(false);
  const [filters,        setFilters]        = useState<FilterState>({
    sortBy: 'newest',
    priceRange: [0, 1000],
    officialOnly: false,
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter');

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubAuth = auth.onAuthStateChanged((user) => {
      unsubs.forEach(u => u());
      unsubs = [];

      if (user) {
        const uProfile = onSnapshot(
          doc(db, 'users', user.uid),
          s => setProfile(s.data()),
          e => console.error('[Market] Profile:', e)
        );
        unsubs.push(uProfile);

        const q = query(collection(db, 'items'), where('status', '==', 'active'));
        const uItems = onSnapshot(
          q,
          s => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))),
          e => console.error('[Market] Items:', e)
        );
        unsubs.push(uItems);

        const qCamp = query(collection(db, 'campaigns'), where('status', '==', 'active'), limit(5));
        const uCamp = onSnapshot(
          qCamp,
          s => setCampaigns(s.docs.map(d => ({ id: d.id, ...d.data() }))),
          e => console.error('[Market] Campaigns:', e)
        );
        unsubs.push(uCamp);
      } else {
        setProfile(null);
        setItems([]);
        setCampaigns([]);
      }
    });

    return () => { unsubAuth(); unsubs.forEach(u => u()); };
  }, []);

  const filteredItems = useMemo(() => {
    let result = [...items];

    // Category
    if (activeCategory) {
      result = result.filter(i => i.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    // Student Market Filter
    if (urlFilter === 'student_market') {
      result = result.filter(i => {
        if (!i.category || !i.subcategory) return false;
        const catConfig = MARKETPLACE_CATEGORIES[i.category as CategoryID];
        if (!catConfig) return false;
        const subConfig = catConfig.subcategories.find(s => s.label === i.subcategory);
        return subConfig?.studentMarket === true;
      });
    }

    // Price
    result = result.filter(i => Number(i.price) <= filters.priceRange[1]);

    // Official only
    if (filters.officialOnly) {
      result = result.filter(i => i.is_official === true);
    }

    // Sort
    result.sort((a, b) => {
      if (filters.sortBy === 'price_asc')  return Number(a.price) - Number(b.price);
      if (filters.sortBy === 'price_desc') return Number(b.price) - Number(a.price);
      const ta = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at || 0).getTime();
      const tb = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at || 0).getTime();
      return (tb || 0) - (ta || 0);
    });

    // Search — real-time text filter by title or description
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, activeCategory, filters, searchQuery]);

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/home')}
              className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 active:scale-95 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <p className="text-[14px] font-bold tracking-tight">Marketplace</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Search toggle — opens real inline search bar */}
            <button
              onClick={() => { setIsSearchOpen(o => !o); if (isSearchOpen) setSearchQuery(''); }}
              className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all"
            >
              <Search size={18} />
            </button>
            <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
          </div>
        </div>

        {/* Inline search bar — slides down */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden px-6 pb-4"
            >
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search items, sellers..."
                  className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-medium text-slate-900 placeholder:text-slate-300 outline-none focus:border-slate-300 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-300 hover:text-slate-500"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="pt-28 px-4 space-y-12">

        {/* ── ACTIVE ORDER BANNER ── */}
        <ActiveOrderBanner />
        <FloatingActiveTask />

        {/* ── OFFICIAL STORE BANNERS ── */}
        <AnimatePresence>
          {campaigns.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="px-1 flex justify-between items-center">
                <div>
                  <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">Official Store</h3>
                  <p className="text-[10px] font-medium text-[#94a3b8]">Verified campus items</p>
                </div>
                <Store size={18} className="text-slate-200" />
              </div>

              <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-8 px-8 pb-4 pt-2 snap-x snap-mandatory">
                {campaigns.map(camp => (
                  <motion.div
                    key={camp.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/marketplace/${camp.id}`)}
                    className="shrink-0 w-[320px] h-[180px] snap-center rounded-2xl overflow-hidden relative cursor-pointer group shadow-md border border-slate-100 bg-[#111111]"
                  >
                    {camp.image_url && (
                      <img src={camp.image_url} alt={camp.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/80" />
                    {camp.urgency && (
                      <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                        {camp.urgency}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 drop-shadow-sm block mb-1">
                          {camp.tag} • {camp.club_name}
                        </span>
                        <h4 className="text-[20px] font-black text-white leading-tight tracking-tight drop-shadow-md">{camp.title}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-white group-hover:text-emerald-300 transition-colors mt-1">
                        {camp.cta || 'Explore Official Collection'} <ArrowUpRight size={14} strokeWidth={2.5} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── DISCOVER ITEMS ── */}
        <section className="space-y-8">
          <div className="px-1 flex justify-between items-end">
            <div className="space-y-1">
              <Heading>Discover Items</Heading>
              <Subtext>
                {searchQuery.trim()
                  ? `${filteredItems.length} results for "${searchQuery}"`
                  : urlFilter === 'student_market'
                  ? `${filteredItems.length} student-essential items across campus`
                  : `${filteredItems.length} active listings across campus`}
              </Subtext>
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="h-8 px-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 active:scale-95 transition-all hover:bg-slate-100/50"
            >
              <Filter size={12} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter</span>
            </button>
          </div>

          {/* ── CATEGORY CHIPS ── */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-8 px-8">
            {/* "All Items" chip — explicitly active when nothing else is selected */}
            <button
              onClick={() => setActiveCategory(null)}
              className={`h-[32px] px-4 rounded-full flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap border-[0.5px] ${
                activeCategory === null
                  ? 'bg-[#F8FAFC] border-slate-200 text-slate-900 shadow-sm'
                  : 'bg-transparent border-transparent text-[#64748b] hover:bg-slate-50/50'
              }`}
            >
              <LayoutGrid size={14} strokeWidth={activeCategory === null ? 2.5 : 1.5} />
              <span className="text-[12px] font-bold tracking-[-0.2px]">All Items</span>
            </button>

            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.filter;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(prev => prev === cat.filter ? null : cat.filter)}
                  className={`h-[32px] px-4 rounded-full flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap border-[0.5px] ${
                    isActive
                      ? 'bg-[#F8FAFC] border-slate-200 text-slate-900 shadow-sm'
                      : 'bg-transparent border-transparent text-[#64748b] hover:bg-slate-50/50'
                  }`}
                >
                  <cat.icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[12px] font-bold tracking-[-0.2px]">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── ITEM GRID ── */}
          {items.length > 0 ? (
            filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-8">
                {filteredItems.map(item => (
                  <ProductCard key={item.id} item={item} onClick={() => router.push(`/marketplace/${item.id}`)} />
                ))}
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-[#94a3b8] gap-4 border-2 border-dashed border-slate-100 rounded-[16px]">
                <Search size={40} strokeWidth={1} className="text-slate-300" />
                <div className="text-center space-y-1">
                  <p className="text-[12px] font-bold text-slate-900 tracking-tight">No results found</p>
                  <p className="text-[11px] font-medium text-slate-400">Try a different keyword or clear the filter</p>
                </div>
              </div>
            )
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-[#94a3b8] gap-4 border-2 border-dashed border-slate-100 rounded-[16px]">
              <Box size={48} strokeWidth={1} className="text-slate-300" />
              <p className="text-[11px] font-bold uppercase tracking-widest">No listings found</p>
            </div>
          )}
        </section>

      </div>

      <MarketplaceFilterOverlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
      />

    </main>
  );
}

export default function MarketplacePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <MarketplacePage />
    </Suspense>
  );
}
