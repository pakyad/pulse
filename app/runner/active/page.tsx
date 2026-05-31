"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayRemove, increment } from 'firebase/firestore';
import { 
  ChevronLeft, MapPin, Package, ShieldCheck, Truck, Phone, X, 
  AlertTriangle, CheckCircle2, Navigation, ClipboardList, Info,
  ExternalLink, ArrowRight
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { motion, AnimatePresence } from 'framer-motion';

function RunnerActivePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    let unsub: (() => void) | undefined;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        if (unsub) unsub();
        router.push('/auth');
        return;
      }

      unsub = onSnapshot(doc(db, 'orders', orderId), (snap) => {
        if (snap.exists()) setOrder({ id: snap.id, ...snap.data() });
        setLoading(false);
      }, (error) => {
        console.error("Mission sync error:", error);
      });
    });

    return () => {
      unsubAuth();
      if (unsub) unsub();
    };
  }, [orderId, router]);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    if (!order) return;

    const enRouteStatuses = ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'ARRIVED_AT_DESTINATION'];
    if (!enRouteStatuses.includes(order.status)) return;

    const currentOrderId = order.id;
    let lastWriteTime = 0;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const now = Date.now();
        
        if (now - lastWriteTime > 5000) {
          lastWriteTime = now;
          try {
            await updateDoc(doc(db, 'orders', currentOrderId), {
              runner_location: { latitude, longitude },
              runner_location_updated_at: new Date().toISOString()
            });
          } catch (err) {
            console.warn("Failed to write live GPS coordinates:", err);
          }
        }
      },
      (err) => console.warn("Geolocation watch error:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [order?.id, order?.status]);

  const handlePickup = async () => {
    if (!orderId) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'ON_THE_WAY',
        picked_up_at: new Date().toISOString()
      });
    } catch (err) {
      alert('Node Sync Failed. Try again.');
    }
  };

  const handleVerifyHandshake = async () => {
    if (!orderId || verificationCode.length !== 4) return;
    setIsVerifying(true);
    
    if (verificationCode === order.handshake_code) {
      try {
        const orderRef = doc(db, 'orders', orderId);
        const runnerRef = doc(db, 'users', auth.currentUser!.uid);

        await updateDoc(orderRef, {
          status: 'COMPLETED',
          completed_at: new Date().toISOString()
        });

        await updateDoc(runnerRef, {
          current_missions: arrayRemove(orderId),
          hustle_score: increment(25)
        });
      } catch (err) {
        alert('Verification protocol error.');
      }
    } else {
      alert('Invalid Handshake Code. Access Denied.');
      setVerificationCode('');
    }
    setIsVerifying(false);
  };

  const handleCancelMission = async () => {
    if (!orderId) return;
    try {
      const orderRef = doc(db, 'orders', orderId);
      const runnerRef = doc(db, 'users', auth.currentUser!.uid);

      await updateDoc(orderRef, {
        status: 'AWAITING_RUNNER',
        runner_id: null,
        runner_name: null,
        accepted_at: null
      });

      await updateDoc(runnerRef, {
        current_missions: arrayRemove(orderId),
        hustle_score: increment(-50)
      });

      router.push('/run');
    } catch (err) {
      alert('Abort sequence failed.');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-8">
       <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Loading Delivery Data</p>
       </div>
    </div>
  );

  if (!order) { router.push('/run'); return null; }

  const isONTHEWAY = order.status === 'ON_THE_WAY';
  const isCOMPLETED = order.status === 'COMPLETED';
  
  // Simulation of items for the checklist
  const items = order.items || [{ name: order.title, quantity: 1 }];

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-navy font-sans antialiased flex flex-col">
      
      {/* ── Institutional Header ── */}
      <nav className="px-8 pt-16 pb-8 flex items-center justify-between shrink-0 bg-white border-b border-slate-100">
        <BackButton fallback="/run" />
        <div className="flex flex-col items-center">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Order ID: {order.id.slice(0,6).toUpperCase()}</span>
           <h2 className="text-[14px] font-black uppercase tracking-tightest mt-1">Order Status</h2>
        </div>
        <button onClick={() => setShowCancelModal(true)} className="w-12 h-12 rounded-[1.5rem] bg-red-50 border border-red-100 flex items-center justify-center text-red-500 transition-all active:scale-90">
           <X size={20} />
        </button>
      </nav>

      {/* ── Dashboard Content ── */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-12 scrollbar-hide">
         
         {/* Instruction Block */}
         <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Active Instruction</p>
            <h1 className="text-[32px] font-black tracking-tightest leading-none uppercase">
               {order.status === 'AWAITING_MERCHANT_ACCEPT' && "Waiting for Merchant"}
               {['PREPARING', 'READY_FOR_PICKUP'].includes(order.status) && "Proceed to Merchant"}
               {order.status === 'ARRIVED_AT_MERCHANT' && "Verify Items"}
               {order.status === 'ON_THE_WAY' && "Start Transit"}
               {order.status === 'ARRIVED_AT_BUYER' && "Ready to Handover"}
               {isCOMPLETED && "Delivery Successful"}
            </h1>
         </div>

         {/* Logistics Timeline */}
         <div className="space-y-6 relative">
            <div className="absolute left-6 top-8 bottom-8 w-px border-l-2 border-dashed border-slate-100" />
            
            {/* NODE 1: MERCHANT */}
            <NodeItem 
              active={['AWAITING_MERCHANT_ACCEPT', 'PREPARING', 'READY_FOR_PICKUP', 'ARRIVED_AT_MERCHANT'].includes(order.status)}
              completed={['ON_THE_WAY', 'ARRIVED_AT_BUYER', 'COMPLETED'].includes(order.status)}
              title="Merchant Point"
              detail={order.seller_name}
              icon={<Package size={20} />}
              description="Pick up items and verify contents."
            />

            {/* NODE 2: DESTINATION */}
            <NodeItem 
              active={['ON_THE_WAY', 'ARRIVED_AT_BUYER'].includes(order.status)}
              completed={order.status === 'COMPLETED'}
              title="Destination Node"
              detail={order.drop_off_location}
              icon={<MapPin size={20} />}
              description={
                <>
                  Drop off at specified campus zone.
                  {(order.floorLevel || order.roomNumber) && (
                    <div className="mt-2 p-3 bg-navy/5 rounded-xl border border-navy/5">
                      <p className="text-[10px] font-black text-navy uppercase tracking-widest leading-none mb-1">Floor & Room</p>
                      <p className="text-[13px] font-bold text-navy">
                        {order.floorLevel ? `Floor: ${order.floorLevel}` : ''}
                        {order.floorLevel && order.roomNumber ? ' • ' : ''}
                        {order.roomNumber ? `Room: ${order.roomNumber}` : ''}
                      </p>
                    </div>
                  )}
                </>
              }
            />
         </div>

         {/* Instructional Cards based on status */}
         <AnimatePresence mode="wait">
            {order.status === 'ARRIVED_AT_MERCHANT' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-navy rounded-[2.5rem] p-8 text-white space-y-6 shadow-md shadow-navy/20"
              >
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <ClipboardList className="text-emerald-400" size={24} />
                       <h4 className="text-[14px] font-black uppercase tracking-widest">Verify Items</h4>
                    </div>
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                       {Object.values(checklist).filter(Boolean).length}/{items.length} Checked
                    </span>
                 </div>
                 
                 <div className="space-y-3">
                    {items.map((item: any, i: number) => (
                      <button 
                        key={i}
                        onClick={() => setChecklist(prev => ({ ...prev, [i]: !prev[i] }))}
                        className={`w-full p-5 rounded-2xl border flex items-center justify-between transition-all ${checklist[i] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/60'}`}
                      >
                         <span className="font-bold text-[14px]">{item.quantity}x {item.name}</span>
                         {checklist[i] ? <CheckCircle2 size={18} /> : <div className="w-5 h-5 rounded-full border-2 border-white/10" />}
                      </button>
                    ))}
                 </div>
              </motion.div>
            )}

            {order.status === 'ACCEPTED' && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                 className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm"
               >
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-navy/5 flex items-center justify-center text-navy">
                        <Info size={24} />
                     </div>
                     <div>
                        <p className="text-[14px] font-black uppercase tracking-tightest">Meeting Details</p>
                        <p className="text-[12px] text-slate-400 font-medium leading-relaxed mt-1">
                           The merchant is located at the <span className="text-navy font-bold">Main Cafeteria, Stall 04</span>. Please verify the order number upon arrival.
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button className="flex-1 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest">
                        <Phone size={14} /> Contact Vendor
                     </button>
                  </div>
               </motion.div>
            )}

            {order.status === 'ON_THE_WAY' && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                 className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm"
               >
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                        <Navigation size={24} />
                     </div>
                     <div>
                        <p className="text-[14px] font-black uppercase tracking-tightest">Navigation Protocol</p>
                        <p className="text-[12px] text-slate-400 font-medium leading-relaxed mt-1">
                           Drop-off Zone: <span className="text-navy font-bold">{order.drop_off_location}</span>. <br/>
                           Note: The buyer is waiting at the library entrance.
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button className="flex-1 h-14 rounded-2xl bg-navy text-white flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest">
                        <Phone size={14} /> Contact Buyer
                     </button>
                     <button className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <ExternalLink size={20} className="text-slate-400" />
                     </button>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* ── Sticky Action Terminal ── */}
      <div className="px-8 pt-8 pb-12 bg-white border-t border-slate-100 shrink-0">
         <AnimatePresence mode="wait">
            {order.status === 'AWAITING_MERCHANT_ACCEPT' && (
              <div className="w-full h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center gap-3 border border-slate-100">
                <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] font-black uppercase tracking-widest text-navy/40">Waiting for Merchant to Accept</span>
              </div>
            )}

            {order.status === 'PREPARING' && (
              <ActionButton 
                key="arrived_merchant"
                label="Arrived at Merchant"
                onClick={() => updateDoc(doc(db, 'orders', orderId!), { status: 'ARRIVED_AT_MERCHANT' })}
                color="navy"
              />
            )}

            {order.status === 'READY_FOR_PICKUP' && (
              <ActionButton 
                key="arrived_merchant"
                label="Arrived at Merchant"
                onClick={() => updateDoc(doc(db, 'orders', orderId!), { status: 'ARRIVED_AT_MERCHANT' })}
                color="navy"
              />
            )}

            {order.status === 'ARRIVED_AT_MERCHANT' && (
               <ActionButton 
                 key="pickup"
                 label="Confirm Pickup"
                 disabled={Object.values(checklist).filter(Boolean).length < items.length}
                 onClick={handlePickup}
                 color="emerald"
               />
            )}

             {order.status === 'ON_THE_WAY' && (
                <div className="space-y-3">
                   <ActionButton 
                    key="arrived_building"
                    label="Arrived at Building"
                    onClick={() => updateDoc(doc(db, 'orders', orderId!), { status: 'ARRIVED_AT_BUILDING' })}
                    color="navy"
                  />
                  <button 
                    onClick={() => updateDoc(doc(db, 'orders', orderId!), { status: 'ARRIVED_AT_BUYER' })}
                    className="w-full h-12 bg-white border border-slate-100 text-slate-300 rounded-2xl font-bold text-[11px] uppercase tracking-widest"
                  >
                    Skip to Buyer Arrived
                  </button>
                </div>
             )}

             {order.status === 'ARRIVED_AT_BUILDING' && (
                <ActionButton 
                  key="arrived_buyer"
                  label="Arrived at Drop-off"
                  onClick={() => updateDoc(doc(db, 'orders', orderId!), { status: 'ARRIVED_AT_BUYER' })}
                  color="emerald"
                />
             )}

            {order.status === 'ARRIVED_AT_BUYER' && !isCOMPLETED && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                 className="space-y-4"
               >
                  <div className="flex gap-3 mb-4">
                     {[0,1,2,3].map(i => (
                       <div key={i} className="flex-1 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
                          <span className="text-[24px] font-black text-navy">{verificationCode[i] || ''}</span>
                       </div>
                     ))}
                  </div>
                  <input 
                     type="number" 
                     maxLength={4}
                     autoFocus
                     value={verificationCode}
                     onChange={(e) => setVerificationCode(e.target.value.slice(0,4))}
                     placeholder="INPUT 4-DIGIT CODE"
                     className="w-full h-20 bg-slate-50 border border-slate-100 text-center rounded-[2rem] font-black text-[15px] uppercase tracking-[0.2em] outline-none focus:ring-4 focus:ring-navy/5 transition-all"
                  />
                  <button 
                   onClick={handleVerifyHandshake}
                   disabled={verificationCode.length !== 4 || isVerifying}
                   className="w-full h-20 bg-navy text-white rounded-[2rem] font-black text-[15px] uppercase tracking-widest disabled:opacity-30 flex items-center justify-center gap-3"
                  >
                    {isVerifying ? 'Checking...' : (
                      <>Finish Delivery <ArrowRight size={20} /></>
                    )}
                  </button>
               </motion.div>
            )}

            {isCOMPLETED && (
               <motion.div
                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                 className="flex flex-col items-center gap-6"
               >
                  <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                     <CheckCircle2 size={40} />
                  </div>
                  <div className="text-center">
                     <h2 className="text-[24px] font-black uppercase tracking-tightest">Delivery Done</h2>
                     <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-2">RM 2.00 Earned</p>
                  </div>
                  <button onClick={() => router.push('/run')} className="w-full h-16 bg-slate-50 text-navy rounded-[1.8rem] font-black text-[13px] uppercase tracking-widest border border-slate-100">Return to Hub</button>
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/* ── Cancel Modal ── */}
      <AnimatePresence>
         {showCancelModal && (
            <div className="fixed inset-0 z-500 bg-black/60 backdrop-blur-md flex items-center justify-center p-8">
               <motion.div 
                 initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                 className="bg-white border border-slate-100 rounded-[3rem] p-10 w-full max-w-sm space-y-8"
               >
                  <div className="w-16 h-16 rounded-[1.5rem] bg-red-50 text-red-500 flex items-center justify-center mx-auto">
                     <AlertTriangle size={32} />
                  </div>
                  <div className="text-center space-y-2">
                     <h3 className="text-[20px] font-black uppercase tracking-tightest">Cancel Delivery?</h3>
                     <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                        Cancelling this will reduce your <span className="text-red-500 font-bold">Hustle Score by 50</span>.
                     </p>
                  </div>
                  <div className="space-y-3 pt-2">
                     <button onClick={handleCancelMission} className="w-full h-16 bg-red-500 text-white rounded-[1.8rem] font-black text-[13px] uppercase tracking-widest">Yes, Cancel</button>
                     <button onClick={() => setShowCancelModal(false)} className="w-full h-16 bg-slate-50 text-slate-400 rounded-[1.8rem] font-black text-[13px] uppercase tracking-widest">No, Keep Delivery</button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </main>
  );
}

export default function RunnerActivePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-navy flex items-center justify-center p-8">
         <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Loading Delivery Data</p>
         </div>
      </div>
    }>
      <RunnerActivePageContent />
    </Suspense>
  );
}

