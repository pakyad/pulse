"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Users, ShoppingBag, ShieldAlert, TrendingUp, Package, Star, Lock } from 'lucide-react';

export default function OverviewPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    activeDisputes: 0,
    flaggedItems: 0,
    totalMerchants: 0,
    totalRunners: 0,
    totalLocked: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const users = snap.docs.map(d => d.data());
      setStats(prev => ({
        ...prev,
        totalUsers:     users.length,
        totalMerchants: users.filter(u => u.is_seller).length,
        totalRunners:   users.filter(u => u.is_verified_runner || u.role === 'RUNNER').length,
      }));
      setLoading(false);
    });

    const unsubItems = onSnapshot(collection(db, 'items'), (snap) => {
      setStats(prev => ({ ...prev, totalItems: snap.size }));
    });

    const unsubFlagged = onSnapshot(
      query(collection(db, 'items'), where('is_price_flagged', '==', true)),
      (snap) => setStats(prev => ({ ...prev, flaggedItems: snap.size }))
    );

    const unsubDisputes = onSnapshot(
      query(collection(db, 'disputes'), where('status', '==', 'AWAITING_ADMIN')),
      (snap) => setStats(prev => ({ ...prev, activeDisputes: snap.size }))
    );

    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), where('status', 'in', ['DELIVERED', 'COMPLETED'])),
      (snap) => {
        let locked = 0;
        snap.forEach(d => {
          const o = d.data();
          if (o.status === 'DELIVERED' && o.escrow_status !== 'RELEASED') {
            const mTotal = Number(o.item_total || o.items_total || 0);
            const rFee = Number(o.runner_fee || o.delivery_fee || 0);
            const orderTotal = Number(o.grand_total || o.total || o.price || 0);
            const sum = mTotal + rFee;
            locked += sum > 0 ? sum : orderTotal;
          }
        });
        setStats(prev => ({ ...prev, totalLocked: locked }));
      }
    );

    return () => { unsubUsers(); unsubItems(); unsubFlagged(); unsubDisputes(); unsubOrders(); };
  }, []);

  const cards = [
    { label: 'System Liquidity',  value: `RM ${stats.totalLocked.toFixed(2)}`, icon: Lock },
    { label: 'Active Listings',   value: stats.totalItems,     icon: ShoppingBag },
    { label: 'Pending Reviews',   value: stats.flaggedItems,   icon: ShieldAlert },
    { label: 'Open Disputes',     value: stats.activeDisputes, icon: TrendingUp },
    { label: 'Active Merchants',  value: stats.totalMerchants, icon: Package },
    { label: 'Verified Runners',  value: stats.totalRunners,   icon: Star },
  ];

  return (
    <div className="space-y-8 max-w-[1400px] w-full">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 mb-1">Pulse Platform</p>
        <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">System Overview</h1>
      </div>

      {/* Main Alert Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Health Status</h2>
          <p className="text-[12px] text-slate-400 mt-1">
            Real-time operational snapshot.
          </p>
        </div>

        <div className={`p-5 rounded-xl border flex items-center justify-between ${
          stats.activeDisputes > 0 || stats.flaggedItems > 0
            ? 'bg-red-50 border-red-100 text-red-900'
            : 'bg-emerald-50 border-emerald-100 text-emerald-900'
        }`}>
          <div>
            <p className="text-[13px] font-bold">
              {stats.activeDisputes > 0 || stats.flaggedItems > 0 ? 'Attention Needed' : 'All Systems Normal'}
            </p>
            <p className="text-[11px] font-medium mt-0.5 opacity-80">
              {stats.activeDisputes > 0 || stats.flaggedItems > 0
                ? `${stats.activeDisputes} disputes and ${stats.flaggedItems} flagged listings require action.`
                : 'Marketplace operations are running smoothly.'
              }
            </p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
             {stats.activeDisputes > 0 || stats.flaggedItems > 0 
               ? <ShieldAlert size={20} className="text-red-500" />
               : <CheckCircle size={20} className="text-emerald-500" />
             }
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Key Metrics</h2>
          <p className="text-[12px] text-slate-400 mt-1">
            Platform adoption and financial liquidity.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400">{card.label}</p>
                <card.icon size={14} className="text-slate-300" />
              </div>
              {loading ? (
                <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-[18px] font-bold text-slate-900 leading-none">{card.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Just adding the missing CheckCircle import here manually since I didn't import it at the top
import { CheckCircle } from 'lucide-react';
