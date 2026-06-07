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
  Package, ArrowRight, Activity, Map, Store
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { completeDelivery } from '@/app/actions/deliveryActions';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

const LiveMap = dynamic(() => import('@/components/runner/LiveMap'), { ssr: false });

//  ERROR BOUNDARY 
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

//  HAVERSINE DISTANCE 
function haversineMetres(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fmtElapsed(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function timerColor(s: number) {
  if (s >= 1200) return 'text-red-500';
  if (s >= 600) return 'text-amber-500';
  return 'text-gray-400';
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
  const bAvg = bAvg / count;
  
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    variance += Math.pow(data[i] - rAvg, 2) + Math.pow(data[i+1] - gAvg, 2) + Math.pow(data[i+2] - bAvg, 2);
  }
  variance = variance / count;
  
  const brightness = (rAvg * 0.299 + gAvg * 0.587 + bAvg * 0.114);
  if (brightness < 15 || variance < 60) return false;
  
  return true;
};

const addWatermark = async (file: File, orderId: string): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (!validateImage(img)) {
         return reject(new Error('PHOTO_REJECTED'));
      }
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      const stripHeight = Math.max(100, img.height * 0.15);
      ctx.fillRect(0, img.height - stripHeight, img.width, stripHeight);
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
      ctx.fillText(`${dateStr} - ${timeStr}`, 30, img.height - (stripHeight / 2) + 25);
      canvas.toBlob((blob) => {
        if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        else resolve(file);
      }, 'image/jpeg', 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
};

export default function MissionControl() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [missions, setMissions] = useState<any[]>([]);
  const [activeMission, setActiveMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    if (!isOnline || !activeMission) return;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setRunnerCoords({ lat: latitude, lng: longitude });
      },
      (err) => { setLocationError(true); },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline, activeMission?.id]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!activeMission?.accepted_at) { setElapsedSeconds(0); return; }
    const startMs = activeMission.accepted_at?.toMillis ? activeMission.accepted_at.toMillis() : new Date(activeMission.accepted_at).getTime();
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startMs) / 1000));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeMission?.id, activeMission?.accepted_at]);

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
        if (!snap.exists() || snap.data().runner_id) throw "Mission already claimed.";
        tx.update(ref, { 
          runner_id: auth.currentUser?.uid, 
          runner_name: profile?.full_name || 'Runner',
          status: 'READY_FOR_PICKUP',
          accepted_at: serverTimestamp()
        });
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (e: any) { 
      setShowError('Mission already claimed. Try another.');
      setTimeout(() => setShowError(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPickup = async () => {
    if (!activeMission || !auth.currentUser || !podPhoto) return;
    setIsProcessing(true);
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `orders/${activeMission.id}/pickup_${timestamp}.jpg`);
      const uploadRes = await uploadBytes(storageRef, podPhoto);
      const url = await getDownloadURL(uploadRes.ref);
      await updateDoc(doc(db, "orders", activeMission.id), { status: 'PICKED_UP', pickup_photo_url: url, picked_up_at: serverTimestamp() });
      await addDoc(collection(db, "admin_evidence"), { orderId: activeMission.id, type: "PICKUP", photoUrl: url, runnerId: auth.currentUser.uid, timestamp: serverTimestamp() });
      setPodPhoto(null); setPodPreview(null); setProofMode(null);
    } catch (e: any) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleFinalizeDelivery = async () => {
    if (!activeMission || !auth.currentUser || !podPhoto) return;
    setIsProcessing(true);
    try {
      const timestamp = Date.now();
      const storageRef = ref(storage, `orders/${activeMission.id}/delivery_${timestamp}.jpg`);
      const uploadRes = await uploadBytes(storageRef, podPhoto);
      const url = await getDownloadURL(uploadRes.ref);
      await updateDoc(doc(db, "orders", activeMission.id), { delivery_photo_url: url });
      await addDoc(collection(db, "admin_evidence"), { orderId: activeMission.id, type: "DELIVERY", photoUrl: url, runnerId: auth.currentUser.uid, timestamp: serverTimestamp() });
      const res = await completeDelivery(activeMission.id, url, auth.currentUser.uid);
      if (res.success) { setPodPhoto(null); setPodPreview(null); setProofMode(null); }
    } catch (e: any) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleDropOrder = async () => {
    if (!activeMission) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "orders", activeMission.id), { runner_id: null, runner_name: null, status: 'PENDING_RUNNER', accepted_at: null });
      setOptionsDrawerOpen(false);
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const handleReportProblem = async (reason: string) => {
    if (!activeMission) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "orders", activeMission.id), { status: 'ISSUE_REPORTED', issue_reason: reason, issue_reported_by: 'runner', issue_reported_at: serverTimestamp() });
      setOptionsDrawerOpen(false); setReportStep(false);
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  if (loading) return null;

  const isPickedUp = activeMission?.status === 'PICKED_UP' || activeMission?.status === 'IN_TRANSIT';
  const isErrand = activeMission?.type?.toUpperCase() === 'ERRANDS';
  const isParcel = activeMission?.type?.toUpperCase() === 'PARCELS';
  const typeLabel = isErrand ? 'Peer-to-Peer Drop' : (isParcel ? 'Parcel Collection' : 'Marketplace Delivery');

  return (
    <main className="min-h-screen bg-[#F9F9FB] font-sans antialiased text-gray-900 selection:bg-slate-100 relative flex flex-col pb-32">
      {showError && (
        <div className="fixed top-24 left-6 right-6 z-200 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-[12px] font-bold shadow-sm text-center">
          {showError}
        </div>
      )}

      <header className="px-6 pt-8 pb-4 flex flex-col bg-[#F9F9FB]">
        <div className="flex items-center gap-3 mb-2">
          <BackButton fallback="/run" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Delivery Hub</h1>
        </div>
        <p className="text-sm text-gray-400">Active delivery requests near you</p>
      </header>

      {activeMission ? (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full flex flex-col">
           <section className="relative h-[30vh] w-full pt-4 border-b border-gray-100">
              <MapErrorBoundary><LiveMap hasActiveJob={!!activeMission} /></MapErrorBoundary>
           </section>
           <section className="px-4 -mt-6 relative z-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{typeLabel}</p>
                    <p className="text-lg font-bold text-gray-900">#{activeMission.id.substring(0,8).toUpperCase()}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full ${timerColor(elapsedSeconds)}`}>
                     <Clock size={12} strokeWidth={2.5} /><span className="text-[12px] font-bold tabular-nums">{fmtElapsed(elapsedSeconds)}</span>
                  </div>
                </div>
                <div className="space-y-4">
                   <div className={`p-4 rounded-2xl border ${!isPickedUp ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 opacity-60'}`}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Pickup</p>
                      <p className="text-sm font-semibold text-gray-900">{activeMission.pickup_location || activeMission.seller_name}</p>
                      {!isPickedUp && (
                        <button onClick={() => setProofMode('PICKUP')} className="w-full bg-gray-900 text-white text-sm font-medium rounded-full py-3 mt-3 active:scale-95 transition-all">Confirm Pickup</button>
                      )}
                   </div>
                   <div className={`p-4 rounded-2xl border ${isPickedUp ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 opacity-60'}`}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Delivery</p>
                      <p className="text-sm font-semibold text-gray-900">{activeMission.drop_off_location}</p>
                      <p className="text-xs text-gray-400 mt-1">Buyer: {activeMission.customer_name || activeMission.buyer_name}</p>
                      {isPickedUp && (
                        <button onClick={() => setProofMode('DELIVERY')} className="w-full bg-gray-900 text-white text-sm font-medium rounded-full py-3 mt-3 active:scale-95 transition-all">Complete Delivery</button>
                      )}
                   </div>
                </div>
                <button onClick={() => { setOptionsDrawerOpen(true); setReportStep(false); }} className="w-full text-xs font-semibold text-gray-400 py-2">Options</button>
              </motion.div>
           </section>
         </motion.div>
      ) : (
         <div className="flex-1 flex flex-col">
            <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scrollbar">
               {['All', 'Marketplace', 'Parcels', 'Errands'].map(t => (
                  <button key={t} onClick={() => setFilter(t)} className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all ${filter === t ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
               ))}
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
               <AnimatePresence mode="popLayout">
                  {missions.length > 0 ? (
                     missions.filter(m => {
                        if (filter === 'All') return true;
                        if (filter === 'Marketplace') return !['PARCELS', 'ERRANDS'].includes(m.type?.toUpperCase());
                        return m.type?.toUpperCase() === filter.toUpperCase();
                     }).map((mission, idx) => {
                       const mType = mission.type?.toUpperCase() || 'MARKETPLACE';
                       const badgeStyle = mType === 'PARCELS' ? 'bg-purple-50 text-purple-700' : mType === 'ERRANDS' ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700';
                       const typeText = mType === 'PARCELS' ? 'Parcel' : mType === 'ERRANDS' ? 'Errand' : 'Marketplace';

                       return (
                         <motion.div key={mission.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.05 }} className="mx-4 mb-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-1">
                               <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeStyle}`}>{typeText}</span>
                               <div className="text-right">
                                  <p className="text-base font-bold text-gray-900">RM {(mission.total_price || mission.deliveryFee || 3.50).toFixed(2)}</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Payout</p>
                               </div>
                            </div>
                            <h3 className="text-base font-semibold text-gray-900 mb-3">{mission.items_summary || mission.title || 'Delivery Request'}</h3>
                            <div className="flex gap-3 mb-3">
                               <div className="flex flex-col items-center gap-1 pt-1">
                                  <div className="w-2 h-2 rounded-full bg-gray-300"/>
                                  <div className="w-0.5 h-6 bg-gray-200"/>
                                  <div className="w-2 h-2 rounded-full bg-gray-900"/>
                               </div>
                               <div className="flex flex-col gap-3 flex-1">
                                  <div><p className="text-[10px] text-gray-400 uppercase tracking-widest">Pickup From</p><p className="text-sm font-medium text-gray-900">{mission.pickup_location || mission.seller_name || 'Merchant'}</p></div>
                                  <div><p className="text-[10px] text-gray-400 uppercase tracking-widest">Deliver To</p><p className="text-sm font-medium text-gray-900">{mission.drop_off_location || 'Campus'}</p><p className="text-xs text-gray-400">Buyer: {mission.customer_name || mission.buyer_name}</p></div>
                               </div>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-gray-50 mt-1">
                               <div className="flex items-center gap-1.5 text-gray-400"><Clock size={12} /><span className="text-xs">{formatTimeAgo(mission.created_at, now)}</span></div>
                               <button onClick={() => handleClaim(mission.id)} className="bg-gray-900 text-white text-sm font-medium rounded-full px-5 py-2 active:scale-95 transition-transform shadow-sm">Accept Request</button>
                            </div>
                         </motion.div>
                       );
                     })
                  ) : (
                     <div className="flex flex-col items-center justify-center py-20 px-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4"><span className="text-2xl">📭</span></div>
                        <p className="text-base font-semibold text-gray-900 mb-1">No requests right now</p>
                        <p className="text-sm text-gray-400 text-center">New delivery requests will appear here. Stay online to receive them.</p>
                     </div>
                  )}
               </AnimatePresence>
            </div>
         </div>
      )}

      <AnimatePresence>{optionsDrawerOpen && (
          <div className="fixed inset-0 z-1000 bg-black/40 backdrop-blur-sm flex items-end justify-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-10 border-t border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-5">Options</h3>
               <div className="space-y-3">
                 <button onClick={handleDropOrder} className="w-full py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-900 active:scale-95 transition-all">Drop Order</button>
                 <button onClick={() => setOptionsDrawerOpen(false)} className="w-full py-4 bg-gray-100 rounded-2xl font-bold text-gray-900 active:scale-95 transition-all">Cancel</button>
               </div>
            </motion.div>
          </div>
      )}</AnimatePresence>

      <AnimatePresence>{proofMode && (
          <div className="fixed inset-0 z-1000 bg-black/40 backdrop-blur-sm flex items-end justify-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="bg-white w-full max-w-md rounded-t-[32px] p-8 space-y-6">
               <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">{proofMode === 'PICKUP' ? 'Confirm Pickup' : 'Confirm Delivery'}</h3>
                  <p className="text-sm text-gray-400">Take a photo to proceed with the mission.</p>
               </div>
               <div className="space-y-4">
                 <input type="file" accept="image/*" capture="environment" id="pod-capture" className="hidden" onChange={async (e) => { 
                    const file = e.target.files?.[0]; 
                    if (file) { 
                      setIsProcessing(true);
                      const watermarkedFile = await addWatermark(file, activeMission?.id || 'TEST');
                      setPodPhoto(watermarkedFile); 
                      setPodPreview(URL.createObjectURL(watermarkedFile)); 
                      setIsProcessing(false);
                    } 
                 }} />
                 {podPreview ? (
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100">
                      <img src={podPreview} className="w-full h-full object-cover" />
                      <button onClick={() => { setPodPhoto(null); setPodPreview(null); }} className="absolute top-3 right-3 p-2 bg-white/90 rounded-full"><X size={14}/></button>
                    </div>
                 ) : (
                    <label htmlFor="pod-capture" className="w-full h-40 border-2 border-dashed border-gray-200 bg-gray-50 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer">
                      <Camera size={24} className="text-gray-400" />
                      <span className="text-sm font-bold text-gray-500">Tap to take photo</span>
                    </label>
                 )}
                 <button disabled={!podPhoto || isProcessing} onClick={proofMode === 'PICKUP' ? handleConfirmPickup : handleFinalizeDelivery} className="w-full py-4 bg-gray-900 text-white rounded-full font-bold shadow-lg active:scale-95 disabled:opacity-50 transition-all">
                    {isProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Submit Photo'}
                 </button>
                 <button onClick={() => setProofMode(null)} className="w-full text-sm font-bold text-gray-400 py-2">Cancel</button>
               </div>
            </motion.div>
          </div>
      )}</AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-200 bg-gray-900 flex flex-col items-center justify-center text-white text-center p-10">
            <Package size={64} className="mb-6" />
            <h2 className="text-2xl font-bold mb-2">Mission Secured</h2>
            <p className="text-gray-400">Loading map interface...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
