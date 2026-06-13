"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayRemove, increment } from 'firebase/firestore';
import { 
  MapPin, Package, Truck, Phone, X, 
  AlertTriangle, CheckCircle2, Navigation, ClipboardList, Info,
  ExternalLink, ArrowRight, Store, User, ShieldCheck, Map
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
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
       <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-[11px] font-bold text-slate-400 ">Loading Delivery Data</p>
       </div>
    </div>
  );

  if (!order) { router.push('/run'); return null; }

  const isCOMPLETED = order.status === 'COMPLETED';
  const isCustomDelivery = order.type === 'CUSTOM' || !order.seller_id;
  const items = order.items || (order.title ? [{ name: order.title, quantity: 1 }] : []);
  
  // Custom Deliveries vs Marketplace Deliveries display different instruction headers.
  let instructionHeading = '';
  if (order.status === 'AWAITING_MERCHANT_ACCEPT') instructionHeading = 'Waiting for Merchant';
  else if (['PREPARING', 'READY_FOR_PICKUP'].includes(order.status)) instructionHeading = isCustomDelivery ? 'Head to Pickup Point' : 'Proceed to Merchant';
  else if (['ARRIVED_AT_MERCHANT', 'ARRIVED_AT_PICKUP'].includes(order.status)) instructionHeading = isCustomDelivery ? 'Collect Package' : 'Verify Order Items';
  else if (order.status === 'ON_THE_WAY') instructionHeading = 'Start Transit';
  else if (['ARRIVED_AT_BUILDING', 'ARRIVED_AT_BUYER'].includes(order.status)) instructionHeading = 'Ready to Handover';
  else if (isCOMPLETED) instructionHeading = 'Delivery Successful';
  else instructionHeading = 'Awaiting Status';

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans antialiased flex flex-col pb-36">
      
      {/*  Navbar  */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton fallback="/run" />
          <div>
            <p className="text-[14px] font-bold tracking-tight">Active Mission</p>
            <p className="text-[11px] font-medium text-slate-400">Order ID: #{order.id.slice(0,6).toUpperCase()}</p>
          </div>
        </div>
        <button onClick={() => setShowCancelModal(true)} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 border border-slate-100 active:scale-95 transition-all">
           <X size={18} />
        </button>
      </nav>

      {/*  Main Content  */}
      <div className="pt-28 px-6 space-y-8 flex-1">
         
         <div className="space-y-1">
            <h1 className="text-[28px] font-semibold tracking-tighter leading-tight text-slate-900">
               {instructionHeading}
            </h1>
            <p className="text-[13px] font-medium text-slate-400">
               {isCustomDelivery ? 'P2P Custom Delivery' : 'Marketplace Fulfillment'}
            </p>
         </div>

         {/*  Logistics Nodes (The Vibe: Cart Checkout)  */}
         <div className="space-y-4">
            <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Logistics Route</h2>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 relative">
               {/* Vertical connection line */}
               <div className="absolute left-[39px] top-12 bottom-12 w-px border-l-2 border-dashed border-slate-200" />
               
               {/* Node 1: Origin */}
               <div className="flex items-start gap-4 relative z-10 bg-slate-50 pb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                     ['AWAITING_MERCHANT_ACCEPT', 'PREPARING', 'READY_FOR_PICKUP', 'ARRIVED_AT_MERCHANT', 'ARRIVED_AT_PICKUP'].includes(order.status)
                     ? 'bg-slate-900 text-white border-blue-600 shadow-md shadow-slate-900/10'
                     : 'bg-white text-slate-300 border-slate-200'
                  }`}>
                     {isCustomDelivery ? <User size={18} /> : <Store size={18} />}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                     <p className="text-[13px] font-bold text-slate-900 truncate">
                        {isCustomDelivery ? (order.pickup_location || 'Pickup Point') : (order.seller_name || 'Merchant Point')}
                     </p>
                     <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                        {isCustomDelivery ? 'Collect item directly from sender.' : 'Pick up and verify order contents.'}
                     </p>
                  </div>
               </div>

               {/* Node 2: Destination */}
               <div className="flex items-start gap-4 relative z-10 bg-slate-50 pt-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                     ['ON_THE_WAY', 'ARRIVED_AT_BUILDING', 'ARRIVED_AT_BUYER'].includes(order.status)
                     ? 'bg-slate-900 text-white border-blue-600 shadow-md shadow-slate-900/10'
                     : isCOMPLETED 
                     ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                     : 'bg-white text-slate-300 border-slate-200'
                  }`}>
                     {isCOMPLETED ? <CheckCircle2 size={18} /> : <MapPin size={18} />}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                     <p className="text-[13px] font-bold text-slate-900 truncate">{order.drop_off_location || 'Destination'}</p>
                     <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                        {order.buyer_name ? `Deliver to ${order.buyer_name}` : 'Drop off to buyer'}
                     </p>
                     
                     {/* Indoor Details */}
                     {(order.floorLevel || order.roomNumber) && (
                       <div className="mt-3 p-3 bg-white border border-slate-100 rounded-xl">
                          <p className="text-[9px] font-semibold text-slate-400  leading-none mb-1.5">Indoor Drop-off</p>
                          <p className="text-[12px] font-bold text-slate-900">
                            {order.floorLevel ? `Lvl ${order.floorLevel}` : ''}
                            {order.floorLevel && order.roomNumber ? ' - ' : ''}
                            {order.roomNumber ? `Rm ${order.roomNumber}` : ''}
                          </p>
                       </div>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/*  Actionable Cards  */}
         <AnimatePresence mode="wait">
            
            {/* Marketplace Specific: Verification */}
            {!isCustomDelivery && ['ARRIVED_AT_MERCHANT'].includes(order.status) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 shadow-sm"
              >
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <ShieldCheck className="text-blue-600" size={20} />
                       <h4 className="text-[13px] font-bold text-slate-900">Verify Order Items</h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                       {Object.values(checklist).filter(Boolean).length}/{items.length} Checked
                    </span>
                 </div>
                 
                 <div className="space-y-2">
                    {items.map((item: any, i: number) => {
                      const checked = checklist[i];
                      return (
                        <button 
                          key={i}
                          onClick={() => setChecklist(prev => ({ ...prev, [i]: !prev[i] }))}
                          className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all active:scale-95 ${checked ? 'bg-blue-50/50 border-blue-600 ring-1 ring-blue-600 text-blue-700' : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-700'}`}
                        >
                           <span className="font-bold text-[13px]">{item.quantity}x {item.name || item.title}</span>
                           <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'bg-slate-900 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                             {checked && <CheckCircle2 size={12} strokeWidth={4} />}
                           </div>
                        </button>
                      );
                    })}
                 </div>
              </motion.div>
            )}

            {/* In-Transit Navigation Info */}
            {order.status === 'ON_THE_WAY' && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                 className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-5"
               >
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-md shadow-slate-900/10">
                        <Navigation size={18} />
                     </div>
                     <div>
                        <p className="text-[13px] font-bold text-blue-950">Navigation Protocol</p>
                        <p className="text-[12px] text-blue-800/70 font-medium leading-relaxed mt-0.5">
                           Deliver to: <span className="font-bold text-blue-900">{order.drop_off_location}</span>. <br/>
                           Please keep your GPS active.
                        </p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button className="flex-1 h-12 rounded-xl bg-white border border-blue-100 text-blue-700 font-bold text-[12px] flex items-center justify-center gap-2 active:scale-95 shadow-sm transition-all">
                        <Phone size={14} /> Call Buyer
                     </button>
                     <button className="w-12 h-12 rounded-xl bg-white border border-blue-100 text-blue-600 flex items-center justify-center active:scale-95 shadow-sm transition-all">
                        <Map size={18} />
                     </button>
                  </div>
               </motion.div>
            )}

            {/* Handshake Code Verification */}
            {order.status === 'ARRIVED_AT_BUYER' && !isCOMPLETED && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                 className="space-y-4"
               >
                  <div className="space-y-1 text-center pb-2">
                     <p className="text-[14px] font-bold text-slate-900">Security Handshake</p>
                     <p className="text-[11px] font-medium text-slate-400">Ask the buyer for their 4-digit code</p>
                  </div>
                  <div className="flex gap-2 mb-2">
                     {[0,1,2,3].map(i => (
                       <div key={i} className="flex-1 h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center shadow-inner">
                          <span className="text-[24px] font-semibold text-slate-900">{verificationCode[i] || ''}</span>
                       </div>
                     ))}
                  </div>
                  <input 
                     type="number" 
                     maxLength={4}
                     autoFocus
                     value={verificationCode}
                     onChange={(e) => setVerificationCode(e.target.value.slice(0,4))}
                     placeholder="INPUT CODE"
                     className="w-full h-16 bg-white border border-slate-200 text-center rounded-2xl font-semibold text-[14px]  outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all placeholder:text-slate-300"
                  />
                  <button 
                   onClick={handleVerifyHandshake}
                   disabled={verificationCode.length !== 4 || isVerifying}
                   className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[14px] disabled:opacity-30 disabled:shadow-none flex items-center justify-center gap-2 transition-all shadow-md shadow-slate-900/10 active:scale-95"
                  >
                    {isVerifying ? 'Checking...' : 'Complete Delivery'}
                  </button>
               </motion.div>
            )}

            {isCOMPLETED && (
               <motion.div
                 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                 className="flex flex-col items-center gap-5 pt-4"
               >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm">
                     <CheckCircle2 size={32} />
                  </div>
                  <div className="text-center space-y-1">
                     <h2 className="text-[20px] font-semibold tracking-tight text-slate-900">Delivery Done</h2>
                     <p className="text-[13px] font-bold text-emerald-600">RM 2.00 Earned</p>
                  </div>
                  <button onClick={() => router.push('/run')} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[13px] shadow-md shadow-slate-900/10 active:scale-95 transition-all mt-2">
                     Return to Hub
                  </button>
               </motion.div>
            )}
         </AnimatePresence>
      </div>

      {/*  Sticky Action Terminal  */}
      {!isCOMPLETED && order.status !== 'ARRIVED_AT_BUYER' && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-100 px-6 py-4 pb-8 pb-safe">
           <AnimatePresence mode="wait">
              {order.status === 'AWAITING_MERCHANT_ACCEPT' && (
                <div className="w-full h-14 bg-slate-50 rounded-2xl flex items-center justify-center gap-3 border border-slate-100">
                  <div className="w-4 h-4 border-[2.5px] border-slate-200 border-t-slate-400 rounded-full animate-spin" />
                  <span className="text-[12px] font-bold text-slate-400">Awaiting Merchant</span>
                </div>
              )}

              {['PREPARING', 'READY_FOR_PICKUP'].includes(order.status) && (
                <button 
                  key="arrived_merchant"
                  onClick={() => updateDoc(doc(db, 'orders', orderId!), { status: isCustomDelivery ? 'ARRIVED_AT_PICKUP' : 'ARRIVED_AT_MERCHANT' })}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 active:scale-95 transition-all"
                >
                  {isCustomDelivery ? 'Arrived at Pickup' : 'Arrived at Merchant'} <ArrowRight size={18} />
                </button>
              )}

              {/* Both Custom and Marketplace arrive here before transit */}
              {['ARRIVED_AT_MERCHANT', 'ARRIVED_AT_PICKUP'].includes(order.status) && (
                 <button 
                   key="pickup"
                   disabled={!isCustomDelivery && Object.values(checklist).filter(Boolean).length < items.length}
                   onClick={handlePickup}
                   className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 disabled:opacity-30 disabled:shadow-none active:scale-95 transition-all"
                 >
                   Confirm Pickup <ArrowRight size={18} />
                 </button>
              )}

               {order.status === 'ON_THE_WAY' && (
                  <div className="space-y-3">
                     <button 
                      key="arrived_building"
                      onClick={() => updateDoc(doc(db, 'orders', orderId!), { status: 'ARRIVED_AT_BUILDING' })}
                      className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 active:scale-95 transition-all"
                    >
                      Arrived at Building <ArrowRight size={18} />
                    </button>
                    <button 
                      onClick={() => updateDoc(doc(db, 'orders', orderId!), { status: 'ARRIVED_AT_BUYER' })}
                      className="w-full h-12 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold text-[12px] flex items-center justify-center active:scale-95 transition-all"
                    >
                      Skip directly to Drop-off
                    </button>
                  </div>
               )}

               {order.status === 'ARRIVED_AT_BUILDING' && (
                  <button 
                    key="arrived_buyer"
                    onClick={() => updateDoc(doc(db, 'orders', orderId!), { status: 'ARRIVED_AT_BUYER' })}
                    className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 active:scale-95 transition-all"
                  >
                    Arrived at Drop-off <ArrowRight size={18} />
                  </button>
               )}
           </AnimatePresence>
        </footer>
      )}

      {/*  Cancel Modal  */}
      <AnimatePresence>
         {showCancelModal && (
            <div className="fixed inset-0 z-100 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                 className="bg-white border border-slate-100 rounded-3xl p-8 w-full max-w-sm space-y-6 shadow-xl"
               >
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-100">
                     <AlertTriangle size={24} />
                  </div>
                  <div className="text-center space-y-1.5">
                     <h3 className="text-[18px] font-semibold tracking-tight text-slate-900">Cancel Delivery?</h3>
                     <p className="text-[12px] text-slate-400 font-medium leading-relaxed">
                        Cancelling this will reduce your Hustle Score by <span className="text-red-500 font-bold">50 points</span>. Are you sure?
                     </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                     <button onClick={() => setShowCancelModal(false)} className="w-full h-12 bg-slate-50 text-slate-500 rounded-xl font-bold text-[13px] border border-slate-100 active:scale-95 transition-all">
                        Keep It
                     </button>
                     <button onClick={handleCancelMission} className="w-full h-12 bg-red-500 text-white rounded-xl font-bold text-[13px] shadow-md shadow-red-500/20 active:scale-95 transition-all">
                        Yes, Cancel
                     </button>
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
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
         <div className="flex flex-col items-center gap-6">
            <div className="w-10 h-10 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
         </div>
      </div>
    }>
      <RunnerActivePageContent />
    </Suspense>
  );
}
