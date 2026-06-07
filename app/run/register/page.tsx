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
import BackButton from '@/components/shared/BackButton';

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
      alert("Session expired. Please log in again.");
      router.push('/auth');
      return;
    }
    setLoading(true);
    try {
      const { success, error } = await submitInstitutionalApplication(auth.currentUser.uid, formData, type);
      if (success) {
        nextStep('complete');
      } else {
        alert(`Error: ${error}`);
      }
    } catch (err: any) {
      console.error("Finalization failed:", err);
      alert(`Critical error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = (next: RegisterStep) => setStep(next);

  const StepIndicator = ({ current }: { current: number }) => (
    <div className="flex gap-2 mb-10">
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            i <= current ? 'bg-gray-900' : 'bg-gray-100'
          }`}
        />
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900 antialiased">
      <div className="max-w-md mx-auto px-6 pt-16 pb-12">
        
        {/* Navigation */}
        <div className="mb-8">
          <BackButton />
        </div>

        <AnimatePresence mode="wait">
          {step === 'identity' && (
            <motion.div 
              key="identity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <StepIndicator current={1} />
              <h1 className="text-2xl font-bold tracking-tight mb-2">Identity Registry</h1>
              <p className="text-gray-400 text-sm font-medium mb-10 leading-relaxed">
                Connect your professional persona to the Pulse {type === 'runner' ? 'Carrier' : 'Merchant'} Network.
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Full Legal Name</p>
                  <div className="relative">
                    <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input 
                      type="text" 
                      placeholder="As per Student ID"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-14 pr-6 font-bold text-gray-900 outline-none focus:border-gray-900 transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Matric Identification</p>
                  <div className="relative">
                    <CreditCard size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input 
                      type="text" 
                      placeholder="UniKL ID Number"
                      value={formData.matricId}
                      onChange={(e) => setFormData({...formData, matricId: e.target.value})}
                      className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-14 pr-6 font-bold text-gray-900 outline-none focus:border-gray-900 transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-gray-50">
                  <p className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Emergency Protocols</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Next of Kin</p>
                      <input 
                        type="text" 
                        placeholder="Name"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                        className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-4 font-bold text-gray-900 outline-none focus:border-gray-900 transition-all text-sm" 
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Phone</p>
                      <input 
                        type="text" 
                        placeholder="01x-xxx"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                        className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-4 font-bold text-gray-900 outline-none focus:border-gray-900 transition-all text-sm" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <button 
                  onClick={() => nextStep('campus' as any)}
                  disabled={!formData.fullName || !formData.matricId || !formData.emergencyContact || !formData.emergencyPhone}
                  className="w-full h-14 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
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
              <h1 className="text-2xl font-bold tracking-tight mb-2">Campus Registry</h1>
              <p className="text-gray-400 text-sm font-medium mb-10 leading-relaxed">
                Identify your operational hub {type === 'merchant' ? 'for logistical synchronization.' : 'within the UniKL ecosystem.'}
              </p>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Select Institution</p>
                <div className="relative">
                  <select 
                    value={formData.campus}
                    onChange={(e) => setFormData({...formData, campus: e.target.value})}
                    className={`w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 font-bold outline-none focus:border-gray-900 appearance-none transition-colors ${
                      formData.campus ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    <option value="" className="text-gray-400">Choose your campus</option>
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
                  <p className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Operational Zones</p>
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
                        className={`px-5 py-2.5 rounded-full border text-xs font-bold transition-all ${
                          formData.zones.includes(zone) 
                            ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                            : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'
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
                  className="w-full h-14 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
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
              <h1 className="text-2xl font-bold tracking-tight mb-2">{type === 'merchant' ? 'Terminal Profile' : 'Logistics Profile'}</h1>
              <p className="text-gray-400 text-sm font-medium mb-10 leading-relaxed">
                {type === 'merchant' 
                  ? 'Define your store operational bandwidth and fulfillment mode.' 
                  : 'Define your logistical reach and operational availability.'
                }
              </p>

              <div className="space-y-4">
                <p className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Transport Mode</p>
                <div className="grid grid-cols-1 gap-3">
                  {['Walking', 'Bicycle / Scooter', 'Motorcycle', 'Car'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFormData({...formData, transport: mode})}
                      className={`h-16 rounded-2xl border px-6 flex items-center justify-between transition-all ${
                        formData.transport === mode ? 'border-gray-900 bg-gray-900/5' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Bike size={20} className={formData.transport === mode ? 'text-gray-900' : 'text-gray-300'} />
                        <span className={`font-bold transition-colors ${formData.transport === mode ? 'text-gray-900' : 'text-gray-500'}`}>{mode}</span>
                      </div>
                      {formData.transport === mode && <CheckCircle2 size={20} className="text-gray-900" />}
                    </button>
                  ))}
                </div>
              </div>

              {(formData.transport === 'Motorcycle' || formData.transport === 'Car') && (
                <div className="mt-8 space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Identity Evidence</p>
                  <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-100/50 transition-all">
                    <ShieldCheck size={28} className="text-gray-300" />
                    <p className="text-xs font-bold text-gray-400">Upload Driving License</p>
                    <span className="text-[10px] text-gray-300 font-medium text-center uppercase tracking-widest">PDF or JPEG (Max 5MB)</span>
                  </div>
                </div>
              )}

              <div className="mt-12">
                <button 
                  onClick={() => nextStep('payouts')}
                  disabled={!formData.transport}
                  className="w-full h-14 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
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
              <h1 className="text-2xl font-bold tracking-tight mb-2">Payout Terminal</h1>
              <p className="text-gray-400 text-sm font-medium mb-10 leading-relaxed">
                Synchronize your bank account for secure, automated hustle payouts.
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Bank Name</p>
                  <div className="relative">
                    <Building size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <select 
                      value={formData.bankName}
                      onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                      className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-14 pr-6 font-bold text-gray-900 outline-none focus:border-gray-900 appearance-none"
                    >
                      <option value="">Select Partner Bank</option>
                      <option value="Maybank">Maybank</option>
                      <option value="CIMB">CIMB Bank</option>
                      <option value="Bank Islam">Bank Islam</option>
                      <option value="RHB">RHB Bank</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 ml-1 uppercase tracking-widest">Account Number</p>
                  <div className="relative">
                    <CheckCircle2 size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input 
                      type="text" 
                      placeholder="Account ID"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                      className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-14 pr-6 font-bold text-gray-900 outline-none focus:border-gray-900 transition-all" 
                    />
                  </div>
                </div>
              </div>

              <div className="mt-12">
                <button 
                  onClick={() => nextStep('agreement')}
                  disabled={!formData.bankName || !formData.accountNumber}
                  className="w-full h-14 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
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
              <h1 className="text-2xl font-bold tracking-tight mb-2">Protocol Agreement</h1>
              <p className="text-gray-400 text-sm font-medium mb-10 leading-relaxed">
                Review the {type === 'merchant' ? 'Merchant' : 'Carrier'} SOPs for Pulse.
              </p>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 space-y-4 mb-10">
                <div className="flex gap-4">
                  <ShieldCheck size={20} className="text-gray-900 shrink-0 mt-0.5" />
                  <p className="text-[13px] font-medium leading-relaxed">I agree to maintain a professional standard of conduct during all deliveries.</p>
                </div>
                <div className="flex gap-4">
                  <Clock size={20} className="text-gray-900 shrink-0 mt-0.5" />
                  <p className="text-[13px] font-medium leading-relaxed">I understand that fulfillment times are critical to my Pulse Reputation Score.</p>
                </div>
              </div>

              <div className="mt-12">
                <button 
                  onClick={handleFinalize}
                  disabled={loading}
                  className="w-full h-14 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50"
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
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <CheckCircle2 size={40} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">Registration Sent</h1>
              <p className="text-gray-400 text-sm font-medium leading-relaxed mb-12">
                Your credentials are being verified. You will be notified once your terminal is active.
              </p>
              <button 
                onClick={() => router.push('/run')}
                className="w-full h-14 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg active:scale-95 transition-all"
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <RunnerRegistrationContent />
    </Suspense>
  );
}
