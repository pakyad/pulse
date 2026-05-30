'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import {
  AlertTriangle, CheckCircle2, X, ChevronRight,
  Search, Plus, Phone, MessageCircle
} from 'lucide-react';

// ─── RADAR CARD ───────────────────────────────────────────────────────────────

interface RadarItem {
  id: string;
  type: 'LOST' | 'FOUND';
  title: string;
  detail: string;
  reward?: string;
  contact: string;
  time: string;
  resolved?: boolean;
  fromFirestore?: boolean;
}

function ContactModal({ item, onClose }: { item: RadarItem; onClose: () => void }) {
  const isLost = item.type === 'LOST';
  const headline = isLost ? 'You Found This Item?' : 'Is This Your Item?';
  const sub = isLost
    ? 'Contact the owner below to arrange return. They may offer a reward.'
    : 'Contact the reporter below to collect your item.';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-200 bg-black/50 backdrop-blur-sm flex items-end justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="space-y-1">
          <p className="text-[18px] font-bold text-[#000000] tracking-tight">{headline}</p>
          <p className="text-[13px] font-medium text-[#94a3b8]">{sub}</p>
        </div>

        <div className={`p-4 rounded-2xl space-y-2 ${isLost ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Contact Info</p>
          <p className="text-[15px] font-bold text-[#000000]">{item.contact}</p>
          {item.reward && (
            <p className="text-[12px] font-semibold text-emerald-600">{item.reward}</p>
          )}
        </div>

        <div className="flex gap-3">
          <a
            href={`https://wa.me/?text=Hi, I saw your ${item.type === 'LOST' ? 'lost' : 'found'} item post on Pulse: "${item.title}"`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 h-12 bg-[#111111] text-white rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <MessageCircle size={16} /> Message
          </a>
          <button
            onClick={onClose}
            className="h-12 px-5 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl font-bold text-[13px] active:scale-95 transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function RadarCard({ item, onMarkResolved }: { item: RadarItem; onMarkResolved?: (id: string) => void }) {
  const [showContact, setShowContact] = useState(false);
  const isLost = item.type === 'LOST';

  return (
    <>
      <div className={`shrink-0 w-[240px] rounded-[24px] p-5 space-y-4 border flex flex-col transition-all ${
        item.resolved
          ? 'bg-slate-50/50 border-slate-100 opacity-60'
          : 'bg-white border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-slate-200'
      }`}>
        {/* Header: Subtle Type badge + time */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.15em] ${
            item.resolved 
              ? 'bg-slate-100 text-slate-400' 
              : isLost 
                ? 'bg-slate-100 text-slate-600' 
                : 'bg-slate-100 text-slate-600'
          }`}>
            {item.resolved
              ? <CheckCircle2 size={10} />
              : isLost ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />
            }
            {item.resolved ? 'RESOLVED' : item.type}
          </div>
          <span className="text-[10px] font-medium text-slate-400">{item.time}</span>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1.5">
          <p className="text-[14px] font-bold text-[#000000] leading-snug">{item.title}</p>
          <p className="text-[12px] font-medium text-[#64748b] leading-relaxed line-clamp-2">
            {item.detail}
          </p>
        </div>

        {/* Footer info */}
        <div className="text-[11px] font-medium text-slate-500 pt-3 border-t border-slate-100/80">
          {item.reward && <span className="block font-bold text-[#000000] mb-0.5">{item.reward}</span>}
          <span>{item.contact}</span>
        </div>

        {/* CTA Button - Sleek and professional */}
        {!item.resolved && (
          <button
            onClick={() => setShowContact(true)}
            className="w-full h-10 rounded-xl bg-slate-50 border border-slate-200 text-[#000000] text-[12px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-slate-100"
          >
            {isLost ? <Search size={14} className="text-slate-500" /> : <CheckCircle2 size={14} className="text-slate-500" />}
            {isLost ? 'I Have This' : 'This Is Mine'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showContact && (
          <ContactModal item={item} onClose={() => setShowContact(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── REPORT MODAL ─────────────────────────────────────────────────────────────

export function ReportRadarModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'pick' | 'form'>('pick');
  const [type, setType] = useState<'LOST' | 'FOUND'>('LOST');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [contact, setContact] = useState('');
  const [reward, setReward] = useState('');

  const isLost = type === 'LOST';
  const canSubmit = title.trim() && detail.trim() && contact.trim();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'campus_radar'), {
        type,
        title: title.trim(),
        detail: detail.trim(),
        contact: contact.trim(),
        reward: reward.trim() || null,
        resolved: false,
        reporter_uid: user?.uid || null,
        reporter_name: user?.displayName || 'Anonymous',
        created_at: serverTimestamp(),
      });
      setDone(true);
    } catch (e) {
      console.error('[Radar] Submit error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-200 bg-black/50 backdrop-blur-sm flex items-end justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white w-full max-w-sm rounded-[32px] p-8 space-y-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[18px] font-bold text-[#000000] tracking-tight">
              {done ? 'Posted!' : step === 'pick' ? 'Campus Radar' : isLost ? 'Report Lost Item' : 'Report Found Item'}
            </p>
            <p className="text-[12px] font-medium text-[#94a3b8] mt-0.5">
              {done ? 'Your post is now live on Pulse.' : step === 'pick' ? 'What do you want to report?' : 'Fill in the details below'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 active:scale-95">
            <X size={16} />
          </button>
        </div>

        {/* DONE STATE */}
        {done && (
          <div className="py-4 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <p className="text-[13px] font-medium text-[#94a3b8] text-center">
              Other students can now see your report and contact you directly.
            </p>
            <button onClick={onClose} className="w-full h-12 bg-[#111111] text-white rounded-2xl font-bold text-[13px] active:scale-95 transition-all">
              Done
            </button>
          </div>
        )}

        {/* STEP 1 — PICK TYPE */}
        {!done && step === 'pick' && (
          <div className="space-y-3">
            <button
              onClick={() => { setType('LOST'); setStep('form'); }}
              className="w-full p-5 rounded-2xl border border-red-100 bg-red-50/60 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={18} className="text-red-500" />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-bold text-[#000000]">I Lost Something</p>
                  <p className="text-[11px] font-medium text-[#94a3b8]">Post a lost item alert</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>

            <button
              onClick={() => { setType('FOUND'); setStep('form'); }}
              className="w-full p-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-bold text-[#000000]">I Found Something</p>
                  <p className="text-[11px] font-medium text-[#94a3b8]">Help return a found item</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
          </div>
        )}

        {/* STEP 2 — FORM */}
        {!done && step === 'form' && (
          <div className="space-y-4">
            {/* Item name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {isLost ? 'What did you lose?' : 'What did you find?'}
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={isLost ? 'e.g. Blue Casio Calculator' : 'e.g. Student ID Card'}
                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-[13px] font-medium text-[#000000] placeholder:text-slate-300 outline-none focus:border-slate-300 transition-colors"
              />
            </div>

            {/* Location / detail */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {isLost ? 'Where did you last see it?' : 'Where did you find it?'}
              </label>
              <textarea
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder={isLost ? 'e.g. Level 3 Library, near the window seats' : 'e.g. Surrendered to guard at Main Lobby'}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-[13px] font-medium text-[#000000] placeholder:text-slate-300 outline-none focus:border-slate-300 transition-colors resize-none"
              />
            </div>

            {/* Contact */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your contact</label>
              <input
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="e.g. DM @haziq_miit or 011-XXXXXXXX"
                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-[13px] font-medium text-[#000000] placeholder:text-slate-300 outline-none focus:border-slate-300 transition-colors"
              />
            </div>

            {/* Reward (lost only) */}
            {isLost && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reward (optional)</label>
                <input
                  value={reward}
                  onChange={e => setReward(e.target.value)}
                  placeholder="e.g. RM 10 reward"
                  className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-[13px] font-medium text-[#000000] placeholder:text-slate-300 outline-none focus:border-slate-300 transition-colors"
                />
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setStep('pick')}
                className="h-12 px-5 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl font-bold text-[13px] active:scale-95 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className={`flex-1 h-12 rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30 ${
                  isLost ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                }`}
              >
                {submitting ? 'Posting...' : 'Post to Pulse'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
