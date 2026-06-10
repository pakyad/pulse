"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageSquare, Star, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

const PixelReceipt = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className={className} shapeRendering="crispEdges">
    <rect x="4" y="2" width="12" height="2" />
    <rect x="4" y="16" width="12" height="2" />
    <rect x="4" y="4" width="2" height="12" />
    <rect x="14" y="4" width="2" height="12" />
    <rect x="7" y="6" width="6" height="2" />
    <rect x="7" y="10" width="4" height="2" />
  </svg>
);

const PixelBox = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className={className} shapeRendering="crispEdges">
    <rect x="3" y="5" width="14" height="2" />
    <rect x="3" y="15" width="14" height="2" />
    <rect x="3" y="7" width="2" height="8" />
    <rect x="15" y="7" width="2" height="8" />
    <rect x="9" y="7" width="2" height="8" />
    <rect x="5" y="9" width="4" height="2" />
    <rect x="11" y="9" width="4" height="2" />
  </svg>
);

const PixelTruck = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className={className} shapeRendering="crispEdges">
    <rect x="2" y="5" width="10" height="2" />
    <rect x="2" y="7" width="2" height="6" />
    <rect x="2" y="13" width="10" height="2" />
    <rect x="10" y="7" width="2" height="6" />
    <rect x="12" y="8" width="6" height="2" />
    <rect x="16" y="10" width="2" height="5" />
    <rect x="12" y="13" width="4" height="2" />
    <rect x="4" y="15" width="3" height="2" />
    <rect x="12" y="15" width="3" height="2" />
  </svg>
);

const PixelPin = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className={className} shapeRendering="crispEdges">
    <rect x="7" y="2" width="6" height="2" />
    <rect x="5" y="4" width="2" height="6" />
    <rect x="13" y="4" width="2" height="6" />
    <rect x="7" y="10" width="2" height="2" />
    <rect x="11" y="10" width="2" height="2" />
    <rect x="9" y="12" width="2" height="6" />
    <rect x="9" y="5" width="2" height="2" />
  </svg>
);

interface OrderTrackerProps {
  order: any;
  runnerProfile?: { name: string, photo: string } | null;
}

export function getTrackerStep(status: string) {
  const s = (status || '').toUpperCase();
  if (['DELIVERED', 'COMPLETED'].includes(s)) return 4;
  if (['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(s)) return 3;
  if (['PREPARING', 'READY_FOR_PICKUP', 'ACCEPTED_BY_RUNNER'].includes(s)) return 2;
  return 1;
}

export default function OrderTracker({ order, runnerProfile }: OrderTrackerProps) {
  const step = getTrackerStep(order.status);
  const isCustom = ['PARCELS', 'ERRANDS'].includes(order.type?.toUpperCase());
  const stepsData = isCustom 
    ? [
        { label: 'Requested', Icon: PixelReceipt },
        { label: 'Found', Icon: PixelBox },
        { label: 'Delivering', Icon: PixelTruck },
        { label: 'Arrived', Icon: PixelPin },
      ]
    : [
        { label: 'Ordered', Icon: PixelReceipt },
        { label: 'Preparing', Icon: PixelBox },
        { label: 'On The Way', Icon: PixelTruck },
        { label: 'Arrived', Icon: PixelPin },
      ];

  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!order.runner_conversationId) return;
    const unsub = onSnapshot(doc(db, 'chats', order.runner_conversationId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.last_message_sender_id !== auth.currentUser?.uid && data.unread_count > 0) {
          setUnreadCount(data.unread_count);
        } else {
          setUnreadCount(0);
        }
      }
    });
    return () => unsub();
  }, [order.runner_conversationId]);

  const isCancelled = order.status?.toUpperCase() === 'CANCELLED';

  const getHeaderText = () => {
    if (isCancelled) return 'Order Cancelled';
    if (step === 4) return 'Delivered';
    if (step === 3) return isCustom ? 'Runner is heading to drop-off' : 'Runner is on the way';
    if (step === 2) return isCustom ? 'Runner is heading to pickup' : 'Preparing your order';
    return isCustom ? 'Finding a runner' : 'Waiting for merchant';
  };

  const runnerName = runnerProfile?.name || order.runner_name || 'Pulse Runner';
  const runnerPhoto = runnerProfile?.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${runnerName}`;

  return (
    <div className="space-y-10">
      {/*  HEADER  */}
      {step >= 3 && (
        <div className="px-2">
          <h2 className="text-[20px] font-bold text-slate-900 tracking-tight mb-1">
            {getHeaderText()}
          </h2>
        </div>
      )}

      {/*  CRISP PIXEL 4-STEP PROGRESS BAR  */}
      <div className="flex items-center justify-between relative px-4 mt-2">
        <div className="absolute left-[36px] right-[36px] top-[20px] h-[2px] bg-slate-100 z-0"></div>
        <motion.div 
          className="absolute left-[36px] right-[36px] top-[20px] h-[2px] bg-slate-900 z-0 origin-left" 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: (step - 1) / 3 }}
          transition={{ duration: 0.8, ease: "circOut" }}
        />
        
        {stepsData.map((stepData, i) => {
          const isPast = step > i + 1;
          const isCurrent = step === i + 1;
          const IconComponent = stepData.Icon;
          
          return (
            <div key={stepData.label} className="relative z-10 flex flex-col items-center gap-3">
              <motion.div 
                className={`w-10 h-10 rounded-[6px] flex items-center justify-center transition-all duration-300 border-2 ${
                   isCancelled ? 'bg-white border-slate-200 text-slate-300' :
                   isPast ? 'bg-slate-900 border-slate-900 text-white' : 
                   isCurrent ? 'bg-white border-slate-900 text-slate-900 shadow-[2px_4px_0_rgba(15,23,42,1)] -translate-y-1' : 
                   'bg-white border-slate-200 text-slate-300'
                }`}
                animate={isCurrent && !isCancelled ? { scale: [1, 1.02, 1] } : { scale: 1 }}
                transition={{ repeat: isCurrent && !isCancelled ? Infinity : 0, duration: 2.5 }}
              >
                <IconComponent className="w-5 h-5 currentColor" />
              </motion.div>
              <span className={`text-[10px] font-bold absolute -bottom-6 w-max transition-colors duration-500 ${isCancelled ? 'text-slate-300' : (isPast || isCurrent ? 'text-slate-900' : 'text-[#94a3b8]')}`}>
                {stepData.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="h-2"></div>

      {/*  RUNNER IDENTITY VIBRANCY  */}
      {(order.runner_id || step >= 3) && (
        <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-inner">
              <img src={runnerPhoto} className="w-full h-full object-cover" alt="Runner" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[15px] font-bold text-slate-900">{runnerName}</p>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                  <Star size={12} fill="currentColor" />
                  <span>4.9</span>
                </div>
                <span className="text-slate-200"></span>
                <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-tight">Verified Student</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-amber-500 hover:text-white transition-all active:scale-95 border border-slate-100">
              <Phone size={16} />
            </button>
            <button 
              onClick={() => {
                const targetId = order.runner_conversationId || order.conversationId;
                if (targetId) {
                  router.push(`/messages/${targetId}`);
                }
              }}
              className="relative w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-amber-500 hover:text-white transition-all active:scale-95 border border-slate-100"
            >
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow-sm ring-2 ring-white animate-bounce">
                  {unreadCount}
                </div>
              )}
              <MessageSquare size={16} />
            </button>
          </div>
        </div>
      )}



      {/*  DELIVERY PROOF (REMOVED: Using Single Chat Hub Instead)  */}
    </div>
  );
}
