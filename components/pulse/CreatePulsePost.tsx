"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Image as ImageIcon, AlertCircle, Sparkles } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface CreatePulsePostProps {
  isOpen: boolean;
  onClose: () => void;
}

const TAGS = [
  { id: 'ADMIN', label: 'Administrative', color: 'bg-blue-50 text-blue-600' },
  { id: 'EVENT', label: 'Campus Event', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'CLUB', label: 'Club Update', color: 'bg-purple-50 text-purple-600' },
  { id: 'NEWS', label: 'General News', color: 'bg-slate-50 text-slate-500' },
];

export default function CreatePulsePost({ isOpen, onClose }: CreatePulsePostProps) {
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [selectedTag, setSelectedTag] = useState('NEWS');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!headline || !body || !auth.currentUser) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      await addDoc(collection(db, "announcements"), {
        headline,
        body,
        tag: selectedTag,
        author_id: auth.currentUser.uid,
        author_name: auth.currentUser.displayName || 'Pulse Member',
        created_at: serverTimestamp(),
        type: 'STUDENT_POST'
      });
      onClose();
      setHeadline('');
      setBody('');
    } catch (e) {
      console.error("Pulse Submission Error:", e);
      setSubmitError('Broadcast failed. Check your network and try again.');
      setTimeout(() => setSubmitError(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#111111]/20 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-md overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#111111] rounded-2xl flex items-center justify-center text-white">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] font-black text-[#000000] tracking-tight">Initiate Pulse</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Broadcast to the campus network</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#000000]/20 hover:text-[#000000] transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar max-h-[60vh]">
              {/* Tag Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-1">Classification</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTag(tag.id)}
                      className={`px-4 py-2 rounded-full text-[12px] font-bold transition-all border ${
                        selectedTag === tag.id
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-slate-400 border-slate-100'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headline Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-1">Headline</label>
                <input
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder="Brief, high-impact title..."
                  className="w-full h-14 px-6 bg-slate-50 rounded-2xl border-none text-[16px] font-bold text-[#000000] placeholder:text-slate-300 focus:ring-2 focus:ring-[#111111]/5 transition-all"
                />
              </div>

              {/* Body Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] px-1">Detail Payload</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Provide granular context for this update..."
                  className="w-full h-40 p-6 bg-slate-50 rounded-2xl border-none text-[15px] font-medium text-[#000000] placeholder:text-slate-300 focus:ring-2 focus:ring-[#111111]/5 transition-all resize-none"
                />
              </div>

              {/* Image attachment drop zone */}
              <div className="h-48 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-3 group cursor-pointer hover:border-[#111111] transition-all">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-[#111111] group-hover:text-white transition-all">
                  <ImageIcon size={24} />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest">Attach Media Assets</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-neutral-50 flex flex-col gap-3">
              {/* In-UI error message */}
              {submitError && (
                <div className="w-full px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-[12px] font-bold text-red-500">
                  {submitError}
                </div>
              )}
              <div className="flex gap-4 items-start">
                <div className="flex-1 flex items-start gap-3">
                  <AlertCircle size={14} className="text-slate-300 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Posts are audited by the Institutional Integrity Filter. Ensure compliance with UniKL MIIT code of conduct.
                  </p>
                </div>
                <button
                  disabled={submitting || !headline || !body}
                  onClick={handleSubmit}
                  className="h-14 px-8 bg-[#111111] text-white rounded-2xl font-bold text-[14px] uppercase tracking-widest flex items-center gap-3 shadow-md shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Broadcast
                      <Send size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
