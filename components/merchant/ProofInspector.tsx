"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, Download, ShieldCheck, Clock, Package, MapPin, Camera } from "lucide-react";
import { useEffect, useState } from "react";

interface ProofInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function ProofInspector({ isOpen, onClose, order }: ProofInspectorProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 md:p-12"
          onClick={onClose}
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="fixed top-8 right-8 z-[1010] w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-xl border border-white/10"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl h-full max-h-[85vh]">
            
            {/* ── Evidence Canvas ── */}
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative flex-1 bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/10 group cursor-zoom-in flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(!isZoomed);
              }}
            >
              {order.proofOfDeliveryUrl ? (
                <img 
                  src={order.proofOfDeliveryUrl} 
                  alt="Proof of Delivery"
                  className={`w-full h-full object-contain transition-transform duration-500 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-white/40">
                    <Camera size={48} strokeWidth={1} />
                    <p className="text-[13px] font-bold ">No Visual Evidence Captured</p>
                </div>
              )}
              
              {order.proofOfDeliveryUrl && !isZoomed && (
                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 flex items-center gap-2 text-white font-bold">
                    <ZoomIn size={18} /> Inspect Asset
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── Audit Sidebar ── */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="w-full md:w-96 bg-white rounded-[2.5rem] p-8 flex flex-col justify-between shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 mb-2">Logistics Audit</p>
                  <h3 className="text-[24px] font-semibold text-slate-900 tracking-tight">Delivery Proof</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-900 shadow-sm">
                        <ShieldCheck size={20} />
                      </div>
                      <span className="text-[13px] font-bold text-slate-400">Status</span>
                    </div>
                    <span className="text-[14px] font-semibold text-emerald-500">{order.status}</span>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-slate-400">
                        <Clock size={16} />
                        <span className="text-[12px] font-bold">Fulfillment Time</span>
                      </div>
                      <span className="text-[12px] font-semibold text-slate-900">
                        {order.updated_at ? new Date(order.updated_at).toLocaleString() : 'Processing...'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-slate-400">
                        <Package size={16} />
                        <span className="text-[12px] font-bold">Order Registry</span>
                      </div>
                      <span className="text-[12px] font-semibold text-slate-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-slate-400">
                        <MapPin size={16} />
                        <span className="text-[12px] font-bold">Destination</span>
                      </div>
                      <span className="text-[12px] font-semibold text-slate-900 truncate max-w-[120px]">{order.delivery_address || 'Campus Drop-off'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl">
                  <p className="text-[12px] font-medium text-white/70 leading-relaxed">
                    This visual evidence confirms the physical hand-over of <span className="text-white font-bold">{order.title}</span>. 
                    If the asset is unclear, contact logistics support.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-8">
                {order.proofOfDeliveryUrl && (
                  <a 
                    href={order.proofOfDeliveryUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full h-14 rounded-2xl border border-slate-200 flex items-center justify-center gap-3 text-[14px] font-bold text-slate-900 hover:bg-slate-50 transition-all"
                  >
                    <Download size={18} /> Export Evidence
                  </a>
                )}
                <button 
                  onClick={onClose}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-semibold text-[15px] active:scale-95 transition-transform"
                >
                  Dismiss Audit
                </button>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
