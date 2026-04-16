"use client";

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { CheckCircle2, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HandshakeQRProps {
  txId: string;
}

export default function HandshakeQR({ txId }: HandshakeQRProps) {
  const [status, setStatus] = useState('PENDING');

  useEffect(() => {
    // Synchronize with the cloud Pulse to detect the exact moment of handshake
    const unsubscribe = onSnapshot(doc(db, "transactions", txId), (docSnap) => {
      if (docSnap.exists()) {
        setStatus(docSnap.data().status);
      }
    });
    return () => unsubscribe();
  }, [txId]);

  return (
    <AnimatePresence mode="wait">
      {status === 'COLLECTED' ? (
        <motion.div 
          key="success"
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-12 bg-white/60 backdrop-blur-xl rounded-[40px] border border-green-500/20 shadow-[0_20px_50px_rgba(34,197,94,0.15)]"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
             <CheckCircle2 size={40} className="text-white animate-pulse" />
          </div>
          <h4 className="text-xl font-black text-navy uppercase tracking-tighter leading-none mb-2">Handshake Complete</h4>
          <p className="text-[10px] text-navy/40 font-black uppercase tracking-[0.3em]">Hustle Points Transferred</p>
        </motion.div>
      ) : (
        <motion.div 
          key="qr-gate"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex flex-col items-center gap-8 p-10 bg-white/40 backdrop-blur-3xl rounded-[40px] border border-navy/5 shadow-2xl relative overflow-hidden"
        >
          {/* Tactical Decor */}
          <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-orange/5 rounded-full blur-[60px]" />
          
          <div className="relative p-6 bg-white rounded-[32px] shadow-inner border border-navy/5">
            <QRCodeSVG 
              value={txId} 
              size={220}
              fgColor="#001F3F" // Solid Navy
              level="H"
              includeMargin={true}
            />
            {/* Center Eye Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white p-1 rounded-lg">
                    <Zap className="text-orange w-6 h-6 fill-orange" />
                </div>
            </div>
          </div>

          <div className="text-center relative z-10">
            <div className="flex items-center justify-center gap-2 mb-3">
               <ShieldCheck size={14} className="text-orange" />
               <p className="text-[10px] text-navy/50 font-black uppercase tracking-[0.3em]">Secure Handshake Signal</p>
            </div>
            <p className="text-sm font-black text-navy uppercase tracking-tight">Show this to the Field Runner</p>
            <div className="flex items-center justify-center gap-1.5 mt-4">
               <div className="w-1.5 h-1.5 rounded-full bg-orange animate-ping" />
               <span className="text-[8px] font-black text-navy/30 uppercase tracking-widest leading-none">Broadcasting ID: {txId.slice(0, 8)}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
