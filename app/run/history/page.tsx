'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Search, MapPin, ChevronRight, CheckCircle2, Clock, Package, Store, User, Headset, Copy, Calendar, Navigation } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';

//  SUB-COMPONENT: Timeline Node 
function TimelineNode({ isPickup, text }: { isPickup: boolean, text: string }) {
  return (
    <div className="flex items-start gap-3 relative">
       {isPickup && (
         <div className="absolute top-5 left-[9px] w-px h-6 bg-slate-200" />
       )}
       
       <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${isPickup ? 'border-rose-200 bg-rose-50 text-rose-500' : 'border-emerald-200 bg-emerald-50 text-emerald-500'}`}>
         {isPickup ? <Store size={10} /> : <User size={10} />}
       </div>
       <div className="pt-0.5">
         <p className="text-[13px] font-medium text-slate-700 leading-tight">{text}</p>
       </div>
    </div>
  );
}

//  SUB-COMPONENT: Order Details View 
function OrderDetailsView({ order, onClose }: { order: any, onClose: () => void }) {
  const date = new Date(order.created_at?.toMillis?.() || Date.now());
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0 z-50 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <nav className="sticky top-0 left-0 right-0 z-60 px-4 py-4 flex items-center justify-between bg-white border-b-[0.5px] border-slate-100 shadow-sm">
         <div className="flex items-center gap-3">
           <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 bg-slate-50 rounded-xl transition-all">
             <ChevronRight size={18} className="rotate-180" />
           </button>
           <p className="text-[15px] font-bold tracking-tight text-slate-900">Order Details</p>
         </div>
         <button className="text-slate-900 hover:bg-slate-50 rounded-xl transition-all p-1.5">
           <Headset size={20} />
         </button>
      </nav>

      <div className="pb-20 p-4 space-y-4">
        {/* Order Info & Stamp */}
        <div className="p-5 bg-white border border-slate-100 rounded-2xl relative overflow-hidden shadow-sm">
           <div className="absolute top-4 right-4 opacity-80 rotate-12 flex flex-col items-center justify-center border-[1.5px] border-slate-900 text-slate-900 rounded-lg px-2 py-0.5">
             <span className="text-[10px] font-bold uppercase tracking-widest">Delivered</span>
           </div>
           
           <h2 className="text-[18px] font-bold text-slate-900">#{order.id.substring(0,8).toUpperCase()}</h2>
           <p className="text-[11px] font-medium text-slate-400 mt-1 flex items-center gap-1.5"><Clock size={11}/> {dateStr}, {timeStr}</p>
           
           <div className="mt-6 space-y-3">
              <TimelineNode isPickup={true} text={order.seller_name || 'Marketplace Merchant'} />
              <TimelineNode isPickup={false} text={`Delivered to ${order.buyer_name || 'Student'}`} />
           </div>
        </div>

        {/* Income Summary (White Card Style) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
           <div className="flex items-center gap-2 mb-4">
             <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-slate-500"><WalletIcon size={12} /></div>
             <p className="text-[14px] font-bold text-slate-900">Income Summary</p>
           </div>
           
           <div className="space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-slate-500">Shipping Fee</span>
                <span className="text-[13px] font-medium text-slate-900">RM {Number(order.runner_fee || 0).toFixed(2)}</span>
             </div>
             {order.surge_fee > 0 && (
               <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-slate-500">Surge Bonus</span>
                  <span className="text-[13px] font-medium text-emerald-500">+RM {Number(order.surge_fee || 0).toFixed(2)}</span>
               </div>
             )}
             <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[14px] font-bold text-slate-900">Total Income</span>
                <span className="text-[16px] font-bold text-slate-900">RM {(Number(order.runner_fee || 0) + Number(order.surge_fee || 0)).toFixed(2)}</span>
             </div>
           </div>
        </div>

        {/* Details Accordion */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2 text-slate-900">
               <ClipboardListIcon size={14} />
               <p className="text-[13px] font-bold">Transaction Reference</p>
             </div>
           </div>
           
           <div className="flex flex-col gap-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network ID</span>
              <div className="flex items-center justify-between">
                 <span className="text-[12px] font-mono text-slate-900 font-medium">{order.id}</span>
                 <button onClick={() => navigator.clipboard.writeText(order.id)} className="text-[11px] font-bold text-slate-900 hover:text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg transition-all shadow-sm">Copy</button>
              </div>
           </div>
        </div>

      </div>
    </motion.div>
  )
}

function WalletIcon({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>; }
function ClipboardListIcon({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>; }

//  MAIN COMPONENT 
export default function RunnerHistoryPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'COMPLETED' | 'CANCELLED'>('COMPLETED');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        onSnapshot(doc(db, 'users', user.uid), (s) => setProfile(s.data()));

        const q = query(collection(db, 'orders'), where('runner_id', '==', user.uid));
        const unsubTx = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
          // Filter to only completed/delivered locally
          const completed = docs.filter(d => ['DELIVERED', 'COMPLETED'].includes(d.status));
          completed.sort((a, b) => (b.created_at?.toMillis?.() || 0) - (a.created_at?.toMillis?.() || 0));
          
          setHistory(completed);
          setLoading(false);
        });

        return () => { unsubTx(); };
      } else {
        router.push('/auth');
      }
    });
    return () => unsub();
  }, [router]);

  // Rendering directly from real database history.
  // Using actual history arrays.

  return (
    <main className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 max-w-2xl mx-auto border-x border-slate-100 shadow-sm relative overflow-x-hidden pb-10">
      
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsView order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
      </AnimatePresence>

      {/*  HEADER  */}
      <nav className="bg-white pt-4 pb-0 flex flex-col border-b border-slate-200 sticky top-0 z-40">
         <div className="flex items-center gap-3 mb-4 px-4">
           <BackButton fallback="/run" />
           <p className="text-[16px] font-bold tracking-tight text-slate-900">Order History</p>
         </div>
         
         <div className="flex">
            <button 
              onClick={() => setActiveTab('COMPLETED')}
              className={`flex-1 pb-2.5 text-[13px] font-semibold transition-all border-b-2 ${activeTab === 'COMPLETED' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'}`}
            >
              Completed
            </button>
            <button 
              onClick={() => setActiveTab('CANCELLED')}
              className={`flex-1 pb-2.5 text-[13px] font-semibold transition-all border-b-2 ${activeTab === 'CANCELLED' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400'}`}
            >
              Cancelled
            </button>
         </div>
      </nav>

      {/*  FILTER BAR  */}
      <div className="px-4 py-3 bg-slate-50 flex items-center gap-1 cursor-pointer hover:bg-slate-100 transition-colors border-b border-slate-100">
         <span className="text-[12px] font-medium text-slate-700">All Time</span>
         <ChevronRight size={14} className="text-slate-500 rotate-90" />
      </div>

      {/*  HISTORY LIST  */}
      <section className="space-y-3 px-3 pb-40">
        <AnimatePresence>
          {loading ? (
            <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" /></div>
          ) : activeTab === 'CANCELLED' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4 text-slate-300">
                 <Package size={28} />
               </div>
               <p className="text-[14px] font-bold text-slate-600">No cancelled orders</p>
            </motion.div>
          ) : history.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mb-4 text-slate-300">
                 <Package size={28} />
               </div>
               <p className="text-[14px] font-bold text-slate-600">No completed orders yet</p>
            </motion.div>
          ) : (
            history.map((job, i) => {
              const date = new Date(job.created_at?.toMillis?.() || Date.now());
              const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={job.id}
                  onClick={() => setSelectedOrder(job)}
                  className="bg-white border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-slate-900 tracking-tight">{timeStr}</span>
                        <div className="flex items-center gap-1 ml-1 text-amber-500">
                           <Package size={12} strokeWidth={2.5} />
                           <span className="text-[10px] font-bold uppercase">{job.category || 'Parcel'}</span>
                        </div>
                     </div>
                     <p className="text-[14px] font-bold text-slate-600">RM {Number(job.runner_fee || 0).toFixed(2)}</p>
                  </div>

                  <div className="px-4 py-4 space-y-3">
                     <TimelineNode isPickup={true} text={job.seller_name || 'Marketplace Merchant'} />
                     <TimelineNode isPickup={false} text={`Customer address is hidden`} />
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>

        {!loading && activeTab === 'COMPLETED' && history.length > 0 && (
          <div className="text-center pt-8 opacity-40 flex items-center justify-center gap-3">
             <div className="h-px w-12 bg-slate-400" />
             <p className="text-[11px] font-medium text-slate-500">End of the list</p>
             <div className="h-px w-12 bg-slate-400" />
          </div>
        )}
      </section>

    </main>
  );
}
