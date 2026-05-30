"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Package,
  Truck,
  Footprints,
  Bike,
  Smartphone,
  CreditCard,
  Loader2,
  X,
  CheckCircle2
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const MIIT_BANKS = ["Maybank", "CIMB", "Bank Islam", "RHB", "Public Bank"];

export default function RunnerOnboarding() {
  const [profile, setProfile] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    vehicleType: 'walking',
    plateNumber: '',
    phone: '',
    bankName: '',
    accountNumber: ''
  });

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        onSnapshot(doc(db, "users", user.uid), (snap) => setProfile(snap.data()));
      } else {
        router.push('/auth');
      }
    });
    return () => unsub();
  }, []);

  const handleApply = async () => {
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        runner_status: 'pending',
        runner_application: {
          ...formData,
          applied_at: new Date().toISOString()
        }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.phone && formData.bankName && formData.accountNumber;

  if (profile?.runner_status === 'pending') {
    return (
      <main className="h-screen bg-white flex flex-col items-center justify-center px-10 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10">
            <Loader2 className="animate-spin text-accent" size={32} />
          </div>
          <h2 className="text-[24px] font-black tracking-tightest text-navy leading-tight">Synchronization <br/>Active.</h2>
          <p className="text-[14px] text-slate-400 font-medium leading-relaxed">
            Your Runner Protocol application is currently being verified by the Institutional Registry. This typically takes 24 academic hours.
          </p>
          <button onClick={() => router.push('/run')} className="w-full h-14 bg-navy text-white rounded-2xl font-bold text-[14px] tracking-widest uppercase shadow-xl shadow-navy/10">
            Return to Run Hub
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="h-screen bg-white font-sans antialiased text-navy flex flex-col overflow-hidden relative">
      
      {/* ── MINIMAL HEADER ── */}
      <nav className="px-8 pt-12 pb-6 flex items-center justify-between bg-white border-b-[0.5px] border-slate-50">
        <div className="flex items-center gap-4">
          <BackButton />
          <h2 className="text-[17px] font-bold tracking-tight">Apply to Run</h2>
        </div>
        <div className="flex gap-1.5">
           {[1, 2].map(i => (
             <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-navy' : 'w-2 bg-slate-100'}`} />
           ))}
        </div>
      </nav>

      {/* ── CLEAN STACK CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-8 no-scrollbar pt-12 pb-40">
        <div className="space-y-[48px]">
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-[48px]">
                
                {/* Mobility Mode */}
                <section className="space-y-6">
                  <h4 className="text-[17px] font-bold tracking-tight">Mobility Mode</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'walking', icon: Footprints, label: 'Walking' },
                      { id: 'bike', icon: Bike, label: 'Cycle' },
                      { id: 'car', icon: Truck, label: 'Vehicle' }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => setFormData({ ...formData, vehicleType: item.id })}
                        className={`py-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${formData.vehicleType === item.id ? 'bg-navy text-white border-navy shadow-xl shadow-navy/10' : 'bg-slate-50 border-transparent text-slate-400'}`}
                      >
                        <item.icon size={20} />
                        <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Identification / Plate */}
                {formData.vehicleType !== 'walking' && (
                  <section className="space-y-4">
                    <h4 className="text-[17px] font-bold tracking-tight">Identification</h4>
                    <input 
                      type="text" 
                      placeholder="Enter Plate Number (e.g. WXY 1234)"
                      value={formData.plateNumber}
                      className="w-full bg-transparent py-4 text-[15px] font-bold text-navy border-b-[0.5px] border-slate-100 focus:border-accent transition-colors outline-none placeholder:text-slate-200"
                      onChange={e => setFormData({ ...formData, plateNumber: e.target.value.toUpperCase() })}
                    />
                  </section>
                )}

                {/* Signal Frequency / Phone */}
                <section className="space-y-4">
                  <h4 className="text-[17px] font-bold tracking-tight">Signal Frequency</h4>
                  <div className="flex items-center gap-3 py-4 border-b-[0.5px] border-slate-100">
                    <Smartphone size={18} className="text-slate-300" />
                    <input 
                      type="tel" 
                      placeholder="+60 Phone Number"
                      value={formData.phone}
                      className="w-full bg-transparent text-[15px] font-bold text-navy outline-none placeholder:text-slate-200"
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </section>

              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-[48px]">
                
                {/* Revenue Synchronization */}
                <section className="space-y-10">
                  <div className="space-y-2">
                    <h4 className="text-[17px] font-bold tracking-tight">Revenue Node</h4>
                    <p className="text-[13px] text-slate-400 font-medium">Select your institutional fund depository.</p>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <select 
                        value={formData.bankName} 
                        onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                        className="w-full h-16 bg-slate-50 rounded-2xl px-6 text-[15px] font-bold text-navy outline-none appearance-none border border-transparent focus:border-accent/20 transition-all"
                      >
                        <option value="">Select University Bank</option>
                        {MIIT_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 py-4 border-b-[0.5px] border-slate-100">
                      <CreditCard size={18} className="text-slate-300" />
                      <input 
                        type="text" 
                        placeholder="Account Number"
                        value={formData.accountNumber}
                        className="w-full bg-transparent text-[15px] font-bold text-navy outline-none placeholder:text-slate-200"
                        onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-accent/5 rounded-2xl border border-accent/10 flex gap-4">
                    <ShieldCheck className="text-accent shrink-0" size={20} />
                    <p className="text-[11px] font-bold text-accent leading-relaxed">
                      All institutional fund transfers are end-to-end encrypted. Earnings are synchronized every 24 academic hours.
                    </p>
                  </div>
                </section>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ── STICKY NAVIGATION ── */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-white/95 backdrop-blur-xl border-t border-slate-50">
        {step === 1 ? (
          <button 
            onClick={() => setStep(2)}
            disabled={!formData.phone}
            className={`w-full h-16 rounded-2xl font-bold text-[14px] tracking-widest uppercase transition-all duration-300 ${
              formData.phone ? 'bg-navy text-white shadow-xl shadow-navy/10' : 'bg-slate-50 text-slate-200'
            }`}
          >
            Continue Sequence
          </button>
        ) : (
          <button 
            onClick={handleApply}
            disabled={isSubmitting || !isFormValid}
            className={`w-full h-16 rounded-2xl font-bold text-[14px] tracking-widest uppercase transition-all duration-300 ${
              isFormValid ? 'bg-navy text-white shadow-xl shadow-navy/10' : 'bg-slate-50 text-slate-200'
            }`}
          >
            {isSubmitting ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Finalize Synchronization'}
          </button>
        )}
      </div>

    </main>
  );
}
