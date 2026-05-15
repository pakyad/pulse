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
  Sparkles, Search, Plus, Activity, Edit3, ArrowUpRight, Package
} from 'lucide-react';
import HologramID from '@/components/shared/HologramID';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import RunnerEnrollmentSheet from '@/components/shared/RunnerEnrollmentSheet';

// ── STANDARDIZED TYPOGRAPHY COMPONENTS (Concept: Skibidi) ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[17px] font-bold text-[#1e293b] tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[11px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

const MENU_GROUPS = [
  {
    label: 'My Commerce',
    items: [
      { icon: ShoppingBag, label: 'Order History', path: '/me/orders' },
      { icon: Store, label: 'Merchant Hub', path: '/merchant' },
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

  const isStudent = !profile?.role || profile?.role === 'STUDENT';

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-40 font-sans">
      
      {/* ── GLOBAL NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-8 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-50">
         <div className="flex items-center gap-4">
            <button onClick={() => router.push('/home')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 active:scale-95 transition-all">
               <ChevronLeft size={20} />
            </button>
            <p className="text-[14px] font-bold tracking-tight">Profile</p>
         </div>
         <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
      </nav>

      <div className="pt-28 px-8 space-y-12">
         
         {/* ── PROFILE HEADER (Concept: Skibidi) ── */}
         <section className="flex items-center gap-6">
            <button onClick={() => setIsIDOpen(true)} className="relative group">
               <div className="w-20 h-20 rounded-[32px] bg-slate-50 border border-slate-100 overflow-hidden shadow-sm group-hover:border-slate-300 transition-all">
                  <img src={profile?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}`} className="w-full h-full object-cover" alt="Profile" />
               </div>
               <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-[#94a3b8] shadow-lg">
                  <ShieldCheck size={14} />
               </div>
            </button>
            <div className="flex-1 min-w-0 space-y-0.5">
               <Heading className="truncate">{profile?.full_name || 'Pulse Member'}</Heading>
               <Subtext>Matric Number: {profile?.matric_no || 'Pending'}</Subtext>
            </div>
         </section>

         {/* ── ACCOUNT STATS ── */}
         <section className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-50 space-y-3">
               <Subtext className="text-[10px] uppercase font-black tracking-widest leading-none">Trust Rating</Subtext>
               <p className="text-[20px] font-bold text-emerald-600">{(profile?.trust || 100)}%</p>
            </div>
            <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-50 space-y-3">
               <Subtext className="text-[10px] uppercase font-black tracking-widest leading-none">Active Assets</Subtext>
               <p className="text-[20px] font-bold text-[#1e293b]">{myListings.length}</p>
            </div>
         </section>

         {/* ── MENU GROUPS ── */}
         {MENU_GROUPS.map((group, idx) => {
            const filteredItems = group.items.filter(item => {
               if (item.label === 'Merchant Hub') {
                  return !isStudent;
               }
               return true;
            });

            if (filteredItems.length === 0) return null;

            return (
               <section key={idx} className="space-y-8">
                  <div className="px-1 space-y-1">
                     <Heading>{group.label}</Heading>
                     <Subtext>Manage your account and preferences</Subtext>
                  </div>
                  <div className="space-y-4">
                     {filteredItems.map((item, i) => (
                        <div key={i} className="space-y-4">
                           <button 
                              onClick={() => router.push(item.path)}
                              className="w-full flex items-center justify-between group py-2"
                           >
                              <div className="text-left">
                                 <p className="text-[15px] font-bold text-slate-500 group-hover:text-[#1e293b] tracking-tight transition-colors">{item.label}</p>
                                 <p className="text-[11px] text-[#94a3b8] font-medium">View your {item.label.toLowerCase()}</p>
                                 </div>
                                 <ChevronRight size={16} className="text-slate-200 group-hover:text-[#1e293b] group-hover:translate-x-1 transition-all" />
                              </button>
                              {i < filteredItems.length - 1 && <div className="h-[0.5px] bg-slate-50" />}
                           </div>
                        ))}
                     </div>
                  </section>
               );
            })}

         {/* ── LISTINGS SECTION (Horizontal Visuals) ── */}
         {isStudent && (
            <section className="space-y-8">
               <div className="px-1 space-y-1">
                  <Heading>Listings</Heading>
                  <Subtext>Operational assets in the marketplace</Subtext>
               </div>

               <div className="flex gap-5 overflow-x-auto no-scrollbar -mx-8 px-8 pb-4">
                  {/* ADD LISTING CARD */}
                  <button 
                     onClick={() => router.push('/marketplace/create')}
                     className="shrink-0 w-36 h-48 rounded-[32px] bg-white border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 hover:bg-slate-50 transition-all group"
                  >
                     <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] group-hover:bg-[#1e293b] group-hover:text-white transition-all">
                        <Plus size={20} />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Add Listing</span>
                  </button>

                  {/* ACTIVE LISTINGS */}
                  {myListings.map((item) => (
                     <div 
                        key={item.id} 
                        className="shrink-0 w-36 h-48 rounded-[32px] bg-slate-50/50 border border-slate-50 overflow-hidden relative group flex flex-col"
                     >
                        <div className="h-28 w-full bg-white relative">
                           {item.images?.[0] ? (
                              <img src={item.images[0]} className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-100">
                                 <Package size={24} />
                              </div>
                           )}
                           <div className="absolute top-2 right-2 px-2 py-1 bg-white/80 backdrop-blur-md rounded-lg border border-slate-100 shadow-sm">
                              <p className="text-[8px] font-black text-[#1e293b] uppercase tracking-tighter">RM {item.price?.toFixed(2)}</p>
                           </div>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between">
                           <p className="text-[12px] font-bold text-[#1e293b] tracking-tight truncate">{item.title}</p>
                           <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest">{item.status}</span>
                              <Edit3 size={12} className="text-slate-200 group-hover:text-[#1e293b] transition-colors" />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
         )}

         {/* ── RUNNER HUB PROMO ── */}
         <section>
            <button 
               onClick={() => setIsEnrollmentOpen(true)}
               className="w-full p-8 bg-[#1e293b] text-white rounded-[40px] flex items-center justify-between shadow-2xl shadow-slate-900/10 group"
            >
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                     <Footprints size={28} />
                  </div>
                  <div className="text-left">
                     <p className="text-[16px] font-bold tracking-tight">Pulse Runner</p>
                     <p className="text-[11px] text-white/50 font-medium">Join the campus delivery team</p>
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
               className="w-full h-16 rounded-[28px] border border-slate-100 text-[#1e293b] font-bold text-[13px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
            >
               Sign Out <LayoutGrid size={16} className="opacity-30" />
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
