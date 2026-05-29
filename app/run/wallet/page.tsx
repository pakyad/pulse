'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { ChevronLeft, Package, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RunnerEarningsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) { router.push('/auth'); return; }

      onSnapshot(doc(db, 'users', user.uid), (s) => setProfile(s.data()));

      // All completed deliveries for this runner
      const q = query(
        collection(db, 'orders'),
        where('runner_id', '==', user.uid),
        where('status', 'in', ['DELIVERED', 'COMPLETED'])
      );

      onSnapshot(q, (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a: any, b: any) => {
          const ta = a.created_at?.toMillis?.() ?? 0;
          const tb = b.created_at?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setDeliveries(docs);
        setLoading(false);
      });
    });

    return () => unsubAuth();
  }, [router]);

  // ── Derived stats ──
  const now = new Date();
  const thisMonthDeliveries = deliveries.filter(d => {
    const dt = d.created_at?.toDate?.() ?? new Date(d.created_at);
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  });

  const totalEarned = deliveries.reduce((sum, d) => sum + (Number(d.runner_fee) || 3.50), 0);
  const monthEarned = thisMonthDeliveries.reduce((sum, d) => sum + (Number(d.runner_fee) || 3.50), 0);
  const avgPerJob = deliveries.length > 0 ? totalEarned / deliveries.length : 0;

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[#000000] rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-[#000000] antialiased pb-24">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <button
          onClick={() => router.push('/run')}
          className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-100 active:scale-95 transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <p className="text-[14px] font-bold tracking-tight">Earnings</p>
          <p className="text-[11px] font-medium text-[#94a3b8]">Your delivery summary</p>
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-8">

        {/* ── HERO STAT ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 rounded-xl p-6 space-y-2"
        >
          <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">This Month</p>
          <p className="text-[38px] font-bold text-white tracking-tighter leading-none">
            RM {monthEarned.toFixed(2)}
          </p>
          <p className="text-[12px] font-medium text-white/50">
            {thisMonthDeliveries.length} deliveries completed
          </p>
        </motion.div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
            <p className="text-[11px] font-medium text-[#94a3b8]">All-time deliveries</p>
            <p className="text-[22px] font-bold text-[#000000] tracking-tight">{deliveries.length}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1">
            <p className="text-[11px] font-medium text-[#94a3b8]">Average per job</p>
            <p className="text-[22px] font-bold text-[#000000] tracking-tight">RM {avgPerJob.toFixed(2)}</p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1 col-span-2">
            <p className="text-[11px] font-medium text-[#94a3b8]">All-time earned</p>
            <p className="text-[22px] font-bold text-[#000000] tracking-tight">RM {totalEarned.toFixed(2)}</p>
          </div>
        </div>

        {/* ── DELIVERY HISTORY ── */}
        <section className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">Recent Deliveries</h2>
            <p className="text-[11px] font-medium text-[#94a3b8]">All your completed jobs</p>
          </div>

          {deliveries.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-[#94a3b8]">
              <TrendingUp size={36} strokeWidth={1} className="opacity-30" />
              <p className="text-[12px] font-bold uppercase tracking-widest opacity-40">No deliveries yet</p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100">
              {deliveries.map((delivery) => {
                const fee = Number(delivery.runner_fee) || 3.50;
                const dateStr = delivery.created_at?.toDate
                  ? delivery.created_at.toDate().toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
                  : '—';
                const img = delivery.images?.[0] || delivery.image_url;

                return (
                  <div key={delivery.id} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0">
                      {img ? <img src={img} className="w-full h-full object-cover" alt="" /> : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={14} className="text-slate-200" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#000000] truncate">{delivery.title || 'Delivery'}</p>
                      <p className="text-[11px] font-medium text-[#94a3b8]">
                        {delivery.drop_off_location || 'On campus'} · {dateStr}
                      </p>
                    </div>
                    <span className="text-[13px] font-bold text-emerald-500 shrink-0">+RM {fee.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
