"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShieldAlert, AlertTriangle, Image as ImageIcon, 
  ChevronDown, CheckCircle2, Loader2, Info 
} from 'lucide-react';
import { reportOrderIssue } from '@/lib/marketplace-utils';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSuccess: () => void;
}

const ISSUE_REASONS = [
  "Item never delivered",
  "Damaged Asset",
  "Wrong Item received",
  "Logistics / Runner Conflict",
  "Overpriced / Guideline Breach",
  "Other Institutional Concern"
];

export default function ReportIssueModal({ isOpen, onClose, order, onSuccess }: ReportIssueModalProps) {
  const [reason, setReason] = useState(ISSUE_REASONS[0]);
  const [narrative, setNarrative] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsSubmitting(true);
    try {
      await reportOrderIssue(order.id, {
        buyer_id: order.buyer_id || order.userId || 'anonymous',
        seller_id: order.seller_id || order.vendorId || order.vendor_id || 'unknown',
        reason,
        narrative,
        reporter_name: order.buyer_name || 'Pulse Student',
        order_code: order.order_code || order.id.substring(0,6).toUpperCase(),
        handshake: order.handshake || null
      }, image || undefined);
      
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Report Submission Error:", err);
      alert("Institutional reporting failure. Please retry or contact Pulse Admin directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-300 flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-slate-900/20 overflow-hidden"
          >
            {isSuccess ? (
              <div className="p-12 text-center space-y-6">
                 <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                    <CheckCircle2 size={40} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-[20px] font-black text-slate-900 tracking-tight">Conflict Logged</h3>
                    <p className="text-[14px] text-slate-400 font-medium">Your dispute has been synchronized with the Admin Mediation Terminal. Verification is pending.</p>
                 </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="px-10 pt-10 pb-6 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 border border-red-100">
                         <ShieldAlert size={24} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Issue Reporting</p>
                         <h2 className="text-[18px] font-black text-slate-900 tracking-tight">Report a Problem</h2>
                      </div>
                   </div>
                   <button 
                     type="button"
                     onClick={onClose}
                     className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                   >
                      <X size={20} />
                   </button>
                </div>

                <div className="px-10 pb-10 space-y-8">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
                      <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                        Rule: False reporting may affect your score. Ensure all evidence provided is accurate.
                      </p>
                   </div>

                   {/* Reason Selection */}
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Select Problem Type</label>
                      <div className="relative group">
                        <select 
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full h-14 bg-white border border-slate-100 rounded-2xl px-6 text-[14px] font-bold text-slate-900 appearance-none focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                        >
                          {ISSUE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                      </div>
                   </div>

                   {/* 🏛️ Institutional Resolution Protocol */}
                   <div className="p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3 text-slate-900">
                         <ShieldAlert size={18} className="text-blue-500" />
                         <p className="text-[12px] font-black uppercase tracking-widest">Resolution Protocol</p>
                      </div>
                      <div className="space-y-3">
                         {[
                           { step: 1, text: "Audit: Pulse verifies GPS handshake metadata." },
                           { step: 2, text: "Mediation: Admin reviews narrative and evidence." },
                           { step: 3, text: "Directive: Outcome finalized within 24 hours." }
                         ].map((item) => (
                           <div key={item.step} className="flex gap-3">
                              <span className="text-[11px] font-black text-slate-300">{item.step}.</span>
                              <p className="text-[11px] font-medium text-slate-500 leading-tight">{item.text}</p>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Narrative */}
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Tell us what happened</label>
                      <textarea 
                        value={narrative}
                        onChange={(e) => setNarrative(e.target.value)}
                        placeholder="Describe the issue in detail..."
                        required
                        className="w-full h-32 bg-white border border-slate-100 rounded-[28px] p-6 text-[14px] font-medium text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none resize-none"
                      />
                   </div>

                   {/* Evidence Upload */}
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Evidence (Optional)</label>
                      <label className="w-full h-20 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-all">
                         <input 
                           type="file" 
                           className="hidden" 
                           accept="image/*"
                           onChange={(e) => setImage(e.target.files?.[0] || null)}
                         />
                         {image ? (
                           <span className="text-[12px] font-bold text-emerald-500">Asset Loaded: {image.name.substring(0,10)}...</span>
                         ) : (
                           <>
                             <ImageIcon size={18} className="text-slate-300" />
                             <span className="text-[12px] font-bold text-slate-400">Attach Evidence</span>
                           </>
                         )}
                      </label>
                   </div>

                   {/* Submit Action */}
                   <button
                     type="submit"
                     disabled={isSubmitting || !narrative}
                     className="w-full h-16 bg-slate-900 text-white rounded-[24px] font-black text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 active:scale-95 transition-all disabled:opacity-20"
                   >
                     {isSubmitting ? (
                        <Loader2 size={20} className="animate-spin" />
                     ) : (
                        <>Submit Report <AlertTriangle size={18} /></>
                     )}
                   </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
