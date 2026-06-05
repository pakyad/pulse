"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';
import {
  Package, MapPin, Clock, ChevronLeft, Zap,
  Truck, Search, Bell, Radio, InboxIcon, AlertCircle,
  ShieldCheck, Phone
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[24px] font-bold text-slate-900 tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[14px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

// ── Mission Card Component ──
function MissionCard({ order, onAccept, disabled }: { order: any; onAccept: (id: string) => void; disabled: boolean }) {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const runnerCut = 2.00; // Flat fee for demo

  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isHolding && !hasAccepted) {
      interval = setInterval(() => {
        setHoldProgress(prev => {
          if (prev >= 100) return 100;
          return prev + 5; 
        });
      }, 40);
    } else if (!isHolding && !hasAccepted) {
      setHoldProgress(0);
    }
    return () => clearInterval(interval);
  }, [isHolding, hasAccepted]);

  useEffect(() => {
    if (holdProgress >= 100 && !hasAccepted) {
      setHasAccepted(true);
      setIsHolding(false);
      onAccept(order.id);
    }
  }, [holdProgress, hasAccepted, order.id, onAccept]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:border-slate-300 transition-all group overflow-hidden relative"
    >
      {/* Scanning Overlay */}
      {isHolding && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-900/5 pointer-events-none z-10"
        >
           <motion.div 
             animate={{ y: [-10, 300] }}
             transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
             className="w-full h-2 bg-slate-900/10 blur-sm"
           />
        </motion.div>
      )}

      {/* Progress Bar (Bottom) */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${holdProgress}%` }}
        className="absolute bottom-0 left-0 h-1.5 bg-slate-900 pointer-events-none z-20 transition-all duration-75"
      />

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
             {order.image_url ? (
                <img src={order.image_url} className="w-full h-full object-cover" alt="" />
             ) : (
                <Package size={28} />
             )}
          </div>
          <div>
            <h3 className="text-[18px] font-bold text-slate-900 tracking-tight mb-1">{order.title || 'Delivery Request'}</h3>
            <div className="flex items-center gap-3">
               <span className="text-[11px] font-bold text-emerald-600">RM {runnerCut.toFixed(2)} payout</span>
               <div className="w-1 h-1 rounded-full bg-slate-200" />
               <div className="flex items-center gap-1">
                  <Zap size={10} className="text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-bold text-amber-500 ">Urgent</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logistics Detail */}
      <div className="space-y-4 mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
             <MapPin size={18} />
          </div>
          <div className="flex-1">
             <p className="text-[9px] font-bold text-[#94a3b8] ">Pickup Point</p>
             <p className="text-[14px] font-bold text-slate-900 truncate">{order.seller_name || 'Merchant point'}</p>
          </div>
        </div>
        <div className="ml-5 h-4 border-l border-dashed border-slate-200" />
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
             <MapPin size={18} />
          </div>
          <div className="flex-1">
             <p className="text-[9px] font-bold text-white/30 ">Drop-off Point</p>
             <p className="text-[14px] font-bold text-slate-900 truncate">{order.drop_off_location}</p>
          </div>
        </div>
      </div>

      {/* Trigger Button */}
      <button
        onMouseDown={() => !disabled && setIsHolding(true)}
        onMouseUp={() => setIsHolding(false)}
        onMouseLeave={() => setIsHolding(false)}
        onTouchStart={() => !disabled && setIsHolding(true)}
        onTouchEnd={() => setIsHolding(false)}
        disabled={disabled}
        className={`w-full h-16 rounded-2xl font-bold text-[14px] transition-all select-none relative z-20 ${
          disabled 
          ? 'bg-slate-50 text-slate-300 cursor-not-allowed' 
          : isHolding 
            ? 'bg-slate-900 text-white scale-[0.98] shadow-md shadow-slate-900/10' 
            : 'bg-slate-50 text-slate-900 border border-slate-100 hover:bg-slate-100'
        }`}
      >
        {disabled ? 'Capacity Reached' : isHolding ? `Accepting Job... ${holdProgress}%` : 'Hold to Accept Job'}
      </button>
    </motion.div>
  );
}

function SuccessOverlay({ onInitiate }: { onInitiate: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onInitiate();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onInitiate]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-1000 bg-slate-900 flex flex-col items-center justify-center p-12 text-center">
       <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mb-10 border border-white/5 shadow-md">
          <Truck size={40} className="text-white" />
       </div>
       <h2 className="text-[32px] font-bold text-white tracking-tight leading-tight mb-4">Job Accepted</h2>
       <p className="text-[14px] font-medium text-white/50 max-w-[200px]">Head to the pickup point to start the delivery.</p>
       <div className="mt-16 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Preparing terminal...</p>
       </div>
    </motion.div>
  );
}

export default function MissionBoard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeMissionsCount, setActiveMissionsCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [securedOrderId, setSecuredOrderId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) { router.push('/auth'); return; }

      onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          setActiveMissionsCount(data?.current_missions?.length || 0);
        }
      });

      const qOrders = query(
        collection(db, 'orders'),
        where('status', 'in', ['AWAITING_RUNNER', 'PREPARING', 'READY_FOR_PICKUP'])
      );
      
      onSnapshot(qOrders, (snap) => {
        const docs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((o: any) => o.delivery_type === 'RUNNER' || o.deliveryType === 'RUNNER');
        
        setOrders(docs.sort((a: any, b: any) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0)));
        setLoading(false);
      });
    });
  }, [router]);

  const handleAccept = async (orderId: string) => {
    if (!auth.currentUser || !profile || activeMissionsCount >= 2) return;
    
    setAcceptingId(orderId);
    try {
      const runnerRef = doc(db, 'users', auth.currentUser.uid);
      const orderRef = doc(db, 'orders', orderId);

      await updateDoc(orderRef, {
        runner_id: auth.currentUser.uid,
        runner_name: profile.full_name || 'Runner',
        status: 'ACCEPTED',
        accepted_at: new Date().toISOString(),
      });

      await updateDoc(runnerRef, {
        current_missions: arrayUnion(orderId)
      });

      setSecuredOrderId(orderId);
      setShowSuccess(true);
    } catch (err) {
      console.error('Accept failed:', err);
      alert('Failed to accept job. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-white pt-32 pb-40 font-sans antialiased text-slate-900">
      <AnimatePresence>
         {showSuccess && (
            <SuccessOverlay onInitiate={() => router.push(`/run/terminal?active=${securedOrderId}`)} />
         )}
      </AnimatePresence>

      <nav className="fixed top-0 left-0 right-0 z-60 px-8 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
         <div className="flex items-center gap-4">
            <BackButton fallback="/run" />
            <p className="text-[15px] font-bold tracking-tight">Find Jobs</p>
         </div>
         <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
      </nav>

      <header className="px-8 mb-12">
         <Heading className="text-[32px] leading-tight">Job Board</Heading>
         <div className="flex items-center gap-3 mt-4">
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
               <span className="text-[10px] font-bold text-slate-900 ">{orders.length} Available</span>
            </div>
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${activeMissionsCount >= 2 ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-slate-50 border-slate-100 text-[#94a3b8]'}`}>
               <span className="text-[10px] font-bold ">Limit: {activeMissionsCount}/2</span>
               {activeMissionsCount >= 2 && <AlertCircle size={12} />}
            </div>
         </div>
      </header>

      <section className="px-8 space-y-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4 text-[#94a3b8]">
             <div className="w-10 h-10 border-4 border-slate-100 border-t-[slate-900] rounded-full animate-spin" />
             <p className="text-[11px] font-bold ">Searching for jobs...</p>
          </div>
        ) : orders.length > 0 ? (
          orders.map((order) => (
            <MissionCard 
              key={order.id} 
              order={order} 
              onAccept={handleAccept} 
              disabled={activeMissionsCount >= 2} 
            />
          ))
        ) : (
          <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center">
             <Radio className="text-slate-100 mb-4" size={48} />
             <p className="text-[14px] font-bold text-[#94a3b8] ">No active jobs found</p>
          </div>
        )}
      </section>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  );
}
