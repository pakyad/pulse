"use client";
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function SwipeToReady({ orderId, onSuccess }: { orderId: string, onSuccess?: () => void }) {
  const [isDone, setIsDone] = useState(false);
  const x = useMotionValue(0);
  
  // Transform background color based on drag
  const bg = useTransform(x, [0, 200], ['#f8fafc', '#10b981']);
  const textColor = useTransform(x, [0, 200], ['#94a3b8', '#ffffff']);
  
  const handleDragEnd = async (event: any, info: any) => {
    if (info.offset.x > 150) {
      setIsDone(true);
      try {
        await updateDoc(doc(db, "orders", orderId), { status: 'READY_FOR_PICKUP' });
        if (onSuccess) onSuccess();
      } catch (e) {
        console.error("Failed to update order status", e);
        setIsDone(false); // Reset if failed
        x.set(0);
      }
    } else {
      x.set(0); // Snap back
    }
  };

  if (isDone) {
    return (
      <div className="w-full h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-[13px] tracking-widest uppercase shadow-lg shadow-emerald-500/20">
        <Check size={18} className="mr-2" /> Ready for Pickup
      </div>
    );
  }

  return (
    <motion.div 
      style={{ background: bg }}
      className="relative w-full h-14 rounded-full border border-slate-100 overflow-hidden flex items-center justify-center touch-none"
    >
      <motion.span 
        style={{ color: textColor }}
        className="text-[12px] font-bold uppercase tracking-[0.2em] pointer-events-none z-0"
      >
        Swipe to mark ready
      </motion.span>
      
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 200 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute left-1 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 z-10 cursor-grab active:cursor-grabbing"
      >
        <ChevronRight size={20} />
      </motion.div>
    </motion.div>
  );
}
