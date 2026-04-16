'use client'
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { registerStudent, loginStudent } from '@/lib/auth-utils';
import { ChevronLeft, HelpCircle, Camera, Bell, Check, Zap, Shield, User, Hash, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 5;

  // Identity State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [matric, setMatric] = useState('');
  const [isNewUser, setIsNewUser] = useState(true);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => (s > 1 ? s - 1 : 1));

  const handleFinalize = async () => {
    setLoading(true);
    try {
        if (isNewUser) {
            const { error } = await registerStudent(email, password, fullName, matric);
            if (!error) window.location.href = '/me';
            else alert(error);
        } else {
            const { error } = await loginStudent(email, password);
            if (!error) window.location.href = '/me';
            else alert(error);
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col px-8 pt-16 pb-12 font-sans selection:bg-cyan-100">
      
      {/* HEADER: Progress & Navigation */}
      <header className="flex items-center justify-between mb-20">
        <button onClick={prevStep} className="p-3 -ml-3 hover:bg-gray-50 rounded-full transition-all">
          <ChevronLeft size={24} className="text-gray-900" />
        </button>
        
        {/* Dashed Progress Bar */}
        <div className="flex gap-2">
          {[...Array(totalSteps)].map((_, i) => (
            <div 
              key={i} 
              className={`h-1 w-10 rounded-full transition-all duration-700 ${
                i + 1 <= step ? 'bg-orange-500' : 'bg-gray-100'
              }`} 
            />
          ))}
        </div>

        <button className="p-3 -mr-3 hover:bg-gray-50 rounded-full transition-all">
          <HelpCircle size={24} className="text-gray-900" />
        </button>
      </header>

      <AnimatePresence mode="wait">
        {/* STEP 1: IDENTITY ACCESS */}
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
          >
            <h1 className="text-[34px] font-bold text-gray-900 leading-none tracking-tight mb-4">Pulse Email</h1>
            <p className="text-gray-400 text-lg mb-12 leading-relaxed">Enter your institutional email to begin handshaking.</p>
            
            <div className="relative group">
               <input 
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Institutional Email"
                className="w-full text-2xl py-6 border-none focus:ring-0 placeholder:text-gray-200 font-bold bg-transparent"
               />
               <div className="h-[2px] w-full bg-gray-50 absolute bottom-0">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: email ? '100%' : '0%' }}
                    className="h-full bg-cyan-400"
                  />
               </div>
            </div>
            
            <p className="text-[12px] text-gray-300 mt-6 leading-relaxed flex items-center gap-2">
              <Shield size={12} /> Encrypted UTM Handshake Protocol
            </p>

            <div className="mt-auto space-y-4">
              <button 
                onClick={() => setIsNewUser(!isNewUser)}
                className="w-full text-gray-400 font-bold text-[10px] uppercase tracking-widest py-2"
              >
                {isNewUser ? 'Already have an account?' : 'Need a new Pulse ID?'}
              </button>
              <button 
                onClick={nextStep}
                disabled={!email || !email.includes('@')}
                className="w-full bg-[#AEE9FA] text-blue-900 font-bold py-6 rounded-full text-lg shadow-sm active:scale-95 transition-all disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: SECURITY LAYER */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
          >
            <h1 className="text-[34px] font-bold text-gray-900 leading-none tracking-tight mb-4">Security Key</h1>
            <p className="text-gray-400 text-lg mb-12 leading-relaxed">Protect your Pulse ID with a secure password.</p>
            
            <div className="relative">
              <input 
                autoFocus
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Secure Password"
                className="w-full text-2xl py-6 border-none focus:ring-0 placeholder:text-gray-200 font-bold bg-transparent"
              />
              <div className="h-[2px] w-full bg-gray-50 absolute bottom-0">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: password ? '100%' : '0%' }}
                    className="h-full bg-orange-400"
                  />
               </div>
            </div>
            
            <p className="text-sm font-bold text-cyan-500 mt-8 cursor-pointer hover:underline">Forgot your password?</p>

            <div className="mt-auto">
              <button 
                onClick={nextStep}
                disabled={password.length < 6}
                className="w-full bg-[#AEE9FA] text-blue-900 font-bold py-6 rounded-full text-lg shadow-sm active:scale-95 transition-all disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: IDENTITY MANIFEST */}
        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
          >
            <h1 className="text-[34px] font-bold text-gray-900 leading-none tracking-tight mb-4">Profile Details</h1>
            <p className="text-gray-400 text-lg mb-12 leading-relaxed">Tell the ecosystem who you are. This appears on your Pulse ID.</p>
            
            <div className="space-y-8">
                <div className="relative group">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 ml-1">Full Legal Name</p>
                    <input 
                        autoFocus
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="IYAD MOHMAD"
                        className="w-full text-xl py-4 border-none focus:ring-0 placeholder:text-gray-100 font-bold bg-gray-50 rounded-2xl px-6"
                    />
                </div>
                <div className="relative group">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 ml-1">Matric Number</p>
                    <input 
                        value={matric}
                        onChange={(e) => setMatric(e.target.value)}
                        placeholder="52213123246"
                        className="w-full text-xl py-4 border-none focus:ring-0 placeholder:text-gray-100 font-bold bg-gray-50 rounded-2xl px-6 uppercase"
                    />
                </div>
            </div>

            <div className="mt-auto">
              <button 
                onClick={nextStep}
                disabled={!fullName || !matric}
                className="w-full bg-[#AEE9FA] text-blue-900 font-bold py-6 rounded-full text-lg shadow-sm active:scale-95 transition-all disabled:opacity-30"
              >
                Assemble Profile
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: PERMISSIONS */}
        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
          >
            <h1 className="text-[34px] font-bold text-gray-900 leading-none tracking-tight mb-4">Pulse Sync</h1>
            <p className="text-gray-400 text-lg mb-12 leading-relaxed">Allow the following protocols for the optimal handshake experience.</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-8 bg-gray-50 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"><Camera className="text-orange-500" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Optical Sensor</p>
                    <p className="text-sm text-gray-400">Used for QR handshakes</p>
                  </div>
                </div>
                <div className="bg-green-500 p-1.5 rounded-full"><Check size={18} className="text-white" /></div>
              </div>

              <div className="flex items-center justify-between p-8 bg-gray-50 rounded-[40px] border border-gray-100 opacity-60">
                <div className="flex items-center gap-6">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"><Bell className="text-gray-300" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Pulse Alerts</p>
                    <p className="text-sm text-gray-400">Tap to enable push notifications</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-300 mt-12 px-10">You can calibrate these sensors later in your settings dashboard.</p>

            <div className="mt-auto">
              <button 
                onClick={nextStep}
                className="w-full bg-orange-500 text-white font-bold py-6 rounded-full text-lg shadow-2xl active:scale-95 transition-all"
              >
                Confirm Sensors
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: FINAL TERMS */}
        {step === 5 && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col"
          >
            <h1 className="text-[34px] font-bold text-gray-900 leading-none tracking-tight mb-4">Accept Terms</h1>
            <p className="text-gray-400 text-lg mb-10 leading-relaxed">Pulse is a decentralized handshake community. Please agree to our terms.</p>
            
            <div className="space-y-6 mb-12">
              {[
                "I am solely responsible for the security of my handshakes.",
                "Pulse is a field-based commerce tool for UTM stakeholders.",
                "I agree to maintain institutional integrity during swaps."
              ].map((text, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className="w-6 h-6 rounded-lg border-2 border-gray-200 flex-shrink-0 mt-1 bg-white shadow-inner focus-within:bg-orange-500 focus-within:border-orange-500 transition-colors" />
                  <p className="text-[15px] text-gray-500 leading-relaxed font-semibold">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-4">
              <p className="text-center text-[12px] text-gray-300 font-bold uppercase tracking-widest">Initialization Protocol 4.1</p>
              <button 
                disabled={loading}
                onClick={handleFinalize}
                className="w-full bg-orange-500 text-white font-bold py-6 rounded-full text-lg shadow-2xl active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Initializing Pulse...' : 'Generate Pulse ID'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
