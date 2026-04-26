'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Clock, ShieldAlert, FileText, Globe, Home, Zap, Package, ChevronRight, Activity, TrendingUp } from 'lucide-react';
import RunnerOnboarding from './onboarding/page'; 
import { motion } from 'framer-motion';

function RunnerDashboard({ profile }: { profile: any }) {
   const router = useRouter();
   const activeMissions = profile?.current_missions || [];
   const hasActive = activeMissions.length > 0;

   return (
      <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">
         <div className="pt-28 px-6 space-y-16 pb-12">
            
            {/* Minimal Header area */}
            <header className="flex flex-col gap-2">
               <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Terminal Online</span>
               </div>
               <h1 className="text-[32px] font-bold tracking-tight leading-tight">Runner Hub</h1>
            </header>

            {/* Earnings Card - Matching "The Essentials" Glass/Texture style */}
            <motion.div 
               animate={{ y: [0, -4, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               whileTap={{ scale: 0.98 }}
               className="bg-navy rounded-[2.5rem] p-8 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-navy/20"
            >
               {/* Pixelated Carbon Overlay for pulse aesthetic */}
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none image-rendering-pixelated" />
               <div className="absolute -top-10 -right-10 p-6 opacity-5 rotate-12 pointer-events-none blur-sm">
                  <TrendingUp size={160} />
               </div>
               
               <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1 relative z-10">Today's Yield</p>
               <div className="flex items-end gap-2 mb-8 relative z-10">
                  <span className="text-[48px] font-black leading-none tracking-tighter">RM 0.00</span>
                  <span className="text-[14px] font-bold text-white/50 mb-1.5">/ 0 runs</span>
               </div>
               
               <div className="flex gap-4 relative z-10">
                  <div className="flex-1 bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10 flex flex-col items-start shadow-inner">
                     <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Trust Score</p>
                     <p className="text-[18px] font-black mt-1 text-white">100%</p>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10 flex flex-col items-start shadow-inner">
                     <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Time Online</p>
                     <p className="text-[18px] font-black mt-1 text-white">0h 0m</p>
                  </div>
               </div>
            </motion.div>

            {/* Current Active Mission */}
            <div>
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[18px] font-bold text-navy tracking-tight">Active Directives</h3>
               </div>
               {hasActive ? (
                  <motion.div 
                     whileTap={{ scale: 0.98 }}
                     onClick={() => router.push(`/runner/active?order=${activeMissions[0]}`)}
                     className="bg-white border-2 border-emerald-500/20 rounded-3xl p-6 shadow-sm flex items-center justify-between cursor-pointer group hover:border-emerald-500/40 transition-all"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                           <Zap size={24} fill="currentColor" className="relative z-10" />
                        </div>
                        <div>
                           <h4 className="text-[15px] font-bold tracking-tight mb-0.5 text-navy">Mission in Progress</h4>
                           <p className="text-[12px] font-medium text-slate-400">Tap to view waypoints</p>
                        </div>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <ChevronRight size={18} className="text-emerald-600" />
                     </div>
                  </motion.div>
               ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                     <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 relative z-10">
                        <Package size={28} className="text-slate-300" />
                     </div>
                     <p className="text-[14px] font-bold text-navy mb-1 tracking-tight relative z-10">No Active Missions</p>
                     <p className="text-[12px] font-medium text-slate-400 relative z-10">You are currently idle on the network.</p>
                  </div>
               )}
            </div>

            {/* Mission Pool Radar */}
            <div>
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[18px] font-bold text-navy tracking-tight">Network Radar</h3>
               </div>
               <motion.div 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/missions')}
                  className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm cursor-pointer relative overflow-hidden group hover:border-blue-100 transition-all hover:shadow-md"
               >
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-blue-50 border border-blue-100 text-blue-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
                           <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
                           <Activity size={28} className="relative z-10" />
                        </div>
                        <div>
                           <h4 className="text-[16px] font-bold tracking-tight text-navy mb-0.5">Mission Pool</h4>
                           <p className="text-[12px] font-medium text-slate-400">Scan for available deliveries</p>
                        </div>
                     </div>
                     <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
               </motion.div>
            </div>
         </div>
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
