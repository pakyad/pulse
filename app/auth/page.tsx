'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X, Loader2, Eye, EyeOff
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [microsoftClicked, setMicrosoftClicked] = useState(false);

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
        if (userData.role === 'ADMIN') router.push('/admin/overview');
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

  const domainError = email && !email.endsWith('@s.unikl.edu.my') && email !== 'admin@pulse.com'
    ? 'Only UniKL student emails (@s.unikl.edu.my) are allowed.'
    : null;

  return (
    <main className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden antialiased relative">
      <div className="flex flex-col min-h-screen px-5 py-5 max-w-md mx-auto w-full">
        <div className="flex items-center justify-center mb-6">
           <h1 className="text-[17px] font-bold">Sign in</h1>
        </div>

        {/* Headers */}
        <div className="mb-8">
           <h2 className="text-[26px] font-bold tracking-tight mb-2">Hi</h2>
           <p className="text-[15px] text-gray-500 leading-snug pr-4">
             Sign in with your UniKL student email and password.
           </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[14px] font-medium border border-red-100">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-2 mb-4">
          <label className="text-[14px] font-semibold text-slate-900 ml-2">UniKL Email</label>
          <input 
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="your@s.unikl.edu.my"
            className="w-full h-[52px] px-6 bg-white border border-[#E5E7EB] rounded-full text-[14px] font-medium text-[#111827] outline-none focus:border-slate-900/20 transition-all"
          />
          {domainError && (
            <p className="text-[13px] text-red-500 font-medium ml-4 mt-1">{domainError}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2 mb-6">
          <label className="text-[14px] font-semibold text-slate-900 ml-2">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-[52px] px-6 pr-14 bg-white border border-[#E5E7EB] rounded-full text-[14px] font-medium text-[#111827] outline-none focus:border-slate-900/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Sign in Button */}
        <button 
          onClick={handleLogin}
          disabled={loading || !!domainError || !email || !password}
          className="w-full h-[52px] bg-white border border-[#E5E7EB] text-[#111827] rounded-full font-medium text-[15px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="animate-spin" size={22} /> : 'Sign in'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 pt-4 pb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[13px] text-gray-400 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Microsoft */}
        <div className="space-y-2">
          <button
            onClick={() => setMicrosoftClicked(true)}
            className={`w-full h-[52px] bg-slate-900 text-white rounded-full font-semibold text-[15px] flex items-center justify-center gap-3 transition-all active:scale-95 ${
              microsoftClicked ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" width="22" height="22">
               <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
               <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
               <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
               <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Sign in with Microsoft
          </button>
          {microsoftClicked && (
            <p className="text-[11px] text-slate-400 font-medium text-center">Microsoft SSO — coming soon</p>
          )}
        </div>

        {/* Create Account */}
        <div className="pt-6 text-center">
          <p className="text-[14px] text-gray-500 mb-1">Haven't signed up yet?</p>
          <button onClick={() => router.push('/auth/signup')} className="text-[14px] text-[#0A66C2] font-medium hover:underline">
             Create an account
          </button>
        </div>
      </div>
    </main>
  );
}
