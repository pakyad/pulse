'use client'

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, limit } from 'firebase/firestore';
import { 
  Laptop, BookOpen, Shirt, Box, ChevronLeft, 
  Search, LayoutGrid, ShieldCheck, HeartPulse, 
  ArrowUpRight, Sparkles, Filter, Store, Blocks
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import ProductCard from '@/components/shared/ProductCard';
import MarketplaceFilterOverlay, { FilterState } from '@/components/shared/MarketplaceFilterOverlay';

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[21px] font-bold text-[#1e293b] tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[13px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

const CATEGORIES = [
  { id: 'all', label: 'All Items', filter: null, icon: LayoutGrid }, 
  { id: 'store', label: 'Official', filter: 'Official', icon: ShieldCheck }, 
  { id: 'tech', label: 'Tech', filter: 'Tech', icon: Laptop }, 
  { id: 'books', label: 'Academic', filter: 'Books', icon: BookOpen }, 
  { id: 'apparel', label: 'Apparel', filter: 'Merch', icon: Shirt }, 
  { id: 'services', label: 'Services', filter: 'Services', icon: HeartPulse }, 
];

export default function MarketplacePage() {
  const [items, setItems] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'newest',
    priceRange: [0, 1000],
    officialOnly: false
  });
  const router = useRouter();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
    });
    
    const q = query(collection(db, 'items'), where('status', '==', 'active'));
    const unsubItems = onSnapshot(q, s => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    const qCamp = query(collection(db, 'campaigns'), where('status', '==', 'active'), limit(5));
    const unsubCamp = onSnapshot(qCamp, s => setCampaigns(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubAuth(); unsubItems(); unsubCamp(); };
  }, []);

  const filteredItems = useMemo(() => {
    let result = [...items];

    // ── CATEGORY FILTER ──
    if (activeCategory) {
      result = result.filter(i => i.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    // ── PRICE FILTER ──
    result = result.filter(i => Number(i.price) <= filters.priceRange[1]);

    // ── OFFICIAL ONLY FILTER ──
    if (filters.officialOnly) {
      result = result.filter(i => i.is_official === true);
    }

    // ── SORT LOGIC ──
    result.sort((a, b) => {
      if (filters.sortBy === 'price_asc') return Number(a.price) - Number(b.price);
      if (filters.sortBy === 'price_desc') return Number(b.price) - Number(a.price);
      
      const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at).getTime();
      const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at).getTime();
      return (timeB || 0) - (timeA || 0);
    });

    return result;
  }, [items, activeCategory, filters]);

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-40">
      
      {/* ── GLOBAL NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
         <div className="flex items-center gap-3">
            <button onClick={() => router.push('/home')} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all">
               <ChevronLeft size={18} />
            </button>
            <p className="text-[14px] font-bold tracking-tight">Marketplace</p>
         </div>
         <div className="flex items-center gap-4">
            <button className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all">
               <Search size={18} />
            </button>
            <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
         </div>
      </nav>

      <div className="pt-28 px-6 space-y-12">

         {/* ── OFFICIAL STORE BANNER ── */}
         <AnimatePresence>
            {campaigns.length > 0 && (
               <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="px-1 flex justify-between items-center">
                     <div>
                        <h3 className="text-[18px] font-bold text-[#1e293b] tracking-tight">Official Store</h3>
                        <p className="text-[12px] font-medium text-[#94a3b8]">Verified university drops</p>
                     </div>
                     <Store size={18} className="text-slate-200" />
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-8 px-8 pb-1">
                     {campaigns.map(camp => (
                        <motion.div
                          key={camp.id}
                          whileTap={{ scale: 0.98 }}
                          className={`shrink-0 w-[240px] h-[130px] p-6 rounded-xl ${camp.color || 'bg-[#1e293b]'} text-white flex flex-col justify-between shadow-lg shadow-slate-900/5 cursor-pointer group relative overflow-hidden`}
                        >
                           <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                           <div className="space-y-0.5 relative z-10">
                              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">{camp.club_name}</p>
                              <h4 className="text-[16px] font-bold tracking-tight leading-tight pr-2">{camp.title}</h4>
                           </div>
                           <div className="flex justify-between items-center pt-3 border-t border-white/10 relative z-10">
                              <span className="text-[8px] font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">{camp.tag}</span>
                              <ArrowUpRight size={16} className="text-white/60 group-hover:text-white transition-colors" />
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
                  <Subtext>{filteredItems.length} active listings verified across campus</Subtext>
               </div>
               <button 
                  onClick={() => setIsFilterOpen(true)}
                  className="h-8 px-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 active:scale-95 transition-all hover:bg-slate-100/50"
               >
                  <Filter size={12} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter</span>
               </button>
            </div>

            {/* ── MINIMALIST METADATA PILLS (FILTERS) ── */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 -mx-8 px-8">
               {CATEGORIES.map(cat => {
                  const isActive = activeCategory === cat.filter;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(prev => prev === cat.filter ? null : cat.filter)}
                      className={`h-[32px] px-4 rounded-full flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap border-[0.5px] ${
                        isActive 
                          ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-sm' 
                          : 'bg-slate-50/50 border-slate-900/10 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                       <cat.icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                       <span className="text-[12px] font-bold tracking-[-0.2px]">{cat.label}</span>
                    </button>
                  );
               })}
            </div>

            {items.length > 0 ? (
               <div className="grid grid-cols-2 gap-x-5 gap-y-12">
                  {filteredItems.map(item => (
                     <ProductCard key={item.id} item={item} onClick={() => router.push(`/marketplace/${item.id}`)} />
                  ))}
               </div>
            ) : (
               <div className="py-24 flex flex-col items-center justify-center text-[#94a3b8] gap-4 border-2 border-dashed border-slate-100 rounded-[16px]">
                  <Box size={48} strokeWidth={1} className="opacity-20" />
                  <p className="text-[13px] font-bold uppercase tracking-widest">No listings found in this sector</p>
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

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </main>
  );
}
