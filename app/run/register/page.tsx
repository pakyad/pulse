'use client'
import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  User, 
  CreditCard, 
  Bike, 
  ShieldCheck, 
  CheckCircle2,
  ArrowRight,
  Clock,
  Building,
  Loader2
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { submitInstitutionalApplication } from '@/lib/auth-utils';

type RegisterStep = 'identity' | 'logistics' | 'payouts' | 'agreement' | 'complete';

function RunnerRegistrationContent() {
  const router = useRouter();
  const [step, setStep] = useState<RegisterStep>('identity');
  const [formData, setFormData] = useState({
    fullName: '',
    matricId: '',
    emergencyContact: '',
    emergencyPhone: '',
    campus: '',
    transport: '',
    licenseUrl: '',
    bankName: '',
    accountNumber: '',
    zones: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const type = (searchParams.get('type') as 'runner' | 'merchant') || 'runner';

  const handleFinalize = async () => {
    if (!auth.currentUser) {
      alert("IDENTITY LOST: Session expired. Please log in again to synchronize your registry.");
      router.push('/auth');
      return;
    }
    setLoading(true);
    try {
      const { success, error } = await submitInstitutionalApplication(auth.currentUser.uid, formData, type);
      if (success) {
        nextStep('complete');
      } else {
        alert(`SYNCHRONIZATION ERROR: ${error}`);
      }
    } catch (err: any) {
      console.error("Finalization failed:", err);
      alert(`SYSTEM CRITICAL: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = (next: RegisterStep) => setStep(next);

  const StepIndicator = ({ current }: { current: number }) => (
    <div className="flex gap-2 mb-12">
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className={`h-1 rounded-full transition-all duration-500 ${
            i <= current ? 'w-8 bg-navy' : 'w-4 bg-slate-100'
          }`}
        />
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans text-navy antialiased">
      <div className="max-w-md mx-auto px-6 pt-16 pb-12">
        
        {/* Navigation */}
        <button 
          onClick={() => step === 'identity' ? router.back() : setStep('identity')} 
          className="mb-8 p-1 -ml-1 text-slate-400 hover:text-navy transition-colors"
        >
          <ChevronLeft size={28} />
        </button>

        <AnimatePresence mode="wait">
          {step === 'identity' && (
            <motion.div 
              key="identity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StepIndicator current={1} />
              <h1 className="text-[32px] font-bold tracking-widest mb-3">Identity Registry</h1>
              <p className="text-slate-400 text-[15px] font-medium mb-10 leading-relaxed">
                Connect your professional persona to the Pulse {type === 'runner' ? 'Carrier' : 'Merchant'} Network.
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1">Full Legal Name</p>
                  <div className="relative">
                    <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="text" 
                      placeholder="As per Student ID"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full h-[60px] bg-white border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-navy outline-none focus:border-navy transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1">Matric Identification</p>
                  <div className="relative">
                    <CreditCard size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="text" 
                      placeholder="UniKL ID Number"
                      value={formData.matricId}
                      onChange={(e) => setFormData({...formData, matricId: e.target.value})}
                      className="w-full h-[60px] bg-white border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-navy outline-none focus:border-navy transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-slate-50">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-navy/30 ml-1">Emergency Protocols</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 ml-1">Next of Kin</p>
                      <input 
                        type="text" 
                        placeholder="Name"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                        className="w-full h-[54px] bg-slate-50 border border-slate-100 rounded-xl px-4 font-bold text-navy outline-none focus:border-navy transition-all text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 ml-1">Emergency Phone</p>
                      <input 
                        type="text" 
                        placeholder="01x-xxx"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                        className="w-full h-[54px] bg-slate-50 border border-slate-100 rounded-xl px-4 font-bold text-navy outline-none focus:border-navy transition-all text-sm" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <button 
                  onClick={() => nextStep('campus' as any)}
                  disabled={!formData.fullName || !formData.matricId || !formData.emergencyContact || !formData.emergencyPhone}
                  className="w-full h-[60px] bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-[16px] shadow-xl shadow-navy/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Confirm Identity
                </button>
              </div>
            </motion.div>
          )}

          {step === ('campus' as any) && (
            <motion.div 
              key="campus"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StepIndicator current={2} />
              <h1 className="text-[32px] font-bold tracking-widest mb-3">Campus Registry</h1>
              <p className="text-slate-400 text-[15px] font-medium mb-10 leading-relaxed">
                Identify your operational hub {type === 'merchant' ? 'for logistical synchronization.' : 'within the UniKL ecosystem.'}
              </p>

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1">Select Institution</p>
                <div className="relative">
                  <select 
                    value={formData.campus}
                    onChange={(e) => setFormData({...formData, campus: e.target.value})}
                    className={`w-full h-[60px] bg-white border border-slate-100 rounded-2xl px-6 font-bold outline-none focus:border-navy appearance-none transition-colors ${
                      formData.campus ? 'text-navy' : 'text-slate-400'
                    }`}
                  >
                    <option value="" className="text-slate-400">Choose your campus</option>
                    <option value="City Campus">UniKL City Campus (MIIT/BIS/MIDI)</option>
                    <option value="BMI">UniKL BMI (Gombak)</option>
                    <option value="MFI">UniKL MFI (Bangi)</option>
                    <option value="MICET">UniKL MICET (Melaka)</option>
                    <option value="MIMET">UniKL MIMET (Perak)</option>
                    <option value="MIAT">UniKL MIAT (Sepang)</option>
                    <option value="RCMP">UniKL RCMP (Ipoh)</option>
                    <option value="MESTECH">UniKL MESTECH (Kajang)</option>
                    <option value="MSI">UniKL MSI (Kulim)</option>
                    <option value="MITEC">UniKL MITEC (Pasir Gudang)</option>
                    <option value="IPROM">UniKL IPROM</option>
                  </select>
                </div>
              </div>

              {formData.campus === 'City Campus' && (
                <div className="mt-8 space-y-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1">Operational Zones</p>
                  <div className="flex flex-wrap gap-2">
                    {['MIIT Branch', 'UBIS Branch', 'MIDI Branch'].map(zone => (
                      <button
                        key={zone}
                        onClick={() => {
                          const newZones = formData.zones.includes(zone) 
                            ? formData.zones.filter(z => z !== zone)
                            : [...formData.zones, zone];
                          setFormData({...formData, zones: newZones});
                        }}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          formData.zones.includes(zone) 
                            ? 'bg-navy text-white border-navy shadow-lg shadow-navy/10' 
                            : 'bg-white text-slate-400 border-slate-100'
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-12">
                <button 
                  onClick={() => nextStep('logistics')}
                  disabled={!formData.campus || (formData.campus === 'City Campus' && formData.zones.length === 0)}
                  className="w-full h-[60px] bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-[16px] shadow-xl shadow-navy/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Verify Campus
                </button>
              </div>
            </motion.div>
          )}

          {step === 'logistics' && (
            <motion.div 
              key="logistics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StepIndicator current={3} />
              <h1 className="text-[32px] font-bold tracking-widest mb-3">{type === 'merchant' ? 'Terminal Profile' : 'Logistics Profile'}</h1>
              <p className="text-slate-400 text-[15px] font-medium mb-10 leading-relaxed">
                {type === 'merchant' 
                  ? 'Define your store operational bandwidth and fulfillment mode.' 
                  : 'Define your logistical reach and operational availability.'
                }
              </p>

              <div className="space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1">Transport Mode</p>
                <div className="grid grid-cols-1 gap-3">
                  {['Walking', 'Bicycle / Scooter', 'Motorcycle', 'Car'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFormData({...formData, transport: mode})}
                      className={`h-[68px] rounded-2xl border px-6 flex items-center justify-between transition-all ${
                        formData.transport === mode ? 'border-navy bg-navy/5' : 'border-slate-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Bike size={20} className={formData.transport === mode ? 'text-navy' : 'text-slate-300'} />
                        <span className={`font-bold transition-colors ${formData.transport === mode ? 'text-navy' : 'text-slate-600'}`}>{mode}</span>
                      </div>
                      {formData.transport === mode && <CheckCircle2 size={20} className="text-navy" />}
                    </button>
                  ))}
                </div>
              </div>

              {(formData.transport === 'Motorcycle' || formData.transport === 'Car') && (
                <div className="mt-8 space-y-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1">Identity Evidence</p>
                  <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-100/50 transition-all">
                    <ShieldCheck size={28} className="text-slate-300" />
                    <p className="text-xs font-bold text-slate-400">Upload Driving License</p>
                    <span className="text-[10px] text-slate-300 font-medium text-center">PDF or JPEG (Max 5MB)</span>
                  </div>
                </div>
              )}

              <div className="mt-12">
                <button 
                  onClick={() => nextStep('payouts')}
                  disabled={!formData.transport}
                  className="w-full h-[60px] bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-[16px] shadow-xl shadow-navy/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Confirm Profile
                </button>
              </div>
            </motion.div>
          )}

          {step === 'payouts' && (
            <motion.div 
              key="payouts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StepIndicator current={4} />
              <h1 className="text-[32px] font-bold tracking-widest mb-3">Payout Terminal</h1>
              <p className="text-slate-400 text-[15px] font-medium mb-10 leading-relaxed">
                Synchronize your bank account for secure, automated hustle payouts.
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1">Bank Name</p>
                  <div className="relative">
                    <Building size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <select 
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      className="w-full h-[60px] bg-white border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-navy outline-none focus:border-navy appearance-none"
                    >
                      <option value="">Select University Partner Bank</option>
                      <option value="Maybank">Maybank</option>
                      <option value="CIMB">CIMB Bank</option>
                      <option value="Bank Islam">Bank Islam</option>
                      <option value="RHB">RHB Bank</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300 ml-1">Account Number</p>
                  <div className="relative">
                    <CheckCircle2 size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="text" 
                      placeholder="Recipient Payout ID"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                      className="w-full h-[60px] bg-white border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-navy outline-none focus:border-navy transition-all" 
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <button 
                  onClick={() => nextStep('agreement')}
                  disabled={!formData.bankName || !formData.accountNumber}
                  className="w-full h-[60px] bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-[16px] shadow-xl shadow-navy/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Link Payment Gateway
                </button>
              </div>
            </motion.div>
          )}

          {step === 'agreement' && (
            <motion.div 
              key="agreement"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StepIndicator current={5} />
              <h1 className="text-[32px] font-bold tracking-widest mb-3">Protocol Agreement</h1>
              <p className="text-slate-400 text-[15px] font-medium mb-10 leading-relaxed">
                Review the {type === 'merchant' ? 'Merchant' : 'Carrier'} Standard Operating Procedures for Pulse.
              </p>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4 mb-10">
                <div className="flex gap-4">
                  <ShieldCheck size={20} className="text-navy shrink-0 mt-0.5" />
                  <p className="text-[13px] font-medium leading-relaxed">I agree to maintain a professional standard of conduct during all deliveries.</p>
                </div>
                <div className="flex gap-4">
                  <Clock size={20} className="text-navy shrink-0 mt-0.5" />
                  <p className="text-[13px] font-medium leading-relaxed">I understand that fulfillment times are critical to my Pulse Reputation Score.</p>
                </div>
              </div>

              <div className="mt-12">
                <button 
                  onClick={handleFinalize}
                  disabled={loading}
                  className="w-full h-[60px] bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-[16px] shadow-xl shadow-navy/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 size={24} className="animate-spin opacity-40" /> : 'Agree & Synchronize'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'complete' && (
            <motion.div 
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2.2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 size={40} />
              </div>
              <h1 className="text-[32px] font-bold tracking-widest mb-4">Registration Sent</h1>
              <p className="text-slate-400 text-[16px] font-medium leading-relaxed mb-12">
                Your credentials are being verified by the Pulse Protocol. You will be notified once your terminal is active.
              </p>
              <button 
                onClick={() => router.push('/run')}
                className="w-full h-[60px] bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-[16px] shadow-xl shadow-navy/20 active:scale-[0.98] transition-all border border-white/10"
              >
                Back to Dashboard
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function RunnerRegistration() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-navy/10 border-t-navy rounded-full animate-spin" />
      </div>
    }>
      <RunnerRegistrationContent />
    </Suspense>
  );
}
