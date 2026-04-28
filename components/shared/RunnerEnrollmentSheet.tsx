'use client'
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ChevronRight, Upload, Footprints, Bike, Bike as Motor } from 'lucide-react';

interface RunnerEnrollmentSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function RunnerEnrollmentSheet({ isOpen, onClose, onComplete }: RunnerEnrollmentSheetProps) {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const methods = [
    { id: 'foot', label: 'On Foot', icon: Footprints },
    { id: 'bicycle', label: 'Bicycle', icon: Bike },
    { id: 'motorcycle', label: 'Motorcycle', icon: Motor },
  ];

  const handleSelectMethod = (m: string) => {
    setMethod(m);
    if (m === 'motorcycle') {
      setStep(2); // License step
    } else {
      setStep(3); // Complete
    }
  };

  const handleFinish = () => {
    onComplete();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-end justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/20 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-white rounded-t-[32px] p-10 border-x border-t border-[#EAEAEA] shadow-2xl overflow-hidden min-h-[50vh]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex justify-end mb-4">
               <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-navy/40 active:scale-90 transition-all">
                 <X size={20} />
               </button>
            </div>

            <div className="space-y-8">
               {step === 1 && (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="text-center space-y-8"
                 >
                    {/* Step 1: The Visual */}
                    <div className="w-24 h-24 bg-teal-50 rounded-[32px] mx-auto flex items-center justify-center border border-teal-100 shadow-inner">
                       <span className="text-4xl">🏃‍♂️</span>
                    </div>

                    <div className="space-y-2">
                       <h2 className="text-[24px] font-black tracking-tightest">How will you deliver?</h2>
                       <p className="text-[14px] text-slate-400 font-medium">Select your primary mode of transit.</p>
                    </div>

                    {/* Step 2: The Question / Chips */}
                    <div className="grid grid-cols-1 gap-3">
                       {methods.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => handleSelectMethod(m.id)}
                            className="w-full h-18 bg-[#F8F8F8] border border-slate-100 rounded-2xl flex items-center justify-between px-6 hover:bg-slate-50 transition-all group active:scale-[0.98]"
                          >
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-navy group-hover:scale-110 transition-transform">
                                   <m.icon size={20} />
                                </div>
                                <span className="font-bold text-[15px] text-navy">{m.label}</span>
                             </div>
                             <ChevronRight size={18} className="text-slate-200" />
                          </button>
                       ))}
                    </div>
                 </motion.div>
               )}

               {step === 2 && (
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-8"
                 >
                    <div className="space-y-2">
                       <h2 className="text-[24px] font-black tracking-tightest">License Required</h2>
                       <p className="text-[14px] text-slate-400 font-medium">Please upload a valid Malaysian driving license (Class B2/B).</p>
                    </div>

                    <button 
                      onClick={() => {
                        setIsUploading(true);
                        setTimeout(() => { setIsUploading(false); setStep(3); }, 2000);
                      }}
                      className="w-full aspect-video border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center gap-4 bg-slate-50/50 hover:bg-slate-50 transition-all active:scale-[0.98] group"
                    >
                       {isUploading ? (
                          <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
                       ) : (
                          <>
                             <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-teal-500 group-hover:scale-110 transition-transform">
                                <Upload size={24} />
                             </div>
                             <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Tap to capture or upload</p>
                          </>
                       )}
                    </button>
                 </motion.div>
               )}

               {step === 3 && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="text-center space-y-8 py-10"
                 >
                    <div className="w-20 h-20 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-emerald-500 shadow-inner">
                       <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                       <h2 className="text-[24px] font-black tracking-tightest text-navy">Verification Complete</h2>
                       <p className="text-[14px] text-slate-400 font-medium leading-relaxed">
                          Your Runner profile is now under review. You will be notified once institutional clearance is granted.
                       </p>
                    </div>
                    <button 
                      onClick={handleFinish}
                      className="w-full h-14 bg-navy text-white rounded-2xl font-black uppercase tracking-[2px] text-[12px] active:scale-95 transition-all shadow-xl shadow-navy/20"
                    >
                       Return to Hub
                    </button>
                 </motion.div>
               )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
