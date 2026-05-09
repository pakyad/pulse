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
      <Subtext className="text-[11px] mb-0.5">{label}</Subtext>
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
        if (!snap.exists() || snap.data().runner_id) throw "Mission already claimed.";
        tx.update(ref, { 
          runner_id: auth.currentUser?.uid, 
          runner_name: profile?.full_name || 'Verified Runner',
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
    <main className="min-h-screen bg-[#0A0A0B] font-sans antialiased text-[#1e293b] selection:bg-slate-100 relative overflow-hidden">
      
      {/* ── BACKGROUND LAYER (TERMINAL) ── */}
      <motion.div 
        animate={{ 
          scale: isPoolExpanded ? 0.94 : 1,
          opacity: isPoolExpanded ? 0.4 : 1,
          filter: isPoolExpanded ? 'blur(10px)' : 'blur(0px)',
          borderRadius: isPoolExpanded ? '48px' : '0px'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="min-h-screen bg-[#FDFDFD] pb-40 overflow-x-hidden relative"
      >
        {/* ── 1. NAVIGATION LAYER ── */}
        <nav className="fixed top-0 left-0 right-0 z-100 px-6 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
           <div className="flex items-center gap-4">
              <button onClick={() => router.push('/run')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100 active:scale-95 transition-all">
                 <ChevronLeft size={20} />
              </button>
              <div className="flex flex-col">
                 <p className="text-[16px] font-bold tracking-tight">Runner Terminal</p>
                 <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <p className="text-[11px] font-medium text-slate-400">{isOnline ? 'Active Node' : 'Offline'}</p>
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button onClick={toggleStatus} className={`h-10 px-5 rounded-2xl border flex items-center gap-2 transition-all ${isOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                 <span className="text-[11px] font-bold">{isOnline ? 'Online' : 'Go Online'}</span>
              </button>
              <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
           </div>
        </nav>

        {/* ── 2. VIEWPORT LAYER (MAP) ── */}
        <section className="h-[30vh] w-full pt-20 relative">
           <LiveMap hasActiveJob={!!activeMission} />
           <div className="absolute inset-0 bg-linear-to-b from-white via-transparent to-[#FDFDFD]" />
        </section>

        {/* ── 3. PERFORMANCE LAYER ── */}
        <section className="px-6 -mt-10 relative z-10 space-y-10">
           <div className="grid grid-cols-2 gap-4">
              <StatCard label="Earnings" value={`RM ${(profile?.balance || 0).toFixed(2)}`} icon={DollarSign} color="text-emerald-600" />
              <StatCard label="Rating" value="5.0" icon={Award} color="text-amber-500" />
           </div>

           {/* ── ACTIVE MISSION SLOT ── */}
           <AnimatePresence mode="wait">
              {activeMission ? (
                 <motion.div key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[40px] border-[0.5px] border-slate-100 shadow-2xl shadow-slate-900/5 space-y-8">
                    <div className="flex justify-between items-start">
                       <div><Heading>Active Mission</Heading><Subtext>#{activeMission.id.substring(0,8).toUpperCase()}</Subtext></div>
                       <div className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-bold">{activeMission.status.replace(/_/g, ' ')}</div>
                    </div>
                    <div className="space-y-6">
                       <div className="flex items-start gap-4">
                          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 mt-1"><Navigation size={16}/></div>
                          <div><Heading className="text-[15px]">{activeMission.seller_name || 'Merchant Point'}</Heading><Subtext className="text-[13px] mt-0.5">MIIT Level 2 Cafe</Subtext></div>
                       </div>
                       <div className="ml-4 h-6 border-l-[0.5px] border-dashed border-slate-200" />
                       <div className="flex items-start gap-4">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white mt-1"><MapPin size={16}/></div>
                          <div><Heading className="text-[15px]">{activeMission.drop_off_location || 'Campus Hub'}</Heading><Subtext className="text-[13px] mt-0.5">{activeMission.buyer_name || 'Verified Student'}</Subtext></div>
                       </div>
                    </div>
                    <div className="pt-2 flex gap-3">
                       <button className="flex-1 h-14 bg-slate-900 text-white rounded-2xl font-bold text-[13px] shadow-lg shadow-slate-900/10 active:scale-95 transition-all">Navigate</button>
                       <button onClick={() => setProofMode(activeMission.status === 'IN_TRANSIT' ? 'PICKUP' : 'DELIVERY')} className="flex-1 h-14 bg-white text-slate-900 border border-slate-100 rounded-2xl font-bold text-[13px] active:scale-95 transition-all">{activeMission.status === 'IN_TRANSIT' ? 'Confirm Pickup' : 'Finalize'}</button>
                    </div>
                 </motion.div>
              ) : (
                 <motion.div key="radar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex justify-between items-end px-1">
                       <div><Heading>Signal Radar</Heading><Subtext>Live mission opportunities</Subtext></div>
                       <button onClick={() => setIsPoolExpanded(true)} className="text-[12px] font-bold text-blue-600 flex items-center gap-1.5 mb-1 active:scale-90 transition-all">Maximize Pool <Maximize2 size={14} strokeWidth={2.5} /></button>
                    </div>
                    {jobs.length > 0 ? (
                       <div className="space-y-3">
                          {jobs.slice(0, 3).map(job => (
                             <div key={job.id} className="bg-white p-6 rounded-[32px] border-[0.5px] border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors"><Package size={20} /></div>
                                   <div><Heading className="text-[15px] mb-0.5">{job.seller_name || 'Merchant'}</Heading><Subtext className="text-[12px]">RM {(job.deliveryFee || 3.50).toFixed(2)} • {job.drop_off_location}</Subtext></div>
                                </div>
                                <button onClick={() => handleAccept(job.id)} className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-colors"><ChevronRight size={18} /></button>
                             </div>
                          ))}
                          {jobs.length > 3 && <button onClick={() => setIsPoolExpanded(true)} className="w-full py-4 text-center text-[12px] font-bold text-slate-300 uppercase tracking-widest bg-slate-50/50 rounded-2xl">+ {jobs.length - 3} More Signals Available</button>}
                       </div>
                    ) : (
                       <div className="py-14 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300"><Activity size={32} strokeWidth={1} className="mb-3 opacity-30" /><Subtext className="text-[12px]">Awaiting Signal Stream</Subtext></div>
                    )}
                 </motion.div>
              )}
           </AnimatePresence>

           {/* ── 4. HISTORY LAYER ── */}
           <section className="space-y-6">
              <div className="px-1"><Heading>Recent Fulfilled</Heading><Subtext>Your latest successful missions</Subtext></div>
              <div className="space-y-3">
                 {history.length > 0 ? history.map((h: any) => (
                    <div key={h.id} className="flex items-center justify-between p-6 bg-white border border-slate-50 rounded-[32px] shadow-sm">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500"><Check size={18} strokeWidth={2.5} /></div>
                          <div><Heading className="text-[15px] mb-0.5">Fulfilled Mission</Heading><Subtext className="text-[11px] uppercase tracking-wider">{h.id.substring(0,8)} • {new Date(h.completed_at).toLocaleDateString()}</Subtext></div>
                       </div>
                       <p className="text-[15px] font-bold text-emerald-600">+RM {(h.deliveryFee || 3.50).toFixed(2)}</p>
                    </div>
                 )) : (<div className="py-8 text-center"><Subtext className="italic">No fulfillment history found.</Subtext></div>)}
              </div>
           </section>

           {/* ── 5. TERMINAL REGISTRY ── */}
           <section className="space-y-6">
              <div className="px-1"><Heading>Terminal Registry</Heading><Subtext>Manage your logistics node configuration</Subtext></div>
              <div className="bg-slate-50/50 rounded-[40px] overflow-hidden border border-slate-100">
                 {[{ icon: Settings, label: 'Logistics Settings', sub: 'Manage delivery zones & preferences' }, { icon: ShieldCheck, label: 'Runner Clearance', sub: 'Verified Institutional Node Profile' }].map((item, i) => (
                    <button key={i} className="w-full p-7 flex items-center justify-between border-b-[0.5px] border-slate-100 last:border-0 hover:bg-white transition-all group">
                       <div className="flex items-center gap-5 text-left">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:border-slate-300 transition-colors"><item.icon size={20} strokeWidth={1.5} /></div>
                          <div><Heading className="text-[16px] mb-0.5">{item.label}</Heading><Subtext className="text-[13px]">{item.sub}</Subtext></div>
                       </div>
                       <ChevronRight size={18} className="text-slate-300" />
                    </button>
                 ))}
              </div>
           </section>
        </section>
      </motion.div>

      {/* ── EXPANDED MISSION POOL (MATURED BOTTOM SHEET) ── */}
      <AnimatePresence>
        {isPoolExpanded && (
          <>
            {/* Backdrop Dimmer */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPoolExpanded(false)}
              className="fixed inset-0 z-150 bg-black/40 backdrop-blur-sm"
            />
            
            {/* The "Sheet" */}
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: '8%' }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 150 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 150) setIsPoolExpanded(false);
              }}
              className="fixed inset-x-0 bottom-0 z-200 h-screen bg-white rounded-t-[48px] shadow-[0_-20px_80px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden border-t-[0.5px] border-slate-100"
            >
              {/* Drag Handle */}
              <div className="w-full pt-4 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-slate-100 rounded-full" />
              </div>

              <nav className="px-8 pt-4 pb-6 flex items-center justify-between border-b border-slate-50">
                 <div className="flex items-center gap-4">
                    <button onClick={() => setIsPoolExpanded(false)} className="p-2 -ml-2 text-slate-400"><ChevronDown size={24}/></button>
                    <div>
                      <Heading>Mission Pool</Heading>
                      <Subtext>{jobs.length} Active Signals</Subtext>
                    </div>
                 </div>
                 <button onClick={() => setIsPoolExpanded(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400"><Minimize2 size={20}/></button>
              </nav>

              <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
                 {['ALL', 'NEARBY', 'HIGH YIELD', 'URGENT'].map(tag => (
                    <button key={tag} onClick={() => setFilter(tag)} className={`px-5 h-10 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${filter === tag ? 'bg-[#1e293b] text-white shadow-lg shadow-slate-900/10' : 'bg-white text-slate-400 border border-slate-100'}`}>{tag}</button>
                 ))}
              </div>

              <div className="flex-1 overflow-y-auto p-8 pb-32 space-y-4 no-scrollbar">
                 {jobs.length > 0 ? jobs.map(job => (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={job.id} className="bg-white p-7 rounded-[40px] border-[0.5px] border-slate-100 shadow-sm space-y-6">
                       <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400"><Package size={22}/></div>
                             <div><Heading className="text-[16px]">{job.seller_name || 'Merchant'}</Heading><Subtext className="text-[12px]">{job.id.substring(0,8).toUpperCase()}</Subtext></div>
                          </div>
                          <div className="text-right"><p className="text-[18px] font-bold text-emerald-600">RM {(job.deliveryFee || 3.50).toFixed(2)}</p><Subtext className="text-[11px] uppercase tracking-wider">Yield</Subtext></div>
                       </div>
                       <div className="space-y-4 bg-slate-50/50 p-5 rounded-[28px] border border-slate-50">
                          <div className="flex items-center gap-3"><Navigation size={14} className="text-slate-300" /><Subtext className="text-[13px] text-slate-600 font-bold">MIIT Level 2 Cafe</Subtext></div>
                          <div className="flex items-center gap-3"><MapPin size={14} className="text-slate-300" /><Subtext className="text-[13px] text-slate-600 font-bold">{job.drop_off_location || 'Campus Hub'}</Subtext></div>
                       </div>
                       <button onClick={() => handleAccept(job.id)} className="w-full h-16 bg-[#1e293b] text-white rounded-3xl font-bold text-[14px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-900/10">Secure Mission <ArrowUpRight size={18} /></button>
                    </motion.div>
                 )) : (<div className="h-full flex flex-col items-center justify-center text-slate-300 py-20"><Activity size={48} strokeWidth={1} className="mb-4 opacity-20" /><Heading className="text-slate-400">Quiet Node</Heading><Subtext>No active signals detected in the pool.</Subtext></div>)}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── PROOF MODAL OVERLAY ── */}
      <AnimatePresence>{proofMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-1000 bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-white w-full max-w-md rounded-[40px] p-10 space-y-10 shadow-2xl">
               <div className="text-center space-y-3">
                 <div className="w-20 h-20 bg-slate-50 rounded-[32px] mx-auto flex items-center justify-center text-slate-300 border border-slate-100"><Camera size={32} strokeWidth={1.5} /></div>
                 <Heading className="text-[22px]">{proofMode === 'PICKUP' ? 'Proof of Pickup' : 'Proof of Delivery'}</Heading>
                 <Subtext className="px-6">{proofMode === 'PICKUP' ? 'Capture the asset at the merchant node to lock custody.' : 'Capture the asset at the student node to finalize resolution.'}</Subtext>
               </div>
               <div className="space-y-6">
                 <input type="file" accept="image/*" capture="environment" id="pod-capture" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setPodPhoto(file); setPodPreview(URL.createObjectURL(file)); } }} />
                 {podPreview ? (
                   <div className="relative aspect-video rounded-[32px] overflow-hidden border border-slate-100 group"><img src={podPreview} className="w-full h-full object-cover" /><button onClick={() => { setPodPhoto(null); setPodPreview(null); }} className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center"><X size={18}/></button></div>
                 ) : (
                   <label htmlFor="pod-capture" className="w-full h-[160px] border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-all"><Activity size={24} className="text-slate-200" /><Subtext>Tap to capture proof</Subtext></label>
                 )}
                 <button disabled={!podPhoto || isProcessing} onClick={proofMode === 'PICKUP' ? handleConfirmPickup : handleFinalizeDelivery} className="w-full h-16 bg-slate-900 text-white rounded-3xl font-bold text-[14px] flex items-center justify-center gap-3 disabled:opacity-20 transition-all shadow-xl shadow-slate-900/10">{isProcessing ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}{proofMode === 'PICKUP' ? 'Secure Pickup' : 'Finalize Delivery'}</button>
                 <button onClick={() => setProofMode(null)} className="w-full text-[12px] font-bold text-slate-400 py-2">Cancel Transaction</button>
               </div>
            </motion.div>
          </motion.div>
      )}</AnimatePresence>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </main>
  );
}
