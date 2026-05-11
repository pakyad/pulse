"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, CheckCircle2, Package, Activity,
  Clock, ShieldCheck, MapPin, Receipt,
  ShieldAlert, Truck, Info
} from 'lucide-react';
import ReportIssueModal from '@/components/shared/ReportIssueModal';

// ── Order phases ──
const PHASES = [
  { id: 1, label: 'Order Placed', key: 'PENDING_VENDOR', icon: Package },
  { id: 2, label: 'Merchant Preparing', key: 'PREPARING', icon: Clock },
  { id: 3, label: 'Awaiting Runner', key: 'AWAITING_RUNNER', icon: Truck },
  { id: 4, label: 'Runner Picked Up', key: 'PICKED_UP', icon: Truck },
  { id: 5, label: 'In Transit', key: 'IN_TRANSIT', icon: Truck },
  { id: 6, label: 'Delivered', key: 'DELIVERED', icon: CheckCircle2 },
];

function getPhase(status: string): number {
  const s = status.toUpperCase();
  if (s === 'DELIVERED' || s === 'COMPLETED') return 6;
  if (['IN_TRANSIT', 'ON_THE_WAY', 'ARRIVED_AT_DESTINATION'].includes(s)) return 5;
  if (s === 'PICKED_UP') return 4;
  if (s === 'AWAITING_RUNNER') return 3;
  if (s === 'PREPARING') return 2;
  return 1;
}

