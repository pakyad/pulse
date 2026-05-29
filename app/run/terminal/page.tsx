"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Camera, X, Loader2, 
  MapPin, Navigation, Check,
  ArrowUpRight, ShieldCheck,
  ChevronLeft, Clock, Zap
} from 'lucide-react';
import { completeDelivery } from '@/app/actions/deliveryActions';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

const LiveMap = dynamic(() => import('@/components/runner/LiveMap'), { ssr: false });

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
  return 'text-slate-400';
}

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-[17px] font-bold text-[#000000] tracking-tight ${className}`}>
    {children}
  </h3>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[13px] font-medium text-[#94a3b8] leading-snug ${className}`}>
    {children}
  </p>
);

const StatCard = ({ label, value, icon: Icon, color = "text-[#000000]" }: any) => (
  <div className="bg-white p-6 rounded-[32px] border-[0.5px] border-slate-100 shadow-sm flex flex-col justify-between h-36">
    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border-[0.5px] border-slate-100">
      <Icon size={18} strokeWidth={1.5} />
    </div>
    <div>
      <Subtext className="text-[11px] mb-0.5 uppercase tracking-wider">{label}</Subtext>
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
  const [runnerCoords, setRunnerCoords] = useState<{lat: number; lng: number} | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
          where("status", "in", ["PREPARING", "READY_FOR_PICKUP", "IN_TRANSIT", "PICKED_UP", "ARRIVED_AT_DESTINATION"])
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
          where("status", "in", ["PENDING_RUNNER"])
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
        const { latitude, longitude } = position.coords;
        setRunnerCoords({ lat: latitude, lng: longitude });
        const now = Date.now();
        if (shouldBroadcast && now - lastWriteTime > 5000) {
          lastWriteTime = now;
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
      (err) => console.warn("Geolocation error:", err),
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

  const handleAccept = async (jobId: string) => {
    if (!auth.currentUser || !isOnline) return;
    setIsProcessing(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "orders", jobId);
        const snap = await tx.get(ref);
        if (!snap.exists() || snap.data().runner_id) throw "Job already claimed.";
        tx.update(ref, { 
          runner_id: auth.currentUser?.uid, 
          runner_name: profile?.full_name || 'Runner',
          status: 'AWAITING_MERCHANT_ACCEPT',
          accepted_at: serverTimestamp()
        });
      });
      setIsPoolExpanded(false);
    } catch (e: any) { console.error('[Accept]', e); } finally { setIsProcessing(false); }
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

  if (loading) return null;

  // ── PRE-COMPUTE MISSION DATA (before JSX) ──
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
    <main className="min-h-screen bg-white font-sans antialiased text-[#000000] selection:bg-slate-100 relative overflow-hidden">
      
      {/* ── BACKGROUND LAYER ── */}
      <motion.div 
        animate={{ 
          scale: isPoolExpanded ? 0.94 : 1,
          opacity: isPoolExpanded ? 0.4 : 1,
          filter: isPoolExpanded ? 'blur(10px)' : 'blur(0px)',
          borderRadius: isPoolExpanded ? '48px' : '0px'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="min-h-screen bg-white pb-40 overflow-x-hidden relative"
      >
        {/* ── MATURED NAVIGATION ── */}
        <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
           <div className="flex items-center gap-3">
              <button onClick={() => router.push('/run')} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 active:scale-95 transition-all">
                 <ChevronLeft size={18} />
              </button>
              <div>
                 <p className="text-[21px] font-bold tracking-tight text-slate-900 leading-none">Terminal Hub</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} className="scale-90" />
           </div>
        </nav>

        {/* ── MAP VIEWPORT ── */}
        <section className={`transition-all duration-700 ease-in-out relative ${activeMission ? 'h-[45vh]' : 'h-[30vh]'} w-full pt-20`}>
           <LiveMap hasActiveJob={!!activeMission} />
           <div className="absolute inset-0 bg-linear-to-b from-white via-transparent to-white/20" />
        </section>

        {/* ── STATS & ACTIONS ── */}
        <section className="px-8 -mt-10 relative z-10 space-y-12">
           {!activeMission && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="grid grid-cols-2 gap-4"
             >
                <div className="bg-white p-6 rounded-[32px] border-[0.5px] border-slate-100 shadow-sm space-y-4">
                   <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Earnings</p>
                   <p className="text-[24px] font-bold text-emerald-600 tracking-tight leading-none">RM {(profile?.balance || 0).toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border-[0.5px] border-slate-100 shadow-sm space-y-4">
                   <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Rating</p>
                   <p className="text-[24px] font-bold text-slate-900 tracking-tight leading-none">5.0</p>
                </div>
             </motion.div>
           )}

            <AnimatePresence mode="wait">
              {activeMission ? (
                  <motion.div 
                    key="active" 
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="bg-white rounded-[40px] border-[0.5px] border-slate-100 shadow-[0_32px_64px_-16px_rgba(30,41,59,0.12)] relative overflow-hidden"
                  >
                    {/* STATUS ACCENT LINE */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${isPickedUp ? 'bg-blue-500' : 'bg-blue-600'}`} />

                    {/* ── CARD HEADER ── */}
                    <div className="px-8 pt-10 pb-6 flex items-start justify-between">
                      <div>
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.18em]">Mission Active</p>
                        <p className="text-[11px] font-medium text-slate-300 mt-0.5 lowercase">#{activeMission.id.substring(0,8).toUpperCase()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* TIMER */}
                        <div className={`flex items-center gap-1.5 ${timerColor(elapsedSeconds)}`}>
                          <Clock size={13} strokeWidth={2} />
                          <span className="text-[13px] font-black tabular-nums">{fmtElapsed(elapsedSeconds)}</span>
                        </div>
                        {/* STATUS BADGE */}
                        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                          isPickedUp 
                            ? 'bg-blue-50 text-blue-600 border-blue-100' 
                            : 'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {activeMission.status === 'PICKED_UP' ? 'Secured' : activeMission.status.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>

                    {/* ── TELEMETRY STRIP ── */}
                    <div className="mx-8 mb-6 px-5 py-3 bg-slate-50 rounded-2xl border-[0.5px] border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400" />
                        <span className="text-[12px] font-bold text-[#000000]">
                          {displayDist !== null ? `~${fmtDist(displayDist)} away` : 'GPS locating...'}
                        </span>
                        <span className="text-[10px] text-slate-300 font-medium">
                          {isPickedUp ? '↗ to drop-off' : '↗ to pickup'}
                        </span>
                      </div>
                      <button
                        onClick={() => window.open(navUrl, '_blank')}
                        className="flex items-center gap-1 text-[11px] font-black text-[#000000] uppercase tracking-widest active:scale-95 transition-all"
                      >
                        <Navigation size={12} /> Navigate
                      </button>
                    </div>

                    {/* ── ROUTE NODES ── */}
                    <div className="px-8 pb-6 space-y-0">

                      {/* PICKUP NODE */}
                      <div className={`flex items-start gap-4 p-5 rounded-2xl transition-all ${
                        isPickedUp ? 'opacity-30' : 'bg-slate-50/60'
                      }`}>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 transition-all ${
                          activeMission.status === 'READY_FOR_PICKUP' ? 'bg-blue-600 text-white border-blue-600 animate-pulse' :
                          isPickedUp ? 'bg-slate-100 text-slate-300 border-slate-100' :
                          'bg-white text-slate-400 border-slate-200'
                        }`}>
                          {isPickedUp ? <Check size={16} /> : <Navigation size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#000000] tracking-tight">{activeMission.seller_name || 'Merchant'}</p>
                          {activeMission.pickup_location && (
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-snug">{activeMission.pickup_location}</p>
                          )}
                          <p className={`text-[11px] font-semibold mt-1 ${
                            activeMission.status === 'READY_FOR_PICKUP' ? 'text-[#000000] font-black' : 'text-slate-400'
                          }`}>
                            {isPickedUp ? '✓ Item collected' :
                             activeMission.status === 'READY_FOR_PICKUP' ? '⚡ Ready — Go collect now' :
                             `Collect: ${activeMission.title || 'package'}`}
                          </p>
                          {pickupDistM !== null && !isPickedUp && (
                            <p className="text-[10px] font-bold text-slate-300 mt-1">{fmtDist(pickupDistM)} from you</p>
                          )}
                        </div>
                      </div>

                      {/* CONNECTOR LINE */}
                      <div className="ml-12 h-6 border-l border-dashed border-slate-200" />

                      {/* DROP-OFF NODE */}
                      <div className={`flex items-start gap-4 p-5 rounded-2xl transition-all ${
                        isPickedUp ? 'bg-blue-50/60 ring-1 ring-blue-100' : ''
                      }`}>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 transition-all ${
                          isPickedUp ? 'bg-blue-600 shadow-blue-600/25 scale-110' : 'bg-blue-600 shadow-slate-900/10'
                        }`}>
                          <MapPin size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#000000] tracking-tight">{activeMission.drop_off_location || 'Drop-off'}</p>
                          {/* Floor + Room detail */}
                          {(activeMission.floorLevel || activeMission.roomNumber) && (
                            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                              {activeMission.floorLevel ? `Level ${activeMission.floorLevel}` : ''}
                              {activeMission.floorLevel && activeMission.roomNumber ? ' · ' : ''}
                              {activeMission.roomNumber ? `Room ${activeMission.roomNumber}` : ''}
                            </p>
                          )}
                          <p className="text-[11px] font-semibold text-slate-400 mt-1">
                            Deliver to: {activeMission.customer_name || activeMission.buyer_name || 'Student'}
                          </p>
                          {dropoffDistM !== null && isPickedUp && (
                            <p className="text-[11px] font-black text-blue-500 mt-1">{fmtDist(dropoffDistM)} away</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── ACTION BUTTONS ── */}
                    <div className="px-8 pb-8 flex gap-3">
                      <button
                        onClick={() => window.open(navUrl, '_blank')}
                        className="flex-1 h-14 bg-slate-50 text-[#000000] border border-slate-100 rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <Navigation size={15} /> Navigate
                      </button>
                      {activeMission.status === 'PREPARING' ? (
                        <button disabled className="flex-1 h-14 bg-slate-100 text-slate-300 rounded-2xl font-bold text-[13px]">Preparing...</button>
                      ) : activeMission.status === 'READY_FOR_PICKUP' ? (
                        <button onClick={() => setProofMode('PICKUP')} className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-slate-900/10">
                          <Check size={15} /> Confirm Pickup
                        </button>
                      ) : (
                        <button onClick={() => setProofMode('DELIVERY')} className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-blue-600/15">
                          <Zap size={15} /> Deliver
                        </button>
                      )}
                    </div>
                  </motion.div>
              ) : (
                 <motion.div key="searching" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-24 flex flex-col items-center justify-center text-center space-y-8">
                    <div className="relative w-20 h-20">
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 180, 270, 360],
                            borderRadius: ["20%", "50%", "20%"]
                          }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-2 border-dashed border-slate-100" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="grid grid-cols-2 gap-1 animate-pulse">
                              {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 bg-slate-200 rounded-xs" />)}
                           </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {jobs.length > 0 ? (
                           <>
                              <p className="text-[18px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">new mission alert</p>
                              <p className="text-[12px] text-slate-400 font-medium lowercase leading-relaxed">
                                 {jobs.length} pending order{jobs.length > 1 ? 's' : ''} in the area.
                              </p>
                           </>
                        ) : (
                           <>
                              <p className="text-[16px] font-bold text-slate-900 lowercase">no active mission...</p>
                              <p className="text-[12px] text-slate-400 font-medium lowercase leading-relaxed">
                                 go to orders to claim a mission.
                              </p>
                           </>
                        )}
                    </div>
                    <button 
                      onClick={() => router.push('/run/missions')}
                      className={`px-8 h-11 text-white rounded-full text-[12px] font-bold shadow-lg active:scale-95 transition-all lowercase ${jobs.length > 0 ? 'bg-emerald-500 shadow-emerald-500/20 animate-bounce' : 'bg-slate-900 shadow-slate-900/10'}`}
                    >
                      {jobs.length > 0 ? 'claim now' : 'browse orders'}
                    </button>
                 </motion.div>
              )}
           </AnimatePresence>
        </section>
      </motion.div>

      {/* ── PROOF MODAL ── */}
      <AnimatePresence>{proofMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-1000 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-white w-full max-w-md rounded-[40px] p-10 space-y-10 shadow-2xl">
               <div className="text-center space-y-3">
                 <div className="w-20 h-20 bg-slate-50 rounded-[32px] mx-auto flex items-center justify-center text-slate-300 border border-slate-100"><Camera size={32} strokeWidth={1.5} /></div>
                 <Heading className="text-[22px]">{proofMode === 'PICKUP' ? 'Photo Proof of Pickup' : 'Photo Proof of Delivery'}</Heading>
                 <Subtext className="px-6">{proofMode === 'PICKUP' ? 'Take a photo of the items at the pickup point.' : 'Take a photo of the items at the drop-off point.'}</Subtext>
               </div>
               <div className="space-y-6">
                 <input type="file" accept="image/*" capture="environment" id="pod-capture" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setPodPhoto(file); setPodPreview(URL.createObjectURL(file)); } }} />
                 {podPreview ? (
                    <div className="relative aspect-video rounded-[32px] overflow-hidden border border-slate-100 group">
                      <img src={podPreview} className="w-full h-full object-cover" />
                      <button onClick={() => { setPodPhoto(null); setPodPreview(null); }} className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center"><X size={18}/></button>
                    </div>
                 ) : (
                    <label htmlFor="pod-capture" className="w-full h-[160px] border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-all">
                      <Camera size={24} className="text-slate-200" />
                      <Subtext>Tap to take photo</Subtext>
                    </label>
                 )}
                 <button disabled={!podPhoto || isProcessing} onClick={proofMode === 'PICKUP' ? handleConfirmPickup : handleFinalizeDelivery} className="w-full h-16 bg-blue-600 text-white rounded-[24px] font-bold text-[14px] flex items-center justify-center gap-3 disabled:opacity-20 transition-all shadow-xl shadow-slate-900/10">
                   {isProcessing ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                   {proofMode === 'PICKUP' ? 'Confirm Pickup' : 'Complete Delivery'}
                 </button>
                 <button onClick={() => setProofMode(null)} className="w-full text-[12px] font-bold text-[#94a3b8] py-2 uppercase tracking-widest">Cancel</button>
               </div>
            </motion.div>
          </motion.div>
      )}</AnimatePresence>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </main>
  );
}
