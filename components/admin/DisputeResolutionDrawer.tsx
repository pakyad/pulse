"use client";

import { useState } from 'react';
import { X, ShieldAlert, Image, User, CheckCircle, XCircle, ChevronRight, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DisputeResolutionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: any;
  onResolve: (id: string, action: 'RELEASE' | 'REFUND') => void;
}

export default function DisputeResolutionDrawer({ isOpen, onClose, dispute, onResolve }: DisputeResolutionDrawerProps) {
  const [processing, setProcessing] = useState(false);

  if (!isOpen || !dispute) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-100 flex justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-md"
        />

        {/* Drawer */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-[500px] h-full bg-white shadow-[-32px_0_64px_rgba(0,0,0,0.1)] border-l border-slate-100 flex flex-col"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 border border-red-100">
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ticket Resolve</p>
                <h3 className="text-[15px] font-black text-slate-900 tracking-tight uppercase">#{dispute.id.substring(0,8)}</h3>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-10">
            {/* Status & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Severity</p>
                <p className="text-[13px] font-bold text-red-500 uppercase tracking-widest">High Impact</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</p>
                <p className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">Logistic Failure</p>
              </div>
            </div>

            {/* Proximity Trust Protocol */}
            {dispute.handshake?.verification_type && (
              <section>
                 <div className={`p-6 rounded-2xl border-[0.5px] flex items-center gap-6 ${
                   dispute.handshake.verification_type === 'IN_PERSON_SAFE' 
                   ? 'bg-emerald-50 border-emerald-100' 
                   : 'bg-amber-50 border-amber-100'
                 }`}>
                    <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center ${
                      dispute.handshake.verification_type === 'IN_PERSON_SAFE' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                       <MapPin size={24} />
                    </div>
                    <div className="flex-1">
                       <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                         dispute.handshake.verification_type === 'IN_PERSON_SAFE' ? 'text-emerald-600' : 'text-amber-600'
                       }`}>
                          {dispute.handshake.verification_type === 'IN_PERSON_SAFE' ? 'Trust Level: Absolute' : 'Trust Level: Suspicious'}
                       </p>
                       <h4 className="text-[15px] font-black text-slate-900 tracking-tight">
                          {dispute.handshake.verification_type === 'IN_PERSON_SAFE' ? 'Safe/In-Person Handshake' : 'Remote Handshake Detected'}
                       </h4>
                       <p className="text-[12px] font-medium text-slate-400 mt-1">
                          {dispute.handshake.verification_type === 'IN_PERSON_SAFE' 
                            ? 'GPS coordinates match within 50m. Claim of non-receipt is likely fraudulent.' 
                            : 'Parties were far apart during confirmation. Investigation required.'}
                       </p>
                    </div>
                 </div>
              </section>
            )}

            {/* Evidence Section */}
            <section>
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Image size={14} className="text-slate-400" /> Audit Evidence
              </h4>
              <div className="aspect-video bg-slate-100 rounded-2xl border-[0.5px] border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-3 group relative overflow-hidden">
                {dispute.evidence_url ? (
                   <img src={dispute.evidence_url} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <XCircle size={32} strokeWidth={1.5} />
                    <p className="text-[12px] font-medium">No Photographic Evidence Provided</p>
                  </>
                )}
              </div>
            </section>

            {/* Identities */}
            <section className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={14} className="text-slate-400" /> Identities Involved
              </h4>
              <div className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-[14px]">
                    {dispute.reporter_name?.[0]}
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-900 tracking-tight">{dispute.reporter_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reporter (Buyer)</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-200" />
              </div>
              <div className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm opacity-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-[14px]">
                    V
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-slate-900 tracking-tight">Verified Merchant</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendor Node</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-200" />
              </div>
            </section>

            {/* Description */}
            <section>
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4">Conflict Narrative</h4>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[14px] text-slate-600 font-medium leading-relaxed italic">
                  "{dispute.reason || 'The buyer reports a handoff failure. No specific narrative captured.'}"
                </p>
              </div>
            </section>
          </div>

          {/* Action Terminal */}
          <div className="p-8 border-t border-slate-100 bg-white sticky bottom-0 grid grid-cols-2 gap-4">
            <button 
              onClick={() => onResolve(dispute.id, 'REFUND')}
              className="h-[64px] bg-slate-100 text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <XCircle size={18} /> Refund Buyer
            </button>
            <button 
              onClick={() => onResolve(dispute.id, 'RELEASE')}
              className="h-[64px] bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 shadow-md shadow-slate-900/20"
            >
              <CheckCircle size={18} /> Release Funds
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
