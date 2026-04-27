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
  Eye, Users, Trash2, CheckCircle2
} from 'lucide-react';
import HologramID from '@/components/shared/HologramID';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import HeartbeatLine from '@/components/shared/HeartbeatLine';
import CreateListing from '@/components/CreateListing';
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

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-navy/10 border-t-navy rounded-full animate-spin" />
    </div>
  );

  return (
    <>
    <main className="min-h-screen bg-[#FDFDFD] pb-24 font-sans antialiased text-navy">
      
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

        {/* ── PROFILE CARD (IKEA WHITESPACE STYLE) ── */}
        <div className="bg-white rounded-[3.5rem] p-10 shadow-sm border border-slate-50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-10">
              <div className="relative shrink-0" onClick={() => setIsIDOpen(true)}>
                <div className="w-24 h-24 rounded-[2.2rem] overflow-hidden border-4 border-white shadow-xl bg-slate-50 cursor-pointer active:scale-95 transition-all">
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
              <button onClick={() => router.push('/me/edit')} className="flex-1 h-14 bg-slate-50 rounded-2xl flex items-center justify-center gap-3 text-[14px] font-bold text-navy active:scale-95 transition-all hover:bg-slate-100/50">
                <Edit3 size={18} /> Edit Profile
              </button>
              <button className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-navy active:scale-95 transition-all hover:bg-slate-100/50">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* ── STAT BENTO ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-navy rounded-[2rem] p-5 aspect-square flex flex-col justify-between shadow-xl shadow-navy/15 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 opacity-40">
               <HeartbeatLine color="#3B82F6" speed={3} />
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center relative z-10"><Wallet size={18} className="text-white" /></div>
            <div className="relative z-10"><p className="text-[10px] font-medium text-white/40 mb-1">Balance</p><h3 className="text-[22px] font-black text-white leading-none">RM {(profile?.balance || 0).toFixed(2)}</h3></div>
          </div>
          <div className="bg-white border border-slate-100 rounded-[2rem] p-5 aspect-square flex flex-col justify-between shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center"><TrendingUp size={18} className="text-emerald-500" /></div>
            <div><p className="text-[10px] font-medium text-slate-400 mb-1">Total Sold</p><h3 className="text-[22px] font-black text-navy leading-none">RM {((profile?.total_sold || 0) * 15).toFixed(2)}</h3></div>
          </div>
        </div>

        {/* ── APPLE SETTINGS-STYLE MENU ── */}
        <div className="space-y-3">
          {MENU_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2.5 ml-1">{group.label}</p>
              <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
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
            </div>
          ))}
        </div>

        {/* ── MY LISTINGS GALLERY (THE THREE PILLARS) ── */}
        <div>
          {/* Pillar C: The "History" Toggle */}
          <div className="flex items-center justify-between mb-8 px-1">
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button 
                onClick={() => setActiveTab('active')}
                className={`px-6 py-2 rounded-xl text-[12px] font-bold transition-all ${activeTab === 'active' ? 'bg-white text-navy shadow-sm' : 'text-slate-400'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setActiveTab('sold')}
                className={`px-6 py-2 rounded-xl text-[12px] font-bold transition-all ${activeTab === 'sold' ? 'bg-white text-navy shadow-sm' : 'text-slate-400'}`}
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
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsCreateOpen(true)}
                className="shrink-0 w-[145px] h-[200px] rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-3 bg-slate-50/30 hover:bg-slate-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-navy transition-colors">
                  <Plus size={24} />
                </div>
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">New Listing</span>
              </motion.button>
            )}

            {myListings
              .filter(item => activeTab === 'active' ? item.status !== 'SOLD' : item.status === 'SOLD')
              .map((item) => (
              <motion.div
                key={item.id}
                onContextMenu={(e) => { e.preventDefault(); setIsManageMode(true); }}
                animate={isManageMode ? {
                  rotate: [0, -1, 1, -1, 0],
                  transition: { repeat: Infinity, duration: 0.3 }
                } : { rotate: 0 }}
                className="shrink-0 relative"
              >
                <button
                  onClick={() => !isManageMode && router.push(`/marketplace/${item.id}`)}
                  className="w-[145px] h-[200px] rounded-[2.5rem] bg-white border border-slate-50 overflow-hidden flex flex-col shadow-sm text-left group transition-all"
                >
                  <div className="h-[115px] w-full bg-slate-50 relative">
                    <img src={item.image_url} className="w-full h-full object-cover" />
                    {item.status !== 'SOLD' && (
                      <div className="absolute top-4 right-4 px-2 py-0.5 bg-emerald-500 rounded-lg flex items-center gap-1 border-2 border-white shadow-sm">
                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                        <span className="text-[8px] font-bold text-white uppercase tracking-tighter">Live</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[12px] font-bold text-navy truncate leading-none">{item.title}</h4>
                      <p className="text-[14px] font-black text-navy mt-1.5">
                        <span className="text-[10px] opacity-30 mr-0.5">RM</span>
                        {item.price?.toFixed(0)}
                      </p>
                    </div>
                    {/* Pillar B: The "Insights" Micro-Typography */}
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="flex items-center gap-1">
                        <Eye size={10} className="text-slate-300" />
                        <span className="text-[9px] font-bold text-slate-300">{(item.views || 0) + 12}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={10} className="text-slate-300" />
                        <span className="text-[9px] font-bold text-slate-300">{(item.interests || 0) + 2}</span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Manage Mode Overlays */}
                <AnimatePresence>
                  {isManageMode && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute -top-2 -right-2 flex flex-col gap-2 z-20"
                    >
                      <button className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-90 transition-all"><Trash2 size={14} /></button>
                      <button className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white active:scale-90 transition-all"><CheckCircle2 size={14} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Pillar B: Insights Drawer (Drawer-style Footer) */}
          <div className="mt-4 px-2 py-4 bg-slate-50/50 rounded-[2rem] border border-slate-50 flex items-center justify-between">
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
             <button className="flex items-center gap-1 text-[10px] font-bold text-accent uppercase tracking-widest">
               Deep Insights <ArrowUpRight size={12} />
             </button>
          </div>
        </div>

        {/* ── HELP CENTER ── */}
        <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-navy shadow-sm"><HelpCircle size={18} /></div>
            <div>
              <h3 className="text-[14px] font-bold text-navy">Help Center</h3>
              <p className="text-[11px] text-slate-400 font-medium">Support & institutional guides</p>
            </div>
          </div>
          <button className="w-full bg-white border border-slate-100 h-12 rounded-2xl text-[12px] font-bold text-navy active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2">
            Get Assistance <ChevronRight size={14} className="text-slate-200" />
          </button>
        </div>

        {/* ── SIGN OUT ── */}
        {user && (
          <button
            onClick={() => auth.signOut().then(() => router.push('/auth'))}
            className="w-full h-12 bg-white border border-slate-100 rounded-2xl text-[12px] font-bold text-slate-400 uppercase tracking-widest active:scale-95 transition-all shadow-sm"
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
    </>
  );
}
