"use client";

import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export default function GenesisSetup() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const createAdmin = async () => {
    setStatus('loading');
    try {
      // 1. Create the Auth Account
      const userCredential = await createUserWithEmailAndPassword(auth, 'admin@pulse.com', 'pulse123');
      const user = userCredential.user;

      // 2. Create the Admin Profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: 'admin@pulse.com',
        role: 'ADMIN',
        fullName: 'Genesis Admin',
        createdAt: new Date().toISOString(),
        isVerified: true
      });

      setStatus('success');
      setMessage('Admin Account Created Successfully.');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Check if this email already exists.');
    }
  };

  return (
    <div className="h-screen w-full bg-[#111111] flex flex-col items-center justify-center font-sans p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-8 border border-blue-500/20">
        <Shield className="text-[#007AFF]" size={32} />
      </div>
      
      <h1 className="text-white text-2xl font-bold mb-2">Genesis Admin Setup</h1>
      <p className="text-slate-400 text-sm mb-12 max-w-[320px]">
        This utility will create the primary administrative account for the Pulse ecosystem.
      </p>

      {status === 'idle' && (
        <button 
          onClick={createAdmin}
          className="bg-[#007AFF] text-white font-bold px-10 py-4 rounded-2xl hover:bg-blue-600 transition-all active:scale-95 shadow-md shadow-blue-500/20"
        >
          Create admin@pulse.com
        </button>
      )}

      {status === 'loading' && (
        <div className="w-8 h-8 border-4 border-white/10 border-t-[#007AFF] rounded-full animate-spin" />
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center animate-in zoom-in duration-500">
          <CheckCircle2 className="text-emerald-500 mb-4" size={48} />
          <p className="text-emerald-500 font-bold mb-8">{message}</p>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-left w-full max-w-sm">
            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-4">Account Created</p>
            <p className="text-white text-sm mb-2 font-mono">Email: admin@pulse.com</p>
            <p className="text-slate-500 text-xs mt-3 leading-relaxed">
              Password is set as configured. Do not share credentials via this screen. Refer to internal admin documentation.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="mt-10 text-[#007AFF] text-sm font-bold underline"
          >
            Go to Login
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center">
          <AlertCircle className="text-red-500 mb-4" size={48} />
          <p className="text-red-500 font-bold mb-4">{message}</p>
          <button 
            onClick={() => setStatus('idle')}
            className="text-slate-400 text-sm font-bold underline"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
