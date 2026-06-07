"use client";
import React, { useState, useEffect, useRef, Component } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction, serverTimestamp, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Camera, X, Loader2, 
  MapPin, Navigation, Check,
  ChevronLeft, Clock, Zap, AlertCircle, ShieldCheck,
  Package, ArrowRight, Activity, Map
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { completeDelivery } from '@/app/actions/deliveryActions';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

const LiveMap = dynamic(() => import('@/components/runner/LiveMap'), { ssr: false });

// ── ERROR BOUNDARY ──
class MapErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, info: any) { console.error("Map crashed:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 bg-slate-50 flex items-center justify-center border-b border-slate-100 z-10">
          <p className="text-[11px] font-bold text-slate-400  flex items-center gap-2">
            <AlertCircle size={14} /> map disabled. follow text address.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── HAVERSINE DISTANCE ──
function haversineMetres(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fmtDist(m: number) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

function fmtElapsed(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function timerColor(s: number) {
  if (s >= 1200) return 'text-red-500';
  if (s >= 600) return 'text-amber-500';
  return 'text-[#94a3b8]';
}

function formatTimeAgo(timestamp: any, nowMs: number) {
  if (!timestamp) return 'Just now';
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((nowMs - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch (e) {
    return 'Recently';
  }
}

const validateImage = (img: HTMLImageElement): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 50; 
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  if (!ctx) return true;
  ctx.drawImage(img, 0, 0, 50, 50);
  const data = ctx.getImageData(0, 0, 50, 50).data;
  
  let rSum = 0, gSum = 0, bSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i+1];
    bSum += data[i+2];
  }
  const count = data.length / 4;
  const rAvg = rSum / count;
  const gAvg = gSum / count;
  const bAvg = bSum / count;
  
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    variance += Math.pow(data[i] - rAvg, 2) + Math.pow(data[i+1] - gAvg, 2) + Math.pow(data[i+2] - bAvg, 2);
  }
  variance = variance / count;
  
  // Reject if too dark (brightness < 15) or too flat/blank (variance < 60)
  const brightness = (rAvg * 0.299 + gAvg * 0.587 + bAvg * 0.114);
  if (brightness < 15 || variance < 60) return false;
  
  return true;
};

// ── WATERMARK HELPER ──
const addWatermark = async (file: File, orderId: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Smart Client-Side Check: Judge the picture right here
      if (!validateImage(img)) {
         return reject(new Error('PHOTO_REJECTED'));
      }

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      
      ctx.drawImage(img, 0, 0);
      
      // Add watermark background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      const stripHeight = Math.max(100, img.height * 0.15);
      ctx.fillRect(0, img.height - stripHeight, img.width, stripHeight);
      
      // Add text
      ctx.fillStyle = '#ffffff';
      const fontSize1 = Math.max(24, Math.floor(img.width * 0.04));
      const fontSize2 = Math.max(18, Math.floor(img.width * 0.03));
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
      
      ctx.font = `bold ${fontSize1}px sans-serif`;
      ctx.fillText(`ID: #${orderId.substring(0,8).toUpperCase()}`, 30, img.height - (stripHeight / 2) - 10);
      
      ctx.font = `500 ${fontSize2}px sans-serif`;
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`${dateStr} • ${timeStr}`, 30, img.height - (stripHeight / 2) + 25);
      
      canvas.toBlob((blob) => {
        if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        else resolve(file);
      }, 'image/jpeg', 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
};

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[21px] font-bold text-slate-900 tracking-tight ${className}`}>{children}</h2>
);
const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[13px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>{children}</p>
);

export default function MissionControl() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [missions, setMissions] = useState<any[]>([]);
  const [activeMission, setActiveMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Terminal state
  const [podPhoto, setPodPhoto] = useState<File | null>(null);
  const [podPreview, setPodPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [proofMode, setProofMode] = useState<'PICKUP' | 'DELIVERY' | null>(null);
  const [runnerCoords, setRunnerCoords] = useState<{lat: number; lng: number} | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [locationError, setLocationError] = useState(false);
  const [optionsDrawerOpen, setOptionsDrawerOpen] = useState(false);
  const [reportStep, setReportStep] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mission board state
  const [filter, setFilter] = useState('All');
  const [now, setNow] = useState(Date.now());
  const [showError, setShowError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubActive: (() => void) | null = null;
    let unsubMissions: (() => void) | null = null;

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
          where("status", "in", ["PREPARING", "READY_FOR_PICKUP", "IN_TRANSIT", "PICKED_UP", "ARRIVED_AT_DESTINATION"])
        );
        unsubActive = onSnapshot(qActive, (snap) => {
          setActiveMission(!snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null);
        });

        const qMissions = query(
          collection(db, "orders"), 
          where("status", "in", ["PENDING_RUNNER"])
        );
        unsubMissions = onSnapshot(qMissions, (snap) => {
          const allAwaiting = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((o: any) => 
               o.delivery_type?.toUpperCase() === 'RUNNER' || 
               o.deliveryType?.toUpperCase() === 'RUNNER' || 
               ['PARCELS', 'ERRANDS'].includes(o.type?.toUpperCase())
            )
            .filter((o: any) => !o.runner_id)
            .sort((a: any, b: any) => {
               const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at).getTime();
               const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at).getTime();
               return (timeB || 0) - (timeA || 0);
            });
          setMissions(allAwaiting);
        });
      } else { router.push('/auth'); }
    });

    return () => {
      unsubAuth();
      [unsubProfile, unsubActive, unsubMissions].forEach(fn => fn?.());
    };
  }, [router]);

  // ── GPS BROADCAST + LOCAL COORDS CAPTURE ──
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    if (!isOnline || !activeMission) return;

    const orderId = activeMission.id;
    let lastWriteTime = 0;
    const enRouteStatuses = ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'ARRIVED_AT_DESTINATION'];
    const shouldBroadcast = enRouteStatuses.includes(activeMission.status);

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        setLocationError(false);
        const { latitude, longitude } = position.coords;
        setRunnerCoords({ lat: latitude, lng: longitude });
        const nowMs = Date.now();
        if (shouldBroadcast && nowMs - lastWriteTime > 5000) {
          lastWriteTime = nowMs;
          try {
            await updateDoc(doc(db, 'orders', orderId), {
              runner_location: { latitude, longitude },
              runner_location_updated_at: new Date().toISOString()
            });
          } catch (err) {
            console.warn("Failed to write live GPS:", err);
          }
        }
      },
      (err) => { console.warn("Geolocation error:", err); setLocationError(true); },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline, activeMission?.id, activeMission?.status]);

  // ── ELAPSED TIMER ──
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!activeMission?.accepted_at) { setElapsedSeconds(0); return; }
    const startMs = activeMission.accepted_at?.toMillis
      ? activeMission.accepted_at.toMillis()
      : new Date(activeMission.accepted_at).getTime();
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeMission?.id, activeMission?.accepted_at]);

  const toggleStatus = async () => {
    if (!auth.currentUser) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { is_online: !isOnline, last_active: serverTimestamp() });
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleClaim = async (missionId: string) => {
    if (!auth.currentUser) return;
    if (activeMission) {
      setShowError('Finish your current active delivery before claiming new missions.');
      setTimeout(() => setShowError(null), 3000);
      return;
    }
    setIsProcessing(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "orders", missionId);
        const snap = await tx.get(ref);
        if (!snap.exists() || snap.data().runner_id) throw "Mission already claimed by another node.";
        tx.update(ref, { 
          runner_id: auth.currentUser?.uid, 
          runner_name: profile?.full_name || 'Runner',
          status: 'READY_FOR_PICKUP',
          accepted_at: serverTimestamp()
        });
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // The activeMission listener will automatically populate the screen.
      }, 2000);
    } catch (e: any) { 
      console.error('[Claim]', e);
      setShowError('Mission may have been claimed already. Try another.');
      setTimeout(() => setShowError(null), 3000);
      setIsProcessing(false); 
    }
  };

  const handleConfirmPickup = async () => {
    if (!activeMission || !auth.currentUser || !podPhoto) return;
    setIsProcessing(true);
    try {
      const timestamp = Date.now();
      const storagePath = `orders/${activeMission.id}/pickup_${timestamp}.jpg`;
      const storageRef = ref(storage, storagePath);
      const uploadRes = await uploadBytes(storageRef, podPhoto);
      const url = await getDownloadURL(uploadRes.ref);

      await updateDoc(doc(db, "orders", activeMission.id), {
        status: 'PICKED_UP',
        pickup_photo_url: url,
        picked_up_at: serverTimestamp()
      });

      await addDoc(collection(db, "admin_evidence"), {
        orderId: activeMission.id,
        type: "PICKUP",
        photoUrl: url,
        runnerId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });

      setPodPhoto(null); setPodPreview(null); setProofMode(null);
    } catch (e: any) { console.error('[Pickup]', e); } finally { setIsProcessing(false); }
  };

  const handleFinalizeDelivery = async () => {
    if (!activeMission || !auth.currentUser || !podPhoto) return;
    setIsProcessing(true);
    try {
      const timestamp = Date.now();
      const storagePath = `orders/${activeMission.id}/delivery_${timestamp}.jpg`;
      const storageRef = ref(storage, storagePath);
      const uploadRes = await uploadBytes(storageRef, podPhoto);
      const url = await getDownloadURL(uploadRes.ref);

      await updateDoc(doc(db, "orders", activeMission.id), {
        delivery_photo_url: url,
      });

      await addDoc(collection(db, "admin_evidence"), {
        orderId: activeMission.id,
        type: "DELIVERY",
        photoUrl: url,
        runnerId: auth.currentUser.uid,
        timestamp: serverTimestamp()
      });

      // Send photo confirmation to buyer's conversation
      const dropOffLocation = activeMission.drop_off_location || 'drop-off location';
      const conversationId = activeMission.conversationId;
      if (conversationId) {
        try {
          await addDoc(collection(db, "chats", conversationId, "messages"), {
            senderId: "SYSTEM",
            text: `📍 Your item has been delivered to ${dropOffLocation}. Here's a photo confirmation:`,
            imageUrl: url,
            createdAt: serverTimestamp(),
            isSystemMessage: true,
          });
        } catch (e) {
          console.warn('[Delivery] Could not write conversation message:', e);
        }
      }

      const res = await completeDelivery(activeMission.id, url, auth.currentUser.uid);
      if (res.success) { setPodPhoto(null); setPodPreview(null); setProofMode(null); }
    } catch (e: any) { console.error('[Delivery]', e); } finally { setIsProcessing(false); }
  };

  const handleDropOrder = async () => {
    if (!activeMission) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "orders", activeMission.id), {
        runner_id: null, runner_name: null, status: 'PENDING_RUNNER', accepted_at: null
      });
      setOptionsDrawerOpen(false);
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleReportProblem = async (reason: string) => {
    if (!activeMission) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "orders", activeMission.id), {
        status: 'ISSUE_REPORTED', issue_reason: reason, issue_reported_by: 'runner', issue_reported_at: serverTimestamp()
      });
      setOptionsDrawerOpen(false); setReportStep(false);
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  if (loading) return null;

  // ── PRE-COMPUTE ACTIVE MISSION DATA ──
  const isPickedUp = activeMission?.status === 'PICKED_UP' || activeMission?.status === 'IN_TRANSIT';

  const pickupDistM = runnerCoords && activeMission?.pickup_lat && activeMission?.pickup_lng
    ? haversineMetres(runnerCoords.lat, runnerCoords.lng, activeMission.pickup_lat, activeMission.pickup_lng)
    : null;

  const dropoffDistM = runnerCoords && activeMission?.dropoff_lat && activeMission?.dropoff_lng
    ? haversineMetres(runnerCoords.lat, runnerCoords.lng, activeMission.dropoff_lat, activeMission.dropoff_lng)
    : null;

  const displayDist = isPickedUp ? dropoffDistM : pickupDistM;

  const navTarget = activeMission
    ? isPickedUp
      ? activeMission.drop_off_location || 'Block K Main Lobby'
      : activeMission.pickup_location || activeMission.seller_name || 'UniKL MIIT'
    : '';
  const navUrl = `https://maps.google.com/maps?q=${encodeURIComponent(navTarget + ', UniKL MIIT, Kuala Lumpur')}`;

  const isErrand = activeMission?.type?.toUpperCase() === 'ERRANDS';
  const isParcel = activeMission?.type?.toUpperCase() === 'PARCELS';
  const tintBg = isErrand ? 'bg-rose-50' : (isParcel ? 'bg-cyan-50' : 'bg-slate-50');
  const tintBorder = isErrand ? 'border-rose-200' : (isParcel ? 'border-cyan-200' : 'border-slate-200');
  const tintText = isErrand ? 'text-rose-950' : (isParcel ? 'text-cyan-950' : 'text-slate-900');
  const typeLabel = isErrand ? 'Peer-to-Peer Drop' : (isParcel ? 'Parcel Collection' : 'Marketplace Delivery');

  const buttonPastel = isErrand 
    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200' 
    : (isParcel ? 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200 border-cyan-200' : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200');

  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans antialiased text-slate-900 selection:bg-slate-100 relative overflow-hidden flex flex-col pb-32">

      {/* ── IN-UI ERROR TOAST ── */}
      {showError && (
        <div className="fixed top-24 left-6 right-6 z-200 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-[12px] font-bold shadow-sm text-center">
          {showError}
        </div>
      )}

      {/* ── MATURED NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
         <div className="flex items-center gap-3">
            <BackButton fallback="/run" />
            <p className="text-[14px] font-bold tracking-tight text-slate-900 leading-none">Delivery Hub</p>
         </div>
         <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} className="scale-90" />
      </nav>

      {activeMission ? (
         // ==========================================
         // ACTIVE MISSION VIEW (from Terminal Hub)
         // ==========================================
         <motion.div 
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="w-full h-full flex flex-col"
         >
           {/* ── MAP VIEWPORT ── */}
           <section className={`transition-all duration-700 ease-in-out relative h-[35vh] w-full pt-20 border-b border-slate-50`}>
              <MapErrorBoundary>
                <LiveMap hasActiveJob={!!activeMission} />
              </MapErrorBoundary>
              <div className="absolute inset-0 bg-linear-to-b from-white/30 via-transparent to-[#FDFDFD]" />
           </section>

           <section className="px-6 -mt-8 relative z-10 flex-1 flex flex-col space-y-6">
              <motion.div 
                key="active" 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="bg-white rounded-t-[32px] shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col"
              >
                {/* ── HEADER ── */}
                <div className={`px-6 pt-7 pb-5 flex items-start justify-between border-b ${tintBorder} ${tintBg}`}>
                  <div>
                    <p className={`text-[10px] font-semibold  mb-1 ${tintText} opacity-70`}>{typeLabel}</p>
                    <p className={`text-[18px] font-semibold tracking-tight ${tintText}`}>#{activeMission.id.substring(0,8).toUpperCase()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {/* TIMER */}
                    <div className={`flex items-center gap-1.5 px-3 py-1 bg-white rounded-full shadow-sm ${timerColor(elapsedSeconds)}`}>
                       <Clock size={12} strokeWidth={2.5} />
                       <span className="text-[12px] font-semibold tabular-nums tracking-widest">{fmtElapsed(elapsedSeconds)}</span>
                    </div>
                  </div>
                </div>

                {/* ── TELEMETRY STRIP ── */}
                {locationError && (
                  <div className="mx-6 mt-4 mb-2 bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-[12px] font-bold text-center flex items-center justify-center gap-2">
                    <AlertCircle size={16} /> Turn on GPS to track distance
                  </div>
                )}

                {/* ── TASK LIST (#1, #2) ── */}
                <div className="px-6 py-6 space-y-4">
                   <p className="text-[11px] font-semibold text-slate-300">Mission Tasks</p>
                   
                   {/* TASK 1: PICKUP */}
                   <div className={`flex flex-col gap-3 p-5 rounded-[24px] transition-all border ${!isPickedUp ? `${tintBg} ${tintBorder} shadow-sm` : 'bg-slate-50 border-transparent opacity-60'}`}>
                      <div className="flex justify-between items-start">
                         <div className="flex gap-4">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-semibold text-[14px] shrink-0 ${!isPickedUp ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-200 text-slate-400'}`}>
                              {isPickedUp ? <Check size={14} strokeWidth={3} /> : '1'}
                            </div>
                            <div className="pt-0.5 pr-2">
                               <p className="text-[15px] font-bold text-slate-900 leading-tight">Head to Pickup</p>
                               <p className="text-[13px] font-medium text-slate-600 mt-1 leading-snug">{activeMission.pickup_location || activeMission.seller_name || 'Merchant'}</p>
                            </div>
                         </div>
                         {!isPickedUp && (
                           <button onClick={() => window.open(navUrl, '_blank')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-sm active:scale-95 transition-all shrink-0">
                              <Navigation size={16} />
                           </button>
                         )}
                      </div>
                      
                      {!isPickedUp && (
                         <div className="mt-2">
                           {activeMission.status === 'PREPARING' ? (
                             <div className="w-full h-12 bg-white/60 text-slate-500 rounded-[16px] font-bold text-[13px] flex items-center justify-center border border-white">
                               Merchant is preparing...
                             </div>
                           ) : (
                             <button onClick={() => setProofMode('PICKUP')} className={`w-full h-12 border rounded-[16px] font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm ${buttonPastel}`}>
                               <Check size={16} strokeWidth={3} /> Confirm Pickup
                             </button>
                           )}
                         </div>
                      )}
                   </div>

                   {/* TASK 2: DELIVERY */}
                   <div className={`flex flex-col gap-3 p-5 rounded-[24px] transition-all border ${isPickedUp ? `${tintBg} ${tintBorder} shadow-sm` : 'bg-white border-slate-100 opacity-40'}`}>
                      <div className="flex justify-between items-start">
                         <div className="flex gap-4">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-semibold text-[14px] shrink-0 ${isPickedUp ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-50 text-slate-300 border border-slate-200'}`}>
                              2
                            </div>
                            <div className="pt-0.5 pr-2">
                               <p className="text-[15px] font-bold text-slate-900 leading-tight">Deliver to Buyer</p>
                               <p className="text-[13px] font-medium text-slate-600 mt-1 leading-snug">{activeMission.drop_off_location || 'Drop-off Zone'}</p>
                               <p className="text-[12px] font-bold text-slate-400 mt-2">Recipient: <span className="text-slate-900">{activeMission.customer_name || activeMission.buyer_name || 'Student'}</span></p>
                            </div>
                         </div>
                         {isPickedUp && (
                           <button onClick={() => window.open(navUrl, '_blank')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-sm active:scale-95 transition-all shrink-0">
                              <Navigation size={16} />
                           </button>
                         )}
                      </div>
                      
                      {isPickedUp && (
                         <div className="mt-2">
                           <button onClick={() => setProofMode('DELIVERY')} className={`w-full h-12 border rounded-[16px] font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm ${buttonPastel}`}>
                             <Zap size={16} strokeWidth={2.5} /> Complete Delivery
                           </button>
                         </div>
                      )}
                   </div>
                </div>

                {/* MORE OPTIONS */}
                <button 
                  onClick={() => { setOptionsDrawerOpen(true); setReportStep(false); }}
                  className="w-full pb-6 pt-2 text-[11px] font-semibold text-slate-300 hover:text-slate-500  active:scale-95 transition-all text-center"
                >
                  More Options
                </button>
              </motion.div>
           </section>
         </motion.div>
      ) : (
         // ==========================================
         // OPEN MISSIONS VIEW (from Orders)
         // ==========================================
         <div className="pt-24 px-6 space-y-8">
            {/* ── MATURED FILTER PILLS ── */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
               {['All', 'Marketplace', 'Parcels', 'Errands'].map(t => {
                  const isActive = filter === t;
                  let activeStyle = 'bg-slate-50 text-slate-900 border-[1.5px] border-slate-300 shadow-sm';
                  if (t === 'Parcels') activeStyle = 'bg-cyan-50 text-cyan-950 border-[1.5px] border-cyan-200 shadow-sm';
                  if (t === 'Errands') activeStyle = 'bg-rose-50 text-rose-950 border-[1.5px] border-rose-200 shadow-sm';
                  
                  return (
                    <button 
                      key={t} 
                      onClick={() => setFilter(t)}
                      className={`px-6 h-11 rounded-[20px] text-[13px] font-bold transition-all whitespace-nowrap active:scale-95 ${isActive ? activeStyle : 'bg-slate-50 text-[#94a3b8] hover:text-slate-900 hover:bg-slate-100 border border-transparent'}`}
                    >
                      {t}
                    </button>
                  );
               })}
            </div>

            {/* ── MISSION LIST ── */}
            <div className="space-y-4 mt-8">
               <AnimatePresence mode="popLayout">
                  {missions.length > 0 ? (
                     missions.filter(m => {
                        if (filter === 'All') return true;
                        if (filter === 'Marketplace') return !['PARCELS', 'ERRANDS'].includes(m.type?.toUpperCase());
                        return m.type?.toUpperCase() === filter.toUpperCase();
                     }).map((mission, idx) => {
                       const isErrand = mission.type?.toUpperCase() === 'ERRANDS';
                       const isParcel = mission.type?.toUpperCase() === 'PARCELS';
                       // Default fallback tint
                       const tintBg = isErrand ? 'bg-rose-50' : (isParcel ? 'bg-cyan-50' : 'bg-slate-50');
                       const tintText = isErrand ? 'text-rose-950' : (isParcel ? 'text-cyan-950' : 'text-slate-900');
                       const detailBg = isErrand ? 'bg-rose-50/50' : (isParcel ? 'bg-cyan-50/50' : 'bg-slate-50/50');
                       
                       const buttonClass = isErrand 
                          ? 'bg-rose-50 text-rose-950 border border-rose-200 hover:bg-rose-100' 
                          : (isParcel 
                              ? 'bg-cyan-50 text-cyan-950 border border-cyan-200 hover:bg-cyan-100' 
                              : 'bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100');

                       const isMarketplace = !isErrand && !isParcel;
                       
                       const typeLabel = isErrand ? 'Peer-to-Peer Drop' : (isParcel ? 'Parcel Collection' : 'Marketplace Delivery');
                       const requestDetails = mission.items_summary || mission.title || 'Delivery Request';
                       const clientName = mission.seller_name || mission.buyer_name || 'Student';

                       return (
                         <motion.div 
                           key={mission.id}
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, scale: 0.95 }}
                           transition={{ delay: idx * 0.05 }}
                           className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-5"
                         >
                            {/* ── CARD HEADER ── */}
                            <div className="flex justify-between items-start">
                               <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${tintBg} ${tintText}`}>
                                     {isErrand ? <Map size={18} /> : (isParcel ? <Package size={18} /> : <Zap size={18} />)}
                                  </div>
                                  <div className="pr-2">
                                     <p className="text-[10px] font-semibold text-[#94a3b8] mb-0.5">{typeLabel}</p>
                                     <h3 className="text-[15px] font-bold text-slate-900 tracking-tight line-clamp-1">{requestDetails}</h3>
                                  </div>
                               </div>
                               <div className="text-right shrink-0">
                                  <p className="text-[18px] font-semibold text-slate-900 tracking-tighter">RM {(mission.total_price || mission.deliveryFee || 3.50).toFixed(2)}</p>
                                  <p className="text-[9px] font-semibold text-[#94a3b8]  mt-0.5">Payout</p>
                               </div>
                            </div>

                            {/* ── INNER DETAILS ── */}
                            <div className="pl-3 pr-2 py-1 flex items-stretch gap-4 relative">
                               {/* Connecting Line */}
                               <div className="absolute left-[17.5px] top-4 bottom-4 w-0.5 bg-slate-100 rounded-full" />
                               
                               <div className="space-y-4 w-full">
                                  <div className="flex items-start gap-4">
                                     <div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-white shrink-0 mt-1 relative z-10" />
                                     <div className="flex-1">
                                        <p className="text-[10px] font-semibold text-[#94a3b8]">Pickup From</p>
                                        <p className="text-[13px] font-medium text-slate-900 leading-snug line-clamp-2">{mission.pickup_location || mission.seller_name || 'Merchant'}</p>
                                        {!isMarketplace && clientName && <p className="text-[11px] font-medium text-slate-400 mt-0.5">Contact: {clientName}</p>}
                                     </div>
                                  </div>
                                  
                                  <div className="flex items-start gap-4">
                                     <div className="w-3 h-3 rounded-full bg-slate-900 border-2 border-white shrink-0 mt-1 relative z-10 shadow-sm" />
                                     <div className="flex-1">
                                        <p className="text-[10px] font-semibold text-[#94a3b8]">Deliver To</p>
                                        <p className="text-[13px] font-medium text-slate-900 leading-snug line-clamp-2">{mission.drop_off_location || 'Campus Center'}</p>
                                        {isMarketplace && clientName && <p className="text-[11px] font-medium text-slate-400 mt-0.5">Buyer: {clientName}</p>}
                                     </div>
                                  </div>
                               </div>
                            </div>

                            {/* ── TIME & ACTION BUTTON ── */}
                            <div className="flex items-center justify-between gap-4 pt-1">
                               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-[12px] border border-slate-100 shrink-0">
                                  <Clock size={12} className="text-slate-400" />
                                  <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                                     {formatTimeAgo(mission.created_at, now)}
                                  </span>
                               </div>
                               <button 
                                 disabled={isProcessing}
                                 onClick={() => handleClaim(mission.id)}
                                 className={`h-12 flex-1 rounded-[16px] font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 shadow-sm ${buttonClass}`}
                               >
                                  {isProcessing ? <Activity className="animate-spin" size={16} /> : 'Accept Request'}
                               </button>
                            </div>
                         </motion.div>
                       );
                     })
                  ) : (
                     <div className="py-24 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative w-16 h-16">
                           <motion.div 
                             animate={{ 
                               scale: [1, 1.15, 1],
                               rotate: [0, 90, 180, 270, 360],
                               borderRadius: ["20%", "50%", "20%"]
                             }}
                             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                             className="absolute inset-0 border-2 border-dashed border-slate-200" 
                           />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Package className="text-[#94a3b8] opacity-80 animate-pulse" size={24} />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <Heading>Searching for orders...</Heading>
                           <Subtext>
                              No orders yet. We'll let you know.
                           </Subtext>
                        </div>
                     </div>
                  )}
               </AnimatePresence>
            </div>
         </div>
      )}

      {/* ========================================== */}
      {/* ── OVERLAYS (Drawers, Modals, Toasts) ── */}
      {/* ========================================== */}

      <AnimatePresence>{optionsDrawerOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-1000 bg-slate-900/40 backdrop-blur-sm flex items-end justify-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-10 shadow-xl relative border-t border-slate-100">
               <button onClick={() => setOptionsDrawerOpen(false)} className="absolute top-5 right-5 w-8 h-8 bg-slate-50 hover:bg-slate-100 text-[#94a3b8] rounded-full flex items-center justify-center transition-colors"><X size={16}/></button>
               
               {!reportStep ? (
                 <div className="space-y-5 pt-2">
                   <h3 className="text-[18px] font-semibold tracking-tight text-slate-900">Options</h3>
                   <div className="space-y-3">
                     {!isPickedUp && (
                       <button onClick={handleDropOrder} disabled={isProcessing} className="w-full h-14 bg-white text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-slate-900/5 rounded-xl font-bold text-[13px] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 outline-none shadow-sm">
                         {isProcessing ? <Loader2 className="animate-spin" size={16} /> : 'Drop Order'}
                       </button>
                     )}
                     <button onClick={() => setReportStep(true)} className="w-full h-14 bg-white text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-slate-900/5 rounded-xl font-bold text-[13px] shadow-sm active:scale-95 transition-all outline-none">
                       Report Problem
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="space-y-5 pt-2">
                   <h3 className="text-[18px] font-semibold tracking-tight text-slate-900 flex items-center gap-2">
                     <button onClick={() => setReportStep(false)} className="active:scale-95 p-1 -ml-1 rounded-lg hover:bg-slate-50 transition-colors"><ChevronLeft size={20} className="text-[#94a3b8]" /></button>
                     What's wrong?
                   </h3>
                   <div className="space-y-3">
                     {["Item damaged", "Buyer not here", "Bike broken"].map((reason) => (
                       <button key={reason} onClick={() => handleReportProblem(reason)} disabled={isProcessing} className="w-full h-12 bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-slate-900/5 rounded-xl font-bold text-[13px] active:scale-95 transition-all disabled:opacity-50 outline-none shadow-sm text-left px-5">
                         {isProcessing ? <Loader2 className="animate-spin inline mr-2" size={14} /> : reason}
                       </button>
                     ))}
                   </div>
                 </div>
               )}
            </motion.div>
          </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{proofMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-1000 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.95 }} className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-8 shadow-xl border border-slate-100">
               <div className="text-center space-y-2">
                 <div className="w-16 h-16 bg-slate-50 rounded-[20px] mx-auto flex items-center justify-center text-slate-900 mb-4 border border-slate-100 shadow-sm"><Camera size={28} strokeWidth={2} /></div>
                  <h3 className="text-[20px] font-semibold tracking-tight text-slate-900">{proofMode === 'PICKUP' ? 'Confirm Pickup' : 'Confirm Delivery'}</h3>
                  <p className="text-[13px] font-medium text-[#94a3b8] px-4 leading-relaxed">{proofMode === 'PICKUP' ? 'Take a photo of the item before collecting.' : 'Take a photo of the drop-off location.'}</p>
               </div>
               <div className="space-y-5">
                 <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    id="pod-capture" 
                    className="hidden" 
                    onChange={async (e) => { 
                       const file = e.target.files?.[0]; 
                       if (file) { 
                          setIsProcessing(true);
                          try {
                             const watermarkedFile = await addWatermark(file, activeMission?.id || 'TEST');
                             setPodPhoto(watermarkedFile); 
                             setPodPreview(URL.createObjectURL(watermarkedFile)); 
                          } catch (err: any) {
                             if (err.message === 'PHOTO_REJECTED') {
                                setShowError("Photo rejected: Please take a clearer picture of the item.");
                                setTimeout(() => setShowError(null), 4000);
                             }
                          }
                          setIsProcessing(false);
                       } 
                    }} 
                 />
                 {podPreview ? (
                    <div className="relative aspect-video rounded-[20px] overflow-hidden border border-slate-200 group shadow-sm">
                      <img src={podPreview} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label htmlFor="pod-capture" className="bg-white/90 text-slate-900 px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer hover:bg-white shadow-sm">
                           Retake Photo
                        </label>
                      </div>
                      <button onClick={() => { setPodPhoto(null); setPodPreview(null); }} className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md text-slate-700 hover:text-red-500 rounded-full flex items-center justify-center shadow-sm transition-colors"><X size={16}/></button>
                    </div>
                 ) : (
                    <label htmlFor="pod-capture" className="w-full h-[160px] border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 focus-within:ring-4 focus-within:ring-slate-900/5 rounded-[24px] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all outline-none">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center">
                         <Camera size={20} className="text-slate-400" />
                      </div>
                      <span className="text-[13px] font-bold text-slate-500">Tap to take photo</span>
                    </label>
                 )}
                 <button disabled={!podPhoto || isProcessing} onClick={proofMode === 'PICKUP' ? handleConfirmPickup : handleFinalizeDelivery} className={`w-full h-14 border rounded-[20px] font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-sm active:scale-95 outline-none ${activeMission ? (activeMission.type?.toUpperCase() === 'ERRANDS' ? 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200' : (activeMission.type?.toUpperCase() === 'PARCELS' ? 'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200' : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200')) : 'bg-slate-900 text-white'}`}>
                   {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={18} strokeWidth={2.5} />}
                    {proofMode === 'PICKUP' ? 'Confirm Pickup' : 'Confirm Delivery'}
                 </button>
                 <button onClick={() => setProofMode(null)} className="w-full text-[11px] font-semibold text-[#94a3b8] hover:text-slate-600  py-1 transition-colors outline-none">Cancel</button>
               </div>
            </motion.div>
          </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 bg-slate-900 flex flex-col items-center justify-center text-white text-center p-10"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 200 }}
              className="w-32 h-32 bg-slate-800 rounded-[40px] flex items-center justify-center mb-10 shadow-md shadow-slate-900/10 border border-slate-700"
            >
              <motion.div
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Package size={48} className="text-white" strokeWidth={1.5} />
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-[28px] font-semibold tracking-tight text-white">Mission Secured</h2>
              <p className="text-[14px] text-slate-400 font-medium tracking-wide max-w-xs mx-auto">
                Locking coordinates. Loading map interface...
              </p>
            </motion.div>

            <motion.div 
              animate={{ scale: [1, 2], opacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute w-64 h-64 border-[1.5px] border-white/20 rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
