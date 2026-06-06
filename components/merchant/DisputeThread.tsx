"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Image as ImageIcon, Send, Loader2, CheckCircle2, AlertCircle, Package, Bike, MapPin, Clock, ChevronRight, ShieldAlert, ZoomIn } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { respondToDispute } from '@/lib/marketplace-utils';

interface DisputeThreadProps {
  dispute: any;
  onClose: () => void;
}

type TimelineEvent = {
  label: string;
  date: Date | null;
  icon: string;
  status: 'done' | 'current' | 'pending';
};

function formatDate(d: Date): string {
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
}

function formatDateFull(d: Date): string {
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DisputeThread({ dispute, onClose }: DisputeThreadProps) {
  const [order, setOrder] = useState<any>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [narrative, setNarrative] = useState(dispute.merchant_response || '');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (dispute.order_id) {
        const snap = await getDoc(doc(db, "orders", dispute.order_id));
        if (snap.exists()) setOrder({ id: snap.id, ...snap.data() });
      }
      setLoadingOrder(false);
    }
    fetchOrder();
  }, [dispute.order_id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative) return;
    setIsSubmitting(true);
    try {
      await respondToDispute(dispute.id, { narrative }, image || undefined);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isResponded = dispute.status === 'MERCHANT_RESPONDED' || dispute.status === 'RESOLVED' || dispute.status === 'SETTLED';
  const orderItems = order?.items || [];

  /* Timeline */
  const disputeCreated = dispute.created_at?.toDate ? dispute.created_at.toDate() : null;
  const disputeResolved = dispute.resolved_at ? new Date(dispute.resolved_at) : null;
  const merchantResponded = dispute.merchant_responded_at?.toDate ? dispute.merchant_responded_at.toDate() : null;

  const rawEvents = [
    { label: 'Order placed', date: order?.created_at?.toDate ? order.created_at.toDate() : null, icon: 'package' },
    { label: 'Order accepted', date: order?.accepted_at?.toDate ? order.accepted_at.toDate() : null, icon: 'check' },
    { label: 'Order delivered', date: order?.completed_at?.toDate ? order.completed_at.toDate() : null, icon: 'bike' },
    { label: 'Dispute opened', date: disputeCreated, icon: 'alert' },
    { label: 'You responded', date: merchantResponded, icon: 'message' },
    { label: 'Case resolved', date: disputeResolved, icon: 'check' },
  ];
  const timelineEvents: TimelineEvent[] = rawEvents.map((e, i): TimelineEvent => {
    if (i > 3 && !e.date) return { ...e, status: 'pending' };
    if (i < 4) return { ...e, status: 'done' };
    if (i === 4 && e.date && !disputeResolved) return { ...e, status: 'current' };
    if (i === 5 && e.date) return { ...e, status: 'done' };
    if (i === 4 && !e.date) return { ...e, status: 'pending' };
    return { ...e, status: 'pending' };
  }).filter(e => e.date || e.status !== 'done');

  const statusLabel = dispute.status === 'RESOLVED' || dispute.status === 'SETTLED' ? 'Resolved'
    : dispute.status === 'MERCHANT_RESPONDED' ? 'Under Review'
    : 'Open';

  const statusColor = dispute.status === 'RESOLVED' || dispute.status === 'SETTLED' ? 'text-emerald-600'
    : dispute.status === 'MERCHANT_RESPONDED' ? 'text-blue-600'
    : 'text-red-500';

  const statusBg = dispute.status === 'RESOLVED' || dispute.status === 'SETTLED' ? 'bg-emerald-50 border-emerald-200'
    : dispute.status === 'MERCHANT_RESPONDED' ? 'bg-blue-50 border-blue-200'
    : 'bg-red-50 border-red-200';

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-t-3xl shadow-xl overflow-hidden"
        >
          <div className="p-10 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900 tracking-tight">Response Submitted</h3>
              <p className="text-[11px] font-medium text-[#94a3b8] mt-1 leading-relaxed max-w-[260px]">
                Your response has been sent to the admin for review. We'll notify you when the case is resolved.
              </p>
            </div>
            <button onClick={onClose} className="w-full py-4 bg-slate-900 text-white rounded-xl text-[11px] font-bold">
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white rounded-t-3xl shadow-xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50 shrink-0">
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${statusBg} ${statusColor}`}>{statusLabel}</span>
              <span className="text-[10px] font-bold text-[#94a3b8]">#{dispute.order_code}</span>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[#94a3b8] hover:text-slate-900">
              <X size={16} />
            </button>
          </div>

          {loadingOrder ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-[#94a3b8]" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Timeline */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <div className="space-y-0">
                  {timelineEvents.map((evt, i) => (
                    <div key={i} className="flex items-start gap-3 relative pb-4 last:pb-0 last:min-h-0">
                      {i < timelineEvents.length - 1 && (
                        <div className={`absolute left-[11px] top-6 bottom-0 w-px ${evt.status === 'done' ? 'bg-slate-200' : 'bg-slate-100'}`} />
                      )}
                      <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        evt.status === 'done' ? 'bg-slate-900 text-white' : evt.status === 'current' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-50 text-slate-300 border border-slate-100'
                      }`}>
                        {evt.icon === 'alert' ? <AlertCircle size={10} /> : evt.icon === 'check' ? <CheckCircle2 size={10} /> : evt.icon === 'bike' ? <Bike size={10} /> : evt.icon === 'message' ? <Send size={10} /> : <Package size={10} />}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className={`text-[11px] font-bold ${evt.status === 'pending' ? 'text-slate-300' : 'text-slate-900'}`}>{evt.label}</p>
                        {evt.date && (
                          <p className="text-[9px] font-medium text-[#94a3b8] mt-0.5">{formatDateFull(evt.date)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student's Claim */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-red-600">{dispute.reporter_name?.toUpperCase() || 'STUDENT'}</span>
                  <span className="text-[8px] font-bold text-red-500 bg-white px-2 py-0.5 rounded border border-red-100">{dispute.reason}</span>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[13px] font-medium text-slate-900 leading-relaxed">{dispute.narrative}</p>
                </div>
                {dispute.evidence_url && (
                  <div className="px-5 pb-4">
                    <div className="relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                      <img src={dispute.evidence_url} alt="Student evidence" className="w-full h-40 object-cover" />
                      <button
                        onClick={() => setExpandedImage(dispute.evidence_url)}
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center text-slate-700 shadow-sm"
                      >
                        <ZoomIn size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Items Ordered */}
              {orderItems.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-50">
                    <span className="text-[9px] font-bold text-[#94a3b8]">ITEMS ORDERED</span>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {orderItems.map((item: any, i: number) => (
                      <div key={i} className="px-5 py-3 flex items-center gap-3">
                        {item.image_url ? (
                          <div className="w-10 h-10 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 shrink-0">
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100 shrink-0">
                            <Package size={16} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-slate-900 truncate">{item.title}</p>
                          {item.qty > 1 && <p className="text-[9px] font-medium text-[#94a3b8]">x{item.qty}</p>}
                        </div>
                        <p className="text-[13px] font-bold text-slate-900 shrink-0">RM{(item.price * (item.qty || 1)).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#94a3b8]">Total</span>
                    <span className="text-[14px] font-bold text-slate-900">RM{order?.total?.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Delivery Info */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-50">
                  <span className="text-[9px] font-bold text-[#94a3b8]">DELIVERY</span>
                </div>
                <div className="divide-y divide-slate-50">
                  <div className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bike size={14} className="text-[#94a3b8]" />
                      <span className="text-[11px] font-medium text-slate-900">{order?.delivery_type === 'SELF_COLLECT' ? 'Self Collect' : 'Runner Delivery'}</span>
                    </div>
                    {order?.drop_off_location && (
                      <span className="text-[10px] font-bold text-slate-500">{order.drop_off_location}</span>
                    )}
                  </div>
                  {order?.runner_name && (
                    <div className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bike size={14} className="text-[#94a3b8]" />
                        <span className="text-[11px] font-medium text-slate-900">Runner</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-900">{order.runner_name}</span>
                    </div>
                  )}
                  {dispute.handshake?.verification_type && (
                    <div className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#94a3b8]" />
                        <span className="text-[11px] font-medium text-slate-900">GPS Verification</span>
                      </div>
                      <span className={`text-[9px] font-bold ${dispute.handshake.verification_type === 'IN_PERSON_SAFE' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {dispute.handshake.verification_type === 'IN_PERSON_SAFE' ? 'Verified' : 'Remote'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Previous Response (if already responded) */}
              {isResponded && !submitted && dispute.merchant_response && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-blue-100 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-blue-600" />
                    <span className="text-[9px] font-bold text-blue-900">YOUR RESPONSE</span>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-[13px] font-medium text-slate-900 leading-relaxed">{dispute.merchant_response}</p>
                  </div>
                  {dispute.merchant_evidence_url && (
                    <div className="px-5 pb-4">
                      <div className="relative rounded-xl overflow-hidden bg-white border border-blue-100">
                        <img src={dispute.merchant_evidence_url} alt="Your evidence" className="w-full h-36 object-cover" />
                        <button
                          onClick={() => setExpandedImage(dispute.merchant_evidence_url)}
                          className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center text-slate-700 shadow-sm"
                        >
                          <ZoomIn size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="px-5 py-3 bg-white border-t border-blue-100">
                    <p className="text-[10px] font-medium text-blue-600">
                      {dispute.status === 'RESOLVED' || dispute.status === 'SETTLED' ? 'Case resolved by admin.' : 'Waiting for admin review.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Response Form (if not yet responded) */}
              {!isResponded && !submitted && (
                <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-50">
                    <span className="text-[9px] font-bold text-[#94a3b8]">YOUR RESPONSE</span>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    <textarea
                      value={narrative}
                      onChange={(e) => setNarrative(e.target.value)}
                      required
                      placeholder="Explain your side of the story. Include any details that may help the admin make a fair decision."
                      className="w-full h-32 bg-white border border-slate-100 rounded-xl p-4 text-[13px] font-medium text-slate-900 focus:border-slate-900 transition-all outline-none resize-none leading-relaxed"
                    />
                    <label className="group w-full h-16 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center gap-2.5 cursor-pointer hover:bg-slate-50 transition-all relative overflow-hidden bg-white">
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      {previewUrl && <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="" />}
                      <ImageIcon size={16} className="text-[#94a3b8] group-hover:text-slate-900" />
                      <span className="text-[9px] font-medium text-[#94a3b8]">{image ? image.name : 'Add photo evidence (optional)'}</span>
                    </label>
                  </div>
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={isSubmitting || !narrative}
                      className="w-full py-4 bg-slate-900 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-20"
                    >
                      {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Send size={16} />
                          Submit for Admin Review
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Expanded image overlay */}
      {expandedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] bg-slate-900/90 flex items-center justify-center p-6"
          onClick={() => setExpandedImage(null)}
        >
          <button onClick={() => setExpandedImage(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
            <X size={20} />
          </button>
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={expandedImage}
            alt="Evidence"
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
          />
        </motion.div>
      )}
    </>
  );
}
