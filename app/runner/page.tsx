"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ShieldCheck, Truck, MapPin, ChevronRight, Activity, Zap } from 'lucide-react';

export default function MobileRunnerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let unsubJobs: (() => void) | null = null;
    let unsubActive: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/auth'); return; }

      // 1. Verify Institutional Clearance
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      setProfile(userData);

      if (!userData?.is_verified_runner) {
        // Redirect if not a verified runner node
        router.push('/home'); return;
      }

      // 2. Sync Available Radar Jobs (Institutional Gating)
      // Query for orders that are explicitly waiting for a runner
      const qJobs = query(
        collection(db, "orders"), 
        where("status", "==", "AWAITING_RUNNER"),
        where("deliveryType", "==", "RUNNER")
      );
      
      unsubJobs = onSnapshot(qJobs, (snap) => {
        setNearbyJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

      // 3. Sync Current Active Job (Assigned to this runner)
      const qActive = query(
        collection(db, "orders"),
        where("runner_id", "==", user.uid),
        where("status", "in", ["ON_THE_WAY", "PICKED_UP", "ARRIVED"])
      );

      unsubActive = onSnapshot(qActive, (snap) => {
        if (!snap.empty) {
          setActiveJob({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setActiveJob(null);
        }
      });
    });

    return () => {
      unsubAuth();
      if (unsubJobs) unsubJobs();
      if (unsubActive) unsubActive();
    };
  }, [router]);

  const handleAcceptJob = async (orderId: string) => {
    if (!auth.currentUser || !isOnline) return;
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: 'ON_THE_WAY',
        runner_id: auth.currentUser.uid,
        runner_name: profile?.full_name || 'Verified Runner',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Job Acceptance Error:", e);
      alert("Job synchronization failed. Another node may have accepted.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center animate-pulse">
        <Zap size={24} className="text-slate-200" />
      </div>
      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-300">Synchronizing Radar...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-teal-50 text-[#1C1C1E]">
      
      {/* ── Top Bar ── */}
      <div className="bg-white sticky top-0 z-20 px-6 py-6 flex items-center justify-between border-b-[0.5px] border-[#F2F2F7]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white"><Truck size={18} /></div>
          <h1 className="text-[20px] font-black tracking-tighter uppercase">Runner Radar</h1>
        </div>
        <div className="flex items-center gap-3">
           <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isOnline ? 'text-teal-500' : 'text-slate-300'}`}>
              {isOnline ? 'Active' : 'Offline'}
           </span>
           <button 
             onClick={() => setIsOnline(!isOnline)}
             className={`w-12 h-7 rounded-full relative transition-all duration-300 ${isOnline ? 'bg-teal-500' : 'bg-slate-100'}`}
           >
             <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
           </button>
        </div>
      </div>

      <main className="flex-1 pb-40">
         {/* ── Active Job Spotlight ── */}
         {activeJob ? (
           <div className="p-6 border-b-[0.5px] border-[#F2F2F7] bg-slate-50/30">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-600">Active Delivery In Progress</p>
              </div>
              
              <div className="bg-white p-6 rounded-[32px] border-[0.5px] border-[#F2F2F7] shadow-xl shadow-black/5 space-y-6">
                 <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <h3 className="text-[22px] font-black tracking-tight leading-none">{activeJob.title}</h3>
                       <p className="text-[14px] font-medium text-slate-400">Order #{activeJob.id.substring(0,6).toUpperCase()}</p>
                    </div>
                    <div className="px-3 py-1 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                       {activeJob.status.replace('_', ' ')}
                    </div>
                 </div>

                 <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><MapPin size={18} /></div>
                       <div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Drop-off Point</p>
                          <p className="text-[15px] font-bold">{activeJob.dropOffLocation || 'Unspecified Hub'}</p>
                       </div>
                    </div>
                 </div>

                 <button 
                  onClick={() => router.push(`/orders/${activeJob.id}`)}
                  className="w-full h-14 bg-black text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all"
                 >
                    View Logistics Map
                 </button>
              </div>
           </div>
         ) : (
           <div className="p-8 text-center border-b-[0.5px] border-[#F2F2F7]">
              <p className="text-[12px] font-bold text-slate-300 tracking-tight">No active assignments assigned to your node.</p>
           </div>
         )}

         {/* ── Available Jobs (Radar) ── */}
         <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-[18px] font-black tracking-tight">Nearby Deliveries</h2>
               <div className="flex items-center gap-2">
                  <Activity size={14} className="text-teal-500" />
                  <span className="text-[11px] font-bold text-teal-500 uppercase tracking-widest">Live Radar</span>
               </div>
            </div>
            
            <div className="space-y-4">
               {nearbyJobs.length === 0 ? (
                 <div className="py-20 flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"><Zap size={32} /></div>
                    <p className="text-[14px] font-medium text-slate-400 px-12">Radar is clear. New deliveries will appear here as students place orders.</p>
                 </div>
               ) : (
                 nearbyJobs.map((job) => (
                   <div key={job.id} className="p-6 bg-white rounded-[24px] border-[0.5px] border-[#F2F2F7] flex items-center justify-between group hover:border-black/5 transition-all">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 bg-[#F2F2F7] rounded-2xl flex items-center justify-center text-black font-black text-[14px]">RM</div>
                         <div>
                            <p className="text-[17px] font-black tracking-tight leading-none">RM {(3.50).toFixed(2)}</p>
                            <p className="text-[12px] font-medium text-slate-400 mt-1">{job.dropOffLocation?.split('—')[0] || 'Campus Hub'}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => handleAcceptJob(job.id)}
                        disabled={!isOnline}
                        className={`px-6 py-3 bg-black text-white rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${isOnline ? 'hover:scale-105 active:scale-95' : 'opacity-20 cursor-not-allowed'}`}
                      >
                         Accept Job
                      </button>
                   </div>
                 ))
               )}
            </div>
         </div>
      </main>

      {/* ── Fixed Bottom Nav ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t-[0.5px] border-[#F2F2F7] pb-10 pt-4 px-10 z-30">
         <div className="flex items-center justify-between max-w-sm mx-auto">
            <button className="flex flex-col items-center gap-1.5 transition-all active:scale-90"><Zap size={22} className="text-black" /><span className="text-[9px] font-black uppercase tracking-widest">Radar</span></button>
            <button className="flex flex-col items-center gap-1.5 opacity-20 transition-all active:scale-90"><Activity size={22} /><span className="text-[9px] font-black uppercase tracking-widest">Analytics</span></button>
            <button className="flex flex-col items-center gap-1.5 transition-all active:scale-90" onClick={() => router.push('/home')}><ChevronRight size={22} /><span className="text-[9px] font-black uppercase tracking-widest">Exit</span></button>
         </div>
      </div>

    </div>
  );
}
