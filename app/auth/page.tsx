"use client";

import { useState } from 'react';
import { registerStudent, loginStudent } from '@/lib/auth-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, ArrowRight, User, Mail, Lock, Hash } from 'lucide-react';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: '', pass: '', name: '', matric: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
        if (isRegister) {
            const { error } = await registerStudent(formData.email, formData.pass, formData.name, formData.matric);
            if (!error) window.location.href = '/me';
            else alert(error);
          } else {
            const { error } = await loginStudent(formData.email, formData.pass);
            if (!error) window.location.href = '/me';
            else alert(error);
          }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden bg-pearl">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-navy/5 rounded-full blur-[150px]" />

      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="hologram-card p-10 w-full max-w-md relative z-10 border-navy/5 shadow-2xl"
      >
        <header className="mb-10">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="text-white w-5 h-5" />
                </div>
                <h1 className="text-3xl font-black text-navy tracking-tighter uppercase leading-none italic">Codep Pulse</h1>
            </div>
            <p className="text-[10px] text-navy/40 uppercase font-black tracking-[0.3em] leading-none mb-2">
                {isRegister ? 'New Identity Initialization' : 'Authentication Access Required'}
            </p>
            <div className="w-12 h-1 bg-orange rounded-full" />
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isRegister && (
                <motion.div 
                   key="register-fields"
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   className="space-y-4"
                >
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/20 group-focus-within:text-orange transition-colors" />
                        <input 
                            required
                            placeholder="Full Name" 
                            className="soft-lens w-full pl-12 pr-4 py-4 rounded-2xl text-sm border-none focus:ring-1 ring-orange/30 outline-none placeholder:text-navy/20 font-bold text-navy"
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div className="relative group">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/20 group-focus-within:text-orange transition-colors" />
                        <input 
                            required
                            placeholder="Matric Number" 
                            className="soft-lens w-full pl-12 pr-4 py-4 rounded-2xl text-sm border-none focus:ring-1 ring-orange/30 outline-none placeholder:text-navy/20 font-bold text-navy"
                            onChange={(e) => setFormData({...formData, matric: e.target.value})}
                        />
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/20 group-focus-within:text-orange transition-colors" />
            <input 
                required
                type="email"
                placeholder="University Email" 
                className="soft-lens w-full pl-12 pr-4 py-4 rounded-2xl text-sm border-none focus:ring-1 ring-orange/30 outline-none placeholder:text-navy/20 font-bold text-navy"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/20 group-focus-within:text-orange transition-colors" />
            <input 
                required
                type="password" 
                placeholder="Secure Password" 
                className="soft-lens w-full pl-12 pr-4 py-4 rounded-2xl text-sm border-none focus:ring-1 ring-orange/30 outline-none placeholder:text-navy/20 font-bold text-navy"
                onChange={(e) => setFormData({...formData, pass: e.target.value})}
            />
          </div>
          
          <button 
            disabled={isLoading}
            className="w-full bg-navy text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-orange hover:shadow-[0_0_20px_rgba(255,133,27,0.3)] transition-all mt-6 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Decrypting...' : isRegister ? 'Generate Pulse ID' : 'Synchronize Pulse'}
            {!isLoading && <ArrowRight size={14} />}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-navy/5 text-center">
            <p className="text-[10px] text-navy/30 font-black uppercase tracking-[0.2em] mb-4">Ecosystem Protocol</p>
            <p className="text-[11px] text-navy/60 font-black uppercase tracking-widest cursor-pointer hover:text-orange transition-colors" onClick={() => setIsRegister(!isRegister)}>
                {isRegister ? 'Already have an active Pulse ID? Login' : 'First deployment? Join the Hustle'}
            </p>
        </div>

        {/* Tactical Footer Badge */}
        <div className="absolute -bottom-1 left-10 right-10 flex justify-center">
            <div className="bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-t-xl border-x border-t border-navy/5 flex items-center gap-2">
                <ShieldCheck size={12} className="text-green-500" />
                <span className="text-[8px] font-black text-navy/40 uppercase tracking-widest italic">Encrypted UTM Gateway</span>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
