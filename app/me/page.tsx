"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onSnapshot, doc, collection, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ShieldCheck, ShoppingBag, Store, Heart, MapPin, 
  Wallet, ChevronRight, User, LayoutGrid, Settings,
  ClipboardList, BarChart3, Upload, Footprints,
  Sparkles, Search, Plus, Activity, Edit3, ArrowUpRight, Package
} from 'lucide-react';

import HologramID from '@/components/shared/HologramID';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import RunnerEnrollmentSheet from '@/components/shared/RunnerEnrollmentSheet';
import ActiveOrderBanner from '@/components/shared/ActiveOrderBanner';
import FloatingActiveTask from '@/components/runner/FloatingActiveTask';
import ProductCard from '@/components/shared/ProductCard';

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

const PixelBag = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className={className} shapeRendering="crispEdges">
    <rect x="7" y="4" width="6" height="2" />
    <rect x="5" y="6" width="2" height="2" />
    <rect x="13" y="6" width="2" height="2" />
    <rect x="3" y="8" width="14" height="2" />
    <rect x="3" y="18" width="14" height="2" />
    <rect x="3" y="10" width="2" height="8" />
    <rect x="15" y="10" width="2" height="8" />
    <rect x="7" y="12" width="6" height="4" />
  </svg>
);

const PixelChart = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className={className} shapeRendering="crispEdges">
    <rect x="2" y="2" width="2" height="16" />
    <rect x="4" y="16" width="14" height="2" />
    <rect x="6" y="12" width="2" height="4" />
    <rect x="10" y="8" width="2" height="8" />
    <rect x="14" y="4" width="2" height="12" />
  </svg>
);

const PixelUser = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className={className} shapeRendering="crispEdges">
    <rect x="7" y="4" width="6" height="2" />
    <rect x="7" y="10" width="6" height="2" />
    <rect x="5" y="6" width="2" height="4" />
    <rect x="13" y="6" width="2" height="4" />
    <rect x="7" y="12" width="6" height="2" />
    <rect x="5" y="14" width="2" height="2" />
    <rect x="13" y="14" width="2" height="2" />
    <rect x="3" y="16" width="14" height="2" />
    <rect x="3" y="18" width="2" height="2" />
    <rect x="15" y="18" width="2" height="2" />
  </svg>
);

const MENU_GROUPS = [
  {
    label: 'Account & Settings',
    items: [
      { icon: PixelBag, label: 'Order History', path: '/me/orders', sub: 'View past purchases & deliveries' },
      { icon: PixelChart, label: 'Insights', path: '/campus/earnings', sub: 'Your seller performance at a glance' },
      { icon: PixelUser, label: 'Edit Profile', path: '/me/edit', sub: 'Update your personal details' },
      { icon: Settings, label: 'Settings', path: '/me/settings', sub: 'App preferences and security' },
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
            <div className="flex-1 min-w-0 space-y-1">
               <Heading className="truncate">{profile?.fullName || profile?.full_name || user?.displayName}</Heading>
                <div className="space-y-0.5">
                   {(profile?.matricNumber || profile?.matric_no) && (
                     <p className="text-[12px] text-[#6B7280] font-medium">{profile?.matricNumber || profile?.matric_no}</p>
                   )}
                   {(profile?.programme || profile?.faculty) && (profile?.yearOfStudy || profile?.year_of_study) && (
                     <p className="text-[11px] text-[#9CA3AF] font-medium flex items-center gap-2">
                        <span>{profile?.programme || profile?.faculty}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span>{profile?.yearOfStudy || profile?.year_of_study}</span>
                     </p>
                   )}
                </div>
            </div>
         </section>

         {/* ── ACCOUNT STATS ── */}
         <section className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-[24px] border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-2">
               <Subtext className="text-[12px] font-semibold text-slate-500 capitalize">Trust Rating</Subtext>
               <div className="flex items-center gap-1.5 text-amber-500 pt-1" onClick={() => router.push(`/user/${user?.uid}/reviews`)} style={{cursor:'pointer'}}>
                 <p className="text-[22px] font-bold text-slate-900 hover:text-amber-600 transition-colors tracking-tight">
                    {profile?.trustRating ? Number(profile.trustRating).toFixed(1) : '5.0'}
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
               <div className="space-y-4">
                  {group.items.map((item, i) => (
                     <button 
                        key={i}
                        onClick={() => router.push(item.path)}
                        className="w-full flex items-center gap-4 py-4 active:scale-[0.98] transition-all"
                     >
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                           <item.icon className="w-5 h-5 currentColor" />
                        </div>
                        <div className="text-left">
                           <p className="text-[15px] font-bold text-slate-800 tracking-tight">{item.label}</p>
                           <p className="text-[12px] text-slate-400 font-medium">{item.sub}</p>
                        </div>
                     </button>
                  ))}
               </div>
            </section>
         ))}

         {/* ── LISTINGS SECTION (Grid Layout) ── */}
         {isStudent && (
            <section className="space-y-8">
               <div className="px-1 space-y-1">
                 <Heading>Your Listings</Heading>
                 <Subtext>Operational assets in the marketplace</Subtext>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {/* Buttery Add Card */}
                  <button 
                    onClick={() => router.push('/marketplace/create')}
                    className="aspect-square rounded-[28px] bg-slate-50 border border-slate-100/50 flex flex-col items-center justify-center gap-1.5 group active:scale-95 transition-all shadow-sm"
                  >
                    <Plus size={22} strokeWidth={2} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                    <span className="text-[12px] font-bold text-slate-300 group-hover:text-slate-900 transition-colors">Add</span>
                  </button>

                  {myListings.map((item) => (
                     <div key={item.id} className="relative group">
                          <ProductCard 
                            item={{
                              id: item.id,
                              title: item.title,
                              price: item.price,
                              image_url: item.images?.[0] || item.image_url,
                              seller_id: item.seller_id,
                              seller_name: profile?.full_name,
                              seller_photo_url: profile?.photo_url,
                              stock_count: item.stock_count,
                              is_official: item.is_official,
                              category: item.category,
                              subcategory: item.subcategory
                            }}
                            onClick={() => router.push(`/marketplace/${item.id}`)}
                          />
                       </div>
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
              <HologramID name={profile?.full_name || 'Pulse Member'} role={profile?.is_verified_runner ? 'Pulse Runner' : 'Student'} matricNo={profile?.matricNumber || profile?.matric_no || '—'} qrValue={user?.uid || 'anonymous'} />
              <button onClick={() => setIsIDOpen(false)} className="mt-8 w-full h-14 bg-white/10 rounded-[20px] text-white font-semibold text-[14px] hover:bg-white/20 transition-all">Close ID</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RunnerEnrollmentSheet isOpen={isEnrollmentOpen} onClose={() => setIsEnrollmentOpen(false)} onComplete={() => {}} />
    </main>
  );
}
