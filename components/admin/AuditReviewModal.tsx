"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, AlertCircle, Trash2, CheckCircle } from 'lucide-react';

interface AuditReviewModalProps {
  item: any | null;
  limit: number;
  isRegulated: boolean;
  onClose: () => void;
  onSuspend: (id: string) => void;
  onDismiss: (id: string) => void;
}

export default function AuditReviewModal({ item, limit, isRegulated, onClose, onSuspend, onDismiss }: AuditReviewModalProps) {
  if (!item) return null;

  const violationAmount = item.price - limit;
  const violationPercent = (violationAmount / limit) * 100;

  const accentColor = isRegulated ? 'text-red-600' : 'text-amber-600';
  const bgColor = isRegulated ? 'bg-red-50' : 'bg-amber-50';
  const iconColor = isRegulated ? 'text-red-500' : 'text-amber-500';
  const labelText = isRegulated ? 'Audit Required' : 'Market Advisory';
  const subLabelText = isRegulated ? 'Registry Violation Directive' : 'High Market Value Alert';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
        />

        {/* Modal */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-[0_48px_96px_-24px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100"
        >
          {/* Header */}
          <div className="bg-white px-10 pt-10 pb-6 border-b border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 ${bgColor} ${iconColor} rounded-xl flex items-center justify-center`}>
                   <ShieldAlert size={20} />
                 </div>
                 <div>
                    <h2 className={`text-[17px] font-bold ${accentColor} tracking-tight uppercase`}>{labelText}</h2>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mt-1">{subLabelText}</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 text-slate-300 hover:text-slate-900 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-10 space-y-10">
            {/* Asset Intel */}
            <div className="flex gap-6 pb-10 border-b border-slate-100">
               <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shrink-0">
                  {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" />}
               </div>
               <div>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-1">Asset Identity</p>
                  <h3 className="text-[17px] font-bold text-slate-900 leading-tight mb-1">{item.title}</h3>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-tight">{item.seller_name}</p>
               </div>
            </div>

            {/* Violation Context */}
            <div className="grid grid-cols-2 gap-10">
               <div>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-2">Market Price</p>
                  <p className={`text-[26px] font-bold ${isRegulated ? 'text-red-500' : 'text-amber-500'} tracking-tight`}>RM {item.price.toFixed(2)}</p>
               </div>
               <div>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.2em] mb-2">{isRegulated ? 'Inst. Ceiling' : 'Adv. Ceiling'}</p>
                  <p className={`text-[26px] font-bold ${isRegulated ? 'text-emerald-600' : 'text-slate-400'} tracking-tight`}>RM {limit.toFixed(2)}</p>
               </div>
            </div>

            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100/50">
               <div className={`flex items-center gap-3 ${iconColor} mb-3`}>
                  <AlertCircle size={15} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">{isRegulated ? 'Breach Intensity' : 'Market Offset'}</p>
               </div>
               <p className="text-[14px] font-semibold text-slate-700 leading-relaxed">
                  Asset exceeds category {isRegulated ? 'hard ceiling' : 'suggested limit'} by <span className={iconColor}>RM {violationAmount.toFixed(2)}</span> ({violationPercent.toFixed(1)}%). {isRegulated ? 'Continuous violation may result in institutional blacklisting.' : 'This listing is permitted but monitored for predatory spikes.'}
               </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 pt-4">
               <button 
                  onClick={() => onDismiss(item.id)}
                  className="h-14 bg-white border border-slate-100 text-slate-400 rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
               >
                  <CheckCircle size={18} /> Dismiss
               </button>
               <button 
                  onClick={() => onSuspend(item.id)}
                  className="h-14 bg-slate-900 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2"
               >
                  <Trash2 size={18} /> Suspend Asset
               </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
