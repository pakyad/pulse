"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface IncomingOrderAlertProps {
  order: any;
  onAccept?: () => void;
}

export default function IncomingOrderAlert({ order, onAccept }: IncomingOrderAlertProps) {
  const [timeLeft, setTimeLeft] = useState(10);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleAccept();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAccept = async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: 'PREPARING',
        merchant_accepted_at: serverTimestamp(),
      });
      if (onAccept) onAccept();
    } catch (error) {
      console.error("Failed to accept order:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-24 left-6 right-6 z-100 bg-[#1e293b] rounded-[32px] shadow-2xl overflow-hidden border border-white/10"
    >
      {/* Timer Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
        <motion.div 
          className="h-full bg-blue-500"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 10, ease: "linear" }}
        />
      </div>

      <div className="p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-white tracking-tight leading-none mb-1">Incoming Order</p>
            <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest">
              Auto-Accept in {timeLeft}s
            </p>
          </div>
        </div>

        <button
          onClick={handleAccept}
          disabled={isAccepting}
          className="h-12 px-6 bg-white text-[#1e293b] rounded-2xl font-bold text-[13px] flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          {isAccepting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Accept
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
