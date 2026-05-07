"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Camera, X, Loader2, CheckCircle2, 
  MapPin, Zap, ChevronRight, Phone, MessageSquare, 
  Navigation, Check, Package, Activity, AlertCircle, 
  Wifi, DollarSign, Target, Award,
  Clock, TrendingUp, ShieldCheck, Box
} from 'lucide-react';
import { completeDelivery } from '@/app/actions/deliveryActions';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/runner/LiveMap'), { ssr: false });

// ── VOXEL BENTO ENGINE: 3D DEPTH INTERFACE ──
const VoxelBento = ({ label, value, icon: Icon, color = "text-slate-900", delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', damping: 20 }}
    whileHover={{ y: -4 }}
    whileTap={{ y: 2, scale: 0.98 }}
    className="bg-white p-6 rounded-[24px] border-[0.5px] border-slate-100 shadow-[0_8px_0_0_#F1F5F9] hover:shadow-[0_12px_0_0_#F1F5F9] active:shadow-none transition-all duration-200 flex flex-col justify-between aspect-square relative overflow-hidden group"
  >
    <div className="absolute -right-2 -top-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
       <Icon size={80} strokeWidth={1} />
    </div>
    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border-[0.5px] border-slate-100">
      <Icon size={18} strokeWidth={1.5} />
    </div>
    <div className="z-10">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className={`text-[18px] font-black tracking-tight ${color}`}>{value}</p>
    </div>
  </motion.div>
);

export default function RunnerTerminal() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeMission, setActiveMission] = useState<any>(null);
  const [podPhoto, setPodPhoto] = useState<File | null>(null);
  const [podPreview, setPodPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proofMode, setProofMode] = useState<'PICKUP' | 'DELIVERY' | null>(null);
  const [checklist, setChecklist] = useState({ condition: false, security: false });

  // ── LOGISTICS STATE LISTENERS ──
  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubActive: (() => void) | null = null;
    let unsubRadar: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        unsubProfile = onSnapshot(doc(db, "users", user.uid), (snap) => {
          const data = snap.data();
          if (!data?.is_verified_runner) { router.push('/run'); return; }
          setProfile(data);
          setIsOnline(data.is_online ?? false);
          setLoading(false);
        });

        // Query active missions assigned to this runner
        const qActive = query(
          collection(db, "orders"), 
          where("runner_id", "==", user.uid), 
          where("status", "in", ["IN_TRANSIT", "PICKED_UP", "ARRIVED_AT_DESTINATION"])
        );
        unsubActive = onSnapshot(qActive, (snap) => {
          if (!snap.empty) {
            setActiveMission({ id: snap.docs[0].id, ...snap.docs[0].data() });
          } else {
            setActiveMission(null);
          }
        });

        // Radar: Discovery Pool (AWAITING_RUNNER)
        const qRadar = query(
          collection(db, "orders"), 
          where("status", "==", "AWAITING_RUNNER")
        );
        unsubRadar = onSnapshot(qRadar, (snap) => {
          // 🏛️ Pulse Force-Sync: Show ALL awaiting orders to eliminate "Ghost Order" bugs
          const allAwaiting = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setJobs(allAwaiting);
        }, (error) => {
          console.error("Radar Sync Failure:", error);
          alert("Logistics Radar Error: " + error.message);
        });
      } else { router.push('/auth'); }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubActive) unsubActive();
      if (unsubRadar) unsubRadar();
    };
  }, [router]);

  const handleCallRunner = async (orderId: string) => {
    // Exact status match for @/app/run/terminal/page.tsx radar query
    await updateDoc(doc(db, "orders", orderId), { 
      status: "AWAITING_RUNNER",
      delivery_type: "RUNNER", // Force-align with logistics schema
      ready_at: serverTimestamp() 
    });
    alert("Institutional Logistics: Order is now visible to the Runner Radar.");
  };

  const toggleStatus = async () => {
    if (!auth.currentUser) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        is_online: !isOnline,
        last_active: serverTimestamp()
      });
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleAccept = async (jobId: string) => {
    if (!auth.currentUser || !isOnline) return;
    setIsProcessing(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "orders", jobId);
        const snap = await tx.get(ref);
        if (!snap.exists() || snap.data().runner_id) throw "Directive already claimed.";
        tx.update(ref, { 
          runner_id: auth.currentUser?.uid, 
          runner_name: profile?.full_name || 'Verified Runner',
          status: 'IN_TRANSIT', // Blueprint: Claimed, on way to vendor
          accepted_at: serverTimestamp()
        });
      });
    } catch (e: any) { alert(e); } finally { setIsProcessing(false); }
  };

  // 🏛️ Phase 3: Proof of Pickup (PoP)
  const handleConfirmPickup = async () => {
    if (!activeMission || !auth.currentUser || !podPhoto) return;
    setIsProcessing(true);
    try {
      const storageRef = ref(storage, `pickup_proofs/${activeMission.id}_${Date.now()}.jpg`);
      const uploadRes = await uploadBytes(storageRef, podPhoto);
      const url = await getDownloadURL(uploadRes.ref);
      
      await updateDoc(doc(db, "orders", activeMission.id), { 
        status: 'PICKED_UP', // Blueprint: Evidence captured, moving to student
        pickup_proof_url: url,
        picked_up_at: serverTimestamp()
      });
      
      setPodPhoto(null);
      setPodPreview(null);
      setProofMode(null);
    } catch (e: any) { 
      console.error(e); 
      alert("Capture Handshake Failed: " + e.message);
    } finally { setIsProcessing(false); }
  };

  // 🏛️ Phase 5: Proof of Delivery (PoD)
  const handleFinalizeDelivery = async () => {
    if (!activeMission || !auth.currentUser || !podPhoto) return;
    setIsProcessing(true);
    try {
      const storageRef = ref(storage, `delivery_proofs/${activeMission.id}_${Date.now()}.jpg`);
      const uploadRes = await uploadBytes(storageRef, podPhoto);
      const url = await getDownloadURL(uploadRes.ref);
      
      const res = await completeDelivery(activeMission.id, url);
      if (res.success) {
        // Log earnings
        const fee = activeMission.deliveryFee || 3.50;
        await updateDoc(doc(db, "users", auth.currentUser.uid), { 
          balance: (profile?.balance || 0) + fee 
        });
        
        setPodPhoto(null);
        setPodPreview(null);
        setProofMode(null);
      } else {
        alert("Institutional Sync Failure: " + res.message);
      }
    } catch (e: any) { 
      console.error(e); 
      alert("Logistics Terminal Error: " + e.message);
    } finally { setIsProcessing(false); }
  };

  if (loading) return null;

  return (
    <main className="fixed inset-0 w-full flex flex-col bg-[#FDFDFD] font-sans antialiased text-slate-900 overflow-y-auto no-scrollbar pb-32">
      
      {/* 🏛️ INSTITUTIONAL PROOF MODAL (Polymorphic: PoP & PoD) */}
      <AnimatePresence>
        {proofMode && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-[40px] p-10 space-y-8 shadow-2xl"
            >
              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-slate-50 rounded-[28px] mx-auto flex items-center justify-center text-slate-400 border border-slate-100">
                   <Camera size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-[22px] font-black text-slate-900 tracking-tight">
                  {proofMode === 'PICKUP' ? 'Proof of Pickup' : 'Proof of Delivery'}
                </h3>
                <p className="text-[14px] text-slate-400 font-medium px-6">
                  {proofMode === 'PICKUP' ? 'Snap a photo of the item at the vendor node to confirm custody.' : 'Capture the item at the student node to finalize resolution.'}
                </p>
              </div>

              <div className="space-y-4">
                <input 
                  type="file" accept="image/*" capture="environment" id="pod-capture" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setPodPhoto(file); setPodPreview(URL.createObjectURL(file)); }
                  }}
                />
                
                {podPreview ? (
                  <div className="relative aspect-video rounded-[24px] overflow-hidden border border-slate-100 group">
                    <img src={podPreview} className="w-full h-full object-cover" />
                    <button onClick={() => { setPodPhoto(null); setPodPreview(null); }} className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center"><X size={18}/></button>
                  </div>
                ) : (
                  <label htmlFor="pod-capture" className="w-full h-[160px] border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-all">
                    <Zap size={24} className="text-slate-200" />
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Awaiting Capture</span>
                  </label>
                )}

                <button 
                  disabled={!podPhoto || isProcessing}
                  onClick={proofMode === 'PICKUP' ? handleConfirmPickup : handleFinalizeDelivery}
                  className="w-full h-[68px] bg-slate-900 text-white rounded-[24px] font-black text-[14px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-black/10 active:scale-95 disabled:opacity-30 transition-all"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                  {proofMode === 'PICKUP' ? 'SECURE PICKUP' : 'FINALIZE DELIVERY'}
                </button>
                <button onClick={() => setProofMode(null)} className="w-full text-[11px] font-black text-slate-300 uppercase tracking-widest py-2">Cancel Directive</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ── 1. VOXEL MAP VIEWPORT ── */}
      <section className="h-[40vh] w-full relative shrink-0">
         <LiveMap hasActiveJob={!!activeMission} />
         
         <div className="absolute top-12 left-6 right-6 flex justify-between items-start z-50">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push('/run')} className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-slate-900/5 flex items-center justify-center text-slate-900 border border-slate-100">
               <ChevronRight className="rotate-180" size={24} />
            </motion.button>
            <div className="flex flex-col items-end gap-2">
               <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-white/95 backdrop-blur-xl p-2 rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-100 flex items-center gap-4 px-5">
                  <div className="flex flex-col items-end">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Live</p>
                     <p className={`text-[11px] font-bold ${isOnline ? 'text-emerald-500' : 'text-slate-400'}`}>{isOnline ? 'ONLINE' : 'OFFLINE'}</p>
                  </div>
                  <button onClick={toggleStatus} className={`w-12 h-6 rounded-full p-1 transition-all relative ${isOnline ? 'bg-emerald-500 shadow-sm' : 'bg-slate-200'}`}>
                     <motion.div animate={{ x: isOnline ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
               </motion.div>
            </div>
         </div>
      </section>

      {/* ── 2. LOGISTICS DIRECTIVE HUB ── */}
      <section className="flex-1 px-6 -mt-8 relative z-10 space-y-6">
         
         {!activeMission && (
           <div className="grid grid-cols-2 gap-4">
              <VoxelBento label="Wallet" value={`RM ${(profile?.balance || 0).toFixed(2)}`} icon={DollarSign} color="text-emerald-600" delay={0.1} />
              <VoxelBento label="Rating" value="5.0" icon={Award} color="text-amber-500" delay={0.2} />
           </div>
         )}

         <AnimatePresence mode="wait">
            {activeMission ? (
               <motion.div 
                 key="active" 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                 className="bg-white p-8 rounded-[40px] border-[0.5px] border-slate-100 shadow-2xl shadow-slate-900/5 space-y-10"
               >
                  {/* Stepper Node */}
                  <div className="flex justify-between items-center relative">
                     <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-100 -z-10" />
                     {[
                       { id: 'IN_TRANSIT', icon: Navigation, label: 'Pickup' },
                       { id: 'PICKED_UP', icon: Package, label: 'Mission' },
                       { id: 'ARRIVED_AT_DESTINATION', icon: Camera, label: 'Resolution' }
                     ].map((step) => {
                       const isActive = activeMission.status === step.id;
                       const isPast = (step.id === 'IN_TRANSIT' && ['PICKED_UP', 'ARRIVED_AT_DESTINATION'].includes(activeMission.status)) || (step.id === 'PICKED_UP' && activeMission.status === 'ARRIVED_AT_DESTINATION');
                       
                       return (
                         <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                              isActive ? 'bg-slate-900 border-slate-900 text-white' : 
                              isPast ? 'bg-emerald-500 border-emerald-500 text-white' : 
                              'bg-white border-slate-100 text-slate-300'
                            }`}>
                               {isPast ? <Check size={18} /> : <step.icon size={18} />}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-slate-900' : 'text-slate-300'}`}>{step.label}</span>
                         </div>
                       );
                     })}
                  </div>

                  {/* 🏛️ Phase 3: Heading to Merchant */}
                  {activeMission.status === 'IN_TRANSIT' && (
                    <div className="space-y-8">
                       <div className="flex justify-between items-start">
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target: Pickup Node</p>
                             <h3 className="text-[24px] font-black text-slate-900 tracking-tighter leading-tight">{activeMission.seller_name || 'Vendor Hub'}</h3>
                             <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-emerald-500"/> MIIT Level 2 Cafe</p>
                          </div>
                          <button className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white"><Navigation size={20}/></button>
                       </div>
                       
                       <div className="p-6 bg-slate-50 rounded-3xl space-y-4">
                          <div className="flex items-center justify-between">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Code</p>
                             <p className="text-[14px] font-black text-slate-900">#{activeMission.id.substring(0,8).toUpperCase()}</p>
                          </div>
                          <p className="text-[13px] text-slate-500 font-medium">Verify this code with the merchant to receive the asset.</p>
                       </div>

                       <button onClick={() => setProofMode('PICKUP')} className="w-full h-16 bg-slate-900 text-white rounded-3xl font-black text-[14px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10">Confirm Pickup (PoP)</button>
                    </div>
                  )}

                  {/* 🏛️ Phase 4: Mission Phase (Active Transit) */}
                  {activeMission.status === 'PICKED_UP' && (
                    <div className="space-y-8">
                       <div className="flex justify-between items-start">
                          <div className="space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target: Drop-off Node</p>
                             <h3 className="text-[24px] font-black text-slate-900 tracking-tighter leading-tight">{activeMission.buyer_name || 'Verified Student'}</h3>
                             <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-accent"/> {activeMission.drop_off_location || 'Block K Lobby'}</p>
                          </div>
                          <div className="flex gap-2">
                             <button className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900"><Phone size={20}/></button>
                             <button className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900"><MessageSquare size={20}/></button>
                          </div>
                       </div>

                       <button onClick={() => updateDoc(doc(db, "orders", activeMission.id), { status: 'ARRIVED_AT_DESTINATION' })} className="w-full h-16 bg-slate-900 text-white rounded-3xl font-black text-[14px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10">Arrived at Destination</button>
                    </div>
                  )}

                  {/* 🏛️ Phase 5: Mission Resolution */}
                  {activeMission.status === 'ARRIVED_AT_DESTINATION' && (
                    <div className="text-center space-y-8 py-6">
                       <div className="w-24 h-24 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-emerald-500 border-4 border-white shadow-xl">
                          <CheckCircle2 size={48} />
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-[26px] font-black text-slate-900 tracking-tighter">Mission Arrival</h3>
                          <p className="text-[14px] text-slate-400 font-medium max-w-[240px] mx-auto leading-relaxed">Please capture the Proof of Delivery (PoD) to finalize resolution.</p>
                       </div>
                       <button onClick={() => setProofMode('DELIVERY')} className="w-full h-16 bg-slate-900 text-white rounded-3xl font-black text-[14px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10">Finalize Delivery (PoD)</button>
                    </div>
                  )}
               </motion.div>
            ) : (
               <motion.div 
                 key="radar" 
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                 className="space-y-8"
               >
                  <div className="flex justify-between items-baseline px-2">
                     <div className="flex flex-col">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Directive Radar</p>
                        <p className="text-[20px] font-black text-slate-900 tracking-tighter mt-1">{jobs.length} Available Missions</p>
                     </div>
                     <div className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Scanning</div>
                  </div>

                  {jobs.length > 0 ? (
                     <div className="space-y-4">
                        {jobs.map(job => (
                           <motion.div 
                              key={job.id} 
                              whileTap={{ scale: 0.98 }}
                              className="bg-white p-6 rounded-[32px] border-[0.5px] border-slate-100 shadow-xl shadow-slate-900/5 flex justify-between items-center"
                           >
                              <div className="flex gap-5 items-center">
                                 <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                                    <Package size={22} strokeWidth={1.5} />
                                 </div>
                                 <div className="space-y-1">
                                    <h4 className="text-[16px] font-black text-slate-900 tracking-tight truncate max-w-[140px]">{job.seller_name || 'Vendor Node'}</h4>
                                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">RM {(job.deliveryFee || 3.50).toFixed(2)} • {job.drop_off_location || 'Campus'}</p>
                                 </div>
                              </div>
                              <button onClick={() => handleAccept(job.id)} className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                 <ChevronRight size={20} />
                              </button>
                           </motion.div>
                        ))}
                     </div>
                  ) : (
                     <div className="py-24 bg-white rounded-[40px] border border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                           <Activity size={32} />
                        </div>
                        <p className="text-[15px] font-bold text-slate-900 tracking-tight">Marketplace Node Quiet</p>
                     </div>
                  )}

                  <button 
                    disabled 
                    className="w-full h-20 bg-slate-50 text-slate-300 rounded-[32px] font-black text-[14px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 border border-slate-100"
                  >
                     <Wifi size={20} className={isOnline ? 'text-emerald-500' : ''} />
                     {isOnline ? 'Terminal Active' : 'Terminal Offline'}
                  </button>
               </motion.div>
            )}
         </AnimatePresence>
      </section>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
