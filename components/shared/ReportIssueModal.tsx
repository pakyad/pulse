"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShieldAlert, AlertTriangle, Image as ImageIcon, 
  ChevronDown, CheckCircle2, Loader2, Info,
  Package, Scale, HelpCircle, Send, ArrowRight
} from 'lucide-react';
import { reportOrderIssue } from '@/lib/marketplace-utils';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSuccess: () => void;
}

const STRATEGIES = [
  { id: 'Item never delivered', title: 'Order Missing', desc: 'I never received my items.', icon: Package },
  { id: 'Damaged Asset', title: 'Broken / Damaged', desc: 'Item is defective or crushed.', icon: AlertTriangle },
  { id: 'Wrong Item received', title: 'Incorrect Items', desc: 'This is not what I ordered.', icon: Scale },
  { id: 'Other Institutional Concern', title: 'Other Issue', desc: 'I need administrative support.', icon: HelpCircle },
];

export default function ReportIssueModal({ isOpen, onClose, order, onSuccess }: ReportIssueModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState(STRATEGIES[0].id);
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
      setTimeout(() => { onSuccess(); onClose(); }, 2000);
    } catch (err) {
      console.error(err);
      alert("Submission Failure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-blue-600/40 backdrop-blur-md" />

          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-md overflow-hidden flex flex-col"
          >
            {isSuccess ? (
              <div className="p-12 text-center space-y-6">
                 <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100"><CheckCircle2 size={32} /></div>
                 <div className="space-y-2">
                    <h3 className="text-[17px] font-bold text-[#000000]">Dispute Logged</h3>
                    <p className="text-[11px] text-[#94a3b8] font-medium leading-relaxed">Your case is now in the Admin Queue. Check your orders for live status updates.</p>
                 </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col">
                {/* HEADER */}
                <div className="px-8 py-8 border-b border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 border border-red-100"><ShieldAlert size={20} /></div>
                      <div className="space-y-0.5">
                         <h2 className="text-[15px] font-bold text-[#000000]">{step === 1 ? 'Report Issue' : 'Provide Evidence'}</h2>
                         <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest">Case Registration</p>
                      </div>
                   </div>
                   <button type="button" onClick={step === 1 ? onClose : () => setStep(1)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#94a3b8] hover:text-[#000000]"><X size={16} /></button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
                   
                   {/* ── CASE FACT SHEET ── */}
                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest px-1">Case Identity</p>
                      <div className="bg-slate-50/50 border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                         <div className="px-5 py-3 flex items-start justify-between">
                            <span className="text-[11px] font-medium text-[#94a3b8]">Items</span>
                            <div className="text-right">
                               {order?.items?.map((it: any, i: number) => (
                                  <p key={i} className="text-[11px] font-bold text-[#000000]">{it.qty}x {it.title}</p>
                               )) || <p className="text-[11px] font-bold text-[#000000]">1x {order?.title}</p>}
                            </div>
                         </div>
                         <div className="px-5 py-3 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-[#94a3b8]">Refund Value</span>
                            <span className="text-[11px] font-black text-[#000000]">RM {order?.total?.toFixed(2)}</span>
                         </div>
                      </div>
                   </div>

                   <AnimatePresence mode="wait">
                      {step === 1 ? (
                         <motion.div key="s1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                            <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest px-1">What is the problem?</p>
                            <div className="space-y-3">
                               {STRATEGIES.map(s => (
                                  <button 
                                    key={s.id} type="button"
                                    onClick={() => { setReason(s.id); setStep(2); }}
                                    className="w-full p-5 bg-white border border-slate-100 rounded-2xl text-left group hover:border-blue-600 hover:shadow-md transition-all flex items-center justify-between"
                                  >
                                     <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#94a3b8] group-hover:bg-blue-600 group-hover:text-white transition-all border border-slate-50"><s.icon size={18} /></div>
                                        <div className="space-y-0.5">
                                           <p className="text-[13px] font-bold text-[#000000]">{s.title}</p>
                                           <p className="text-[10px] font-medium text-[#94a3b8]">{s.desc}</p>
                                        </div>
                                     </div>
                                     <ArrowRight size={14} className="text-slate-200 group-hover:text-[#000000]" />
                                  </button>
                               ))}
                            </div>
                         </motion.div>
                      ) : (
                         <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest px-1">Describe clearly</label>
                               <textarea 
                                 value={narrative} onChange={(e) => setNarrative(e.target.value)}
                                 placeholder={reason === 'Damaged Asset' ? 'Tell us exactly where the damage is...' : 'Tell us what happened...'} 
                                 required
                                 className="w-full h-32 bg-white border border-slate-100 rounded-xl p-5 text-[13px] font-medium text-[#000000] placeholder:text-slate-300 focus:border-blue-600 transition-all outline-none resize-none leading-relaxed"
                               />
                            </div>

                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest px-1">Evidence (Recommended)</label>
                               <label className="w-full h-14 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-all bg-white relative overflow-hidden">
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                                  {image ? (
                                     <span className="text-[11px] font-bold text-emerald-600">Proof Loaded: {image.name.substring(0,10)}...</span>
                                  ) : (
                                     <>
                                       <ImageIcon size={16} className="text-slate-300" />
                                       <span className="text-[11px] font-bold text-[#94a3b8]">Attach Photo</span>
                                     </>
                                  )}
                               </label>
                            </div>

                            <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-xl space-y-2">
                               <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest">
                                  <Scale size={12} /> Expected Outcome
                               </div>
                               <p className="text-[11px] text-[#000000] font-medium">Full Refund of RM {order?.total?.toFixed(2)} to Original Payment Method if verified.</p>
                            </div>

                            <button
                              type="submit"
                              disabled={isSubmitting || !narrative}
                              className="w-full h-14 bg-blue-600 text-white rounded-xl font-bold text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-md shadow-[#000000]/10 active:scale-95 transition-all disabled:opacity-20"
                            >
                              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Submit Case <Send size={16} className="rotate-45" /></>}
                            </button>
                         </motion.div>
                      )}
                   </AnimatePresence>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
