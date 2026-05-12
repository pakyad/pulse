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
  const [userId, setUserId] = useState<string>('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
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

  // ── Confirm receipt (existing logic preserved) ──
  const handleConfirmReceipt = async () => {
    if (!navigator.geolocation) { alert('Location services required.'); return; }
    setConfirmingReceipt(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        
        // Option B: Direct Firestore Write (Bypassing Undeployed Cloud Function)
        const orderRef = doc(db, "orders", id as string);
        const orderSnap = await getDoc(orderRef);
        
        if (!orderSnap.exists()) {
          alert("Order not found.");
          setConfirmingReceipt(false);
          return;
        }

        const orderData = orderSnap.data();
        const handshake = orderData.handshake || {};

        handshake.buyer_confirmed = true;
        handshake.buyer_coords = coords;

        let newStatus = orderData.status;

        // If seller already confirmed, we run the proximity check
        if (handshake.seller_confirmed && handshake.seller_coords) {
          const R = 6371e3; // metres
          const φ1 = handshake.seller_coords.lat * Math.PI/180;
          const φ2 = coords.lat * Math.PI/180;
          const Δφ = (coords.lat - handshake.seller_coords.lat) * Math.PI/180;
          const Δλ = (coords.lng - handshake.seller_coords.lng) * Math.PI/180;

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const dist = R * c;

          handshake.distance = dist;
          const isSafe = dist <= 50;
          handshake.verification_type = isSafe ? 'IN_PERSON_SAFE' : 'REMOTE';
          
          newStatus = isSafe ? 'COMPLETED' : 'DELIVERED';
        }

        const { serverTimestamp } = await import('firebase/firestore');

        await updateDoc(orderRef, { 
          handshake,
          ...(newStatus !== orderData.status ? { status: newStatus, completed_at: serverTimestamp(), auto_adjudicated: newStatus === 'COMPLETED' } : {})
        });

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
  const isPending = status === 'PENDING_VENDOR';
  const showReview = isDone && !order.isReviewed;
  const orderImg = order.images?.[0] || order.image_url;

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-36 relative">

      {/* ── FULL BLEED MAP HERO (MAX TOP) ── */}
      <div className="absolute top-0 left-0 right-0 h-[320px] bg-[#f2f2f7] z-0">
        <img 
          src={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? `https://maps.googleapis.com/maps/api/staticmap?size=800x600&scale=2&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0x9c9c9c&style=feature:all|element:labels.text.stroke|color:0xffffff&style=feature:landscape|color:0xf2f2f7&style=feature:poi|visibility:off&style=feature:road|color:0xffffff&style=feature:water|color:0xe5e5ea&center=3.1597,101.7000&zoom=16&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}` : '/map-bg.png'}
          className="w-full h-full object-cover mix-blend-darken"
          alt="Live Route Map"
          onError={(e) => { e.currentTarget.src = '/map-bg.png'; }}
        />
        
        {/* Transparent Glass Overlay (Logistics Data) */}
        <div className="absolute bottom-6 left-6 z-20 w-[240px]">
          <div className="bg-transparent p-1">
            <div className="relative pl-5">
              <div className="absolute left-[5px] top-1.5 bottom-1.5 w-[1.5px] bg-[#1e293b]/20"></div>
              
              <div className="mb-4 relative">
                <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-white border-[2.5px] border-[#1e293b] shadow-sm"></div>
                <p className="text-[9px] font-black text-[#64748b] uppercase tracking-widest mb-0.5 leading-none drop-shadow-sm">Take from</p>
                <p className="text-[13px] font-bold text-[#1e293b] leading-tight truncate drop-shadow-sm">{order.seller_name || 'Pulse Merchant'}</p>
                <p className="text-[11px] font-bold text-[#64748b] mt-0.5 truncate drop-shadow-sm">{order.pickup_location || 'Student Hub Cafe, Lvl 2'}</p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-white border-[2.5px] border-teal-500 shadow-sm"></div>
                <p className="text-[9px] font-black text-[#64748b] uppercase tracking-widest mb-0.5 leading-none drop-shadow-sm">Deliver to</p>
                <p className="text-[13px] font-bold text-[#1e293b] leading-tight truncate drop-shadow-sm">{order.buyer_name || 'You'}</p>
                <p className="text-[11px] font-bold text-[#64748b] mt-0.5 truncate drop-shadow-sm">{order.drop_off_location || 'Block K — Library Foyer'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── NAV (Floating Over Map) ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-start justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => router.push('/marketplace')}
            className="w-10 h-10 rounded-[14px] bg-white/90 backdrop-blur-md flex items-center justify-center text-[#1e293b] border border-white shadow-sm active:scale-95 transition-all"
          >
            <ChevronLeft size={18} strokeWidth={2.5} />
          </button>
          <div className="px-3 py-1.5 rounded-[12px] bg-white/80 backdrop-blur-md border border-white shadow-sm">
            <p className="text-[13px] font-black tracking-tight text-[#1e293b] leading-tight drop-shadow-sm">Order Status</p>
            <p className="text-[10px] font-bold text-[#64748b] leading-tight drop-shadow-sm">
              #{order.order_code || order.id.slice(0, 6).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md px-3 py-2 rounded-[12px] border border-white shadow-sm pointer-events-auto">
          <StatusPill status={status} />
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div className="pt-[340px] px-6 space-y-8 relative z-10">

        {/* ── PROGRESS HERO (New Order Tracker) ── */}
        <section>
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
            <p className="text-[12px] font-bold text-[#1e293b]">Refund & Dispute Policy</p>
            <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed">
              If there is a problem, admin will verify GPS data from both parties. Refunds are processed within 24 hours if locations don't match.
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

        {/* ── DISPUTE ── */}
        {!isDone && !isCancelled && !isPending && (
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
