'use client'
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle2, 
  ChevronRight, 
  Upload, 
  Footprints, 
  Bike, 
  ChevronLeft,
  Camera,
  ShieldCheck,
  MapPin,
  Clock,
  User,
  CreditCard,
  Check,
  ArrowRight,
  Zap,
  Loader2
} from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

// ── CONSTANTS ──
const CAMPUSES = ["UniKL MIIT", "UniKL BMI", "UniKL MFI", "UniKL MSI", "UniKL UBIS"];
const FACULTIES = ["Creative Multimedia", "Software Engineering", "System & Networking", "Computer Engineering"];
const HOTSPOTS = ["Cafe Block A", "Starbucks MIIT", "Library Node", "Level 2 Lounge", "West Wing Cafeteria"];

export default function RunnerEnrollmentSheet({ isOpen, onClose, onComplete }: any) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<any>({
    studentId: '',
    campus: 'UniKL MIIT',
    faculty: '',
    transitMode: '',
    licenseUrl: null,
    plateNumber: '',
    equipment: [],
    preferredHotspots: [],
    breakTimes: '',
    emergencyContact: { name: '', phone: '' },
    agreedToTerms: false
  });

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const toggleEquipment = (item: string) => {
    const prev = form.equipment;
    setForm({ ...form, equipment: prev.includes(item) ? prev.filter((i: any) => i !== item) : [...prev, item] });
  };

  const toggleHotspot = (item: string) => {
    const prev = form.preferredHotspots;
    setForm({ ...form, preferredHotspots: prev.includes(item) ? prev.filter((i: any) => i !== item) : [...prev, item] });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid), {
          runner_status: 'pending',
          runner_application: {
            ...form,
            applied_at: new Date().toISOString()
          }
        });
      }
      setStep(5); // Success step
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-500 bg-white flex flex-col"
        >
          {/* ── HEADER ── */}
          <nav className="px-8 pt-10 pb-6 flex items-center justify-between border-b border-[#F2F2F7]">
            <div className="flex items-center gap-4">
               {step > 1 && step < 5 && (
                 <button onClick={back} className="p-2 -ml-2 text-slate-300 active:scale-95 transition-all">
                    <ChevronLeft size={24} />
                 </button>
               )}
               <h2 className="text-[14px] font-bold tracking-[0.2em] uppercase opacity-40">Runner Registry</h2>
            </div>
            <button onClick={onClose} className="p-2 text-slate-300"><X size={24} /></button>
          </nav>

          {/* ── PROGRESS BAR ── */}
          {step < 5 && (
            <div className="h-1 bg-slate-50 w-full">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(step / 4) * 100}%` }}
                className="h-full bg-navy transition-all duration-500"
              />
            </div>
          )}

          {/* ── CONTENT ── */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-8 pb-40">
             <div className="max-w-lg mx-auto space-y-12">
                
                {/* STEP 1: INSTITUTIONAL IDENTITY */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                     <div className="space-y-2">
                        <h3 className="text-[28px] font-bold tracking-tight text-navy">Identity Registry</h3>
                        <p className="text-[14px] text-slate-400 font-medium">Verify your student status to begin logistics clearance.</p>
                     </div>
                     
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-semibold text-slate-400  px-1">Student ID Number</label>
                           <input 
                             type="text" 
                             value={form.studentId} 
                             onChange={e => setForm({ ...form, studentId: e.target.value })}
                             placeholder="e.g. 52213123001"
                             className="w-full h-16 px-6 bg-slate-50 rounded-[20px] border-none text-[15px] font-bold focus:ring-2 focus:ring-navy/5"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-semibold text-slate-400  px-1">Faculty Node</label>
                           <div className="grid grid-cols-1 gap-2">
                              {FACULTIES.map(f => (
                                <button 
                                  key={f}
                                  onClick={() => setForm({ ...form, faculty: f })}
                                  className={`h-14 px-6 rounded-xl text-left text-[14px] font-bold transition-all ${form.faculty === f ? 'bg-navy text-white shadow-md shadow-navy/10' : 'bg-slate-50 text-navy'}`}
                                >
                                  {f}
                                </button>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-semibold text-slate-400  px-1">Student ID Card</label>
                           <div className="h-48 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-3 group hover:border-navy/10 transition-colors cursor-pointer">
                              <Camera size={24} className="group-hover:text-navy transition-colors" />
                              <p className="text-[12px] font-bold uppercase tracking-wider">Tap to Capture ID</p>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                {/* STEP 2: LOGISTICS & MOBILITY */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                     <div className="space-y-2">
                        <h3 className="text-[28px] font-bold tracking-tight text-navy">Mobility Registry</h3>
                        <p className="text-[14px] text-slate-400 font-medium">Categorize your transit mode and equipment assets.</p>
                     </div>

                     <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-3">
                           {[
                             { id: 'foot', label: 'On Foot', icon: Footprints },
                             { id: 'bicycle', label: 'Bicycle', icon: Bike },
                             { id: 'motor', label: 'Motorcycle', icon: Bike },
                             { id: 'scooter', label: 'E-Scooter', icon: Zap }
                           ].map(m => (
                             <button 
                               key={m.id}
                               onClick={() => setForm({ ...form, transitMode: m.id })}
                               className={`h-24 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${form.transitMode === m.id ? 'bg-navy text-white border-navy shadow-md shadow-navy/10' : 'bg-slate-50 text-navy border-transparent'}`}
                             >
                               <m.icon size={20} />
                               <span className="text-[13px] font-bold">{m.label}</span>
                             </button>
                           ))}
                        </div>

                        {form.transitMode === 'motor' && (
                          <div className="space-y-6">
                             <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                                <ShieldCheck className="text-amber-600 shrink-0" size={20} />
                                <div>
                                   <p className="text-[12px] font-bold text-amber-900 ">License Required</p>
                                   <p className="text-[13px] text-amber-800/60 font-medium mt-1">Class B2/D is mandatory for motorized logistics.</p>
                                </div>
                             </div>
                             <div className="h-20 bg-slate-50 rounded-[20px] border border-transparent hover:border-navy/10 transition-all flex items-center justify-between px-6 cursor-pointer">
                                <div className="flex items-center gap-3">
                                   <Camera size={20} className="text-slate-400" />
                                   <span className="text-[14px] font-bold text-navy">Upload Driving License</span>
                                </div>
                                <ArrowRight size={18} className="text-slate-200" />
                             </div>
                          </div>
                        )}

                        <div className="space-y-4">
                           <label className="text-[10px] font-semibold text-slate-400  px-1">Equipment Inventory</label>
                           <div className="grid grid-cols-1 gap-2">
                              {["Thermal Delivery Bag", "Pulse Secure Folder", "External Powerbank", "Rain Gear"].map(item => (
                                <button 
                                  key={item}
                                  onClick={() => toggleEquipment(item)}
                                  className={`h-16 px-6 rounded-xl flex items-center justify-between transition-all ${form.equipment.includes(item) ? 'bg-navy text-white shadow-md' : 'bg-slate-50 text-navy'}`}
                                >
                                  <span className="text-[14px] font-bold">{item}</span>
                                  {form.equipment.includes(item) && <Check size={18} />}
                                </button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                {/* STEP 3: OPERATIONAL AVAILABILITY */}
                {step === 3 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                     <div className="space-y-2">
                        <h3 className="text-[28px] font-bold tracking-tight text-navy">Availability Node</h3>
                        <p className="text-[14px] text-slate-400 font-medium">Select your preferred hotspots and operational windows.</p>
                     </div>

                     <div className="space-y-8">
                        <div className="space-y-4">
                           <label className="text-[10px] font-semibold text-slate-400  px-1">Preferred Hotspots</label>
                           <div className="flex flex-wrap gap-2">
                              {HOTSPOTS.map(h => (
                                <button 
                                  key={h}
                                  onClick={() => toggleHotspot(h)}
                                  className={`px-6 py-3 rounded-full text-[13px] font-bold border transition-all ${form.preferredHotspots.includes(h) ? 'bg-navy text-white border-navy shadow-md' : 'bg-slate-50 text-navy border-transparent'}`}
                                >
                                  {h}
                                </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-semibold text-slate-400  px-1">Class-Free Windows</label>
                           <input 
                             type="text" 
                             value={form.breakTimes} 
                             onChange={e => setForm({ ...form, breakTimes: e.target.value })}
                             placeholder="e.g. Mon 12-2pm, Wed all day"
                             className="w-full h-16 px-6 bg-slate-50 rounded-[20px] border-none text-[15px] font-bold focus:ring-2 focus:ring-navy/5"
                           />
                        </div>

                        <div className="space-y-6">
                           <label className="text-[10px] font-semibold text-slate-400  px-1">Emergency Handshake</label>
                           <div className="grid grid-cols-1 gap-3">
                              <input 
                                type="text" 
                                value={form.emergencyContact.name} 
                                onChange={e => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value }})}
                                placeholder="Contact Name"
                                className="w-full h-16 px-6 bg-slate-50 rounded-[20px] border-none text-[15px] font-bold focus:ring-2 focus:ring-navy/5"
                              />
                              <input 
                                type="text" 
                                value={form.emergencyContact.phone} 
                                onChange={e => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: e.target.value }})}
                                placeholder="Phone Number"
                                className="w-full h-16 px-6 bg-slate-50 rounded-[20px] border-none text-[15px] font-bold focus:ring-2 focus:ring-navy/5"
                              />
                           </div>
                        </div>
                     </div>
                  </motion.div>
                )}

                {/* STEP 4: ETHICAL HANDSHAKE */}
                {step === 4 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                     <div className="space-y-2">
                        <h3 className="text-[28px] font-bold tracking-tight text-navy">Registry Handshake</h3>
                        <p className="text-[14px] text-slate-400 font-medium">Finalize your professional commitment to the logistics network.</p>
                     </div>

                     <div className="space-y-8">
                        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                           <div className="flex items-center gap-3">
                              <ShieldCheck className="text-navy" size={24} />
                              <h4 className="text-[15px] font-bold text-navy ">Protocol Agreement</h4>
                           </div>
                           <div className="space-y-4 text-[13px] text-slate-500 font-medium leading-relaxed">
                              <p>1. I will adhere to the UniKL Student Code of Conduct at all times.</p>
                              <p>2. I will maintain a zero-tolerance policy for logistic infractions or food tampering.</p>
                              <p>3. I acknowledge that the Pulse Registry may suspend my credentials for sub-4.0 ratings.</p>
                           </div>
                        </div>

                        <button 
                          onClick={() => setForm({ ...form, agreedToTerms: !form.agreedToTerms })}
                          className={`w-full h-20 px-8 rounded-2xl flex items-center justify-between border-2 transition-all ${form.agreedToTerms ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-transparent text-navy'}`}
                        >
                           <span className="text-[14px] font-bold">I swear the Registry Oath</span>
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${form.agreedToTerms ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
                              {form.agreedToTerms && <Check size={14} />}
                           </div>
                        </button>
                     </div>
                  </motion.div>
                )}

                {/* STEP 5: SUCCESS */}
                {step === 5 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10 py-20">
                     <div className="w-24 h-24 bg-emerald-50 rounded-2xl mx-auto flex items-center justify-center text-emerald-500 shadow-inner">
                        <CheckCircle2 size={48} />
                     </div>
                     <div className="space-y-3">
                        <h2 className="text-[32px] font-bold tracking-tight text-navy">Registry Received</h2>
                        <p className="text-[15px] text-slate-400 font-medium leading-relaxed px-6">
                           Your Runner application is now under institutional review. Expect a notification once your credentials are verified.
                        </p>
                     </div>
                     <button 
                       onClick={onClose}
                       className="w-full h-16 bg-navy text-white rounded-[22px] font-bold text-[15px] tracking-tight active:scale-95 transition-all shadow-md shadow-navy/20"
                     >
                        Return to Terminal
                     </button>
                  </motion.div>
                )}

             </div>
          </div>

          {/* ── FOOTER BUTTON ── */}
          {step < 5 && (
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/80 backdrop-blur-xl border-t border-[#F2F2F7] supports-backdrop-filter:bg-white/60" style={{ WebkitBackdropFilter: 'blur(20px)' }}>
               <button 
                 onClick={step === 4 ? handleSubmit : next}
                 disabled={isSubmitting || (step === 4 && !form.agreedToTerms)}
                 className={`w-full h-16 rounded-[22px] font-bold text-[15px] tracking-tight flex items-center justify-center gap-3 transition-all ${isSubmitting ? 'bg-slate-50 text-slate-200' : 'bg-navy text-white shadow-md shadow-navy/10 active:scale-95'}`}
               >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (
                    <>
                      {step === 4 ? 'Submit Registry' : 'Proceed to Next Node'}
                      <ArrowRight size={18} />
                    </>
                  )}
               </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
