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
  ShieldAlert, Truck, Info, XCircle, Star
} from 'lucide-react';
import ReportIssueModal from '@/components/shared/ReportIssueModal';
import PostDeliveryReview from '@/components/marketplace/PostDeliveryReview';
import OrderTracker from '@/components/shared/OrderTracker';

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
      'bg-indigo-50 border-indigo-100 text-[#6366f1]'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        isDone ? 'bg-emerald-500' : 
        isCancelled ? 'bg-red-500' : 
        'bg-[#6366f1] animate-pulse'
      }`} />
      <span className="text-[11px] font-black uppercase tracking-widest">{s.replace(/_/g, ' ')}</span>
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
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    setCancelling(true);
    try {
      await updateDoc(doc(db, 'orders', id as string), {
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancelled_by: 'buyer',
      });
    } catch (e) {
      console.error('[Cancel]', e);
      alert('Could not cancel order. Please try again.');
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
      const timer = setTimeout(() => {
        setShowSuccessOverlay(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [order?.status, order?.hasAcknowledgedSuccess]);

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
      <button onClick={() => router.push('/me/orders')} className="h-12 px-8 bg-[#1e293b] text-white rounded-xl text-[13px] font-bold shadow-lg shadow-slate-900/10 active:scale-95 transition-all">
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

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-36 relative">

      {/* ── VIBRANT MAP HERO ── */}
      <div className="absolute top-0 left-0 right-0 h-[380px] z-0 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-[#6366f1]/10 to-white z-10" />
        <img 
          src={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? `https://maps.googleapis.com/maps/api/staticmap?size=800x600&scale=2&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x9c9c9c&style=feature:all|element:labels.text.stroke|color:0xffffff&style=feature:landscape|color:0xf2f2f7&style=feature:poi|visibility:off&style=feature:road|color:0xffffff&style=feature:water|color:0xe5e5ea&center=3.1597,101.7000&zoom=16&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}` : '/map-bg.png'}
          className="w-full h-full object-cover grayscale-[0.2] saturate-[1.2]"
          alt="Live Route Map"
        />
        
        {/* Logistics Data Card (Glassmorphic) */}
        <div className="absolute bottom-12 left-6 z-20">
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-white shadow-xl shadow-indigo-900/5 space-y-4 w-[280px]">
             <div className="relative pl-6 space-y-5">
               <div className="absolute left-[7px] top-2 bottom-2 w-[1.5px] bg-linear-to-b from-[#6366f1] to-emerald-500 opacity-20" />
               
               <div className="relative">
                 <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-white border-[2.5px] border-[#6366f1] shadow-sm" />
                 <p className="text-[9px] font-black text-[#6366f1] uppercase tracking-widest leading-none mb-1">Pick up</p>
                 <p className="text-[13px] font-bold text-[#1e293b] leading-tight truncate">{order.seller_name || 'Merchant'}</p>
                 <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">{order.pickup_location || 'Campus Shop'}</p>
               </div>
               
               <div className="relative">
                 <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-white border-[2.5px] border-emerald-500 shadow-sm" />
                 <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Meet at</p>
                 <p className="text-[13px] font-bold text-[#1e293b] leading-tight truncate">{order.buyer_name || 'You'}</p>
                 <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">{order.drop_off_location || 'Main Lobby'}</p>
                 {(order.floorLevel || order.roomNumber) && (
                   <span className="ml-1 text-[#1e293b] font-bold">
                     ({order.floorLevel ? `${order.floorLevel}` : ''}
                     {order.floorLevel && order.roomNumber ? ', ' : ''}
                     {order.roomNumber ? `${order.roomNumber}` : ''})
                   </span>
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* ── FLOATING NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-6 flex items-start justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => router.push('/marketplace')}
            className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-md flex items-center justify-center text-[#1e293b] border border-white shadow-lg shadow-slate-900/5 active:scale-95 transition-all"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white shadow-lg shadow-slate-900/5">
            <p className="text-[13px] font-bold text-[#1e293b]">Order Details</p>
            <p className="text-[10px] font-bold text-[#64748b]">#{order.order_code || order.id.slice(0, 6).toUpperCase()}</p>
          </div>
        </div>
        <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white shadow-lg shadow-slate-900/5 pointer-events-auto">
          <StatusPill status={status} />
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div className="pt-[420px] px-6 space-y-10 relative z-10">

        {/* ── PROGRESS VIBRANCY ── */}
        <section className="bg-white/50 backdrop-blur-sm p-4 rounded-[32px] border border-slate-50">
          <OrderTracker order={order} />
        </section>

        {/* ── PAYMENT RECEIPT ── */}
        <section className="space-y-3">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Payment Receipt</h2>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100">
            {/* Item Summary */}
            <div className="flex items-start justify-between px-4 py-3.5">
              <span className="text-[13px] font-medium text-[#94a3b8] shrink-0">Items</span>
              <div className="text-right pl-4">
                {order.items?.length > 0 ? (
                  order.items.map((it: any, i: number) => (
                    <p key={i} className="text-[13px] font-bold text-[#1e293b]">{it.qty}x {it.title}</p>
                  ))
                ) : (
                  <p className="text-[13px] font-bold text-[#1e293b]">1x {order.title || 'Pulse Order'}</p>
                )}
              </div>
            </div>

            {/* Transaction Metadata */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[13px] font-medium text-[#94a3b8]">Payment Method</span>
              <span className="text-[13px] font-bold text-[#1e293b]">FPX Online Banking</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[13px] font-medium text-[#94a3b8]">Order Time</span>
              <span className="text-[13px] font-bold text-[#1e293b]">
                {order.created_at?.toDate 
                  ? order.created_at.toDate().toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
                  : new Date(order.created_at || Date.now()).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            
            {/* Price Breakdown */}
            <div className="px-4 py-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[#94a3b8]">Subtotal</span>
                <span className="text-[13px] font-bold text-[#1e293b]">RM {Number(order.price || 0).toFixed(2)}</span>
              </div>
              {order.delivery_type === 'RUNNER' && (
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#94a3b8]">Runner Fee</span>
                  <span className="text-[13px] font-bold text-[#1e293b]">RM {Number((order.total || order.price) - order.price).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Total Paid */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-slate-100/50 rounded-b-xl">
              <span className="text-[13px] font-bold text-[#1e293b]">Total Paid</span>
              <span className="text-[15px] font-black text-[#1e293b]">RM {Number(order.total || order.price).toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* ── HANDSHAKE NOTICE ── */}
        <section className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
            <Info size={14} className="text-[#1e293b]" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[12px] font-bold text-[#1e293b]">Help & Returns</p>
            <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed">
              If there is a problem, our team will check the delivery data. We process returns within 24 hours.
            </p>
          </div>
        </section>

        {/* ── CANCEL ORDER (Pending only) ── */}
        {isPending && (
          <section>
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="w-full h-12 border border-red-100 text-[13px] font-bold text-red-400 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-30"
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
               <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1] shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
               <h3 className="text-[11px] font-black text-[#6366f1] uppercase tracking-widest">Support & Resolution</h3>
            </div>
            
            <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-4">
               <div className="space-y-1">
                  <p className="text-[14px] font-bold text-[#1e293b]">Need help?</p>
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                     You can report any issues within 24 hours after your order arrives.
                  </p>
               </div>
               
               <button
                 onClick={() => setIsReportOpen(true)}
                 disabled={!order.handshake?.seller_confirmed && !isDone}
                 className="w-full h-14 bg-white border border-slate-100 text-[13px] font-bold text-[#1e293b] rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-sm disabled:opacity-30"
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
              <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Rate Your Experience</h2>
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
            className="w-full h-14 bg-white border border-slate-100 text-[#94a3b8] rounded-2xl font-bold text-[12px] uppercase tracking-[0.2em] hover:text-[#1e293b] hover:border-[#1e293b] transition-all active:scale-95"
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
              className="bg-white p-12 rounded-[40px] shadow-[0_32px_80px_-16px_rgba(99,102,241,0.15)] border border-slate-50 text-center space-y-8 max-w-xs"
            >
              <div className="relative inline-block">
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-emerald-500 blur-3xl rounded-full"
                />
                <div className="w-20 h-20 bg-emerald-500 rounded-[28px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 relative z-10 text-white">
                  <CheckCircle2 size={32} strokeWidth={2.5} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-[28px] font-black tracking-tight text-[#1e293b] leading-none">Delivered!</h1>
                <p className="text-[12px] text-slate-400 font-medium leading-relaxed">Your order is complete.<br/>Enjoy your item!</p>
              </div>
            </motion.div>
          </motion.div>
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
