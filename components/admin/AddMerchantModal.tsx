"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function AddMerchantModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleCreate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all fields.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Create Auth Account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Commit to Registry as Verified Merchant
      await setDoc(doc(db, "users", user.uid), {
        full_name: formData.name,
        email: formData.email,
        role: 'CLUB',
        is_verified_merchant: true,
        is_verified: true,
        created_at: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setFormData({ name: '', email: '', password: '' });
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create merchant account.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-5000 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-md overflow-hidden"
        >
          {success ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-[20px] font-black">Merchant Added</h3>
              <p className="text-[14px] text-slate-400">The account is now live in the registry.</p>
            </div>
          ) : (
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provisioning</p>
                    <h2 className="text-[18px] font-black">Add Merchant</h2>
                  </div>
                </div>
                <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Step 1: Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Merchant Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. SE Club"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-[14px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Step 2: Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">External Email</label>
                  <input 
                    type="email"
                    placeholder="seclub@merchant.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-[14px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Step 3: Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Initial Password</label>
                  <input 
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-[14px] font-bold outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              {error && <p className="text-[12px] text-red-500 font-bold px-4">{error}</p>}

              <button 
                onClick={handleCreate}
                disabled={loading}
                className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-md shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-20"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Account'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
