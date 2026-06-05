"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, Download, ShieldCheck, Clock, ExternalLink, Package } from "lucide-react";
import { useEffect, useState } from "react";

interface ReceiptViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  orderId: string;
  amount: number;
  timestamp: any;
}

export default function ReceiptViewer({ isOpen, onClose, imageUrl, orderId, amount, timestamp }: ReceiptViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-1000 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 md:p-12"
          onClick={onClose}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="fixed top-8 right-8 z-1010 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-xl border border-white/10"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl h-full max-h-[85vh]">
            
            {/* ── Receipt Image Canvas ── */}
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative flex-1 bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/10 group cursor-zoom-in"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(!isZoomed);
              }}
            >
              <img 
                src={imageUrl} 
                alt="Payment Receipt"
                className={`w-full h-full object-contain transition-transform duration-500 ${isZoomed ? 'scale-150' : 'scale-100'}`}
              />
              
              {!isZoomed && (
                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 flex items-center gap-2 text-white font-bold">
                    <ZoomIn size={18} /> Click to Inspect
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── Verification Sidebar ── */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="w-full md:w-96 bg-white rounded-[2.5rem] p-8 flex flex-col justify-between shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">Audit Protocol</p>
                  <h3 className="text-[24px] font-semibold text-navy tracking-tight">Payment Verification</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-navy shadow-sm">
                        <ShieldCheck size={20} />
                      </div>
                      <span className="text-[13px] font-bold text-navy/60">Amount Found</span>
                    </div>
                    <span className="text-[18px] font-semibold text-navy">RM {amount.toFixed(2)}</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-navy/40">
                        <Clock size={16} />
                        <span className="text-[12px] font-bold">Registry Time</span>
                      </div>
                      <span className="text-[12px] font-semibold text-navy">
                        {timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-navy/40">
                        <Package size={16} />
                        <span className="text-[12px] font-bold">Transaction ID</span>
                      </div>
                      <span className="text-[12px] font-semibold text-navy">#{orderId.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl">
                  <p className="text-[12px] font-bold text-amber-700 leading-relaxed">
                    Check if the amount, transaction date, and recipient name (Kelab Bola UniKL) match your DuitNow record before accepting.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-8">
                <a 
                  href={imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full h-14 rounded-2xl border border-slate-100 flex items-center justify-center gap-3 text-[14px] font-bold text-navy hover:bg-slate-50 transition-all"
                >
                  <Download size={18} /> Download Asset
                </a>
                <button 
                  onClick={onClose}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-semibold text-[15px] "
                >
                  Confirm Audit
                </button>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
