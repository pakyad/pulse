'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ChevronLeft, Globe, Loader2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, "users", userCredential.user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const role = userSnap.data().role;
        router.push(role === 'ADMIN' ? '/admin/dashboard' : role === 'CLUB' ? '/merchant' : '/home');
      } else {
        router.push('/home');
      }
    } catch (err: any) {
      setError("Identity verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background DNA: The Pulse Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <span className="text-black text-3xl font-black italic">P</span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tighter uppercase">Pulse</h1>
          <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase mt-2">University OS</p>
        </div>

        <div className="space-y-4">
          {error && <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>}
          
          <div className="space-y-1">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={18} />
              <input 
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Student Email"
                className="w-full h-14 bg-white/[0.05] border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm outline-none focus:border-white/30 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={18} />
              <input 
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Security Key"
                className="w-full h-14 bg-white/[0.05] border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm outline-none focus:border-white/30 transition-all font-medium"
              />
            </div>
          </div>

          <button 
            onClick={handleLogin} disabled={loading}
            className="w-full h-14 bg-white text-black rounded-2xl font-black text-xs tracking-[0.2em] uppercase hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Establish Link"}
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="w-full h-px bg-white/10" />
          <button className="text-white/40 text-[11px] font-bold tracking-widest uppercase hover:text-white transition-colors">
            Request Access
          </button>
        </div>
      </motion.div>
    </main>
  );
}
