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
  BarChart3, ArrowUpRight, Upload, HelpCircle, ChevronRight
} from 'lucide-react';
import HologramID from '@/components/shared/HologramID';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import HeartbeatLine from '@/components/shared/HeartbeatLine';
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

        {/* ── IDENTITY BLOCK ── */}
        <div>
          <div className="flex items-center gap-5 mb-6">
            <div className="relative shrink-0 group cursor-pointer" onClick={() => setIsIDOpen(true)}>
              <div className="w-20 h-20 rounded-[1.8rem] overflow-hidden border-2 border-white shadow-2xl bg-slate-50 group-hover:scale-105 transition-transform">
                <img src={profile?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                <ShieldCheck size={14} className="text-white" />
              </div>
              {/* Pulse Ring */}
              <div className="absolute -inset-1 rounded-[2rem] border-2 border-emerald-500/20 animate-pulse-slow pointer-events-none" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[24px] font-black tracking-tight leading-none text-navy">
                {displayName.split(' ')[0]}<span className="text-slate-300 font-medium"> {displayName.split(' ').slice(1).join(' ')}</span>
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2.5 py-0.5 bg-navy text-white rounded-md text-[9px] font-bold uppercase tracking-widest">{isSeller ? 'Merchant' : 'Student'}</span>
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1"><MapPin size={10} /> {profile?.campus || 'City Campus'}</span>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-8 mb-6 ml-1 border-b border-slate-50 pb-6">
            <div><p className="text-[18px] font-black text-navy">{tenure}</p><p className="text-[10px] font-medium text-slate-400 mt-0.5">Years Active</p></div>
            <div className="w-px h-7 bg-slate-100" />
            <div><p className="text-[18px] font-black text-navy">{myListings.length}</p><p className="text-[10px] font-medium text-slate-400 mt-0.5">Listings</p></div>
            <div className="w-px h-7 bg-slate-100" />
            <div><p className="text-[18px] font-black text-navy">{profile?.reviews_count || 0}</p><p className="text-[10px] font-medium text-slate-400 mt-0.5">Reviews</p></div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2.5">
            <button onClick={() => router.push('/me/edit')} className="flex-1 h-11 bg-white border border-slate-200 rounded-full flex items-center justify-center gap-2 text-[13px] font-bold text-navy active:scale-95 transition-all shadow-sm">
              <Edit3 size={15} strokeWidth={2.2} /> Edit Profile
            </button>
            <button className="w-11 h-11 bg-white border border-slate-200 rounded-full flex items-center justify-center text-navy active:scale-95 transition-all shadow-sm">
              <Upload size={16} />
            </button>
            <button onClick={() => router.push('/me/edit')} className="w-11 h-11 bg-white border border-slate-200 rounded-full flex items-center justify-center text-navy active:scale-95 transition-all shadow-sm">
              <Settings size={16} />
            </button>
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

        {/* ── MY LISTINGS ── */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[18px] font-bold text-navy tracking-tight">My Listings</h2>
              <p className="text-[12px] font-medium text-slate-400 mt-1">{myListings.length} active items</p>
            </div>
            <button onClick={() => router.push('/post')} className="w-10 h-10 bg-navy text-white rounded-xl flex items-center justify-center shadow-lg shadow-navy/10 active:scale-90 transition-all">
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>

          {myListings.length === 0 ? (
            <div className="py-16 text-center rounded-[2.5rem] border border-dashed border-slate-100 bg-slate-50/50">
              <Package size={32} strokeWidth={1} className="mx-auto text-slate-200 mb-3" />
              <p className="text-[12px] font-bold text-slate-300">No listings yet</p>
              <button onClick={() => router.push('/post')} className="mt-4 text-[12px] font-bold text-accent">List your first item →</button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myListings.map((item) => (
                <Link key={item.id} href={`/marketplace/${item.id}`} className="group flex items-center gap-4 p-3.5 bg-white border border-slate-100 rounded-[2rem] active:scale-[0.98] shadow-sm transition-all">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-50 border border-slate-50">
                      <img src={item.image_url} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold truncate text-navy">{item.title}</h4>
                    <p className="text-[14px] font-black text-accent leading-none mt-0.5">RM {item.price?.toFixed(2)}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-medium text-slate-400">Active</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><Edit3 size={14} /></div>
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><TrendingUp size={14} /></div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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

    <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
