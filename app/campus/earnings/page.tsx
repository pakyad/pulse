"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

export default function InsightsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [totalEarned, setTotalEarned] = useState(0);
  const [itemsSold, setItemsSold] = useState(0);
  const [activeListings, setActiveListings] = useState(0);
  const [trustRating, setTrustRating] = useState<number | null>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) { router.replace('/auth'); return; }
      setUserId(user.uid);

      // Live trust rating
      const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        const data = snap.data();
        if (data) setTrustRating(data.trustRating ?? null);
      });

      // Live orders where seller
      const unsubOrders = onSnapshot(
        query(collection(db, 'orders'), where('seller_id', '==', user.uid)),
        (snap) => {
          let earned = 0;
          let sold = 0;
          const sales: any[] = [];
          snap.forEach((d) => {
            const data = d.data();
            if ((data.status || '').toUpperCase() === 'DELIVERED') {
              earned += Number(data.total || data.price || 0);
              sold++;
              sales.push({ id: d.id, ...data });
            }
          });
          sales.sort((a, b) => {
            const ta = a.created_at?.toMillis?.() ?? new Date(a.created_at || 0).getTime();
            const tb = b.created_at?.toMillis?.() ?? new Date(b.created_at || 0).getTime();
            return tb - ta;
          });
          setTotalEarned(earned);
          setItemsSold(sold);
          setRecentSales(sales.slice(0, 5));
          setLoading(false);
        }
      );

      // Live active listings count
      const unsubItems = onSnapshot(
        query(collection(db, 'items'), where('seller_id', '==', user.uid), where('status', '==', 'ACTIVE')),
        (snap) => {
          setActiveListings(snap.size);
        }
      );

      return () => {
        unsubUser();
        unsubOrders();
        unsubItems();
      };
    });

    return () => unsubAuth();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-20 font-sans">

      {/*  NAV  */}
      <nav className="sticky top-0 left-0 right-0 z-50 px-6 py-6 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-50 flex items-center gap-4">
        <BackButton fallback="/me" />
        <div>
          <p className="text-[15px] font-bold tracking-tight leading-tight">Insights</p>
          <p className="text-[11px] font-medium text-[#94a3b8]">Your seller performance</p>
        </div>
      </nav>

      <div className="px-6 space-y-8 pt-8">

        {/*  SECTION 1: HERO EARNINGS CARD  */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white border border-slate-100 rounded-[24px] p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
        >
          <div className="flex items-baseline gap-1.5 text-slate-900">
            <span className="text-[18px] font-bold tracking-tight">RM</span>
            <span className="text-[40px] font-semibold tracking-tighter leading-none">{totalEarned.toFixed(2)}</span>
          </div>
          <p className="text-[12px] font-semibold text-slate-400 mt-2">Total Earned</p>
        </motion.section>

        {/*  SECTION 2: STATS ROW  */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-white border border-slate-100 rounded-[24px] p-5 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <ShoppingBag size={16} />
            </div>
            <div>
              <p className="text-[20px] font-semibold tracking-tight">{itemsSold}</p>
              <p className="text-[10px] font-bold text-slate-400">Items Sold</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-[24px] p-5 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <Package size={16} />
            </div>
            <div>
              <p className="text-[20px] font-semibold tracking-tight">{activeListings}</p>
              <p className="text-[10px] font-bold text-slate-400">Active Listings</p>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-[24px] p-5 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-amber-400">
              <Star size={16} fill="currentColor" />
            </div>
            <div>
              <p className="text-[20px] font-semibold tracking-tight">
                {(trustRating ?? 5.0).toFixed(1)}<span className="text-amber-400 text-[16px] ml-0.5"></span>
              </p>
              <p className="text-[10px] font-bold text-slate-400">Trust Rating</p>
            </div>
          </div>
        </motion.section>

        {/*  SECTION 3: RECENT SALES  */}
        <motion.section
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-1">
            <p className="text-[13px] font-bold tracking-tight">Recent Sales</p>
            {recentSales.length > 0 && (
              <span className="text-[11px] font-medium text-slate-400">{itemsSold} total</span>
            )}
          </div>

          {recentSales.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-slate-200 rounded-[24px]">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                <TrendingUp size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-[13px] font-bold text-slate-900">No sales yet</p>
                <p className="text-[11px] font-medium text-slate-400 max-w-[220px] leading-relaxed">
                  Start listing items to earn.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale) => {
                const raw = sale.created_at;
                const date = raw?.toDate ? raw.toDate() : new Date(raw || 0);
                const dateStr = isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                return (
                  <div
                    key={sale.id}
                    className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 truncate">{sale.title || 'Item'}</p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {sale.customer_name || 'Buyer'}  {dateStr}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-semibold text-slate-900 tracking-tight">
                        RM {Number(sale.total || sale.price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.section>

      </div>
    </main>
  );
}
