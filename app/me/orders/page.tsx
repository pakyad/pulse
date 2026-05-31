"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ShoppingBag } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';


type Tab = 'Active' | 'History';
type HistoryFilter = 'All' | 'Completed' | 'Cancelled';

const FINAL = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'ARRIVED'];

function StatusPill({ status }: { status: string }) {
  const s = (status || '').toUpperCase();
  if (s === 'CANCELLED')
    return <span className="flex items-center gap-1 text-[11px] font-bold text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-300" />Cancelled</span>;
  if (FINAL.includes(s))
    return <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Completed</span>;
  return (
    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      {s.replace(/_/g, ' ').replace(/\b\w/g, c => c)}
    </span>
  );
}

function OrderRow({ order, onClick }: { order: any; onClick: () => void }) {
  const dateStr = order.created_at?.toDate
    ? order.created_at.toDate().toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
    : '—';
  const code = `#${(order.order_code || order.id.slice(0, 6)).toUpperCase()}`;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-4 px-2 -mx-2 rounded-xl text-left group hover:bg-slate-50 active:scale-[0.98] transition-all"
    >
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[14px] font-bold text-[#000000] truncate leading-snug">{order.title}</p>
        <p className="text-[11px] font-medium text-[#94a3b8] mt-0.5">{dateStr} · {code}</p>
      </div>
      <div className="shrink-0 text-right space-y-1">
        <p className="text-[14px] font-bold text-[#000000]">RM {Number(order.price).toFixed(2)}</p>
        <StatusPill status={order.status} />
      </div>
    </button>
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
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[#000000] rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-[#000000] antialiased pb-40">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <BackButton fallback="/marketplace" />
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
            style={{ color: tab === t ? '#000000' : '#94a3b8' }}
          >
            {t}
            {tab === t && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="pt-[130px] px-6">

        {/* History sub-filters */}
        <AnimatePresence>
          {tab === 'History' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pb-4">
                {(['All', 'Completed', 'Cancelled'] as HistoryFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setHistFilter(f)}
                    className={`h-[30px] px-3.5 rounded-full text-[12px] font-bold border-[0.5px] transition-all active:scale-95 ${
                      histFilter === f
                        ? 'bg-slate-50 border-slate-400 text-[#000000]'
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
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="divide-y divide-slate-100"
          >
            {displayed.length === 0 ? (
              <div className="py-28 flex flex-col items-center justify-center gap-4 text-[#94a3b8]">
                <ShoppingBag size={40} strokeWidth={1} className="text-slate-300" />
                <p className="text-[12px] font-bold uppercase tracking-widest opacity-40">
                  {tab === 'Active' ? 'No active orders' : 'No history yet'}
                </p>
              </div>
            ) : (
              displayed.map(order => (
                <OrderRow
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
