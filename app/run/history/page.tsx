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
         <div className="absolute top-5 left-[9px] w-px h-6 bg-gray-100" />
       )}
       
       <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${isPickup ? 'border-rose-200 bg-rose-50 text-rose-500' : 'border-emerald-200 bg-emerald-50 text-emerald-500'}`}>
         {isPickup ? <Store size={10} /> : <User size={10} />}
       </div>
       <div className="pt-0.5">
         <p className="text-[13px] font-medium text-gray-700 leading-tight">{text}</p>
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
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute inset-0 z-50 bg-[#F9F9FB] min-h-screen">
      
      {/* Header */}
      <nav className="sticky top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white border-b border-gray-100 shadow-sm">
         <div className="flex items-center gap-3">
           <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 bg-gray-50 rounded-xl transition-all">
             <ChevronLeft size={18} />
           </button>
           <p className="text-xl font-bold tracking-tight text-gray-900">Order Details</p>
         </div>
         <button className="text-gray-900 hover:bg-gray-50 rounded-full transition-all p-1.5">
           <Headset size={20} />
         </button>
      </nav>

      <div className="pb-20 p-6 space-y-4">
        {/* Order Info & Stamp */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl relative overflow-hidden shadow-sm">
           <div className="absolute top-4 right-4 opacity-80 rotate-12 flex flex-col items-center justify-center border-[1.5px] border-gray-900 text-gray-900 rounded-lg px-2 py-0.5">
             <span className="text-[10px] font-bold uppercase tracking-widest">Delivered</span>
           </div>
           
           <h2 className="text-[18px] font-bold text-gray-900">#{order.id.substring(0,8).toUpperCase()}</h2>
           <p className="text-[11px] font-medium text-gray-400 mt-1 flex items-center gap-1.5"><Clock size={11}/> {dateStr}, {timeStr}</p>
           
           <div className="mt-6 space-y-3">
              <TimelineNode isPickup={true} text={order.seller_name || 'Marketplace Merchant'} />
              <TimelineNode isPickup={false} text={`Delivered to ${order.buyer_name || 'Student'}`} />
           </div>
        </div>

        {/* Income Summary (White Card Style) */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
           <div className="flex items-center gap-2 mb-4">
             <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-gray-500"><WalletIcon size={12} /></div>
             <p className="text-sm font-bold text-gray-900">Income Summary</p>
           </div>
           
           <div className="space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-[13px] font-medium text-gray-500">Shipping Fee</span>
                <span className="text-[13px] font-medium text-gray-900">RM {Number(order.runner_fee || 0).toFixed(2)}</span>
             </div>
             {order.surge_fee > 0 && (
               <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-gray-500">Surge Bonus</span>
                  <span className="text-[13px] font-medium text-emerald-500">+RM {Number(order.surge_fee || 0).toFixed(2)}</span>
               </div>
             )}
             <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Total Income</span>
                <span className="text-lg font-bold text-gray-900">RM {(Number(order.runner_fee || 0) + Number(order.surge_fee || 0)).toFixed(2)}</span>
             </div>
           </div>
        </div>

        {/* Details Accordion */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2 text-gray-900">
               <ClipboardListIcon size={14} />
               <p className="text-sm font-bold">Transaction Reference</p>
             </div>
           </div>
           
           <div className="flex flex-col gap-1.5 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Network ID</span>
              <div className="flex items-center justify-between">
                 <span className="text-[12px] font-mono text-gray-900 font-medium">{order.id}</span>
                 <button onClick={() => navigator.clipboard.writeText(order.id)} className="text-[11px] font-bold text-gray-900 hover:text-gray-600 bg-white border border-gray-200 px-3 py-1 rounded-lg transition-all shadow-sm">Copy</button>
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

  return (
    <main className="min-h-screen bg-[#F9F9FB] font-sans antialiased text-gray-900 max-w-2xl mx-auto border-x border-gray-100 shadow-sm relative overflow-x-hidden pb-10">
      
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsView order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
      </AnimatePresence>

      {/*  HEADER  */}
      <nav className="bg-white pt-8 pb-0 flex flex-col border-b border-gray-100 sticky top-0 z-40">
         <div className="flex items-center gap-3 mb-6 px-6">
           <BackButton fallback="/run" />
           <p className="text-xl font-bold tracking-tight text-gray-900">Order History</p>
         </div>
         
         <div className="flex px-6">
            <button 
              onClick={() => setActiveTab('COMPLETED')}
              className={`flex-1 pb-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'COMPLETED' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'}`}
            >
              Completed
            </button>
            <button 
              onClick={() => setActiveTab('CANCELLED')}
              className={`flex-1 pb-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'CANCELLED' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'}`}
            >
              Cancelled
            </button>
         </div>
      </nav>

      {/*  FILTER BAR  */}
      <div className="px-6 py-4 bg-[#F9F9FB] flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100">
         <span className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">All Time</span>
         <ChevronRight size={14} className="text-gray-400 rotate-90" />
      </div>

      {/*  HISTORY LIST  */}
      <section className="space-y-4 px-4 pt-6 pb-40">
        <AnimatePresence>
          {loading ? (
            <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" /></div>
          ) : activeTab === 'CANCELLED' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
                 <Package size={28} />
               </div>
               <p className="text-sm font-bold text-gray-500">No cancelled orders</p>
            </motion.div>
          ) : history.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
                 <Package size={28} />
               </div>
               <p className="text-sm font-bold text-gray-500">No completed orders yet</p>
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
                  className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 cursor-pointer hover:border-gray-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-gray-900 tracking-tight">{timeStr}</span>
                        <div className="flex items-center gap-1 ml-1 px-2 py-0.5 bg-gray-50 rounded-full text-gray-500">
                           <Package size={10} strokeWidth={2.5} />
                           <span className="text-[9px] font-bold uppercase tracking-tight">{job.category || 'Parcel'}</span>
                        </div>
                     </div>
                     <p className="text-sm font-bold text-gray-900">RM {Number(job.runner_fee || 0).toFixed(2)}</p>
                  </div>

                  <div className="space-y-3">
                     <TimelineNode isPickup={true} text={job.seller_name || 'Marketplace Merchant'} />
                     <TimelineNode isPickup={false} text={`Customer address is hidden`} />
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>

        {!loading && activeTab === 'COMPLETED' && history.length > 0 && (
          <div className="text-center pt-8 opacity-30 flex items-center justify-center gap-3">
             <div className="h-px w-10 bg-gray-400" />
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">End of the list</p>
             <div className="h-px w-10 bg-gray-400" />
          </div>
        )}
      </section>

    </main>
  );
}

function WalletIcon({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>; }
function ClipboardListIcon({ size }: { size: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>; }
