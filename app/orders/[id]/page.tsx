"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CheckCircle2, Package, Activity,
  Clock, ShieldCheck, MapPin, Receipt, Globe, Users,
  ShieldAlert, Truck, Info, XCircle, Star, Navigation, Loader2, X
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import PostDeliveryReview from '@/components/marketplace/PostDeliveryReview';
import { cancelOrder, releaseEscrow } from '@/app/actions/orderActions';
import OrderTracker from '@/components/shared/OrderTracker';
import { VoxelPulse, VoxelRadar, VoxelBox, VoxelCheck } from '@/components/shared/VoxelStatus';
import dynamic from 'next/dynamic';
import { parseLocationToken, getLocationBadge } from '@/lib/core/locations';

const BuyerLiveMap = dynamic(() => import('@/components/shared/BuyerLiveMap'), { ssr: false });

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


//  Order phases 
const PHASES = [
  { id: 1, label: 'Finding Runner', key: 'PENDING_RUNNER', icon: Package },
  { id: 2, label: 'Merchant Preparing', key: 'PREPARING', icon: Clock },
  { id: 3, label: 'Ready for Pickup', key: 'READY_FOR_PICKUP', icon: Truck },
  { id: 4, label: 'Runner Picked Up', key: 'PICKED_UP', icon: Truck },
  { id: 5, label: 'In Transit', key: 'IN_TRANSIT', icon: Truck },
  { id: 6, label: 'Delivered', key: 'DELIVERED', icon: CheckCircle2 },
];

function getPhase(status: string): number {
  const s = status.toUpperCase();
  if (s === 'DELIVERED' || s === 'COMPLETED') return 6;
  if (['IN_TRANSIT', 'ON_THE_WAY', 'ARRIVED_AT_DESTINATION'].includes(s)) return 5;
  if (s === 'PICKED_UP') return 4;
  if (s === 'READY_FOR_PICKUP' || s === 'AWAITING_RUNNER') return 3;
  if (s === 'PREPARING') return 2;
  return 1;
}



function getPathPoint(progress: number) {
  // Seg 1: (70,160) -> (70,100)  [len = 60]
  // Seg 2: (70,100) -> (330,100) [len = 260]
  // Seg 3: (330,100) -> (330,150)[len = 50]
  
  if (progress <= 0) return { x: 70, y: 160 };
  if (progress >= 1) return { x: 330, y: 150 };
  
  const total = 370;
  const p1 = 60 / total;
  const p2 = 320 / total;
  
  if (progress < p1) {
    const ratio = progress / p1;
    return {
      x: 70,
      y: 160 + (100 - 160) * ratio
    };
  } else if (progress < p2) {
    const ratio = (progress - p1) / (p2 - p1);
    return {
      x: 70 + (330 - 70) * ratio,
      y: 100
    };
  } else {
    const ratio = (progress - p2) / (1 - p2);
    return {
      x: 330,
      y: 100 + (150 - 100) * ratio
    };
  }
}

