"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { ChevronLeft, MapPin, Package, Camera, CheckCircle2, Clock, Truck, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Ian Step Indicator ──
// Ian: precise, numbered steps. No ambiguity about what to do next.
function StepRow({
  step, label, sublabel, done, active,
}: {
  step: number; label: string; sublabel: string; done: boolean; active: boolean;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[12px] transition-all ${
          done ? 'bg-emerald-500 text-white' : active ? 'bg-navy text-white' : 'bg-slate-100 text-slate-400'
        }`}>
          {done ? <CheckCircle2 size={16} /> : step}
        </div>
        {step < 2 && (
          <div className={`w-0.5 h-8 mt-1 rounded-full ${done ? 'bg-emerald-200' : 'bg-slate-100'}`} />
        )}
      </div>
      <div className="pt-1 flex-1">
        <p className={`text-[14px] font-bold leading-none ${active ? 'text-navy' : done ? 'text-slate-400' : 'text-slate-300'}`}>{label}</p>
        <p className={`text-[12px] font-medium mt-1 leading-relaxed ${active ? 'text-slate-500' : 'text-slate-300'}`}>{sublabel}</p>
      </div>
    </div>
  );
}

export default function RunnerActivePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) { router.push('/auth'); return; }

      // Real-time order sync
      const unsub = onSnapshot(doc(db, 'transactions', orderId), (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      });

      return () => unsub();
    });

    return () => unsubAuth();
  }, [orderId, router]);

  if (loading) return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-navy/10 border-t-navy rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center gap-4">
      <Package size={48} className="text-slate-200" />
      <p className="text-[14px] font-bold text-slate-400">Delivery not found</p>
      <button onClick={() => router.back()} className="text-[13px] font-bold text-accent">Go back</button>
    </div>
  );

  // If order is already done, show completion
  const isDone = order.status === 'COLLECTED' || order.status === 'COMPLETE';
  // Step 1 = pick up from seller (scanner confirms pickup)
  // Step 2 = deliver to buyer (buyer scans to confirm receipt)
  const isPickedUp = order.status === 'ON_THE_WAY' && order.picked_up_at;

  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans antialiased text-navy pb-32">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-5 pt-8 pb-4 flex items-center gap-3 bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50">
        <button onClick={() => router.push('/run')} className="p-2 -ml-2 text-navy/40 hover:text-navy transition-all active:scale-90">
          <ChevronLeft size={28} strokeWidth={2} />
        </button>
        <h2 className="text-[15px] font-bold text-navy">Active Delivery</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live</span>
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-6">

        {/* ── DONE STATE ── */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500 rounded-3xl p-8 text-white text-center space-y-3"
            >
              <CheckCircle2 size={40} className="mx-auto" />
              <h2 className="text-[22px] font-bold">Delivery complete!</h2>
              <p className="text-[13px] text-white/70 font-medium">
                You earned RM {(Number(order.price || 0) * 0.15).toFixed(2)} for this run.
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/run')}
                className="mt-2 w-full h-12 bg-white/20 rounded-2xl text-white font-bold text-[14px]"
              >
                Back to deliveries
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {!isDone && (
          <>
            {/* ── IAN ORDER SUMMARY CARD ── */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Your delivery</span>
                <span className="font-mono text-[9px] text-slate-300">#{order.id?.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className="flex items-center gap-3">
                {order.image_url ? (
                  <img src={order.image_url} className="w-14 h-14 rounded-2xl object-cover border border-slate-100" alt={order.title} />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Package size={22} className="text-slate-300" />
                  </div>
                )}
                <div>
                  <h3 className="text-[16px] font-bold text-navy leading-tight">{order.title}</h3>
                  <p className="text-[12px] text-slate-400 font-medium">RM {Number(order.price).toFixed(2)}</p>
                </div>
              </div>

              {/* Earn amount — Ian: specific, not vague */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <span className="text-[11px] font-bold text-slate-400">Your earnings</span>
                <span className="text-[16px] font-black text-emerald-600">
                  + RM {(Number(order.price || 0) * 0.15).toFixed(2)}
                </span>
              </div>
            </div>

            {/* ── IAN STEP-BY-STEP GUIDE ── */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-5">What to do</p>

              <div className="space-y-0">
                <StepRow
                  step={1}
                  label="Pick up from seller"
                  sublabel={`Contact ${order.seller_name || 'the seller'} and collect the item. Scan their QR code to confirm pickup.`}
                  done={!!isPickedUp}
                  active={!isPickedUp}
                />
                <StepRow
                  step={2}
                  label={`Deliver to ${order.buyer_name || 'buyer'}`}
                  sublabel={order.drop_off_location ? `Bring it to: ${order.drop_off_location}` : 'Deliver to buyer's chosen location.'}
                  done={false}
                  active={!!isPickedUp}
                />
              </div>
            </div>

            {/* ── DROP-OFF LOCATION CARD ── */}
            {order.drop_off_location && (
              <div className="bg-white border border-slate-100 border-l-4 border-l-accent rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <MapPin size={18} className="text-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drop-off point</p>
                  <p className="text-[15px] font-bold text-navy">{order.drop_off_location}</p>
                </div>
              </div>
            )}

            {/* ── BUYER INFO ── */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <User size={18} className="text-slate-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buyer</p>
                <p className="text-[14px] font-bold text-navy">{order.buyer_name || 'Student'}</p>
              </div>
            </div>

            {/* ── SCAN CTA ── Josh spring physics on the button ── */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97, y: 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
              onClick={() => router.push('/scanner')}
              className="w-full h-[60px] bg-navy text-white rounded-2xl font-bold text-[15px] flex items-center justify-center gap-3 shadow-xl shadow-navy/15"
            >
              <Camera size={20} />
              Scan QR to confirm
            </motion.button>

            <p className="text-center text-[11px] text-slate-300 font-medium">
              Seller will show you their QR code to confirm pickup
            </p>
          </>
        )}
      </div>
    </main>
  );
}
