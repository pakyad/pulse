"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Camera, X, Loader2, 
  MapPin, ChevronRight, Phone, MessageSquare, 
  Navigation, Check, Package, Activity, 
  DollarSign, Award, Settings,
  ArrowUpRight, ShieldCheck,
  ChevronLeft, Filter, Search, Maximize2, Minimize2,
  ChevronDown
} from 'lucide-react';
import { completeDelivery } from '@/app/actions/deliveryActions';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import dynamic from 'next/dynamic';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

const LiveMap = dynamic(() => import('@/components/runner/LiveMap'), { ssr: false });

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-[18px] font-bold text-[#1e293b] tracking-tight ${className}`}>
    {children}
  </h3>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[14px] font-medium text-[#94a3b8] leading-snug ${className}`}>
    {children}
  </p>
);

const StatCard = ({ label, value, icon: Icon, color = "text-[#1e293b]" }: any) => (
  <div className="bg-white p-6 rounded-[32px] border-[0.5px] border-slate-100 shadow-sm flex flex-col justify-between h-36">
    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border-[0.5px] border-slate-100">
      <Icon size={18} strokeWidth={1.5} />
    </div>
    <div>
      <Subtext className="text-[11px] mb-0.5 uppercase tracking-wider">{label}</Subtext>
      <p className={`text-[22px] font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  </div>
);

export default function RunnerTerminal() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeMission, setActiveMission] = useState<any>(null);
  const [podPhoto, setPodPhoto] = useState<File | null>(null);
  const [podPreview, setPodPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proofMode, setProofMode] = useState<'PICKUP' | 'DELIVERY' | null>(null);
  const [isPoolExpanded, setIsPoolExpanded] = useState(false);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubActive: (() => void) | null = null;
    let unsubRadar: (() => void) | null = null;
    let unsubHistory: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (window.location.search.includes('pool=true')) {
          setIsPoolExpanded(true);
        }

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
          where("status", "in", ["IN_TRANSIT", "PICKED_UP", "ARRIVED_AT_DESTINATION"])
        );
        unsubActive = onSnapshot(qActive, (snap) => {
          setActiveMission(!snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null);
        });

        const qHistory = query(
          collection(db, "orders"),
          where("runner_id", "==", user.uid),
          where("status", "in", ["DELIVERED", "COMPLETED"])
        );
        unsubHistory = onSnapshot(qHistory, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setHistory(docs.sort((a: any, b: any) => {
            const timeA = a.completed_at?.seconds || new Date(a.completed_at || 0).getTime();
            const timeB = b.completed_at?.seconds || new Date(b.completed_at || 0).getTime();
            return timeB - timeA;
          }).slice(0, 5));
        });

        const qRadar = query(
          collection(db, "orders"), 
          where("status", "in", ["AWAITING_RUNNER", "PREPARING", "READY_FOR_PICKUP"])
        );
        unsubRadar = onSnapshot(qRadar, (snap) => {
          const allAwaiting = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((o: any) => o.delivery_type === 'RUNNER' || o.deliveryType === 'RUNNER' || o.delivery_type === 'runner' || o.deliveryType === 'runner');
          setJobs(allAwaiting);
        });
      } else { router.push('/auth'); }
    });

    return () => {
      unsubAuth();
      [unsubProfile, unsubActive, unsubRadar, unsubHistory].forEach(fn => fn?.());
    };
  }, [router]);

  const toggleStatus = async () => {
    if (!auth.currentUser) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { is_online: !isOnline, last_active: serverTimestamp() });
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleAccept = async (jobId: string) => {
    if (!auth.currentUser || !isOnline) return;
    setIsProcessing(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "orders", jobId);
        const snap = await tx.get(ref);
        if (!snap.exists() || snap.data().runner_id) throw "Job already claimed.";
        tx.update(ref, { 
          runner_id: auth.currentUser?.uid, 
          runner_name: profile?.full_name || 'Runner',
          status: 'IN_TRANSIT',
          accepted_at: serverTimestamp()
        });
      });
      setIsPoolExpanded(false);
    } catch (e: any) { alert(e); } finally { setIsProcessing(false); }
  };

  const handleConfirmPickup = async () => {
    if (!activeMission || !auth.currentUser || !podPhoto) return;
    setIsProcessing(true);
    try {
      const storageRef = ref(storage, `pickup_proofs/${activeMission.id}_${Date.now()}.jpg`);
      const uploadRes = await uploadBytes(storageRef, podPhoto);
      const url = await getDownloadURL(uploadRes.ref);
      await updateDoc(doc(db, "orders", activeMission.id), { status: 'PICKED_UP', pickup_proof_url: url, picked_up_at: serverTimestamp() });
      setPodPhoto(null); setPodPreview(null); setProofMode(null);
    } catch (e: any) { alert(e.message); } finally { setIsProcessing(false); }
  };

  const handleFinalizeDelivery = async () => {
    if (!activeMission || !auth.currentUser || !podPhoto) return;
    setIsProcessing(true);
    try {
      const storageRef = ref(storage, `delivery_proofs/${activeMission.id}_${Date.now()}.jpg`);
      const uploadRes = await uploadBytes(storageRef, podPhoto);
      const url = await getDownloadURL(uploadRes.ref);
      const res = await completeDelivery(activeMission.id, url);
      if (res.success) { setPodPhoto(null); setPodPreview(null); setProofMode(null); }
    } catch (e: any) { alert(e.message); } finally { setIsProcessing(false); }
  };

  if (loading) return null;

  return (
    <main className="min-h-screen bg-white font-sans antialiased text-[#1e293b] selection:bg-slate-100 relative overflow-hidden">
      
      {/* ── BACKGROUND LAYER ── */}
      <motion.div 
        animate={{ 
          scale: isPoolExpanded ? 0.94 : 1,
          opacity: isPoolExpanded ? 0.4 : 1,
          filter: isPoolExpanded ? 'blur(10px)' : 'blur(0px)',
          borderRadius: isPoolExpanded ? '48px' : '0px'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="min-h-screen bg-white pb-40 overflow-x-hidden relative"
      >
        {/* ── MATURED NAVIGATION ── */}
        <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
           <div className="flex items-center gap-3">
              <button onClick={() => router.push('/run')} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 active:scale-95 transition-all">
                 <ChevronLeft size={20} />
              </button>
              <div>
                 <p className="text-[24px] font-bold tracking-tight text-slate-900 leading-none">Terminal Hub</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} className="scale-90" />
           </div>
        </nav>

        {/* ── MAP VIEWPORT ── */}
        <section className="h-[30vh] w-full pt-20 relative">
           <LiveMap hasActiveJob={!!activeMission} />
           <div className="absolute inset-0 bg-linear-to-b from-white via-transparent to-white" />
        </section>

        {/* ── STATS & ACTIONS ── */}
        <section className="px-8 -mt-10 relative z-10 space-y-12">
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[32px] border-[0.5px] border-slate-100 shadow-sm space-y-4">
                 <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Earnings</p>
                 <p className="text-[24px] font-bold text-emerald-600 tracking-tight leading-none">RM {(profile?.balance || 0).toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-[32px] border-[0.5px] border-slate-100 shadow-sm space-y-4">
                 <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Rating</p>
                 <p className="text-[24px] font-bold text-slate-900 tracking-tight leading-none">5.0</p>
              </div>
           </div>

           {/* ── ACTIVE JOB SLOT ── */}
           <AnimatePresence mode="wait">
              {activeMission ? (
                 <motion.div key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[40px] border-[0.5px] border-slate-100 shadow-2xl shadow-slate-900/5 space-y-8">
                    <div className="flex justify-between items-start">
                       <div><Heading className="lowercase">current job</Heading><Subtext className="lowercase mt-1">order #{activeMission.id.substring(0,8)}</Subtext></div>
                       <div className="px-4 py-1.5 bg-slate-50 text-[#1e293b] rounded-full text-[9px] font-bold uppercase tracking-widest border border-slate-100">{activeMission.status.replace(/_/g, ' ')}</div>
                    </div>
                    <div className="space-y-6">
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 mt-1"><Navigation size={18}/></div>
                          <div><Heading className="text-[15px] lowercase">{activeMission.seller_name || 'pickup point'}</Heading><Subtext className="text-[13px] mt-0.5 lowercase">miit level 2 cafe</Subtext></div>
                       </div>
                       <div className="ml-5 h-6 border-l-[0.5px] border-dashed border-slate-200" />
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white mt-1"><MapPin size={18}/></div>
                          <div><Heading className="text-[15px] lowercase">{activeMission.drop_off_location || 'drop-off'}</Heading><Subtext className="text-[13px] mt-0.5 lowercase">{activeMission.buyer_name || 'student'}</Subtext></div>
                       </div>
                    </div>
                    <div className="pt-2 flex gap-3">
                       <button className="flex-1 h-14 bg-slate-900 text-white rounded-full font-bold text-[13px] shadow-lg shadow-slate-900/10 active:scale-95 transition-all lowercase">navigate</button>
                       <button onClick={() => setProofMode(activeMission.status === 'IN_TRANSIT' ? 'PICKUP' : 'DELIVERY')} className="flex-1 h-14 bg-white text-slate-900 border border-slate-100 rounded-full font-bold text-[13px] active:scale-95 transition-all lowercase">{activeMission.status === 'IN_TRANSIT' ? 'confirm pickup' : 'complete delivery'}</button>
                    </div>
                 </motion.div>
              ) : (
                 <motion.div key="searching" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-24 flex flex-col items-center justify-center text-center space-y-8">
                    <div className="relative w-20 h-20">
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 180, 270, 360],
                            borderRadius: ["20%", "50%", "20%"]
                          }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-2 border-dashed border-slate-100" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="grid grid-cols-2 gap-1 animate-pulse">
                              {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 bg-slate-200 rounded-xs" />)}
                           </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[16px] font-bold text-slate-900 lowercase">no active mission...</p>
                       <p className="text-[12px] text-slate-400 font-medium lowercase leading-relaxed">
                          go to orders to claim a mission.
                       </p>
                    </div>
                    <button 
                      onClick={() => router.push('/run/missions')}
                      className="px-8 h-11 bg-slate-900 text-white rounded-full text-[12px] font-bold shadow-lg shadow-slate-900/10 active:scale-95 transition-all lowercase"
                    >
                      browse orders
                    </button>
                 </motion.div>
              )}
           </AnimatePresence>
        </section>
      </motion.div>

      {/* ── PROOF MODAL ── */}
      <AnimatePresence>{proofMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-1000 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-white w-full max-w-md rounded-[40px] p-10 space-y-10 shadow-2xl">
               <div className="text-center space-y-3">
                 <div className="w-20 h-20 bg-slate-50 rounded-[32px] mx-auto flex items-center justify-center text-slate-300 border border-slate-100"><Camera size={32} strokeWidth={1.5} /></div>
                 <Heading className="text-[22px]">{proofMode === 'PICKUP' ? 'Photo Proof of Pickup' : 'Photo Proof of Delivery'}</Heading>
                 <Subtext className="px-6">{proofMode === 'PICKUP' ? 'Take a photo of the items at the pickup point.' : 'Take a photo of the items at the drop-off point.'}</Subtext>
               </div>
               <div className="space-y-6">
                 <input type="file" accept="image/*" capture="environment" id="pod-capture" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setPodPhoto(file); setPodPreview(URL.createObjectURL(file)); } }} />
                 {podPreview ? (
                    <div className="relative aspect-video rounded-[32px] overflow-hidden border border-slate-100 group">
                      <img src={podPreview} className="w-full h-full object-cover" />
                      <button onClick={() => { setPodPhoto(null); setPodPreview(null); }} className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center"><X size={18}/></button>
                    </div>
                 ) : (
                    <label htmlFor="pod-capture" className="w-full h-[160px] border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-all">
                      <Camera size={24} className="text-slate-200" />
                      <Subtext>Tap to take photo</Subtext>
                    </label>
                 )}
                 <button disabled={!podPhoto || isProcessing} onClick={proofMode === 'PICKUP' ? handleConfirmPickup : handleFinalizeDelivery} className="w-full h-16 bg-[#1e293b] text-white rounded-[24px] font-bold text-[14px] flex items-center justify-center gap-3 disabled:opacity-20 transition-all shadow-xl shadow-slate-900/10">
                   {isProcessing ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                   {proofMode === 'PICKUP' ? 'Confirm Pickup' : 'Complete Delivery'}
                 </button>
                 <button onClick={() => setProofMode(null)} className="w-full text-[12px] font-bold text-[#94a3b8] py-2 uppercase tracking-widest">Cancel</button>
               </div>
            </motion.div>
          </motion.div>
      )}</AnimatePresence>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </main>
  );
}
