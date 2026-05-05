"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Camera, X, Loader2, CheckCircle2, Settings } from 'lucide-react';
import { completeDelivery } from '@/app/actions/deliveryActions';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/runner/LiveMap'), { ssr: false });
import SwipeToAccept from '@/components/runner/SwipeToAccept';

export default function CarrierTerminal() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeMission, setActiveMission] = useState<any>(null);
  const [podPhoto, setPodPhoto] = useState<File | null>(null);
  const [podPreview, setPodPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) {
        onSnapshot(doc(db, "users", user.uid), (snap) => {
          const data = snap.data();
          if (!data?.is_verified_runner) router.push('/run');
          setProfile(data);
          setLoading(false);
        }, (err) => { console.error(err); setLoading(false); });

        const qActive = query(
          collection(db, "orders"), 
          where("runner_id", "==", user.uid), 
          where("status", "in", ["RUNNER_EN_ROUTE_TO_VENDOR", "IN_TRANSIT"])
        );
        onSnapshot(qActive, (snap) => {
          if (!snap.empty) {
            setActiveMission({ id: snap.docs[0].id, ...snap.docs[0].data() });
          } else {
            setActiveMission(null);
          }
        });
      } else {
        router.push('/auth');
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!isOnline) {
      setJobs([]);
      return;
    }
    const q = query(collection(db, "orders"), where("status", "==", "WAITING_FOR_RUNNER"));
    const unsubJobs = onSnapshot(q, (snap) => {
      const fetchedJobs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setJobs(fetchedJobs);
    }, (err) => console.error("DEBUG [Registry Sync]:", err));
    return () => unsubJobs();
  }, [isOnline]);

  const handleAcceptJob = async (jobId: string) => {
    const uid = profile?.uid || auth.currentUser?.uid;
    if (!uid) { alert("Identity not found. Please refresh."); return; }
    
    try {
      await runTransaction(db, async (transaction) => {
        const jobRef = doc(db, "orders", jobId);
        const jobSnap = await transaction.get(jobRef);
        
        if (!jobSnap.exists()) throw "Directive vanished from registry.";
        if (jobSnap.data().runner_id) throw "Directive already claimed by another carrier.";
        
        transaction.update(jobRef, { 
          runner_id: uid, 
          status: 'RUNNER_EN_ROUTE_TO_VENDOR', 
          accepted_at: serverTimestamp() 
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
      if (activeMission.status === 'RUNNER_EN_ROUTE_TO_VENDOR') {
        await updateDoc(doc(db, "orders", activeMission.id), { 
          status: 'IN_TRANSIT',
          pickup_time: serverTimestamp() 
        });
      } else if (activeMission.status === 'IN_TRANSIT') {
        if (!podPhoto) {
          alert("Evidence Capture Required: Please take a photo of the delivery.");
          setIsUploading(false);
          return;
        }

        // 1. Upload PoD to Storage
        const storageRef = ref(storage, `delivery_proofs/${activeMission.id}_${Date.now()}.jpg`);
        const uploadResult = await uploadBytes(storageRef, podPhoto);
        const proofUrl = await getDownloadURL(uploadResult.ref);

        // 2. Finalize via Server Action
        const res = await completeDelivery(activeMission.id, proofUrl);

        if (res.success) {
           // 3. Update Runner Balance (Atomic Transaction)
           const userRef = doc(db, "users", auth.currentUser?.uid || "");
           const userSnap = await getDoc(userRef);
           const payout = activeMission.fee || 4.50;
           
           await updateDoc(userRef, {
             balance: (userSnap.data()?.balance || 0) + payout
           });

           setPodPhoto(null);
           setPodPreview(null);
        } else {
           throw res.message;
        }
      }
    } catch (e: any) {
      alert(`Terminal Error: ${e}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
      <div className="w-8 h-8 border-[1.5px] border-[#F2F2F7] border-t-[#1C1C1E] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-screen max-h-screen w-full bg-white flex flex-col relative overflow-hidden m-0 p-0">
      
      {/* 1. Header (Mode Switch) - Pure Institutional */}
      <div className="shrink-0 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100 px-6 py-5 relative z-[100] flex items-center justify-between m-0">
         <button onClick={() => router.push('/home')} className="flex items-center text-slate-400 hover:text-navy active:scale-95 transition-all">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
            <span className="text-[13px] font-bold tracking-tight">Back to Campus</span>
         </button>
         
         <div className="flex items-center gap-3">
            <span className={`text-[10px] font-black tracking-widest uppercase ${isOnline ? 'text-emerald-500' : 'text-slate-300'}`}>
               {isOnline ? 'Terminal Online' : 'Offline'}
            </span>
            <button 
               onClick={() => setIsOnline(!isOnline)}
               className={`w-[48px] h-[26px] rounded-full p-[2px] transition-all duration-500 ease-in-out shrink-0 ${isOnline ? 'bg-navy' : 'bg-slate-100'}`}
            >
               <div className={`w-[22px] h-[22px] bg-white rounded-full shadow-lg transform transition-transform duration-500 ease-in-out ${isOnline ? 'translate-x-[22px]' : 'translate-x-0'}`} />
            </button>
         </div>
      </div>

      {/* 2. Top Half (Logistics Map) - Flush with soft gradient fade */}
      <div className="w-full h-[35vh] bg-slate-50 z-0 relative shrink-0 m-0 p-0 block overflow-hidden border-b-[0.5px] border-slate-100">
         <LiveMap hasActiveJob={!!activeMission} />
         <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white/20 to-transparent" />
      </div>

      {/* 3. Bottom Half: Scrollable Dashboard Content */}
      <div className="flex-1 bg-white p-6 pb-20 overflow-y-auto relative z-10">
         
         {/* Section A: Active / Next Delivery */}
         <div>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mb-4">
               {activeMission ? 'Current Protocol' : 'Waiting Room'}
            </p>
            
            {activeMission ? (
               <div className="bg-white rounded-[24px] p-7 border-[0.5px] border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] mb-8">
                  <div className="flex justify-between items-start mb-8">
                     <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100/50">
                           <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Active Pulse</span>
                        </span>
                        <h2 className="text-[20px] font-bold text-navy tracking-tight mt-2">#{activeMission.id.substring(0,8).toUpperCase()}</h2>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Est. Earnings</p>
                        <p className="text-[18px] font-black text-navy">RM {(activeMission.fee || 4.50).toFixed(2)}</p>
                     </div>
                  </div>
                  
                  <div className="relative pl-7 mb-8 space-y-8">
                     <div className="absolute left-[3px] top-[10px] bottom-[10px] w-[0.5px] bg-slate-100"></div>
                     <div className="relative">
                        <div className="absolute left-[-28px] top-[4px] w-2 h-2 rounded-full border-2 border-white bg-navy shadow-sm"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Pickup Point</p>
                        <p className="text-[15px] font-bold text-navy leading-none">{activeMission.source || 'Library Kiosk'}</p>
                     </div>
                     <div className="relative">
                        <div className="absolute left-[-28px] top-[4px] w-2 h-2 rounded-full border-2 border-white bg-emerald-500 shadow-sm"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Drop-off Hub</p>
                        <p className="text-[15px] font-bold text-navy leading-none">{activeMission.dest || 'Admin Office'}</p>
                     </div>
                  </div>

                  {/* ── MATURE POD CAPTURE LAYER ── */}
                  {activeMission.status === 'IN_TRANSIT' && (
                     <div className="mb-8 p-1 bg-slate-50/50 rounded-[20px] border-[0.5px] border-slate-100">
                        {!podPreview ? (
                           <label className="flex flex-col items-center justify-center w-full h-36 rounded-[18px] bg-white cursor-pointer hover:bg-slate-50 transition-all group">
                              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                 <Camera className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                              </div>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Capture Evidence</p>
                              <input 
                                 type="file" 
                                 className="hidden" 
                                 accept="image/*" 
                                 capture="environment" 
                                 onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                       setPodPhoto(file);
                                       setPodPreview(URL.createObjectURL(file));
                                    }
                                 }} 
                              />
                           </label>
                        ) : (
                           <div className="relative w-full h-48 rounded-[18px] overflow-hidden border border-slate-100">
                              <img src={podPreview} className="w-full h-full object-cover" />
                              <button 
                                 onClick={() => { setPodPhoto(null); setPodPreview(null); }}
                                 className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-xl active:scale-90 transition-all"
                              >
                                 <X size={16} className="text-navy" />
                              </button>
                           </div>
                        )}
                     </div>
                  )}

                  <SwipeToAccept 
                     key={activeMission.status} 
                     onSuccess={handleActionClick} 
                     loading={isUploading}
                     defaultText={activeMission.status === 'RUNNER_EN_ROUTE_TO_VENDOR' ? 'SLIDE TO ARRIVE' : podPhoto ? 'SLIDE TO COMPLETE' : 'CAPTURE PROOF TO FINISH'}
                     successText="VERIFIED ✓"
                  />
               </div>
            ) : (
               jobs.length > 0 ? (
                  <div className="bg-white rounded-[24px] p-7 border-[0.5px] border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] mb-8">
                     <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                           450m from you
                        </span>
                        <p className="text-[20px] font-black text-navy tracking-tight">RM {jobs[0].fee ? jobs[0].fee.toFixed(2) : '4.50'}</p>
                     </div>
                     <div className="relative pl-7 mb-6 space-y-6">
                        <div className="absolute left-[3px] top-[10px] bottom-[10px] w-[0.5px] bg-slate-100"></div>
                        <div className="relative">
                           <div className="absolute left-[-28px] top-[4px] w-2 h-2 rounded-full border-2 border-white bg-navy opacity-20"></div>
                           <p className="text-[14px] font-bold text-navy leading-none">{jobs[0].source}</p>
                        </div>
                        <div className="relative">
                           <div className="absolute left-[-28px] top-[4px] w-2 h-2 rounded-full border-2 border-white bg-emerald-500 opacity-20"></div>
                           <p className="text-[14px] font-bold text-navy leading-none">{jobs[0].dest}</p>
                        </div>
                     </div>
                     <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-6">Standard Bundle • 10m Est.</p>
                     <SwipeToAccept 
                       key={jobs[0].id} 
                       onSuccess={() => handleAcceptJob(jobs[0].id)} 
                       defaultText="SWIPE TO ACCEPT" 
                       successText="CLAIMED ✓"
                     />
                  </div>
               ) : (
                  <div className="bg-[#FDFDFD] rounded-[24px] p-12 border-[0.5px] border-slate-100 border-dashed text-center mb-8">
                     <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-2 h-2 bg-slate-200 rounded-full animate-ping" />
                     </div>
                     <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                       {isOnline ? "Scanning Registry..." : "Terminal Disconnected"}
                     </p>
                  </div>
               )
            )}
         </div>

         {/* Section B: Today's Summary */}
         <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase mt-4 mb-4">Carrier Performance</p>
         <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-[20px] p-6 border-[0.5px] border-slate-100">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Session Revenue</p>
               <p className="text-[20px] font-black text-navy tracking-tight">RM {(profile?.balance || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-[20px] p-6 border-[0.5px] border-slate-100">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Audit Score</p>
               <p className="text-[20px] font-black text-navy tracking-tight">4.98/5</p>
            </div>
         </div>

         {/* Section C: Preferences Shortcut */}
         <button className="w-full h-16 bg-slate-50/50 border-[0.5px] border-slate-100 text-navy font-bold text-[13px] rounded-[18px] active:scale-95 transition-all flex items-center justify-center gap-2">
            <Settings size={16} className="text-slate-400" />
            Carrier Preferences
         </button>

      </div>
    </div>
  );
}
