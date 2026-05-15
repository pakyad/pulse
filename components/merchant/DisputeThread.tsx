"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Image as ImageIcon, Send, 
  Loader2, CheckCircle2, AlertCircle,
  Scale, ChevronLeft
} from 'lucide-react';
import { respondToDispute } from '@/lib/marketplace-utils';

interface DisputeThreadProps {
  dispute: any;
  onClose: () => void;
}

export default function DisputeThread({ dispute, onClose }: DisputeThreadProps) {
  const [narrative, setNarrative] = useState(dispute.merchant_response || '');
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative) return;

    setIsSubmitting(true);
    try {
      await respondToDispute(dispute.id, { narrative }, image || undefined);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Transmission Failure.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isResponded = dispute.status === 'MERCHANT_RESPONDED' || dispute.status === 'RESOLVED';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-end">
       {/* ── MATURE BACKDROP ── */}
       <motion.div 
         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
         onClick={onClose}
         className="absolute inset-0 bg-[#1e293b]/20 backdrop-blur-md"
       />

       {/* ── MAIN PANEL (Sharp DNA) ── */}
       <motion.div 
         initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
         transition={{ type: 'spring', damping: 25, stiffness: 200 }}
         className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden"
       >
          {/* HEADER (Aligned to Main Log) */}
          <div className="px-8 py-8 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl z-10">
             <div className="flex items-center gap-5">
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#94a3b8] hover:text-[#1e293b] border border-slate-100 transition-all"
                >
                   <ChevronLeft size={18} />
                </button>
                <div className="space-y-1">
                   <h2 className="text-[17px] font-bold tracking-tight text-[#1e293b]">Case Details</h2>
                   <p className="text-[11px] font-medium text-[#94a3b8]">ID #{dispute.order_code}</p>
                </div>
             </div>
             <div className={`px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
                isResponded ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-red-50 text-red-500 border-red-100 animate-pulse'
             }`}>
                {isResponded ? 'Under Review' : 'Action Needed'}
             </div>
          </div>

          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto p-8 space-y-12 no-scrollbar pb-32">
             
             {/* ── STUDENT CLAIM ── */}
             <section className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-1 h-1 rounded-full bg-[#1e293b]" />
                   <h3 className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest">Student Claim</h3>
                </div>
                
                <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-6">
                   <div className="space-y-3">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-white px-2 py-1 rounded border border-red-100 w-fit">{dispute.reason}</p>
                      <p className="text-[15px] font-medium text-[#1e293b] leading-relaxed italic pr-4">"{dispute.narrative}"</p>
                   </div>
                   
                   {dispute.evidence_url && (
                      <div className="space-y-4">
                         <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest">Student Proof</p>
                         <div className="rounded-xl overflow-hidden border border-slate-100 bg-white">
                            <img src={dispute.evidence_url} className="w-full h-auto object-cover" alt="Evidence" />
                         </div>
                      </div>
                   )}
                </div>
             </section>

             {/* ── YOUR DEFENSE ── */}
             <section className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-1 h-1 rounded-full bg-[#1e293b]" />
                   <h3 className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest">Your Defense</h3>
                </div>

                {isResponded ? (
                   <div className="p-6 bg-blue-50/30 border border-blue-100 rounded-2xl space-y-6">
                      <div className="flex items-center gap-2 text-blue-600">
                         <CheckCircle2 size={16} />
                         <span className="text-[11px] font-bold uppercase tracking-widest">Sent for Review</span>
                      </div>
                      <p className="text-[15px] font-medium text-[#1e293b] leading-relaxed">{dispute.merchant_response}</p>
                      {dispute.merchant_evidence_url && (
                         <div className="space-y-4">
                            <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest">Your Proof</p>
                            <div className="rounded-xl overflow-hidden border border-blue-100">
                               <img src={dispute.merchant_evidence_url} className="w-full h-auto object-cover" alt="Proof" />
                            </div>
                         </div>
                      )}
                   </div>
                ) : (
                   <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="space-y-4">
                         <div className="relative group">
                            <textarea 
                              value={narrative}
                              onChange={(e) => setNarrative(e.target.value)}
                              required
                              placeholder="Explain your side. Mention delivery details or past messages."
                              className="w-full h-48 bg-white border border-slate-200 rounded-2xl p-6 text-[15px] font-medium text-[#1e293b] placeholder:text-slate-300 focus:border-[#1e293b] transition-all outline-none resize-none leading-relaxed"
                            />
                            <div className="absolute bottom-4 left-6 right-6 h-1 bg-slate-50 rounded-full overflow-hidden">
                               <motion.div 
                                 animate={{ 
                                   width: narrative.length > 0 ? '100%' : '0%',
                                   backgroundColor: narrative.length < 20 ? '#ef4444' : '#3b82f6'
                                 }}
                                 className="h-full"
                               />
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <label className="group w-full h-32 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-[#1e293b]/20 transition-all overflow-hidden relative bg-white">
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            {previewUrl ? (
                               <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-10" alt="" />
                            ) : null}
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-[#1e293b] transition-colors border border-slate-50">
                               <ImageIcon size={20} />
                            </div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{image ? image.name : 'Upload Photo Proof'}</span>
                         </label>
                      </div>

                      <div className="flex flex-col gap-3">
                         <button
                           type="submit"
                           disabled={isSubmitting || !narrative}
                           className="w-full py-5 bg-[#1e293b] text-white rounded-xl font-bold text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg shadow-[#1e293b]/10 hover:translate-y-[-2px] active:scale-95 transition-all disabled:opacity-20"
                         >
                            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>Send for Review <Send size={18} /></>}
                         </button>
                         
                         <button type="button" className="w-full py-5 border border-red-100 bg-red-50/50 text-red-500 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                            <Scale size={16} />
                            Settle & Refund
                         </button>
                      </div>
                   </form>
                )}
             </section>
          </div>
       </motion.div>
    </div>
  );
}
