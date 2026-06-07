'use client'

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import {
  AlertTriangle, CheckCircle2, X, ChevronRight,
  Search, Plus, Phone, MessageCircle, ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';

//  RADAR CARD 

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
  reporter_uid?: string;
  reporter_name?: string;
}

function ContactModal({ item, onClose }: { item: RadarItem; onClose: () => void }) {
  const router = useRouter();
  const [startingChat, setStartingChat] = useState(false);
  const isLost = item.type === 'LOST';
  const headline = isLost ? 'You Found This Item?' : 'Is This Your Item?';
  const sub = isLost
    ? 'Message the owner directly to arrange a return.'
    : 'Message the reporter directly to collect your item.';

  const handleMessage = async () => {
    if (!auth.currentUser) {
      router.push('/auth');
      return;
    }
    
    const targetUid = item.reporter_uid || 'legacy_user_001';
    const targetName = item.reporter_name || 'Pulse Student';

    if (auth.currentUser.uid === targetUid) {
      alert("You cannot message yourself.");
      return;
    }

    setStartingChat(true);
    const chatId = `chat_${auth.currentUser.uid}_${targetUid}_${item.id}`;
    
    try {
      const chatRef = doc(db, 'chats', chatId);
      const snap = await getDoc(chatRef);
      if (!snap.exists()) {
        await setDoc(chatRef, {
           members: [auth.currentUser.uid, targetUid],
           participant_names: {
              [auth.currentUser.uid]: auth.currentUser.displayName || "Pulse Student",
              [targetUid]: targetName
           },
           type: 'RADAR',
           context_title: item.title,
           context_id: item.id,
           lastMessage: "Conversation started regarding Campus Radar post.",
           updatedAt: serverTimestamp(),
           unread_count: 0
        });
      }
      router.push(`/messages/${chatId}`);
    } catch (e) {
      console.error('[Chat] Error:', e);
      setStartingChat(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-200 bg-slate-900/50 backdrop-blur-md flex items-end justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white w-full max-w-sm rounded-2xl p-8 space-y-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="space-y-1">
          <p className="text-[18px] font-bold text-slate-900 tracking-tight">{headline}</p>
          <p className="text-[13px] font-medium text-[#94a3b8]">{sub}</p>
        </div>

        {item.reward && isLost && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-[12px] font-bold text-emerald-600">{item.reward}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleMessage}
            disabled={startingChat}
            className="flex-1 h-12 bg-slate-900 text-white rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-slate-900/10 disabled:opacity-50"
          >
            <MessageCircle size={16} /> {startingChat ? 'Connecting...' : 'Message'}
          </button>
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

export function RadarCard({ item, onMarkResolved, isMyPost }: { item: RadarItem; onMarkResolved?: (id: string) => void; isMyPost?: boolean }) {
  const [showContact, setShowContact] = useState(false);
  const isLost = item.type === 'LOST';

  return (
    <>
      <div className={`shrink-0 w-[200px] rounded-[18px] p-3 flex flex-col transition-all ${
        item.resolved
          ? 'bg-slate-50/50 opacity-60'
          : 'bg-white shadow-[0_4px_16px_rgb(0,0,0,0.04)] border border-slate-100/50 hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)]'
      }`}>
        {/* Header: Type badge + Profile + time */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold capitalize ${
              item.resolved 
                ? 'bg-slate-100/50 text-slate-500' 
                : isLost 
                  ? 'bg-rose-50 text-rose-600' 
                  : 'bg-emerald-50 text-emerald-600'
            }`}>
              {item.resolved ? 'Resolved' : item.type.toLowerCase()}
            </div>
            <div className="flex items-center gap-1 border-l border-slate-100 pl-1.5">
               <img 
                 src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.reporter_name || 'Pulse'}&mouth=smile,default`} 
                 className="w-3.5 h-3.5 rounded-full bg-slate-50" 
               />
               <span className="text-[9px] font-bold text-slate-500 truncate max-w-[50px]">
                 {item.reporter_name?.split(' ')[0] || 'User'}
               </span>
            </div>
          </div>
          <span className="text-[8px] font-medium text-slate-400 shrink-0">{item.time}</span>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-0.5 mb-2">
          <p className="text-[12px] font-bold text-slate-800 leading-tight tracking-tight truncate">
            {item.title.replace(/^(Lost|Found):\s*/i, '')}
          </p>
          <p className="text-[10px] font-medium text-slate-400 leading-snug line-clamp-2">
            {item.detail}
          </p>
        </div>

        {/* Footer info - Super Compact */}
        <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-50 mb-2">
          {item.reward && (
            <p className="text-[9px] font-bold text-emerald-600 truncate">
               {item.reward}
            </p>
          )}
          <p className="text-[8px] font-medium text-slate-300 truncate">Contact Owner</p>
        </div>

        {/* CTA Button - Tightest */}
        {!item.resolved && (
          isMyPost ? (
            <button
              onClick={() => onMarkResolved?.(item.id)}
              className="w-full h-7 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              Resolve
            </button>
          ) : (
            <button
              onClick={() => setShowContact(true)}
              className={`w-full h-7 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all ${
                isLost ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {isLost ? <Search size={10} /> : <CheckCircle2 size={10} />}
              {isLost ? 'Found' : 'Claim'}
            </button>
          )
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

//  REPORT MODAL 

export function ReportRadarModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'pick' | 'form'>('pick');
  const [type, setType] = useState<'LOST' | 'FOUND'>('LOST');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [reward, setReward] = useState('');

  const isLost = type === 'LOST';
  const canSubmit = title.trim() && detail.trim();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'campus_radar'), {
        type,
        title: title.trim(),
        detail: detail.trim(),
        contact: 'In-App Message',
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
      className="fixed inset-0 z-200 bg-slate-900/50 backdrop-blur-md flex items-end justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white w-full max-w-sm rounded-[24px] p-6 space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[18px] font-bold text-slate-900 tracking-tight">
              {done ? 'Posted!' : step === 'pick' ? 'Campus Radar' : isLost ? 'Report Lost Item' : 'Report Found Item'}
            </p>
            <p className="text-[13px] font-medium text-slate-500 mt-0.5">
              {done ? 'Your post is now live.' : step === 'pick' ? 'What do you want to report?' : 'Fill in the details below'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 active:scale-95 hover:bg-slate-100 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* DONE STATE */}
        {done && (
          <div className="py-4 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <p className="text-[13px] font-medium text-slate-500 text-center">
               Other students can now see your report and contact you directly.
            </p>
            <button onClick={onClose} className="w-full h-12 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-[16px] font-bold text-[13px] active:scale-95 transition-all hover:bg-indigo-100 shadow-sm">
              Done
            </button>
          </div>
        )}

        {/* STEP 1  PICK TYPE */}
        {!done && step === 'pick' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setType('LOST'); setStep('form'); }}
              className="p-5 rounded-[20px] border border-rose-100/50 bg-rose-50/50 flex flex-col gap-2 group active:scale-95 transition-all hover:bg-rose-50"
            >
              <div className="w-12 h-12 rounded-[16px] bg-rose-100/80 flex items-center justify-center">
                <AlertTriangle size={20} className="text-rose-600" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-bold text-slate-900">Lost</p>
                <p className="text-[12px] font-medium text-slate-500">I lost something</p>
              </div>
            </button>

            <button
              onClick={() => { setType('FOUND'); setStep('form'); }}
              className="p-5 rounded-[20px] border border-emerald-100/50 bg-emerald-50/50 flex flex-col gap-2 group active:scale-95 transition-all hover:bg-emerald-50"
            >
              <div className="w-12 h-12 rounded-[16px] bg-emerald-100/80 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-[15px] font-bold text-slate-900">Found</p>
                <p className="text-[12px] font-medium text-slate-500">I found an item</p>
              </div>
            </button>
          </div>
        )}

        {/* STEP 2  FORM */}
        {!done && step === 'form' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-slate-800 px-1">
                {isLost ? 'What did you lose?' : 'What did you find?'}
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={isLost ? 'e.g. Student ID Card' : 'e.g. Keys'}
                className="w-full h-12 px-4 rounded-[16px] border border-slate-100 bg-slate-50 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-300 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-slate-800 px-1">
                {isLost ? 'Where did you last see it?' : 'Where did you find it?'}
              </label>
              <input
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder={isLost ? 'e.g. Level 3 Library' : 'e.g. Caf Rasa'}
                className="w-full h-12 px-4 rounded-[16px] border border-slate-100 bg-slate-50 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-300 transition-colors"
              />
            </div>

            {isLost && (
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-slate-800 px-1">Reward (optional)</label>
                <input
                  value={reward}
                  onChange={e => setReward(e.target.value)}
                  placeholder="e.g. RM 10 reward"
                  className="w-full h-12 px-4 rounded-[16px] border border-slate-100 bg-slate-50 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-300 transition-colors"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('pick')}
                className="h-12 px-5 bg-white border border-slate-200 text-slate-600 rounded-[16px] font-bold text-[13px] active:scale-95 transition-all hover:bg-slate-50 shadow-sm"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className={`flex-1 h-12 rounded-[16px] font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-30 shadow-sm ${
                  isLost ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
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
