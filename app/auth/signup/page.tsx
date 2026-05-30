'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Loader2, CheckCircle2, AlertCircle, X
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
      setError("Institutional Violation: Only UniKL email domains (@s.unikl.edu.my or @unikl.edu.my) are authorized.");
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
            className="fixed top-8 left-6 right-6 z-2000 p-4 bg-red-600 text-white rounded-2xl shadow-2xl flex items-start gap-4"
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
                  className="w-full h-[60px] bg-[#0A66C2] text-white rounded-full font-bold text-[16px] hover:bg-[#004182] transition-all mt-4 active:scale-[0.98] shadow-lg shadow-[#0A66C2]/10 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      <span className="uppercase tracking-widest text-[13px] font-black">Syncing...</span>
                    </>
                  ) : (
                    'Sign up'
                  )}
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
                Your institutional identity is now active in the Pulse Central Registry.
              </p>
              <button 
                onClick={() => router.push('/home')}
                className="w-full h-[60px] bg-[#0A66C2] text-white rounded-full font-bold text-[16px] hover:bg-[#004182] transition-all active:scale-[0.98] uppercase tracking-widest"
              >
                Enter Pulse
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-auto text-center pb-4 space-y-4">
          <p className="text-[13px] text-slate-400">
            Already have an account? <button onClick={() => router.push('/auth')} className="text-[#0A66C2] font-bold">Sign in</button>
          </p>
          <div className="h-px bg-slate-100 w-24 mx-auto" />
          <p className="text-[11px] text-slate-300 font-medium px-10 italic">
            Clubs or Verified Merchants: Institutional identities are provisioned solely through the Pulse Admin Terminal.
          </p>
        </div>

      </div>
    </main>
  );
}
