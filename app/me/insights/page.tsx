'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { TrendingUp, ArrowLeft, Package, DollarSign, ListOrdered, HardDrive, ShoppingBag, Info, Shirt } from 'lucide-react';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

const SkibidiHeading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[17px] font-bold text-slate-900 tracking-tight ${className}`}>
    {children}
  </h2>
);

const SkibidiSubtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[11px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

export default function MarketInsightsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      unsubs.forEach(u => u());
      unsubs = [];

      if (user) {
        const uProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
           setProfile({ ...snap.data(), uid: user.uid });
        });
        unsubs.push(uProfile);

        const uOrders = onSnapshot(query(collection(db, "orders"), where("seller_id", "==", user.uid)), (s) => {
           setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        unsubs.push(uOrders);

        const uItems = onSnapshot(query(collection(db, "items"), where("seller_id", "==", user.uid)), (s) => {
           setItems(s.docs.map(d => ({ id: d.id, ...d.data() })));
           setLoading(false);
        });
        unsubs.push(uItems);
      } else {
        router.push('/auth');
      }
    });
    return () => {
      unsubAuth();
      unsubs.forEach(u => u());
    };
  }, [router]);

  // Shared Metrics
  const completedOrders = useMemo(() => orders.filter(o => ["DELIVERED", "COMPLETED", "READY_FOR_PICKUP"].includes(o.status)), [orders]);
  const totalRevenue = useMemo(() => completedOrders.reduce((s, o) => s + Number(o.price || o.total || 0), 0), [completedOrders]);
  const salesVolume = completedOrders.length;
  
  const inventoryValue = useMemo(() => items.reduce((s, item) => s + (Number(item.price || 0) * Number(item.stock_count || 0)), 0), [items]);
  const totalUnitsAvailable = useMemo(() => items.reduce((s, item) => s + Number(item.stock_count || 0), 0), [items]);

  // Item Sales Mapping
  const itemSales = useMemo(() => {
    const counts: Record<string, number> = {};
    completedOrders.forEach(o => {
       if (o.item_id) counts[o.item_id] = (counts[o.item_id] || 0) + 1;
    });
    return items.map(item => ({
       ...item,
       units_sold: counts[item.id] || 0
    })).sort((a, b) => b.units_sold - a.units_sold);
  }, [items, completedOrders]);

  if (loading) return null;

  const isProMode = profile?.role === 'CLUB' || profile?.is_verified_merchant;

  return (
    <main className="min-h-screen bg-white pb-40 font-sans antialiased text-slate-900">
      <section className="px-8 pt-28 pb-2">
         <div className="space-y-0.5">
            <SkibidiHeading>Market Insights</SkibidiHeading>
            <SkibidiSubtext>{isProMode ? 'Operational Analytics' : 'Selling Progress'}</SkibidiSubtext>
         </div>
      </section>

      <section className="px-8 mt-10">
        <div className="flex flex-col space-y-12 animate-in fade-in duration-500 pb-40">
          
          {/* TOP BANNER */}
          {isProMode ? (
             <section className="space-y-6">
                <div className="p-6 bg-slate-900 rounded-2xl text-white flex items-start gap-5 shadow-md shadow-slate-900/10">
                   <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-amber-400">
                      <TrendingUp size={22} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[14px] font-bold tracking-tight">Weekly Performance</p>
                      <p className="text-[11px] text-white/50 font-medium leading-relaxed">Your store activity is looking solid. Keep inventory updated to maintain sales momentum.</p>
                   </div>
                </div>
                <div className="px-1 space-y-1">
                   <SkibidiHeading>Merchant Insights</SkibidiHeading>
                   <SkibidiSubtext>Track your campus impact and store growth.</SkibidiSubtext>
                </div>
             </section>
          ) : (
             <section className="space-y-6">
                <div className="p-6 bg-slate-900 rounded-2xl text-white flex items-start gap-5 shadow-md shadow-slate-900/10">
                   <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-white">
                      <Shirt size={22} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[14px] font-bold tracking-tight">Activity Status</p>
                      <p className="text-[11px] text-white/80 font-medium leading-relaxed">You've successfully fulfilled {salesVolume} orders. Keep your listings updated.</p>
                   </div>
                </div>
                <div className="px-1 space-y-1">
                   <SkibidiHeading>Selling Progress</SkibidiHeading>
                   <SkibidiSubtext>See how much you've made from your old stuff.</SkibidiSubtext>
                </div>
             </section>
          )}

          {/* METRICS GRID (2x2) */}
          <div className="grid grid-cols-2 gap-4">
             <div className="p-6 border border-slate-50 rounded-2xl bg-white shadow-sm flex flex-col justify-between h-32">
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-2">{isProMode ? 'Total Earnings' : 'Money Earned'}</p>
                <div>
                   <p className="text-[20px] font-bold text-slate-900 tracking-tighter">RM {totalRevenue.toFixed(2)}</p>
                </div>
             </div>
             
             <div className="p-6 border border-slate-50 rounded-2xl bg-white shadow-sm flex flex-col justify-between h-32">
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-2">{isProMode ? 'Sales Volume' : 'Items Sold'}</p>
                <div>
                   <p className="text-[20px] font-bold text-slate-900 tracking-tighter">{salesVolume}</p>
                </div>
             </div>

             <div className="p-6 border border-slate-50 rounded-2xl bg-slate-50/50 shadow-sm flex flex-col justify-between h-32">
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-2">{isProMode ? 'Inventory Value' : 'Closet Value'}</p>
                <div>
                   <p className="text-[20px] font-bold text-slate-900 tracking-tighter">RM {inventoryValue.toFixed(2)}</p>
                </div>
             </div>

             <div className="p-6 border border-slate-50 rounded-2xl bg-slate-50/50 shadow-sm flex flex-col justify-between h-32">
                <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest mb-2">{isProMode ? 'Total Units' : 'Items Left'}</p>
                <div>
                   <p className="text-[20px] font-bold text-slate-900 tracking-tighter">{totalUnitsAvailable}</p>
                </div>
             </div>
          </div>

          {/* VISUAL BREAKDOWN SECTION */}
          {isProMode ? (
             <>
                {/* PRO MODE: STOCK HEALTH */}
                <section className="space-y-8 p-8 bg-slate-50/30 rounded-2xl border border-slate-50">
                   <div className="px-1 space-y-1">
                      <SkibidiHeading>Stock Health</SkibidiHeading>
                      <SkibidiSubtext>Live inventory status across all assets</SkibidiSubtext>
                   </div>
                   
                   <div className="space-y-5">
                      {[
                         { name: 'Healthy Stock (>5 units)', color: 'bg-emerald-500', count: items.filter(i => (i.stock_count || 0) > 5).length },
                         { name: 'Low Stock Alert (1-5 units)', color: 'bg-amber-500', count: items.filter(i => (i.stock_count || 0) > 0 && (i.stock_count || 0) <= 5).length },
                         { name: 'Out of Stock (0 units)', color: 'bg-rose-500', count: items.filter(i => (i.stock_count || 0) === 0).length }
                      ].map(f => {
                         const pct = items.length > 0 ? Math.round((f.count / items.length) * 100) : 0;
                         return (
                           <div key={f.name} className="flex items-center gap-4">
                              <div className={`w-1.5 h-1.5 rounded-full ${f.color}`} />
                              <p className="text-[13px] font-bold text-slate-500 flex-1">{f.name}</p>
                              <div className="text-right">
                                <p className="text-[13px] font-black text-slate-900">{pct}%</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{f.count} Items</p>
                              </div>
                           </div>
                         );
                      })}
                   </div>
                </section>

                {/* PRO MODE: TOP PERFORMING ASSETS */}
                <section className="space-y-6">
                   <div className="px-1 space-y-1">
                      <SkibidiHeading>Top Moving Inventory</SkibidiHeading>
                      <SkibidiSubtext>Assets with the highest sales volume</SkibidiSubtext>
                   </div>
                   
                   <div className="space-y-3">
                      {itemSales.slice(0, 3).map((item, idx) => (
                         <div key={item.id} className="p-4 rounded-2xl border border-slate-50 bg-white shadow-sm flex items-center justify-between hover:border-slate-200 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-300 text-[11px]">
                                  #{idx + 1}
                               </div>
                               <div>
                                  <p className="text-[13px] font-bold text-slate-900 tracking-tight">{item.title}</p>
                                  <p className="text-[10px] text-slate-400 font-medium">{item.stock_count || 0} Units Remaining</p>
                               </div>
                            </div>
                            <div className="px-3 py-1 bg-blue-50 text-slate-900 rounded-lg">
                               <p className="text-[11px] font-black uppercase tracking-widest">{item.units_sold} Sold</p>
                            </div>
                         </div>
                      ))}
                      {itemSales.length === 0 && (
                         <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2 border border-dashed border-slate-200 rounded-2xl">
                            <ShoppingBag size={24} className="opacity-20" />
                            <p className="text-[11px] font-bold uppercase tracking-widest">No Sales Data Yet</p>
                         </div>
                      )}
                   </div>
                </section>
             </>
          ) : (
             <>
                {/* CASUAL MODE: RECENT SALES */}
                <section className="space-y-6">
                   <div className="px-1 flex items-center justify-between">
                      <div className="space-y-1">
                         <SkibidiHeading>Recent Sales</SkibidiHeading>
                         <SkibidiSubtext>Stuff you successfully sold.</SkibidiSubtext>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                         <Info size={14} />
                      </div>
                   </div>
                   
                   <div className="space-y-3">
                      {completedOrders.slice(0, 5).map(order => (
                         <div key={order.id} className="p-5 rounded-2xl border border-slate-50 bg-white shadow-sm flex items-center justify-between">
                            <div className="space-y-0.5">
                               <p className="text-[13px] font-bold text-slate-900 tracking-tight truncate max-w-[200px]">{order.title}</p>
                               <p className="text-[10px] text-slate-400 font-medium">To: {order.buyer_name || 'Anonymous Student'}</p>
                            </div>
                            <p className="text-[14px] font-black text-slate-900">RM {Number(order.price || order.total || 0).toFixed(2)}</p>
                         </div>
                      ))}
                      {completedOrders.length === 0 && (
                         <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <Shirt size={24} className="opacity-20" />
                            <p className="text-[11px] font-bold uppercase tracking-widest">No Items Sold Yet</p>
                         </div>
                      )}
                   </div>
                </section>
             </>
          )}

        </div>
      </section>
    </main>
  );
}
