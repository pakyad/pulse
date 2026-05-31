"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, X, ChevronDown } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { submitPriceReport } from '@/lib/marketplace/price-governance';

interface ReportPriceButtonProps {
  itemId: string;
  sellerId: string;
  /** If true, shows an icon-only compact button (for listing cards) */
  compact?: boolean;
}

const REPORT_REASONS = [
  { value: 'OVERPRICED', label: 'Price seems too high' },
  { value: 'MISLEADING_DESCRIPTION', label: 'Description is misleading' },
  { value: 'WRONG_CATEGORY', label: 'Wrong category' },
] as const;

export default function ReportPriceButton({ itemId, sellerId, compact = false }: ReportPriceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<typeof REPORT_REASONS[number]['value']>('OVERPRICED');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // Don't let seller report their own listing
    if (user.uid === sellerId) {
      alert("You can't report your own listing.");
      return;
    }

    setLoading(true);
    const result = await submitPriceReport(itemId, user.uid, sellerId, reason, note);
    setLoading(false);

    if (result.success) {
      setSubmitted(true);
      setTimeout(() => { setIsOpen(false); setSubmitted(false); }, 2000);
    } else {
      alert(result.message);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }}
        className={`flex items-center gap-1.5 text-slate-300 hover:text-slate-400 transition-colors ${
          compact ? 'p-1' : 'text-[11px] font-bold'
        }`}
        title="Report this listing"
      >
        <Flag size={compact ? 12 : 11} />
        {!compact && <span>Report</span>}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end justify-center bg-black/20 backdrop-blur-md px-4 pb-6"
            onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 shadow-md shadow-slate-900/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {submitted ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Flag size={20} className="text-emerald-500" />
                  </div>
                  <p className="text-[14px] font-bold text-slate-900">Report submitted</p>
                  <p className="text-[12px] font-medium text-slate-400 mt-1">
                    Thank you for keeping Pulse fair.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
                    <div>
                      <p className="text-[13px] font-bold text-slate-900">Report Listing</p>
                      <p className="text-[11px] font-medium text-slate-400">Help keep prices fair on campus</p>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Reason select */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reason</p>
                      <div className="relative">
                        <select
                          value={reason}
                          onChange={(e) => setReason(e.target.value as any)}
                          className="w-full h-11 pl-4 pr-10 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-900 focus:outline-none focus:border-slate-300 appearance-none"
                        >
                          {REPORT_REASONS.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Optional note */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Note <span className="font-medium normal-case tracking-normal">(optional)</span>
                      </p>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Same item sells for RM 30 on Shopee..."
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-300 resize-none leading-relaxed"
                      />
                    </div>

                    <p className="text-[10px] font-medium text-slate-300 leading-relaxed">
                      Reports are reviewed by our team. Abuse of this feature may result in loss of reporting privileges.
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setIsOpen(false)}
                        className="flex-1 h-11 rounded-xl border border-slate-100 text-[13px] font-bold text-slate-400"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 h-11 rounded-xl bg-slate-900 text-white text-[13px] font-bold disabled:opacity-40"
                      >
                        {loading ? 'Submitting...' : 'Submit Report'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
