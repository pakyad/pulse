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
  X, Info, Sparkles, MoreHorizontal, Footprints, User, Star, Leaf,
  LayoutGrid, ClipboardList
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

      const nq = query(collection(db, 'orders'), where('buyer_id', '==', currentUser.uid), where('status', 'in', ['PENDING', 'AWAITING_RUNNER', 'IN_TRANSIT']));
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
      <div className="w-8 h-8 border-[1.5px] border-slate-100 border-t-accent rounded-full animate-spin" />
    </div>
  );

  const MerchantAccountView = () => (
     <div className="space-y-12 pb-32">
        {/* ── IDENTITY REGISTRY (Merchant Signature) ── */}
        <section className="flex items-center gap-6">
           <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center relative overflow-hidden">
              {profile?.photo_url ? (
                 <img src={profile.photo_url} className="w-full h-full object-cover" />
              ) : (
                 <User size={32} className="text-slate-300" />
              )}
              <button 
                onClick={() => setIsAvatarSheetOpen(true)}
                className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center group"
              >
                 <Edit3 size={16} className="text-white opacity-0 group-hover:opacity-100" />
              </button>
           </div>
           <div>
              <h1 className="text-[24px] font-bold text-slate-900 tracking-tight leading-tight">{profile?.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Verified Merchant</span>
                 <span className="text-[11px] font-medium text-slate-400">Node: {user?.uid.slice(0, 8).toUpperCase()}</span>
              </div>
           </div>
        </section>

        {/* ── ADMINISTRATIVE NODES ── */}
        <section className="space-y-8">
           <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <Info size={12} className="text-slate-400" />
                 <p className="text-[10px] font-medium text-slate-400">Account Registry: Manage institutional identity and node fulfillment preferences.</p>
              </div>
              
              {/* Store Node */}
              <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm shadow-slate-200/20">
                 <button onClick={() => router.push('/me/edit')} className="w-full h-16 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <div className="flex items-center gap-4">
                       <Store size={18} className="text-slate-300" />
                       <span className="text-[14px] font-bold text-slate-900">Store Identity</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-200" />
                 </button>
                 <button onClick={() => setIsIDOpen(true)} className="w-full h-16 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <div className="flex items-center gap-4">
                       <ShieldCheck size={18} className="text-slate-300" />
                       <span className="text-[14px] font-bold text-slate-900">Institutional ID</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-200" />
                 </button>
                 <button className="w-full h-16 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <Wallet size={18} className="text-slate-300" />
                       <span className="text-[14px] font-bold text-slate-900">Payout Registry</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-200" />
                 </button>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <Info size={12} className="text-slate-400" />
                 <p className="text-[10px] font-medium text-slate-400 italic">Directive: Optimize logistics settings to reduce fulfillment latency.</p>
              </div>
              
              {/* Fulfillment Node */}
              <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm shadow-slate-200/20">
                 <button className="w-full h-16 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-50">
                    <div className="flex items-center gap-4">
                       <MapPin size={18} className="text-slate-300" />
                       <span className="text-[14px] font-bold text-slate-900">Pickup Locations</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-200" />
                 </button>
                 <button className="w-full h-16 px-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <Footprints size={18} className="text-slate-300" />
                       <span className="text-[14px] font-bold text-slate-900">Logistics Preferences</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-200" />
                 </button>
              </div>
           </div>

           {/* Security Node */}
           <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm shadow-slate-200/20">
              <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full h-16 px-8 flex items-center justify-between hover:bg-rose-50 transition-colors group">
                 <div className="flex items-center gap-4">
                    <X size={18} className="text-slate-300 group-hover:text-rose-500" />
                    <span className="text-[14px] font-bold text-slate-900 group-hover:text-rose-600">Terminate Session</span>
                 </div>
                 <ChevronRight size={14} className="text-slate-200" />
              </button>
           </div>
        </section>

        {/* ── HELP & SUPPORT ── */}
        <section className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
           <h4 className="text-[13px] font-bold text-slate-900 mb-2">Institutional Support</h4>
           <p className="text-[11px] text-slate-500 leading-relaxed mb-4">Access help center nodes for merchant guidelines and dispute arbitration.</p>
           <button className="w-full h-12 bg-white border border-slate-200 rounded-2xl text-[12px] font-bold text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              Help Center <ChevronRight size={14} className="text-slate-200" />
           </button>
        </section>
     </div>
  );

  return (
    <>
    <main className="min-h-screen bg-white pb-24 font-sans antialiased text-navy">
      
      {/* ── OPTICAL NAV (Pulse Standard) ── */}
      <nav className="fixed top-0 left-0 right-0 z-100 px-6 pt-8 pb-4 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-slate-300 hover:text-slate-900 transition-all active:scale-90">
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="flex-1">
          <button 
            onClick={() => setIsSearchOpen(true)} 
            className="w-full h-10 bg-slate-50 rounded-2xl flex items-center px-4 gap-3 transition-all active:scale-[0.98] border border-slate-100/50 shadow-sm shadow-slate-200/5"
          >
            <Search size={16} className="text-slate-400" />
            <span className="text-[13px] font-medium text-slate-400">Search Pulse</span>
          </button>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button onClick={() => router.push('/activity')} className="relative p-1 text-slate-300 hover:text-slate-900 transition-all active:scale-90">
            <Bell size={20} strokeWidth={2.5} />
            {notificationCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-white">
                {notificationCount}
              </div>
            )}
          </button>
          <AvatarDropdown photoUrl={profile?.photo_url} userName={displayName} />
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-12">
        {profile?.role === 'CLUB' ? (
           <MerchantAccountView />
        ) : (
           <>
           {/* ── IDENTITY SIGNATURE (Unified Node Architecture) ── */}
           <motion.div 
             animate={{ opacity: isCreateOpen ? 0 : 1, y: isCreateOpen ? -20 : 0 }}
             className="flex flex-col"
           >
             <div className="flex items-center gap-6">
               {/* The ID Anchor */}
               <div className="relative shrink-0">
                 <motion.button 
                   whileTap={{ scale: 0.96 }}
                   onClick={() => setIsIDOpen(true)}
                   className="w-[80px] h-[80px] rounded-[28px] overflow-hidden border border-slate-100 bg-white shadow-xl shadow-slate-200/20 p-1"
                 >
                   <div className="w-full h-full rounded-[22px] overflow-hidden">
                     <img 
                       src={profile?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} 
                       className="w-full h-full object-cover" 
                     />
                   </div>
                 </motion.button>
                 
                 {/* Micro Action Node */}
                 <motion.button
                   whileTap={{ scale: 0.9 }}
                   onClick={() => setIsAvatarSheetOpen(true)}
                   className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 shadow-lg shadow-slate-200/50"
                 >
                   <Edit3 size={12} strokeWidth={2.5} />
                 </motion.button>
               </div>
               
               <div className="flex-1 flex flex-col justify-center">
                 <div className="flex items-center justify-between">
                   <div>
                     <h1 className="text-[22px] font-black text-slate-900 tracking-tight">
                       {displayName}
                     </h1>
                   </div>
                   
                   {/* Refined Settings Action */}
                   <motion.button 
                     whileTap={{ scale: 0.96 }}
                     onClick={() => router.push('/me/edit')} 
                     className="w-9 h-9 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm"
                   >
                     <Settings size={18} strokeWidth={2} />
                   </motion.button>
                 </div>

                 {/* The Action Row (Hairline Signature) ── */}
                 <div className="flex items-center gap-2 mt-5">
                   <motion.button
                     whileTap={{ scale: 0.98 }}
                     onClick={() => router.push('/me/edit')}
                     className="flex-1 h-[38px] rounded-xl bg-white border border-slate-200 flex items-center justify-center transition-all shadow-sm active:bg-slate-50"
                   >
                     <span className="text-[13px] font-semibold text-slate-900 tracking-tight">Edit profile</span>
                   </motion.button>
                   
                   <motion.button
                     whileTap={{ scale: 0.98 }}
                     onClick={() => setIsIDOpen(true)}
                     className="w-[38px] h-[38px] rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 transition-all shadow-sm active:bg-slate-50"
                   >
                      <Users size={16} strokeWidth={2.5} />
                   </motion.button>
                 </div>
               </div>
             </div>
           </motion.div>

           {/* ── PERFORMANCE METRICS (3-Node Institutional Strip) ── */}
           <motion.div 
             animate={{ opacity: isCreateOpen ? 0 : 1 }}
             className="bg-white border border-slate-100 rounded-3xl p-1.5 shadow-sm shadow-slate-200/20"
           >
             <div className="grid grid-cols-3 items-center bg-slate-50/50 rounded-[22px] h-[58px] px-2">
               {/* Tenure */}
               <div className="flex items-center justify-center gap-2.5">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                   <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                     <rect x="3" y="3" width="18" height="18" rx="2" />
                     <path d="M12 7v5h3" />
                   </svg>
                 </div>
                 <div className="flex flex-col -space-y-0.5">
                   <span className="text-[14px] font-bold text-slate-900 tracking-tight">{tenure}</span>
                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Tenure</span>
                 </div>
               </div>

               {/* Listings */}
               <div className="flex items-center justify-center gap-2.5 border-x border-slate-200/50">
                 <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                   <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                     <path d="M21 8l-9-4-9 4v8l9 4 9-4V8z" />
                     <path d="M3 8l9 4 9-4" />
                     <path d="M12 12v8" />
                   </svg>
                 </div>
                 <div className="flex flex-col -space-y-0.5">
                   <span className="text-[14px] font-bold text-slate-900 tracking-tight">{myListings.length}</span>
                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Items</span>
                 </div>
               </div>

               {/* Merit */}
               <div className="flex items-center justify-center gap-2.5">
                 <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                   <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="currentColor">
                     <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
                   </svg>
                 </div>
                 <div className="flex flex-col -space-y-0.5">
                   <span className="text-[14px] font-bold text-slate-900 tracking-tight">{profile?.merit || 120}</span>
                   <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Merit</span>
                 </div>
               </div>
             </div>
           </motion.div>

           {/* ── ME SERVICES (Minimal List Architecture) ── */}
           <motion.div 
             animate={{ opacity: isCreateOpen ? 0 : 1, y: isCreateOpen ? 20 : 0 }}
             className="space-y-4"
           >
             <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm shadow-slate-200/20">
               {MENU_GROUPS.flatMap(g => g.items).concat(profile?.role === 'ADMIN' ? [{ icon: ShieldCheck, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Admin Portal', desc: 'Platform oversight', path: '/admin/dashboard' }] : []).map((item) => (
                 <motion.button
                   key={item.label}
                   whileTap={{ backgroundColor: '#FAFAFB' }}
                   onClick={() => {
                     if (item.label === 'My Store') {
                       inventoryRef.current?.scrollIntoView({ behavior: 'smooth' });
                     } else {
                       router.push(item.path);
                     }
                   }}
                   className="w-full flex items-center justify-between px-8 h-[64px] text-left transition-colors group border-b border-slate-50 last:border-0"
                 >
                   <div className="flex items-center gap-5">
                     <item.icon size={18} strokeWidth={2.4} className="text-slate-300 group-hover:text-navy transition-colors" />
                     <span className="text-[14px] font-bold text-slate-900 tracking-tight">{item.label}</span>
                   </div>
                   <ChevronRight size={14} className="text-slate-200" />
                 </motion.button>
               ))}
             </div>

             {/* Special Carrier Entry */}
             <motion.button
               whileTap={{ scale: 0.98 }}
               onClick={() => setIsEnrollmentOpen(true)}
               className="w-full flex items-center justify-between px-8 h-[72px] bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/5 group active:scale-[0.98] transition-all"
             >
               <div className="flex items-center gap-5">
                 <div className="w-10 h-10 rounded-2xl bg-emerald-50/50 flex items-center justify-center text-emerald-600">
                   <Footprints size={20} strokeWidth={2.5} />
                 </div>
                 <span className="text-[14px] font-bold text-slate-900 tracking-tight">Become a Pulse Runner</span>
               </div>
               <div className="px-3.5 py-1.5 bg-accent/5 text-accent rounded-full text-[9px] font-black uppercase tracking-widest transition-all group-hover:bg-accent group-hover:text-white">
                  Join
               </div>
             </motion.button>
           </motion.div>

           {/* ── MERCHANT INVENTORY SECTION (High-Density Minimalism) ── */}
           <div ref={inventoryRef} className="px-6 space-y-6">
             
             {/* ── THE HIGH-FIDELITY STATUS CARD (Spatial Layering) ── */}
             <div className="bg-white border border-slate-100 rounded-3xl px-6 py-6 flex items-center justify-between shadow-xl shadow-slate-200/10">
               <div className="flex items-center flex-1">
                 {/* Zone 1: Global Reach */}
                 <div className="flex-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Global Reach</p>
                   <h3 className="text-[24px] font-bold text-slate-900 leading-none tracking-tight">
                     {myListings.reduce((acc, l) => acc + (l.views || 0), 0).toLocaleString()}
                   </h3>
                 </div>

                 {/* Divider */}
                 <div className="w-px h-8 bg-slate-100 mx-6" />

                 {/* Zone 2: Potential Leads */}
                 <div className="flex-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Leads</p>
                   <h3 className="text-[24px] font-bold text-slate-900 leading-none tracking-tight">
                     {myListings.reduce((acc, l) => acc + (l.interests || 0), 0).toLocaleString()}
                   </h3>
                 </div>
               </div>
               
               {/* Zone 3: The Action Circle */}
               <button 
                 onClick={() => setIsInsightsOpen(true)}
                 className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center transition-all active:scale-90 hover:bg-slate-100 text-slate-900 border border-slate-100 shadow-sm"
               >
                 <ArrowUpRight size={16} strokeWidth={2.5} />
               </button>
             </div>

             <div className="mt-6 space-y-6">
               {/* ── THE SEGMENTED SLIDING CONTROL (Precision Scaling) ── */}
               <div className="flex items-center justify-between px-1">
                 <div className="flex bg-slate-50 p-1 rounded-2xl w-44">
                   <button 
                     onClick={() => setActiveTab('active')}
                     className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/50' : 'text-slate-400'}`}
                   >
                     Active
                   </button>
                   <button 
                     onClick={() => setActiveTab('sold')}
                     className={`flex-1 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${activeTab === 'sold' ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/50' : 'text-slate-400'}`}
                   >
                     Sold
                   </button>
                 </div>
                 
                 {!isManageMode && (
                   <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">
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
                     <div className="flex flex-col gap-3">
                       <motion.button
                         whileTap={{ scale: 0.98 }}
                         onClick={() => setIsCreateOpen(true)}
                         className="aspect-square rounded-3xl bg-slate-50 flex items-center justify-center group relative border border-slate-100 shadow-sm active:bg-slate-100 transition-colors"
                       >
                         <Plus size={24} strokeWidth={2.5} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                       </motion.button>
                       <div className="px-1">
                          <p className="text-[14px] font-bold text-slate-900 tracking-tight">Add Listing</p>
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
           </>
        )}
      </div>
    </main>

    {/* RENDER MERCHANT BOTTOM NAV IF ROLE IS CLUB */}
    {profile?.role === 'CLUB' && (
       <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-8 pt-3 px-10 z-[300] flex justify-between items-center shadow-sm max-w-md mx-auto border-x border-slate-50">
          <button onClick={() => router.push('/merchant')} className="flex flex-col items-center gap-1 group">
             <LayoutGrid size={20} className="text-slate-400 group-active:text-blue-600 transition-colors" />
             <span className="text-[10px] font-bold text-slate-400">Dashboard</span>
          </button>
          <button onClick={() => router.push('/me/orders')} className="flex flex-col items-center gap-1 group">
             <ClipboardList size={20} className="text-slate-400 group-active:text-blue-600 transition-colors" />
             <span className="text-[10px] font-bold text-slate-400">History</span>
          </button>
          <button onClick={() => router.push('/activity')} className="flex flex-col items-center gap-1 group">
             <BarChart3 size={20} className="text-slate-400 group-active:text-blue-600 transition-colors" />
             <span className="text-[10px] font-bold text-slate-400">Insights</span>
          </button>
          <button onClick={() => router.push('/me')} className="flex flex-col items-center gap-1 group">
             <User size={20} className="text-blue-600" />
             <span className="text-[10px] font-bold text-blue-600">Account</span>
          </button>
       </nav>
    )}

    <AnimatePresence>
      {isIDOpen && (
        <div className="fixed inset-0 z-300 flex items-center justify-center p-6">
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
        <div className="fixed inset-0 z-400 flex items-end justify-center">
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
        <div className="fixed inset-0 z-500 flex items-end justify-center">
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
            <div className="fixed inset-0 z-100" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-full right-0 mb-2 z-110 w-32 bg-white/70 backdrop-blur-md border border-[#EAEAEA] rounded-xl p-3 shadow-2xl pointer-events-none"
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


