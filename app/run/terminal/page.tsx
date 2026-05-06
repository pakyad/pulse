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

        const qActive = query(
          collection(db, "orders"), 
          where("runner_id", "==", user.uid), 
          where("status", "in", ["RUNNER_ASSIGNED", "PICKED_UP", "ON_THE_WAY"])
        );
        unsubActive = onSnapshot(qActive, (snap) => {
          if (!snap.empty) {
            setActiveMission({ id: snap.docs[0].id, ...snap.docs[0].data() });
          } else {
            setActiveMission(null);
          }
        });

        const qRadar = query(collection(db, "orders"), where("status", "in", ["ACCEPTED", "AWAITING_RUNNER"]), where("deliveryType", "==", "RUNNER"));
        unsubRadar = onSnapshot(qRadar, (snap) => {
          setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((j: any) => !j.runner_id));
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
          status: 'RUNNER_ASSIGNED', 
          accepted_at: serverTimestamp()
        });
      });
    } catch (e: any) { alert(e); } finally { setIsProcessing(false); }
  };

  const handleArrived = async () => {
    if (!activeMission) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "orders", activeMission.id), { status: 'PICKED_UP', pickup_time: serverTimestamp() });
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleFulfill = async () => {
    if (!activeMission || !auth.currentUser) return;
    if (!podPhoto) { alert("Operational Requirement: Proof of Delivery Required."); return; }
    setIsProcessing(true);
    try {
      const storageRef = ref(storage, `delivery_proofs/${activeMission.id}_${Date.now()}.jpg`);
      const uploadRes = await uploadBytes(storageRef, podPhoto);
      const url = await getDownloadURL(uploadRes.ref);
      const res = await completeDelivery(activeMission.id, url);
      if (res.success) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { balance: (profile?.balance || 0) + (activeMission.deliveryFee || 4.50) });
        setPodPhoto(null);
        setPodPreview(null);
      }
    } catch (e) { 
      await updateDoc(doc(db, "orders", activeMission.id), { status: 'DELIVERED', updatedAt: serverTimestamp() });
      alert("Local Override: Mission closed manually.");
    } finally { setIsProcessing(false); }
  };

  if (loading) return null;

  return (
    <main className="fixed inset-0 w-full flex flex-col bg-[#F8FAFC] font-sans antialiased text-slate-900 overflow-y-auto no-scrollbar pb-32">
      
      {/* ── 1. VOXEL MAP VIEWPORT (BENTO HEADER) ── */}
      <section className="h-[45vh] w-full relative shrink-0">
         <LiveMap hasActiveJob={!!activeMission} />
         
         <div className="absolute top-12 left-6 right-6 flex justify-between items-start z-50">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.push('/home')} className="w-12 h-12 bg-white rounded-2xl shadow-[0_6px_0_0_#F1F5F9] flex items-center justify-center text-slate-900 border border-slate-100 transition-all active:shadow-none translate-y-0 active:translate-y-1">
               <ChevronRight className="rotate-180" size={24} />
            </motion.button>
            <div className="flex flex-col items-end gap-2">
               <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-white/95 backdrop-blur-xl p-2 rounded-2xl shadow-[0_6px_0_0_#F1F5F9] border border-slate-100 flex items-center gap-4 px-5">
                  <div className="flex flex-col items-end">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">GPS</p>
                     <p className="text-[11px] font-bold text-emerald-500">OPTIMAL</p>
                  </div>
                  <button onClick={toggleStatus} className={`w-12 h-6 rounded-full p-1 transition-all relative ${isOnline ? 'bg-emerald-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]' : 'bg-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]'}`}>
                     <motion.div animate={{ x: isOnline ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
               </motion.div>
            </div>
         </div>
      </section>

      {/* ── 2. VOXEL INFORMATION HUB (MATURED & MINIMAL) ── */}
      <section className="px-6 space-y-6 mt-8">
         
         {/* PERFORMANCE VOXEL GRID */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <VoxelBento label="Total Revenue" value={`RM ${(profile?.balance || 0).toFixed(2)}`} icon={DollarSign} color="text-emerald-600" delay={0.1} />
            <VoxelBento label="Fulfillments" value="12" icon={CheckCircle2} delay={0.2} />
            <VoxelBento label="Active Time" value="4h 12m" icon={Clock} delay={0.3} />
            <VoxelBento label="Professional" value="4.95" icon={Award} color="text-amber-500" delay={0.4} />
         </div>

         {/* PRIMARY DIRECTIVE CARD (VOXEL STYLE) */}
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-8 rounded-[32px] border-[0.5px] border-slate-100 shadow-[0_12px_0_0_#F1F5F9] space-y-8 relative overflow-hidden"
         >
            <AnimatePresence mode="wait">
               {activeMission ? (
                  <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Directive</p>
                           <h3 className="text-[26px] font-black text-slate-900 tracking-tighter leading-none">#{activeMission.id.substring(0,8).toUpperCase()}</h3>
                           <p className="text-[14px] text-slate-400 font-medium">{activeMission.status === 'RUNNER_ASSIGNED' ? 'Heading to Pickup' : 'Heading to Drop-off'}</p>
                        </div>
                        <div className="flex gap-3">
                           <button className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-100 active:scale-90 transition-all"><Phone size={20}/></button>
                           <button className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-100 active:scale-90 transition-all"><MessageSquare size={20}/></button>
                        </div>
                     </div>

                     {/* 3D PROGRESS TIMELINE */}
                     <div className="space-y-6 relative before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-50">
                        <div className="flex items-center gap-6 relative pl-10">
                           <div className={`absolute left-0 w-7 h-7 rounded-full border-4 border-white shadow-md z-10 ${activeMission.status === 'RUNNER_ASSIGNED' ? 'bg-slate-900' : 'bg-slate-100'}`} />
                           <div className="min-w-0">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Pickup Node</p>
                              <p className="text-[15px] font-bold text-slate-900 truncate">{activeMission.sellerName || 'Market Vendor'}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 relative pl-10">
                           <div className={`absolute left-0 w-7 h-7 rounded-full border-4 border-white shadow-md z-10 ${activeMission.status === 'PICKED_UP' ? 'bg-slate-900' : 'bg-slate-100'}`} />
                           <div className="min-w-0">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Dropoff Node</p>
                              <p className="text-[15px] font-bold text-slate-900 truncate">{activeMission.dropOffLocation || 'Central Campus'}</p>
                           </div>
                        </div>
                     </div>

                     <motion.button 
                        whileTap={{ scale: 0.98, y: 4 }}
                        onClick={activeMission.status === 'PICKED_UP' ? handleFulfill : handleArrived} 
                        disabled={isProcessing} 
                        className="w-full h-[68px] bg-slate-900 text-white rounded-[24px] font-black text-[14px] uppercase tracking-[0.2em] active:shadow-none transition-all shadow-[0_8px_0_0_#0F172A] flex items-center justify-center gap-3"
                     >
                        {isProcessing ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} strokeWidth={3} />}
                        {activeMission.status === 'RUNNER_ASSIGNED' ? 'CONFIRM ARRIVAL' : 'FINALIZE DIRECTIVE'}
                     </motion.button>
                  </motion.div>
               ) : (
                  <motion.div key="radar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                     <div className="flex justify-between items-baseline">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Directive Radar</p>
                        <p className="text-[11px] font-black text-slate-900 tracking-widest">{jobs.length} ACTIVE</p>
                     </div>

                     {jobs.length > 0 ? (
                        <div className="space-y-4">
                           {jobs.map(job => (
                              <div key={job.id} className="bg-slate-50 p-6 rounded-[24px] border-[0.5px] border-slate-100 flex justify-between items-center group active:translate-y-1 transition-all">
                                 <div>
                                    <h4 className="text-[16px] font-black text-slate-900 tracking-tight mb-0.5">{job.sellerName || 'Vendor Node'}</h4>
                                    <p className="text-[12px] text-slate-400 font-medium">Payout: RM {(job.deliveryFee || 4.50).toFixed(2)}</p>
                                 </div>
                                 <button onClick={() => handleAccept(job.id)} className="w-12 h-12 bg-white rounded-2xl shadow-[0_4px_0_0_#F1F5F9] border border-slate-100 flex items-center justify-center text-slate-900 active:shadow-none transition-all active:translate-y-1">
                                    <ChevronRight size={20} />
                                 </button>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="py-16 flex flex-col items-center justify-center text-center opacity-20">
                           <Box size={48} strokeWidth={1} className="mb-4" />
                           <p className="text-[14px] font-bold text-slate-900 tracking-tight">Scanning Marketplace Nodes...</p>
                        </div>
                     )}

                     <button disabled className="w-full h-[68px] bg-slate-50 text-slate-300 rounded-[24px] font-black text-[14px] uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                        <Zap size={20} />
                        {isOnline ? 'AWAITING MISSION' : 'TERMINAL OFFLINE'}
                     </button>
                  </motion.div>
               )}
            </AnimatePresence>
         </motion.div>
      </section>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
