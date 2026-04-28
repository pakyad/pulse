'use client'

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onSnapshot, doc, collection, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Bell, ShieldCheck, Settings,
  Package, Heart, ShoppingBag, Store, Plus,
  MapPin, Edit3, Search, TrendingUp, Wallet,
  BarChart3, ArrowUpRight, Upload, HelpCircle, ChevronRight,
  Eye, Users, Trash2, CheckCircle2,
  X, Info, Sparkles, MoreHorizontal, Footprints
} from 'lucide-react';
import { markItemAsSold, deleteItemListing } from '@/lib/marketplace-utils';
import HologramID from '@/components/shared/HologramID';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import HeartbeatLine from '@/components/shared/HeartbeatLine';
import CreateListing from '@/components/CreateListing';
import RunnerEnrollmentSheet from '@/components/shared/RunnerEnrollmentSheet';
import Link from 'next/link';

// Apple Settings-style menu groups
const MENU_GROUPS = [
  {
    label: 'Commerce',
    items: [
      { icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Orders', desc: 'Your handshake history', path: '/activity' },
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
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const u = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) { setLoading(false); return; }
      onSnapshot(doc(db, 'users', currentUser.uid), s => { if (s.exists()) setProfile(s.data()); setLoading(false); });
      const nq = query(collection(db, 'transactions'), where('buyer_id', '==', currentUser.uid), where('status', '==', 'PENDING'));
      onSnapshot(nq, s => setNotificationCount(s.docs.length));
      const lq = query(collection(db, 'items'), where('seller_id', '==', currentUser.uid));
      onSnapshot(lq, s => setMyListings(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.is_active !== false)));
    });
    return () => u();
  }, []);

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
      
      {/* ── MINIMAL INBOX ONLY ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] px-5 pt-8 pb-4 flex justify-end pointer-events-none">
        <button 
          onClick={() => router.push('/activity')} 
          className="relative p-2 active:scale-90 text-navy/40 hover:text-navy pointer-events-auto bg-white/50 backdrop-blur-sm rounded-full shadow-sm border border-slate-50"
        >
          <Bell size={22} strokeWidth={2} />
          {notificationCount > 0 && (
            <div className="absolute top-1.5 right-1.5 bg-accent text-white text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-[#FDFDFD]">
              {notificationCount}
            </div>
          )}
        </button>
      </div>

      <div className="pt-40 px-5 space-y-10">

        {/* ── PROFILE CARD (DISCIPLINED GALLERY STYLE) ── */}
        <motion.div 
          animate={{ opacity: isCreateOpen ? 0 : 1, y: isCreateOpen ? -20 : 0 }}
          className="bg-white rounded-2xl p-8 border border-[#EAEAEA] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/30 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative shrink-0" onClick={() => setIsIDOpen(true)}>
                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#EAEAEA] bg-slate-50 cursor-pointer active:scale-95 transition-all">
                  <img src={profile?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                  <ShieldCheck size={16} className="text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-[28px] font-black tracking-tighter leading-none text-navy mb-2">
                  {displayName.split(' ')[0]}<span className="text-slate-300 font-medium"> {displayName.split(' ').slice(1).join(' ')}</span>
                </h1>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-navy text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">{isSeller ? 'Merchant' : 'Student'}</span>
                  <span className="text-[12px] font-semibold text-slate-300 flex items-center gap-1"><MapPin size={12} /> {profile?.campus || 'City Campus'}</span>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="flex items-center justify-between mb-10 px-2">
              <div className="text-center">
                <p className="text-[20px] font-black text-navy">{tenure}</p>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Years</p>
              </div>
              <div className="w-px h-8 bg-slate-50" />
              <div className="text-center">
                <p className="text-[20px] font-black text-navy">{myListings.length}</p>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Listings</p>
              </div>
              <div className="w-px h-8 bg-slate-50" />
              <div className="text-center">
                <p className="text-[20px] font-black text-navy">{profile?.reviews_count || 0}</p>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Reviews</p>
              </div>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/me/edit')} className="flex-1 h-12 bg-white border border-[#EAEAEA] rounded-2xl flex items-center justify-center gap-3 text-[13px] font-bold text-navy active:scale-95 transition-all hover:bg-slate-50">
                <Edit3 size={16} /> Edit Profile
              </button>
              <button className="w-12 h-12 bg-white border border-[#EAEAEA] rounded-2xl flex items-center justify-center text-navy active:scale-95 transition-all hover:bg-slate-50">
                <Settings size={18} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── STAT BENTO ── */}
        <motion.div 
          animate={{ opacity: isCreateOpen ? 0 : 1, y: isCreateOpen ? 20 : 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="bg-navy rounded-2xl p-6 aspect-square flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 opacity-40">
               <HeartbeatLine color="#3B82F6" speed={3} />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center relative z-10"><Wallet size={18} className="text-white" /></div>
            <div className="relative z-10"><p className="text-[10px] font-medium text-white/40 mb-1">Balance</p><h3 className="text-[22px] font-black text-white leading-none">RM {(profile?.balance || 0).toFixed(2)}</h3></div>
          </div>
          <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6 aspect-square flex flex-col justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center"><TrendingUp size={18} className="text-emerald-500" /></div>
            <div><p className="text-[10px] font-medium text-slate-400 mb-1">Total Sold</p><h3 className="text-[22px] font-black text-navy leading-none">RM {((profile?.total_sold || 0) * 15).toFixed(2)}</h3></div>
          </div>
        </motion.div>

        {/* ── APPLE SETTINGS-STYLE MENU ── */}
        <motion.div 
          animate={{ opacity: isCreateOpen ? 0 : 1, y: isCreateOpen ? 40 : 0 }}
          className="space-y-3"
        >
          {MENU_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-8 mb-3 ml-1">{group.label}</p>
              <div className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden">
                {group.items.map((item, i) => (
                  <button
                    key={item.label}
                    onClick={() => router.push(item.path)}
                    className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 active:bg-slate-50 transition-all text-left group ${i < group.items.length - 1 ? 'border-b border-slate-50' : ''}`}
                  >
                    <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                      <item.icon size={17} className={item.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-navy leading-none">{item.label}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-400 transition-all shrink-0" />
                  </button>
                ))}
              </div>

              {/* Campus Careers Section (Below Analytics) */}
              {group.label === 'Analytics' && (
                <div className="mt-8">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 ml-1">Campus Careers</p>
                  <button
                    onClick={() => setIsEnrollmentOpen(true)}
                    className="w-full flex items-center justify-between px-5 py-4 bg-white border border-[#EAEAEA] rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                        <Footprints size={17} className="text-slate-400" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[14px] font-medium text-navy">Become a Pulse Runner</span>
                        <span className="text-[11px] text-slate-400">Verify your transport and start earning while you walk.</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${profile?.runner_status === 'active' ? 'bg-teal-500 text-white' : 'bg-teal-50 text-teal-600 border border-teal-100'}`}>
                        {profile?.runner_status === 'active' ? 'Active' : 'Apply'}
                      </div>
                      <ChevronRight size={16} className="text-slate-200" />
                    </div>
                  </button>
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* ── MY LISTINGS GALLERY (THE THREE PILLARS) ── */}
        <div>
          {/* Pillar C: The "History" Toggle */}
          <div className="flex items-center justify-between mt-12 mb-8 px-1">
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-[#EAEAEA]">
              <button 
                onClick={() => setActiveTab('active')}
                className={`px-6 py-2 rounded-xl text-[12px] font-bold transition-all ${activeTab === 'active' ? 'bg-white text-navy' : 'text-slate-400'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setActiveTab('sold')}
                className={`px-6 py-2 rounded-xl text-[12px] font-bold transition-all ${activeTab === 'sold' ? 'bg-white text-navy' : 'text-slate-400'}`}
              >
                Sold
              </button>
            </div>
            {isManageMode ? (
              <button onClick={() => setIsManageMode(false)} className="text-[12px] font-bold text-accent px-4 py-2 bg-accent/5 rounded-xl">Done</button>
            ) : (
              <span className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">{myListings.filter(l => activeTab === 'active' ? l.status !== 'SOLD' : l.status === 'SOLD').length} items</span>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-1 px-1 min-h-[220px] items-start">
            {/* Pillar A: The "Active" Carousel (Visual) */}
            {activeTab === 'active' && (
              <motion.button
                layoutId="create-listing-canvas"
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsCreateOpen(true)}
                className="shrink-0 w-[145px] h-[200px] rounded-2xl border border-dashed border-[#EAEAEA] flex flex-col items-center justify-center gap-3 bg-slate-50/30 hover:bg-slate-50 transition-all group z-50"
              >
                <div className="w-10 h-10 rounded-full border border-[#EAEAEA] flex items-center justify-center text-slate-300 group-hover:text-navy transition-colors">
                  <Plus size={20} />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">New Listing</span>
              </motion.button>
            )}

            {myListings
              .filter(item => activeTab === 'active' ? item.status !== 'SOLD' : item.status === 'SOLD')
              .map((item) => (
              <motion.div
                key={item.id}
                onContextMenu={(e) => { e.preventDefault(); setIsManageMode(true); }}
                layout
                animate={isManageMode ? {
                  rotate: [0, -0.5, 0.5, -0.5, 0],
                  transition: { repeat: Infinity, duration: 0.4 }
                } : { rotate: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="shrink-0 relative"
              >
                <div
                  className="w-[145px] h-[200px] rounded-2xl bg-white border border-[#EAEAEA] overflow-hidden flex flex-col text-left group transition-all"
                >
                  <div className="h-[115px] w-full bg-slate-50 relative overflow-hidden">
                    <img 
                      src={item.image_url} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      onClick={() => !isManageMode && router.push(`/marketplace/${item.id}`)}
                    />
                    {item.status !== 'SOLD' && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-white border border-[#EAEAEA] rounded-lg flex items-center gap-1">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[8px] font-bold text-navy uppercase tracking-tighter">Live</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-[12px] font-bold text-navy truncate leading-none flex-1">{item.title}</h4>
                      <ListingTooltip item={item} />
                    </div>
                    <p className="text-[14px] font-black text-navy mt-auto">
                      <span className="text-[10px] opacity-30 mr-0.5">RM</span>
                      {item.price?.toFixed(0)}
                    </p>
                  </div>
                </div>

                {/* Manage Mode Overlays */}
                <AnimatePresence>
                  {isManageMode && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute -top-2 -right-2 flex flex-col gap-2 z-20"
                    >
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-90 transition-all hover:bg-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleMarkAsSold(item.id)}
                        className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-90 transition-all hover:bg-emerald-600"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Pillar B: Insights Drawer (Disciplined Design) */}
          <div className="mt-4 px-2 py-5 bg-white rounded-2xl border border-[#EAEAEA] flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[14px] font-black text-navy">{myListings.reduce((acc, l) => acc + (l.views || 0), 45)}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Global Views</p>
                </div>
                <div className="w-px h-6 bg-slate-100" />
                <div className="text-center">
                  <p className="text-[14px] font-black text-navy">{myListings.reduce((acc, l) => acc + (l.interests || 0), 8)}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Interested</p>
                </div>
             </div>
             <button 
               onClick={() => setIsInsightsOpen(true)}
               className="flex items-center gap-1 text-[10px] font-bold text-accent uppercase tracking-widest active:scale-95 transition-all"
             >
               Deep Insights <ArrowUpRight size={12} />
             </button>
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

        {/* ── SIGN OUT ── */}
        {user && (
          <button
            onClick={() => auth.signOut().then(() => router.push('/auth'))}
            className="w-full h-12 bg-white border border-[#EAEAEA] rounded-2xl text-[12px] font-bold text-slate-400 uppercase tracking-widest active:scale-95 transition-all"
          >
            Sign Out
          </button>
        )}

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
    <RunnerEnrollmentSheet 
      isOpen={isEnrollmentOpen} 
      onClose={() => setIsEnrollmentOpen(false)} 
      onComplete={() => {}}
    />
    </>
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
