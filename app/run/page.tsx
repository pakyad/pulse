'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Clock, ShieldAlert, FileText, Globe, Home, Zap, Package, ChevronRight, Activity, TrendingUp, Search, ChevronLeft, Bell } from 'lucide-react';
import RunnerOnboarding from './onboarding/page'; 
import { motion } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import SearchOverlay from '@/components/shared/SearchOverlay';

function RunnerDashboard({ profile }: { profile: any }) {
   const router = useRouter();
   const [isSearchOpen, setIsSearchOpen] = useState(false);
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
                  <span className="text-[13px] font-bold text-slate-300">Search Pulse</span>
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

         <div className="pt-28 px-5 space-y-12 pb-12">
            
            {/* Minimal Header area */}
            <div>
               <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Runner Terminal</p>
               <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[11px] font-medium text-slate-400">Online & Synchronized</p>
               </div>
            </div>

            {/* Earnings Card - Soft & Smooth Gradient */}
            <motion.div 
               whileTap={{ scale: 0.98 }}
               className="bg-linear-to-br from-[#1877F2] to-[#0A58CA] rounded-[2rem] p-7 text-white flex flex-col justify-between relative overflow-hidden shadow-lg shadow-blue-500/20"
            >
               {/* Soft Abstract Shapes */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
               <div className="absolute bottom-0 right-10 w-32 h-32 bg-blue-300 opacity-20 rounded-full blur-2xl pointer-events-none" />
               
               <p className="text-[12px] font-medium text-white/80 mb-2 relative z-10">Today's Yield</p>
               <div className="flex items-baseline gap-2 mb-8 relative z-10">
                  <span className="text-[42px] font-bold tracking-tight leading-none">RM 0.00</span>
                  <span className="text-[14px] font-medium text-white/80">/ 0 runs</span>
               </div>
               
               <div className="flex gap-3 relative z-10">
                  <div className="flex-1 bg-white/10 rounded-[1.2rem] p-4 flex flex-col items-start backdrop-blur-sm">
                     <p className="text-[11px] font-medium text-white/80 mb-1">Trust Score</p>
                     <p className="text-[16px] font-bold text-white tracking-tight">100%</p>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-[1.2rem] p-4 flex flex-col items-start backdrop-blur-sm">
                     <p className="text-[11px] font-medium text-white/80 mb-1">Time Online</p>
                     <p className="text-[16px] font-bold text-white tracking-tight">0h 0m</p>
                  </div>
               </div>
            </motion.div>

            {/* Current Active Mission */}
            <div>
               <div className="flex justify-between items-center mb-5">
                  <h3 className="text-[18px] font-bold text-navy tracking-tight">Active Directives</h3>
               </div>
               {hasActive ? (
                  <motion.div 
                     whileTap={{ scale: 0.98 }}
                     onClick={() => router.push(`/runner/active?order=${activeMissions[0]}`)}
                     className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm flex items-center justify-between cursor-pointer group"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[1.2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                           <Zap size={22} fill="currentColor" />
                        </div>
                        <div>
                           <h4 className="text-[15px] font-bold tracking-tight text-navy mb-0.5">Mission in Progress</h4>
                           <p className="text-[12px] font-medium text-slate-400">Tap to view waypoints</p>
                        </div>
                     </div>
                     <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                  </motion.div>
               ) : (
                  <div className="bg-white border border-slate-100 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-sm">
                     <div className="w-14 h-14 bg-slate-50 rounded-[1.2rem] flex items-center justify-center mb-4">
                        <Package size={24} className="text-slate-300" />
                     </div>
                     <p className="text-[15px] font-bold text-navy mb-1 tracking-tight">No Active Missions</p>
                     <p className="text-[12px] font-medium text-slate-400">You are currently idle on the network.</p>
                  </div>
               )}
            </div>

            {/* Mission Pool Radar */}
            <div>
               <div className="flex justify-between items-center mb-5">
                  <h3 className="text-[18px] font-bold text-navy tracking-tight">Network Radar</h3>
               </div>
               <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/missions')}
                  className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm cursor-pointer flex items-center justify-between group"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-[1.2rem] flex items-center justify-center shrink-0">
                        <Activity size={22} />
                     </div>
                     <div>
                        <h4 className="text-[15px] font-bold tracking-tight text-navy mb-0.5">Mission Pool</h4>
                        <p className="text-[12px] font-medium text-slate-400">Scan for available deliveries</p>
                     </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
               </motion.div>
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
