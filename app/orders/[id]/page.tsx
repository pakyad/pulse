"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  ChevronLeft, CheckCircle2, Circle, HelpCircle, 
  ChevronRight, Package, Truck, Check, ShieldCheck, Star,
  MessageSquare, Loader2, Bell, X, Info, Phone, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateOrderStatus } from '@/lib/marketplace-utils';
import ChatOverlay from '@/components/ChatOverlay';
import { updateDoc } from 'firebase/firestore';
import PulseLine from '@/components/shared/PulseLine';

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tx, setTx] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const isDelayed = tx?.status === 'PENDING' && (Date.now() - new Date(tx?.created_at).getTime()) > 300000;

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (unsub) unsub();
        router.push('/auth');
        return;
      }
      setUserId(user.uid);
      const txRef = doc(db, 'transactions', id as string);
      unsub = onSnapshot(txRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setTx({ id: snap.id, ...data });
          
          if (lastStatus && lastStatus !== data.status) {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000);
          }
          setLastStatus(data.status);
        }
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsub) unsub();
    };
  }, [id, router, lastStatus]);

  const handleUpdateStatus = async (nextStatus: string) => {
    if (!userId || !tx) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(tx.id, nextStatus, userId);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getPulseState = (status: string): 'ordered' | 'preparing' | 'delivered' => {
    if (['COMPLETED', 'COLLECTED'].includes(status)) return 'delivered';
    if (['PENDING', 'CONFIRMED'].includes(status)) return 'ordered';
    return 'preparing';
  };

  if (loading || !tx) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-100 border-t-navy rounded-full animate-spin" />
    </div>
  );

  const pulseState = getPulseState(tx.status);

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">
      
      {/* ── Glassmorphism Status Toast ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-8 left-6 right-6 z-[500] bg-white/80 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-6 shadow-3xl flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-navy text-white rounded-2xl flex items-center justify-center shrink-0">
               <Bell size={24} className="animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Status Protocol Update</p>
              <h4 className="text-[14px] font-black uppercase tracking-tight text-navy">
                Asset State: {tx.status.replace(/_/g, ' ')}
              </h4>
            </div>
            <button onClick={() => setShowToast(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
               <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-8 pt-16 pb-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-[100] border-b border-slate-50">
        <button onClick={() => router.back()} className="w-12 h-12 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center transition-all active:scale-90">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">ID #{tx.id.slice(0,6)}</span>
           <h2 className="text-[16px] font-black uppercase tracking-tightest mt-1">Transaction Log</h2>
        </div>
        <button onClick={() => setIsSupportOpen(true)} className="w-12 h-12 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-navy/30">
          <HelpCircle size={24} />
        </button>
      </header>

      <div className="px-8 py-10 space-y-12">
        
        {/* Item Summary (Bento Style) */}
        <section className="bg-white border border-slate-100 rounded-[3rem] p-8 flex items-center gap-8 shadow-sm">
          <div className="w-24 h-24 bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-50 shrink-0">
            <img src={tx.image_url} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{tx.category || 'Asset'}</p>
            <h1 className="text-[24px] font-black text-navy leading-none uppercase tracking-tighter">{tx.title}</h1>
            <div className="flex items-center gap-3">
              <p className="text-[20px] font-black text-navy uppercase">RM {Number(tx.price).toFixed(0)}</p>
              <span className="text-[11px] font-bold text-slate-300">QTY: {tx.quantity || 1}</span>
            </div>
          </div>
        </section>

        {/* The Pulse Line (Mandatory) */}
        <section className="space-y-6">
          <div className="flex justify-between items-baseline px-2">
            <h3 className="text-[18px] font-black text-navy uppercase tracking-tightest">Real-time Pulse</h3>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-navy animate-pulse" />
               <span className="text-[10px] font-black text-navy uppercase tracking-widest">Live Sync</span>
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm">
            <PulseLine state={pulseState} />
          </div>
        </section>

        {/* Handshake Protocol (Buyer View) */}
        {tx.delivery_type === 'RUNNER' && !['COMPLETED', 'COLLECTED'].includes(tx.status) && userId === tx.buyer_id && (
          <section className="space-y-6">
            <h3 className="text-[18px] font-black text-navy uppercase tracking-tightest">Security Handshake</h3>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-navy text-white rounded-[3rem] p-10 flex flex-col items-center gap-8 shadow-2xl shadow-navy/30 border-4 border-white/5"
            >
               <div className="text-center space-y-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">Verification Protocol</p>
                  <p className="text-[15px] font-bold uppercase tracking-wide">Present this code to the Runner node</p>
               </div>
               <div className="grid grid-cols-4 gap-4 w-full">
                  {(tx.handshake_code || '0000').split('').map((char: string, i: number) => (
                    <div key={i} className="aspect-square bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                       <span className="text-[36px] font-black tracking-tighter">{char}</span>
                    </div>
                  ))}
               </div>
               <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 rounded-full border border-white/10">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">End-to-End Secure Handshake</span>
               </div>
            </motion.div>
          </section>
        )}

        {/* Logistics Detail */}
        <section className="bg-white border border-slate-100 rounded-[3rem] p-10 space-y-8 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-navy shrink-0">
               <MapPin size={28} />
            </div>
            <div>
               <p className="text-[16px] font-black uppercase tracking-tightest">Drop-off Node</p>
               <p className="text-[14px] text-slate-400 font-bold leading-relaxed mt-2 uppercase tracking-wide">
                  {tx.drop_off_location || 'Campus Main Hub'}
               </p>
            </div>
          </div>
          
          <div className="h-px bg-slate-50 w-full" />
          
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-navy shrink-0">
               <Store size={28} />
            </div>
            <div>
               <p className="text-[16px] font-black uppercase tracking-tightest">Vendor Origin</p>
               <p className="text-[14px] text-slate-400 font-bold leading-relaxed mt-2 uppercase tracking-wide">
                  {tx.seller_name || 'Verified Merchant Node'}
               </p>
            </div>
          </div>
        </section>

      </div>

      {/* ── Contextual Command Center (Fixed) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[200] px-8 pb-12 pt-8 bg-white/90 backdrop-blur-xl border-t border-slate-50/50">
         <div className="max-w-[480px] mx-auto space-y-4">
            
            {/* Merchant Logic */}
            {userId === tx.seller_id && tx.status === 'PENDING' && (
              <ActionButton 
                label="Accept & Prepare Asset"
                icon={<Package size={24} />}
                onClick={() => handleUpdateStatus('PREPPING')}
                loading={actionLoading}
                color="navy"
              />
            )}

            {userId === tx.seller_id && tx.status === 'PREPPING' && (
              <ActionButton 
                label={tx.delivery_type === 'RUNNER' ? 'Hand Over to Runner' : 'Ready for Collection'}
                icon={<Truck size={24} />}
                onClick={() => handleUpdateStatus(tx.delivery_type === 'RUNNER' ? 'AWAITING_RUNNER' : 'DELIVERING')}
                loading={actionLoading}
                color="emerald"
              />
            )}

            {/* Buyer Logic */}
            {userId === tx.buyer_id && (tx.status === 'DELIVERING' || tx.status === 'ARRIVED') && (
              <ActionButton 
                label="Confirm Secured Delivery"
                icon={<Check size={24} />}
                onClick={() => handleUpdateStatus('COMPLETED')}
                loading={actionLoading}
                color="emerald"
              />
            )}

            <button 
              onClick={() => setIsSupportOpen(true)}
              className="w-full h-16 rounded-[2rem] bg-slate-50 border border-slate-100 font-black text-[13px] uppercase tracking-[0.2em] text-navy active:scale-95 transition-all flex items-center justify-center gap-3"
            >
               <Phone size={18} /> Support Link
            </button>
         </div>
      </div>

      <ChatOverlay 
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        tx_id={tx.id}
        status={tx.status}
        recipientName="Pulse Support Node"
      />
    </main>
  );
}

function ActionButton({ label, onClick, color, loading, icon }: any) {
  const bg = color === 'navy' ? 'bg-navy shadow-navy/30' : 'bg-emerald-500 shadow-emerald-500/30';
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      disabled={loading}
      onClick={onClick}
      className={`w-full h-20 ${bg} text-white rounded-[2.5rem] font-black text-[15px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 transition-all`}
    >
       {loading ? <Loader2 size={24} className="animate-spin" /> : <>{icon} {label} <ArrowRight size={22} /> </>}
    </motion.button>
  );
}
