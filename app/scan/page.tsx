"use client";

import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import { Camera, Zap, ShieldCheck, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function HandshakeScanner() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    // Initialize Tactical Scanner
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    const startScanner = async () => {
        try {
            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                onScanSuccess,
                onScanFailure
            );
        } catch (err) {
            setError("Optical Sensor Access Denied. Check permissions.");
        }
    };

    startScanner();

    return () => {
        if (scannerRef.current?.isScanning) {
            scannerRef.current.stop().catch(console.error);
        }
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    // decodedText is the Transaction ID
    if (!isScanning) return;
    setIsScanning(false);
    
    const txId = decodedText;
    
    try {
        await runTransaction(db, async (transaction) => {
            const txRef = doc(db, "orders", txId);
            const txDoc = await transaction.get(txRef);

            if (!txDoc.exists()) throw "Invalid Pulse Handshake ID.";
            const data = txDoc.data();
            if (data.status === 'COLLECTED') throw "Handshake already finalized.";

            // 1. Finalize Transaction
            transaction.update(txRef, { 
                status: 'COLLECTED',
                finalized_at: new Date().toISOString()
            });

            // 2. Reward the Runner/Collector
            if (auth.currentUser) {
                const sellerId = data.seller_id;
                const sellerRef = doc(db, "users", sellerId);
                transaction.update(sellerRef, {
                    hustle_score: increment(10)
                });
            }
        });

        setSuccess(true);
        if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
        }
    } catch (err: any) {
        setError(err.message || err);
        setIsScanning(true); // Allow retry
    }
  };

  const onScanFailure = (err: string) => {
    // Normal noise during scanning, no action needed for UX
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Tactical Viewfinder */}
      <div id="reader" className="w-full h-full absolute inset-0 opacity-80" />
      
      {/* Soft Lens Overlays */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-40 border-black/60 backdrop-blur-[2px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-orange/40 rounded-3xl shadow-[0_0_50px_rgba(255,133,27,0.2)]">
               <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange rounded-tl-xl" />
               <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange rounded-tr-xl" />
               <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange rounded-bl-xl" />
               <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange rounded-br-xl" />
          </div>
      </div>

      {/* Control Header */}
      <header className="absolute top-12 left-0 w-full px-6 flex justify-between items-center z-20">
          <button onClick={() => router.back()} className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <X className="text-white w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
              <p className="text-[10px] text-white/40 font-black  tracking-[0.4em] mb-1">Handshake Active</p>
              <h1 className="text-xl font-black text-white  ">Optical Scanner</h1>
          </div>
          <div className="w-11" />
      </header>

      {/* Success Modal */}
      <AnimatePresence>
        {success && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-50 bg-navy flex flex-col items-center justify-center p-10 text-center"
            >
                <div className="w-24 h-24 bg-orange rounded-full flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(255,133,27,0.4)]">
                    <CheckCircle2 size={48} className="text-white" />
                </div>
                <h2 className="text-4xl font-black text-white    mb-4">Handshake Verified</h2>
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-white/10 px-6 py-2 rounded-full border border-white/10 flex items-center gap-2">
                        <Zap size={14} className="text-orange" />
                        <span className="text-sm font-black text-white tracking-widest">+10 HUSTLE HP REWARDED</span>
                    </div>
                </div>
                <button 
                    onClick={() => router.push('/me')}
                    className="mt-12 bg-white text-navy px-10 py-4 rounded-2xl font-black  tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all"
                >
                    Return to Hub
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions Footer */}
      <footer className="absolute bottom-12 left-0 w-full px-12 text-center pointer-events-none">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-3xl">
              <p className="text-xs font-bold text-white mb-1">Align QR Code within the brackets</p>
              <p className="text-[10px] text-white/40  tracking-widest">Scanning for Live Transaction Pulse...</p>
          </div>
      </footer>

      {/* Error Toast */}
      {error && (
          <div className="absolute top-28 bg-red-500 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-xl animate-bounce">
              {error}
          </div>
      )}
    </div>
  );
}
