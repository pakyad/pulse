'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Loader2, AlertCircle, X,
  Fingerprint, Store, Zap
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function PerfectSignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'complete'>('form');
  const [error, setError] = useState<string | null>(null);
  const [onboardStep, setOnboardStep] = useState(0);

  // Secret Dev Bypass: Navigate to /auth/signup#test-complete to view UI without registering
  useEffect(() => {
    if (window.location.hash === '#test-complete') {
      setStep('complete');
    }
  }, []);

  const ONBOARDING_SLIDES = [
    {
      icon: Fingerprint,
      headerTop: "Your campus,",
      headerBottom: "fully connected.",
      desc: "Your entire university in one place. Connect and interact using your verified student identity."
    },
    {
      icon: Store,
      headerTop: "Buy, sell, and",
      headerBottom: "trade locally.",
      desc: "Grab lunch from the cafe or trade used textbooks. A simple marketplace for everyday essentials."
    },
    {
      icon: Zap,
      headerTop: "Help peers,",
      headerBottom: "earn cash.",
      desc: "Turn your free time into pocket money. Pick up campus deliveries and assist others on the go."
    }
  ];
  
  // ── FORM STATE ──
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    matricNo: '',
    campus: '',
    password: ''
  });

  const handleSignUp = async () => {
    setError(null);
    const { fullName, email, matricNo, campus, password } = formData;

    // 1. INSTITUTIONAL DOMAIN VALIDATION (REGEX)
    const uniklRegex = /^[\w-\.]+@(s\.)?unikl\.edu\.my$/;
    if (!uniklRegex.test(email)) {
      setError("Institutional Violation: Only UniKL email categories (@s.unikl.edu.my or @unikl.edu.my) are authorized.");
      return;
    }

    if (!fullName || !matricNo || !campus || !password) {
      setError("Protocol Error: All identity fields are mandatory.");
      return;
    }

    if (password.length < 6) {
      setError("Security Alert: Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // 2. FIREBASE AUTH CREATION
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. FIRESTORE IDENTITY COMMIT
      await setDoc(doc(db, "users", user.uid), {
        full_name: fullName,
        email: email,
        matric_no: matricNo,
        campus: campus,
        role: 'STUDENT', // Default role
        is_verified: true, // Automatic verification for student base
        is_verified_runner: false,
        balance: 0,
        created_at: serverTimestamp()
      });

      setStep('complete');
    } catch (err: any) {
      console.error("Auth Failure:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Identity Conflict: This email is already registered in the Pulse Registry.");
      } else if (err.code === 'auth/weak-password') {
        setError("Security Alert: The provided password is too weak.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Protocol Error: The email format is invalid.");
      } else {
        setError(`Registry Error: ${err.message || "An unknown authentication failure occurred."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white font-sans text-[#1A1A1A] antialiased relative">
      
      {/* ── TOAST NOTIFICATION (Institutional Alert) ── */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-6 right-6 z-2000 p-4 bg-red-600 text-white rounded-2xl shadow-md flex items-start gap-4"
          >
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-[13px] font-bold uppercase tracking-widest mb-1">Authorization Alert</p>
              <p className="text-[12px] font-medium leading-relaxed">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-md mx-auto px-6 pt-12 pb-12 flex flex-col min-h-screen">
        
        {/* ── NAV BAR ── */}
        <div className="flex items-center justify-between mb-12 relative">
          <BackButton />
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
              className="flex-1 flex flex-col justify-center -mt-10"
            >
              <div className="space-y-5">
                
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-black/30 ml-4">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full h-[54px] px-8 bg-[#F2F8FF] border-none rounded-full text-[14px] font-medium text-black outline-none focus:ring-2 focus:ring-[#0A66C2]/10 transition-all placeholder:text-slate-400/30"
                  />
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-black/30 ml-4">University Email</label>
                  <input 
                    type="email" 
                    placeholder="student@s.unikl.edu.my"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full h-[54px] px-8 bg-[#F2F8FF] border-none rounded-full text-[14px] font-medium text-black outline-none focus:ring-2 focus:ring-[#0A66C2]/10 transition-all placeholder:text-slate-400/30"
                  />
                </div>

                {/* Matric & Major Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-black/30 ml-4">Matric No</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 52213..."
                      value={formData.matricNo}
                      onChange={(e) => setFormData({...formData, matricNo: e.target.value})}
                      className="w-full h-[54px] px-8 bg-[#F2F8FF] border-none rounded-full text-[14px] font-medium text-black outline-none focus:ring-2 focus:ring-[#0A66C2]/10 transition-all placeholder:text-slate-400/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-black/30 ml-4">Campus</label>
                    <div className="relative">
                      <select 
                        value={formData.campus}
                        onChange={(e) => setFormData({...formData, campus: e.target.value})}
                        className="w-full h-[54px] px-8 bg-[#F2F8FF] border-none rounded-full text-[14px] font-medium text-black outline-none focus:ring-2 focus:ring-[#0A66C2]/10 transition-all appearance-none"
                      >
                        <option value="" disabled>Select</option>
                        <option value="MIIT">MIIT</option>
                        <option value="UBIS">UBIS</option>
                        <option value="BMI">BMI</option>
                        <option value="MSI">MSI</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                         <ChevronLeft className="-rotate-90" size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-black/30 ml-4">Password</label>
                  <input 
                    type="password" 
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full h-[54px] px-8 bg-[#F2F8FF] border-none rounded-full text-[14px] font-medium text-black outline-none focus:ring-2 focus:ring-[#0A66C2]/10 transition-all placeholder:text-slate-400/30"
                  />
                </div>

                {/* Primary Action */}
                <button 
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full h-[60px] bg-white border border-slate-200 text-slate-900 shadow-sm rounded-full font-black text-[13px] uppercase tracking-widest hover:bg-slate-50 transition-all mt-4 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Syncing Identity...</span>
                    </>
                  ) : (
                    'Register Identity'
                  )}
                </button>

              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="complete"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col pt-4 pb-4"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={onboardStep}
                  initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
                  transition={{ type: "spring", bounce: 0, duration: 0.6 }}
                  className="flex-1 flex flex-col"
                >
                  {/* Huge Visual Area - Top Half */}
                  <div className="flex-1 flex items-center justify-center mb-8 min-h-[280px]">
                    <div className="w-full max-w-[280px] aspect-square bg-slate-50/80 rounded-2xl flex items-center justify-center relative overflow-hidden">
                      {/* Subtle organic background decoration */}
                      <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-transparent to-slate-100/50" />
                      <motion.div 
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -right-8 -top-8 w-40 h-40 bg-white rounded-full blur-3xl opacity-60" 
                      />
                      <motion.div
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                      >
                        <motion.div
                          animate={{ y: [-4, 4, -4] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                          {(() => {
                            const Icon = ONBOARDING_SLIDES[onboardStep].icon;
                            return <Icon size={120} strokeWidth={1} className="text-slate-900 relative z-10 drop-shadow-sm" />;
                          })()}
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                  
                  {/* Typography - Left Aligned */}
                  <div className="px-2">
                    <motion.h2 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, type: "spring", bounce: 0 }}
                      className="text-[28px] font-bold tracking-tight text-slate-500 mb-4 leading-[1.1]"
                    >
                      {ONBOARDING_SLIDES[onboardStep].headerTop}
                      <span className="text-slate-900 font-black block mt-1">
                        {ONBOARDING_SLIDES[onboardStep].headerBottom}
                      </span>
                    </motion.h2>
                    
                    <motion.p 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, type: "spring", bounce: 0 }}
                      className="text-[15px] text-slate-500 font-medium leading-relaxed max-w-[300px]"
                    >
                      {ONBOARDING_SLIDES[onboardStep].desc}
                    </motion.p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation & Footer (Matches the screenshot layout) */}
              <div className="w-full mt-10 px-2 flex flex-col gap-6">
                
                {/* Progress Dots */}
                <div className="flex justify-center gap-2">
                  {ONBOARDING_SLIDES.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === onboardStep ? 'w-4 bg-slate-900' : 'w-2 bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Action Button */}
                <button 
                  onClick={() => {
                    if (onboardStep < ONBOARDING_SLIDES.length - 1) {
                      setOnboardStep(prev => prev + 1);
                    } else {
                      router.push('/home');
                    }
                  }}
                  className="w-full h-[54px] bg-white border border-slate-200 shadow-sm text-slate-900 rounded-xl font-bold text-[15px] hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  {onboardStep < ONBOARDING_SLIDES.length - 1 ? 'Continue' : 'Enter Pulse'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        {step === 'form' && (
          <div className="mt-auto text-center pb-4 space-y-4">
            <p className="text-[13px] text-slate-400 font-medium">
              Already registered? <button onClick={() => router.push('/auth')} className="text-slate-900 font-bold active:scale-95 transition-transform">Sign in to Terminal</button>
            </p>
            <div className="h-px bg-slate-100 w-24 mx-auto" />
            <p className="text-[11px] text-slate-300 font-medium px-10 italic">
              Clubs or Verified Merchants: Institutional identities are provisioned solely through the Pulse Admin Terminal.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
