'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { 
  Clock, ShieldAlert, FileText, Globe, Home, Zap, Package, 
  ChevronRight, Activity, TrendingUp, Search, ChevronLeft, 
  Bell, MapPin, Flame, Power, Navigation, Phone, X, 
  Wallet, History, ShieldCheck, HelpCircle, Settings as SettingsIcon,
  LayoutGrid
} from 'lucide-react';
import RunnerOnboarding from './onboarding/page'; 
import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import SearchOverlay from '@/components/shared/SearchOverlay';

function RunnerDashboard({ profile }: { profile: any }) {
   const router = useRouter();
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [isOnline, setIsOnline] = useState(false);
   const [isAccepting, setIsAccepting] = useState(false);
   const activeMissions = profile?.current_missions || [];
   const hasActive = activeMissions.length > 0;

   const handleAcceptOrder = async () => {
      if (!auth.currentUser) return;
      setIsAccepting(true);
      try {
         const userRef = doc(db, 'users', auth.currentUser.uid);
         await setDoc(userRef, {
            current_missions: [{
               id: 'PL-992A',
               title: 'Nasi Lemak Ayam + Iced Milo',
               from: 'Cafe Block A',
               to: 'Library East',
               payout: 4.50,
               status: 'active',
               started_at: new Date().toISOString()
            }]
         }, { merge: true });
         router.push('/run/active');
      } catch (error) {
         console.error("Failed to accept order:", error);
      } finally {
         setIsAccepting(false);
      }
   };

   return (
      <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy max-w-md mx-auto border-x border-slate-50 shadow-sm">
         
         {/* ── FIXED NAV ── */}
         <nav className="fixed top-0 left-0 right-0 z-50 px-5 pt-12 pb-4 flex items-center gap-3 bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50 max-w-md mx-auto">
            <button onClick={() => router.push('/home')} className="p-1 -ml-2 text-navy/40 hover:text-navy transition-all active:scale-90">
               <ChevronLeft size={28} strokeWidth={2} />
            </button>
            <h1 className="text-[22px] font-bold tracking-tight flex-1">Carrier Hub</h1>
            <div className="flex items-center gap-2 shrink-0">
               <button onClick={() => router.push('/run/wallet')} className="relative p-2 active:scale-90 text-navy/40 hover:text-navy">
                  <LayoutGrid size={22} strokeWidth={2} />
               </button>
               <button onClick={() => router.push('/activity')} className="relative p-2 active:scale-90 text-navy/40 hover:text-navy">
                  <Bell size={22} strokeWidth={2} />
               </button>
               <AvatarDropdown 
                  photoUrl={profile?.photo_url} 
                  userName={profile?.full_name || 'Pulse'} 
               />
            </div>
         </nav>

         <div className="pt-28 px-5 space-y-8 pb-12">
            
            {/* ── 1. WORKING STATUS (Flat Layout) ── */}
            <div className="flex items-center justify-between py-2 px-1">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isOnline ? 'bg-navy text-white shadow-[0_0_20px_rgba(10,15,30,0.2)]' : 'bg-slate-50 text-slate-300'}`}>
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="butt">
                        <path d="M4 14h2v-2h2v-2h2V8h2v2h2v2h2v2h2v2h-2v-2h-2v-2h-2v-2h-2v2H8v2H6v2H4v-2z" />
                        <path d="M10 18h4v2h-4v-2z" className={isOnline ? 'animate-pulse' : ''} />
                     </svg>
                  </div>
                  <div className="flex flex-col">
                     <h3 className="text-[18px] font-bold text-navy tracking-tight">Working Status</h3>
                  </div>
               </div>
               <button 
                  onClick={() => setIsOnline(!isOnline)}
                  className={`w-[60px] h-[32px] rounded-full relative transition-all duration-300 ${isOnline ? 'bg-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.2)]' : 'bg-slate-200 shadow-inner'}`}
               >
                  <motion.div 
                     layout 
                     className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-[0_2px_4px_rgba(0,0,0,0.1)] flex items-center justify-center transition-all"
                     initial={false} 
                     animate={{ x: isOnline ? 30 : 4 }} 
                  >
                     {isOnline && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </motion.div>
               </button>
            </div>

            {/* ── 2. PERFORMANCE BENTO ── */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-[#0A0F1E] rounded-[1.3rem] p-5 flex flex-col justify-between shadow-xl shadow-navy/10 min-h-[150px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Balance</p>
                  <div>
                     <p className="text-[26px] font-bold text-white tracking-tight">RM {(profile?.balance || 45.00).toFixed(2)}</p>
                     <button onClick={() => router.push('/run/wallet')} className="text-[11px] font-bold text-white/60 mt-2 flex items-center gap-1">Manage Wallet <ChevronRight size={12}/></button>
                  </div>
               </div>
               <div className="bg-white border border-slate-100 rounded-[1.3rem] p-5 flex flex-col justify-between shadow-sm min-h-[150px]">
                  <div className="flex items-center gap-2">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                        <path d="M12 2v2h2v2h2v2h2v2h2v2h-2v2h-2v2h-2v2h-2v2h-2v-2H8v-2H6v-2H4v-2H2v-2h2v-2h2v-2h2v-2h2v-2h2z" />
                     </svg>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Rating</p>
                  </div>
                  <div>
                     <p className="text-[26px] font-bold text-navy tracking-tight">4.98%</p>
                     <p className="text-[11px] font-bold text-emerald-500 mt-2 flex items-center gap-1">Elite Status <TrendingUp size={12}/></p>
                  </div>
               </div>
            </div>

            {/* ── 3. MISSION TERMINAL ── */}
            <div>
               {hasActive ? (
                  <div className="bg-white border-2 border-emerald-500 rounded-[2.5rem] p-6 shadow-lg shadow-emerald-500/5 relative overflow-hidden">
                      <div className="relative z-10">
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                               <h3 className="text-[13px] font-black text-navy uppercase tracking-[0.2em]">Live Handshake</h3>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Active</span>
                         </div>
                         <div className="space-y-4 mb-8">
                            <p className="text-[18px] font-bold text-navy">Package Delivery to Library East</p>
                         </div>
                         <button onClick={() => router.push('/run/active')} className="w-full bg-navy text-white h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-[13px] shadow-sm active:scale-95 transition-all">
                            <Navigation size={16} /> Open Terminal
                         </button>
                      </div>
                  </div>
               ) : (
                  <>
                     <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[18px] font-bold text-navy tracking-tight">Orders</h3>
                     </div>
                     <AnimatePresence mode="wait">
                        {isOnline ? (
                           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                              {/* ── HIGH-FIDELITY OPPORTUNITY CARD ── */}
                              <div className="p-6 bg-white border-2 border-slate-50 rounded-[1.5rem] shadow-xl shadow-navy/5 flex flex-col gap-5 group relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer">
                                 {/* Alert Beacon */}
                                 <div className="absolute top-0 right-0 p-4">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                                 </div>

                                 <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0 space-y-3">
                                       <div className="inline-block px-2 py-0.5 bg-blue-500 relative">
                                          <div className="absolute -top-1 -left-1 w-1 h-1 bg-white" />
                                          <div className="absolute -top-1 -right-1 w-1 h-1 bg-white" />
                                          <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-white" />
                                          <div className="absolute -bottom-1 -right-1 w-1 h-1 bg-white" />
                                          <span className="text-[9px] font-black uppercase tracking-widest text-white relative z-10">New Order</span>
                                       </div>
                                       <h4 className="text-[18px] font-bold text-navy leading-tight truncate">Nasi Lemak Ayam + Iced Milo</h4>
                                       <div className="flex items-center gap-2 text-slate-400">
                                          <MapPin size={12} className="text-slate-300" />
                                          <p className="text-[12px] font-medium truncate">Cafe Block A → Library East</p>
                                       </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                       <p className="text-[20px] font-black text-navy tracking-tighter leading-none whitespace-nowrap">+RM 4.50</p>
                                       <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-2 whitespace-nowrap">Instant Payout</p>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-3 gap-2 pt-2">
                                    <div className="bg-slate-50 rounded-2xl p-3 text-center">
                                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Dist</p>
                                       <p className="text-[12px] font-bold text-navy">450m</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-3 text-center">
                                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Est</p>
                                       <p className="text-[12px] font-bold text-navy">8 min</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-3 text-center">
                                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Load</p>
                                       <p className="text-[12px] font-bold text-navy">Light</p>
                                    </div>
                                 </div>

                                 <button 
                                    onClick={handleAcceptOrder}
                                    disabled={isAccepting}
                                    className="w-full h-12 bg-navy text-white rounded-2xl font-bold text-[13px] shadow-lg shadow-navy/20 active:scale-95 transition-all disabled:opacity-50"
                                 >
                                    {isAccepting ? 'Accepting...' : 'Accept Order'}
                                 </button>
                              </div>
                           </motion.div>
                        ) : (
                           <div className="bg-slate-50 rounded-[1.5rem] p-12 text-center border border-dashed border-slate-200">
                              <p className="text-[15px] font-semibold text-slate-500">You're currently resting</p>
                              <p className="text-[13px] text-slate-400 mt-1.5 font-medium">Change your status to start receiving orders.</p>
                           </div>
                        )}
                     </AnimatePresence>
                  </>
               )}
            </div>

         </div>
         <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </main>
   );
}

export default function RunHub() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'unverified' | 'pending' | 'verified'>('loading');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { setStatus('verified'); return; }
      try {
        const docRef = doc(db, "users", user.uid);
        unsubProfile = onSnapshot(docRef, (docSnap) => {
           if (docSnap.exists()) {
             setProfile(docSnap.data());
             setStatus('verified'); 
           } else { setStatus('verified'); }
        });
      } catch (error) { setStatus('verified'); }
    });
    return () => { unsub(); if (unsubProfile) unsubProfile(); };
  }, []);

  if (status === 'loading') return <main className="min-h-screen bg-[#FDFDFD] flex items-center justify-center"><div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" /></main>;
  return <>{status === 'verified' ? <RunnerDashboard profile={profile} /> : <RunnerOnboarding />}</>;
}
