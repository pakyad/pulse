"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ShoppingBag,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  MapPin,
  LayoutGrid,
  ClipboardList,
  BarChart3,
  User,
  Info
} from 'lucide-react';

type MainTab = 'Active' | 'History';
type HistoryFilter = 'All' | 'Completed' | 'Cancelled';

export default function SimplifiedPurchaseHub() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<MainTab>('Active');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('All');
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/auth');
        return;
      }

      onSnapshot(doc(db, 'users', user.uid), (snap) => {
        const userData = snap.data();
        setProfile({ ...userData, uid: user.uid });
        
        const field = userData?.role === 'CLUB' ? 'seller_id' : 'buyer_id';
        const q = query(
          collection(db, 'orders'),
          where(field, '==', user.uid)
        );

        onSnapshot(q, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          docs.sort((a: any, b: any) => {
             const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at).getTime();
             const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at).getTime();
             return (timeB || 0) - (timeA || 0);
          });
          setOrders(docs);
          setLoading(false);
        });
      });
    });

    return () => unsubAuth();
  }, [router]);

  const FINAL_STATUSES = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'ARRIVED'];
  
  const activeOrders = orders.filter(o => !FINAL_STATUSES.includes((o.status || '').toUpperCase()));
  const historyOrders = orders.filter(o => {
    const status = (o.status || '').toUpperCase();
    const isHistory = FINAL_STATUSES.includes(status);
    if (!isHistory) return false;
    
    if (historyFilter === 'Completed') return ['DELIVERED', 'COMPLETED', 'ARRIVED'].includes(status);
    if (historyFilter === 'Cancelled') return status === 'CANCELLED';
    return true;
  });

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 antialiased pb-40">
      
      {/* ── HEADER ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 px-6 h-16 flex items-center justify-between">
          <button onClick={() => router.push(profile?.role === 'CLUB' ? '/merchant' : '/me')} className="text-slate-400 hover:text-slate-900 transition-all">
             <ChevronLeft size={24} />
          </button>
          <h1 className="text-[14px] font-bold tracking-[0.2em] uppercase opacity-40">
             {profile?.role === 'CLUB' ? 'Sales Registry' : 'My Purchases'}
          </h1>
          <div className="w-6" /> 
      </nav>

      {/* ── TABS ── */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white/80 backdrop-blur-md flex flex-col border-b border-slate-50">
          <div className="flex px-6">
            {(['Active', 'History'] as MainTab[]).map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="relative flex-1 py-4 flex flex-col items-center group"
               >
                  <span className={`text-[13px] font-bold transition-colors ${activeTab === tab ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                     {tab}
                  </span>
                  {activeTab === tab && (
                     <motion.div 
                        layoutId="active-tab-line"
                        className="absolute bottom-0 left-6 right-6 h-[2px] bg-blue-600 rounded-full"
                     />
                  )}
               </button>
            ))}
          </div>
          
          <div className="px-6 py-2.5 bg-slate-50/50 border-t border-slate-50 flex items-center gap-2">
             <Info size={12} className="text-slate-400" />
             <p className="text-[10px] font-medium text-slate-400 italic">
                {profile?.role === 'CLUB' 
                  ? 'Instruction: Registry monitors all outgoing asset handshakes and fulfillment integrity.' 
                  : 'Directive: Tracking active marketplace handshakes and carrier delivery status.'}
             </p>
          </div>
      </div>

      <div className="pt-40 px-6 max-w-2xl mx-auto space-y-8">
         {activeTab === 'History' && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
               {(['All', 'Completed', 'Cancelled'] as HistoryFilter[]).map((f) => (
                  <button
                     key={f}
                     onClick={() => setHistoryFilter(f)}
                     className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all ${historyFilter === f ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                  >
                     {f}
                  </button>
               ))}
            </div>
         )}

         <AnimatePresence mode="wait">
            <motion.div 
               key={activeTab + historyFilter}
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0 }}
               className="space-y-4"
            >
               {(activeTab === 'Active' ? activeOrders : historyOrders).length === 0 ? (
                  <div className="py-32 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                     <ShoppingBag size={48} strokeWidth={1} />
                     <p className="text-[12px] font-bold uppercase tracking-widest">Registry Empty</p>
                  </div>
               ) : (
                  (activeTab === 'Active' ? activeOrders : historyOrders).map((order) => (
                     <PurchaseCard key={order.id} order={order} router={router} />
                  ))
               )}
            </motion.div>
         </AnimatePresence>
      </div>

      {/* RENDER MERCHANT BOTTOM NAV IF ROLE IS CLUB */}
      {profile?.role === 'CLUB' && (
         <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-x border-slate-100 pb-8 pt-3 px-10 z-30 flex justify-between items-center shadow-sm max-w-md mx-auto">
            <button onClick={() => router.push('/merchant')} className="flex flex-col items-center gap-1 group">
               <LayoutGrid size={20} className="text-slate-400 group-active:text-blue-600 transition-colors" />
               <span className="text-[10px] font-bold text-slate-400">Dashboard</span>
            </button>
            <button onClick={() => router.push('/me/orders')} className="flex flex-col items-center gap-1 group">
               <ClipboardList size={20} className="text-blue-600" />
               <span className="text-[10px] font-bold text-blue-600">History</span>
            </button>
            <button onClick={() => router.push('/activity')} className="flex flex-col items-center gap-1 group">
               <BarChart3 size={20} className="text-slate-400 group-active:text-blue-600 transition-colors" />
               <span className="text-[10px] font-bold text-slate-400">Insights</span>
            </button>
            <button onClick={() => router.push('/me')} className="flex flex-col items-center gap-1 group">
               <User size={20} className="text-slate-400 group-active:text-blue-600 transition-colors" />
               <span className="text-[10px] font-bold text-slate-400">Account</span>
            </button>
         </nav>
      )}
    </main>
  );
}

function PurchaseCard({ order, router }: { order: any, router: any }) {
   const isHistory = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'ARRIVED'].includes((order.status || '').toUpperCase());

   return (
      <div 
         onClick={() => router.push(`/orders/${order.id}`)}
         className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 hover:bg-slate-50/50 transition-all cursor-pointer group"
      >
         <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <div className="flex items-center gap-2">
               <span className="text-[12px] font-bold text-slate-900 tracking-tight">{order.seller_name || 'Pulse Entity'}</span>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${order.status === 'CANCELLED' ? 'text-red-500' : isHistory ? 'text-green-600' : 'text-blue-600'}`}>
               {order.status.replace(/_/g, ' ')}
            </span>
         </div>

         <div className="flex gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0">
               {order.image_url && <img src={order.image_url} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
               <h3 className="text-[14px] font-bold text-slate-900 truncate">{order.title}</h3>
               <p className="text-[11px] text-slate-400 font-mono mt-1 uppercase">ID: {order.order_code || order.id.substring(0, 6).toUpperCase()}</p>
            </div>
         </div>

         <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               {new Date(order.created_at?.toMillis ? order.created_at.toMillis() : order.created_at).toLocaleDateString()}
            </p>
            <div className="flex items-baseline gap-1">
               <span className="text-[10px] font-bold text-slate-400 uppercase">Total Credits</span>
               <span className="text-[16px] font-bold text-slate-900">RM {Number(order.price).toFixed(2)}</span>
            </div>
         </div>
      </div>
   );
}


