"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ShieldCheck, Truck, MapPin, ChevronRight, Activity, Zap, Camera, X, Loader2, Package, CheckCircle2 } from 'lucide-react';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

const storage = getStorage();

export default function MobileRunnerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'RADAR' | 'ANALYTICS'>('RADAR');
  const [analytics, setAnalytics] = useState({ deliveries: 0, earnings: 0 });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let unsubJobs: (() => void) | null = null;
    let unsubActive: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged(async (user: any) => {
      if (!user) { router.push('/auth'); return; }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();
      setProfile(userData);

      if (!userData?.is_verified_runner) {
        router.push('/home'); return;
      }

      const qJobs = query(
        collection(db, "orders"), 
        where("status", "==", "AWAITING_RUNNER"),
        where("delivery_type", "==", "RUNNER")
      );
      
      unsubJobs = onSnapshot(qJobs, (snap) => {
        setNearbyJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

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

      const qHistory = query(
        collection(db, "orders"),
        where("runner_id", "==", user.uid),
        where("status", "==", "COMPLETED")
      );
      
      onSnapshot(qHistory, (snap) => {
        const docs = snap.docs.map(d => d.data());
        const totalEarned = docs.reduce((acc: number, curr: any) => acc + (curr.delivery_fee || 3.50), 0);
        setAnalytics({
          deliveries: docs.length,
          earnings: totalEarned
        });
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
        status: 'PICKED_UP',
        runner_id: auth.currentUser.uid,
        runner_name: profile?.full_name || 'Verified Runner',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.error("Job Acceptance Error:", e);
      alert("Job synchronization failed. Another agent may have accepted.");
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', aspectRatio: 1 } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      alert("Camera Access Denied.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const captureAndComplete = async () => {
    if (!activeJob || !videoRef.current || isUploading) return;
    setIsUploading(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(videoRef.current, 0, 0, 1000, 1000);
      
      ctx.fillStyle = "white";
      ctx.font = "bold 20px Inter";
      ctx.fillText(`ORDER: #${activeJob.id.substring(0,8).toUpperCase()}`, 40, 920);
      ctx.font = "16px Inter";
      ctx.fillText(new Date().toLocaleString(), 40, 950);

      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      const storageRef = ref(storage, `pod/${activeJob.id}.jpg`);
      await uploadString(storageRef, imageData, 'data_url');
      const podUrl = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "orders", activeJob.id), {
        status: 'COMPLETED',
        pod_url: podUrl,
        completed_at: new Date().toISOString()
      });

      stopCamera();
      alert("Proof Uploaded. Mission Finalized.");
    } catch (e) {
      console.error(e);
      alert("Handshake failed. Please retry.");
    } finally {
      setIsUploading(false);
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

                  <div className="flex gap-4">
                    <button 
                      onClick={() => router.push(`/orders/${activeJob.id}`)}
                      className="flex-1 h-14 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-slate-100 active:scale-95 transition-all"
                    >
                        Logistics Map
                    </button>
                    <button 
                      onClick={startCamera}
                      className="flex-1 h-14 bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-black/10 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Camera size={18} /> Complete Job
                    </button>
                  </div>
              </div>
           </div>
         ) : (
           <div className="p-8 text-center border-b-[0.5px] border-[#F2F2F7]">
              <p className="text-[12px] font-bold text-slate-300 tracking-tight">No active assignments assigned to your node.</p>
           </div>
         )}

         {/* ── Available Jobs (Radar) ── */}
         {activeTab === 'RADAR' && (
           <div className="px-6 py-8 space-y-8">
              <div className="space-y-1">
                 <h2 className="text-[26px] font-black tracking-tight">Logistics Directives</h2>
                 <p className="text-[14px] font-medium text-slate-400 leading-relaxed">Initiate a 4-layer verification funnel for specialized task fulfillment.</p>
              </div>
              
              <div className="space-y-4">
                 {nearbyJobs.length === 0 ? (
                   <div className="py-20 flex flex-col items-center gap-4 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-200"><Zap size={40} /></div>
                      <p className="text-[14px] font-bold text-slate-300 uppercase tracking-widest px-12">Radar is currently clear.</p>
                   </div>
                 ) : (
                   nearbyJobs.map((job) => {
                     const isFood = (job.category || '').toLowerCase().includes('food') || (job.items_summary || '').toLowerCase().includes('food');
                     const isTech = (job.category || '').toLowerCase().includes('tech') || (job.category || '').toLowerCase().includes('asset');
                     
                     return (
                       <motion.div 
                         key={job.id} 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className={`p-6 rounded-[36px] border border-slate-50 flex items-center justify-between group transition-all shadow-sm shadow-slate-100 ${
                           isFood ? 'bg-amber-50/50' : isTech ? 'bg-blue-50/50' : 'bg-slate-50/50'
                         }`}
                       >
                          <div className="flex items-center gap-5">
                             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                               isFood ? 'bg-white text-amber-500' : isTech ? 'bg-white text-blue-500' : 'bg-white text-slate-400'
                             }`}>
                                {isFood ? <Truck size={24} /> : isTech ? <Package size={24} /> : <Zap size={24} />}
                             </div>
                             <div>
                                <p className="text-[17px] font-black tracking-tight text-slate-900">{job.title || 'Institutional Task'}</p>
                                <p className="text-[12px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{job.dropOffLocation?.split('—')[0] || 'Campus Hub'}</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleAcceptJob(job.id)}
                            disabled={!isOnline}
                            className={`h-12 px-6 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all ${isOnline ? 'hover:scale-105 active:scale-95 shadow-xl shadow-black/10' : 'opacity-20 cursor-not-allowed'}`}
                          >
                             Initiate
                          </button>
                       </motion.div>
                     );
                   })
                 )}
              </div>
           </div>
         )}

         {/* ── Analytics Terminal ── */}
         {activeTab === 'ANALYTICS' && (
            <div className="p-8 space-y-12">
               <div className="space-y-1">
                  <h2 className="text-[26px] font-black tracking-tight uppercase">Performance</h2>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Institutional Logistics Ledger</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-black rounded-[32px] text-white space-y-4">
                     <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Net Earnings</p>
                     <div className="space-y-0.5">
                        <p className="text-[11px] font-bold opacity-60">RM</p>
                        <p className="text-[26px] font-black leading-none">{analytics.earnings.toFixed(2)}</p>
                     </div>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[36px] border border-slate-100 space-y-6">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Fulfillments</p>
                     <div className="space-y-1">
                        <p className="text-[13px] font-bold text-slate-400">Total</p>
                        <p className="text-[32px] font-black text-slate-900 leading-none">{analytics.deliveries}</p>
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-white rounded-[36px] border-[0.5px] border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                     <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center"><Activity size={24} /></div>
                     <div>
                        <p className="text-[15px] font-bold">Node Health</p>
                        <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest">Optimized</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[14px] font-black text-slate-900">100%</p>
                  </div>
               </div>
            </div>
         )}
      </main>

      {/* ── Fixed Bottom Nav ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t-[0.5px] border-[#F2F2F7] pb-10 pt-4 px-10 z-30">
         <div className="flex items-center justify-between max-w-sm mx-auto">
            <button 
              onClick={() => setActiveTab('RADAR')}
              className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === 'RADAR' ? 'text-black' : 'text-slate-300'}`}
            >
              <Zap size={22} strokeWidth={activeTab === 'RADAR' ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-widest">Radar</span>
            </button>
            <button 
              onClick={() => setActiveTab('ANALYTICS')}
              className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${activeTab === 'ANALYTICS' ? 'text-black' : 'text-slate-300'}`}
            >
              <Activity size={22} strokeWidth={activeTab === 'ANALYTICS' ? 2.5 : 2} />
              <span className="text-[9px] font-black uppercase tracking-widest">Analytics</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 transition-all active:scale-90 text-slate-300" onClick={() => router.push('/home')}>
              <ChevronRight size={22} />
              <span className="text-[9px] font-black uppercase tracking-widest">Exit</span>
            </button>
         </div>
      </div>

      {/* ── Institutional PoD Camera Terminal ── */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black flex flex-col items-center justify-center"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-10">
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Proof of Delivery</p>
               <button onClick={stopCamera} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white"><X size={20} /></button>
            </div>

            {/* 1:1 Viewfinder */}
            <div className="relative w-full aspect-square max-w-md border-[0.5px] border-white/20 overflow-hidden bg-zinc-900">
               <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover grayscale brightness-110"
               />
               
               {/* Center Brackets */}
               <div className="absolute inset-20 border-[0.5px] border-white/30 rounded-2xl pointer-events-none">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-[0.5px] border-l-[0.5px] border-white/60" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-[0.5px] border-r-[0.5px] border-white/60" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[0.5px] border-l-[0.5px] border-white/60" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[0.5px] border-r-[0.5px] border-white/60" />
               </div>

               {/* Metadata Overlay */}
               <div className="absolute bottom-8 left-8 text-white/60 font-medium">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">AUDIT #{activeJob?.id.substring(0,8).toUpperCase()}</p>
                  <p className="text-[10px]">{new Date().toLocaleString()}</p>
               </div>
            </div>

            {/* Footer / Shutter */}
            <div className="mt-12 flex flex-col items-center gap-8">
               <p className="text-[11px] font-medium text-white/30 text-center px-12">"Align package within brackets. Institutional proof is irreversible."</p>
               
               <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={captureAndComplete}
                  disabled={isUploading}
                  className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center group"
               >
                  <div className={`w-16 h-16 rounded-full border-2 border-white transition-all ${isUploading ? 'bg-emerald-500 scale-75' : 'bg-white group-hover:scale-110'}`}>
                     {isUploading && <Loader2 className="animate-spin text-white w-full h-full p-4" />}
                  </div>
               </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
