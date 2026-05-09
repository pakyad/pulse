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
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

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
      className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
    >
      {/* Pixelated Scanning Overlay */}
      {isHolding && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-navy/5 pointer-events-none z-10"
        >
           <motion.div 
             animate={{ y: [-10, 300] }}
             transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
             className="w-full h-2 bg-navy/10 blur-sm"
           />
           <div className="absolute inset-0 overflow-hidden opacity-10">
              <div className="grid grid-cols-10 h-full w-full">
                 {Array.from({ length: 50 }).map((_, i) => (
                   <motion.div 
                     key={i} 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: [0, 1, 0] }}
                     transition={{ duration: 0.5, delay: i * 0.02, repeat: Infinity }}
                     className="bg-navy h-4 w-full" 
                   />
                 ))}
              </div>
           </div>
        </motion.div>
      )}

      {/* Progress Bar (Bottom) */}
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${holdProgress}%` }}
        className="absolute bottom-0 left-0 h-1.5 bg-navy pointer-events-none z-20 transition-all duration-75"
      />

      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-navy shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
             {order.image_url ? (
               <img src={order.image_url} className="w-full h-full object-cover" alt="" />
             ) : (
               <Package size={28} />
             )}
          </div>
          <div>
            <h3 className="font-black text-navy text-[18px] tracking-tightest leading-none mb-2 uppercase">{order.title}</h3>
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Yield: RM {runnerCut.toFixed(2)}</span>
               <div className="w-1 h-1 rounded-full bg-slate-200" />
               <div className="flex items-center gap-1">
                  <Zap size={10} className="text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">High Demand</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logistics Detail */}
      <div className="space-y-4 mb-8 bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100/50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          </div>
          <div className="flex-1">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Node Alpha</p>
             <p className="text-[13px] font-bold text-slate-500 truncate">{order.seller_name || 'Merchant Point'}</p>
          </div>
        </div>
        <div className="ml-4 h-4 border-l border-dashed border-slate-200" />
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center">
             <MapPin size={14} fill="currentColor" />
          </div>
          <div className="flex-1">
             <p className="text-[9px] font-black text-navy/30 uppercase tracking-widest">Destination Node</p>
             <p className="text-[13px] font-bold text-navy truncate">{order.drop_off_location}</p>
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
        className={`w-full h-16 rounded-[1.8rem] font-black text-[13px] uppercase tracking-widest transition-all select-none relative z-20 ${
          disabled 
          ? 'bg-slate-50 text-slate-300' 
          : isHolding 
            ? 'bg-navy text-white scale-[0.98] shadow-2xl shadow-navy/30' 
            : 'bg-navy/5 text-navy border border-navy/10 hover:bg-navy/10'
        }`}
      >
        {disabled ? 'Capacity Reached' : isHolding ? `Securing Node... ${holdProgress}%` : 'Hold to Secure Mission'}
      </button>
    </motion.div>
  );
}

function ProtocolSuccessOverlay({ onInitiate }: { onInitiate: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onInitiate();
    }, 2500); // Wait 2.5 seconds for animation then redirect
    return () => clearTimeout(timer);
  }, [onInitiate]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-1000 bg-navy flex flex-col items-center justify-center p-12 text-center"
    >
       {/* Pixel Art Pulse (Simplified CSS) */}
       <div className="relative mb-12">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-white rounded-full blur-3xl"
          />
          <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center relative">
             <Truck size={48} className="text-white" />
          </div>
       </div>

       <h2 className="text-[42px] font-black text-white tracking-tightest leading-none mb-4 uppercase">
          Mission <br/> Secured
       </h2>
       <p className="text-[14px] font-bold text-white/40 uppercase tracking-widest mb-16">
          Commencing Logistics Protocol <br/> Phase 01: Merchant Rendezvous
       </p>

       <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Starting Work...</p>
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
  const [permissionError, setPermissionError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [securedOrderId, setSecuredOrderId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubOrders: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      // Cleanup previous listeners
      if (unsubProfile) unsubProfile();
      if (unsubOrders) unsubOrders();

      if (!user) {
        router.push('/auth');
        return;
      }

      unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          setActiveMissionsCount(data?.current_missions?.length || 0);
        }
      }, (error) => {
        console.error("Profile sync error:", error);
      });

      const qOrders = query(
        collection(db, 'orders'),
        where('status', 'in', ['AWAITING_RUNNER', 'PREPARING', 'READY_FOR_PICKUP'])
      );
      
      unsubOrders = onSnapshot(qOrders, (snap) => {
        const docs = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((o: any) => o.delivery_type === 'RUNNER' || o.deliveryType === 'RUNNER' || o.delivery_type === 'runner' || o.deliveryType === 'runner');
        
        setOrders(docs.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || '')));
        setLoading(false);
        setPermissionError(false);
      }, (error) => {
        console.error("Order pool error:", error);
        setLoading(false);
        if (error.code === 'permission-denied') {
          setPermissionError(true);
        }
      });
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubOrders) unsubOrders();
    };
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
      alert('Mission failed to lock. Re-syncing...');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] pt-32 pb-40 font-sans antialiased text-navy">
      <AnimatePresence>
         {showSuccess && (
            <ProtocolSuccessOverlay onInitiate={() => router.push(`/runner/active?order=${securedOrderId}`)} />
         )}
      </AnimatePresence>

      <nav className="px-8 flex justify-between items-center">
         <button onClick={() => router.push('/home')} className="w-12 h-12 rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center text-navy shadow-sm transition-all active:scale-90">
            <ChevronLeft size={24} />
         </button>
         <div className="flex items-center gap-6">
            <AnimatePresence>
               {activeMissionsCount > 0 && (
                 <motion.button 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   onClick={() => router.push('/run')} 
                   className="w-12 h-12 rounded-[1.5rem] bg-navy text-white flex items-center justify-center shadow-lg shadow-navy/20 relative"
                 >
                    <Zap size={20} fill="currentColor" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                 </motion.button>
               )}
            </AnimatePresence>
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Status</span>
               <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[12px] font-black text-navy uppercase tracking-tight">Searching Nodes</span>
               </div>
            </div>
            <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} userId={auth.currentUser?.uid} />
         </div>
      </nav>

      <header className="px-8 pt-12 pb-8">
         <h1 className="text-[36px] font-black tracking-tightest leading-none mb-4 uppercase">Mission <br/> Pool</h1>
         <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-navy text-white rounded-lg">
               <span className="text-[10px] font-black uppercase tracking-widest">{orders.length} Available</span>
            </div>
            <div className={`px-3 py-1 rounded-lg border flex items-center gap-2 ${activeMissionsCount >= 2 ? 'bg-red-50 border-red-100 text-red-500' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
               <span className="text-[10px] font-black uppercase tracking-widest">Active: {activeMissionsCount}/2</span>
               {activeMissionsCount >= 2 && <AlertCircle size={10} />}
            </div>
         </div>
      </header>

      <section className="px-8 space-y-6">
        {permissionError && (
          <div className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] text-center space-y-3">
             <AlertCircle className="mx-auto text-red-500" size={32} />
             <p className="text-[14px] font-black text-red-600 uppercase tracking-widest">Protocol Blocked</p>
             <p className="text-[12px] text-red-400 font-medium leading-relaxed">Your account lacks clearance to access the mission ledger. Please contact an administrator.</p>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4 text-slate-200">
             <div className="w-10 h-10 border-4 border-slate-100 border-t-navy rounded-full animate-spin" />
             <p className="text-[11px] font-black uppercase tracking-widest">Scanning Network...</p>
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
          !permissionError && (
            <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center">
               <Radio className="text-slate-100 mb-4" size={48} />
               <p className="text-[14px] font-black text-slate-300 uppercase tracking-widest">No active mission signals</p>
            </div>
          )
        )}
      </section>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  );
}
