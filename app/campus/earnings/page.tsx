"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ArrowUpRight, Bike, Package, Activity } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

export default function EarningsLedgerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    deliveriesCompleted: 0,
    salesCompleted: 0,
    recentActivity: [] as any[]
  });

  useEffect(() => {
    const loadLedger = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.replace('/auth');
        return;
      }

      try {
        // Fetch Completed Deliveries
        const runnerQ = query(
          collection(db, 'transactions'),
          where('runner_id', '==', user.uid),
          where('status', '==', 'DELIVERED')
        );
        const runnerSnap = await getDocs(runnerQ);
        
        // Fetch Completed Sales
        const sellerQ = query(
          collection(db, 'transactions'),
          where('merchant_id', '==', user.uid),
          where('status', '==', 'COMPLETED')
        );
        const sellerSnap = await getDocs(sellerQ);

        let totalEarned = 0;
        let deliveriesCompleted = 0;
        let salesCompleted = 0;
        const activities: any[] = [];

        // Process Deliveries
        runnerSnap.forEach(doc => {
          const data = doc.data();
          const fee = data.runner_fee || 0;
          totalEarned += fee;
          deliveriesCompleted++;
          activities.push({
            id: doc.id,
            type: 'DELIVERY',
            title: data.item_name || 'Campus Delivery',
            amount: fee,
            date: data.updated_at || data.created_at || new Date().toISOString()
          });
        });

        // Process Sales
        sellerSnap.forEach(doc => {
          const data = doc.data();
          const amount = data.total_amount || 0;
          totalEarned += amount;
          salesCompleted++;
          activities.push({
            id: doc.id,
            type: 'SALE',
            title: data.item_name || 'Marketplace Sale',
            amount: amount,
            date: data.updated_at || data.created_at || new Date().toISOString()
          });
        });

        // Sort recent activity
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setEarnings({
          totalEarned,
          deliveriesCompleted,
          salesCompleted,
          recentActivity: activities.slice(0, 10) // Show last 10
        });
      } catch (err) {
        console.error("Failed to load earnings ledger:", err);
      } finally {
        setLoading(false);
      }
    };

    const unsub = auth.onAuthStateChanged(user => {
      if (user) loadLedger();
      else setLoading(false);
    });

    return () => unsub();
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 antialiased pb-20 font-sans">
      
      {/* ── INTERNAL NAV ── */}
      <nav className="sticky top-0 left-0 right-0 z-50 px-6 py-6 bg-slate-50 flex items-center gap-4">
         <BackButton fallback="/me" />
         <div>
            <p className="text-[15px] font-bold tracking-tight leading-tight">Earnings Ledger</p>
            <p className="text-[11px] font-medium text-[#94a3b8]">Your value generated</p>
         </div>
      </nav>

      {loading ? (
        <div className="pt-32 flex justify-center">
           <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-6 space-y-8 pt-4">
          
          {/* ── HERO METRIC ── */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white border border-slate-100 rounded-3xl p-8 shadow-sm"
          >
            <p className="text-[10px] font-semibold text-slate-400  mb-1">Lifetime Earned</p>
            <div className="flex items-baseline gap-1.5 text-slate-900">
               <span className="text-[18px] font-bold tracking-tight">RM</span>
               <span className="text-[40px] font-semibold tracking-tighter leading-none">{earnings.totalEarned.toFixed(2)}</span>
            </div>
          </motion.section>

          {/* ── SUB STATS (ROLE AGNOSTIC) ── */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
               <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Bike size={16} />
               </div>
               <div>
                 <p className="text-[20px] font-semibold tracking-tight">{earnings.deliveriesCompleted}</p>
                 <p className="text-[10px] font-bold  text-slate-400">Deliveries</p>
               </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
               <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Package size={16} />
               </div>
               <div>
                 <p className="text-[20px] font-semibold tracking-tight">{earnings.salesCompleted}</p>
                 <p className="text-[10px] font-bold  text-slate-400">Sales</p>
               </div>
            </div>
          </motion.section>

          {/* ── ACTIVITY LIST ── */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <p className="text-[13px] font-bold tracking-tight px-1">Recent Activity</p>
            
            {earnings.recentActivity.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 border border-dashed border-slate-200 rounded-3xl">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                  <Activity size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-bold text-slate-900">No recorded earnings yet</p>
                  <p className="text-[11px] font-medium text-slate-400 max-w-[200px] leading-relaxed">
                    Start listing items or complete campus deliveries to build your ledger.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {earnings.recentActivity.map((activity) => (
                  <div key={activity.id} className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      {activity.type === 'DELIVERY' ? <Bike size={18} /> : <Package size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 truncate">{activity.title}</p>
                      <p className="text-[10px] font-medium text-slate-400">
                        {new Date(activity.date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-semibold text-emerald-600 tracking-tight">
                        +RM {activity.amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

        </div>
      )}
    </main>
  );
}
