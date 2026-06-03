"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CheckCircle2, Package, Activity,
  Clock, ShieldCheck, MapPin, Receipt,
  ShieldAlert, Truck, Info, XCircle, Star, Navigation
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import ReportIssueModal from '@/components/shared/ReportIssueModal';
import PostDeliveryReview from '@/components/marketplace/PostDeliveryReview';
import OrderTracker from '@/components/shared/OrderTracker';
import dynamic from 'next/dynamic';

const BuyerLiveMap = dynamic(() => import('@/components/shared/BuyerLiveMap'), { ssr: false });

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}


// ── Order phases ──
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

function StatusPill({ status }: { status: string }) {
  const s = status?.toUpperCase() || '';
  const isDone = ['DELIVERED', 'COMPLETED'].includes(s);
  const isCancelled = s === 'CANCELLED';
  const isLive = !isDone && !isCancelled;

  return (
    <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${
      isDone ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
      isCancelled ? 'bg-red-50 border-red-100 text-red-600' : 
      'bg-amber-50 border-amber-100 text-amber-600'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        isDone ? 'bg-emerald-500' : 
        isCancelled ? 'bg-red-500' : 
        'bg-amber-500 animate-pulse'
      }`} />
      <span className="text-[11px] font-black uppercase tracking-widest">{s.replace(/_/g, ' ')}</span>
    </div>
  );
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

function StatusKinetics({ status }: { status: string }) {
  const s = status?.toUpperCase() || '';
  
  // Determine kinetic state
  let state: 'WAITING' | 'PREPARING' | 'RUNNING' | 'DELIVERED' = 'RUNNING';
  if (['PENDING', 'PENDING_RUNNER', 'PENDING_VENDOR', 'AWAITING_RUNNER'].includes(s)) {
    state = 'WAITING';
  } else if (['PREPARING', 'READY_FOR_PICKUP'].includes(s)) {
    state = 'PREPARING';
  } else if (['DELIVERED', 'COMPLETED'].includes(s)) {
    state = 'DELIVERED';
  }

  return (
    <div className="w-full h-[380px] bg-linear-to-b from-amber-500/5 via-[#f8fafc] to-white relative flex flex-col items-center justify-center pt-8 select-none overflow-hidden">
      <AnimatePresence mode="wait">
        {state === 'WAITING' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <line x1="15" y1="82" x2="85" y2="82" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
                
                <motion.circle
                  cx="50"
                  cy="50"
                  r="24"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                />

                <g>
                  <rect x="42" y="30" width="16" height="30" rx="8" fill="slate-900" />
                  <circle cx="50" cy="20" r="7" fill="slate-900" />
                  <path d="M 43 16 L 57 16 L 62 19 L 43 19 Z" fill="#f59e0b" />
                  
                  <path d="M 45 60 L 45 82" stroke="slate-900" strokeWidth="4.5" strokeLinecap="round" />
                  
                  <motion.path
                    stroke="slate-900"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{
                      d: [
                        "M 55 60 L 58 72 L 55 82",
                        "M 55 60 L 58 70 L 59 78",
                        "M 55 60 L 58 72 L 55 82"
                      ]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6,
                      ease: "easeInOut"
                    }}
                  />

                  <path d="M 42 36 L 36 44 L 42 48" stroke="slate-900" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M 58 36 L 64 42 L 54 44" stroke="slate-900" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                  <rect x="51" y="42" width="6" height="8" rx="1.5" fill="#f59e0b" />
                  <motion.circle
                    cx="54"
                    cy="46"
                    r="4"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    animate={{ scale: [1, 2.5, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                  />
                </g>
              </svg>
            </div>
            <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest leading-none mt-2 animate-pulse">
              Finding a courier...
            </p>
          </motion.div>
        )}

        {state === 'PREPARING' && (
          <motion.div
            key="preparing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <rect x="20" y="76" width="60" height="6" rx="2" fill="#cbd5e1" />

                <motion.g
                  animate={{ y: [0, -1, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <rect x="42" y="58" width="16" height="18" rx="3" fill="#f59e0b" />
                  <line x1="50" y1="58" x2="50" y2="76" stroke="#d97706" strokeWidth="1.5" />
                  <line x1="42" y1="67" x2="58" y2="67" stroke="#d97706" strokeWidth="1.5" />
                </motion.g>

                <motion.path
                  d="M 45 52 Q 43 44 47 38"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ opacity: [0, 0.6, 0], y: [5, -15] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                />
                <motion.path
                  d="M 50 50 Q 52 42 48 36"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ opacity: [0, 0.6, 0], y: [5, -15] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.6, ease: "easeInOut" }}
                />
                <motion.path
                  d="M 55 52 Q 53 44 57 38"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ opacity: [0, 0.6, 0], y: [5, -15] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 1.2, ease: "easeInOut" }}
                />

                <motion.g
                  animate={{ y: [0, 1.5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <rect x="42" y="32" width="16" height="26" rx="8" fill="slate-900" />
                  <circle cx="50" cy="22" r="7" fill="slate-900" />
                  <path d="M 43 18 L 57 18 L 62 21 L 43 21 Z" fill="#f59e0b" />
                  <path d="M 44 40 L 48 48 L 56 40" stroke="slate-900" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </motion.g>
              </svg>
            </div>
            <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest leading-none mt-2 animate-pulse">
              Merchant is preparing...
            </p>
          </motion.div>
        )}

        {state === 'RUNNING' && (
          <motion.div
            key="running"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center w-full"
          >
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <motion.line
                  x1="15"
                  y1="82"
                  x2="85"
                  y2="82"
                  stroke="#cbd5e1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="8 8"
                  animate={{ strokeDashoffset: [0, 16] }}
                  transition={{ repeat: Infinity, duration: 0.45, ease: "linear" }}
                />

                <motion.path
                  d="M 80 30 L 90 30"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ x: [0, -100], opacity: [0, 0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                />
                <motion.path
                  d="M 75 48 L 82 48"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  animate={{ x: [0, -100], opacity: [0, 0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.2, ease: "linear" }}
                />
                
                <motion.g
                  animate={{
                    y: [0, -3, 0, -3, 0],
                    rotate: [6, 8, 6, 8, 6]
                  }}
                  style={{ transformOrigin: "50px 60px" }}
                  transition={{ repeat: Infinity, duration: 0.55, ease: "easeInOut" }}
                >
                  <ellipse cx="50" cy="82" rx="12" ry="2" fill="#e2e8f0" />

                  <rect x="42" y="32" width="16" height="28" rx="8" fill="slate-900" />
                  <circle cx="50" cy="22" r="7" fill="slate-900" />
                  <path d="M 43 18 L 57 18 L 62 21 L 43 21 Z" fill="#f59e0b" />
                  
                  <motion.path
                    stroke="slate-900"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{
                      d: [
                        "M 46 60 L 36 71 L 46 81",
                        "M 46 60 L 43 72 L 44 82",
                        "M 46 60 L 52 70 L 44 78",
                        "M 46 60 L 42 68 L 38 76"
                      ]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.55,
                      ease: "linear"
                    }}
                  />

                  <motion.path
                    stroke="slate-900"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{
                      d: [
                        "M 54 60 L 60 70 L 52 78",
                        "M 54 60 L 50 68 L 46 76",
                        "M 54 60 L 44 71 L 54 81",
                        "M 54 60 L 51 72 L 52 82"
                      ]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.55,
                      ease: "linear"
                    }}
                  />

                  <motion.path
                    stroke="slate-900"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{
                      d: [
                        "M 54 36 L 64 42 L 58 48",
                        "M 54 36 L 62 44 L 56 46",
                        "M 54 36 L 64 42 L 58 48"
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 0.55, ease: "easeInOut" }}
                  />
                  
                  <motion.g
                    animate={{
                      y: [0, -2, 0, -2, 0],
                      rotate: [0, 3, 0, 3, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
                  >
                    <rect x="58" y="38" width="14" height="12" rx="3.5" fill="#f59e0b" />
                    <line x1="65" y1="38" x2="65" y2="50" stroke="#d97706" strokeWidth="1.5" />
                    <line x1="58" y1="44" x2="72" y2="44" stroke="#d97706" strokeWidth="1.5" />
                  </motion.g>
                </motion.g>
              </svg>
            </div>
            <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest leading-none mt-2 animate-pulse">
              Courier is speeding your way
            </p>
          </motion.div>
        )}

        {state === 'DELIVERED' && (
          <motion.div
            key="delivered"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                <line x1="15" y1="82" x2="85" y2="82" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />

                <motion.g
                  animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <polygon points="28,25 30,30 35,30 31,33 33,38 28,35 23,38 25,33 21,30 26,30" fill="#f59e0b" />
                  <polygon points="72,20 74,25 79,25 75,28 77,33 72,30 67,33 69,28 65,25 70,25" fill="#f59e0b" />
                </motion.g>

                <motion.g
                  animate={{
                    y: [0, -16, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.0,
                    ease: [0.175, 0.885, 0.32, 1.275]
                  }}
                >
                  <motion.ellipse
                    cx="50"
                    cy="82"
                    rx="8"
                    ry="1.5"
                    fill="#e2e8f0"
                    animate={{ scale: [1, 0.5, 1], opacity: [0.8, 0.3, 0.8] }}
                    transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
                  />

                  <rect x="42" y="30" width="16" height="30" rx="8" fill="slate-900" />
                  <circle cx="50" cy="20" r="7" fill="slate-900" />
                  <path d="M 43 16 L 57 16 L 62 19 L 43 19 Z" fill="#f59e0b" />
                  
                  <motion.path
                    stroke="slate-900"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{
                      d: [
                        "M 45 60 L 45 80",
                        "M 45 60 L 40 70 L 43 76",
                        "M 45 60 L 45 80"
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
                  />

                  <motion.path
                    stroke="slate-900"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{
                      d: [
                        "M 55 60 L 55 80",
                        "M 55 60 L 60 70 L 57 76",
                        "M 55 60 L 55 80"
                      ]
                    }}
                    transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
                  />

                  <path d="M 42 36 L 30 20" stroke="slate-900" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 58 36 L 70 20" stroke="slate-900" strokeWidth="4" strokeLinecap="round" />
                </motion.g>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LiveOrderPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [mapSrc, setMapSrc] = useState('/map-bg.png');

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
        if (snap.exists()) setOrder({ id: snap.id, ...snap.data() });
        setLoading(false);
      });
    });

    return () => { unsubAuth(); unsub?.(); };
  }, [id, router]);


  // ── Cancel order (PENDING_VENDOR only) ──
  const handleCancelOrder = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await updateDoc(doc(db, 'orders', id as string), {
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'buyer',
      });
      setShowCancelConfirm(false);
    } catch (e) {
      console.error('[Cancel]', e);
      setCancelError('Could not cancel. Please try again.');
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
  const showReview = isDone && !order.isReviewed;

  const dropoffLat = 3.1594;
  const dropoffLng = 101.6998;
  const realDistance = order.runner_location?.latitude && order.runner_location?.longitude
    ? getDistance(order.runner_location.latitude, order.runner_location.longitude, dropoffLat, dropoffLng)
    : null;

  const distance = realDistance !== null 
    ? Math.max(0, Math.round(realDistance))
    : Math.max(0, Math.round(250 * (1 - progress)));

  const durationMin = Math.max(1, Math.ceil(distance / 80));
  const isClose = distance > 0 && distance < 200;
  const isMoving = ['ON_THE_WAY', 'IN_TRANSIT', 'PICKED_UP'].includes(status);
  const isRunner = userId === order.runner_id;
  const showBuyerMap = isMoving && !!order.runner_location;

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-36 relative">

      {/* ── VIBRANT MAP HERO ── */}
      <div className="absolute top-0 left-0 right-0 h-[380px] z-0 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-amber-500/10 to-white z-10 pointer-events-none" />
        
        {/* Google Maps Walking Directions HUD (Runner Only) */}
        {isRunner && isMoving && (
          <div className="absolute top-[96px] left-6 right-6 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-[#0f9d58] text-white px-4 py-3.5 rounded-2xl shadow-md flex items-center gap-3.5 border border-[#0d8a4d]">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <Navigation size={18} className="text-white fill-white -rotate-45" />
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-[14px] font-black tracking-tight leading-none">Walk {distance}m</span>
                  <span className="text-[11px] font-semibold text-white/80">• {durationMin} min{durationMin > 1 ? 's' : ''}</span>
                </div>
                <p className="text-[10px] font-bold text-white/95 uppercase tracking-widest leading-none truncate">
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
        ) : showBuyerMap ? (
          <div className="w-full h-[380px] bg-[#f8fafc] relative overflow-hidden">
            <BuyerLiveMap runnerLocation={order.runner_location} />
          </div>
        ) : (
          <StatusKinetics status={status} />
        )}
        
        {/* Logistics Data (Ultra-Minimalist & Transparent) */}
        <div className="absolute bottom-8 left-6 z-20 pointer-events-none">
          <div className="space-y-4 w-[280px]">
             <div className="relative pl-5 space-y-4">
               {/* Crisp vertical alignment track line */}
               <div className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-slate-300 opacity-60" />
               
               {/* Pickup Node */}
               <div className="relative">
                 <div className="absolute -left-[19.5px] top-[4px] w-2 h-2 rounded-full bg-amber-500" />
                 <div className="flex items-baseline gap-2">
                   <span className="text-[12px] font-bold text-slate-900">{order.seller_name || 'Merchant'}</span>
                   <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Pickup</span>
                 </div>
                 <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">{order.pickup_location || 'Campus Shop'}</p>
               </div>
               
               {/* Meet At Node */}
               <div className="relative">
                 <div className="absolute -left-[19.5px] top-[4px] w-2 h-2 rounded-full bg-emerald-500" />
                 <div className="flex items-baseline gap-2">
                   <span className="text-[12px] font-bold text-slate-900">{order.buyer_name || 'You'}</span>
                   <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Meet</span>
                 </div>
                 <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">
                   {order.drop_off_location || 'Main Lobby'}
                   {(order.floorLevel || order.roomNumber) && (
                     <span className="ml-1 font-bold text-slate-600">
                       ({order.floorLevel ? `Lvl ${order.floorLevel}` : ''}
                       {order.floorLevel && order.roomNumber ? ', ' : ''}
                       {order.roomNumber ? `Rm ${order.roomNumber}` : ''})
                     </span>
                   )}
                 </p>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* ── FLOATING NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-6 flex items-center justify-between pointer-events-none select-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <BackButton />
          <div className="flex flex-col justify-center">
            <p className="text-[13px] font-black text-slate-900 tracking-tight leading-tight">Order Details</p>
            <p className="text-[10px] font-black text-amber-600 tracking-wider leading-none mt-0.5">#{order.order_code || order.id.slice(0, 6).toUpperCase()}</p>
          </div>
        </div>
        <div className="pointer-events-auto">
          <StatusPill status={status} />
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div className="pt-[420px] px-6 space-y-10 relative z-10">

        {/* Proximity Alert Banner (< 200m) */}
        {isClose && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3.5 animate-pulse shadow-sm shadow-emerald-500/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <MapPin size={16} />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="text-[12px] font-black text-emerald-950 uppercase tracking-widest leading-none mb-1">Nearby Alert</p>
              <p className="text-[11px] font-semibold text-emerald-700 leading-tight">
                Runner is under {distance}m away! Meet at drop-off point now.
              </p>
            </div>
          </div>
        )}

        {/* ── PROGRESS VIBRANCY ── */}
        <section className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-50">
          <OrderTracker order={order} />
        </section>

        {/* ── PAYMENT RECEIPT ── */}
        <section className="space-y-3">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Payment Receipt</h2>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100">
            {/* Item Summary */}
            <div className="flex items-start justify-between px-4 py-3.5">
              <span className="text-[13px] font-medium text-[#94a3b8] shrink-0">Items</span>
              <div className="text-right pl-4">
                {order.items?.length > 0 ? (
                  order.items.map((it: any, i: number) => (
                    <p key={i} className="text-[13px] font-bold text-slate-900">{it.qty}x {it.title}</p>
                  ))
                ) : (
                  <p className="text-[13px] font-bold text-slate-900">1x {order.title || 'Pulse Order'}</p>
                )}
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
                {order.created_at?.toDate 
                  ? order.created_at.toDate().toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
                  : new Date(order.created_at || Date.now()).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            
            {/* Price Breakdown */}
            <div className="px-4 py-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#94a3b8]">Subtotal</span>
                <span className="text-[13px] font-bold text-slate-900">RM {Number(order.price || 0).toFixed(2)}</span>
              </div>
              {order.delivery_type === 'RUNNER' && (
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#94a3b8]">Runner Fee</span>
                  <span className="text-[13px] font-bold text-slate-900">RM {Number((order.total || order.price) - order.price).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Total Paid */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-slate-100/50 rounded-b-xl">
              <span className="text-[13px] font-bold text-slate-900">Total Paid</span>
              <span className="text-[15px] font-black text-slate-900">RM {Number(order.total || order.price).toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* ── HANDSHAKE NOTICE ── */}
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

        {/* ── CANCEL ORDER (Pending only) ── */}
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

        {/* ── DRAKE SAFETY NET (Support after Delivery) ── */}
        {!isCancelled && !isPending && (
          <section className="space-y-4 pt-4 border-t border-slate-50">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
               <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Support & Resolution</h3>
            </div>
            
            <div className="p-6 bg-white border border-slate-100 rounded-2xl space-y-4">
               <div className="space-y-1">
                  <p className="text-[14px] font-bold text-slate-900">Need help?</p>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                     You can report any issues within 24 hours after your order arrives.
                  </p>
               </div>
               
               <button
                 onClick={() => setIsReportOpen(true)}
                 disabled={!order.handshake?.seller_confirmed && !isDone}
                 className="w-full h-14 bg-white border border-slate-100 text-[13px] font-bold text-slate-900 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-sm disabled:opacity-30"
               >
                 <ShieldAlert size={18} className="text-red-500" />
                 Report Issue or Refund
               </button>
            </div>
          </section>
        )}

        {/* ── POST-DELIVERY REVIEW ── */}
        {showReview && userId && (
          <section className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Star size={14} className="text-amber-400" fill="currentColor" />
              <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Rate Your Experience</h2>
            </div>
            <PostDeliveryReview order={order} userId={userId} />
          </section>
        )}

      </div>

      {/* ── RELAXED RETURN (Matured Exit) ── */}
      {isDone && !showSuccessOverlay && (
        <div className="px-6 pb-20">
          <button 
            onClick={() => router.push('/marketplace')}
            className="w-full h-14 bg-white border border-slate-100 text-[#94a3b8] rounded-2xl font-bold text-[12px] uppercase tracking-[0.2em] hover:text-slate-900 hover:border-slate-900 transition-all active:scale-95"
          >
            Return
          </button>
        </div>
      )}

      {/* ── VIBRANT SUCCESS OVERLAY ── */}
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
                <h1 className="text-[28px] font-black tracking-tight text-slate-900 leading-none">Delivered!</h1>
                <p className="text-[12px] text-slate-400 font-medium leading-relaxed">Your order is complete.<br/>Enjoy your item!</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CANCEL CONFIRMATION BOTTOM-SHEET ── */}
      <AnimatePresence>
        {showCancelConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !cancelling && setShowCancelConfirm(false)}
              className="fixed inset-0 z-400 bg-black/30 backdrop-blur-md"
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

      <ReportIssueModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        order={order}
        onSuccess={() => setIsReportOpen(false)}
      />
    </main>
  );
}
