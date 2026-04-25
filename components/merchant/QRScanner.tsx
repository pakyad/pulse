'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, ShieldCheck, Loader2, Scan } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScanSuccess, onClose }: QRScannerProps) {
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const config = {
      fps: 20,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true
    };

    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      config,
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        if (scannerRef.current) {
          scannerRef.current.clear();
        }
      },
      () => {}
    );

    setIsInitializing(false);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Scanner Error:", err));
      }
    };
  }, [onScanSuccess]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-300 bg-black flex flex-col items-center justify-center"
    >
      {/* 1. TOP BAR */}
      <div className="absolute top-0 left-0 right-0 h-32 px-8 flex justify-between items-center z-20 bg-gradient-to-b from-black to-transparent">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Scan className="text-white" size={20} />
           </div>
           <div>
              <h3 className="text-white font-black text-[18px]">Scanner</h3>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Verify QR</p>
           </div>
        </div>
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white active:scale-90 transition-all border border-white/5"
        >
          <X size={24} />
        </button>
      </div>

      {/* 2. SCANNING ZONE */}
      <div className="relative w-full max-w-sm aspect-square px-10">
         
         {/* TACTICAL CORNERS */}
         <div className="absolute top-0 left-10 w-8 h-8 border-t-4 border-l-4 border-white z-20 rounded-tl-xl" />
         <div className="absolute top-0 right-10 w-8 h-8 border-t-4 border-r-4 border-white z-20 rounded-tr-xl" />
         <div className="absolute bottom-0 left-10 w-8 h-8 border-b-4 border-l-4 border-white z-20 rounded-bl-xl" />
         <div className="absolute bottom-0 right-10 w-8 h-8 border-b-4 border-r-4 border-white z-20 rounded-br-xl" />

         {/* SCANNING LASER */}
         <motion.div 
           animate={{ top: ['10%', '90%', '10%'] }}
           transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
           className="absolute left-10 right-10 h-0.5 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-20"
         />

         <div className="w-full h-full bg-white/5 rounded-3xl overflow-hidden relative border border-white/10">
            {isInitializing && (
               <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black">
                  <Loader2 className="animate-spin text-white/40" size={32} />
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Starting Camera...</p>
               </div>
            )}
            <div id="qr-reader" className="w-full h-full" />
         </div>
      </div>

      {/* 3. INSTRUCTIONS */}
      <div className="mt-16 text-center space-y-6 px-12">
         <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Ready</span>
         </div>
         <p className="text-white/60 text-[15px] font-medium leading-relaxed">
            Point your camera at the <span className="text-white font-bold">student&apos;s QR code</span> to verify.
         </p>
      </div>

      <style jsx global>{`
        #qr-reader {
          border: none !important;
        }
        #qr-reader__scan_region {
          background: transparent !important;
        }
        #qr-reader__dashboard {
          display: none !important;
        }
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 1.5rem !important;
        }
        /* Hide UI elements from html5-qrcode */
        button#html5-qrcode-button-camera-start,
        button#html5-qrcode-button-camera-stop {
          display: none !important;
        }
      `}</style>
    </motion.div>
  );
}
