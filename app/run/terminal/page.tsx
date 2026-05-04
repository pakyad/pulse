"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import dynamic from 'next/dynamic';

const LiveMap = dynamic(() => import('@/components/runner/LiveMap'), { ssr: false });
import SwipeToAccept from '@/components/runner/SwipeToAccept';

export default function CarrierTerminal() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
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
    <div className="h-screen max-h-screen w-full bg-white flex flex-col relative overflow-hidden m-0 p-0">
      
      {/* 1. Header (Mode Switch) - Static, no margins */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-3 relative z-[100] flex items-center justify-between m-0 shadow-sm">
         <button onClick={() => router.push('/home')} className="flex items-center text-gray-900 active:scale-95 transition-transform">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            <span className="text-sm font-bold">Back to Campus</span>
         </button>
         
         <div className="flex items-center gap-2">
            <span className={`text-xs font-bold tracking-tight uppercase ${isOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
               {isOnline ? 'Online' : 'Offline'}
            </span>
            <button 
               onClick={() => setIsOnline(!isOnline)}
               className={`w-[44px] h-[26px] rounded-full p-[2px] transition-colors duration-200 ease-in-out shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-gray-200'}`}
            >
               <div className={`w-[22px] h-[22px] bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out ${isOnline ? 'translate-x-[18px]' : 'translate-x-0'}`} />
            </button>
         </div>
      </div>

      {/* 2. Top Half (Logistics Map) - Completely Flush */}
      <div className="w-full h-[40vh] bg-gray-100 z-0 relative shrink-0 m-0 p-0 block overflow-hidden">
         <LiveMap hasActiveJob={!!activeMission} />
      </div>

      {/* 3. Bottom Half: Scrollable Dashboard Content */}
      <div className="flex-1 bg-gray-50 p-4 pb-12 overflow-y-auto relative z-10">
         
         {/* Section A: Active / Next Delivery */}
         <div>
            <h2 className="text-xs font-bold text-neutral-400 tracking-widest uppercase mb-3">
               {activeMission ? 'Active Delivery' : 'Next Request'}
            </h2>
            
            {activeMission ? (
               <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/60 mb-6">
                  <div className="flex justify-between items-center mb-4">
                     <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        EN ROUTE
                     </span>
                     <p className="text-xl font-extrabold text-black">Order #{activeMission.id.substring(0,8).toUpperCase()}</p>
                  </div>
                  
                  <div className="relative pl-5 mb-4">
                     <div className="absolute left-[7px] top-[8px] bottom-[8px] w-[1px] bg-gray-200"></div>
                     <div className="mb-4 relative">
                        <div className="absolute left-[-20px] top-[6px] w-2 h-2 rounded-full bg-gray-900"></div>
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">Take From</p>
                        <p className="text-[13px] text-gray-500">{activeMission.source || 'Library Kiosk'}</p>
                     </div>
                     <div className="relative">
                        <div className="absolute left-[-20px] top-[6px] w-2 h-2 rounded-full bg-emerald-500"></div>
                        <p className="text-sm font-bold text-gray-900 leading-none mb-1">Deliver To</p>
                        <p className="text-[13px] text-gray-500">{activeMission.dest || 'Admin Office'}</p>
                     </div>
                  </div>

                  <SwipeToAccept 
                     key={activeMission.status} 
                     onSuccess={handleActionClick} 
                     loading={isUploading}
                     defaultText={activeMission.status === 'RUNNER_EN_ROUTE_TO_VENDOR' ? 'SLIDE TO ARRIVE' : 'SLIDE TO COMPLETE'}
                     successText="CONFIRMED ✓"
                  />
               </div>
            ) : (
               jobs.length > 0 ? (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200/60 mb-6">
                     <div className="flex justify-between items-center mb-4">
                        <span className="bg-gray-50 text-gray-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                           📍 450m away
                        </span>
                        <p className="text-xl font-extrabold text-black">RM {jobs[0].fee ? jobs[0].fee.toFixed(2) : '3.00'}</p>
                     </div>
                     <div className="relative pl-5 mb-2">
                        <div className="absolute left-[7px] top-[8px] bottom-[8px] w-[1px] bg-gray-200"></div>
                        <div className="mb-3 relative">
                           <div className="absolute left-[-20px] top-[6px] w-2 h-2 rounded-full bg-gray-900"></div>
                           <p className="text-sm font-semibold text-gray-900 leading-none">{jobs[0].source}</p>
                        </div>
                        <div className="relative">
                           <div className="absolute left-[-20px] top-[6px] w-2 h-2 rounded-full bg-emerald-500"></div>
                           <p className="text-sm font-semibold text-gray-900 leading-none">{jobs[0].dest}</p>
                        </div>
                     </div>
                     <p className="text-xs text-gray-500 font-medium mt-2">2 Items • Est. 10 mins</p>
                     <SwipeToAccept 
                       key={jobs[0].id} 
                       onSuccess={() => handleAcceptJob(jobs[0].id)} 
                       defaultText="SWIPE TO ACCEPT" 
                       successText="ACCEPTED ✓"
                     />
                  </div>
               ) : (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center mb-6">
                     <p className="text-sm font-semibold text-gray-500">
                       {isOnline ? "Scanning campus for requests..." : "Go online to receive delivery requests."}
                     </p>
                  </div>
               )
            )}
         </div>

         {/* Section B: Today's Summary */}
         <h2 className="text-xs font-bold text-neutral-400 tracking-widest uppercase mt-8 mb-3">Today's Summary</h2>
         <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Net Earnings</p>
               <p className="text-2xl font-bold text-gray-900">RM {(profile?.balance || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
               <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Completed</p>
               <p className="text-2xl font-bold text-gray-900">7 Trips</p>
            </div>
         </div>

         {/* Section C: Preferences Shortcut */}
         <button className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl mt-6 active:scale-95 transition-transform flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Runner Preferences
         </button>

      </div>
    </div>
  );
}
