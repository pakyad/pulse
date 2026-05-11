"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingBag, Package } from 'lucide-react';

type Tab = 'Active' | 'History';
type HistoryFilter = 'All' | 'Completed' | 'Cancelled';

const FINAL = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'ARRIVED'];

function StatusDot({ status }: { status: string }) {
  const s = status?.toUpperCase() || '';
  if (s === 'CANCELLED') return <span className="text-[11px] font-bold text-red-500">{s.replace(/_/g, ' ')}</span>;
  if (FINAL.includes(s)) return <span className="text-[11px] font-bold text-emerald-500">{s.replace(/_/g, ' ')}</span>;
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500">
      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
      {s.replace(/_/g, ' ')}
    </span>
  );
}

function OrderCard({ order, onClick }: { order: any; onClick: () => void }) {
  const dateStr = order.created_at?.toDate
    ? order.created_at.toDate().toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
    : '—';
  const img = order.image_url || order.images?.[0];

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-100 rounded-xl p-4 space-y-3 cursor-pointer active:scale-[0.99] transition-all hover:bg-slate-50/50"
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">
          {dateStr} · #{order.order_code || order.id.slice(0, 6).toUpperCase()}
        </p>
        <StatusDot status={order.status} />
      </div>

      {/* Content row */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
          {img ? <img src={img} className="w-full h-full object-cover" /> : (
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
    </div>
  );
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Active');
  const [histFilter, setHistFilter] = useState<HistoryFilter>('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) { router.push('/auth'); return; }

      onSnapshot(doc(db, 'users', user.uid), (snap) => {
        const userData = snap.data();
        setProfile({ ...userData, uid: user.uid });

        const field = userData?.role === 'CLUB' ? 'seller_id' : 'buyer_id';
        const q = query(collection(db, 'orders'), where(field, '==', user.uid));

        onSnapshot(q, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          docs.sort((a: any, b: any) => {
            const ta = a.created_at?.toMillis?.() ?? new Date(a.created_at).getTime();
            const tb = b.created_at?.toMillis?.() ?? new Date(b.created_at).getTime();
            return (tb || 0) - (ta || 0);
          });
          setOrders(docs);
          setLoading(false);
        });
      });
    });

    return () => unsubAuth();
  }, [router]);

  const activeOrders = orders.filter(o => !FINAL.includes((o.status || '').toUpperCase()));
  const historyOrders = orders.filter(o => {
    const s = (o.status || '').toUpperCase();
    if (!FINAL.includes(s)) return false;
    if (histFilter === 'Completed') return ['DELIVERED', 'COMPLETED', 'ARRIVED'].includes(s);
    if (histFilter === 'Cancelled') return s === 'CANCELLED';
    return true;
  });

  const displayed = tab === 'Active' ? activeOrders : historyOrders;

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[#1e293b] rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-24">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <button
          onClick={() => router.push(profile?.role === 'CLUB' ? '/merchant' : '/me')}
          className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-100 active:scale-95 transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <p className="text-[14px] font-bold tracking-tight">
            {profile?.role === 'CLUB' ? 'Sales Registry' : 'My Orders'}
          </p>
          <p className="text-[11px] font-medium text-[#94a3b8]">
            {activeOrders.length} active
          </p>
        </div>
      </nav>

      {/* ── TABS ── */}
      <div className="fixed top-[68px] left-0 right-0 z-50 bg-white border-b border-slate-100 px-6 flex gap-6">
        {(['Active', 'History'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative py-4 text-[13px] font-bold transition-colors"
            style={{ color: tab === t ? '#1e293b' : '#94a3b8' }}
          >
            {t}
            {tab === t && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1e293b] rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="pt-36 px-6 space-y-6">

        {/* History sub-filters */}
        <AnimatePresence>
          {tab === 'History' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pb-2">
                {(['All', 'Completed', 'Cancelled'] as HistoryFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setHistFilter(f)}
                    className={`h-[32px] px-4 rounded-full text-[12px] font-bold border-[0.5px] transition-all active:scale-95 ${
                      histFilter === f
                        ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-sm'
                        : 'bg-slate-50/50 border-slate-900/10 text-[#94a3b8]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orders list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab + histFilter}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {displayed.length === 0 ? (
              <div className="py-28 flex flex-col items-center justify-center gap-4 text-[#94a3b8]">
                <ShoppingBag size={40} strokeWidth={1} className="opacity-30" />
                <p className="text-[12px] font-bold uppercase tracking-widest opacity-40">
                  {tab === 'Active' ? 'No active orders' : 'No history yet'}
                </p>
              </div>
            ) : (
              displayed.map(order => (
                <OrderCard
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
