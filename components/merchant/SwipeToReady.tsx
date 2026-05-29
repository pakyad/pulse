"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useAnimation } from 'framer-motion';
import { ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function SwipeToReady({ orderId, onSuccess }: { orderId: string, onSuccess?: () => void }) {
  const [isDone, setIsDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragBound, setDragBound] = useState(0);
  const controls = useAnimation();
  const x = useMotionValue(0);

  useEffect(() => {
    if (containerRef.current) {
      // Container width minus thumb width (40px) and left/right padding (8px)
      setDragBound(containerRef.current.offsetWidth - 40 - 8); 
    }
    
    // Update on resize
    const handleResize = () => {
      if (containerRef.current) {
        setDragBound(containerRef.current.offsetWidth - 40 - 8);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDragEnd = async (event: any, info: any) => {
    const threshold = dragBound * 0.75; // Must swipe 75% of the way to trigger
    
    if (info.offset.x >= threshold) {
      controls.start({ x: dragBound });
      setIsLoading(true);
      try {
        await updateDoc(doc(db, "orders", orderId), { 
          status: 'READY_FOR_PICKUP',
          ready_at: serverTimestamp() 
        });
        setIsDone(true);
        if (onSuccess) onSuccess();
      } catch (e) {
        console.error("Failed to update order status", e);
        controls.start({ x: 0 }); // Snap back on failure
      } finally {
        setIsLoading(false);
      }
    } else {
      controls.start({ x: 0 }); // Snap back if threshold not met
    }
  };

  if (isDone) {
    return (
      <div className="w-full h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-[11px] tracking-widest uppercase shadow-sm shadow-slate-900/5 transition-all">
        <CheckCircle2 size={16} className="mr-2 text-emerald-400" /> Ready for Pickup
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-11 bg-slate-50 border-[0.5px] border-slate-200 rounded-xl overflow-hidden flex items-center justify-center touch-none select-none"
    >
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none z-0 ml-4">
        Swipe to ready
      </span>
      
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: dragBound > 0 ? dragBound : 200 }}
        dragElastic={0}
        dragMomentum={false}
        animate={controls}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="absolute left-1 top-1 bottom-1 w-10 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center text-[#000000] z-10 cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-colors"
      >
        {isLoading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : <ChevronRight size={16} strokeWidth={2.5} />}
      </motion.div>
    </div>
  );
}
