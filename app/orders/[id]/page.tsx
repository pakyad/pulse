"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  Package, 
  MapPin, 
  ChevronRight, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Truck,
  Zap,
  Activity,
  ArrowRight,
  Navigation,
  FileText,
  Copy,
  AlertTriangle,
  Info
} from 'lucide-react';
import ReportIssueModal from '@/components/shared/ReportIssueModal';

export default function EdgeToEdgeOrderStatus() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (unsub) unsub();
        router.push('/auth');
        return;
      }
      
      const txRef = doc(db, 'orders', id as string);
      unsub = onSnapshot(txRef, (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsub) unsub();
    };
  }, [id, router]);

  if (loading) return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans p-8 items-center justify-center space-y-6">
        <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 border border-slate-100">
           <Package size={32} />
        </div>
        <div className="text-center space-y-2">
           <h2 className="text-[22px] font-black text-slate-900 tracking-tight">Mission Node Lost</h2>
           <p className="text-[14px] text-slate-400 font-medium max-w-[240px]">This order registry could not be synchronized. Return to the main hub.</p>
        </div>
        <button onClick={() => router.push('/me')} className="h-[60px] px-8 bg-slate-900 text-white rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-xl shadow-black/10">Return Home</button>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': 
      case 'PENDING_VENDOR':
        return { phase: 1, title: 'Registry Validating', subtext: 'Order awaiting vendor handshake.' };
      case 'PREPARING': 
      case 'PACKED':
      case 'CONFIRMED':
        return { phase: 2, title: 'Node Preparation', subtext: 'Seller is packing your assets.' };
      case 'AWAITING_RUNNER': 
        return { phase: 3, title: 'Logistics Call', subtext: 'Awaiting a local peer runner.' };
      case 'ON_THE_WAY': 
      case 'IN_TRANSIT':
        return { phase: 4, title: 'Logistics Intercept', subtext: 'Runner heading to the vendor node.' };
      case 'PICKED_UP':
        return { phase: 5, title: 'Active Transit', subtext: 'Assets in transit to your hub.' };
      case 'COMPLETED': 
      case 'ARRIVED':
      case 'DELIVERED':
        return { phase: 6, title: 'Mission Complete', subtext: 'Assets secured at drop-off.' };
      default: 
        return { phase: 1, title: 'Syncing...', subtext: 'Initializing registry...' };
    }
  };

  const { phase, title, subtext } = getStatusInfo(order.status);

  const formatTime = (dateObj: any) => {
    if (!dateObj) return '';
    try {
      const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch(e) { return ''; }
  };

  const orderTime = formatTime(order.created_at) || "10:00 AM";

  const phases = [
    { id: 1, label: 'Placed' },
    { id: 2, label: 'Preparing' },
    { id: 3, label: 'Runner' },
    { id: 4, label: 'Intercept' },
    { id: 5, label: 'Transit' },
    { id: 6, label: 'Arrived' }
  ];

  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900 antialiased overflow-x-hidden">
      
      {/* ── 1. PREMIUM HEADER ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100 px-6 h-20 flex items-center justify-between">
         <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 active:scale-90 transition-all">
            <ChevronLeft size={20} />
         </button>
         <div className="flex flex-col items-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Registry</p>
            <p className="text-[14px] font-bold tracking-tight">#{order.order_code || order.id.substring(0, 6).toUpperCase()}</p>
         </div>
         <button className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">
            <ShieldCheck size={18} />
         </button>
      </nav>

      <div className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-10">
         
         {/* ── 2. LOGISTICS PULSE HERO ── */}
         <section className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-900/10"
            >
               {/* Background Animated Pulse */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] animate-pulse rounded-full -mr-20 -mt-20" />
               
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,1)]" />
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Active Directive</span>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <motion.h1 
                        key={title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[32px] font-black tracking-tighter leading-none"
                     >
                        {title}
                     </motion.h1>
                     <p className="text-slate-400 text-[15px] font-medium leading-relaxed max-w-[260px]">{subtext}</p>
                  </div>

                  {/* Voxel Progress Bar */}
                  <div className="space-y-3 pt-4">
                     <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-1 p-0.5">
                        {phases.map((p) => (
                           <motion.div 
                              key={p.id}
                              initial={false}
                              animate={{ 
                                 backgroundColor: phase >= p.id ? '#10B981' : 'rgba(255,255,255,0.05)',
                                 flex: phase === p.id ? 2 : 1
                              }}
                              className="h-full rounded-full transition-all"
                           />
                        ))}
                     </div>
                     <div className="flex justify-between px-1">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{phases[0].label}</p>
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">{phases[phase-1]?.label || 'Pending'}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{phases[5].label}</p>
                     </div>
                  </div>
               </div>
            </motion.div>
         </section>

         {/* ── 3. TRACKING TIMELINE ── */}
         <section className="bg-white rounded-[40px] border-[0.5px] border-slate-100 p-10 shadow-xl shadow-slate-900/5 space-y-10">
            <div className="relative">
               {/* Tubular Progress Line */}
               <div className="absolute left-4 top-4 bottom-4 w-1 bg-slate-50 rounded-full" />
               <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min(100, ((phase - 1) / 5) * 100)}%` }}
                  className="absolute left-4 top-4 w-1 bg-emerald-500 rounded-full z-10 transition-all duration-1000"
               />

               <div className="space-y-10 relative z-20">
                  {phases.map((p) => {
                     const isCurrent = phase === p.id;
                     const isPast = phase > p.id;
                     
                     return (
                        <div key={p.id} className="flex items-start gap-8 group">
                           <div className={`w-9 h-9 rounded-[14px] flex items-center justify-center transition-all duration-500 border-2 ${
                              isCurrent ? 'bg-slate-900 border-slate-900 text-white scale-110 shadow-xl shadow-slate-900/20' : 
                              isPast ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/10' : 
                              'bg-white border-slate-50 text-slate-200'
                           }`}>
                              {isPast ? <CheckCircle2 size={16} /> : isCurrent ? <Activity size={16} className="animate-pulse" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                           </div>
                           <div className="flex-1 pt-1 space-y-1">
                              <div className="flex justify-between items-baseline">
                                 <h4 className={`text-[15px] font-bold tracking-tight transition-colors ${isCurrent ? 'text-slate-900' : isPast ? 'text-slate-400' : 'text-slate-200'}`}>
                                    {p.label} Node
                                 </h4>
                                 {isPast && <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{p.id === 1 ? orderTime : ''}</span>}
                              </div>
                              {isCurrent && (
                                 <motion.p 
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[13px] text-slate-400 font-medium leading-relaxed"
                                 >
                                    Registry confirmed at this node. Awaiting handshake.
                                 </motion.p>
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         </section>

         {/* ── 4. ASSET BENTO NODE ── */}
         <section className="grid grid-cols-1 gap-6">
            <div className="bg-white p-8 rounded-[40px] border-[0.5px] border-slate-100 shadow-xl shadow-slate-900/5 flex items-center gap-6 group cursor-pointer hover:bg-slate-50 transition-all">
               <div className="w-20 h-20 bg-slate-50 rounded-[28px] overflow-hidden border border-slate-100 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                  {order.image_url ? (
                    <img src={order.image_url} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={28} className="text-slate-200" />
                  )}
               </div>
               <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Asset Manifest</p>
                  <h3 className="text-[18px] font-black text-slate-900 tracking-tighter leading-tight">{order.title}</h3>
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-[12px] uppercase tracking-widest">
                     RM {Number(order.price).toFixed(2)} • {order.seller_name || 'Pulse Node'}
                  </div>
               </div>
               <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all">
                  <ArrowRight size={20} />
               </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border-[0.5px] border-slate-100 shadow-xl shadow-slate-900/5 flex items-start gap-6">
               <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 shrink-0 border border-slate-100 shadow-sm">
                  <MapPin size={22} strokeWidth={1.5} />
               </div>
               <div className="space-y-1 flex-1">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Drop-Off Hub</p>
                  <p className="text-[16px] font-bold text-slate-900 tracking-tight leading-snug">{order.drop_off_location || 'Campus Main Entrance'}</p>
                  <div className="flex items-center gap-2 pt-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                     <Zap size={10} className="fill-emerald-500" /> Geofence Verified
                  </div>
               </div>
               <button className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100 active:scale-90 transition-all shadow-sm">
                  <Navigation size={18} />
               </button>
            </div>
         </section>

         {/* ── 5. REGISTRY LEDGER ── */}
         <footer className="text-center space-y-6 py-10 opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-center gap-3">
               <div className="h-px w-12 bg-slate-200" />
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Institutional Audit Trail</p>
               <div className="h-px w-12 bg-slate-200" />
            </div>
            <div className="space-y-1">
               <p className="text-[11px] font-bold text-slate-400">Handshake ID: {order.id}</p>
               <p className="text-[11px] font-medium text-slate-300">Synchronized via Pulse Node 20 • Cluster Alpha</p>
            </div>

            <div className="pt-4 flex flex-col items-center gap-4">
               {order.is_disputed ? (
                  <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                     <AlertTriangle size={14} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Dispute Open: Awaiting Admin</span>
                  </div>
               ) : (
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-2"
                  >
                     <AlertTriangle size={12} /> Report Issue
                  </button>
               )}
               
               <div className="flex items-center gap-2 opacity-50">
                  <Info size={10} className="text-slate-400" />
                  <p className="text-[9px] font-medium text-slate-400 italic">Directive: Handshake is legally binding unless a dispute node is initiated.</p>
               </div>
            </div>
         </footer>
         
         <ReportIssueModal 
           isOpen={isReportModalOpen} 
           onClose={() => setIsReportModalOpen(false)} 
           order={order}
           onSuccess={() => setReportSuccess(true)}
         />

      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
