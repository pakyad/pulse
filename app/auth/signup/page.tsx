'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Loader2, CheckCircle2
} from 'lucide-react';

export default function PerfectSignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'complete'>('form');

  const handleMicrosoftLink = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('complete');
    }, 1500);
  };

  const handleSignUp = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('complete');
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-white font-sans text-[#1A1A1A] antialiased relative">
      <div className="max-w-md mx-auto px-6 pt-12 pb-12 flex flex-col min-h-screen">
        
        {/* ── NAV BAR ── */}
        <div className="flex items-center justify-between mb-12 relative">
          <button 
            onClick={() => step === 'complete' ? setStep('form') : router.back()}
            className="w-10 h-10 rounded-full bg-[#F2F8FF] flex items-center justify-center text-black hover:opacity-70 transition-all active:scale-90"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 className="text-[17px] font-bold absolute left-1/2 -translate-x-1/2">
            {step === 'form' ? 'Sign up' : 'Welcome'}
          </h1>
          <div className="w-10" />
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col justify-center -mt-20"
            >
              <div className="space-y-5">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-black ml-4 opacity-80">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your full name"
                    className="w-full h-[54px] px-8 bg-[#F2F8FF] border-none rounded-full text-[14px] font-medium text-black outline-none focus:ring-2 focus:ring-[#0A66C2]/10 transition-all placeholder:text-slate-400/50"
                  />
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-black ml-4 opacity-80">University Email</label>
                  <input 
                    type="email" 
                    placeholder="student@s.unikl.edu.my"
                    className="w-full h-[54px] px-8 bg-[#F2F8FF] border-none rounded-full text-[14px] font-medium text-black outline-none focus:ring-2 focus:ring-[#0A66C2]/10 transition-all placeholder:text-slate-400/50"
                  />
                </div>

                {/* Matric & Major Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-black ml-4 opacity-80">Matric No</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 52213..."
                      className="w-full h-[54px] px-8 bg-[#F2F8FF] border-none rounded-full text-[14px] font-medium text-black outline-none focus:ring-2 focus:ring-[#0A66C2]/10 transition-all placeholder:text-slate-400/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-black ml-4 opacity-80">Campus</label>
                    <select 
                      defaultValue=""
                      className="w-full h-[54px] px-6 bg-[#F2F8FF] border-none rounded-full text-[14px] font-medium text-black outline-none focus:ring-2 focus:ring-[#0A66C2]/10 transition-all appearance-none"
                    >
                      <option value="" disabled>Select Campus</option>
                      <option className="text-black">MIIT</option>
                      <option className="text-black">UBIS</option>
                      <option className="text-black">BMI</option>
                    </select>
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-black ml-4 opacity-80">Password</label>
                  <input 
                    type="password" 
                    placeholder="Create a password"
                    className="w-full h-[54px] px-8 bg-[#F2F8FF] border-none rounded-full text-[14px] font-medium text-black outline-none focus:ring-2 focus:ring-[#0A66C2]/10 transition-all placeholder:text-slate-400/50"
                  />
                </div>

                {/* Microsoft Link (Simplified) */}
                <button 
                  onClick={handleMicrosoftLink}
                  className="w-full h-[54px] px-8 bg-white border border-slate-100 rounded-full flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" width="16" height="16">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                  <span className="text-[13px] font-bold text-slate-400">Continue with Microsoft</span>
                </button>

                {/* Primary Action */}
                <button 
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full h-[60px] bg-[#0A66C2] text-white rounded-full font-bold text-[16px] hover:bg-[#004182] transition-all mt-4 active:scale-[0.98] shadow-lg shadow-[#0A66C2]/10 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : 'Sign up'}
                </button>

              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center -mt-20"
            >
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20">
                <CheckCircle2 size={40} strokeWidth={3} />
              </div>
              <h2 className="text-[24px] font-black tracking-tight mb-2">Sync Complete.</h2>
              <p className="text-[14px] text-slate-400 font-medium px-8 leading-relaxed mb-10">
                Your institutional identity is now active. Welcome to Pulse.
              </p>
              <button 
                onClick={() => router.push('/home')}
                className="w-full h-[60px] bg-[#0A66C2] text-white rounded-full font-bold text-[16px] hover:bg-[#004182] transition-all active:scale-[0.98]"
              >
                Enter Pulse
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-auto text-center pb-4">
          <p className="text-[13px] text-slate-400">
            Already have an account? <button onClick={() => router.push('/auth')} className="text-[#0A66C2] font-bold">Sign in</button>
          </p>
        </div>

      </div>
    </main>
  );
}