// ── Shared UI Components ──

function NodeItem({ active, completed, title, detail, icon, description }: any) {
  return (
    <div className="flex items-start gap-8">
       <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center border transition-all duration-500 shrink-0 ${active ? 'bg-navy text-white border-navy shadow-md shadow-navy/20 scale-110' : completed ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-50 text-slate-200 border-slate-100'}`}>
          {completed ? <CheckCircle2 size={20} /> : icon}
       </div>
       <div className="pt-1">
          <p className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-navy' : 'text-slate-300'}`}>{title}</p>
          <p className={`text-[16px] font-black tracking-tightest uppercase truncate max-w-[200px] ${active ? 'text-navy' : 'text-slate-300'}`}>{detail}</p>
          {active && <p className="text-[12px] text-slate-400 font-medium leading-relaxed mt-2">{description}</p>}
       </div>
    </div>
  );
}

function ActionButton({ label, onClick, color, disabled }: any) {
  const bg = color === 'navy' ? 'bg-navy shadow-navy/20' : 'bg-emerald-500 shadow-emerald-500/20';
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      disabled={disabled}
      onClick={onClick}
      className={`w-full h-20 ${bg} text-white rounded-[2rem] font-black text-[15px] uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30`}
    >
       {label} <ArrowRight size={20} />
    </motion.button>
  );
}
