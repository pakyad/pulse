"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Phone, MessageSquare, Star, Package } from 'lucide-react';

interface OrderTrackerProps {
  order: any;
}

export function getTrackerStep(status: string) {
  const s = (status || '').toUpperCase();
  if (['DELIVERED', 'COMPLETED'].includes(s)) return 4;
  if (['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(s)) return 3;
  if (['PREPARING', 'READY_FOR_PICKUP', 'ACCEPTED_BY_RUNNER'].includes(s)) return 2;
  return 1;
}

export default function OrderTracker({ order }: OrderTrackerProps) {
  const step = getTrackerStep(order.status);
  const labels = ['Ordered', 'Preparing', 'On The Way', 'Arrived'];
  const deliveryPhoto = order.delivery_proof_url;

  return (
    <div className="space-y-10">
      {/* ── HEADER ── */}
      <div className="px-2">
        <h2 className="text-[20px] font-bold text-[#1e293b] tracking-tight mb-1">
          {step === 4 ? 'Delivered' : step === 3 ? 'Runner is on the way' : step === 2 ? 'Preparing your order' : 'Finding a runner'}
        </h2>
        <p className="text-[13px] font-medium text-[#94a3b8]">
          {step === 4 ? 'Enjoy your order! Rate your experience below.' : 'Live update from the Pulse campus network.'}
        </p>
      </div>

      {/* ── VIBRANT 4-STEP PROGRESS BAR ── */}
      <div className="flex items-center justify-between relative px-6">
        <div className="absolute left-10 right-10 top-[11px] h-[1.5px] bg-slate-100 z-0"></div>
        <motion.div 
          className="absolute left-10 top-[11px] h-[1.5px] bg-[#6366f1] z-0 shadow-[0_0_8px_rgba(99,102,241,0.4)]" 
          initial={{ width: 0 }}
          animate={{ width: `calc(${((step - 1) / 3) * 100}% - 4px)` }}
          transition={{ duration: 0.8, ease: "circOut" }}
        />
        
        {labels.map((label, i) => {
          const isPast = step > i + 1;
          const isCurrent = step === i + 1;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-3">
              <motion.div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all duration-500 border-2 ${
                   isPast ? 'bg-[#6366f1] border-[#6366f1] text-white' : 
                   isCurrent ? 'bg-white border-[#6366f1] text-[#6366f1] shadow-[0_0_12px_rgba(99,102,241,0.3)]' : 
                   'bg-white border-slate-200 text-slate-300'
                }`}
                animate={isCurrent ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ repeat: isCurrent ? Infinity : 0, duration: 2.5 }}
              >
                {isPast ? <CheckCircle2 size={12} strokeWidth={3} /> : (
                   <span className={`font-black ${isCurrent ? 'text-[#6366f1]' : ''}`}>{i + 1}</span>
                )}
              </motion.div>
              <span className={`text-[10px] font-black uppercase tracking-widest absolute -bottom-6 w-max transition-colors duration-500 ${isPast || isCurrent ? 'text-[#1e293b]' : 'text-slate-300'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="h-2"></div>

      {/* ── RUNNER IDENTITY VIBRANCY ── */}
      {(order.runner_id || step >= 3) && (
        <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-inner">
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${order.runner_name || 'Runner'}`} className="w-full h-full object-cover" alt="Runner" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[15px] font-bold text-[#1e293b]">{order.runner_name || 'Pulse Runner'}</p>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 text-[11px] font-black text-amber-500">
                  <Star size={12} fill="currentColor" />
                  <span>4.9</span>
                </div>
                <span className="text-slate-200">·</span>
                <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-tight">Verified Student</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#1e293b] hover:bg-[#6366f1] hover:text-white transition-all active:scale-90 border border-slate-100">
              <Phone size={16} />
            </button>
            <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#1e293b] hover:bg-[#6366f1] hover:text-white transition-all active:scale-90 border border-slate-100">
              <MessageSquare size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── ITEM SUMMARY VIBRANCY ── */}
      <div className="px-2">
        <div className="flex items-center gap-4 bg-white border border-slate-50 rounded-2xl p-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
            {order.image_url || order.images?.[0] ? (
              <img src={order.image_url || order.images?.[0]} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-200">
                <Package size={20} strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-[#1e293b] truncate">{order.title}</p>
            <p className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-tight">{order.seller_name || 'Merchant'}</p>
          </div>
          <div className="text-right">
             <p className="text-[15px] font-black text-[#1e293b]">RM {Number(order.price).toFixed(2)}</p>
             <p className="text-[9px] font-bold text-[#6366f1] uppercase tracking-widest">Paid</p>
          </div>
        </div>
      </div>

      {/* ── DELIVERY PROOF ── */}
      {step === 4 && deliveryPhoto && (
        <div className="px-2">
          <button className="w-full py-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center gap-3 text-[12px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95">
            <CheckCircle2 size={16} />
            View Delivery Photo
          </button>
        </div>
      )}
    </div>
  );
}
