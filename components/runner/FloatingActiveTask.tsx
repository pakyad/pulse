"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function FloatingActiveTask() {
  const pathname = usePathname();
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
          where("status", "in", ["ON_THE_WAY", "PICKED_UP", "ARRIVED"])
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

  // Hide on auth pages, the terminal itself (where the full manifest is), admin/merchant routes, and the active mission Delivery Hub
  if (!activeTask) return null;
  if (pathname?.startsWith('/auth') || pathname === '/run/terminal' || pathname === '/run/missions' || pathname?.startsWith('/admin') || pathname?.startsWith('/merchant')) return null;

  const isErrand = activeTask.type?.toUpperCase() === 'ERRANDS';
  const isParcel = activeTask.type?.toUpperCase() === 'PARCELS';
  const tintBg = isErrand ? 'bg-rose-50' : (isParcel ? 'bg-cyan-50' : 'bg-slate-50');
  const tintBorder = isErrand ? 'border-rose-200' : (isParcel ? 'border-cyan-200' : 'border-slate-200');
  const tintText = isErrand ? 'text-rose-950' : (isParcel ? 'text-cyan-950' : 'text-slate-900');
  const tintSub = isErrand ? 'text-rose-600/80' : (isParcel ? 'text-cyan-600/80' : 'text-slate-500');
  const arrowBg = isErrand ? 'bg-rose-200/50 text-rose-700' : (isParcel ? 'bg-cyan-200/50 text-cyan-700' : 'bg-white text-slate-900 border border-slate-200 shadow-sm');

  return (
    <div className="fixed top-24 left-4 right-4 z-80">
      <Link href="/run/terminal" className={`block w-full ${tintBg} border ${tintBorder} rounded-[24px] shadow-sm p-4 active:scale-95 transition-transform`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Live Indicator */}
            <div className="relative flex items-center justify-center w-2.5 h-2.5">
              <div className="absolute inset-0 bg-emerald-500 rounded-full opacity-40 animate-ping"></div>
              <div className="relative w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
            </div>
            
            {/* Text Stack */}
            <div className="flex flex-col">
              <span className={`text-[15px] font-bold ${tintText} leading-none mb-1.5 tracking-tight`}>
                {activeTask.status === 'PICKED_UP' ? 'Delivery in Progress' : 'Assigned Order'}
              </span>
              <span className={`text-[11px] font-bold ${tintSub} tracking-wide`}>
                ID: {activeTask.id.substring(0, 8).toUpperCase()} • {activeTask.items?.[0]?.name || activeTask.title || 'Mission Item'}
              </span>
            </div>
          </div>
          
          {/* Action (Clean Circular Icon) */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${arrowBg}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      </Link>
    </div>
  );
}
