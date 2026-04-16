"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import HandshakeQR from '@/components/HandshakeQR';
import { ArrowLeft, Package, Zap, ShieldCheck, ChevronRight, Camera, ShoppingBag, User, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function OrderManagement() {
  const { id } = useParams();
  const router = useRouter();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Identity States
  const uid = auth.currentUser?.uid;
  const isSeller = uid === tx?.seller_id;
  const isBuyer = uid === tx?.buyer_id;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
            // Real-time dynamic sync for the transaction status
            const txRef = doc(db, "transactions", id as string);
            const unsubTx = onSnapshot(txRef, (snap) => {
                if (snap.exists()) {
                    setTx({ id: snap.id, ...snap.data() });
                }
                setLoading(false);
            });
            return () => unsubTx();
        } else {
            router.push('/auth');
        }
    });
    return unsubAuth;
  }, [id, router]);

  // 🔥 DEBUGGER ACTIVE: Check your browser console (F12)
  useEffect(() => {
    if (tx) {
        console.log("----------------------------");
        console.log("📡 PULSE IDENTITY DEBUGGER");
        console.log("Current Session UID:", uid);
        console.log("Transaction Seller ID:", tx.seller_id);
        console.log("Transaction Buyer ID:", tx.buyer_id);
        console.log("Is Seller:", isSeller);
        console.log("Is Buyer:", isBuyer);
        console.log("----------------------------");
    }
  }, [tx, uid, isSeller, isBuyer]);

  if (loading || !tx) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-pearl">
            <div className="w-12 h-12 bg-navy animate-pulse rounded-xl" />
            <p className="mt-6 text-[10px] font-black text-navy/20 uppercase tracking-[0.5em]">Establishing Connection...</p>
        </div>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-32 px-6 bg-pearl">
      {/* Upper Navigation & Identity Badge */}
      <header className="max-w-2xl mx-auto mb-10 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-3 bg-white border border-navy/5 rounded-2xl hover:bg-navy hover:text-white transition-all shadow-sm">
            <ArrowLeft size={18} />
          </button>
          
          <div className="soft-lens px-5 py-2.5 rounded-2xl flex items-center gap-3 border border-navy/5 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${isSeller ? 'bg-orange animate-pulse' : isBuyer ? 'bg-navy animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-navy">
                {isSeller ? 'Verified Provider' : isBuyer ? 'Verified Buyer' : 'Unknown Signal'}
            </span>
          </div>
      </header>

      <div className="max-w-lg mx-auto">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hologram-card p-10 bg-white/80 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
        >
            {/* Logic Gate Rendering */}
            <AnimatePresence mode="wait">
                {isSeller && tx.status === 'PENDING' ? (
                    <motion.div 
                        key="seller-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        <header className="text-center mb-8">
                            <p className="text-[10px] text-orange font-black uppercase tracking-[0.4em] mb-2 leading-none">The Provider Protocol</p>
                            <h2 className="text-2xl font-black text-navy uppercase tracking-tighter leading-none italic">Displaying Handshake Signal</h2>
                        </header>
                        <HandshakeQR txId={tx.id} />
                    </motion.div>
                ) : isBuyer && tx.status === 'PENDING' ? (
                    <motion.div 
                        key="buyer-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-8 text-center"
                    >
                        <div className="h-64 hologram-card bg-navy/5 flex flex-col items-center justify-center border-2 border-dashed border-navy/10 relative overflow-hidden">
                            <ShieldCheck size={48} className="text-navy/10 mb-4 animate-pulse" />
                            <p className="text-[11px] font-black text-navy/40 uppercase tracking-[0.3em]">Awaiting Provider Release</p>
                            <div className="absolute top-2 right-2 px-3 py-1 bg-navy/10 rounded-lg">
                                <p className="text-[8px] font-black text-navy">Ref: {tx.claim_token}</p>
                            </div>
                        </div>
                        
                        <Link href="/scanner" className="block w-full bg-navy text-white p-6 rounded-[32px] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:bg-orange transition-all active:scale-95 flex items-center justify-center gap-4 group">
                          <Camera size={20} className="group-hover:rotate-12 transition-transform" />
                          Open Pulse Scanner
                        </Link>
                        
                        <p className="text-[9px] text-navy/20 font-black uppercase tracking-[0.3em] px-4">
                            Locate the Provider and scan their secure handshake signal to finalize the hustle.
                        </p>
                    </motion.div>
                ) : tx.status === 'COLLECTED' ? (
                    <motion.div 
                        key="success-view"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-12 flex flex-col items-center justify-center bg-green-500 rounded-[40px] shadow-2xl"
                    >
                        <ShieldCheck size={48} className="text-white mb-6" />
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">Pulse Completed</h3>
                        <p className="text-[10px] text-white/60 font-black uppercase tracking-widest text-center">Handshake Finalized on Cloud Ledger</p>
                        <button 
                            onClick={() => router.push('/me')}
                            className="mt-10 bg-navy text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                        >
                            Return to Hub
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="unauthorized"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-12 text-center bg-red-50 rounded-[40px] border border-red-100 flex flex-col items-center"
                    >
                         <XCircle size={48} className="text-red-400 mb-6" />
                         <p className="text-red-500 font-black uppercase text-sm tracking-tighter leading-none mb-2">Unauthorized Connection</p>
                         <p className="text-[11px] text-red-400 font-medium leading-relaxed">
                            Your Pulse Identity does not match the Provider or Buyer profiles recorded for this transaction.
                         </p>
                         <button 
                            onClick={() => router.push('/me')}
                            className="mt-10 bg-red-500 text-white px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest"
                         >
                            Emergency Exit
                         </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Verification Footer */}
            <div className="mt-12 pt-8 border-t border-navy/5 flex justify-between items-center opacity-30">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={12} className="text-navy" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none">Security Handshake Verified: {tx.id.slice(0, 8)}</span>
                </div>
                <ChevronRight size={12} />
            </div>
        </motion.div>
      </div>
    </main>
  );
}
