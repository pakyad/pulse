"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, X, Loader2, CheckCircle2, Settings, Package, Truck, MapPin, Zap, ChevronRight } from 'lucide-react';
import { completeDelivery } from '@/app/actions/deliveryActions';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/runner/LiveMap'), { ssr: false });

export default function CarrierTerminal() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeMission, setActiveMission] = useState<any>(null);
  const [podPhoto, setPodPhoto] = useState<File | null>(null);
  const [podPreview, setPodPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubActive: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // 1. Profile & Status Sync
        unsubProfile = onSnapshot(doc(db, "users", user.uid), (snap) => {
          const data = snap.data();
          if (!data?.is_verified_runner) {
            router.push('/run');
            return;
          }
          setProfile(data);
          setIsOnline(data.is_online ?? false);
          setLoading(false);
        });

        // 🏛️ REQ_F901: ACTIVE MISSION QUERY (The Banner Logic)
        // Strictly pulls orders assigned to THIS user that are still in progress
        const qActive = query(
          collection(db, "orders"), 
          where("runner_id", "==", user.uid), 
          where("status", "in", ["ON_THE_WAY", "PICKED_UP"])
        );

        unsubActive = onSnapshot(qActive, (snap) => {
          if (!snap.empty) {
            setActiveMission({ id: snap.docs[0].id, ...snap.docs[0].data() });
          } else {
            setActiveMission(null); // CRITICAL: This unmounts the active banner
          }
        });
      } else {
        router.push('/auth');
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubActive) unsubActive();
    };
  }, [router]);

  // 🏛️ REQ_F901: THE RADAR QUERY (Nearby Directives)
  useEffect(() => {
    // Only listen for new jobs if the runner is online AND doesn't have an active job
    if (!isOnline || activeMission) {
      setJobs([]);
      return;
    }

    // Query for orders waiting for a runner (AWAITING_RUNNER)
    // Note: 'deliveryType' matches the marketplace logic
    const qRadar = query(
      collection(db, "orders"), 
      where("deliveryType", "==", "RUNNER"),
      where("status", "==", "AWAITING_RUNNER")
    );

    const unsubRadar = onSnapshot(qRadar, (snap) => {
      // Secondary filter to ensure we don't pull jobs already claimed by someone else
      // This handles the race condition where status hasn't updated yet
      const available = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((j: any) => !j.runner_id);
      
      setJobs(available);
    });

    return () => unsubRadar();
  }, [isOnline, activeMission]);

  const toggleStatus = async () => {
    if (!auth.currentUser) return;
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
            is_online: newStatus,
            last_active: serverTimestamp()
        });
    } catch (e) {
        console.error("STATUS_TOGGLE_ERROR:", e);
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    if (!auth.currentUser || !isOnline) return;
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "orders", jobId);
        const snap = await tx.get(ref);
        if (!snap.exists() || snap.data().runner_id) throw "Job already claimed by another carrier.";
        
        tx.update(ref, { 
          runner_id: auth.currentUser?.uid, 
          runner_name: profile?.full_name || 'Verified Runner',
          status: 'ON_THE_WAY', 
          accepted_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      });
    } catch (e: any) { 
      alert(`System Error: ${e}`); 
    }
  };

  const handleActionClick = async () => {
    if (!activeMission) return;
    setIsUploading(true);
    try {
      if (activeMission.status === 'ON_THE_WAY') {
        await updateDoc(doc(db, "orders", activeMission.id), { 
          status: 'PICKED_UP',
          pickup_time: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      } else if (activeMission.status === 'PICKED_UP') {
        if (!podPhoto) {
            alert("Photo proof required to complete delivery.");
            setIsUploading(false);
            return;
        }
        const storageRef = ref(storage, `delivery_proofs/${activeMission.id}_${Date.now()}.jpg`);
        const result = await uploadBytes(storageRef, podPhoto);
        const url = await getDownloadURL(result.ref);
        const res = await completeDelivery(activeMission.id, url);
        if (res.success) {
           await updateDoc(doc(db, "users", auth.currentUser!.uid), {
             balance: (profile?.balance || 0) + (activeMission.deliveryFee || 4.50)
           });
           setPodPhoto(null);
           setPodPreview(null);
        }
      }
    } catch (e: any) { alert(e); } finally { setIsUploading(false); }
  };

  if (loading) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-navy" size={32} />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Synchronizing Node...</p>
    </div>
  );

  return (
    <div className="h-screen w-full bg-white flex flex-col overflow-hidden relative">
      
      {/* 1. Header Segment */}
      <div className="shrink-0 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100 px-6 py-5 relative z-[100] flex items-center justify-between">
         <button onClick={() => router.push('/home')} className="flex items-center text-slate-400 hover:text-navy active:scale-95 transition-all">
            <ChevronRight className="rotate-180 mr-2" size={18} />
            <span className="text-[13px] font-bold tracking-tight">Back to Campus</span>
         </button>
         
         <div className="flex items-center gap-3">
            <span className={`text-[10px] font-black tracking-widest uppercase transition-colors ${isOnline ? 'text-emerald-500' : 'text-slate-300'}`}>
               {isOnline ? 'Terminal Online' : 'Offline'}
            </span>
            <button 
               onClick={toggleStatus}
               className={`w-[48px] h-[26px] rounded-full p-[2px] transition-all duration-500 ease-in-out shrink-0 ${isOnline ? 'bg-navy' : 'bg-slate-100'}`}
            >
               <div className={`w-[22px] h-[22px] bg-white rounded-full shadow-lg transform transition-transform duration-500 ease-in-out ${isOnline ? 'translate-x-[22px]' : 'translate-x-0'}`} />
            </button>
         </div>
      </div>

      {/* 2. Map Segment (Sticky Top Half) */}
      <div className="w-full h-[35vh] bg-slate-50 relative shrink-0">
         <LiveMap hasActiveJob={!!activeMission} />
         <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white/20 to-transparent" />
      </div>

      {/* 3. Logic Segment: Radar vs Mission Detail */}
      <div className="bg-white w-full flex-1 rounded-t-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] z-10 -mt-6 p-6 flex flex-col overflow-y-auto no-scrollbar">
         
         <AnimatePresence mode="wait">
            {activeMission ? (
               /* 🏛️ ACTIVE MISSION STATE */
               <motion.div 
                 key="active-mission"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 20 }}
                 className="flex-1 flex flex-col"
               >
                  <div className="flex justify-between items-end mb-6">
                     <div>
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-400">Current Mission</p>
                        <h2 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase mt-1">#{activeMission.id.substring(0,8).toUpperCase()}</h2>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-neutral-400">Est. Payout</p>
                        <p className="text-2xl font-black text-neutral-900 tracking-tighter mt-1">RM {(activeMission.deliveryFee || 4.50).toFixed(2)}</p>
                     </div>
                  </div>

                  <div className="bg-neutral-50 rounded-[16px] p-5 my-6 border border-neutral-100 space-y-4">
                     <div className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-black rounded-full mt-2 shrink-0" />
                        <div>
                           <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Pickup Node</p>
                           <p className="text-[15px] font-bold text-neutral-900">{activeMission.sellerName || 'Verified Vendor'}</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-4">
                        <div className="w-2 h-2 border-2 border-black rounded-full mt-2 shrink-0" />
                        <div>
                           <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Delivery Hub</p>
                           <p className="text-[15px] font-bold text-neutral-900">{activeMission.dropOffLocation || 'Campus Hub'}</p>
                        </div>
                     </div>
                  </div>

                  {podPreview && (
                     <div className="relative w-full h-40 rounded-[20px] overflow-hidden border border-neutral-100 mb-6">
                        <img src={podPreview} className="w-full h-full object-cover" />
                        <button onClick={() => {setPodPhoto(null); setPodPreview(null);}} className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-lg"><X size={16}/></button>
                     </div>
                  )}

                  <div className="mt-auto pt-6 space-y-4">
                     {activeMission.status === 'ON_THE_WAY' ? (
                        <button 
                           onClick={handleActionClick}
                           disabled={isUploading}
                           className="w-full h-16 bg-navy text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                           {isUploading ? <Loader2 className="animate-spin" /> : <Package size={18} />}
                           Confirm Item Pickup
                        </button>
                     ) : (
                        <div className="flex flex-col gap-3">
                           {!podPreview ? (
                              <label className="w-full h-16 bg-navy text-white rounded-2xl font-black text-[13px] uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer shadow-xl">
                                 <Camera size={18} />
                                 Capture Proof
                                 <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if(file) { setPodPhoto(file); setPodPreview(URL.createObjectURL(file)); }
                                 }} />
                              </label>
                           ) : (
                              <button 
                                 onClick={handleActionClick}
                                 disabled={isUploading}
                                 className="w-full h-16 bg-emerald-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                              >
                                 {isUploading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={18} />}
                                 Finalize Delivery
                              </button>
                           )}
                        </div>
                     )}
                  </div>
               </motion.div>
            ) : (
               /* 🏛️ IDLE RADAR STATE */
               <motion.div 
                 key="radar"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="flex-1 flex flex-col"
               >
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-[10px] font-black text-neutral-400 tracking-[0.2em] uppercase">Nearby Directives</h3>
                     <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        <span className="text-[9px] font-black uppercase text-slate-400">{isOnline ? 'Scanning...' : 'Radar Offline'}</span>
                     </div>
                  </div>

                  {jobs.length > 0 ? (
                     <div className="space-y-4">
                        {jobs.map(job => (
                           <div key={job.id} className="bg-neutral-50 rounded-[20px] p-6 border border-neutral-100 flex items-center justify-between">
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{job.title?.substring(0, 20) || 'Marketplace Item'}</p>
                                 <p className="text-xl font-black text-neutral-900 tracking-tighter">RM {(job.deliveryFee || 4.50).toFixed(2)}</p>
                              </div>
                              <button 
                                 onClick={() => handleAcceptJob(job.id)}
                                 className="bg-navy text-white px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                              >
                                 Claim Job
                              </button>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="flex-1 flex flex-col items-center justify-center py-12 text-center opacity-30">
                        <Truck size={40} className="mb-4" />
                        <p className="text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                           {isOnline ? 'Radar is Clear.\nWaiting for new missions.' : 'Go Online to Sync\nwith the Logistics Registry.'}
                        </p>
                     </div>
                  )}
               </motion.div>
            )}
         </AnimatePresence>

         {/* 🏛️ REQ_F901: CONDITIONAL BANNER RENDERING */}
         {/* This banner ONLY mounts if activeMission !== null */}
         {activeMission && (
            <motion.div 
               initial={{ y: 100 }}
               animate={{ y: 0 }}
               className="fixed bottom-24 left-6 right-6 bg-[#0A0F1E] text-white p-6 rounded-[22px] flex items-center justify-between shadow-2xl z-[200] border border-white/5"
            >
               <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
                  <div>
                     <p className="text-[13px] font-bold tracking-tight">Delivering Order</p>
                     <p className="text-[10px] font-medium text-white/50">Active Delivery • 8 mins est.</p>
                  </div>
               </div>
               <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <ChevronRight size={16} className="text-white/40" />
               </div>
            </motion.div>
         )}

         {/* Stats Row */}
         <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
               <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-1">Session Revenue</p>
               <p className="text-[16px] font-black text-neutral-900">RM {(profile?.balance || 0).toFixed(2)}</p>
            </div>
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100">
               <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-1">Audit Score</p>
               <p className="text-[16px] font-black text-neutral-900">4.95</p>
            </div>
         </div>
      </div>
    </div>
  );
}
