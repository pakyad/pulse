'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, ChevronLeft, Github, 
  GraduationCap, Building2, Bike, Globe, Loader2
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Branded Institutional Icons
const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M47.532 24.5528C47.532 22.8114 47.3904 21.4325 47.1072 20.088H24.48V28.56H37.5408C36.9744 31.3927 35.1312 33.728 32.5152 35.3568V40.7328H40.5456C45.2496 36.4158 47.532 30.1518 47.532 24.5528Z" fill="#4285F4"/>
    <path d="M24.48 48C30.9504 48 36.408 45.8761 40.5456 40.7328L32.5152 35.3568C30.3168 36.845 27.6048 37.836 24.48 37.836C18.2256 37.836 12.9264 33.644 11.016 28.0264H2.7648V34.4173C6.7728 42.4578 15.024 48 24.48 48Z" fill="#34A853"/>
    <path d="M11.016 28.0264C10.5456 26.6534 10.2864 25.1744 10.2864 23.6331C10.2864 22.0917 10.5456 20.6127 11.016 19.2397V12.8488H2.7648C1.0032 16.3248 0 20.2522 0 23.6331C0 27.0139 1.0032 30.9413 2.7648 34.4173L11.016 28.0264Z" fill="#FBBC05"/>
    <path d="M24.48 9.4932C28.0032 9.4932 31.1184 10.7011 33.6144 13.0656L40.7328 5.8608C36.384 1.83859 30.9264 0 24.48 0C15.024 0 6.7728 5.5422 2.7648 13.5827L11.016 19.9736C12.9264 14.356 18.2256 10.164 24.48 9.4932Z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0H10.9V10.9H0V0Z" fill="#F25022"/>
    <path d="M12.1 0H23V10.9H12.1V0Z" fill="#7FBA00"/>
    <path d="M0 12.1H10.9V23H0V12.1Z" fill="#00A4EF"/>
    <path d="M12.1 12.1H23V23H12.1V12.1Z" fill="#FFB900"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 384 512" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<'landing' | 'login' | 'register'>('landing');
  const [msStage, setMsStage] = useState<'none' | 'login' | 'permissions' | 'loading'>('none');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Microsoft Simulation Protocol
  const startMSSimulation = () => setMsStage('login');
  const proceedToPermissions = () => { setMsStage('loading'); setTimeout(() => setMsStage('permissions'), 800); };
  const completeMSLogin = async () => {
    setMsStage('loading');
    setTimeout(async () => {
        // Simulate role check for MS login
        if (email.includes('admin')) {
          router.push('/admin/dashboard');
        } else if (email.includes('club')) {
          router.push('/merchant');
        } else {
          router.push('/home');
        }
    }, 1500);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Phase 1: Robust Identity Lookup
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (userData.role === 'CLUB') {
          router.push('/merchant');
        } else {
          router.push('/home');
        }
      } else {
        // Fallback: Check if it's the super-admin bypass
        if (user.email === 'admin@pulse.com') {
          router.push('/admin/dashboard');
        } else {
          router.push('/home');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Identity verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: Admin Seed Protocol (For Testing)
  const handleSeedClub = async () => {
     setLoading(true);
     try {
        const { createInstitutionalMerchant } = await import('@/lib/auth-utils');
        await createInstitutionalMerchant(email, password, "Software Engineering Club");
        alert("Institutional Identity Initialized. You can now log in.");
     } catch (err: any) {
        setError(err.message || "Seed failed");
     } finally {
        setLoading(false);
     }
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900 overflow-x-hidden antialiased relative">
      
      {/* 1. MICROSOFT AUTH OVERLAY SIMULATION */}
      <AnimatePresence>
        {msStage !== 'none' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" >
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-[440px] shadow-2xl p-10 relative overflow-hidden rounded-2xl" >
              <div className="flex gap-1 mb-8"> <div className="w-3.5 h-3.5 bg-[#F25022]" /> <div className="w-3.5 h-3.5 bg-[#7FBA00]" /> <div className="w-3.5 h-3.5 bg-[#00A4EF]" /> <div className="w-3.5 h-3.5 bg-[#FFB900]" /> <span className="ml-2 -mt-1 text-[22px] font-semibold text-slate-500 tracking-tight">Microsoft</span> </div>
              {msStage === 'login' && ( <div className="space-y-6"> <h2 className="text-[24px] font-semibold text-slate-900 leading-tight">Sign in</h2> <input type="email" placeholder="matric@unikl.edu.my" className="w-full border-b border-black text-[15px] py-2 focus:outline-none font-medium" /> <div className="pt-4 flex justify-end"> <button onClick={proceedToPermissions} className="bg-[#0067B8] text-white px-8 py-2 text-[15px] font-medium">Next</button> </div> </div> )}
              {msStage === 'permissions' && ( <div className="space-y-6"> <div className="flex items-center gap-4 py-2 border-b border-slate-100 mb-4"> <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-white font-black italic">P</div> <div><h2 className="text-[17px] font-semibold">Pulse University Sync</h2></div> </div> <div className="pt-6 flex justify-end gap-4"> <button onClick={() => setMsStage('none')} className="bg-slate-50 text-slate-700 px-8 py-2 text-[15px] font-medium rounded">Cancel</button> <button onClick={completeMSLogin} className="bg-[#0067B8] text-white px-8 py-2 text-[15px] font-medium">Accept</button> </div> </div> )}
              {msStage === 'loading' && ( <div className="py-20 flex flex-col items-center justify-center gap-4"> <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" /> </div> )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div key="landing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="relative z-10 flex flex-col min-h-screen px-8 pt-24 pb-12 items-center max-w-lg mx-auto w-full" >
            {/* Logo/Header Container */}
            <div className="flex flex-col items-center mb-16">
               <div className="relative group mb-8">
                  <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  <div className="w-20 h-20 rounded-[2.2rem] bg-navy flex items-center justify-center shadow-2xl relative z-10 border border-white/5 active:scale-95 transition-transform cursor-pointer">
                     <span className="text-white text-4xl font-bold tracking-tight">P</span>
                  </div>
               </div>
               <h1 className="text-[44px] leading-tight font-black tracking-tighter text-navy uppercase">Pulse</h1>
               <p className="text-slate-400 text-[13px] font-bold tracking-[0.1em] text-center mt-2 opacity-60"> UNIVERSITY HEARTBEAT OS </p>
            </div>

            {/* Direct Handshake Console */}
            <div className="w-full space-y-5 mb-10">
               {error && (
                 <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 text-[11px] font-black uppercase tracking-widest">
                    {error}
                 </div>
               )}

               <div className="space-y-1.5"> 
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Identity Key</p> 
                  <div className="relative shadow-sm rounded-2xl overflow-hidden"> 
                    <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" /> 
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="matric@unikl.edu.my" 
                      className="w-full h-[52px] bg-white border border-slate-100 pl-14 pr-6 font-bold text-navy outline-none focus:border-navy/20 transition-colors text-[14px]" 
                    /> 
                  </div> 
               </div>

               <div className="space-y-1.5"> 
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Security Token</p> 
                  <div className="relative shadow-sm rounded-2xl overflow-hidden"> 
                    <Lock size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" /> 
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••" 
                      className="w-full h-[52px] bg-white border border-slate-100 pl-14 pr-6 font-bold text-navy outline-none focus:border-navy/20 transition-colors text-[14px]" 
                    /> 
                  </div> 
               </div>

               <button 
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full h-[52px] bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-[12px] tracking-[0.2em] uppercase shadow-2xl shadow-navy/20 active:scale-[0.98] transition-all disabled:opacity-50"
               > 
                  {loading ? <Loader2 size={24} className="animate-spin text-white/40" /> : 'Sign In'} 
               </button> 

               {email === 'testclub@pulse.com' && (
                  <button onClick={handleSeedClub} className="w-full h-[44px] bg-accent/10 border border-accent/20 text-accent rounded-xl flex items-center justify-center font-bold text-[10px] tracking-widest uppercase active:scale-[0.98] transition-all" >
                     Initialize Institutional Identity
                  </button>
               )}
            </div>

            {/* University SSO Divider */}
            <div className="w-full relative flex items-center justify-center mb-8">
               <div className="w-full border-t border-slate-100" />
               <span className="bg-[#FDFDFD] px-4 text-[10px] font-black text-slate-200 uppercase tracking-widest absolute">Unified Sync</span>
            </div>

            <div className="w-full max-w-[300px]">
               <button onClick={startMSSimulation} className="w-full h-[50px] bg-white border border-slate-100 rounded-2xl flex items-center justify-between px-6 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm">
                 <div className="flex items-center gap-4"> <MicrosoftIcon /> <span className="font-bold text-[13px] text-navy">Sign in with Microsoft</span> </div> <Globe size={14} className="text-slate-300" />
               </button>
            </div>

            <div className="mt-auto text-center pt-8 space-y-1">
               <p className="text-[13px] text-slate-400 font-medium">Haven&apos;t signed up yet?</p>
               <button onClick={() => setView('register')} className="text-[14px] font-bold text-blue-600 hover:underline transition-all">
                  Create an account
               </button>
            </div>
          </motion.div>
        )}

        {view === 'login' && (
          <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col min-h-screen px-8 pt-16 pb-12 max-w-lg mx-auto w-full" >
            <button onClick={() => setView('landing')} className="mb-8 p-1 -ml-1 text-slate-400 hover:text-slate-900 transition-colors"> <ChevronLeft size={28} /> </button>
            
            <header className="mb-10">
               <h1 className="text-[32px] font-black tracking-tighter text-navy uppercase">Handshake</h1>
               <p className="text-slate-400 text-[14px] font-bold tracking-widest mt-1">AUTHORIZE TERMINAL SESSION</p>
            </header>

            <div className="space-y-6 flex-1">
               {error && (
                 <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 text-[12px] font-bold">
                    {error}
                 </div>
               )}

               <div className="space-y-2"> 
                  <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity Key (UniKL Email)</p> 
                  <div className="relative"> 
                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" /> 
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="matric@unikl.edu.my" 
                      className="w-full h-[58px] bg-white border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-navy outline-none focus:border-navy transition-colors" 
                    /> 
                  </div> 
               </div>

               <div className="space-y-2"> 
                  <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 ml-1">Security Token</p> 
                  <div className="relative"> 
                    <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" /> 
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••" 
                      className="w-full h-[58px] bg-white border border-slate-100 rounded-2xl pl-14 pr-6 font-bold text-navy outline-none focus:border-navy transition-colors" 
                    /> 
                  </div> 
               </div>
            </div>

            <div className="mt-10 space-y-4"> 
               <button 
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full h-[50px] bg-navy text-white rounded-2xl flex items-center justify-center font-bold text-[13px] tracking-widest uppercase shadow-xl shadow-navy/20 active:scale-[0.98] transition-all disabled:opacity-50"
               > 
                  {loading ? <Loader2 size={24} className="animate-spin text-white/40" /> : 'Establish Connection'} 
               </button> 

               {email === 'testclub@pulse.com' && (
                  <button 
                    onClick={handleSeedClub}
                    disabled={loading}
                    className="w-full h-[50px] bg-accent/10 border border-accent/20 text-accent rounded-2xl flex items-center justify-center font-bold text-[12px] tracking-widest uppercase active:scale-[0.98] transition-all"
                  >
                     {loading ? <Loader2 size={20} className="animate-spin" /> : 'Seed Institutional Identity'}
                  </button>
               )}
            </div>
          </motion.div>
        )}

        {/* Register View (Restored to Exact Design Spec) */}
        {view === 'register' && (
          <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col min-h-screen font-sans bg-white" >
            {/* Header Area */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-transparent relative">
               <button onClick={() => setView('landing')} className="p-2 -ml-2 text-slate-900">
                  <span className="text-2xl font-light">×</span> 
               </button>
               <h2 className="absolute left-1/2 -translate-x-1/2 text-[16px] font-bold text-navy">Create an account</h2>
               <div className="w-10" /> {/* Spacer */}
            </header>

            <div className="px-6 pt-10 flex-1 overflow-y-auto no-scrollbar pb-10">
               <h1 className="text-[34px] font-bold text-navy tracking-tight mb-2">Let&apos;s get started</h1>
               <p className="text-[14px] text-slate-500 mb-10 leading-snug">Use your email or continue with social to create an account.</p>

               <div className="space-y-4 mb-8">
                  <input 
                    type="email" 
                    placeholder="Email" 
                    className="w-full h-[58px] bg-white border border-slate-200 rounded-xl px-5 text-[15px] font-medium text-navy placeholder:text-slate-400 outline-none focus:border-navy transition-colors" 
                  />
                  <input 
                    type="text" 
                    placeholder="First name" 
                    className="w-full h-[58px] bg-white border border-slate-200 rounded-xl px-5 text-[15px] font-medium text-navy placeholder:text-slate-400 outline-none focus:border-navy transition-colors" 
                  />
                  <input 
                    type="text" 
                    placeholder="Surname" 
                    className="w-full h-[58px] bg-white border border-slate-200 rounded-xl px-5 text-[15px] font-medium text-navy placeholder:text-slate-400 outline-none focus:border-navy transition-colors" 
                  />
               </div>

               <button className="w-full h-[58px] bg-[#D4D4D4] text-white rounded-full flex items-center justify-center font-bold text-[16px] tracking-tight mb-8"> 
                  Continue with email 
               </button>

               <div className="relative flex items-center justify-center mb-8">
                  <div className="w-full border-t border-slate-100" />
                  <span className="bg-white px-4 text-[13px] font-bold text-navy absolute">or</span>
               </div>

               <div className="space-y-3">
                  {/* Microsoft Button */}
                  <button onClick={startMSSimulation} className="w-full h-[58px] bg-white border border-slate-200 text-navy rounded-full flex items-center justify-center gap-3 font-bold text-[15px] tracking-tight transition-transform active:scale-[0.98]">
                     <MicrosoftIcon />
                     Continue with Microsoft
                  </button>

                  {/* Google Button */}
                  <button className="w-full h-[58px] bg-white border border-slate-200 text-navy rounded-full flex items-center justify-center gap-3 font-bold text-[15px] tracking-tight transition-transform active:scale-[0.98]">
                     <GoogleIcon />
                     Continue with Google
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
