"use client"

import { useState } from 'react';
import { Star, MessageSquare, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { submitReview } from '@/app/actions/reviewActions';

interface PostDeliveryReviewProps {
  order: any;
  userId: string;
  itemId?: string;
  isOfficial?: boolean;
}

export default function PostDeliveryReview({ order, userId, itemId, isOfficial }: PostDeliveryReviewProps) {
  const [vendorRating, setVendorRating] = useState(0);
  const [runnerRating, setRunnerRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isRunnerDelivery = order.delivery_type === 'RUNNER' && order.runner_id;
  const targetType = isOfficial ? 'SELLER' : 'ITEM';
  const reviewItemId = itemId || order.items?.[0]?.productId || '';

  const handleSubmit = async () => {
    if (vendorRating === 0 || (isRunnerDelivery && runnerRating === 0)) return;
    setIsSubmitting(true);
    
    try {
      const res = await submitReview({
        orderId: order.id,
        buyerId: userId,
        vendorRating,
        runnerRating: isRunnerDelivery ? runnerRating : 0,
        vendorId: order.seller_id,
        runnerId: isRunnerDelivery ? order.runner_id : null,
        comment,
        itemId: reviewItemId,
        targetType
      });

      if (res.success) {
        setIsSubmitted(true);
        setTimeout(() => {
          router.push('/me/orders');
        }, 1500);
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
        <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center mx-auto border border-slate-200">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-1">
           <h4 className="text-[15px] font-bold text-slate-900">Thank You</h4>
           <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed px-4">
             Your feedback helps keep the campus community safe and reliable.
           </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="px-2 space-y-1">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-amber-400" fill="currentColor" />
          <h3 className="text-[18px] font-bold text-slate-900 tracking-tight">Rate your experience</h3>
        </div>
        <p className="text-[12px] font-medium text-[#94a3b8]">Help us improve the campus marketplace.</p>
      </div>
      
      <div className="bg-white rounded-[24px] border border-slate-100 p-1 divide-y divide-slate-50 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        {/* Product Review */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
             <h4 className="text-[14px] font-bold text-slate-900 truncate pr-4">{order.title || 'Item Quality'}</h4>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-50 rounded-md">Product</span>
          </div>
          <StarRating value={vendorRating} onChange={setVendorRating} />
        </div>

        {/* Runner Review */}
        {isRunnerDelivery && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
               <h4 className="text-[14px] font-bold text-slate-900">Delivery Service</h4>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 bg-slate-50 rounded-md">Runner</span>
            </div>
            <StarRating value={runnerRating} onChange={setRunnerRating} />
          </div>
        )}

        {/* Comments */}
        <div className="p-5">
          <textarea 
            placeholder="Tell us what you loved (or didn't)..."
            className="w-full h-20 text-[14px] font-medium text-slate-900 focus:outline-none placeholder:text-slate-300 resize-none leading-relaxed bg-transparent"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        disabled={vendorRating === 0 || (isRunnerDelivery && runnerRating === 0) || isSubmitting}
        className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[14px] shadow-[0_8px_30px_rgba(15,23,42,0.15)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95"
      >
        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit Feedback'}
      </button>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number, onChange: (v: number) => void }) {
  const getLabel = (v: number) => {
    switch(v) {
      case 1: return "Poor";
      case 2: return "Fair";
      case 3: return "Good";
      case 4: return "Very Good";
      case 5: return "Excellent";
      default: return "Tap a star to rate";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button 
            key={star}
            whileTap={{ scale: 0.8 }}
            onClick={() => onChange(star)}
            className={`transition-all duration-300 ${star <= value ? 'text-amber-400' : 'text-slate-200 hover:text-slate-300'}`}
          >
            <Star size={36} fill={star <= value ? "currentColor" : "none"} strokeWidth={1.5} />
          </motion.button>
        ))}
      </div>
      <span className={`text-[12px] font-bold ${value > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
        {getLabel(value)}
      </span>
    </div>
  );
}
