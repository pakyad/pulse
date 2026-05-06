'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onSnapshot, doc, collection, query, where, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Bell, ShieldCheck, Settings,
  Package, Heart, ShoppingBag, Store, Plus,
  MapPin, Edit3, Search, TrendingUp, Wallet,
  BarChart3, ArrowUpRight, Upload, HelpCircle, ChevronRight,
  Eye, Users, Trash2, CheckCircle2,
  X, Info, Sparkles, MoreHorizontal, Footprints, User, Star, Leaf
} from 'lucide-react';
import { markItemAsSold, deleteItemListing } from '@/lib/marketplace-utils';
import HologramID from '@/components/shared/HologramID';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import HeartbeatLine from '@/components/shared/HeartbeatLine';
import CreateListing from '@/components/CreateListing';
import RunnerEnrollmentSheet from '@/components/shared/RunnerEnrollmentSheet';
import Link from 'next/link';
import ProductCard from '@/components/shared/ProductCard';

// Apple Settings-style menu groups
const MENU_GROUPS = [
  {
    label: 'Commerce',
    items: [
      { icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Orders', desc: 'Your handshake history', path: '/me/orders' },
      { icon: Store,       color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'My Store', desc: 'Manage your listings', path: '/merchant' },
      { icon: Heart,       color: 'text-rose-500',   bg: 'bg-rose-50',   label: 'Saved Items', desc: 'Marketplace vault', path: '/me/saved' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { icon: BarChart3, color: 'text-cyan-500', bg: 'bg-cyan-50', label: 'Insights', desc: 'Sales & performance', path: '/merchant' },
    ],
  },
];

// ── High-Fidelity Dummy Listings (Institution Seed) ──
const DUMMY_LISTINGS = [
  { id: 'd1', title: 'M2 MacBook Air', price: 3200, status: 'ACTIVE', category: 'Tech', views: 842, interests: 45, image_url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?q=80&w=400' },
  { id: 'd2', title: 'MIIT Official Hoodie', price: 85, status: 'ACTIVE', category: 'Apparel', views: 120, interests: 12, image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400' },
  { id: 'd3', title: 'Software Engineering Principles', price: 45, status: 'ACTIVE', category: 'Books', views: 32, interests: 4, image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=400' },
  { id: 'd4', title: 'Sony WH-1000XM5', price: 950, status: 'ACTIVE', category: 'Tech', views: 215, interests: 28, image_url: 'https://images.unsplash.com/photo-1618335829737-2228ad30662b?q=80&w=400' },
  { id: 'd5', title: 'Logitech G Pro Mouse', price: 150, status: 'SOLD', category: 'Tech', views: 180, interests: 15, image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=400' },
];

export default function MePage() {
  const [isIDOpen, setIsIDOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  const [isManageMode, setIsManageMode] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isAvatarSheetOpen, setIsAvatarSheetOpen] = useState(false);
  const inventoryRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubTrans: (() => void) | null = null;
    let unsubItems: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((currentUser) => {
      // Cleanup previous listeners
      if (unsubProfile) unsubProfile();
      if (unsubTrans) unsubTrans();
      if (unsubItems) unsubItems();

      setUser(currentUser);
      if (!currentUser) { setLoading(false); return; }

      unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), 
        s => { if (s.exists()) setProfile(s.data()); setLoading(false); },
        err => { console.error("[Pulse Registry] Profile Sync Error:", err); setLoading(false); }
      );

      const nq = query(collection(db, 'transactions'), where('buyer_id', '==', currentUser.uid), where('status', '==', 'PENDING'));
      unsubTrans = onSnapshot(nq, 
        s => setNotificationCount(s.docs.length),
        err => console.error("[Pulse Registry] Transaction Listener Error:", err)
      );

      const lq = query(collection(db, 'items'), where('seller_id', '==', currentUser.uid));
      unsubItems = onSnapshot(lq, 
        s => {
          const live = s.docs.map(d => ({ id: d.id, ...d.data() }));
          const merged = [...live, ...DUMMY_LISTINGS];
          setMyListings(merged);
          setLoading(false);
        },
        err => {
          console.error("[Pulse Registry] Items Listener Error:", err);
          setMyListings(DUMMY_LISTINGS);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubTrans) unsubTrans();
      if (unsubItems) unsubItems();
    };
  }, [router]);

  const isSeller = profile?.is_seller === true || profile?.role === 'CLUB';
  const displayName = profile?.full_name || 'Pulse Member';
  const joinYear = profile?.created_at ? new Date(profile.created_at?.seconds * 1000).getFullYear() : 2024;
  const tenure = new Date().getFullYear() - joinYear || 1;

  const handleMarkAsSold = async (itemId: string) => {
    try {
      await markItemAsSold(itemId);
      // Success feedback could go here
    } catch (error) {
      console.error("Failed to mark as sold:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Purge this listing from the registry? This cannot be undone.")) return;
    try {
      await deleteItemListing(itemId);
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-navy/10 border-t-navy rounded-full animate-spin" />
    </div>
  );

  return (
    <>
    <main className="min-h-screen bg-white pb-24 font-sans antialiased text-navy">
      
      {/* ── OPTICAL NAV (Pulse Standard) ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 pt-8 pb-4 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b border-[#F2F2F7]">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-navy/30 hover:text-navy transition-all active:scale-90">
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="flex-1">
          <button 
            onClick={() => setIsSearchOpen(true)} 
            className="w-full h-10 bg-[#F5F5F7] rounded-full flex items-center px-4 gap-3 transition-all active:scale-[0.98]"
          >
            <Search size={16} className="text-[#8E8E93]" />
            <span className="text-[13px] font-medium text-[#8E8E93]">Search Pulse</span>
          </button>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button onClick={() => router.push('/activity')} className="relative p-1 text-navy/30 hover:text-navy transition-all active:scale-90">
            <Bell size={20} strokeWidth={2.5} />
            {notificationCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5 bg-[#FF3B30] text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-white">
                {notificationCount}
              </div>
            )}
          </button>
          <AvatarDropdown photoUrl={profile?.photo_url} userName={displayName} />
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-12">

        {/* ── IDENTITY ALIGNMENT (Compact Overhaul) ── */}
        <motion.div 
          animate={{ opacity: isCreateOpen ? 0 : 1, y: isCreateOpen ? -20 : 0 }}
          className="flex flex-col"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              {/* Overhauled Avatar with Micro-Refinement */}
              <div className="relative">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsIDOpen(true)}
                  className="w-[56px] h-[56px] rounded-full overflow-hidden border border-[#F2F2F7] bg-slate-50"
                >
                  <img 
                    src={profile?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} 
                    className="w-full h-full object-cover" 
                  />
                </motion.button>
                
                {/* Micro Pencil Action (20px) */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsAvatarSheetOpen(true);
                    if (window.navigator.vibrate) window.navigator.vibrate(5);
                  }}
                  className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full border-[0.5px] border-[#E5E5EA] flex items-center justify-center text-navy/60"
                >
                  <Edit3 size={10} strokeWidth={2.4} />
                </motion.button>
              </div>
              
              <div className="flex flex-col">
                <h1 className="text-[18px] font-semibold text-black tracking-tight leading-tight">
                  {displayName}
                </h1>
                <p className="text-[11px] font-normal text-[#8E8E93] tracking-normal mt-0.5">
                  {profile?.student_id || 'Pulse Resident'}
                </p>

                {/* Slim Edit Profile Button (110x28px) */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/me/edit')}
                  className="mt-3 w-[110px] h-[28px] rounded-full bg-[#F5F5F7] flex items-center justify-center transition-all shadow-none"
                >
                  <span className="text-[12px] font-semibold text-[#1D1D1F]">Edit Profile</span>
                </motion.button>
              </div>
            </div>

            {/* Refined Settings Circle */}
            <motion.button 
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/me/edit')} 
              className="w-8 h-8 rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#1D1D1F] transition-all"
            >
              <Settings size={18} strokeWidth={1.5} />
            </motion.button>
          </div>
        </motion.div>

        {/* ── FLOATING STATS (Zero-Container Architecture) ── */}
        <motion.div 
          animate={{ opacity: isCreateOpen ? 0 : 1 }}
          className="grid grid-cols-4 items-center px-2 !mt-8 divide-x divide-[#E5E5EA]"
        >
          <div className="text-center">
            <p className="text-[20px] font-bold text-black tracking-[-0.02em]">{tenure}</p>
            <p className="text-[8px] font-black text-[#8E8E93] uppercase tracking-[0.15em] mt-1">Tenure</p>
          </div>
          <div className="text-center px-2">
            <p className="text-[20px] font-bold text-black tracking-[-0.02em]">{myListings.length}</p>
            <p className="text-[8px] font-black text-[#8E8E93] uppercase tracking-[0.15em] mt-1">Listings</p>
          </div>
          <div className="text-center px-2">
            <p className="text-[20px] font-bold text-black tracking-[-0.02em] flex items-center justify-center gap-1">
               <Star size={12} className="text-amber-400 fill-amber-400" />
               {profile?.merit || 120}
            </p>
            <p className="text-[8px] font-black text-[#8E8E93] uppercase tracking-[0.15em] mt-1">Merit</p>
          </div>
          <div className="text-center">
            <p className="text-[20px] font-bold text-black tracking-[-0.02em] flex items-center justify-center gap-1">
               <Leaf size={12} className="text-emerald-500 fill-emerald-500" />
               {profile?.carbon || '0.4kg'}
            </p>
            <p className="text-[8px] font-black text-[#8E8E93] uppercase tracking-[0.15em] mt-1">Carbon</p>
          </div>
        </motion.div>

        {/* ── ME SERVICES (Minimal List Architecture) ── */}
        <motion.div 
          animate={{ opacity: isCreateOpen ? 0 : 1, y: isCreateOpen ? 20 : 0 }}
          className="space-y-1"
        >
          <div className="space-y-[0.5px] bg-[#F2F2F7] rounded-[24px] overflow-hidden border-[0.5px] border-[#F2F2F7]">
            {MENU_GROUPS.flatMap(g => g.items).concat(profile?.role === 'ADMIN' ? [{ icon: ShieldCheck, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Admin Portal', desc: 'Platform oversight', path: '/admin/dashboard' }] : []).map((item) => (
              <motion.button
                key={item.label}
                whileTap={{ backgroundColor: '#F9F9FB' }}
                onClick={() => {
                  if (item.label === 'My Store') {
                    inventoryRef.current?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    router.push(item.path);
                  }
                }}
                className="w-full bg-white flex items-center justify-between p-5 text-left transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <item.icon size={22} strokeWidth={2} className="text-slate-300 group-hover:text-navy transition-colors" />
                  <div className="flex flex-col">
                    <span className="text-[15px] font-bold text-navy tracking-tight">{item.label}</span>
                    <span className="text-[11px] text-slate-400 font-medium">{item.desc}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#F2F2F7]" strokeWidth={3} />
              </motion.button>
            ))}
          </div>

          {/* Special Carrier Entry */}
          <motion.button
            whileTap={{ backgroundColor: '#F9F9FB' }}
            onClick={() => setIsEnrollmentOpen(true)}
            className="w-full flex items-center justify-between p-5 mt-4 bg-white rounded-[24px] border-[0.5px] border-[#F2F2F7] shadow-[0_8px_30px_rgba(0,0,0,0.02)] group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                <Footprints size={22} strokeWidth={2} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[15px] font-bold text-navy tracking-tight">Become a Pulse Runner</span>
                <span className="text-[11px] text-slate-400 font-medium">Verify & start earning credits</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="px-3 py-1 bg-teal-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                  Join
               </div>
            </div>
          </motion.button>
        </motion.div>

        {/* ── MERCHANT INVENTORY SECTION (High-Density Minimalism) ── */}
        <div ref={inventoryRef} className="px-6 space-y-6">
          
          {/* ── THE HIGH-FIDELITY STATUS CARD (Spatial Layering) ── */}
          <div className="bg-white border border-[#F2F2F7] rounded-[20px] px-6 py-5 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
            <div className="flex items-center flex-1">
              {/* Zone 1: Global Reach */}
              <div className="flex-1">
                <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-[0.1em] mb-1.5">Global Reach</p>
                <h3 className="text-[22px] font-semibold text-[#1D1D1F] leading-none tracking-tight">
                  {myListings.reduce((acc, l) => acc + (l.views || 0), 0).toLocaleString()}
                </h3>
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-[#E5E5EA] mx-6" />

              {/* Zone 2: Potential Leads */}
              <div className="flex-1">
                <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-[0.1em] mb-1.5">Potential Leads</p>
                <h3 className="text-[22px] font-semibold text-[#1D1D1F] leading-none tracking-tight">
                  {myListings.reduce((acc, l) => acc + (l.interests || 0), 0).toLocaleString()}
                </h3>
              </div>
            </div>
            
            {/* Zone 3: The Action Circle */}
            <button 
              onClick={() => setIsInsightsOpen(true)}
              className="w-8 h-8 bg-[#F2F2F7] rounded-full flex items-center justify-center transition-all active:scale-90 hover:bg-[#E5E5EA]"
            >
              <ArrowUpRight size={14} strokeWidth={2.5} className="text-[#1D1D1F]" />
            </button>
          </div>

          <div className="mt-6 space-y-6">
            {/* ── THE SEGMENTED SLIDING CONTROL (Precision Scaling) ── */}
            <div className="flex items-center justify-between px-1">
              <div className="flex bg-slate-50 p-0.5 rounded-[14px] w-40">
                <button 
                  onClick={() => setActiveTab('active')}
                  className={`flex-1 py-1.5 rounded-[11px] text-[11px] font-bold transition-all ${activeTab === 'active' ? 'bg-white text-navy shadow-sm' : 'text-slate-400'}`}
                >
                  Active
                </button>
                <button 
                  onClick={() => setActiveTab('sold')}
                  className={`flex-1 py-1.5 rounded-[11px] text-[11px] font-bold transition-all ${activeTab === 'sold' ? 'bg-white text-navy shadow-sm' : 'text-slate-400'}`}
                >
                  Sold
                </button>
              </div>
              
              {!isManageMode && (
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-[0.1em]">
                  {myListings.filter(l => activeTab === 'active' ? l.status !== 'SOLD' : l.status === 'SOLD').length} Registry
                </span>
              )}
            </div>

            {/* ── THE INVENTORY GRID (Editorial Vertical Rhythm) ── */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-x-3 gap-y-6 pb-32"
              >
                {/* Index 0: The Minimal Lead */}
                {activeTab === 'active' && (
                  <div className="flex flex-col gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsCreateOpen(true)}
                      className="aspect-square rounded-[8px] bg-white flex items-center justify-center group relative border border-[#F2F2F7] shadow-[0_8px_24px_rgba(0,0,0,0.02)]"
                    >
                      <Plus size={20} strokeWidth={1.5} className="text-slate-200 group-hover:text-navy transition-colors" />
                    </motion.button>
                    <div className="px-0.5 mt-2">
                       <p className="text-[13px] font-bold text-navy tracking-[-0.02em]">Add Listing</p>
                    </div>
                  </div>
                )}

                {myListings
                  .filter(item => activeTab === 'active' ? item.status !== 'SOLD' : item.status === 'SOLD')
                  .map((item) => (
                    <ProductCard
                      key={item.id}
                      item={{
                        ...item,
                        seller_name: displayName // Use current user's name
                      }}
                      onClick={() => !isManageMode && router.push(`/marketplace/${item.id}`)}
                    />
                  ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── HELP CENTER ── */}
        <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-navy"><HelpCircle size={18} /></div>
            <div>
              <h3 className="text-[14px] font-bold text-navy">Help Center</h3>
              <p className="text-[11px] text-slate-400 font-medium">Support & institutional guides</p>
            </div>
          </div>
          <button className="w-full bg-white border border-[#EAEAEA] h-12 rounded-2xl text-[12px] font-bold text-navy active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-slate-50">
            Get Assistance <ChevronRight size={14} className="text-slate-200" />
          </button>
        </div>

      </div>
    </main>

    <AnimatePresence>
      {isIDOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsIDOpen(false)} className="absolute inset-0 bg-navy/90 backdrop-blur-md" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative z-10 w-full max-w-sm">
            <HologramID name={profile?.full_name || 'Pulse Member'} role={isSeller ? 'Verified Seller' : 'Student'} matricNo={profile?.matric_no || '—'} qrValue={user?.uid || 'anonymous'} />
            <button onClick={() => setIsIDOpen(false)} className="mt-8 w-full h-14 bg-white/10 border border-white/20 rounded-2xl text-white/60 font-bold uppercase tracking-widest text-[11px]">Close</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

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

    {/* ── DEEP INSIGHTS DRAWER ── */}
    <AnimatePresence>
      {isInsightsOpen && (
        <div className="fixed inset-0 z-[400] flex items-end justify-center">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setIsInsightsOpen(false)} 
            className="absolute inset-0 bg-navy/20 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative z-10 w-full max-w-lg bg-white rounded-t-2xl p-10 border-x border-t border-[#EAEAEA] overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[20px] font-black tracking-tighter text-navy flex items-center gap-3">
                <BarChart3 className="text-accent" size={20} /> Market Performance
              </h2>
              <button onClick={() => setIsInsightsOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-navy/40 active:scale-90 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white border border-[#EAEAEA] rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conversion Rate</p>
                  <h3 className="text-[24px] font-black text-navy">12.4%</h3>
                  <div className="mt-2 flex items-center gap-1 text-emerald-500 font-bold text-[10px]">
                    <TrendingUp size={10} /> +2.1%
                  </div>
                </div>
                <div className="p-6 bg-white border border-[#EAEAEA] rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Response</p>
                  <h3 className="text-[24px] font-black text-navy">4m</h3>
                  <div className="mt-2 flex items-center gap-1 text-emerald-500 font-bold text-[10px]">
                    <Sparkles size={10} /> Elite
                  </div>
                </div>
              </div>

              <div className="p-8 bg-navy rounded-2xl text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-[13px] font-bold mb-3 tracking-tight">Bro's Strategy Tip</h4>
                  <p className="text-[12px] text-white/70 leading-relaxed">
                    Boosting price by 5% on Sundays usually yields 15% higher handshake velocity.
                  </p>
                </div>
                <div className="absolute bottom-0 right-0 opacity-10">
                  <Info size={100} strokeWidth={1} />
                </div>
              </div>

              <button 
                onClick={() => setIsInsightsOpen(false)}
                className="w-full h-14 bg-navy text-white rounded-xl font-bold uppercase tracking-widest text-[11px] active:scale-95 transition-all"
              >
                Acknowledge Strategy
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    <AvatarSelectorSheet 
      isOpen={isAvatarSheetOpen} 
      onClose={() => setIsAvatarSheetOpen(false)}
      currentAvatar={profile?.photo_url}
      onSelect={async (url) => {
        if (!user) return;
        await updateDoc(doc(db, 'users', user.uid), { photo_url: url });
        setIsAvatarSheetOpen(false);
      }}
    />
    <RunnerEnrollmentSheet 
      isOpen={isEnrollmentOpen} 
      onClose={() => setIsEnrollmentOpen(false)} 
      onComplete={() => {}}
    />
    </>
  );
}

function AvatarSelectorSheet({ isOpen, onClose, currentAvatar, onSelect }: any) {
  const AVATAR_SEEDS = ['Felix', 'Amirul', 'Sarah', 'Danish', 'Iyad', 'Farhan', 'Muhaimizu', 'Ariff', 'Aria'];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-end justify-center">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/20 backdrop-blur-[2px]" 
          />
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="relative z-10 w-full max-w-lg bg-white rounded-t-[32px] p-8 pb-12 border-t border-[#EAEAEA]"
          >
            <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-8" />
            
            <h2 className="text-[18px] font-bold text-navy mb-8 text-center tracking-tight">Identity Hub</h2>

            <div className="grid grid-cols-3 gap-6 mb-10 px-4">
              {AVATAR_SEEDS.map((seed) => {
                const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                return (
                  <motion.button
                    key={seed}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onSelect(url)}
                    className={`aspect-square rounded-[24px] overflow-hidden border-2 transition-all ${
                      currentAvatar === url ? 'border-accent bg-accent/5' : 'border-[#F2F2F7] bg-slate-50'
                    }`}
                  >
                    <img src={url} className="w-full h-full object-cover" />
                  </motion.button>
                );
              })}
            </div>

            <button className="w-full h-14 bg-slate-50 rounded-[18px] flex items-center justify-center gap-3 text-[13px] font-bold text-navy active:scale-[0.98] transition-all">
              <Upload size={16} strokeWidth={2.5} />
              Upload from Gallery
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ListingTooltip({ item }: { item: any }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-1 hover:bg-slate-50 rounded-full transition-colors text-slate-200 hover:text-navy"
      >
        <Info size={14} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-full right-0 mb-2 z-[110] w-32 bg-white/70 backdrop-blur-md border border-[#EAEAEA] rounded-xl p-3 shadow-2xl pointer-events-none"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Eye size={10} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-navy">{(item.views || 0) + 12}</span>
                </div>
                <div className="flex items-center justify-between">
                  <Users size={10} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-navy">{(item.interests || 0) + 2}</span>
                </div>
              </div>
              <div className="absolute top-full right-3 w-2 h-2 bg-white/70 border-r border-b border-[#EAEAEA] rotate-45 -mt-1" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
