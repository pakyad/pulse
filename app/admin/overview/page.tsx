"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { Users, ShoppingBag, ShieldAlert, TrendingUp, Package, Star } from 'lucide-react';

export default function OverviewPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    activeDisputes: 0,
    flaggedItems: 0,
    totalMerchants: 0,
    totalRunners: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const users = snap.docs.map(d => d.data());
      setStats(prev => ({
        ...prev,
        totalUsers:     users.length,
        totalMerchants: users.filter(u => u.is_seller).length,
        totalRunners:   users.filter(u => u.is_verified_runner).length,
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

    return () => { unsubUsers(); unsubItems(); unsubFlagged(); unsubDisputes(); };
  }, []);

  const cards = [
    { label: 'Total Users',       value: stats.totalUsers,     icon: Users,       color: 'text-slate-900' },
    { label: 'Active Listings',   value: stats.totalItems,     icon: ShoppingBag, color: 'text-slate-900' },
    { label: 'Flagged Prices',    value: stats.flaggedItems,   icon: ShieldAlert, color: stats.flaggedItems > 0  ? 'text-amber-500' : 'text-slate-900' },
    { label: 'Open Disputes',     value: stats.activeDisputes, icon: TrendingUp,  color: stats.activeDisputes > 0 ? 'text-red-500' : 'text-emerald-500' },
    { label: 'Merchants',         value: stats.totalMerchants, icon: Package,     color: 'text-slate-900' },
    { label: 'Runners',           value: stats.totalRunners,   icon: Star,        color: 'text-slate-900' },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Dashboard</p>
        <h1 className="text-[24px] font-black text-slate-900 tracking-tight">Overview</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
              <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center">
                <card.icon size={16} className="text-slate-400" />
              </div>
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <p className={`text-[32px] font-black leading-none ${card.color}`}>{card.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Health Banner */}
      <div className={`p-6 rounded-2xl border flex items-center justify-between ${
        stats.activeDisputes > 3 || stats.flaggedItems > 5
          ? 'bg-amber-50 border-amber-100'
          : 'bg-emerald-50 border-emerald-100'
      }`}>
        <div>
          <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${
            stats.activeDisputes > 3 || stats.flaggedItems > 5 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {stats.activeDisputes > 3 || stats.flaggedItems > 5 ? 'Attention Needed' : 'All Systems Normal'}
          </p>
          <p className="text-[13px] font-medium text-slate-600">
            {stats.activeDisputes > 3 || stats.flaggedItems > 5
              ? `${stats.activeDisputes} disputes and ${stats.flaggedItems} flagged listings require your review.`
              : 'No critical issues. The marketplace is running smoothly.'
            }
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${
          stats.activeDisputes > 3 || stats.flaggedItems > 5 ? 'bg-amber-400' : 'bg-emerald-400'
        } animate-pulse`} />
      </div>
    </div>
  );
}
