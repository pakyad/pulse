"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ChevronLeft, Package, Camera, CheckCircle2, Clock, Truck, ShoppingBag, Bell, Settings, AlertCircle, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import Link from 'next/link';

// ── Ian Status Config ──
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; icon: any; description: string }> = {
  PENDING: {
    label: 'Waiting for pickup',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-100',
    dot: 'bg-amber-400 animate-pulse',
    icon: Clock,
    description: 'The seller has your order. Head over or wait for confirmation.',
  },
  AWAITING_RUNNER: {
    label: 'Finding a runner',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-100',
    dot: 'bg-blue-400 animate-pulse',
    icon: Package,
    description: 'A runner is being assigned to deliver your order.',
  },
  ON_THE_WAY: {
    label: 'On the way',
    color: 'text-violet-600',
    bg: 'bg-violet-50 border-violet-100',
    dot: 'bg-violet-400 animate-pulse',
    icon: Truck,
    description: 'Your runner has accepted and is heading to deliver.',
  },
  COLLECTED: {
    label: 'Done',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-100',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
    description: 'Order complete. Enjoy!',
  },
  COMPLETE: {
    label: 'Done',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-100',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
    description: 'Order complete. Enjoy!',
  },
};

// ── Ian Timeline ──
// Simple 3-step visual. Shows exactly where the order is.
function OrderTimeline({ status, deliveryType }: { status: string; deliveryType: string }) {
  const isRunner = deliveryType === 'RUNNER';
  const steps = isRunner
    ? [
        { key: 'ordered', label: 'Ordered', done: true },
        { key: 'runner', label: 'Runner assigned', done: ['ON_THE_WAY', 'COLLECTED', 'COMPLETE'].includes(status) },
        { key: 'done', label: 'Delivered', done: ['COLLECTED', 'COMPLETE'].includes(status) },
      ]
    : [
        { key: 'ordered', label: 'Ordered', done: true },
        { key: 'ready', label: 'Ready for pickup', done: ['PENDING', 'COLLECTED', 'COMPLETE'].includes(status) },
        { key: 'done', label: 'Collected', done: ['COLLECTED', 'COMPLETE'].includes(status) },
      ];

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
              step.done ? 'bg-navy' : 'bg-slate-100'
            }`}>
              {step.done
                ? <CheckCircle2 size={14} className="text-white" />
                : <div className="w-2 h-2 rounded-sm bg-slate-300" />
              }
            </div>
            <p className={`text-[9px] font-bold mt-1.5 text-center leading-tight w-14 ${
              step.done ? 'text-navy' : 'text-slate-300'
            }`}>{step.label}</p>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-1 mb-4 ${step.done ? 'bg-navy' : 'bg-slate-100'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [tx, setTx] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;
  const isSeller = uid === tx?.seller_id;
  const isBuyer = uid === tx?.buyer_id;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/auth'); return; }

      onSnapshot(doc(db, 'users', user.uid), (snap) => setProfile(snap.data()));

      const qPending = query(collection(db, 'transactions'), where('buyer_id', '==', user.uid), where('status', '==', 'PENDING'));
      onSnapshot(qPending, (snap) => setNotificationCount(snap.docs.length));

      const txRef = doc(db, 'transactions', id as string);
      const unsub = onSnapshot(txRef, (snap) => {
        if (snap.exists()) setTx({ id: snap.id, ...snap.data() });
        setLoading(false);
      });
      return () => unsub();
    });
    return () => unsubAuth();
  }, [id, router]);

  if (loading || !tx) return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-navy/10 border-t-navy rounded-full animate-spin" />
    </div>
  );

  const config = STATUS_CONFIG[tx.status] || STATUS_CONFIG['PENDING'];
  const StatusIcon = config.icon;
  const isDone = tx.status === 'COLLECTED' || tx.status === 'COMPLETE';

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-5 pt-8 pb-4 flex items-center justify-between bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-navy/40 hover:text-navy transition-all active:scale-90">
            <ChevronLeft size={28} strokeWidth={2} />
          </button>
          <h2 className="text-[15px] font-bold text-navy">Order Details</h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => router.push('/activity')} className="relative p-2 text-navy/40">
            <Bell size={22} strokeWidth={2} />
            {notificationCount > 0 && (
              <div className="absolute top-1.5 right-1.5 bg-accent text-white text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-[#FDFDFD]">
                {notificationCount}
              </div>
            )}
          </button>
          <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-5">

        {/* ── IAN STATUS CARD ── big, clear, no ambiguity ── */}
        <div className={`rounded-2xl border p-5 ${config.bg}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-2 h-2 rounded-full ${config.dot}`} />
            <span className={`text-[11px] font-black uppercase tracking-widest ${config.color}`}>
              {config.label}
            </span>
          </div>
          <p className="text-[14px] text-navy font-medium">{config.description}</p>
        </div>

        {/* ── ITEM SUMMARY ── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <div className="flex items-center gap-4 mb-4">
            {tx.image_url ? (
              <img src={tx.image_url} className="w-16 h-16 rounded-2xl object-cover border border-slate-100" alt={tx.title} />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <ShoppingBag size={24} className="text-slate-300" />
              </div>
            )}
            <div>
              <h2 className="text-[18px] font-bold text-navy leading-tight">{tx.title}</h2>
              <p className="text-[20px] font-black text-navy mt-1">RM {Number(tx.price).toFixed(2)}</p>
            </div>
          </div>

          {/* Ian metadata */}
          <div className="space-y-2 pt-4 border-t border-slate-50">
            <div className="flex justify-between">
              <span className="text-[12px] font-bold text-slate-400">Order code</span>
              <span className="font-mono text-[12px] font-black text-navy">{tx.order_code || tx.claim_token || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] font-bold text-slate-400">Delivery</span>
              <span className="text-[12px] font-bold text-navy">
                {tx.delivery_type === 'RUNNER' ? 'Runner delivery' : 'Self collect'}
              </span>
            </div>
            {tx.drop_off_location && (
              <div className="flex justify-between">
                <span className="text-[12px] font-bold text-slate-400">Drop-off</span>
                <span className="text-[12px] font-bold text-navy">{tx.drop_off_location}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[12px] font-bold text-slate-400">Seller</span>
              <span className="text-[12px] font-bold text-navy">{tx.seller_name || 'Verified seller'}</span>
            </div>
          </div>
        </div>

        {/* ── IAN TIMELINE ── */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-5">Progress</p>
          <OrderTimeline status={tx.status} deliveryType={tx.delivery_type || 'SELF_COLLECT'} />
        </div>

        {/* ── BUYER ACTION: SCAN TO CONFIRM ── only for self-collect pending orders ── */}
        <AnimatePresence>
          {isBuyer && tx.status === 'PENDING' && tx.delivery_type !== 'RUNNER' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-[11px] font-bold text-slate-400 text-center">
                Ready to collect? Scan the seller's QR code to confirm.
              </p>
              <motion.button
                whileTap={{ scale: 0.97, y: 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                onClick={() => router.push('/scanner')}
                className="w-full h-[58px] bg-navy text-white rounded-2xl font-bold text-[15px] flex items-center justify-center gap-3 shadow-xl shadow-navy/15"
              >
                <Camera size={20} />
                Scan QR to collect
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SELLER VIEW: show their QR code link ── */}
        <AnimatePresence>
          {isSeller && !isDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-navy rounded-2xl p-5 text-white text-center space-y-3"
            >
              <p className="text-[11px] font-black uppercase tracking-widest text-white/50">You're the seller</p>
              <p className="text-[15px] font-bold">Show your QR code to the buyer or runner for confirmation.</p>
              <p className="font-mono text-[20px] font-black text-white/80 tracking-widest">
                {tx.order_code || tx.claim_token}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DONE ── */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center space-y-2"
            >
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
              <p className="text-[16px] font-bold text-emerald-700">Order complete</p>
              <p className="text-[12px] text-emerald-600/70 font-medium">Thanks for using Pulse.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report */}
        <button className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 active:scale-95 transition-all">
          <AlertCircle size={14} />
          Report an issue
        </button>
      </div>
    </main>
  );
}
