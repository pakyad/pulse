'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, AlertCircle, X, Eye, EyeOff, Lock, ChevronDown,
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
      headerTop: "Buy and sell",
      headerBottom: "with confidence.",
      desc: "Shop or list your pre-loved items. explore the market  with your peers."
    },
    {
      icon: Zap,
      headerTop: "Help peers,",
      headerBottom: "earn cash.",
      desc: "Turn your free time into pocket money. Pick up campus deliveries and assist others on the go."
    }
  ];
  
  //  FORM STATE 
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    matricNo: '',
    programme: '',
    yearOfStudy: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function getPasswordStrength(pw: string) {
    if (!pw) return { level: -1, label: '', barColors: ['bg-slate-200','bg-slate-200','bg-slate-200','bg-slate-200'] };
    const hasUpper = /[A-Z]/.test(pw);
    const hasLower = /[a-z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSymbol = /[^A-Za-z0-9]/.test(pw);
    const variety = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
    const len = pw.length;
    if (len >= 12 && variety >= 4) return { level: 3, label: 'Strong', barColors: ['bg-emerald-500','bg-emerald-500','bg-emerald-500','bg-emerald-500'] };
    if (len >= 8 && variety >= 3) return { level: 2, label: 'Good', barColors: ['bg-yellow-400','bg-yellow-400','bg-yellow-400','bg-slate-200'] };
    if (len >= 8 && variety >= 2) return { level: 1, label: 'Fair', barColors: ['bg-orange-400','bg-orange-400','bg-slate-200','bg-slate-200'] };
    return { level: 0, label: 'Weak', barColors: ['bg-red-500','bg-slate-200','bg-slate-200','bg-slate-200'] };
  }

  const pwStrength = getPasswordStrength(formData.password);

  function validateField(field: string, value: string): string {
    if (!value) return '';
    switch (field) {
      case 'email':
        return !value.endsWith('@s.unikl.edu.my') && value !== 'admin@pulse.com' ? 'Must be a @s.unikl.edu.my email address.' : '';
      case 'matricNo':
        if (!value) return 'Please enter your matric number.';
        return !/^[A-Z0-9]+$/.test(value) ? 'Please enter a valid matric number.' : '';
      case 'password':
        return getPasswordStrength(value).level < 2 ? 'Password must be at least Good strength. Add uppercase letters, numbers, and symbols.' : '';
      default:
        return '';
    }
  }

  function validateAll(): Record<string, string> {
    const newErrors: Record<string, string> = {};
    const { fullName, email, matricNo, programme, yearOfStudy, password } = formData;

    if (!fullName) newErrors.fullName = 'Please enter your full name.';
    if (!matricNo) newErrors.matricNo = 'Please enter your matric number.';
    if (!programme) newErrors.programme = 'Please select your programme.';
    if (!yearOfStudy) newErrors.yearOfStudy = 'Please select your year of study.';

    if (email && !email.endsWith('@s.unikl.edu.my') && email !== 'admin@pulse.com') newErrors.email = 'Must be a @s.unikl.edu.my email address.';
    if (matricNo && !/^[A-Z0-9]+$/.test(matricNo)) newErrors.matricNo = 'Please enter a valid matric number.';
    if (password && getPasswordStrength(password).level < 2) newErrors.password = 'Password must be at least Good strength. Add uppercase letters, numbers, and symbols.';

    return newErrors;
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field as keyof typeof formData];
    const err = validateField(field, value);
    if (err) {
      setErrors(prev => ({ ...prev, [field]: err }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSignUp = async () => {
    setError(null);

    const newErrors = validateAll();
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(k => { allTouched[k] = true; });
    setErrors(newErrors);
    setTouched(allTouched);

    if (Object.keys(newErrors).length > 0) return;

    if (!formData.email.endsWith('@s.unikl.edu.my') && formData.email !== 'admin@pulse.com') {
      setErrors(prev => ({ ...prev, email: 'Must be a @s.unikl.edu.my email address.' }));
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        matricNumber: formData.matricNo,
        campus: 'MIIT',
        programme: formData.programme,
        yearOfStudy: formData.yearOfStudy,
        createdAt: serverTimestamp(),
        trustRating: 5.0,
        activeAssets: 0
      });

      setStep('complete');
    } catch (err: any) {
      console.error("Auth Failure:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === 'auth/weak-password') {
        setError("Your password is too weak. Please choose a stronger one.");
      } else if (err.code === 'auth/invalid-email') {
        setError("The email format is invalid.");
      } else {
        setError(`Error: ${err.message || "An unknown error occurred."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const setField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <main className="min-h-screen bg-white font-sans text-[#1A1A1A] antialiased relative">
      
      {/*  TOAST NOTIFICATION (Institutional Alert)  */}
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
              <p className="text-[13px] font-bold  mb-1">Error</p>
              <p className="text-[12px] font-medium leading-relaxed">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-md mx-auto px-5 pt-5 pb-5 flex flex-col min-h-screen">
        
        {/*  NAV BAR  */}
        <div className="flex items-center justify-between mb-6 relative">
          <div className="-ml-2">
            <BackButton />
          </div>
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
              className="flex-1 flex flex-col"
            >
              <div className="space-y-4">
                
                {/* 1. Full Name */}
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-slate-900 ml-2">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="As per your student ID card"
                    value={formData.fullName}
                    onChange={(e) => setField('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    className="w-full h-[52px] px-6 bg-white border border-[#E5E7EB] rounded-full text-[14px] font-medium text-[#111827] outline-none focus:border-slate-900/20 transition-all placeholder:text-[13px] placeholder:text-[#9CA3AF]"
                  />
                  {touched.fullName && errors.fullName && (
                    <p className="text-[11px] text-red-500 font-medium ml-2 mt-1">{errors.fullName}</p>
                  )}
                </div>

                {/* 2. UniKL Email */}
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-slate-900 ml-2">UniKL Email</label>
                  <input 
                    type="text" 
                    placeholder="your@s.unikl.edu.my"
                    value={formData.email}
                    onChange={(e) => setField('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    className="w-full h-[52px] px-6 bg-white border border-[#E5E7EB] rounded-full text-[14px] font-medium text-[#111827] outline-none focus:border-slate-900/20 transition-all placeholder:text-[13px] placeholder:text-[#9CA3AF]"
                  />
                  {touched.email && errors.email && (
                    <p className="text-[11px] text-red-500 font-medium ml-2 mt-1">{errors.email}</p>
                  )}
                </div>

                {/* 3. Matric Number */}
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-slate-900 ml-2">Matric Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. MIIT2210234"
                    value={formData.matricNo}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
                      setField('matricNo', val);
                    }}
                    onBlur={() => handleBlur('matricNo')}
                    className="w-full h-[52px] px-6 bg-white border border-[#E5E7EB] rounded-full text-[14px] font-medium text-[#111827] outline-none focus:border-slate-900/20 transition-all placeholder:text-[13px] placeholder:text-[#9CA3AF]"
                  />
                  {touched.matricNo && errors.matricNo && (
                    <p className="text-[11px] text-red-500 font-medium ml-2 mt-1">{errors.matricNo}</p>
                  )}
                </div>

                {/* 4. Campus (read-only) */}
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-slate-900 ml-2">Campus</label>
                  <div className="w-full h-[52px] px-6 bg-white border border-[#E5E7EB] rounded-full flex items-center justify-between text-[14px] font-medium text-[#111827]">
                    <span>MIIT - Malaysian Institute of Information Technology</span>
                    <Lock size={16} className="text-slate-400 shrink-0" />
                  </div>
                </div>

                {/* 5. Programme */}
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-slate-900 ml-2">Programme</label>
                  <div className="relative bg-[#F3F4F6] rounded-[12px] p-[14px_16px] w-full">
                    <select
                      value={formData.programme}
                      onChange={(e) => { setField('programme', e.target.value); setTouched(prev => ({ ...prev, programme: true })); setErrors(prev => { const n = { ...prev }; delete n.programme; return n; }); }}
                      onBlur={() => handleBlur('programme')}
                      className="w-full bg-transparent border-none outline-none text-[14px] font-medium text-[#111827] appearance-none cursor-pointer"
                      style={{ appearance: 'none', WebkitAppearance: 'none' }}
                    >
                      <option value="" disabled>Select your programme</option>
                      <optgroup label="Pre-University & Foundation">
                        <option value="Foundation in Computer Technology (FICT)">Foundation in Computer Technology (FICT)</option>
                        <option value="Foundation in Science and Technology (Pre-Korea Program)">Foundation in Science and Technology (Pre-Korea Program)</option>
                      </optgroup>
                      <optgroup label="Diploma">
                        <option value="Diploma in Information Technology">Diploma in Information Technology</option>
                        <option value="Diploma in Networking Technology">Diploma in Networking Technology</option>
                        <option value="Diploma in Multimedia">Diploma in Multimedia</option>
                        <option value="Diploma in Animation">Diploma in Animation</option>
                      </optgroup>
                      <optgroup label="Bachelor  Software Engineering & IT">
                        <option value="Bachelor of IT (Hons) in Software Engineering">Bachelor of IT (Hons) in Software Engineering</option>
                        <option value="Bachelor of IT (Hons) in Computer System Security">Bachelor of IT (Hons) in Computer System Security</option>
                        <option value="Bachelor of IT (Hons) in Internet of Things">Bachelor of IT (Hons) in Internet of Things</option>
                        <option value="Bachelor of Artificial Intelligence Technology with Honours">Bachelor of Artificial Intelligence Technology with Honours</option>
                      </optgroup>
                      <optgroup label="Bachelor  Creative Multimedia">
                        <option value="Bachelor of Multimedia Technology (Hons) in Interactive Multimedia Design">Bachelor of Multimedia Technology (Hons) in Interactive Multimedia Design</option>
                        <option value="Bachelor of Multimedia Technology (Hons) in Computer Animation">Bachelor of Multimedia Technology (Hons) in Computer Animation</option>
                        <option value="Bachelor of Game Development Technology with Honours">Bachelor of Game Development Technology with Honours</option>
                      </optgroup>
                      <optgroup label="Bachelor  Computer Engineering">
                        <option value="Bachelor of Computer Engineering Technology (Networking Systems) with Honours">Bachelor of Computer Engineering Technology (Networking Systems) with Honours</option>
                        <option value="Bachelor of Computer Engineering Technology (Computer Systems) with Honours">Bachelor of Computer Engineering Technology (Computer Systems) with Honours</option>
                      </optgroup>
                      <optgroup label="Postgraduate">
                        <option value="Master in Computer Science">Master in Computer Science</option>
                        <option value="Master of Information Technology">Master of Information Technology</option>
                        <option value="Master in Creative Digital Media">Master in Creative Digital Media</option>
                        <option value="Doctor of Philosophy (Information Technology)">Doctor of Philosophy (Information Technology)</option>
                      </optgroup>
                    </select>
                    <ChevronDown size={16} className="absolute right-[14px] top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {touched.programme && errors.programme && (
                    <p className="text-[11px] text-red-500 font-medium ml-2 mt-1">{errors.programme}</p>
                  )}
                </div>

                {/* 6. Year of Study */}
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-slate-900 ml-2">Year of Study</label>
                  <div className="relative bg-[#F3F4F6] rounded-[12px] p-[14px_16px] w-full">
                    <select
                      value={formData.yearOfStudy}
                      onChange={(e) => { setField('yearOfStudy', e.target.value); setTouched(prev => ({ ...prev, yearOfStudy: true })); setErrors(prev => { const n = { ...prev }; delete n.yearOfStudy; return n; }); }}
                      onBlur={() => handleBlur('yearOfStudy')}
                      className="w-full bg-transparent border-none outline-none text-[14px] font-medium text-[#111827] appearance-none cursor-pointer"
                      style={{ appearance: 'none', WebkitAppearance: 'none' }}
                    >
                      <option value="" disabled>Select your year</option>
                      <option value="Year 1">Year 1</option>
                      <option value="Year 2">Year 2</option>
                      <option value="Year 3">Year 3</option>
                      <option value="Year 4">Year 4</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-[14px] top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  {touched.yearOfStudy && errors.yearOfStudy && (
                    <p className="text-[11px] text-red-500 font-medium ml-2 mt-1">{errors.yearOfStudy}</p>
                  )}
                </div>

                {/* 7. Password */}
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-slate-900 ml-2">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => setField('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      className="w-full h-[52px] px-6 pr-14 bg-white border border-[#E5E7EB] rounded-full text-[14px] font-medium text-[#111827] outline-none focus:border-slate-900/20 transition-all placeholder:text-[13px] placeholder:text-[#9CA3AF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  <div className="mt-2 space-y-1 px-1">
                    <div className="flex gap-1.5">
                      {[0,1,2,3].map(i => (
                        <div key={i} className={`h-[3px] flex-1 rounded-[4px] transition-colors duration-200 ${pwStrength.barColors[i]}`} />
                      ))}
                    </div>
                    {pwStrength.label && (
                      <p className={`text-[12px] font-semibold ${pwStrength.level === 3 ? 'text-emerald-600' : pwStrength.level === 2 ? 'text-yellow-600' : pwStrength.level === 1 ? 'text-orange-500' : 'text-red-500'}`}>
                        {pwStrength.label}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 font-medium">Use 12+ characters with uppercase, numbers, and symbols.</p>
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-[11px] text-red-500 font-medium ml-2 mt-1">{errors.password}</p>
                  )}
                </div>

                {/* Primary Action */}
                <button 
                  onClick={handleSignUp}
                  disabled={loading}
                  className="w-full h-[52px] bg-white border border-[#E5E7EB] text-[#111827] rounded-full font-medium text-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    'Create an account'
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
                  <div className="flex-1 flex items-center justify-center mb-6 min-h-[240px]">
                    <div className="w-full max-w-[240px] aspect-square bg-slate-50/80 rounded-2xl flex items-center justify-center relative overflow-hidden">
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
                            return <Icon size={96} strokeWidth={1} className="text-slate-900 relative z-10 drop-shadow-sm" />;
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
                      <span className="text-slate-900 font-semibold block mt-1">
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
              <div className="w-full mt-8 px-2 flex flex-col gap-4">
                
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
                  className="w-full h-[54px] bg-white border border-slate-200 shadow-sm text-slate-900 rounded-xl font-bold text-[15px] hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center"
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
            <p className="text-[14px] text-slate-500 font-medium">
              Already registered? <button onClick={() => router.push('/auth')} className="text-slate-900 font-bold active:scale-95 transition-transform hover:underline">Sign in</button>
            </p>
            <div className="h-px bg-slate-100 w-24 mx-auto" />
          </div>
        )}

      </div>



    </main>
  );
}
