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
import ActiveOrderBanner from '@/components/shared/ActiveOrderBanner';
import FloatingActiveTask from '@/components/runner/FloatingActiveTask';

// ── STANDARDIZED TYPOGRAPHY COMPONENTS (Concept: Skibidi) ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[17px] font-bold text-slate-900 tracking-tight ${className}`}>
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
    label: 'Account & Settings',
    items: [
      { icon: ShoppingBag, label: 'Order History', path: '/me/orders', sub: 'View past purchases & deliveries' },
      { icon: BarChart3, label: 'Earnings Ledger', path: '/campus/earnings', sub: 'Track your marketplace revenue' },
      { icon: User, label: 'Edit Profile', path: '/me/edit', sub: 'Update your personal details' },
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

  const isStudent = !profile?.role || profile?.role === 'STUDENT' || profile?.role === 'CLUB' || profile?.role === 'MERCHANT';

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40 font-sans">
      
      {/* ── GLOBAL NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-50">
         <div className="flex items-center gap-4">
            <button onClick={() => router.push('/home')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 active:scale-95 transition-all">
               <ChevronLeft size={20} />
            </button>
            <p className="text-[14px] font-bold tracking-tight">Profile</p>
         </div>
         <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
      </nav>

      <div className="pt-28 px-4 space-y-12">
         
         {/* ── ACTIVE ORDER BANNER ── */}
         <ActiveOrderBanner />
         <FloatingActiveTask />

         {/* ── PROFILE HEADER ── */}
         <section className="flex items-center gap-6">
            <button onClick={() => setIsIDOpen(true)} className="relative group">
               <div className="w-20 h-20 rounded-[24px] bg-slate-50 border border-slate-100 overflow-hidden shadow-sm group-hover:border-slate-300 transition-all">
                  <img src={profile?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.full_name}`} className="w-full h-full object-cover" alt="Profile" />
               </div>
               <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full border border-slate-100 flex items-center justify-center text-slate-400 shadow-md">
                  <ShieldCheck size={16} />
               </div>
            </button>
            <div className="flex-1 min-w-0 space-y-0.5">
               <Heading className="truncate">{profile?.full_name || 'Pulse Member'}</Heading>
               <Subtext>Matric Number: {profile?.matric_no || 'Pending'}</Subtext>
            </div>
         </section>

         {/* ── ACCOUNT STATS ── */}
         <section className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-2">
               <Subtext className="text-[12px] font-semibold text-slate-500 capitalize">Trust Rating</Subtext>
               <div className="flex items-center gap-1.5 text-amber-500 pt-1" onClick={() => router.push(`/user/${user?.uid}/reviews`)} style={{cursor:'pointer'}}>
                 <p className="text-[22px] font-bold text-slate-900 hover:text-amber-600 transition-colors tracking-tight">
                    {profile?.averageRating ? Number(profile.averageRating).toFixed(1) : '5.0'}
                 </p>
                 <Sparkles size={18} fill="currentColor" className="hover:text-amber-600 transition-colors" />
               </div>
            </div>
            <div className="p-6 bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-2">
               <Subtext className="text-[12px] font-semibold text-slate-500 capitalize">Active Assets</Subtext>
               <p className="text-[22px] font-bold text-slate-900 pt-1 tracking-tight">{myListings.length}</p>
            </div>
         </section>

         {/* ── DIRECTORY / SETTINGS ── */}
         {MENU_GROUPS.map((group, idx) => (
            <section key={idx} className="space-y-8">
               <div className="px-1 space-y-1">
                  <Heading>{group.label}</Heading>
                  <Subtext>Manage your account and preferences</Subtext>
               </div>
               <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                  {group.items.map((item, i) => (
                     <button 
                        key={i}
                        onClick={() => router.push(item.path)}
                        className={`w-full flex items-center justify-between group p-5 hover:bg-slate-50 transition-colors ${i !== group.items.length - 1 ? 'border-b border-slate-100' : ''}`}
                     >
                        <div className="text-left flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all shadow-sm">
                              <item.icon size={18} />
                           </div>
                           <div>
                              <p className="text-[15px] font-semibold text-slate-800 group-hover:text-slate-900 tracking-tight transition-colors">{item.label}</p>
                              <p className="text-[12px] text-slate-500 font-medium">{item.sub}</p>
                           </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                     </button>
                  ))}
               </div>
            </section>
         ))}

         {/* ── LISTINGS SECTION (Horizontal Visuals) ── */}
         {isStudent && (
            <section className="space-y-8">
               <div className="px-1 space-y-1">
                  <Heading>Listings</Heading>
                  <Subtext>Operational assets in the marketplace</Subtext>
               </div>

               <div className="flex gap-5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-4">
                  {/* ADD LISTING CARD */}
                  <button 
                     onClick={() => router.push('/marketplace/create')}
                     className="shrink-0 w-36 h-48 rounded-[24px] bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 hover:bg-slate-50 transition-all group"
                  >
                     <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all shadow-sm">
                        <Plus size={20} />
                     </div>
                     <span className="text-[12px] font-semibold text-slate-500">Add Listing</span>
                  </button>

                  {/* ACTIVE LISTINGS */}
                  {myListings.map((item) => (
                     <button 
                        key={item.id} 
                        onClick={() => router.push(`/marketplace/${item.id}`)}
                        className="shrink-0 w-36 h-48 rounded-[24px] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden relative group flex flex-col text-left active:scale-[0.97] transition-all"
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
                              <p className="text-[8px] font-semibold text-slate-900 uppercase tracking-tighter">RM {item.price?.toFixed(2)}</p>
                           </div>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between">
                           <p className="text-[12px] font-bold text-slate-900 tracking-tight truncate">{item.title}</p>
                           <div className="flex items-center justify-between">
                              <span className="text-[9px] font-semibold text-[#94a3b8] ">{item.status}</span>
                              <Edit3 size={12} className="text-slate-200 group-hover:text-slate-900 transition-colors" />
                           </div>
                        </div>
                      </button>
                   ))}
               </div>
            </section>
         )}



      </div>

      <AnimatePresence>
        {isIDOpen && (
          <div className="fixed inset-0 z-300 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsIDOpen(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative z-10 w-full max-w-sm">
              <HologramID name={profile?.full_name || 'Pulse Member'} role={profile?.is_verified_runner ? 'Pulse Runner' : 'Student'} matricNo={profile?.matric_no || '—'} qrValue={user?.uid || 'anonymous'} />
              <button onClick={() => setIsIDOpen(false)} className="mt-8 w-full h-14 bg-white/10 rounded-[20px] text-white font-semibold text-[14px] hover:bg-white/20 transition-all">Close ID</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RunnerEnrollmentSheet isOpen={isEnrollmentOpen} onClose={() => setIsEnrollmentOpen(false)} onComplete={() => {}} />
    </main>
  );
}