function StatusPill({ status }: { status: string }) {
  const s = status?.toUpperCase() || '';
  const isDone = ['DELIVERED', 'COMPLETED'].includes(s);
  const isCancelled = s === 'CANCELLED';
  return (
    <span className={`flex items-center gap-1.5 text-[11px] font-bold ${isDone ? 'text-emerald-500' : isCancelled ? 'text-red-500' : 'text-amber-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-emerald-400' : isCancelled ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
      {s.replace(/_/g, ' ')}
    </span>
  );
}

export default function LiveOrderPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/auth'); return; }
      unsub = onSnapshot(doc(db, 'orders', id as string), (snap) => {
        if (snap.exists()) setOrder({ id: snap.id, ...snap.data() });
        setLoading(false);
      });
    });

    return () => { unsubAuth(); unsub?.(); };
  }, [id, router]);

  // ── Confirm receipt (existing logic preserved) ──
  const handleConfirmReceipt = async () => {
    if (!navigator.geolocation) { alert('Location services required.'); return; }
    setConfirmingReceipt(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const { functions } = await import('@/lib/firebase');
        const { httpsCallable } = await import('firebase/functions');
        const completeHandshake = httpsCallable(functions, 'completeHandshake');
        await completeHandshake({ orderId: id, role: 'buyer', coords });
        alert('Confirmed! Your order will update once the seller confirms.');
      } catch (e) {
        console.error(e);
        alert('Confirmation failed. Please try again.');
      } finally {
        setConfirmingReceipt(false);
      }
    }, () => {
      alert('Location access denied. Cannot confirm receipt.');
      setConfirmingReceipt(false);
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[#1e293b] rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
      <ShieldAlert size={40} className="text-slate-200" />
      <p className="text-[13px] font-bold text-[#94a3b8]">Order not found</p>
      <button onClick={() => router.push('/me/orders')} className="h-10 px-6 bg-[#1e293b] text-white rounded-xl text-[13px] font-bold">
        Back to Orders
      </button>
    </div>
  );

  const status = (order.status || 'PENDING').toUpperCase();
  const phase = getPhase(status);
  const isDone = phase === 6;
  const isCancelled = status === 'CANCELLED';
  const orderImg = order.images?.[0] || order.image_url;

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-36">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/me/orders')}
            className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-100 active:scale-95 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <p className="text-[14px] font-bold tracking-tight">Order Status</p>
            <p className="text-[11px] font-medium text-[#94a3b8]">
              #{order.order_code || order.id.slice(0, 6).toUpperCase()}
            </p>
          </div>
        </div>
        <StatusPill status={status} />
      </nav>

      <div className="pt-28 px-6 space-y-8">

        {/* ── ITEM SUMMARY ── */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0">
            {orderImg ? (
              <img src={orderImg} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-200">
                <Package size={20} strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-[#1e293b] truncate">{order.title}</p>
            <p className="text-[11px] font-medium text-[#94a3b8]">{order.seller_name || 'Pulse Student'}</p>
          </div>
          <p className="text-[14px] font-bold text-[#1e293b] shrink-0">RM {Number(order.price).toFixed(2)}</p>
        </div>

        {/* ── PROGRESS HERO ── */}
        <section>
          <div className="space-y-0.5 mb-4">
            <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">
              {isDone ? 'Delivered' : isCancelled ? 'Order Cancelled' : 'Tracking Progress'}
            </h2>
            <p className="text-[11px] font-medium text-[#94a3b8]">
              {isDone ? 'Your item has been delivered successfully.' : isCancelled ? 'This order was cancelled.' : 'Live update from the registry.'}
            </p>
          </div>

          {/* Phase progress bar */}
          <div className="flex gap-1 mb-6">
            {PHASES.map(p => (
              <motion.div
                key={p.id}
                className="h-1.5 flex-1 rounded-full"
                animate={{ backgroundColor: phase >= p.id ? (isDone ? '#10b981' : isCancelled ? '#ef4444' : '#1e293b') : '#f1f5f9' }}
                transition={{ duration: 0.4, delay: p.id * 0.05 }}
              />
            ))}
          </div>

          {/* Timeline */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100">
            {PHASES.map((p) => {
              const isPast = phase > p.id;
              const isCurrent = phase === p.id;
              const Icon = p.icon;
              return (
                <div key={p.id} className={`flex items-center gap-4 px-4 py-3.5 ${!isPast && !isCurrent ? 'opacity-30' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isPast ? 'bg-emerald-50 text-emerald-500' :
                    isCurrent ? 'bg-[#1e293b] text-white' :
                    'bg-slate-100 text-slate-300'
                  }`}>
                    {isPast ? <CheckCircle2 size={16} strokeWidth={2} /> : isCurrent ? <Activity size={14} className="animate-pulse" /> : <Icon size={14} />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-[13px] font-bold ${isCurrent ? 'text-[#1e293b]' : isPast ? 'text-[#94a3b8]' : 'text-slate-300'}`}>
                      {p.label}
                    </p>
                    {isCurrent && (
                      <p className="text-[11px] font-medium text-[#94a3b8]">Currently at this stage</p>
                    )}
                  </div>
                  {isPast && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── ORDER DETAILS ── */}
        <section className="space-y-3">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Order Details</h2>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100">
            {order.drop_off_location && (
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-[13px] font-medium text-[#94a3b8]">Drop-off</span>
                <span className="flex items-center gap-1.5 text-[13px] font-bold text-[#1e293b]">
                  <MapPin size={12} className="text-[#94a3b8]" />
                  {order.drop_off_location}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[13px] font-medium text-[#94a3b8]">Delivery</span>
              <span className="text-[13px] font-bold text-[#1e293b]">
                {order.delivery_type === 'RUNNER' ? 'Pulse Runner' : 'Self Collect'}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[13px] font-medium text-[#94a3b8]">Total Paid</span>
              <span className="text-[14px] font-bold text-[#1e293b]">RM {Number(order.price).toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* ── HANDSHAKE NOTICE ── */}
        <section className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
            <Info size={14} className="text-[#1e293b]" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[12px] font-bold text-[#1e293b]">Refund & Dispute Policy</p>
            <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed">
              If there is a problem, admin will verify GPS data from both parties. Refunds are processed within 24 hours if locations don't match.
            </p>
          </div>
        </section>

        {/* ── DISPUTE ── */}
        {!isDone && !isCancelled && (
          <section className="space-y-2">
            <button
              onClick={() => setIsReportOpen(true)}
              disabled={!order.handshake?.seller_confirmed}
              className="w-full h-12 border border-slate-100 text-[13px] font-bold text-[#94a3b8] rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-30"
            >
              <ShieldAlert size={16} />
              Report a Problem
            </button>
            {!order.handshake?.seller_confirmed && (
              <p className="text-[11px] font-medium text-[#94a3b8] text-center">
                Available after the seller initiates the delivery handshake.
              </p>
            )}
          </section>
        )}

      </div>

      {/* ── STICKY CONFIRM RECEIPT ── */}
      {!isDone && !isCancelled && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-100">
          <button
            onClick={handleConfirmReceipt}
            disabled={confirmingReceipt}
            className="w-full h-12 bg-[#1e293b] text-white rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-30 transition-all"
          >
            {confirmingReceipt ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <><CheckCircle2 size={18} /> I've Received My Order</>
            )}
          </button>
        </footer>
      )}

      <ReportIssueModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        order={order}
        onSuccess={() => setIsReportOpen(false)}
      />
    </main>
  );
}
