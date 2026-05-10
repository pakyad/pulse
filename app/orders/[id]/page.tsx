"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Package, Bike, ArrowLeft, 
  Clock, ShieldCheck, MapPin, Receipt, 
  ExternalLink, Info, AlertTriangle, MessageSquare,
  ShieldAlert, ChevronLeft, ChevronRight, Truck, Zap, Activity,
  Navigation
} from 'lucide-react';
import VoxelStatus, { VoxelPulse, VoxelRadar } from '@/components/shared/VoxelStatus';
import ReportIssueModal from '@/components/shared/ReportIssueModal';
import { reportOrderIssue } from '@/lib/marketplace-utils';

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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
       <VoxelRadar size={40} className="text-blue-500" />
       <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing Registry...</p>
    </div>
  );
  
  if (!order) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center space-y-6">
       <ShieldAlert size={48} className="text-slate-200" />
       <div className="space-y-2">
         <h1 className="text-[20px] font-black text-slate-900 tracking-tight">Node Not Found</h1>
         <p className="text-[14px] text-slate-400 font-medium">This transaction does not exist in the Pulse registry.</p>
       </div>
       <button onClick={() => router.push('/me')} className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest">Return to Base</button>
    </div>
  );

  const status = (order.status || 'PENDING').toUpperCase();
  const phases = [
    { id: 1, label: 'Order Placement', key: 'PENDING_VENDOR' },
    { id: 2, label: 'Merchant Prep', key: 'PREPARING' },
    { id: 3, label: 'Logistics Handoff', key: 'AWAITING_RUNNER' },
    { id: 4, label: 'Runner Pickup', key: 'PICKED_UP' },
    { id: 5, label: 'Asset in Transit', key: 'IN_TRANSIT' },
    { id: 6, label: 'Final Handshake', key: 'DELIVERED' }
  ];

  const getPhase = () => {
    if (status === 'DELIVERED' || status === 'COMPLETED') return 6;
    if (status === 'IN_TRANSIT' || status === 'ON_THE_WAY' || status === 'ARRIVED_AT_DESTINATION') return 5;
    if (status === 'PICKED_UP') return 4;
    if (status === 'AWAITING_RUNNER') return 3;
    if (status === 'PREPARING') return 2;
    return 1;
  };

  const phase = getPhase();
  const orderTime = order.created_at?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const title = status === 'DELIVERED' ? 'Asset Secured' : status === 'CANCELLED' ? 'Directive Terminated' : 'Handshake Active';
  const subtext = status === 'DELIVERED' ? 'Final handshake completed. Asset registered to your inventory.' : 'Live telemetry tracking your marketplace asset.';

  const handleConfirmReceipt = async () => {
    if (!navigator.geolocation) {
      alert("Institutional Location Services Required.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const { functions } = await import('@/lib/firebase');
        const { httpsCallable } = await import('firebase/functions');
        const completeHandshake = httpsCallable(functions, 'completeHandshake');
        await completeHandshake({ orderId: id, role: 'buyer', coords });
        alert("Institutional Confirmation Sent. Asset registry updated upon merchant confirmation.");
      } catch (e) {
        console.error(e);
        alert("Handshake Transmission Failed.");
      }
    }, (err) => {
      alert("Location Access Denied. Handshake cannot be institutionalized.");
    });
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-slate-900 selection:bg-blue-100 font-sans antialiased overflow-x-hidden">
      {/* ── 1. NAVIGATION LAYER ── */}
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
                        <VoxelPulse size={12} className="text-emerald-400" />
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
                     <div className="flex items-center gap-3">
                        <VoxelStatus status={order.status} size={14} />
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-none">
                           {order.status.replace(/_/g, ' ')}
                        </span>
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
            </div>

            {/* Merchant Details Node */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-8 rounded-[40px] border-[0.5px] border-slate-100 shadow-xl shadow-slate-900/5 space-y-3">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Drop-Off Hub</p>
                  <div className="flex items-center gap-3">
                     <MapPin size={16} className="text-blue-500" />
                     <h4 className="text-[15px] font-bold text-slate-900 tracking-tight">Main Lobby</h4>
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[40px] border-[0.5px] border-slate-100 shadow-xl shadow-slate-900/5 space-y-3">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Asset Fee</p>
                  <div className="flex items-center gap-3">
                     <Receipt size={16} className="text-emerald-500" />
                     <h4 className="text-[15px] font-bold text-slate-900 tracking-tight">RM {Number(order.price).toFixed(2)}</h4>
                  </div>
               </div>
            </div>
         </section>

         {/* ── 5. GOVERNANCE & HELP ── */}
         <section className="pt-10 flex flex-col gap-4">
            {status !== 'DELIVERED' && status !== 'COMPLETED' && (
              <button 
                onClick={handleConfirmReceipt}
                className="w-full h-18 bg-black text-white rounded-[28px] flex items-center justify-center gap-3 text-[14px] font-black uppercase tracking-[0.2em] shadow-xl shadow-black/10 active:scale-95 transition-all mb-4"
              >
                 <CheckCircle2 size={20} />
                 Confirm Receipt
              </button>
            )}
            <button 
              onClick={() => setIsReportModalOpen(true)}
              className="w-full h-18 border-[0.5px] border-slate-200 rounded-[28px] flex items-center justify-center gap-3 text-[13px] font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
               <ShieldAlert size={18} />
               Report Institutional Conflict
            </button>
            <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 space-y-6">
               <div className="flex items-start gap-4">
                  <Info size={20} className="text-blue-500 shrink-0 mt-1" />
                  <div>
                     <p className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-2">End Process & Mediation</p>
                     <p className="text-[12px] text-slate-400 font-medium leading-relaxed italic">
                        "If a conflict arises, the Pulse Admin will conduct a <strong>GPS Proximity Audit</strong>. If coordinates match, the dispute is dismissed. If they diverge, a refund or credit will be issued within 24 hours."
                     </p>
                  </div>
               </div>
               <div className="h-px bg-slate-100 w-full" />
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">SLA Timeframe</p>
                     <p className="text-[12px] font-bold text-slate-900">24 Hours</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Adjudication</p>
                     <p className="text-[12px] font-bold text-slate-900">GPS Verified</p>
                  </div>
               </div>
            </div>
         </section>
      </div>

      <ReportIssueModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        order={order}
        onSuccess={() => {
          setReportSuccess(true);
          // Refresh order data if needed
        }}
      />
    </main>
  );
}
