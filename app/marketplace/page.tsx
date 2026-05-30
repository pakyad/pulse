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
  <h2 className={`text-[15px] font-bold text-[#000000] tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[11px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
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
    let unsubs: (() => void)[] = [];

    const unsubAuth = auth.onAuthStateChanged((user) => {
      // Clear existing listeners on auth change
      unsubs.forEach(u => u());
      unsubs = [];

      if (user) {
        // 👤 Profile Sync
        const uProfile = onSnapshot(doc(db, 'users', user.uid), 
          s => setProfile(s.data()),
          e => console.error("[Market] Profile Sync Error:", e)
        );
        unsubs.push(uProfile);

        // 🛍️ Discover Items
        const q = query(collection(db, 'items'), where('status', '==', 'active'));
        const uItems = onSnapshot(q, 
          s => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))),
          e => console.error("[Market] Items Sync Error:", e)
        );
        unsubs.push(uItems);

        // 🏗️ Official Campaigns
        const qCamp = query(collection(db, 'campaigns'), where('status', '==', 'active'), limit(5));
        const uCamp = onSnapshot(qCamp, 
          s => setCampaigns(s.docs.map(d => ({ id: d.id, ...d.data() }))),
          e => console.error("[Market] Campaigns Sync Error:", e)
        );
        unsubs.push(uCamp);
      } else {
        setProfile(null);
        setItems([]);
        setCampaigns([]);
      }
    });

    return () => { 
      unsubAuth(); 
      unsubs.forEach(u => u()); 
    };
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
    <main className="min-h-screen bg-white text-[#000000] antialiased pb-40">
      
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
         <div className="flex items-center gap-3">
            <button onClick={() => router.push('/home')} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all">
               <ChevronLeft size={18} />
            </button>
            <p className="text-[14px] font-bold tracking-tight">Marketplace</p>
         </div>
         <div className="flex items-center gap-4">
            <button
               onClick={() => setIsFilterOpen(true)}
               className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all"
            >
               <Search size={18} />
            </button>
            <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
         </div>
      </nav>

      <div className="pt-28 px-4 space-y-12">

         {/* ── OFFICIAL STORE BANNER ── */}
         <AnimatePresence>
            {campaigns.length > 0 && (
               <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="px-1 flex justify-between items-center">
                     <div>
                        <h3 className="text-[14px] font-bold text-[#000000] tracking-tight">Official Store</h3>
                        <p className="text-[10px] font-medium text-[#94a3b8]">Verified campus items</p>
                     </div>
                     <Store size={18} className="text-slate-200" />
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-8 px-8 pb-4 pt-2 snap-x snap-mandatory">
                     {campaigns.map(camp => (
                        <motion.div
                          key={camp.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => router.push(`/marketplace/${camp.id}`)}
                          className="shrink-0 w-[320px] h-[180px] snap-center rounded-[24px] overflow-hidden relative cursor-pointer group shadow-md border border-slate-100 bg-[#111111]"
                        >
                           {/* Background Image & Gradient Overlays */}
                           {camp.image_url && (
                             <img src={camp.image_url} alt={camp.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                           )}
                           <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/80" />
                           
                           {/* Top Pill (Urgency) */}
                           {camp.urgency && (
                              <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                                 {camp.urgency}
                              </div>
                           )}

                           {/* Bottom Content */}
                           <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-2">
                              <div>
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 drop-shadow-sm block mb-1">
                                    {camp.tag} • {camp.club_name}
                                 </span>
                                 <h4 className="text-[20px] font-black text-white leading-tight tracking-tight drop-shadow-md">
                                    {camp.title}
                                 </h4>
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
                          ? 'bg-[#F8FAFC] border-slate-200 text-[#000000] shadow-sm' 
                          : 'bg-transparent border-transparent text-[#64748b] hover:bg-slate-50/50'
                      }`}
                    >
                       <cat.icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                       <span className="text-[12px] font-bold tracking-[-0.2px]">{cat.label}</span>
                    </button>
                  );
               })}
            </div>

            {items.length > 0 ? (
               <div className="grid grid-cols-2 gap-x-3 gap-y-8">
                  {filteredItems.map(item => (
                     <ProductCard key={item.id} item={item} onClick={() => router.push(`/marketplace/${item.id}`)} />
                  ))}
               </div>
            ) : (
               <div className="py-24 flex flex-col items-center justify-center text-[#94a3b8] gap-4 border-2 border-dashed border-slate-100 rounded-[16px]">
                  <Box size={48} strokeWidth={1} className="opacity-20" />
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

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </main>
  );
}
