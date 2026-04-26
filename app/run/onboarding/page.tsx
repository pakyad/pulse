"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ChevronLeft,
  Zap,
  MapPin,
  Scale,
  Award,
  CircleDollarSign,
  Check,
  ChevronRight,
  Bike,
  Car,
  Footprints,
  Smartphone,
  CreditCard,
  Loader2,
  ShieldCheck,
  Info,
  Clock,
  HeartPulse,
  X,
  Target,
  GanttChart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import { motion, AnimatePresence } from 'framer-motion';

// --- VOXEL ENGINE (Pulse Standard) ---
const VoxelIcon = ({ color, shadow, children }: { color: string, shadow: string, children: React.ReactNode }) => (
  <div className="w-[52px] h-[52px] relative group">
    <div className={`absolute inset-0 translate-y-1.5 translate-x-1 rounded-xl ${shadow} transition-all duration-300 group-hover:translate-y-2.5 group-hover:translate-x-1.5`} />
    <div className={`absolute inset-0 rounded-xl ${color} border-2 border-black/5 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:-translate-x-0.5 shadow-inner`}>
      <div className="relative z-10 scale-[1.1] drop-shadow-[1px_1px_0_rgba(0,0,0,0.05)]">
        {children}
      </div>
    </div>
  </div>
);

const PixelVoxel = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" fill="white" fillOpacity="0.8" />
    <rect x="6" y="6" width="12" height="12" fill="white" />
    <rect x="8" y="8" width="8" height="8" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