function StatusKinetics({ status, orderType }: { status: string, orderType?: string }) {
  const s = status?.toUpperCase() || '';
  const isCustom = ['PARCELS', 'ERRANDS'].includes((orderType || '').toUpperCase());
  
  // Determine kinetic state
  let state: 'WAITING' | 'PREPARING' | 'RUNNING' | 'DELIVERED' | 'CANCELLED' = 'RUNNING';
  if (s === 'CANCELLED') {
    state = 'CANCELLED';
  } else if (['PENDING', 'PENDING_RUNNER', 'PENDING_VENDOR', 'AWAITING_RUNNER'].includes(s)) {
    state = 'WAITING';
  } else if (['PREPARING', 'READY_FOR_PICKUP'].includes(s)) {
    state = 'PREPARING';
  } else if (['DELIVERED', 'COMPLETED'].includes(s)) {
    state = 'DELIVERED';
  }

  return (
    <div className={`w-full bg-white relative z-20 flex flex-col justify-center select-none`}>
      <AnimatePresence mode="wait">
        {state === 'WAITING' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between w-full px-8 mt-12"
          >
            <div className="flex-1 pr-6 space-y-1">
              <p className="text-[12px] font-semibold text-slate-500">Waiting for acceptance</p>
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight whitespace-pre-wrap">
                {isCustom ? "Finding a\ncourier" : "Waiting for\nmerchant"}
              </h1>
              <p className="text-[12px] font-medium text-[#94a3b8] leading-relaxed pt-1">
                {isCustom ? "We'll notify you once a runner accepts your order." : "The merchant is confirming your order."}
              </p>
            </div>
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center shrink-0 relative border border-orange-100">
               <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-20"></div>
               <VoxelRadar size={40} className="text-orange-500 relative z-10" />
            </div>
          </motion.div>
        )}

        {state === 'PREPARING' && (
          <motion.div
            key="preparing"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between w-full px-8 mt-12"
          >
            <div className="flex-1 pr-6 space-y-1">
              <p className="text-[12px] font-semibold text-slate-500">Order confirmed</p>
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight whitespace-pre-wrap">
                {isCustom ? "Runner is\nheading to pickup" : "Merchant is\npreparing"}
              </h1>
              <p className="text-[12px] font-medium text-[#94a3b8] leading-relaxed pt-1">
                {isCustom ? "Your runner is on the way to the pickup location." : "Please wait patiently while your order is packed."}
              </p>
            </div>
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center shrink-0 relative border border-blue-100">
               <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-20"></div>
               <VoxelBox size={40} className="text-blue-500 relative z-10" />
            </div>
          </motion.div>
        )}

        {state === 'RUNNING' && (
          <motion.div
            key="running"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between w-full px-8 mt-12"
          >
            <div className="flex-1 pr-6 space-y-1">
              <p className="text-[12px] font-semibold text-slate-500">Est. Arrival Time</p>
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight whitespace-pre-wrap">Runner is on{"\n"}the way</h1>
              <p className="text-[12px] font-medium text-[#94a3b8] leading-relaxed pt-1">Your courier is heading to the drop-off location.</p>
            </div>
            <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center shrink-0 relative border border-teal-100">
               <div className="absolute inset-0 bg-teal-200 rounded-full animate-ping opacity-20"></div>
               <VoxelPulse size={40} className="text-teal-500 relative z-10" />
            </div>
          </motion.div>
        )}

        {state === 'DELIVERED' && (
          <motion.div
            key="delivered"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between w-full px-8 mt-12"
          >
            <div className="flex-1 pr-6 space-y-1">
              <p className="text-[12px] font-semibold text-slate-500">Completed</p>
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">Order<br/>Delivered</h1>
              <p className="text-[12px] font-medium text-[#94a3b8] leading-relaxed pt-1">Enjoy your purchase and leave a review!</p>
            </div>
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 relative border border-emerald-100">
               <VoxelCheck size={40} className="text-emerald-500 relative z-10" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

//  Inline Report Form 
function InlineReportForm({ orderId, userId, order, onClose, onSuccess }: {
  orderId: string; userId: string; order: any; onClose: () => void; onSuccess: () => void;
}) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const { addDoc, collection, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/lib/firebase');

      let proofUrl = null;
      if (file) {
        const fileName = `buyer_evidence_${Date.now()}.jpg`;
        const storageRef = ref(storage, `disputes/${orderId}/${fileName}`);
        const snap = await uploadBytes(storageRef, file);
        proofUrl = await getDownloadURL(snap.ref);
      }

      await addDoc(collection(db, 'disputes'), {
        orderId,
        buyerId: userId,
        description: description.trim(),
        proofUrl,
        status: 'OPEN',
        createdAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'activityLogs'), {
        action: 'DISPUTE_FILED',
        itemId: order.items?.[0]?.productId || order.item_id || orderId,
        details: `Buyer filed dispute for order ${orderId}`,
        time: serverTimestamp(),
      });

      await updateDoc(doc(db, 'orders', orderId), { is_disputed: true });

      onSuccess();
    } catch (e) {
      console.error('[ReportIssue]', e);
      alert('Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-5 bg-white border border-slate-100 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-slate-900">Report an Issue</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X size={16} /></button>
      </div>
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the problem..."
        rows={3} className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-[13px] font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-all resize-none" />
      <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
        <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
        {file ? (
          <span className="text-[12px] font-medium text-emerald-600">Attached: {file.name.slice(0, 20)}</span>
        ) : (
          <>
            <ShieldAlert size={14} className="text-slate-300" />
            <span className="text-[11px] font-medium text-slate-400">Attach Evidence (optional)</span>
          </>
        )}
      </label>
      <button onClick={handleSubmit} disabled={!description.trim() || submitting}
        className="w-full h-11 rounded-xl bg-slate-900 text-white text-[12px] font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2">
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
        Submit Report
      </button>
    </div>
  );
}

export default function LiveOrderPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [sellerOfficial, setSellerOfficial] = useState(false);
  const [runnerProfile, setRunnerProfile] = useState<{name: string, photo: string} | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [mapSrc, setMapSrc] = useState('/map-bg.png');
  const [releasing, setReleasing] = useState(false);

  const handleReleaseEscrow = async () => {
    setReleasing(true);
    try {
      await releaseEscrow(id as string, userId);
    } catch (e) {
      console.error(e);
    } finally {
      setReleasing(false);
    }
  };

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
    if (key) {
      setMapSrc(`https://maps.googleapis.com/maps/api/staticmap?size=800x600&scale=2&maptype=roadmap&center=3.1594,101.6998&zoom=18&path=color:0xf59e0b|weight:6|3.159194,101.699500|3.1592,101.7000|3.159722,101.700278&markers=color:0xf59e0b%7Clabel:M%7C3.159194,101.699500&markers=color:0x10b981%7Clabel:B%7C3.159722,101.700278&style=feature:all%7Celement:labels.text.fill%7Ccolor:0x9c9c9c&style=feature:all%7Celement:labels.text.stroke%7Ccolor:0xffffff&style=feature:landscape%7Ccolor:0xf2f2f7&style=feature:poi%7Cvisibility:off&style=feature:road%7Ccolor:0xffffff&style=feature:water%7Ccolor:0xe5e5ea&key=${key}`);
    } else {
      setMapSrc('/map-bg.png');
    }
  }, []);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/auth'); return; }
      setUserId(user.uid);
      unsub = onSnapshot(doc(db, 'orders', id as string), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setOrder({ id: snap.id, ...data });
          
          // Fetch runner profile if id exists
          if (data.runner_id) {
            getDoc(doc(db, 'users', data.runner_id)).then(uSnap => {
              if (uSnap.exists()) {
                const uData = uSnap.data();
                setRunnerProfile({
                  name: uData.full_name || uData.fullName || uData.displayName || 'Pulse Runner',
                  photo: uData.photo_url || uData.avatar || ''
                });
              }
            });
          }
        }
        setLoading(false);
      });
    });

    // Fetch seller official status for review targeting
    if (order?.seller_id) {
      getDoc(doc(db, 'users', order.seller_id)).then(snap => {
        if (snap.exists()) setSellerOfficial(!!snap.data().is_official);
      });
    }
    return () => { unsubAuth(); unsub?.(); };
  }, [id, router, order?.seller_id]);


  //  Cancel order (PENDING_VENDOR only) 
  const handleCancelOrder = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await cancelOrder(id as string, 'BUYER', userId);
      if (!res.success) {
        throw new Error(res.message);
      }
      setShowCancelConfirm(false);
    } catch (e: any) {
      console.error('[Cancel]', e);
      setCancelError(e.message || 'Could not cancel. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  useEffect(() => {
    const status = (order?.status || 'PENDING').toUpperCase();
    const phase = getPhase(status);
    const isDone = phase === 6;

    if (isDone && !order?.hasAcknowledgedSuccess) {
      setShowSuccessOverlay(true);
      const timer = setTimeout(async () => {
        setShowSuccessOverlay(false);
        // Write acknowledgement flag so overlay never replays on reload
        try {
          await updateDoc(doc(db, 'orders', id as string), { hasAcknowledgedSuccess: true });
        } catch (e) {
          console.warn('[Success] Could not write acknowledgement flag:', e);
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [order?.status, order?.hasAcknowledgedSuccess]);

  // Live GPS Telemetry Walk Simulation
  useEffect(() => {
    if (!order) return;
    const statusUpper = (order.status || '').toUpperCase();
    const phase = getPhase(statusUpper);

    if (phase === 6) {
      setProgress(1);
      return;
    }

    if (['ON_THE_WAY', 'IN_TRANSIT', 'PICKED_UP'].includes(statusUpper)) {
      setProgress(0.05); // Start slightly forward
      const duration = 20000; // 20 seconds simulated transit walk
      const intervalTime = 100;
      const steps = duration / intervalTime;
      const increment = 1 / steps;

      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            clearInterval(timer);
            return 1;
          }
          return Math.min(prev + increment, 1);
        });
      }, intervalTime);

      return () => clearInterval(timer);
    } else {
      setProgress(0);
    }
  }, [order?.status]);

  const runnerPos = getPathPoint(progress);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-[3px] border-slate-100 border-t-[#6366f1] rounded-xl animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
        <ShieldAlert size={32} />
      </div>
      <p className="text-[14px] font-bold text-[#94a3b8]">Order not found</p>
      <button onClick={() => router.push('/me/orders')} className="h-12 px-8 bg-slate-900 text-white rounded-xl text-[13px] font-bold shadow-md shadow-slate-900/10 active:scale-95 transition-all">
        Back to Orders
      </button>
    </div>
  );

  const status = (order.status || 'PENDING').toUpperCase();
  const phase = getPhase(status);
  const isDone = phase === 6;
  const isCancelled = status === 'CANCELLED';
  const isPending = status === 'PENDING_VENDOR' || status === 'PENDING';
  const isDeliveredOrCompleted = status === 'DELIVERED' || status === 'COMPLETED';
  const showReview = isDeliveredOrCompleted && !order.isReviewed;

  const dropoffLat = 3.1594;
  const dropoffLng = 101.6998;
  const realDistance = order.runner_location?.latitude && order.runner_location?.longitude
    ? getDistance(order.runner_location.latitude, order.runner_location.longitude, dropoffLat, dropoffLng)
    : null;

  const dropOffNode = order.drop_off_location ? parseLocationToken(order.drop_off_location) : null;

  const distance = realDistance !== null 
    ? Math.max(0, Math.round(realDistance))
    : Math.max(0, Math.round(250 * (1 - progress)));

  const durationMin = Math.max(1, Math.ceil(distance / 80));
  const isClose = distance > 0 && distance < 200 && !isDone && !isCancelled;
  const isMoving = ['ON_THE_WAY', 'IN_TRANSIT', 'PICKED_UP'].includes(status);
  const isRunner = userId === order.runner_id;
  const showBuyerMap = isMoving && !!order.runner_location;
  const isServiceOrder = order?.deliveryMethod === 'DIGITAL' || order?.deliveryMethod === 'F2F_CAMPUS';
  const hasMapHero = !isServiceOrder && (isRunner || showBuyerMap);

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-36 relative">

      {/*  VIBRANT MAP HERO  */}
      {!isCancelled && hasMapHero && (
        <div className="absolute top-0 left-0 right-0 h-[380px] z-0 overflow-hidden bg-slate-100">
          {/* Map rendered below without washing-out gradients */}
          
          {/* Google Maps Walking Directions HUD (Runner Only) */}
          {isRunner && isMoving && (
            <div className="absolute top-[96px] left-6 right-6 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-[#0f9d58] text-white px-4 py-3.5 rounded-2xl shadow-md flex items-center gap-3.5 border border-[#0d8a4d]">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Navigation size={18} className="text-white fill-white -rotate-45" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-[14px] font-semibold tracking-tight leading-none">Walk {distance}m</span>
                    <span className="text-[11px] font-semibold text-white/80">- {durationMin} min{durationMin > 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-[10px] font-bold text-white/95  leading-none truncate">
                    {isClose ? 'Arriving soon at drop-off' : 'Proceed toward meet location'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isRunner ? (
            /* Styled Walking Distance Static Google Map (Runner Only) */
            <div className="w-full h-[380px] bg-[#f8fafc] relative">
              <img 
                src={mapSrc}
                onError={() => setMapSrc('/map-bg.png')}
                className="w-full h-full object-cover grayscale-[0.1] saturate-[1.2]"
                alt="Live Route Map"
              />

              {/* Simulated Live SVG Telemetry Glider Overlay */}
              <svg className="absolute inset-0 w-full h-full select-none pointer-events-none" viewBox="0 0 400 240">
                {progress > 0 && progress < 1 && (
                  <g>
                    <circle cx={runnerPos.x} cy={runnerPos.y} r="7" fill="slate-900" className="shadow-md" />
                    <circle cx={runnerPos.x} cy={runnerPos.y} r="2.5" fill="#ffffff" className={isClose ? 'animate-ping' : 'animate-pulse'} />
                  </g>
                )}
              </svg>
            </div>
          ) : (
            <div className="w-full h-[380px] bg-[#f8fafc] relative overflow-hidden">
              <BuyerLiveMap runnerLocation={order.runner_location} />
            </div>
          )}
        </div>
      )}

      {/*  FLOATING NAV  */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-6 flex items-center justify-between pointer-events-none select-none bg-white/90 backdrop-blur-xl border-b border-slate-100/50">
        <div className="flex items-center gap-3 pointer-events-auto">
          <BackButton fallback="/me/orders" />
          <div className="flex flex-col justify-center">
            <p className="text-[13px] font-semibold text-slate-900 tracking-tight leading-tight">Order Details</p>
            <p className="text-[10px] font-semibold text-amber-600 tracking-wider leading-none mt-0.5">#{order.order_code || order.id.slice(0, 6).toUpperCase()}</p>
          </div>
        </div>
      </nav>

      {/*  MAIN CONTENT  */}
      <div className={`${isCancelled ? 'pt-32' : hasMapHero ? 'pt-[420px]' : 'pt-[100px]'} px-6 space-y-8 relative z-10`}>
      
        {!isCancelled && !hasMapHero && (
          <div className="pb-4">
            <StatusKinetics status={status} orderType={order?.type} />
          </div>
        )}



        {/* Cancellation Notice */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3.5 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shrink-0">
              <XCircle size={16} />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-red-950  leading-none mb-1">Order Cancelled</p>
              <p className="text-[11px] font-medium text-red-700 leading-relaxed">
                Your order has been cancelled. If you have made any payments, the money will be refunded to you shortly.
              </p>
            </div>
          </div>
        )}

        {/*  PROGRESS VIBRANCY  */}
        {!isCancelled && (
          <section className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-50">
            <OrderTracker order={order} runnerProfile={runnerProfile} />
          </section>
        )}

        {/*  SERVICE DELIVERY INFO  */}
        {!isCancelled && isServiceOrder && (
          <section className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3">
            <div className="space-y-0.5">
              <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Delivery</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                {order.deliveryMethod === 'DIGITAL' ? <Globe size={18} /> : <Users size={18} />}
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900">
                  {order.deliveryMethod === 'DIGITAL' ? 'Digital / Online' : 'F2F Campus Session'}
                </p>
                <p className="text-[11px] font-medium text-[#94a3b8] capitalize">
                  {order.deliveryMethod === 'DIGITAL' ? 'Delivered via email or chat' : 'Campus meet-up'}
                </p>
              </div>
            </div>
            {order.serviceContactInfo && (
              <div className="p-3 bg-white border border-indigo-100 rounded-xl">
                <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">Contact Info</p>
                <p className="text-[13px] font-bold text-slate-900 break-words">{order.serviceContactInfo}</p>
              </div>
            )}
            {order.deliveryMethod === 'F2F_CAMPUS' && order.drop_off_location && (
              <div className="p-3 bg-white border border-indigo-100 rounded-xl">
                <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">Campus Location</p>
                <p className="text-[13px] font-bold text-slate-900">{order.drop_off_location}</p>
              </div>
            )}
          </section>
        )}

        {/*  SERVICE DIGITAL PROGRESS NOTE  */}
        {!isCancelled && isServiceOrder && order.deliveryMethod === 'DIGITAL' && (
          <section className="flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-white border border-amber-100 flex items-center justify-center shrink-0">
              <Info size={14} className="text-amber-700" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[12px] font-bold text-slate-900">Digital Delivery Pending</p>
              <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed">
                The seller will send the digital item to your provided contact info once they confirm the order.
              </p>
            </div>
          </section>
        )}

        {/*  PAYMENT RECEIPT  */}
        <section className="space-y-3">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Payment Receipt</h2>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100">
            {/* Item Summary with Visual */}
            <div className="px-4 py-4 flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                {(order.items?.[0]?.image_url || order.image_url || order.item_image || order.images?.[0]) ? (
                  <img src={order.items?.[0]?.image_url || order.image_url || order.item_image || order.images?.[0]} className="w-full h-full object-cover" alt="Item visual" />
                ) : (
                  <Package size={20} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5 space-y-1">
                {order.items?.length > 0 ? (
                  order.items.map((it: any, i: number) => (
                    <p key={i} className="text-[13px] font-bold text-slate-900 truncate">{it.qty}x {it.title}</p>
                  ))
                ) : (
                  <p className="text-[13px] font-bold text-slate-900 line-clamp-2">{order.items_summary || `1x ${order.title || 'Pulse Order'}`}</p>
                )}
                <p className="text-[11px] font-medium text-[#94a3b8]">Marketplace Item</p>
              </div>
            </div>

            {/* Transaction Metadata */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[13px] font-medium text-[#94a3b8]">Payment Method</span>
              <span className="text-[13px] font-bold text-slate-900">FPX Online Banking</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[13px] font-medium text-[#94a3b8]">Order Time</span>
              <span className="text-[13px] font-bold text-slate-900">
                {order.created_at && typeof order.created_at?.toDate === 'function'
                  ? order.created_at.toDate().toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
                  : new Date(order.created_at || Date.now()).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            
            {/* Price Breakdown */}
            <div className="px-4 py-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#94a3b8]">
                  {['PARCELS', 'ERRANDS'].includes(order.type?.toUpperCase()) ? 'Service Fee' : 'Subtotal'}
                </span>
                <span className="text-[13px] font-bold text-slate-900">RM {Number(order.price || order.total_price || 0).toFixed(2)}</span>
              </div>
              {order.delivery_type === 'RUNNER' && !['PARCELS', 'ERRANDS'].includes(order.type?.toUpperCase()) && (
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#94a3b8]">Runner Fee</span>
                  <span className="text-[13px] font-bold text-slate-900">RM {Number((order.total || order.price) - order.price).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Total Paid */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-slate-100/50 rounded-b-xl">
              <span className="text-[13px] font-bold text-slate-900">Total Paid</span>
              <span className="text-[15px] font-semibold text-slate-900">RM {Number(order.total || order.total_price || order.price).toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/*  HANDSHAKE NOTICE  */}
        {!isCancelled && (
          <section className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
              <Info size={14} className="text-slate-900" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[12px] font-bold text-slate-900">Help & Returns</p>
              <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed">
                If there is a problem, our team will check the delivery data. We process returns within 24 hours.
              </p>
            </div>
          </section>
        )}

        {/*  CANCEL ORDER (Pending only)  */}
        {isPending && (
          <section>
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={cancelling}
              className="w-full h-12 border border-red-100 text-[13px] font-bold text-red-400 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30"
            >
              {cancelling ? (
                <span className="w-4 h-4 border-2 border-red-200 border-t-red-400 rounded-full animate-spin" />
              ) : (
                <XCircle size={16} />
              )}
              Cancel Order
            </button>
            <p className="text-[11px] font-medium text-[#94a3b8] text-center mt-2">
              Only available before the seller accepts.
            </p>
          </section>
        )}

        {/*  ESCROW RELEASE BUTTON REMOVED (Admin Only Now)  */}

        {/*  POST-DELIVERY REVIEW  */}
        {userId && (
          <section className="pt-6 border-t border-slate-100">
            {showReview ? (
              <PostDeliveryReview 
                order={order} 
                userId={userId} 
                itemId={order.items?.[0]?.productId} 
                isOfficial={sellerOfficial} 
              />
            ) : isDeliveredOrCompleted ? (
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-sm font-medium text-gray-500">Rate your experience</p>
                <p className="text-xs text-gray-400 mt-1">You have already reviewed this item</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <p className="text-sm font-medium text-gray-500">Rate your experience</p>
                <p className="text-xs text-gray-400 mt-1">Review unavailable until delivery is completed</p>
              </div>
            )}
          </section>
        )}

        {/*  DRAKE SAFETY NET (Support after Delivery)  */}
        {!isCancelled && !isPending && (
          <section className="pt-4 pb-8">
            {isReportOpen ? (
              <InlineReportForm orderId={id as string} userId={userId} order={order}
                onClose={() => setIsReportOpen(false)} onSuccess={() => {
                  setIsReportOpen(false);
                  setShowSuccessOverlay(true);
                  setTimeout(() => setShowSuccessOverlay(false), 3000);
                }} />
            ) : (
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <p className="text-[13px] font-bold text-slate-900">Need help?</p>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed pr-2">
                    Report any issues within 24 hours.
                  </p>
                </div>
                <button onClick={() => setIsReportOpen(true)}
                  disabled={!order.handshake?.seller_confirmed && !isDone}
                  className="h-10 px-4 bg-white border border-slate-200 text-[12px] font-bold text-slate-900 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm disabled:opacity-30 whitespace-nowrap">
                  <ShieldAlert size={14} className="text-red-500" />
                  Report Issue
                </button>
              </div>
            )}
          </section>
        )}

      </div>

      {/*  RELAXED RETURN (Matured Exit)  */}
      {isDone && !showSuccessOverlay && (
        <div className="px-6 pb-20">
          <button 
            onClick={() => router.push('/marketplace')}
            className="w-full h-14 bg-white border border-slate-100 text-[#94a3b8] rounded-2xl font-bold text-[12px]  hover:text-slate-900 hover:border-slate-900 transition-all active:scale-95"
          >
            Return
          </button>
        </div>
      )}

      {/*  VIBRANT SUCCESS OVERLAY  */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-1000 bg-white/60 backdrop-blur-2xl flex flex-col items-center justify-center p-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: -10 }}
              className="bg-white p-12 rounded-2xl shadow-[0_32px_80px_-16px_rgba(99,102,241,0.15)] border border-slate-50 text-center space-y-8 max-w-xs"
            >
              <div className="relative inline-block">
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-emerald-500 blur-3xl rounded-full"
                />
                <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/40 relative z-10 text-white">
                  <CheckCircle2 size={32} strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-[28px] font-semibold tracking-tight text-slate-900 leading-none">Delivered!</h1>
                <p className="text-[12px] text-slate-400 font-medium leading-relaxed">Your order is complete.<br/>Enjoy your item!</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  CANCEL CONFIRMATION BOTTOM-SHEET  */}
      <AnimatePresence>
        {showCancelConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !cancelling && setShowCancelConfirm(false)}
              className="fixed inset-0 z-400 bg-slate-900/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              className="fixed bottom-0 left-0 right-0 z-401 bg-white rounded-t-[32px] px-6 pt-6 pb-10 space-y-6"
            >
              <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto" />
              <div className="space-y-1">
                <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">Cancel this order?</h2>
                <p className="text-[12px] font-medium text-[#94a3b8] leading-relaxed">
                  This cannot be undone. Your payment will be reviewed for refund.
                </p>
              </div>
              {cancelError && (
                <p className="text-[12px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {cancelError}
                </p>
              )}
              <div className="space-y-3">
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="w-full h-12 bg-red-500 text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  {cancelling ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Yes, Cancel Order'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelling}
                  className="w-full h-12 border border-slate-100 text-[#94a3b8] font-bold text-[13px] rounded-2xl active:scale-95 transition-all"
                >
                  Keep Order
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </main>
  );
}
/* ORDER DETAIL PAGE
   What: Buyer tracks their order status in real time
   Shows: Order status timeline, runner info, payment receipt
   Data: orders collection (single document, real-time listener)
   Related: app/run/active/page.tsx, app/run/missions/page.tsx
*/
