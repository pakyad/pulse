'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Clock, ShieldAlert, FileText, Globe, Home, Zap, Package, ChevronRight, Activity, TrendingUp, Search, ChevronLeft, Bell, MapPin, Flame, Power, Navigation, Phone, X } from 'lucide-react';
import RunnerOnboarding from './onboarding/page'; 
import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import SearchOverlay from '@/components/shared/SearchOverlay';

function RunnerDashboard({ profile }: { profile: any }) {
   const router = useRouter();
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [isOnline, setIsOnline] = useState(false);
   const activeMissions = profile?.current_missions || [];
   const hasActive = activeMissions.length > 0;

   return (
      <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">
         
         {/* ── FIXED NAV ── */}
         <nav className="fixed top-0 left-0 right-0 z-50 px-5 pt-8 pb-4 flex items-center gap-3 bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-navy/40 hover:text-navy transition-all active:scale-90">
               <ChevronLeft size={28} strokeWidth={2} />
            </button>
            <div className="flex-1">
               <button onClick={() => setIsSearchOpen(true)} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-full flex items-center px-4 gap-3">
                  <Search size={18} className="text-slate-300" />
                  <span className="text-[13px] font-bold text-slate-300">Search</span>
               </button>
            </div>
            <div className="flex items-center gap-3 shrink-0">
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
            
            {/* ── 1. STATUS TOGGLE (Online/Offline) ── */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm flex items-center justify-between">
               <div className="flex flex-col">
                  <h3 className="text-[18px] font-bold text-navy tracking-tight">Status</h3>
                  <p className="text-[13px] text-slate-400 mt-0.5">{isOnline ? 'You are receiving jobs' : 'You are currently resting'}</p>
               </div>
               <button 
                  onClick={() => setIsOnline(!isOnline)}
                  className={`w-[68px] h-[36px] rounded-full relative transition-colors duration-300 shadow-inner ${isOnline ? 'bg-emerald-500' : 'bg-slate-200'}`}
               >
                  <motion.div 
                     layout
                     className="w-7 h-7 bg-white rounded-full absolute top-1 shadow-md"
                     initial={false}
                     animate={{ x: isOnline ? 36 : 4 }}
                  />
               </button>
            </div>

            {/* ── 2. EARNINGS CARD (Ledger) ── */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
               <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Today's Earnings</p>
                  <button onClick={() => router.push('/admin/ledger')} className="px-4 py-2 bg-[#F6F7F9] text-navy font-bold text-[11px] rounded-xl active:scale-95 transition-all">
                     Withdraw
                  </button>
               </div>
               <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-[42px] font-bold tracking-tight text-navy leading-none">RM 45.00</span>
               </div>
               
               <div className="flex gap-4 border-t border-slate-100 pt-5">
                  <div className="flex-1 flex flex-col items-start">
                     <p className="text-[12px] font-medium text-slate-400 mb-0.5">Rating</p>
                     <p className="text-[18px] font-bold text-navy">4.9 <span className="text-[12px] text-slate-400 font-medium">/ 5</span></p>
                  </div>
                  <div className="w-[1px] bg-slate-100" />
                  <div className="flex-1 flex flex-col items-start pl-2">
                     <p className="text-[12px] font-medium text-slate-400 mb-0.5">Completion</p>
                     <p className="text-[18px] font-bold text-navy">98%</p>
                  </div>
               </div>
            </div>

            {/* ── 3. MISSION TERMINAL (Active or Available) ── */}
            <div>
               {hasActive ? (
                  /* ── ACTIVE DELIVERY MEGA-CARD ── */
                  <div className="bg-white border-2 border-emerald-500 rounded-[2rem] p-6 shadow-lg shadow-emerald-500/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                      <div className="relative z-10">
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                               <h3 className="text-[16px] font-bold text-navy">Active Delivery</h3>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">In Progress</span>
                         </div>
                         
                         <div className="space-y-4 mb-8">
                            <div className="flex gap-4">
                               <div className="flex flex-col items-center mt-1">
                                  <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-white" />
                                  <div className="w-[2px] h-10 bg-slate-100" />
                                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                               </div>
                               <div className="flex-1 space-y-4">
                                  <div>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pick up</p>
                                     <p className="text-[15px] font-bold text-navy leading-tight">Cafe Block A</p>
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Drop off</p>
                                     <p className="text-[15px] font-bold text-navy leading-tight">Library East (Level 2)</p>
                                  </div>
                               </div>
                            </div>
                         </div>

                         <div className="flex gap-3">
                            <button onClick={() => router.push('/runner/active')} className="flex-1 bg-navy text-white h-12 rounded-[1.2rem] flex items-center justify-center gap-2 font-bold text-[13px] shadow-sm active:scale-95 transition-all">
                               <Navigation size={16} /> Open Map
                            </button>
                            <button className="w-12 h-12 bg-slate-50 text-navy rounded-[1.2rem] flex items-center justify-center border border-slate-100 active:scale-95 transition-all">
                               <Phone size={18} />
                            </button>
                         </div>
                      </div>
                  </div>
               ) : (
                  /* ── AVAILABLE JOBS FEED ── */
                  <>
                     <div className="flex items-center gap-2 mb-5">
                        <h3 className="text-[18px] font-bold text-navy tracking-tight">Available Jobs</h3>
                        {isOnline && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />}
                     </div>
                     
                     <AnimatePresence mode="wait">
                        {isOnline ? (
                           <motion.div 
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              className="space-y-4"
                           >
                              {/* Job Request Card */}
                              <motion.div className="bg-white border border-slate-100 rounded-[1.5rem] p-5 shadow-sm">
                                 <div className="flex justify-between items-start mb-4">
                                    <div>
                                       <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-widest">Food</span>
                                       <h4 className="text-[16px] font-bold text-navy mt-2 leading-tight">Nasi Lemak Ayam</h4>
                                       <p className="text-[12px] font-medium text-slate-400 mt-0.5">Estimated 15 mins</p>
                                    </div>
                                    <p className="text-[18px] font-black text-navy">RM 4.00</p>
                                 </div>
                                 <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400 bg-[#F6F7F9] p-3 rounded-xl mb-4">
                                    <span className="flex items-center gap-1 text-navy"><MapPin size={14}/> Cafe Block A</span>
                                    <ChevronRight size={14} className="text-slate-300"/>
                                    <span>Library East</span>
                                 </div>
                                 <div className="flex gap-3">
                                    <button onClick={() => router.push('/missions')} className="flex-1 bg-emerald-500 text-white h-11 rounded-[1rem] font-bold text-[13px] shadow-sm active:scale-95 transition-all">
                                       Accept Job
                                    </button>
                                    <button className="w-11 h-11 bg-slate-50 text-slate-400 rounded-[1rem] flex items-center justify-center active:scale-95 transition-all">
                                       <X size={18} />
                                    </button>
                                 </div>
                              </motion.div>
                           </motion.div>
                        ) : (
                           <motion.div 
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="bg-[#F6F7F9] rounded-[2rem] p-8 flex flex-col items-center justify-center text-center border border-slate-50"
                           >
                              <p className="text-[15px] font-bold text-navy mb-1">You are Offline</p>
                              <p className="text-[13px] text-slate-400">Turn on your status to see live jobs.</p>
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </>
               )}
            </div>

            {/* ── 4. LIVE NETWORK HEATMAP (Deep Hotzones) ── */}
            <div>
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[18px] font-bold text-navy tracking-tight">Live Network Heatmap</h3>
                  <div className="px-2.5 py-1 bg-red-50 text-red-500 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border border-red-100">
                     <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
                  </div>
               </div>
               
               <button onClick={() => router.push('/missions')} className="w-full bg-[#F6F7F9] rounded-[2rem] p-6 relative overflow-hidden text-left border border-slate-50 shadow-sm active:scale-[0.98] transition-all group">
                  {/* Abstract Radar Background */}
                  <div className="absolute right-[-20%] top-[-20%] w-[150%] aspect-square rounded-full border border-red-500/10 pointer-events-none" />
                  <div className="absolute right-[-10%] top-[-10%] w-[130%] aspect-square rounded-full border border-red-500/10 pointer-events-none" />
                  <div className="absolute right-0 top-0 w-[110%] aspect-square rounded-full bg-linear-to-bl from-red-500/5 to-transparent pointer-events-none" />
                  
                  <div className="relative z-10">
                     <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-red-500 border border-slate-100 shrink-0">
                           <Flame size={26} />
                        </div>
                        <div>
                           <p className="text-[11px] font-black text-red-500 uppercase tracking-widest mb-0.5">Surge Pricing Active</p>
                           <h4 className="text-[20px] font-bold text-navy leading-tight">Library East</h4>
                        </div>
                     </div>
                     
                     <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                           <span className="text-[13px] font-bold text-slate-500">Current Demand</span>
                           <span className="text-[13px] font-black text-navy">Very High</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                           <div className="w-[85%] h-full bg-red-500 rounded-full" />
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-100/50 mt-1">
                           <span className="text-[13px] font-bold text-slate-500">Earnings Multiplier</span>
                           <span className="text-[13px] font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">x1.5 Payout</span>
                        </div>
                     </div>
                  </div>
               </button>
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
      if (!user) {
        setStatus('verified'); // Forced for preview
        return;
      }
      try {
        const docRef = doc(db, "users", user.uid);
        
        // Use onSnapshot to keep dashboard data (like active missions) fresh
        unsubProfile = onSnapshot(docRef, (docSnap) => {
           if (docSnap.exists()) {
             const data = docSnap.data();
             setProfile(data);
             setStatus('verified'); // Forced for preview
           } else {
             setStatus('verified');
           }
        });
      } catch (error) {
        console.error("Verification check failed:", error);
        setStatus('verified');
      }
    });
    return () => {
       unsub();
       if (unsubProfile) unsubProfile();
    };
  }, []);

  if (status === 'loading') {
      return (
        <main className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
        </main>
      );
  }

  // Handle Pending State Appearance
  if (status === 'pending') {
    return (
      <main className="h-screen h-[100svh] bg-[#FDFDFD] px-8 flex flex-col py-10 font-sans text-navy antialiased overflow-hidden">
        <button 
          onClick={() => router.push('/home')}
          className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-navy hover:bg-slate-50 transition-all shadow-sm shrink-0"
        >
          <Home size={20} strokeWidth={1.5} />
        </button>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full space-y-10">
           <div className="w-16 h-16 bg-blue-50 text-accent rounded-[2rem] flex items-center justify-center shadow-inner shrink-0">
             <Clock size={28} strokeWidth={1.5} />
           </div>

           <div className="space-y-3">
             <h1 className="text-[32px] font-bold tracking-tight leading-tight">Registry Under <br/> Review</h1>
             <p className="text-[14px] text-slate-400 font-medium leading-relaxed">
               Your carrier application is currently being analyzed by the Pulse Protocol. Approval is typically cleared within 24 hours.
             </p>
           </div>

           <div className="space-y-4">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Phase Status</h3>
             <div className="space-y-2">
                {[
                  { icon: ShieldAlert, label: 'Identity Vetting', status: 'In-Progress' },
                  { icon: FileText, label: 'Campus Authorization', status: 'Pending' },
                  { icon: Globe, label: 'Ledger Synchronization', status: 'Waiting' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className="text-slate-300" />
                      <span className="font-bold text-[14px]">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-accent">{item.status}</span>
                  </div>
                ))}
             </div>
           </div>

           <div className="pt-4">
              <p className="text-[12px] text-slate-400 font-medium text-center">
                You will receive a notification <br/> once your terminal is active.
              </p>
           </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {status === 'verified' ? <RunnerDashboard profile={profile} /> : <RunnerOnboarding />}
    </>
  );
}
