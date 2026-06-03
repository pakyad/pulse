'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Package, ShoppingBag } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';


type HistoryFilter = 'All' | 'Completed' | 'Cancelled';
const FINAL = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'ARRIVED'];

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toUpperCase();
  if (s === 'CANCELLED')
    return <span className="text-[11px] font-bold text-red-400">{s.replace(/_/g, ' ')}</span>;
  return <span className="text-[11px] font-bold text-emerald-500">{s.replace(/_/g, ' ')}</span>;
}

function HistoryCard({ order, onClick }: { order: any; onClick: () => void }) {
  const dateStr = order.created_at?.toDate
    ? order.created_at.toDate().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const img = order.image_url || order.images?.[0];

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-100 rounded-xl p-4 space-y-3 cursor-pointer active:scale-[0.99] transition-all hover:bg-slate-50/50"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">
          {dateStr} · #{order.order_code || order.id.slice(0, 6).toUpperCase()}
        </p>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
          {img ? (
            <img src={img} className="w-full h-full object-cover" alt={order.title} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-200">
              <Package size={20} strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-slate-900 truncate">{order.title}</p>
          <p className="text-[11px] font-medium text-[#94a3b8]">{order.seller_name || 'Pulse Student'}</p>
        </div>
        <p className="text-[14px] font-bold text-slate-900 shrink-0">RM {Number(order.price).toFixed(2)}</p>
      </div>
    </div>
  );
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<HistoryFilter>('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) { router.push('/auth'); return; }
      const q = query(collection(db, 'orders'), where('buyer_id', '==', user.uid));
      return onSnapshot(q, (snap) => {
        const docs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((o: any) => FINAL.includes((o.status || '').toUpperCase()))
          .sort((a: any, b: any) => {
            const ta = a.created_at?.toMillis?.() ?? 0;
            const tb = b.created_at?.toMillis?.() ?? 0;
            return tb - ta;
          });
        setOrders(docs);
        setLoading(false);
      });
    });
    return () => unsub?.();
  }, [router]);

  const displayed = orders.filter((o: any) => {
    const s = (o.status || '').toUpperCase();
    if (filter === 'Completed') return ['DELIVERED', 'COMPLETED', 'ARRIVED'].includes(s);
    if (filter === 'Cancelled') return s === 'CANCELLED';
    return true;
  });

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[slate-900] rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <BackButton />
        <div>
          <p className="text-[14px] font-bold tracking-tight">Order History</p>
          <p className="text-[11px] font-medium text-[#94a3b8]">{orders.length} past {orders.length === 1 ? 'order' : 'orders'}</p>
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-5">

        {/* ── FILTER PILLS ── */}
        <div className="flex gap-2">
          {(['All', 'Completed', 'Cancelled'] as HistoryFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-[32px] px-4 rounded-full text-[12px] font-bold border-[0.5px] transition-all active:scale-95 ${
                filter === f
                  ? 'bg-slate-50 border-slate-400 text-slate-900'
                  : 'bg-slate-50/50 border-slate-900/10 text-[#94a3b8]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── LIST ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {displayed.length === 0 ? (
              <div className="py-28 flex flex-col items-center justify-center gap-4 text-[#94a3b8]">
                <ShoppingBag size={40} strokeWidth={1} className="text-slate-300" />
                <p className="text-[12px] font-bold uppercase tracking-widest opacity-40">No history yet</p>
              </div>
            ) : (
              displayed.map(order => (
                <HistoryCard
                  key={order.id}
                  order={order}
                  onClick={() => router.push(`/orders/${order.id}`)}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </main>
  );
}
