"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

export default function CarrierTerminal() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeMission, setActiveMission] = useState<any>(null);
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
        await updateDoc(doc(db, "orders", activeMission.id), { 
          status: 'DELIVERED', 
          completed_at: serverTimestamp(),
        });
      }
    } catch (e) {
      alert("Error updating status");
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
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans selection:bg-[#F2F2F7]">
      
      {/* 1. Top App Bar & Status (Fixed to override global layout) */}
      <div className="bg-[#FFFFFF] fixed top-0 left-0 right-0 z-[100] h-20 px-5 pt-8 pb-4 flex items-center justify-between border-b-[0.5px] border-[#E5E5EA]">
        <h1 className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Pulse Runner</h1>
        <div className="flex items-center gap-3">
           <span className={`text-[13px] font-bold tracking-tight transition-colors ${isOnline ? 'text-[#34C759]' : 'text-[#8E8E93]'}`}>
              {isOnline ? 'Online' : 'Offline'}
           </span>
           <button 
             onClick={() => setIsOnline(!isOnline)}
             className={`w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-200 ease-in-out shrink-0 ${isOnline ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'}`}
           >
             <div className={`w-[27px] h-[27px] bg-white rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15)] transform transition-transform duration-200 ease-in-out ${isOnline ? 'translate-x-[20px]' : 'translate-x-0'}`} />
           </button>
        </div>
      </div>

      <div className="flex-1 pt-24 pb-24">
         
         {activeMission ? (
           /* 2. Section 1: Active Job (The Map & Action Card) */
           <div className="border-b-[0.5px] border-[#E5E5EA] pb-6">
              {/* Map Placeholder */}
              <div className="w-full h-48 bg-[#F2F2F7] relative overflow-hidden border-b-[0.5px] border-[#E5E5EA]">
                 <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#E5E5EA 1px, transparent 1px), linear-gradient(90deg, #E5E5EA 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }}></div>
                 
                 <div className="absolute top-[40%] left-[30%]">
                    <div className="w-4 h-4 bg-[#007AFF] rounded-full border-2 border-white shadow-sm relative z-10"></div>
                    <div className="w-4 h-4 bg-[#007AFF] rounded-full absolute inset-0 animate-ping opacity-75"></div>
                 </div>
                 
                 <svg className="absolute top-[25%] left-[32%] w-[40%] h-[20%] text-[#1C1C1E] opacity-20" fill="none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" d="M 0 100 Q 50 0 100 0" />
                 </svg>

                 <div className="absolute top-[20%] right-[30%] flex flex-col items-center">
                    <div className="w-6 h-6 bg-[#34C759] rounded-full border-2 border-white shadow-sm flex items-center justify-center relative z-10">
                       <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                 </div>
              </div>

              {/* Job Details */}
              <div className="px-5 pt-6">
                 <div className="flex items-center justify-between mb-2">
                    <h2 className="text-[13px] font-bold text-[#8E8E93] tracking-widest uppercase">Current Task</h2>
                    <span className="text-[11px] font-bold text-[#00927C] bg-[#E8F8EE] px-2 py-0.5 rounded-full uppercase tracking-wider">
                       {activeMission.status === 'RUNNER_EN_ROUTE_TO_VENDOR' ? 'Heading to Vendor' : 'In Transit'}
                    </span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <p className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Pickup at {activeMission.source || 'Vendor'}</p>
                    <p className="text-[15px] font-medium text-[#8E8E93]">Deliver to {activeMission.dest || 'Customer'}</p>
                 </div>
              </div>

              {/* Action Button */}
              <div className="px-4 mt-6">
                 <button 
                   onClick={handleActionClick}
                   disabled={isUploading}
                   className="w-full bg-[#1C1C1E] text-white text-[17px] font-bold py-4 rounded-[14px] active:scale-[0.98] transition-transform shadow-[0_4px_14px_rgba(0,0,0,0.1)] flex items-center justify-center disabled:opacity-50"
                 >
                    {isUploading ? (
                       <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#FFFFFF] border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                       </span>
                    ) : (
                       activeMission.status === 'RUNNER_EN_ROUTE_TO_VENDOR' ? 'Slide to Confirm Pickup' : 'Slide to Complete Delivery'
                    )}
                 </button>
              </div>
           </div>
         ) : (
           /* 3. Section 2: Available Jobs Radar */
           <div className="px-5 py-8">
              <h2 className="text-[18px] font-bold text-[#1C1C1E] tracking-tight mb-5">Nearby Deliveries</h2>
              
              <div className="flex flex-col space-y-4">
                 {!isOnline ? (
                    <div className="h-32 flex flex-col items-center justify-center bg-[#F9F9FB] rounded-[16px] border border-[#E5E5EA] border-dashed">
                       <p className="text-[14px] font-semibold text-[#8E8E93]">Go online to receive jobs.</p>
                    </div>
                 ) : jobs.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center bg-[#F9F9FB] rounded-[16px] border border-[#E5E5EA] border-dashed">
                       <p className="text-[14px] font-semibold text-[#8E8E93]">No deliveries nearby. Stay tuned.</p>
                    </div>
                 ) : (
                    jobs.map((job, idx) => (
                      <div key={job.id} className={`flex items-center justify-between pb-4 ${idx !== jobs.length - 1 ? 'border-b-[0.5px] border-[#E5E5EA]' : ''}`}>
                         <div>
                            <p className="text-[17px] font-bold text-[#1C1C1E] tracking-tight">RM {job.fee ? job.fee.toFixed(2) : '3.00'}</p>
                            <p className="text-[13px] font-medium text-[#8E8E93] mt-0.5">{job.source} → {job.dest}</p>
                         </div>
                         <button 
                           onClick={() => handleAcceptJob(job.id)}
                           className="text-[14px] font-bold text-[#34C759] bg-[#E8F8EE] px-5 py-2.5 rounded-[10px] active:opacity-70 transition-opacity tracking-tight"
                         >
                            Accept Job
                         </button>
                      </div>
                    ))
                 )}
              </div>
           </div>
         )}
      </div>

      {/* 4. Bottom Navigation Bar (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t-[0.5px] border-[#E5E5EA] pb-8 pt-3 px-6 z-[100]">
         <div className="flex items-center justify-between max-w-sm mx-auto">
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <svg className="w-[24px] h-[24px] text-[#1C1C1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
               <span className="text-[10px] font-bold text-[#1C1C1E]">Radar</span>
            </button>
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <svg className="w-[24px] h-[24px] text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
               <span className="text-[10px] font-bold text-[#8E8E93]">Tasks</span>
            </button>
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <svg className="w-[24px] h-[24px] text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               <span className="text-[10px] font-bold text-[#8E8E93]">Earnings</span>
            </button>
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <svg className="w-[24px] h-[24px] text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               <span className="text-[10px] font-bold text-[#8E8E93]">Profile</span>
            </button>
         </div>
      </div>

    </div>
  );
}
