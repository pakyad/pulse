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
               id: 'CODEP-8821',
               title: 'Nasi Lemak Ayam + Iced Milo',
               items: [
                  { name: 'Nasi Lemak Ayam', qty: 1, price: 8.50 },
                  { name: 'Iced Milo', qty: 1, price: 3.00 }
               ],
               from: 'Cafe Block A',
               from_instructions: 'Go to the side counter and ask for Order #CODEP-8821.',
               to: 'Library East',
               to_instructions: 'I am wearing a red shirt. Leave at the main entrance desk if not seen.',
               customer: {
                  name: 'Amirul H.',
                  phone: '012-3456789',
                  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
               },
               payout: 4.50,
               status: 'active',
               step: 1,
               started_at: new Date().toISOString()
            }]
         }, { merge: true });
         // We don't navigate immediately so the user can see the "Accepted" state on the dashboard
         // But the profile listener will trigger hasActive update
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
                        <path d="M4 14h2v-2h2v-2h2V8h2v2h2v2h2v2h2v2h2v2h-2v-2h-2v-2h-2v-2h-2v2H8v2H6v2H4v-2z" />
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
                        <path d="M12 2v2h2v2h2v2h2v2h2v2h-2v2h-2v2h-2v2h-2v2h-2v-2H8v-2H6v-2H4v-2H2v-2h2v-2h2v-2h2v-2h2v-2h2v-2h2z" />
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
               <AnimatePresence mode="wait">
                  {isOnline ? (
                     <motion.div 
                        key="online-content"
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                     >
                        {hasActive ? (
                           <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-emerald-50/30 border border-emerald-100 rounded-[2.5rem] p-7 shadow-xl shadow-emerald-500/5 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                              onClick={() => router.push('/run/active')}
                           >
                              <div className="absolute top-0 right-0 p-5">
                                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                              </div>

                              <div className="relative z-10">
                                 <div className="flex items-center gap-2 mb-6">
                                    <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Order Accepted</span>
                                    <span className="text-[10px] font-bold text-emerald-600/50 uppercase tracking-widest">#{activeMissions[0]?.id || 'CODEP-0000'}</span>
                                 </div>

                                 <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-100 p-0.5 shadow-sm">
                                       <img 
                                         src={activeMissions[0]?.customer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeMissions[0]?.customer?.name || 'User'}`} 
                                         className="w-full h-full object-cover rounded-xl" 
                                       />
                                    </div>
                                    <div>
                                       <p className="text-[11px] font-black text-emerald-600/40 uppercase tracking-[0.2em] mb-0.5">Assigned Customer</p>
                                       <h3 className="text-[20px] font-bold text-navy tracking-tight">{activeMissions[0]?.customer?.name || 'Student Client'}</h3>
                                    </div>
                                 </div>

                                 <div className="space-y-6 relative mb-8">
                                    <div className="absolute left-[11px] top-6 bottom-6 w-0.5 border-l-2 border-emerald-200/50 border-dashed" />
                                    <div className="flex items-start gap-4 relative z-10">
                                       <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg shadow-emerald-500/20">1#</div>
                                       <div>
                                          <p className="text-[13px] font-bold text-navy leading-none">Pickup at {activeMissions[0]?.from || 'Vendor'}</p>
                                          <p className="text-[11px] font-medium text-slate-400 mt-1">Institutional Source</p>
                                       </div>
                                    </div>
                                    <div className="flex items-start gap-4 relative z-10">
                                       <div className="w-6 h-6 rounded-full bg-white text-slate-300 flex items-center justify-center text-[10px] font-black shrink-0 border border-slate-100">2#</div>
                                       <div>
                                          <p className="text-[13px] font-bold text-navy leading-none">Deliver to {activeMissions[0]?.to || 'Destination'}</p>
                                          <p className="text-[11px] font-medium text-slate-400 mt-1">Campus Drop-off</p>
                                       </div>
                                    </div>
                                 </div>

                                 <button className="w-full bg-[#0A0F1E] text-white h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-[14px] shadow-lg shadow-navy/20 active:scale-95 transition-all">
                                    <Navigation size={18} strokeWidth={2.5} /> Resume Mission Terminal
                                 </button>
                              </div>
                              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                           </motion.div>
                        ) : (
                           <div className="space-y-4">
                              <div className="flex items-center justify-between mb-5 px-1">
                                 <h3 className="text-[18px] font-bold text-navy tracking-tight">Active Pulse</h3>
                                 <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-500 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Live Orders</span>
                                 </div>
                              </div>
                              <div className="p-7 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-navy/5 flex flex-col gap-6 group relative overflow-hidden active:scale-[0.98] transition-all cursor-pointer">
                                 <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0 space-y-3">
                                       <div className="inline-flex items-center gap-2 px-3 py-1 bg-navy text-white rounded-lg">
                                          <Zap size={10} fill="currentColor" />
                                          <span className="text-[9px] font-black uppercase tracking-widest relative z-10">Flash Hustle</span>
                                       </div>
                                       <h4 className="text-[22px] font-bold text-navy leading-tight tracking-tight">Nasi Lemak Ayam + Iced Milo</h4>
                                       <div className="flex items-center gap-2 text-slate-400">
                                          <MapPin size={14} className="text-blue-500" />
                                          <p className="text-[13px] font-bold text-slate-500">Cafe Block A → Library East</p>
                                       </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                       <p className="text-[24px] font-black text-navy tracking-tighter leading-none whitespace-nowrap">+RM 4.50</p>
                                       <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2 whitespace-nowrap">Instant Ledger</p>
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
                                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Range</p>
                                       <p className="text-[13px] font-bold text-navy">450m</p>
                                    </div>
                                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
                                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Window</p>
                                       <p className="text-[13px] font-bold text-navy">8 min</p>
                                    </div>
                                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
                                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Load</p>
                                       <p className="text-[13px] font-bold text-navy">Light</p>
                                    </div>
                                 </div>
                                 <button onClick={handleAcceptOrder} disabled={isAccepting} className="w-full h-14 bg-navy text-white rounded-2xl font-bold text-[14px] shadow-lg shadow-navy/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                                    {isAccepting ? 'Synchronizing...' : <>Accept Directives <ChevronRight size={18}/></>}
                                 </button>
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                              </div>
                           </div>
                        )}
                     </motion.div>
                  ) : (
                     <motion.div 
                        key="offline-content"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="bg-slate-50/50 rounded-[2.5rem] py-16 px-8 text-center border border-dashed border-slate-200"
                     >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-50">
                           <Power size={24} className="text-slate-200" />
                        </div>
                        <p className="text-[17px] font-bold text-navy tracking-tight">Terminal Offline</p>
                        <p className="text-[13px] text-slate-400 mt-2 font-medium leading-relaxed">Activate your working status to receive institutional delivery directives.</p>
                     </motion.div>
                  )}
               </AnimatePresence>
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
