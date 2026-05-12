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

  // Optional: Delivery Photo
  const deliveryPhoto = order.delivery_proof_url;

  return (
    <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm space-y-8">
      {/* ── HEADER ── */}
      <div>
        <h2 className="text-[18px] font-black text-[#1e293b] tracking-tight mb-1">
          {step === 4 ? 'Delivered' : step === 3 ? 'Runner is on the way' : step === 2 ? 'Preparing your order' : 'Finding a runner'}
        </h2>
        <p className="text-[13px] font-medium text-[#94a3b8]">
          {step === 4 ? 'Enjoy your order! Rate your experience below.' : 'Live update from the Pulse campus network.'}
        </p>
      </div>

      {/* ── 4-STEP PROGRESS BAR ── */}
      <div className="flex items-center justify-between relative px-2">
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-px bg-slate-100 z-0"></div>
        <motion.div 
          className="absolute left-4 top-1/2 -translate-y-1/2 h-[1.5px] bg-teal-500 z-0" 
          initial={{ width: 0 }}
          animate={{ width: `calc(${((step - 1) / 3) * 100}% - 16px)` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        
        {labels.map((label, i) => {
          const isPast = step > i + 1;
          const isCurrent = step === i + 1;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-2">
              <motion.div 
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-colors duration-300 ${isPast || isCurrent ? 'bg-[#1e293b] text-white ring-4 ring-white' : 'bg-white border border-slate-200 text-slate-300 ring-4 ring-white'}`}
                animate={isCurrent ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
              >
                {isPast ? <CheckCircle2 size={14} /> : (i + 1)}
              </motion.div>
              <span className={`text-[10px] font-bold absolute -bottom-6 w-max ${isPast || isCurrent ? 'text-[#1e293b]' : 'text-[#94a3b8]'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* spacer for labels */}
      <div className="h-2"></div>

      {/* ── RUNNER IDENTITY NODE ── */}
      {(order.runner_id || step >= 3) && (
        <div className="flex items-center justify-between py-4 border-t border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
              <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${order.runner_name || 'Runner'}`} className="w-full h-full object-cover" alt="Runner" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[#1e293b]">{order.runner_name || 'Pulse Runner'}</p>
              <div className="flex items-center gap-1 mt-0.5 text-[12px] font-medium text-[#94a3b8]">
                <Star size={12} className="text-amber-400" fill="currentColor" />
                <span>4.9</span>
                <span className="mx-1">·</span>
                <span>Verified Student</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-[#1e293b] active:scale-95 transition-all hover:bg-slate-50">
              <Phone size={16} />
            </button>
            <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-[#1e293b] active:scale-95 transition-all hover:bg-slate-50">
              <MessageSquare size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── ITEM SUMMARY ── */}
      <div className="pt-2">
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-3">
          <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 overflow-hidden shrink-0">
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
            <p className="text-[11px] font-medium text-[#94a3b8]">{order.seller_name || 'Pulse Student'}</p>
          </div>
          <p className="text-[14px] font-bold text-[#1e293b] shrink-0">RM {Number(order.price).toFixed(2)}</p>
        </div>
      </div>

      {/* ── DELIVERY PHOTO (If completed) ── */}
      {step === 4 && deliveryPhoto && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button className="flex items-center gap-2 text-[13px] font-bold text-[#1e293b] hover:text-teal-600 transition-colors">
            <CheckCircle2 size={16} className="text-teal-500" />
            View Delivery Photo
          </button>
        </div>
      )}
    </div>
  );
}