export default function RunnerOnboarding() {
  const [profile, setProfile] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [agreedToTC, setAgreedToTC] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    vehicleType: 'walking',
    plateNumber: '',
    phone: '',
    bankName: '',
    accountNumber: '',
    isBankLinked: false
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        onSnapshot(doc(db, "users", user.uid), (snap) => setProfile(snap.data()));
      }
    });
    return () => unsub();
  }, []);

  const handleLinkBank = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setFormData(prev => ({ ...prev, isBankLinked: true }));
      setIsSubmitting(false);
    }, 1500);
  };

  const handleApply = async () => {
    if (!agreedToTC || !auth.currentUser) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        runner_status: 'pending',
        runner_application: {
          ...formData,
          applied_at: new Date().toISOString()
        }
      });
      router.push('/run');
    } catch (e) {
      console.error(e);
      alert('Application failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = formData.phone && (formData.vehicleType === 'walking' || formData.plateNumber);
  const isStep2Valid = formData.isBankLinked;

  return (
    <main className="h-screen h-svh bg-[#FDFDFD] font-sans antialiased text-navy flex flex-col overflow-hidden relative">
      
      {/* HEADER */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-5 pt-12 pb-4 flex items-center justify-between bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50">
         <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-navy hover:bg-slate-50 rounded-xl transition-all active:scale-90">
               <ChevronLeft size={28} strokeWidth={2} />
            </button>
            <h2 className="text-[18px] font-bold tracking-tight text-navy">Runner Protocol</h2>
         </div>
         <div className="flex items-center gap-3 shrink-0">
            <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
         </div>
      </nav>

      {/* CONTENT AREA (LANDING) */}
      <div className="flex-1 overflow-y-auto px-6 no-scrollbar pt-36 pb-64 space-y-16">
        
        {/* Policy Hero (Purple) */}
        <motion.div 
           whileTap={{ scale: 0.98 }}
           className="bg-linear-to-br from-[#8B5CF6] to-[#7C3AED] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-xl shadow-purple-500/20"
        >
           <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
           <CircleDollarSign className="absolute -right-8 -bottom-8 text-white/10 w-48 h-48 rotate-12" />
           
           <div className="relative z-10 space-y-4">
              <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Policy</p>
              <h3 className="text-[32px] font-bold tracking-tightest leading-tight">Keep 90% of <br/> Earnings.</h3>
              <p className="text-[13px] text-white/80 leading-relaxed font-medium max-w-[220px]">
                10% protocol fee for upkeep. 100% tips go directly to you.
              </p>
           </div>
        </motion.div>

        {/* Voxel Perks Grid */}
        <div className="space-y-8">
           <div className="flex items-center gap-3 px-2">
              <GanttChart size={18} className="text-slate-200" />
              <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Protocol Core</h3>
           </div>
           
           <div className="grid grid-cols-4 gap-y-10 relative">
              {[
                { id: 'flex', label: 'Flex-Shift', color: 'bg-blue-500', shadow: 'bg-blue-800' },
                { id: 'gps', label: 'Secure-GPS', color: 'bg-slate-700', shadow: 'bg-black' },
                { id: 'priority', label: 'Priority', color: 'bg-purple-500', shadow: 'bg-purple-900' },
                { id: 'protection', label: 'Protection', color: 'bg-emerald-600', shadow: 'bg-emerald-900' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-4">
                   <button onClick={() => setOpenAccordion(openAccordion === item.id ? null : item.id)} className="focus:outline-none">
                      <VoxelIcon color={item.color} shadow={item.shadow}>
                         <PixelVoxel />
                      </VoxelIcon>
                   </button>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center leading-none">{item.label}</span>
                </div>
              ))}
           </div>

           <AnimatePresence mode="wait">
              {['flex', 'gps', 'priority', 'protection'].includes(openAccordion || '') && (
                <motion.div key={openAccordion} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50/50 border border-slate-100 rounded-3xl p-6 mx-2 overflow-hidden">
                   <p className="text-[13px] text-slate-400 font-medium leading-relaxed">
                      {openAccordion === 'flex' && 'Synchronize your delivery hours with your academic timetable for zero disruption.'}
                      {openAccordion === 'gps' && 'Real-time encryption of your location nodes for high-fidelity campus safety.'}
                      {openAccordion === 'priority' && 'Early authorization for high-yield food and stationery delivery clusters.'}
                      {openAccordion === 'protection' && 'GPA Shield Protocol ensures you prioritize exams during high-activity academic peaks.'}
                   </p>
                </motion.div>
              )}
           </AnimatePresence>
        </div>

        {/* Intelligence Feed */}
        <div className="space-y-8">
           <div className="px-2">
              <h3 className="text-[18px] font-bold text-navy tracking-tight">Logistics Feed</h3>
              <p className="text-[12px] text-slate-400 font-medium">Live campus demand projections.</p>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white border border-slate-100 rounded-[2.2rem] shadow-sm">
                 <h5 className="text-[14px] font-bold text-navy mb-1">Peak Demand</h5>
                 <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest">12:00 — 14:00</p>
              </div>
              <div className="p-6 bg-white border border-slate-100 rounded-[2.2rem] shadow-sm">
                 <h5 className="text-[14px] font-bold text-navy mb-1">Avg. Yield</h5>
                 <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">RM 8.50 / Drop</p>
              </div>
           </div>
        </div>

        <div className="h-40" />
      </div>

      {/* Floating Application CTA */}
      <div className="px-8 py-4 bg-[#FDFDFD]/90 backdrop-blur-xl border-t border-slate-50 z-40 fixed bottom-[85px] left-0 right-0">
        <button 
          onClick={() => setShowModal(true)}
          className="w-full h-16 bg-navy text-white rounded-[1.5rem] text-[15px] font-bold shadow-2xl shadow-navy/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          Initialize Application <ArrowRight size={18} />
        </button>
      </div>

      {/* --- MATURED APPLICATION FLOW (MODAL) --- */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-navy/60 backdrop-blur-md z-[100]" />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3.5rem] z-[101] h-[92vh] flex flex-col shadow-2xl"
            >
               {/* Modal Header */}
               <div className="px-10 pt-10 pb-6 flex items-center justify-between">
                  <div className="space-y-1.5">
                     <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step === i ? 'w-10 bg-navy' : 'w-2 bg-slate-100'}`} />
                        ))}
                     </div>
                     <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Synchronization Sequence</h3>
                  </div>
                  <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-navy transition-all active:scale-90 shadow-sm">
                     <X size={24} />
                  </button>
               </div>

               {/* Modal Content */}
               <div className="flex-1 overflow-y-auto px-10 py-6 no-scrollbar">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div key="st1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-12">
                         <h2 className="text-[36px] font-black tracking-tightest leading-[1.05] text-navy">Logistics <br/>Synchronization.</h2>
                         
                         <div className="space-y-10">
                            {/* Mobility List (Matured) */}
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Select Mobility Mode</label>
                               <div className="space-y-3">
                                  {[
                                    { id: 'walking', icon: Footprints, label: 'Walking Logistics', desc: 'Sustainable, zero-overhead campus traversal.' },
                                    { id: 'bike', icon: Bike, label: 'Cycle Protocol', desc: 'High-velocity traversal for distant hub clusters.' },
                                    { id: 'car', icon: Car, label: 'Vehicle Handshake', desc: 'Authorized for high-volume logistics drops.' }
                                  ].map((item) => (
                                    <button
                                      key={item.id}
                                      onClick={() => setFormData({ ...formData, vehicleType: item.id })}
                                      className={`w-full p-6 rounded-[2.5rem] border-2 text-left transition-all flex items-center gap-6 ${formData.vehicleType === item.id ? 'bg-navy text-white border-navy shadow-xl shadow-navy/20' : 'bg-white border-slate-50 text-navy hover:border-slate-100'}`}
                                    >
                                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${formData.vehicleType === item.id ? 'bg-white/10' : 'bg-slate-50'}`}>
                                          <item.icon size={24} className={formData.vehicleType === item.id ? 'text-white' : 'text-slate-300'} />
                                       </div>
                                       <div>
                                          <h4 className="text-[16px] font-bold tracking-tight">{item.label}</h4>
                                          <p className={`text-[11px] font-medium leading-relaxed ${formData.vehicleType === item.id ? 'text-white/60' : 'text-slate-400'}`}>{item.desc}</p>
                                       </div>
                                    </button>
                                  ))}
                               </div>
                            </div>

                            {formData.vehicleType !== 'walking' && (
                              <div className="space-y-2 border-b border-slate-100 pb-3 group">
                                 <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1 group-focus-within:text-navy transition-colors">Identification Node (Plate)</label>
                                 <input 
                                   type="text" value={formData.plateNumber} onChange={e => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })} 
                                   placeholder="WXY 1234"
                                   className="w-full bg-transparent text-[20px] font-bold text-navy outline-none placeholder:text-slate-100" 
                                 />
                              </div>
                            )}

                            <div className="space-y-2 border-b border-slate-100 pb-3 group">
                               <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1 group-focus-within:text-navy transition-colors">Signal Frequency (Phone)</label>
                               <input 
                                 type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                                 placeholder="+60 12 345 6789"
                                 className="w-full bg-transparent text-[20px] font-bold text-navy outline-none placeholder:text-slate-100" 
                               />
                            </div>
                         </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div key="st2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-12">
                         <h2 className="text-[36px] font-black tracking-tightest leading-[1.05] text-navy">Revenue <br/>Synchronization.</h2>
                         
                         <div className="space-y-10">
                            <div className="p-10 bg-slate-50 rounded-[3rem] space-y-8 shadow-inner border border-slate-100">
                               <div className="space-y-6">
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Institutional Node</label>
                                     <select 
                                       value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                       className="w-full h-16 bg-white rounded-[2rem] px-8 text-[16px] font-bold text-navy outline-none appearance-none border border-slate-100"
                                     >
                                        <option value="">Select University Bank</option>
                                        <option value="Maybank">Maybank (Verified)</option>
                                        <option value="CIMB">CIMB Bank</option>
                                        <option value="Bank Islam">Bank Islam</option>
                                     </select>
                                  </div>
                                  <div className="space-y-2 border-b border-slate-200 pb-2 mx-1">
                                     <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Account Frequency</label>
                                     <input 
                                       type="text" value={formData.accountNumber} onChange={e => setFormData({ ...formData, accountNumber: e.target.value })} 
                                       placeholder="1234 5678 9012"
                                       className="w-full bg-transparent py-2 text-[20px] font-bold text-navy outline-none" 
                                     />
                                  </div>
                               </div>
                               {!formData.isBankLinked ? (
                                 <button onClick={handleLinkBank} disabled={isSubmitting || !formData.bankName || !formData.accountNumber} className="w-full h-18 bg-navy text-white rounded-[2rem] font-bold text-[15px] shadow-2xl shadow-navy/20">
                                    {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'Synchronize Revenue Node'}
                                 </button>
                               ) : (
                                 <div className="w-full h-18 bg-white border border-emerald-100 rounded-[2rem] flex items-center justify-center gap-4 text-emerald-600 font-bold">
                                    <ShieldCheck size={24} /> Authorization Active
                                 </div>
                               )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed text-center px-4">
                              Pulse ensures end-to-end encryption for all institutional fund transfers. Synchronization occurs every 24 hours.
                            </p>
                         </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div key="st3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-12">
                         <h2 className="text-[36px] font-black tracking-tightest leading-[1.05] text-navy">Legal <br/>Handshake.</h2>
                         <div className="space-y-6">
                            {[
                              { t: 'Safety Handshake', c: 'Runners must adhere to the high-fidelity campus navigation protocol at all times.' },
                              { t: 'Student Integrity', c: 'Professional synchronization is mandatory during all marketplace handshakes.' },
                              { t: 'Fee Protocol', c: 'A 10% maintenance fee is authorized for ecosystem upkeep. Tips are 100% synchronized.' }
                            ].map((item, i) => (
                              <div key={i} className="bg-white border border-slate-50 rounded-[2.5rem] p-8 shadow-sm">
                                 <h4 className="text-[16px] font-bold text-navy mb-2">{item.t}</h4>
                                 <p className="text-[13px] text-slate-400 font-medium leading-relaxed">{item.c}</p>
                              </div>
                            ))}
                         </div>
                         <label className="flex gap-6 cursor-pointer group py-4 px-2">
                            <div className="relative flex items-center justify-center pt-1">
                               <input type="checkbox" checked={agreedToTC} onChange={() => setAgreedToTC(!agreedToTC)} className="peer appearance-none w-8 h-8 rounded-xl border-2 border-slate-100 checked:bg-navy checked:border-navy transition-all" />
                               <Check size={20} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={4} />
                            </div>
                            <span className="text-[14px] font-medium text-slate-400 group-hover:text-navy transition-colors leading-relaxed">
                               I authorize the <span className="text-navy font-bold">Institutional Runner Protocol</span> and agree to the synchronized terms.
                            </span>
                         </label>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               {/* Modal Footer */}
               <div className="px-10 py-10 pb-16 bg-white border-t border-slate-50">
                  {step < 3 ? (
                    <button onClick={() => setStep(step + 1)} disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)} className="w-full h-20 bg-navy text-white rounded-[2rem] text-[18px] font-bold shadow-2xl shadow-navy/20 disabled:opacity-20 transition-all flex items-center justify-center gap-4">
                      Continue Sequence <ArrowRight size={24} />
                    </button>
                  ) : (
                    <button onClick={handleApply} disabled={!agreedToTC || isSubmitting} className="w-full h-20 bg-navy text-white rounded-[2rem] text-[18px] font-bold shadow-2xl shadow-navy/20 disabled:opacity-20 transition-all flex items-center justify-center gap-4">
                      {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : 'Finalize Synchronization'} <ArrowRight size={24} />
                    </button>
                  )}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </main>
  );
}
