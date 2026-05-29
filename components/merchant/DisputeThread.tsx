"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Image as ImageIcon, Send, 
  Loader2, CheckCircle2, AlertCircle,
  Scale, ChevronLeft, ChevronDown, 
  Clock, Package, MapPin, MessageSquare,
  ShieldCheck, DollarSign, ArrowRight, ShieldAlert, Info
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { respondToDispute } from '@/lib/marketplace-utils';

interface DisputeThreadProps {
  dispute: any;
  onClose: () => void;
}

export default function DisputeThread({ dispute, onClose }: DisputeThreadProps) {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('dispute');
  const [order, setOrder] = useState<any>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  
  // Guided Flow State
  const [step, setStep] = useState<1 | 2>(1);
  const [strategy, setStrategy] = useState<'CONTEST' | 'PARTIAL' | 'FULL' | null>(null);
  
  // Form State
  const [narrative, setNarrative] = useState(dispute.merchant_response || '');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      if (dispute.order_id) {
        const snap = await getDoc(doc(db, "orders", dispute.order_id));
        if (snap.exists()) setOrder(snap.data());
      }
      setLoadingOrder(false);
    }
    fetchOrder();
  }, [dispute.order_id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strategy === 'CONTEST' && !narrative) return;
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

  // ── STRATEGY CARD COMPONENT ──
  const StrategyCard = ({ id, title, desc, icon: Icon, color }: any) => (
    <button 
      onClick={() => { setStrategy(id); setStep(2); }}
      className="w-full p-6 bg-white border border-slate-100 rounded-2xl text-left group hover:border-blue-600 hover:shadow-md transition-all flex items-center justify-between"
    >
       <div className="flex gap-5 items-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all`}>
             <Icon size={20} />
          </div>
          <div className="space-y-1">
             <p className="text-[14px] font-bold text-[#000000]">{title}</p>
             <p className="text-[11px] font-medium text-[#94a3b8]">{desc}</p>
          </div>
       </div>
       <ArrowRight size={16} className="text-slate-200 group-hover:text-[#000000] transition-all" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-end">
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-blue-600/20 backdrop-blur-md" />

       <motion.div 
         initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
         transition={{ type: 'spring', damping: 25, stiffness: 200 }}
         className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden"
       >
          {/* MATURE HEADER */}
          <div className="px-8 py-8 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-xl z-20">
             <div className="flex items-center gap-5">
                <button onClick={step === 1 ? onClose : () => setStep(1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#94a3b8] hover:text-[#000000] border border-slate-50 transition-all">
                   <ChevronLeft size={18} />
                </button>
                <div className="space-y-1">
                   <h2 className="text-[17px] font-bold tracking-tight text-[#000000]">{step === 1 ? 'Select Strategy' : 'Execute Action'}</h2>
                   <p className="text-[11px] font-medium text-[#94a3b8]">Step {step} of 2</p>
                </div>
             </div>
             {step === 2 && (
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-[#000000]">{strategy}</span>
                </div>
             )}
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar pb-32">
             
             {/* ── PERSISTENT CASE FACTS ── */}
             <section className="space-y-6">
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                   <div className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <span className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Student Claim</span>
                      </div>
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-red-50">{dispute.reason}</span>
                   </div>
                   <div className="px-6 py-5 bg-white">
                      <p className="text-[14px] font-medium text-[#000000] leading-relaxed italic">"{dispute.narrative}"</p>
                   </div>
                   <div className="px-6 py-4 flex items-center justify-between text-[13px] font-bold">
                      <span className="text-[#94a3b8]">Order Amount</span>
                      <span className="text-[#000000]">RM {order?.total?.toFixed(2)}</span>
                   </div>
                </div>
             </section>

             {/* ── GUIDED FLOW ENGINE ── */}
             <AnimatePresence mode="wait">
                {step === 1 ? (
                   <motion.section 
                     key="step1"
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                     className="space-y-6"
                   >
                      <div className="space-y-1">
                         <h3 className="text-[15px] font-bold text-[#000000]">How would you like to handle this?</h3>
                         <p className="text-[11px] text-[#94a3b8]">Choose a professional strategy based on your evidence.</p>
                      </div>

                      <div className="space-y-3">
                         <StrategyCard 
                           id="CONTEST" 
                           title="Defend Case" 
                           desc="Prove the delivery was correct to avoid a rating strike." 
                           icon={ShieldCheck} 
                         />
                         <StrategyCard 
                           id="PARTIAL" 
                           title="Offer Compromise" 
                           desc="Give a partial refund to settle this privately with the student." 
                           icon={Scale} 
                         />
                         <StrategyCard 
                           id="FULL" 
                           title="Issue Full Refund" 
                           desc="Immediately settle and close this case with no further action." 
                           icon={CheckCircle2} 
                         />
                      </div>

                      <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-4">
                         <Info size={16} className="text-amber-600 mt-1 shrink-0" />
                         <p className="text-[11px] text-amber-900/70 leading-relaxed">
                            <span className="font-bold block text-amber-900 mb-0.5">Merchant Protocol</span>
                            Choosing to Defend requires photo proof. If GPS location was verified during delivery, you are 95% likely to win.
                         </p>
                      </div>
                   </motion.section>
                ) : (
                   <motion.section 
                     key="step2"
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                     className="space-y-8"
                   >
                      <div className="space-y-1">
                         <h3 className="text-[15px] font-bold text-[#000000]">Finalize Your {strategy} Strategy</h3>
                         <p className="text-[11px] text-[#94a3b8]">Provide the necessary details to execute this action.</p>
                      </div>

                      {isResponded ? (
                         <div className="p-6 bg-blue-50/30 border border-blue-100 rounded-2xl space-y-4">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-[11px] uppercase tracking-widest">
                               <CheckCircle2 size={14} /> Submitted for Review
                            </div>
                            <p className="text-[14px] font-medium text-[#000000]">{dispute.merchant_response}</p>
                         </div>
                      ) : (
                         <form onSubmit={handleSubmit} className="space-y-8">
                            {strategy === 'CONTEST' && (
                               <div className="space-y-6">
                                  <div className="space-y-2">
                                     <label className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest">Defense Narrative</label>
                                     <textarea 
                                       value={narrative} onChange={(e) => setNarrative(e.target.value)} required
                                       placeholder="Provide specific details (e.g., 'Left at the guardhouse as per student's request')."
                                       className="w-full h-40 bg-white border border-slate-100 rounded-xl p-5 text-[14px] font-medium text-[#000000] focus:border-blue-600 transition-all outline-none resize-none leading-relaxed"
                                     />
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[11px] font-black text-[#94a3b8] uppercase tracking-widest">Photo Evidence</label>
                                     <label className="group w-full h-24 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all relative overflow-hidden bg-white">
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                        {previewUrl && <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-10" alt="" />}
                                        <ImageIcon size={18} className="text-slate-300 group-hover:text-[#000000]" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{image ? image.name : 'Upload Delivery Proof'}</span>
                                     </label>
                                  </div>
                               </div>
                            )}

                            {strategy === 'PARTIAL' && (
                               <div className="space-y-6">
                                  <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-4">
                                     <p className="text-[12px] font-bold text-[#000000]">Set Compromise Amount</p>
                                     <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100">
                                        <span className="text-[14px] font-bold text-[#94a3b8]">RM</span>
                                        <input 
                                          type="number" 
                                          value={partialAmount}
                                          onChange={(e) => setPartialAmount(e.target.value)}
                                          className="flex-1 text-[16px] font-bold outline-none" 
                                          placeholder="0.00" 
                                        />
                                     </div>
                                     <p className="text-[11px] text-[#94a3b8] leading-relaxed italic">Once sent, the student has 24 hours to accept. If they decline, the case goes to Admin Review.</p>
                                  </div>
                               </div>
                            )}

                            {strategy === 'FULL' && (
                               <div className="p-8 bg-red-50/50 border border-red-100 rounded-2xl text-center space-y-4">
                                  <ShieldAlert size={40} className="text-red-500 mx-auto" />
                                  <div className="space-y-1">
                                     <h4 className="text-[15px] font-bold text-red-900">Immediate Settlement</h4>
                                     <p className="text-[11px] text-red-900/60 leading-relaxed">This will refund RM{order?.total?.toFixed(2)} and close the case. Your rating will not be protected.</p>
                                  </div>
                               </div>
                            )}

                            <div className="flex flex-col gap-3">
                               <button
                                 type="submit"
                                 disabled={isSubmitting || (strategy === 'CONTEST' && !narrative)}
                                 className={`w-full py-5 rounded-xl font-bold text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 disabled:opacity-20 ${
                                    strategy === 'FULL' ? 'bg-red-500 text-white shadow-red-500/10' : 'bg-blue-600 text-white shadow-[#000000]/10'
                                 }`}
                               >
                                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : (
                                     <>
                                       {strategy === 'CONTEST' && 'Confirm Defense'}
                                       {strategy === 'PARTIAL' && 'Send Offer'}
                                       {strategy === 'FULL' && 'Confirm & Refund'}
                                       <Send size={18} />
                                     </>
                                  )}
                               </button>
                               <button 
                                 type="button" 
                                 onClick={() => setStep(1)}
                                 className="w-full py-4 text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest hover:text-[#000000] transition-colors"
                               >
                                  Change Strategy
                               </button>
                            </div>
                         </form>
                      )}
                   </motion.section>
                )}
             </AnimatePresence>
          </div>
       </motion.div>
    </div>
  );
}
