"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Package, MapPin, Camera, Clock, DollarSign, FileText, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

interface ProofInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function ProofInspector({ isOpen, onClose, order }: ProofInspectorProps) {
  const [buyerData, setBuyerData] = useState<any>(null);
  const [runnerData, setRunnerData] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !order) return;
    const fetchAuditData = async () => {
      setLoading(true);
      try {
        // Buyer lookup
        if (order.buyer_id) {
          const buyerSnap = await getDoc(doc(db, 'users', order.buyer_id));
          if (buyerSnap.exists()) setBuyerData(buyerSnap.data());
        }
        // Runner lookup
        if (order.runner_id) {
          const runnerSnap = await getDoc(doc(db, 'users', order.runner_id));
          if (runnerSnap.exists()) setRunnerData(runnerSnap.data());
        }
        // Evidence lookup
        const evQuery = query(collection(db, 'admin_evidence'), where('orderId', '==', order.id));
        const evSnap = await getDocs(evQuery);
        setEvidence(evSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Failed to fetch audit data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditData();
  }, [isOpen, order]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!order) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#F8F9FA] z-[1010] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Audit Trail</h2>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">Order #{order.id.slice(-6).toUpperCase()}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Section 1: Order Details */}
                  <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-slate-400" />
                      <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">Order Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Order Code</p>
                        <p className="text-[13px] font-mono font-bold text-slate-900 mt-0.5">#{order.id.slice(-6).toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Created</p>
                        <p className="text-[13px] font-medium text-slate-900 mt-0.5">
                          {order.created_at?.toDate ? order.created_at.toDate().toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Payment</p>
                        <p className="text-[13px] font-medium text-slate-900 mt-0.5">{order.payment_method || 'Online Banking'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Total</p>
                        <p className="text-[13px] font-bold text-slate-900 mt-0.5">RM {Number(order.total || order.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </section>

                  {/* Section 2: Buyer Info */}
                  <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={16} className="text-slate-400" />
                      <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">Buyer Info</h3>
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-slate-900">{order.customer_name || 'Student'}</p>
                      {buyerData && (
                        <div className="mt-2 space-y-1">
                          {buyerData.matricNumber && <p className="text-[12px] text-slate-500 font-mono">ID: {buyerData.matricNumber}</p>}
                          {buyerData.programme && <p className="text-[12px] text-slate-500">{buyerData.programme}</p>}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Section 3: Fulfillment */}
                  <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package size={16} className="text-slate-400" />
                      <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">Fulfillment</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start pb-3 border-b border-slate-50">
                        <div>
                          <p className="text-[13px] font-bold text-slate-900">{order.title}</p>
                          <p className="text-[11px] font-medium text-slate-400 mt-0.5">Qty: {order.items?.[0]?.qty || 1} × RM {Number(order.price / (order.items?.[0]?.qty || 1)).toFixed(2)}</p>
                        </div>
                        <p className="text-[13px] font-bold text-slate-900">RM {Number(order.price || 0).toFixed(2)}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin size={14} className="text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-semibold text-slate-400 uppercase">Handover Node</p>
                          <p className="text-[12px] font-medium text-slate-900 mt-0.5">{order.drop_off_location || 'Campus Delivery'}</p>
                        </div>
                      </div>
                      {order.runner_id && (
                        <div className="flex items-start gap-3">
                          <User size={14} className="text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-semibold text-slate-400 uppercase">Runner</p>
                            <p className="text-[12px] font-medium text-slate-900 mt-0.5">{runnerData?.full_name || order.runner_name || 'Assigned Runner'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Section 4: Evidence Photos */}
                  <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera size={16} className="text-slate-400" />
                      <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">Evidence Photos</h3>
                    </div>
                    {evidence.length === 0 ? (
                      <p className="text-[12px] italic text-slate-400">No photos yet.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {evidence.map(ev => (
                          <div key={ev.id} className="space-y-1.5">
                            <div className="aspect-square rounded-lg bg-slate-50 border border-slate-100 overflow-hidden">
                              <img src={ev.url} alt="Evidence" className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[10px] font-bold text-center text-slate-600 uppercase">
                              {ev.type === 'PICKUP' ? 'Pickup Photo' : ev.type === 'DELIVERY' ? 'Delivery Confirmation' : 'Evidence'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Section 5: Order Timeline */}
                  <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock size={16} className="text-slate-400" />
                      <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">Timeline</h3>
                    </div>
                    <div className="pl-2 space-y-6 border-l-2 border-slate-100 relative left-2">
                      {[
                        { label: 'Order Created', time: order.created_at, active: true },
                        { label: 'Payment Confirmed', time: order.created_at, active: ['PAID', 'PREPARING', 'READY', 'READY_FOR_PICKUP', 'PENDING_RUNNER', 'RUNNER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'DELIVERED', 'COMPLETED'].includes(order.status) },
                        { label: 'Preparing', time: order.prepared_at, active: !!order.prepared_at || ['READY', 'READY_FOR_PICKUP', 'PENDING_RUNNER', 'RUNNER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'DELIVERED', 'COMPLETED'].includes(order.status) },
                        { label: 'Ready for Pickup', time: order.ready_at, active: !!order.ready_at || ['READY', 'READY_FOR_PICKUP', 'PENDING_RUNNER', 'RUNNER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'DELIVERED', 'COMPLETED'].includes(order.status) },
                        { label: 'Runner Assigned', subLabel: order.runner_name, time: order.runner_assigned_at, active: !!order.runner_id || ['RUNNER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'DELIVERED', 'COMPLETED'].includes(order.status) },
                        { label: 'Item Picked Up', time: order.picked_up_at, active: !!order.picked_up_at || ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'DELIVERED', 'COMPLETED'].includes(order.status) },
                        { label: 'Delivered', time: order.delivered_at, active: ['DELIVERED', 'COMPLETED'].includes(order.status) }
                      ].filter(step => step.active).map((step, i, arr) => (
                        <div key={step.label} className="relative pl-6">
                          <div className={`absolute -left-[25px] top-0.5 w-4 h-4 rounded-full border-4 border-white ${i === arr.length - 1 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          <p className={`text-[12px] font-bold ${i === arr.length - 1 ? 'text-slate-900' : 'text-slate-500'}`}>{step.label}</p>
                          {step.subLabel && <p className="text-[10px] font-medium text-slate-400 mt-0.5">{step.subLabel}</p>}
                          {step.time && (
                            <p className="text-[10px] font-semibold text-slate-400 mt-1">
                              {step.time?.toDate ? step.time.toDate().toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : new Date(step.time).toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
