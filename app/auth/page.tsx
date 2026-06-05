'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronLeft, Loader2
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<'landing' | 'login' | 'register'>('landing');
  const [regStep, setRegStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [regData, setRegData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    surname: '',
    matricNo: '',
    acceptedTerms: false
  });

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role === 'ADMIN') router.push('/admin/dashboard');
        else if (userData.role === 'CLUB') router.push('/merchant');
        else router.push('/home');
      } else {
        router.push('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Identity verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    
    // 🏛️ REQ_F101: Institutional UI Gating
    const { isValidUniKLEmail } = await import('@/lib/auth-utils');
    if (!isValidUniKLEmail(regData.email)) {
      setError('Unauthorized: You must use a valid UniKL email address to join CODEP.');
      setLoading(false);
      return;
    }

    try {
      const { registerStudent } = await import('@/lib/auth-utils');
      const fullName = `${regData.firstName} ${regData.surname}`.trim();
      const { user, error: regErr } = await registerStudent(
        regData.email, 
        regData.password, 
        fullName, 
        regData.matricNo
      );

      if (regErr) throw new Error(regErr);
      if (user) router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Registry creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden antialiased relative">
      
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div 
            key="landing" 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col min-h-screen px-6 py-6 max-w-md mx-auto w-full"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8">
               <button 
                 onClick={() => router.push('/')} 
                 className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center transition-all active:scale-95"
               >
                  <X size={20} className="text-slate-900" />
               </button>
               <h1 className="text-[17px] font-bold absolute left-1/2 -translate-x-1/2">Sign in</h1>
               <div className="w-10" />
            </div>

            {/* Headers */}
            <div className="mb-auto">
               <h2 className="text-[32px] font-bold tracking-tight mb-2">Hi</h2>
               <p className="text-[15px] text-gray-500 leading-snug pr-4">
                 You can use your email or username, or continue with your social account.
               </p>
            </div>

            {/* Bottom Actions */}
            <div className="w-full space-y-4 pb-8">
               <button 
                 onClick={() => setView('login')}
                 className="w-full py-4 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-900 rounded-[2rem] font-semibold text-[16px] active:scale-95 transition-all"
               >
                  Use email or username
               </button>

               <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[14px] text-gray-500 font-medium">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
               </div>

               <button 
                 className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-semibold text-[16px] flex items-center justify-center gap-3 transition-all"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" width="22" height="22">
                     <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                     <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                     <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                     <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                  Sign in with Microsoft
               </button>

               <button 
                 className="w-full py-4 bg-white border border-gray-300 text-slate-900 rounded-[2rem] font-semibold text-[16px] flex items-center justify-center gap-3 transition-all active:bg-gray-50"
               >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="22" height="22">
                     <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                     <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                     <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                     <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                  Sign in with Google
               </button>

               <div className="pt-6 text-center">
                  <p className="text-[14px] text-gray-500 mb-1">Haven't signed up yet?</p>
                  <button onClick={() => router.push('/auth/signup')} className="text-[14px] text-[#0A66C2] font-medium hover:underline">
                     Create an account
                  </button>
               </div>
            </div>
          </motion.div>
        )}

        {view === 'login' && (
          <motion.div 
            key="login" 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col min-h-screen px-6 py-12 max-w-md mx-auto w-full"
          >
            <div className="flex items-center justify-between mb-12 relative">
               <button onClick={() => setView('landing')} className="w-10 h-10 rounded-full bg-[#F2F8FF] flex items-center justify-center transition-all active:scale-95">
                  <ChevronLeft size={20} className="text-slate-900" strokeWidth={3} />
               </button>
               <h1 className="text-[17px] font-bold absolute left-1/2 -translate-x-1/2">Sign in</h1>
               <div className="w-10" />
            </div>

            <div className="space-y-6 flex-1 mt-4">
               {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[14px] font-medium border border-red-100">{error}</div>}
               
               <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-slate-900 ml-4">Email or username</label>
                  <input 
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="iyad.mohmad@s.unikl.edu.my"
                    className="w-full h-[60px] px-8 bg-[#F2F8FF] border-none rounded-full text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#0A66C2]/10 transition-all"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-slate-900 ml-4">Password</label>
                  <input 
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-[60px] px-8 bg-[#F2F8FF] border-none rounded-full text-[15px] font-medium outline-none focus:ring-2 focus:ring-[#0A66C2]/10 transition-all"
                  />
               </div>

               <button 
                 onClick={handleLogin} disabled={loading}
                 className="w-full h-[60px] bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-900 rounded-full font-bold text-[16px] active:scale-95 transition-all flex items-center justify-center mt-4"
               >
                 {loading ? <Loader2 className="animate-spin" size={24} /> : 'Sign in'}
               </button>
            </div>
          </motion.div>
        )}

        {view === 'register' && (
          <motion.div 
            key="register" 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col min-h-screen px-8 py-12 max-w-md mx-auto w-full"
          >
            <div className="flex items-center justify-between mb-16">
               <button onClick={() => regStep > 1 ? setRegStep(s => s - 1) : setView('landing')} className="p-2 -ml-2 text-slate-300 hover:text-slate-900 transition-colors">
                  <ChevronLeft size={28} />
               </button>
               <div className="flex gap-1">
                  {[1, 2].map(i => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-500 ${regStep === i ? 'w-8 bg-slate-900' : 'w-2 bg-slate-100'}`} />
                  ))}
               </div>
            </div>

            <div className="flex-1">
               <AnimatePresence mode="wait">
                  {regStep === 1 && (
                    <motion.div key="st1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                       <h2 className="text-[36px] font-semibold tracking-tightest leading-[1.1] text-navy">
                         Institutional <br/>Identity.
                       </h2>
                       
                       <button 
                         onClick={() => {
                            setLoading(true);
                            setTimeout(() => {
                               setLoading(false);
                               setRegStep(2);
                            }, 800);
                         }}
                         className="w-full h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center gap-4 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                       >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" width="20" height="20">
                             <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                             <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                             <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                             <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                          </svg>
                          <span className="text-[14px] font-bold tracking-tight text-navy">Continue with Microsoft</span>
                          {loading && <Loader2 className="animate-spin text-slate-300" size={16} />}
                       </button>

                       <p className="text-[12px] text-slate-400 font-medium leading-relaxed px-1">
                         Pulse authenticates via your university AD to ensure ecosystem security.
                       </p>
                    </motion.div>
                  )}

                  {regStep === 2 && (
                    <motion.div key="st2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                       <h2 className="text-[36px] font-semibold tracking-tightest leading-[1.1] text-navy">
                         Secure <br/>Access.
                       </h2>

                       <div className="space-y-8">
                          <div className="space-y-1 border-b border-slate-100 pb-2">
                             <label className="text-[10px] font-semibold text-slate-300 ">ID</label>
                             <input 
                               type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} 
                               placeholder="student@s.unikl.edu.my"
                               className="w-full bg-transparent text-[16px] font-bold text-navy outline-none placeholder:text-slate-200" 
                             />
                          </div>
                          <div className="space-y-1 border-b border-slate-100 pb-2">
                             <label className="text-[10px] font-semibold text-slate-300 ">Key</label>
                             <input 
                               type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} 
                               placeholder="Set your password"
                               className="w-full bg-transparent text-[16px] font-bold text-navy outline-none placeholder:text-slate-200" 
                             />
                          </div>
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {regStep === 2 && (
               <div className="pt-12">
                  <button 
                     onClick={handleRegister}
                     disabled={loading || !regData.email || !regData.password}
                     className="w-full h-16 bg-white border border-slate-200 shadow-sm text-slate-900 hover:bg-slate-50 rounded-2xl font-bold text-[15px] active:scale-95 transition-all flex items-center justify-center disabled:opacity-20"
                  >
                     {loading ? <Loader2 className="animate-spin" size={20} /> : 'Finalize Synchronize'}
                  </button>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
