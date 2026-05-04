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
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Query active orders where user is the runner
        const q = query(
          collection(db, "orders"),
          where("runner_id", "==", user.uid),
          where("status", "in", ["RUNNER_EN_ROUTE_TO_VENDOR", "IN_TRANSIT"])
        );
        const unsubJobs = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            setActiveTask({ id: doc.id, ...doc.data() });
          } else {
            setActiveTask(null);
          }
        }, (err) => {
           console.error("FloatingActiveTask Error:", err);
        });
        return () => unsubJobs();
      } else {
        setActiveTask(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // Hide on auth pages, the terminal itself (where the full manifest is), and admin/merchant routes
  if (!activeTask) return null;
  if (pathname?.startsWith('/auth') || pathname === '/run/terminal' || pathname?.startsWith('/admin') || pathname?.startsWith('/merchant')) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50">
      <Link href="/run/terminal" className="block w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] p-4 active:scale-[0.98] transition-transform">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Live Indicator (Muted White) */}
            <div className="relative flex items-center justify-center w-2.5 h-2.5">
              <div className="absolute inset-0 bg-gray-400 rounded-full opacity-40 animate-ping"></div>
              <div className="relative w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"></div>
            </div>
            
            {/* Text Stack */}
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-white leading-none mb-1.5">
                {activeTask.status === 'RUNNER_EN_ROUTE_TO_VENDOR' ? 'Heading to Vendor' : 'Delivering Order'}
              </span>
              <span className="text-[11px] font-medium text-gray-400 tracking-wide">
                Active Delivery • 8 mins est.
              </span>
            </div>
          </div>
          
          {/* Action (Clean Circular Icon) */}
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      </Link>
    </div>
  );
}
