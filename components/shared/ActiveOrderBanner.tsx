'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Package, ArrowRight } from 'lucide-react';

const ACTIVE_STATUSES = [
  'PENDING', 'PENDING_VENDOR', 'PENDING_RUNNER', 'PREPARING',
  'READY_FOR_PICKUP', 'AWAITING_RUNNER', 'PICKED_UP',
  'IN_TRANSIT', 'ON_THE_WAY', 'ARRIVED_AT_DESTINATION',
];

function statusLabel(raw: string): string {
  const MAP: Record<string, string> = {
    PENDING: 'Waiting', PENDING_VENDOR: 'Waiting',
    PENDING_RUNNER: 'Finding Runner', AWAITING_RUNNER: 'Finding Runner',
    PREPARING: 'Preparing', READY_FOR_PICKUP: 'Ready for Pickup',
    PICKED_UP: 'Picked Up', IN_TRANSIT: 'In Transit',
    ON_THE_WAY: 'On the Way', ARRIVED_AT_DESTINATION: 'Almost There',
  };
  return MAP[(raw || '').toUpperCase()] ?? (raw || '').replace(/_/g, ' ');
}

export default function ActiveOrderBanner() {
  const router = useRouter();
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let uOrder: () => void;
    
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(
          collection(db, 'orders'),
          where('buyer_id', '==', user.uid),
          where('status', 'in', ACTIVE_STATUSES)
        );
        uOrder = onSnapshot(q, (snap) => {
          if (snap.empty) {
            setActiveOrder(null);
            setLoading(false);
            return;
          }
          const sorted = snap.docs
            .map(d => ({ id: d.id, ...d.data() as any }))
            .sort((a, b) => {
              const ta = a.created_at?.toMillis?.() ?? new Date(a.created_at || 0).getTime();
              const tb = b.created_at?.toMillis?.() ?? new Date(b.created_at || 0).getTime();
              return tb - ta;
            });
          setActiveOrder(sorted[0] ?? null);
          setLoading(false);
        });
      } else {
        setActiveOrder(null);
        setLoading(false);
      }
    });
    
    return () => {
      unsubAuth();
      if (uOrder) uOrder();
    };
  }, []);

  if (loading || !activeOrder) return null;

  const code = `#${(activeOrder.order_code || activeOrder.id?.slice(0, 6) || '------').toUpperCase()}`;
  const isMoving = ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'ARRIVED_AT_DESTINATION']
    .includes((activeOrder.status || '').toUpperCase());

  return (
    <AnimatePresence>
      <motion.section initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
        <button
          onClick={() => router.push(`/orders/${activeOrder.id}`)}
          className="w-full text-left bg-amber-50 border border-amber-200/60 rounded-2xl p-5 flex items-center justify-between group active:scale-95 transition-transform shadow-[0_2px_10px_-4px_rgba(251,191,36,0.1)]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100/80 rounded-xl flex items-center justify-center shrink-0">
              <Package size={17} className="text-amber-700" />
            </div>
            <div className="space-y-1">
              <p className="text-[13px] font-bold text-amber-900 leading-none truncate max-w-[180px]">
                {activeOrder.title || 'Your Order'}
              </p>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMoving ? 'bg-amber-400 animate-pulse' : 'bg-amber-300'}`} />
                <span className="text-[11px] font-semibold text-amber-700">{statusLabel(activeOrder.status)}</span>
                <span className="text-[11px] font-medium text-amber-600/60">{code}</span>
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-amber-600/40 group-hover:text-amber-600/70 transition-colors shrink-0" />
        </button>
      </motion.section>
    </AnimatePresence>
  );
}
