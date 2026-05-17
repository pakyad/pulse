"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Check, ArrowRight, ShieldCheck, Package, X } from 'lucide-react';

function OrderSuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { router.push('/marketplace'); return; }

    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/auth'); return; }
      try {
        const snap = await getDoc(doc(db, 'parent_orders', orderId));
        if (snap.exists()) setOrder(snap.data());
      } catch (e) {
        console.error('[Success Load]', e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [orderId, router]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[#1e293b] rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased flex flex-col px-6 pt-20 pb-16">

      {/* ── TOP NAV EXIT ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl">
        <div />
        <button 
          onClick={() => router.push('/marketplace')}
          className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#94a3b8] active:scale-95 transition-all"
        >
          <X size={20} />
        </button>
      </nav>

      {/* ── SUCCESS HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center text-center mb-10"
      >
        <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center mb-6">
          <Check size={36} className="text-emerald-500" strokeWidth={2.5} />
        </div>
        <h1 className="text-[24px] font-bold text-[#1e293b] tracking-tight leading-tight mb-1">Order Placed</h1>
        <p className="text-[13px] font-medium text-[#94a3b8]">
          Your payment is being verified by the seller.
        </p>
      </motion.div>

      {/* ── ORDER CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100 mb-8"
      >
        <div className="px-4 py-3.5 flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#94a3b8]">Order ID</span>
          <span className="text-[13px] font-bold text-[#1e293b]">#{orderId?.slice(0, 8).toUpperCase()}</span>
        </div>

        {order?.items_summary && (
          <div className="px-4 py-3.5 flex items-center justify-between gap-4">
            <span className="text-[13px] font-medium text-[#94a3b8] shrink-0">Item</span>
            <span className="text-[13px] font-bold text-[#1e293b] text-right truncate">{order.items_summary}</span>
          </div>
        )}

        <div className="px-4 py-3.5 flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#94a3b8]">Total Paid</span>
          <span className="text-[14px] font-bold text-[#1e293b]">RM{Number(order?.total_price || 0).toFixed(2)}</span>
        </div>

        <div className="px-4 py-3.5 flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#94a3b8]">Status</span>
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-amber-500">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            Pending Confirmation
          </span>
        </div>
      </motion.div>

      {/* ── WHAT HAPPENS NEXT ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3 mb-10"
      >
        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
          <ShieldCheck size={14} className="text-[#1e293b]" />
        </div>
        <div className="space-y-0.5">
          <p className="text-[12px] font-bold text-[#1e293b]">What happens next?</p>
          <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed">
            The seller will verify your receipt and confirm your order. You can track the delivery status live in My Orders.
          </p>
        </div>
      </motion.div>

      {/* ── ACTIONS ── */}
      <div className="space-y-3 mt-auto">
        <button
          onClick={() => router.push('/me/orders')}
          className="w-full h-12 bg-[#1e293b] text-white rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          Track My Order <ArrowRight size={16} />
        </button>
        <button
          onClick={() => router.push('/marketplace')}
          className="w-full h-12 border border-slate-100 text-[#94a3b8] font-bold text-[13px] tracking-tight rounded-xl active:scale-[0.98] transition-all"
        >
          Back to Marketplace
        </button>
      </div>

    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[#1e293b] rounded-full animate-spin" />
      </div>
    }>
      <OrderSuccessPageContent />
    </Suspense>
  );
}
