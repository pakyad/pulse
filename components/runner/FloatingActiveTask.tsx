"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { Truck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingActiveTask() {
  const [activeTask, setActiveTask] = useState<any>(null);

  useEffect(() => {
    let unsubJobs: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubJobs) unsubJobs();
      
      if (user) {
        // Query active orders where user is the runner
        const q = query(
          collection(db, "orders"),
          where("runner_id", "==", user.uid),
          where("status", "in", [
            "PREPARING", "READY_FOR_PICKUP", "ARRIVED_AT_MERCHANT", "ARRIVED_AT_PICKUP", 
            "PICKED_UP", "IN_TRANSIT", "ON_THE_WAY", "RUNNER_DELIVERING", 
            "ARRIVED_AT_BUILDING", "ARRIVED_AT_BUYER", "ARRIVED_AT_DESTINATION", "ARRIVED"
          ])
        );
        unsubJobs = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            setActiveTask({ id: doc.id, ...doc.data() });
          } else {
            setActiveTask(null);
          }
        }, (err) => {
           console.error("FloatingActiveTask Error:", err);
        });
      } else {
        setActiveTask(null);
      }
    });

    return () => {
      unsubAuth();
      if (unsubJobs) unsubJobs();
    };
  }, []);

  if (!activeTask) return null;

  const isMoving = ['ON_THE_WAY', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(activeTask.status?.toUpperCase() || '');
  const code = `#${activeTask.id.substring(0, 6).toUpperCase()}`;

  return (
    <AnimatePresence>
      <motion.section initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
        <Link
          href="/run/missions"
          className="w-full text-left bg-amber-50 border border-amber-200/60 rounded-2xl p-5 flex items-center justify-between group active:scale-95 transition-transform shadow-[0_2px_10px_-4px_rgba(251,191,36,0.1)] pointer-events-auto"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100/80 rounded-xl flex items-center justify-center shrink-0">
              <Truck size={17} className="text-amber-700" />
            </div>
            <div className="space-y-1">
              <p className="text-[13px] font-bold text-amber-900 leading-none truncate max-w-[180px]">
                {activeTask.items?.[0]?.title || activeTask.title || 'Mission Order'}
              </p>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMoving ? 'bg-amber-400 animate-pulse' : 'bg-amber-300'}`} />
                <span className="text-[11px] font-semibold text-amber-700">
                  {activeTask.status === 'PICKED_UP' || activeTask.status === 'ON_THE_WAY' ? 'In Progress' : 'Assigned Task'}
                </span>
                <span className="text-[11px] font-medium text-amber-600/60">{code}</span>
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-amber-600/40 group-hover:text-amber-600/70 transition-colors shrink-0" />
        </Link>
      </motion.section>
    </AnimatePresence>
  );
}
