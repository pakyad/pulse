"use client";

import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, writeBatch, increment } from 'firebase/firestore';
import { ShieldCheck, ArrowRight, Zap, Camera, X, Award, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ScannerPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const scannerRef = useRef<any>(null);

  // 🔊 Sythenic Pulse Sound Logic
  const triggerSuccessPulse = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High-end Ping
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);

        // 📳 Haptic Handshake
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(200);
        }
    } catch (e) {
        console.error("Sensory Feedback Error:", e);
    }
  };

  useEffect(() => {
    if (!scannerRef.current) {
        const scanner = new Html5QrcodeScanner(
            "pulse-reader", 
            { 
                fps: 15, 
                qrbox: { width: 280, height: 280 },
                aspectRatio: 1.0 
            }, 
            false
        );
        
        scanner.render(async (decodedText) => {
          if (isSyncing) return;
          setIsSyncing(true);

          try {
            const txRef = doc(db, "transactions", decodedText);
            const txSnap = await getDoc(txRef);
            
            if (txSnap.exists() && txSnap.data().status === 'PENDING') {
              const data = txSnap.data();
              const sellerId = data.seller_id;
              const sellerRef = doc(db, "users", sellerId);

              // ⚡ ATOMIC HANDSHAKE
              const batch = writeBatch(db);
              
              batch.update(txRef, { 
                status: 'COLLECTED', 
                completed_at: new Date().toISOString() 
              });

              batch.update(sellerRef, { 
                hustle_score: increment(50), 
                total_sales: increment(1) 
              });

              if (auth.currentUser && auth.currentUser.uid !== sellerId) {
                const runnerRef = doc(db, "users", auth.currentUser.uid);
                batch.update(runnerRef, {
                    hustle_score: increment(10)
                });
              }

              await batch.commit();

              // 🎯 TRIGGER SENSORY FEEDBACK
              triggerSuccessPulse();

              setScanResult(decodedText);
              
              if (scannerRef.current) {
                  await scannerRef.current.clear();
              }
            }
          } catch (err) {
            console.error("Pulse Score Sync Error:", err);
            setIsSyncing(false);
          }
        }, () => {});

        scannerRef.current = scanner;
    }

    return () => { 
        if (scannerRef.current) {
            scannerRef.current.clear().catch(() => {});
            scannerRef.current = null;
        }
    };
  }, [isSyncing]);

  return (
    <div className="min-h-screen bg-navy transition-colors duration-500 overflow-hidden relative">
      <AnimatePresence mode="wait">
        {scanResult ? (
          <motion.div 
            key="success-nexus"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative z-50 bg-navy overflow-hidden"
          >
            {/* High-Energy Success Aura */}
            <motion.div 
                animate={{ scale: [1, 1.5, 1], rotate: [0, 90, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange/20 rounded-full blur-[100px]" 
            />
            
            <div className="relative z-10 flex flex-col items-center">
                <motion.div 
                    initial={{ y: 20, rotate: -12 }}
                    animate={{ y: 0, rotate: 12 }}
                    transition={{ type: "spring", repeat: Infinity, repeatType: "mirror" }}
                    className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center mb-10 shadow-[0_40px_100px_rgba(255,133,27,0.4)]"
                >
                  <Award size={64} className="text-orange" />
                </motion.div>

                <h1 className="text-6xl font-black text-white    mb-4 leading-none strike-through decoration-orange decoration-8">Level Up</h1>
                <p className="text-orange text-sm font-black  tracking-[0.5em] mb-12 animate-pulse">Handshake Verified +50 HP</p>
                
                <div className="flex flex-col gap-4 w-full max-w-xs">
                    <Link href="/me" className="flex items-center justify-center gap-4 bg-white text-navy px-12 py-6 rounded-[28px] font-black  tracking-[0.2em] text-[11px] shadow-2xl hover:bg-orange hover:text-white transition-all active:scale-95 group">
                      Return to Hub 
                      <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                </div>
            </div>
          </motion.div>
        ) : (
          <motion.main 
            key="optical-gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen p-6 flex flex-col items-center relative"
          >
            <header className="absolute top-12 inset-x-0 px-8 flex justify-between items-center z-30">
                <button onClick={() => router.back()} className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                    <X className="text-white w-6 h-6" />
                </button>
                <div className="text-center">
                    <h1 className="text-white text-2xl font-black tracking-widest   leading-none mb-1">Optical Hub</h1>
                    <p className="text-[10px] text-white/40 font-bold  tracking-[0.4em]">Multi-Doc Sync Active</p>
                </div>
                <div className="w-14" />
            </header>

            <div className="mt-28 relative group w-full max-w-sm aspect-square rounded-[40px] overflow-hidden border-4 border-white/5 shadow-2xl bg-black">
                <div id="pulse-reader" className="w-full h-full relative z-10" />
                <div className="absolute inset-0 border-60 border-black/40 backdrop-blur-[2px] z-20 pointer-events-none" />
            </div>
            
            <p className="mt-12 text-white/30 text-[10px] font-black  tracking-[0.3em] text-center max-w-[280px] leading-relaxed">
              Establishing high-speed handshake... Reward protocol initialized.
            </p>
          </motion.main>
        )}
      </AnimatePresence>
      
      <style jsx global>{`
        #pulse-reader { border: none !important; background: transparent !important; }
        #pulse-reader__status_span { display: none !important; }
        #pulse-reader__dashboard_section_csr button {
          background: #FF851B !important; color: white !important; border: none !important;
          border-radius: 16px !important; padding: 10px 24px !important; text-transform:  !important;
          font-weight: 900 !important; font-size: 11px !important; letter-spacing: 0.2em !important;
        }
        #pulse-reader video { border-radius: 40px !important; object-fit: cover !important; width: 100% !important; height: 100% !important; }
      `}</style>
    </div>
  );
}
