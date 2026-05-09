'use client'

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { 
  ShoppingBag, Laptop, BookOpen, Shirt, Box, Sparkles, Zap, 
  ChevronLeft, Search, Plus, ArrowUpRight, LayoutGrid, 
  ShieldCheck, HeartPulse, Building2, Truck
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchOverlay from '@/components/shared/SearchOverlay';
import CreateListing from '@/components/CreateListing';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import ProductCard from '@/components/shared/ProductCard';

// ── Institutional Category Definitions ──
const CATEGORIES = [
  { id: 'all', label: 'All', filter: null, icon: LayoutGrid, bg: 'bg-slate-50', color: 'text-slate-400', active: 'bg-slate-900 text-white border-slate-900' }, 
  { id: 'store', label: 'Official', filter: 'Official', icon: ShieldCheck, bg: 'bg-blue-50', color: 'text-blue-600', active: 'bg-blue-600 text-white border-blue-600' }, 
  { id: 'tech', label: 'Tech', filter: 'Tech', icon: Laptop, bg: 'bg-slate-50', color: 'text-slate-600', active: 'bg-slate-900 text-white border-slate-900' }, 
  { id: 'books', label: 'Books', filter: 'Books', icon: BookOpen, bg: 'bg-indigo-50', color: 'text-indigo-600', active: 'bg-indigo-600 text-white border-indigo-600' }, 
  { id: 'apparel', label: 'Apparel', filter: 'Merch', icon: Shirt, bg: 'bg-rose-50', color: 'text-rose-600', active: 'bg-rose-600 text-white border-rose-600' }, 
  { id: 'misc', label: 'Misc', filter: 'Misc', icon: Box, bg: 'bg-amber-50', color: 'text-amber-600', active: 'bg-amber-600 text-white border-amber-600' }, 
  { id: 'services', label: 'Services', filter: 'Services', icon: HeartPulse, bg: 'bg-emerald-50', color: 'text-emerald-600', active: 'bg-emerald-600 text-white border-emerald-600' }, 
];

const OFFICIAL_CAMPAIGNS = [
  { id: 'camp1', club_name: 'Badminton Club', initials: 'BC', tag: 'Merch Drop', title: '2026 Varsity Jerseys Pre-Order', color: 'bg-[#1B3C35]', accent: 'text-emerald-200', theme: 'Badminton' },
  { id: 'camp2', club_name: 'Basketball Club', initials: 'BB', tag: 'Selections', title: 'Open Tryouts for Campus Team', color: 'bg-slate-900', accent: 'text-slate-400', theme: 'Basketball' },
  { id: 'camp3', club_name: 'MIDI Council', initials: 'MD', tag: 'Tickets', title: 'Final Year Dinner Registration', color: 'bg-slate-900', accent: 'text-emerald-200', theme: 'Digital' }
];

const DISCOVERY_FALLBACK = [
  { id: 'd2', title: 'Casio Scientific Calculator', price: 45, image_url: 'https://images.unsplash.com/photo-1574607383476-f517f220d356?q=80&w=400', seller_name: 'Iyad Mohmad', time_ago: '3h ago', is_official: false, category: 'Tech' },
  { id: 'd1', title: 'UniKL Premium Lanyard', price: 15, image_url: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?q=80&w=400', seller_name: 'MIIT Society', time_ago: '1h ago', is_official: true, category: 'Official' },
  { id: 'd18', title: 'MIIT Exclusive Windbreaker', price: 120, image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=400', seller_name: 'MIDI Council', time_ago: '5h ago', is_official: true, category: 'Merch' },
  { id: 'd3', title: 'Engineering Drafting Set', price: 120, image_url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=400', seller_name: 'Aiman Hafiz', time_ago: '5h ago', is_official: false, category: 'Misc' },
  { id: 'd4', title: 'Pulse Campus Hoodie', price: 85, image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400', seller_name: 'Student Council', time_ago: '1d ago', is_official: true, category: 'Merch' },
  { id: 'd11', title: 'Noise Cancelling Headphones', price: 350, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400', seller_name: 'Arif Luqman', time_ago: '1d ago', is_official: false, category: 'Tech' },
  { id: 'd17', title: 'Organic Chemistry Model Kit', price: 65, image_url: 'https://images.unsplash.com/photo-1532187863486-abf51ad95999?q=80&w=400', seller_name: 'Science Dept', time_ago: '2h ago', is_official: true, category: 'Official' },
  { id: 'd7', title: 'Hydro Flask 32oz (White)', price: 110, image_url: 'https://images.unsplash.com/photo-1602143303410-7199d13f8ed3?q=80&w=400', seller_name: 'Farah Aqilah', time_ago: '4h ago', is_official: false, category: 'Misc' },
  { id: 'd6', title: 'Python Programming Book', price: 38, image_url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=400', seller_name: 'Sarah Lee', time_ago: '2d ago', is_official: false, category: 'Books' },
  { id: 'd8', title: 'iPad Pro 11-inch (M1)', price: 2800, image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400', seller_name: 'Khairul Nizam', time_ago: '6h ago', is_official: false, category: 'Tech' },
  { id: 'd16', title: 'Professional Resume Design', price: 25, image_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=400', seller_name: 'Design Club', time_ago: '1d ago', is_official: false, category: 'Services' },
  { id: 'd5', title: 'Mechanical Keyboard', price: 210, image_url: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=400', seller_name: 'Zulhelmi', time_ago: '1d ago', is_official: false, category: 'Tech' },
  { id: 'd20', title: 'Campus Photography Service', price: 50, image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=400', seller_name: 'Media Club', time_ago: '1d ago', is_official: false, category: 'Services' },
  { id: 'd9', title: 'Calculus IV Solution Manual', price: 20, image_url: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?q=80&w=400', seller_name: 'Danish Fitri', time_ago: '8h ago', is_official: false, category: 'Books' },
  { id: 'd10', title: 'Denim Jacket (Unisex)', price: 55, image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=400', seller_name: 'Haziqah', time_ago: '12h ago', is_official: false, category: 'Merch' },
  { id: 'd19', title: 'UI/UX Mobile Design Course', price: 0, image_url: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?q=80&w=400', seller_name: 'Google DSC', time_ago: '1d ago', is_official: false, category: 'Services' },
  { id: 'd12', title: 'Dorm Desk Lamp (LED)', price: 35, image_url: 'https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=400', seller_name: 'Amirul', time_ago: '1d ago', is_official: false, category: 'Misc' },
  { id: 'd13', title: 'Java Software Engineering Kit', price: 150, image_url: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=400', seller_name: 'Zulhelmi', time_ago: '2d ago', is_official: false, category: 'Tech' },
  { id: 'd14', title: 'Vintage Polo Tee', price: 30, image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400', seller_name: 'Syazwan', time_ago: '2d ago', is_official: false, category: 'Merch' },
  { id: 'd15', title: 'Data Structures & Algorithms', price: 50, image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=400', seller_name: 'Nurul Izzah', time_ago: '3d ago', is_official: false, category: 'Books' },
  { id: 'd21', title: 'Discrete Mathematics Textbook', price: 40, image_url: 'https://images.unsplash.com/photo-1543004629-142a2ec95393?q=80&w=400', seller_name: 'Ali Imran', time_ago: '2d ago', is_official: false, category: 'Books' },
  { id: 'd_pro_kit', title: 'Official UniKL Football Match-Day Kit (PRO)', price: 120, image_url: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=600', seller_name: 'Kelab Bola UniKL', time_ago: 'Just now', is_official: true, category: 'Official' },
  { id: 'd_scarf_fix', title: 'UniKL Football Club Scarf', price: 25, image_url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=600', seller_name: 'Kelab Bola UniKL', time_ago: 'Live', is_official: true, category: 'Official' },
  { id: 'd_jersey_2026', title: 'Official UniKL Football Jersey 2026', price: 95, image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600', seller_name: 'Kelab Bola UniKL', time_ago: 'Verified', is_official: true, category: 'Official' },
];

export default function MarketplacePage() {
  const [items, setItems] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showSellLabel, setShowSellLabel] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setShowSellLabel(window.scrollY < 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubProfile) unsubProfile();
      if (!user) return;
      unsubProfile = onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
    });

    const q = query(collection(db, 'items'), where('status', '==', 'active'));
    const unsubItems = onSnapshot(q, s => { 
      const docs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => {
        const tA = a.created_at?.toMillis ? a.created_at.toMillis() : 0;
        const tB = b.created_at?.toMillis ? b.created_at.toMillis() : 0;
        return tB - tA;
      });
      setItems(docs); 
      setLoading(false); 
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      unsubItems();
    };
  }, []);

  const discoveryItems = useMemo(() => {
    const combinedList = [...items];
    DISCOVERY_FALLBACK.forEach(fb => {
      if (!items.find(i => i.id === fb.id)) {
        combinedList.push(fb);
      }
    });

    if (!activeCategory) return combinedList;
    
    return combinedList.filter(i => {
      const catMatch = i.category?.toLowerCase() === activeCategory.toLowerCase();
      if (activeCategory.toLowerCase() === 'official') {
        return catMatch || i.is_official === true;
      }
      return catMatch;
    });
  }, [items, activeCategory]);

  const unfilteredItems = useMemo(() => {
    const combinedList = [...items];
    DISCOVERY_FALLBACK.forEach(fb => {
      if (!items.find(i => i.id === fb.id)) {
        combinedList.push(fb);
      }
    });
    return combinedList;
  }, [items]);

  return (
    <main className="min-h-screen bg-white pb-40 font-sans antialiased text-slate-900">
      
      {/* ── INSTITUTIONAL NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-100 px-5 pt-5 pb-5 flex items-center gap-4 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-all active:scale-90">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </button>
        <div className="flex-1">
          <button onClick={() => setIsSearchOpen(true)} className="w-full h-11 bg-slate-50/50 border border-slate-100 rounded-2xl flex items-center px-4 gap-3 transition-all hover:bg-slate-50 active:scale-[0.98]">
            <Search size={16} className="text-slate-400" />
            <span className="text-[13px] font-medium text-slate-400/60">Search marketplace...</span>
          </button>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <AvatarDropdown 
            photoUrl={profile?.photo_url} 
            userName={profile?.full_name || 'P'} 
          />
        </div>
      </nav>

      <div className="pt-32 space-y-10">

        {/* ── 1. CAMPUS UPDATES (Institutional Style) ── */}
        <section>
          <div className="px-6 mb-6 space-y-1">
             <div className="flex items-baseline justify-between">
                <h3 className="text-[26px] font-bold text-slate-900 tracking-[-0.03em]">Official Store</h3>
                <button className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Archive</button>
             </div>
             <p className="text-[12px] font-medium text-slate-400 leading-relaxed tracking-tight">Get university gear and verified club items.</p>
          </div>
          <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar pb-4">
            {OFFICIAL_CAMPAIGNS.map((camp) => (
              <motion.div
                key={camp.id}
                whileTap={{ scale: 0.98 }}
                className={`shrink-0 w-[240px] p-5 rounded-[12px] ${camp.color} text-white flex flex-col justify-between min-h-[160px] group cursor-pointer transition-all overflow-hidden relative shadow-sm shadow-slate-200/20 border border-white/5`}
              >
                <div className="absolute -top-8 -right-8 opacity-5 group-hover:opacity-10 transition-all duration-700">
                  <span className="text-[120px] font-bold leading-none tracking-tighter select-none">{camp.initials}</span>
                </div>
                
                <div className="relative z-10 flex flex-col gap-0.5">
                   <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/50">{camp.club_name}</span>
                   <h4 className="text-[18px] font-semibold leading-tight tracking-tight pr-4">{camp.title}</h4>
                </div>

                <div className="relative z-10 flex items-center justify-between mt-auto pt-5 border-t border-white/5">
                   <span className="text-[9px] font-bold uppercase tracking-[0.15em] bg-white/10 px-2.5 py-1 rounded-lg">{camp.tag}</span>
                   <ArrowUpRight size={18} strokeWidth={2.5} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 2. CATEGORY PICKER (Institutional Squircles) ── */}
        <section>
          <div className="px-6 mb-4 space-y-0.5">
             <div className="flex items-baseline justify-between">
                <h3 className="text-[26px] font-bold text-slate-900 tracking-[-0.03em]">Marketplace</h3>
                <button className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Filter</button>
             </div>
             <p className="text-[11px] font-medium text-slate-400 leading-relaxed tracking-tight">Explore items listed by students across campus.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 pb-2">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveCategory(prev => prev === cat.filter ? null : cat.filter)}
                className={`flex items-center gap-2 px-4 h-[38px] rounded-full border transition-all shrink-0 ${
                  activeCategory === cat.filter 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <cat.icon size={14} strokeWidth={2.2} />
                <span className="text-[12px] font-bold tracking-tight">
                  {cat.label}
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* ── 3. DISCOVERY GRID ── */}
        <section className="px-6 pb-20">
          {discoveryItems.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto border border-slate-100">
                <ShoppingBag size={28} className="text-slate-200" />
              </div>
              <div className="space-y-1">
                <h4 className="text-[18px] font-bold text-slate-900 tracking-tight">No Items Found</h4>
                <p className="text-[14px] font-medium text-slate-400">Check back later or try a different category.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6">
              {discoveryItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onClick={() => router.push(`/marketplace/${item.id}`)}
                />
              ))}
            </div>
          )}
        </section>
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

      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        items={unfilteredItems}
      />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
