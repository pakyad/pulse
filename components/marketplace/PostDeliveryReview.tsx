"use client"

import { useState } from 'react';
import { Star, MessageSquare, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitReview } from '@/app/actions/reviewActions';

interface PostDeliveryReviewProps {
  order: any;
  userId: string;
}

export default function PostDeliveryReview({ order, userId }: PostDeliveryReviewProps) {
  const [vendorRating, setVendorRating] = useState(0);
  const [runnerRating, setRunnerRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (vendorRating === 0 || runnerRating === 0) return;
    setIsSubmitting(true);
    
    try {
      const res = await submitReview({
        orderId: order.id,
        buyerId: userId,
        vendorRating,
        runnerRating,
        vendorId: order.seller_id,
        runnerId: order.runner_id,
        comment
      });

      if (res.success) {
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 bg-emerald-50/30 rounded-[32px] border border-emerald-100/50 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <CheckCircle2 size={32} />
        </div>
        <h4 className="text-[16px] font-black text-emerald-900 uppercase tracking-tight mb-2">Metrics Synced</h4>
        <p className="text-[13px] font-bold text-emerald-600/60 uppercase tracking-widest leading-relaxed px-4">
          Thank you for keeping the Pulse ecosystem safe.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="px-2">
        <h3 className="text-[20px] font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">Quality Assurance</h3>
        <p className="text-[13px] font-medium text-slate-400">Rate your experience to unlock next session metrics.</p>
      </div>
      
      {/* Vendor Card */}
      <div className="bg-white rounded-[28px] border border-slate-100 p-7 shadow-sm">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Item Integrity</p>
        <h4 className="text-[16px] font-bold text-slate-900 mb-6 truncate">{order.title || 'Product Review'}</h4>
        <StarRating value={vendorRating} onChange={setVendorRating} />
      </div>

      {/* Runner Card */}
      <div className="bg-white rounded-[28px] border border-slate-100 p-7 shadow-sm">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Logistics Velocity</p>
        <h4 className="text-[16px] font-bold text-slate-900 mb-6">Delivery Runner</h4>
        <StarRating value={runnerRating} onChange={setRunnerRating} />
      </div>

      {/* Comment Section */}
      <div className="bg-white rounded-[28px] border border-slate-100 p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
            <MessageSquare size={14} className="text-slate-400" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Feedback</p>
        </div>
        <textarea 
          placeholder="Share details about the quality or service..."
          className="w-full h-24 text-[14px] font-medium text-slate-900 focus:outline-none placeholder:text-slate-200 resize-none"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button 
        onClick={handleSubmit}
        disabled={vendorRating === 0 || runnerRating === 0 || isSubmitting}
        className="w-full h-20 bg-slate-900 text-white rounded-[24px] font-black text-[14px] uppercase tracking-widest shadow-2xl shadow-slate-900/20 disabled:opacity-10 transition-all flex items-center justify-center gap-3"
      >
        {isSubmitting ? (
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        ) : null}
        {isSubmitting ? "Processing..." : "Authorize Review"}
      </button>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex gap-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button 
          key={star}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(star)}
          className={`transition-all ${star <= value ? 'text-amber-400' : 'text-slate-100 hover:text-slate-200'}`}
        >
          <Star size={36} fill={star <= value ? "currentColor" : "none"} strokeWidth={2.5} />
        </motion.button>
      ))}
    </div>
  );
}
