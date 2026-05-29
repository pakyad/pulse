"use client"

import { useState } from 'react';
import { Star, MessageSquare, CheckCircle2, Send, Loader2 } from 'lucide-react';
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-10 bg-slate-50/50 rounded-2xl border border-slate-100 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mx-auto border border-emerald-100">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-1">
           <h4 className="text-[15px] font-bold text-[#000000]">Thank You</h4>
           <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed px-4">
             Your feedback helps keep the campus community safe and reliable.
           </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="px-2 space-y-1">
        <h3 className="text-[17px] font-bold text-[#000000] tracking-tight">Feedback</h3>
        <p className="text-[11px] font-medium text-[#94a3b8]">Help us improve the campus experience.</p>
      </div>
      
      {/* Product Review */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest px-1">Product</p>
        <div className="space-y-4">
           <h4 className="text-[14px] font-bold text-[#000000] truncate">{order.title || 'Item Review'}</h4>
           <StarRating value={vendorRating} onChange={setVendorRating} />
        </div>
      </div>

      {/* Runner Review */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest px-1">Runner</p>
        <div className="space-y-4">
           <h4 className="text-[14px] font-bold text-[#000000]">Delivery Runner</h4>
           <StarRating value={runnerRating} onChange={setRunnerRating} />
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <p className="text-[9px] font-black text-[#94a3b8] uppercase tracking-widest px-1">Comments</p>
        <textarea 
          placeholder="Optional: How was the service?"
          className="w-full h-24 text-[13px] font-medium text-[#000000] focus:outline-none placeholder:text-slate-200 resize-none leading-relaxed"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button 
        onClick={handleSubmit}
        disabled={vendorRating === 0 || runnerRating === 0 || isSubmitting}
        className="w-full h-14 bg-blue-600 text-white rounded-xl font-bold text-[12px] uppercase tracking-[0.2em] shadow-lg shadow-slate-900/5 disabled:opacity-20 transition-all flex items-center justify-center gap-3 active:scale-95"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Submit Feedback <Send size={16} className="rotate-45" /></>}
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
          <Star size={32} fill={star <= value ? "currentColor" : "none"} strokeWidth={2} />
        </motion.button>
      ))}
    </div>
  );
}
