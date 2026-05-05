"use client";

import { useState } from 'react';
import { approveListing, rejectListing } from '@/app/actions/adminActions';
import { Check, X, AlertCircle, Clock, Tag, User, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminProductApprovalsProps {
  items: any[];
  guidelines: Record<string, number>;
}

export default function AdminProductApprovals({ items, guidelines }: AdminProductApprovalsProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
          <Check size={24} className="text-gray-200" />
        </div>
        <h3 className="text-[18px] font-black text-gray-900 uppercase tracking-tighter text-black">Inbox Zero</h3>
        <p className="text-[14px] text-gray-400 mt-1">All campus listings are within policy limits.</p>
      </div>
    );
  }

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await approveListing(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    setProcessingId(id);
    try {
      await rejectListing(id, reason);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {items.map((item) => {
          const suggestedLimit = guidelines[item.category] || 0;
          
          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[22px] border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-[18px] font-black text-gray-900 uppercase tracking-tight leading-none mb-2 text-black">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-100 flex items-center gap-1">
                      <AlertCircle size={10} /> Pending Review
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Flagged Price</p>
                  <p className="text-[24px] font-black text-gray-900 text-black">RM {Number(item.price).toFixed(2)}</p>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-8 mb-6 border-y border-gray-50 py-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] block mb-1">Vendor Registry</label>
                    <div className="flex items-center gap-2 text-[13px] font-medium text-gray-600">
                      <User size={14} className="text-gray-300" /> {item.seller_id}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] block mb-1">Classification</label>
                    <div className="flex items-center gap-2 text-[13px] font-medium text-gray-600">
                      <Tag size={14} className="text-gray-300" /> {item.category}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] block mb-1">Suggested Limit</label>
                    <div className="flex items-center gap-2 text-[13px] font-bold text-[#00927C]">
                      <DollarSign size={14} /> RM {suggestedLimit.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] block mb-1">Listing Date</label>
                    <div className="flex items-center gap-2 text-[13px] font-medium text-gray-600">
                      <Clock size={14} className="text-gray-300" /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Justification Block */}
              <div className="bg-gray-50 rounded-[18px] p-5 mb-8">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">Vendor Justification</label>
                <p className="text-[13px] font-medium text-gray-700 italic leading-relaxed">
                  {item.justification || "No justification provided."}
                </p>
              </div>

              {/* Action Terminal */}
              <div className="flex gap-3">
                <button 
                  disabled={processingId === item.id}
                  onClick={() => handleReject(item.id)}
                  className="flex-1 h-14 rounded-[16px] bg-red-50 text-red-700 border border-red-100 font-black text-[11px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X size={16} /> Reject & Adjust
                </button>
                <button 
                  disabled={processingId === item.id}
                  onClick={() => handleApprove(item.id)}
                  className="flex-1 h-14 rounded-[16px] bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-black/10"
                >
                  <Check size={16} /> Approve Override
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
