"use client";

import { useState } from 'react';
import { Camera, Zap, Package, X, Focus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RunnerScanner() {
  const [mode, setMode] = useState<'QR' | 'PHOTO'>('QR');
  const [isScanning, setIsScanning] = useState(true);

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* 1. Tactical Viewfinder */}
      <div className="absolute inset-0 bg-navy/20 flex flex-col items-center justify-center">
        <div className="relative w-72 h-72">
          {/* Pulsing Core */}
          <motion.div 
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-4 bg-orange/5 rounded-[40px]"
          />
          
          {/* Viewfinder Corners */}
          <div className="absolute -top-1 -left-1 w-12 h-12 border-t-[3px] border-l-[3px] border-orange rounded-tl-2xl" />
          <div className="absolute -top-1 -right-1 w-12 h-12 border-t-[3px] border-r-[3px] border-orange rounded-tr-2xl" />
          <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-[3px] border-l-[3px] border-orange rounded-bl-2xl" />
          <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-[3px] border-r-[3px] border-orange rounded-br-2xl" />

          {/* Scanning Line */}
          <motion.div 
            animate={{ top: ['10%', '90%', '10%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-orange to-transparent shadow-[0_0_10px_#FF851B] z-10"
          />

          <div className="absolute inset-0 flex items-center justify-center opacity-20">
             <Focus className="text-white w-12 h-12" />
          </div>
        </div>

        <p className="mt-12 text-white/40 text-[10px]  font-black tracking-[0.4em]">
          Align {mode === 'QR' ? 'Handshake QR' : 'Drop-zone'} within frame
        </p>
      </div>

      {/* 2. Tactical Header */}
      <div className="absolute top-12 w-full px-6 flex justify-between items-center z-50">
        <button 
          onClick={() => window.history.back()} 
          className="p-3 rounded-full soft-lens text-white hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="soft-lens px-6 py-2 rounded-full border border-white/10">
          <div className="flex flex-col items-center">
            <span className="text-[8px] text-white/40  font-black tracking-[0.2em]">Deployment Active</span>
            <span className="text-xs font-black text-white tracking-widest ">TX-88219 HOODIE</span>
          </div>
        </div>

        <div className="w-12 h-12 flex items-center justify-center">
           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </div>
      </div>

      {/* 3. Bottom Controls - Mode Toggle */}
      <div className="absolute bottom-12 w-full px-8 z-20">
        <div className="soft-lens p-5 rounded-[32px] flex flex-col gap-5 border border-white/10">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setMode('QR')}
              className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${mode === 'QR' ? 'bg-orange text-white shadow-[0_0_20px_rgba(255,133,27,0.3)]' : 'text-white/30 hover:text-white/60'}`}
            >
              <Zap size={18} /> 
              <span className="text-[10px] font-black  tracking-widest">Handshake</span>
            </button>
            <button 
              onClick={() => setMode('PHOTO')}
              className={`flex-1 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${mode === 'PHOTO' ? 'bg-orange text-white shadow-[0_0_20px_rgba(255,133,27,0.3)]' : 'text-white/30 hover:text-white/60'}`}
            >
              <Package size={18} /> 
              <span className="text-[10px] font-black  tracking-widest">Photo Drop</span>
            </button>
          </div>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="w-full bg-white text-navy font-black py-5 rounded-2xl  tracking-[0.2em] text-[11px] shadow-2xl"
          >
            {mode === 'QR' ? 'Initiate Optical Scan' : 'Capture Proof of Drop'}
          </motion.button>
        </div>
      </div>

      {/* Background Ambience */}
      <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-orange/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
