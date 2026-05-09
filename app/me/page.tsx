"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onSnapshot, doc, collection, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ShieldCheck, ShoppingBag, Store, Heart, MapPin, 
  Wallet, ChevronRight, User, LayoutGrid, 
  ClipboardList, BarChart3, Upload, Footprints,
  Sparkles, Search, Plus, Activity, Edit3, ArrowUpRight
} from 'lucide-react';
import HologramID from '@/components/shared/HologramID';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import RunnerEnrollmentSheet from '@/components/shared/RunnerEnrollmentSheet';

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[24px] font-bold text-[#1e293b] tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[14px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

const MENU_GROUPS = [
  {
    label: 'My Commerce',
    items: [
      { icon: ShoppingBag, label: 'Order History', path: '/me/orders' },
      { icon: Store, label: 'Seller Dashboard', path: '/merchant' },
      { icon: Heart, label: 'Saved Items', path: '/me/saved' },
    ],
  },
  {
    label: 'Account Settings',
    items: [
      { icon: MapPin, label: 'My Locations', path: '/me/locations' },
      { icon: Wallet, label: 'Payments', path: '/me/wallet' },
    ]
  }
];

export default function MePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [myListings, setMyListings] = useState<any[]>([]);
  const [isIDOpen, setIsIDOpen] = useState(false);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) { setLoading(false); return; }
      onSnapshot(doc(db, 'users', currentUser.uid), s => { setProfile(s.data()); setLoading(false); });
      onSnapshot(query(collection(db, 'items'), where('seller_id', '==', currentUser.uid)), s => {
        setMyListings(s.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    });
    return () => unsubAuth();
  }, []);

  if (loading) return null;

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-40">
      
      {/* ── GLOBAL NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-8 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
         <div className="flex items-center gap-3">
            <button onClick={() => router.push('/home')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all">
               <ChevronLeft size={20} />
            </button>
            <p className="text-[15px] font-bold tracking-tight">Profile</p>
         </div>
         <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
      </nav>

      <div className="pt-32 px-8 space-y-12">
         
         {/* ── PROFILE HEADER ── */}
         <section className="flex items-center gap-6">
            <button onClick={() => setIsIDOpen(true)} className="relative group">
               <div className="w-20 h-20 rounded-[32px] bg-slate-50 border border-slate-100 overflow-hidden shadow-sm group-hover:border-slate-300 transition-all">
                  <img src={profile?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}`} className="w-full h-full object-cover" alt="Profile" />
               </div>
               <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-[#94a3b8] shadow-lg">
                  <ShieldCheck size={14} />
               </div>
            </button>
            <div className="flex-1 min-w-0">
               <Heading className="truncate">{profile?.full_name || 'Pulse Member'}</Heading>
               <Subtext>Matric Number: {profile?.matric_no || 'Pending'}</Subtext>
            </div>
         </section>

         {/* ── ACCOUNT STATS ── */}
         <section className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100">
               <Subtext className="text-[11px] uppercase tracking-wider mb-1">Trust Rating</Subtext>
               <p className="text-[20px] font-bold text-emerald-600">{(profile?.trust || 100)}%</p>
            </div>
            <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100">
               <Subtext className="text-[11px] uppercase tracking-wider mb-1">My Listings</Subtext>
               <p className="text-[20px] font-bold text-[#1e293b]">{myListings.length}</p>
            </div>
         </section>

         {/* ── MENU GROUPS ── */}
         {MENU_GROUPS.map((group, idx) => (
            <section key={idx} className="space-y-6">
               <div className="px-1">
                  <Heading className="text-[18px]">{group.label}</Heading>
                  <Subtext className="text-[13px]">Manage your account and preferences</Subtext>
               </div>
               <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm">
                  {group.items.map((item, i) => (
                     <button 
                        key={i} onClick={() => router.push(item.path)}
                        className="w-full h-[76px] px-8 flex items-center justify-between border-b-[0.5px] border-slate-100 last:border-0 hover:bg-slate-50/50 transition-all group"
                     >
                        <div className="flex items-center gap-5">
                           <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-50 group-hover:bg-white transition-colors">
                              <item.icon size={18} />
                           </div>
                           <p className="text-[15px] font-bold text-[#1e293b] tracking-tight">{item.label}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-200" />
                     </button>
                  ))}
               </div>
            </section>
         ))}

         {/* ── RUNNER HUB PROMO ── */}
         <section>
            <button 
               onClick={() => setIsEnrollmentOpen(true)}
               className="w-full p-8 bg-[#1e293b] text-white rounded-[40px] flex items-center justify-between shadow-xl shadow-slate-900/10 group"
            >
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                     <Footprints size={28} />
                  </div>
                  <div className="text-left">
                     <p className="text-[16px] font-bold tracking-tight">Pulse Runner</p>
                     <p className="text-[13px] text-white/50 font-medium">Join the campus delivery team</p>
                  </div>
               </div>
               <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-[#1e293b] transition-all">
                  <ArrowUpRight size={20} />
               </div>
            </button>
         </section>

         {/* ── ACCOUNT ACTIONS ── */}
         <section className="pt-6">
            <button 
               onClick={() => { auth.signOut(); router.push('/auth'); }}
               className="w-full h-16 rounded-[28px] border border-slate-100 text-[#1e293b] font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
            >
               Sign Out <LayoutGrid size={18} className="opacity-30" />
            </button>
         </section>

      </div>

      <AnimatePresence>
        {isIDOpen && (
          <div className="fixed inset-0 z-300 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsIDOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 w-full max-w-sm">
              <HologramID name={profile?.full_name || 'Pulse Member'} role={profile?.is_verified_runner ? 'Pulse Runner' : 'Student'} matricNo={profile?.matric_no || '—'} qrValue={user?.uid || 'anonymous'} />
              <button onClick={() => setIsIDOpen(false)} className="mt-8 w-full h-16 bg-white/10 rounded-3xl text-white font-bold uppercase text-[12px] tracking-widest">Close ID</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RunnerEnrollmentSheet isOpen={isEnrollmentOpen} onClose={() => setIsEnrollmentOpen(false)} onComplete={() => {}} />
    </main>
  );
}
