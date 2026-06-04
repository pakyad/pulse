"use client";
import React, { useState, useEffect, useRef, Component } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
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
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
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
          status: 'PREPARING',
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
      const storageRef = ref(storage, `pickup_proofs/${activeMission.id}_${Date.now()}.jpg`);
      const uploadRes = await uploadBytes(storageRef, podPhoto);
      const url = await getDownloadURL(uploadRes.ref);
      await updateDoc(doc(db, "orders", activeMission.id), { status: 'PICKED_UP', pickup_proof_url: url, picked_up_at: serverTimestamp() });
      setPodPhoto(null); setPodPreview(null); setProofMode(null);
    } catch (e: any) { console.error('[Pickup]', e); } finally { setIsProcessing(false); }
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
                className="bg-white rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden"
              >
                {/* STATUS ACCENT LINE */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900/10" />

                {/* ── CARD HEADER ── */}
                <div className="px-6 pt-7 pb-4 flex items-start justify-between border-b border-slate-50">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Active Dispatch</p>
                    <p className="text-[13px] font-bold text-slate-900 tracking-tight">#{activeMission.id.substring(0,8).toUpperCase()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {/* TIMER */}
                    <div className={`flex items-center gap-1 ${timerColor(elapsedSeconds)}`}>
                      <Clock size={12} strokeWidth={2.5} />
                      <span className="text-[12px] font-black tabular-nums tracking-widest">{fmtElapsed(elapsedSeconds)}</span>
                    </div>
                    {/* STATUS BADGE */}
                    <div className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-slate-50 text-slate-600 border-slate-100">
                      {activeMission.status === 'PICKED_UP' ? 'Secured' : activeMission.status.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>

                {/* ── TELEMETRY STRIP ── */}
                {locationError && (
                  <div className="mx-6 mt-4 mb-2 bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl text-[11px] font-bold text-center border border-slate-100 flex items-center justify-center gap-1.5">
                    <AlertCircle size={14} /> Turn on GPS to track distance
                  </div>
                )}
                <div className="mx-6 mt-4 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-[#94a3b8]" />
                    <span className="text-[12px] font-bold text-slate-900">
                      {displayDist !== null ? `~${fmtDist(displayDist)} away` : 'Locating...'}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] font-medium">
                      {isPickedUp ? 'to Drop-off' : 'to Pickup'}
                    </span>
                  </div>
                  <button
                    onClick={() => window.open(navUrl, '_blank')}
                    className="flex items-center gap-1.5 text-[11px] font-black text-slate-900 uppercase tracking-widest hover:text-slate-700 active:scale-95 transition-all"
                  >
                    <Navigation size={12} /> Nav
                  </button>
                </div>

                {/* ── ROUTE NODES ── */}
                <div className="px-6 py-5 space-y-0">
                  {/* PICKUP NODE */}
                  <div className={`flex items-start gap-3 p-4 rounded-xl transition-all ${
                    isPickedUp ? 'opacity-40' : 'bg-slate-50 border border-slate-100'
                  }`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-all ${
                      activeMission.status === 'READY_FOR_PICKUP' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' :
                      isPickedUp ? 'bg-slate-100 text-[#94a3b8] border-slate-200' :
                      'bg-white text-[#94a3b8] border-slate-200'
                    }`}>
                      {isPickedUp ? <Check size={14} strokeWidth={3} /> : <Navigation size={14} />}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[12px] font-black text-slate-900 tracking-tight">{activeMission.seller_name || 'Merchant'}</p>
                      {activeMission.pickup_location && (
                        <p className="text-[11px] font-medium text-[#94a3b8] mt-0.5 leading-snug">{activeMission.pickup_location}</p>
                      )}
                      <p className={`text-[11px] font-bold mt-1.5 ${
                        activeMission.status === 'READY_FOR_PICKUP' ? 'text-slate-900' : 'text-[#94a3b8]'
                      }`}>
                        {isPickedUp ? 'Item collected' :
                         activeMission.status === 'READY_FOR_PICKUP' ? 'Ready for collection' :
                         `Collect: ${activeMission.title || 'package'}`}
                      </p>
                    </div>
                  </div>

                  {/* CONNECTOR LINE */}
                  <div className="ml-8 h-4 border-l-[1.5px] border-dashed border-slate-200" />

                  {/* DROP-OFF NODE */}
                  <div className={`flex items-start gap-3 p-4 rounded-xl transition-all ${
                    isPickedUp ? 'bg-cyan-50/50 border border-cyan-100/50 shadow-sm' : 'opacity-40 border border-transparent'
                  }`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 transition-all ${
                      isPickedUp ? 'bg-slate-900 shadow-sm' : 'bg-slate-300'
                    }`}>
                      <MapPin size={14} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[12px] font-black text-slate-900 tracking-tight">{activeMission.drop_off_location || 'Drop-off'}</p>
                      {(activeMission.floorLevel || activeMission.roomNumber) && (
                        <p className="text-[11px] font-medium text-[#94a3b8] mt-0.5">
                          {activeMission.floorLevel ? `Lvl ${activeMission.floorLevel}` : ''}
                          {activeMission.floorLevel && activeMission.roomNumber ? ' · ' : ''}
                          {activeMission.roomNumber ? `Rm ${activeMission.roomNumber}` : ''}
                        </p>
                      )}
                      <p className="text-[11px] font-bold text-[#94a3b8] mt-1.5">
                        Deliver to: <span className="text-slate-900">{activeMission.customer_name || activeMission.buyer_name || 'Student'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── ACTION BUTTONS ── */}
                <div className="px-6 pb-4 flex gap-3">
                  <button
                    onClick={() => window.open(navUrl, '_blank')}
                    className="flex-1 h-12 bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus:ring-4 focus:ring-slate-900/5 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition-all outline-none"
                  >
                    <Navigation size={14} /> Navigate
                  </button>
                  {activeMission.status === 'PREPARING' ? (
                    <button disabled className="flex-1 h-12 bg-slate-50 text-slate-400 border border-slate-100 rounded-xl font-bold text-[12px]">Preparing...</button>
                  ) : activeMission.status === 'READY_FOR_PICKUP' ? (
                    <button onClick={() => setProofMode('PICKUP')} className="flex-[1.5] h-12 bg-slate-900 text-white hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/10 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md outline-none">
                      <Check size={14} strokeWidth={3} /> Confirm Pickup
                    </button>
                  ) : (
                    <button onClick={() => setProofMode('DELIVERY')} className="flex-[1.5] h-12 bg-slate-900 text-white hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/10 rounded-xl font-bold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md outline-none">
                      <Zap size={14} strokeWidth={2.5} /> Deliver Item
                    </button>
                  )}
                </div>
                {/* OPTIONS BUTTON */}
                <button 
                  onClick={() => { setOptionsDrawerOpen(true); setReportStep(false); }}
                  className="w-full pb-5 text-[10px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-widest active:scale-95 transition-all text-center"
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
                                     <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8] mb-0.5">{typeLabel}</p>
                                     <h3 className="text-[15px] font-bold text-slate-900 tracking-tight line-clamp-1">{requestDetails}</h3>
                                  </div>
                               </div>
                               <div className="text-right shrink-0">
                                  <p className="text-[18px] font-black text-slate-900 tracking-tighter">RM {(mission.total_price || mission.deliveryFee || 3.50).toFixed(2)}</p>
                                  <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest mt-0.5">Payout</p>
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
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Pickup From</p>
                                        <p className="text-[13px] font-medium text-slate-900 leading-snug line-clamp-2">{mission.pickup_location || mission.seller_name || 'Merchant'}</p>
                                        {!isMarketplace && clientName && <p className="text-[11px] font-medium text-slate-400 mt-0.5">Contact: {clientName}</p>}
                                     </div>
                                  </div>
                                  
                                  <div className="flex items-start gap-4">
                                     <div className="w-3 h-3 rounded-full bg-slate-900 border-2 border-white shrink-0 mt-1 relative z-10 shadow-sm" />
                                     <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#94a3b8]">Deliver To</p>
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
                   <h3 className="text-[18px] font-black tracking-tight text-slate-900">Options</h3>
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
                   <h3 className="text-[18px] font-black tracking-tight text-slate-900 flex items-center gap-2">
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
            <motion.div initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.95 }} className="bg-white w-full max-w-sm rounded-[24px] p-8 space-y-8 shadow-xl border border-slate-100">
               <div className="text-center space-y-2">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center text-slate-900 mb-4 border border-slate-100 shadow-sm"><Camera size={28} strokeWidth={2} /></div>
                 <h3 className="text-[18px] font-black tracking-tight text-slate-900">{proofMode === 'PICKUP' ? 'Photo Proof of Pickup' : 'Photo Proof of Delivery'}</h3>
                 <p className="text-[12px] font-medium text-[#94a3b8] px-4 leading-relaxed">{proofMode === 'PICKUP' ? 'Take a clear photo of the items at the pickup point.' : 'Take a clear photo of the items at the drop-off point.'}</p>
               </div>
               <div className="space-y-5">
                 <input type="file" accept="image/*" capture="environment" id="pod-capture" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setPodPhoto(file); setPodPreview(URL.createObjectURL(file)); } }} />
                 {podPreview ? (
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 group shadow-sm">
                      <img src={podPreview} className="w-full h-full object-cover" />
                      <button onClick={() => { setPodPhoto(null); setPodPreview(null); }} className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md text-slate-700 hover:text-red-500 rounded-full flex items-center justify-center shadow-sm transition-colors"><X size={16}/></button>
                    </div>
                 ) : (
                    <label htmlFor="pod-capture" className="w-full h-[140px] border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 focus-within:ring-4 focus-within:ring-slate-900/5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all outline-none">
                      <Camera size={24} className="text-[#94a3b8] group-hover:text-slate-700 transition-colors" />
                      <span className="text-[13px] font-bold text-[#94a3b8] group-hover:text-slate-700 transition-colors">Tap to take photo</span>
                    </label>
                 )}
                 <button disabled={!podPhoto || isProcessing} onClick={proofMode === 'PICKUP' ? handleConfirmPickup : handleFinalizeDelivery} className="w-full h-14 bg-slate-900 hover:bg-slate-800 focus:ring-4 focus:ring-slate-900/10 text-white rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-30 transition-all shadow-md active:scale-95 outline-none">
                   {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={18} strokeWidth={2.5} />}
                   {proofMode === 'PICKUP' ? 'Confirm Pickup' : 'Complete Delivery'}
                 </button>
                 <button onClick={() => setProofMode(null)} className="w-full text-[11px] font-black text-[#94a3b8] hover:text-slate-600 uppercase tracking-widest py-1 transition-colors outline-none">Cancel</button>
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
              className="w-32 h-32 bg-slate-800 rounded-[40px] flex items-center justify-center mb-10 shadow-md shadow-slate-900/40 border border-slate-700"
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
              <h2 className="text-[28px] font-black tracking-tight text-white">Mission Secured</h2>
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
