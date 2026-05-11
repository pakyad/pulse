'use client'
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth, functions, storage } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  ChevronLeft, Truck, Plus, Package, Check,
  QrCode, ArrowRight, ShieldCheck, CreditCard, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Campus Drop-Off Locations (unchanged logic) ──
const CAMPUS_HUBS: Record<string, any[]> = {
  'MIIT': [
    { id: 'k', label: 'Block K', sub: 'Main Lobby', zone: 'campus' },
    { id: 'n', label: 'Block N', sub: 'Ground Floor', zone: 'campus' },
    { id: 'lib', label: 'Library', sub: 'Level 1 entrance', zone: 'campus' },
    { id: 'hostel_a', label: 'Kolej MARA', sub: 'Outside campus', zone: 'off_campus' },
  ],
  'UBIS': [
    { id: 'ubis_l', label: 'UBIS Lobby', sub: 'Main Entrance', zone: 'campus' },
    { id: 'ubis_c', label: 'UBIS Cafe', sub: 'Level 1', zone: 'campus' },
  ],
  'BMI': [
    { id: 'bmi_m', label: 'BMI Main', sub: 'Security Post', zone: 'campus' },
    { id: 'bmi_h', label: 'BMI Hostel', sub: 'Block B', zone: 'off_campus' },
  ],
};

export default function CheckoutPage() {
  const { id } = useParams();
  const router = useRouter();

  // ── State ──
  const [item, setItem] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1 = Delivery, 2 = Payment

  const [choice, setChoice] = useState<'SELF_COLLECT' | 'RUNNER' | null>(null);
  const [location, setLocation] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // ── Load Item ──
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'items', id as string));
        if (snap.exists()) {
          const data = snap.data();
          setItem({ id: snap.id, ...data });
          const hubs = CAMPUS_HUBS[data.campus_id || 'MIIT'] || CAMPUS_HUBS['MIIT'];
          setLocation(hubs[0].id);
        }
      } catch (e) {
        console.error('[Checkout Load]', e);
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Derived Values ──
  const hubs = item ? (CAMPUS_HUBS[item.campus_id || 'MIIT'] || CAMPUS_HUBS['MIIT']) : [];
  const selectedSpot = hubs.find((s: any) => s.id === location) || hubs[0];
  const runnerFee = selectedSpot?.zone === 'campus' ? 3.50 : 5.00;
  const itemPrice = Number(item?.price) || 0;
  const total = (itemPrice * qty) + (choice === 'RUNNER' ? runnerFee : 0);

  // ── Step validation ──
  const canProceedStep1 = !!choice && (choice === 'SELF_COLLECT' || (choice === 'RUNNER' && !!location));
  const canProceedStep2 = !!receipt;

  // ── Place Order (Cloud Function — unchanged) ──
  const handlePlaceOrder = async () => {
    if (!auth.currentUser) { router.push('/auth'); return; }
    if (!receipt) { setError('Please upload your payment receipt first.'); return; }

    setPosting(true);
    setError(null);

    try {
      const receiptRef = ref(storage, `receipts/${Date.now()}_${receipt.name}`);
      const uploaded = await uploadBytes(receiptRef, receipt);
      const receiptUrl = await getDownloadURL(uploaded.ref);

      const placeOrder = httpsCallable(functions, 'placeOrder');
      const result: any = await placeOrder({
        userId: auth.currentUser.uid,
        cartItems: [{
          productId: id,
          title: item.title,
          price: item.price,
          qty,
          vendorId: item.seller_id,
          sellerName: item.seller_name
        }],
        deliveryType: choice,
        dropOffLocation: choice === 'RUNNER' ? `${selectedSpot.label} — ${selectedSpot.sub}` : undefined,
        receiptUrl
      });

      // ✅ Navigate to success page
      router.push(`/orders/success?id=${result.data.parentId}`);
    } catch (e: any) {
      console.error('[Checkout Failure]', e);
      setError(e.message || 'Something went wrong. Please try again.');
      setPosting(false);
    }
  };

  // ── Loading / Error States ──
  if (pageLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[#1e293b] rounded-full animate-spin" />
    </div>
  );
  if (!item) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Item not found</p>
    </div>
  );

  const itemImage = item.images?.[0] || item.image_url || '';

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-40">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => step === 2 ? setStep(1) : router.back()}
            className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-100 active:scale-95 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <p className="text-[14px] font-bold tracking-tight">Checkout</p>
            <p className="text-[11px] font-medium text-[#94a3b8]">
              {step === 1 ? 'Step 1 of 2 — Delivery' : 'Step 2 of 2 — Payment'}
            </p>
          </div>
        </div>
        {/* Step dots */}
        <div className="flex items-center gap-2">
          <div className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-6 bg-[#1e293b]' : 'w-6 bg-emerald-500'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step === 2 ? 'w-6 bg-[#1e293b]' : 'w-1.5 bg-slate-200'}`} />
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-8">

        {/* ── ITEM SUMMARY ── */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0">
            {itemImage ? <img src={itemImage} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-slate-100" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#1e293b] truncate">{item.title}</p>
            <p className="text-[11px] font-medium text-[#94a3b8]">RM {itemPrice.toFixed(2)} per unit</p>
          </div>
          {/* Qty stepper */}
          <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-lg px-3 py-2 shrink-0">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-5 h-5 flex items-center justify-center text-[#94a3b8] active:scale-90 transition-all"
            >
              <span className="text-[18px] leading-none font-bold">−</span>
            </button>
            <span className="text-[14px] font-bold w-5 text-center">{qty}</span>
            <button
              onClick={() => setQty(q => q + 1)}
              className="w-5 h-5 flex items-center justify-center text-[#94a3b8] active:scale-90 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ════ STEP 1: DELIVERY ════ */}
          {step === 1 && (
            <motion.div
              key="step-delivery"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">How do you want it?</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Choose your preferred delivery method.</p>
              </div>

              <div className="space-y-3">
                {/* Self Collect */}
                <button
                  onClick={() => setChoice('SELF_COLLECT')}
                  className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                    choice === 'SELF_COLLECT'
                      ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-sm'
                      : 'bg-white border-slate-100 text-[#1e293b] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${choice === 'SELF_COLLECT' ? 'bg-white/10' : 'bg-slate-50'}`}>
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold tracking-tight">Self Collect</p>
                      <p className={`text-[11px] font-medium ${choice === 'SELF_COLLECT' ? 'text-white/60' : 'text-[#94a3b8]'}`}>
                        Meet the seller on campus · Free
                      </p>
                    </div>
                  </div>
                  {choice === 'SELF_COLLECT' && <Check size={18} strokeWidth={2.5} />}
                </button>

                {/* Pulse Runner */}
                <div className="space-y-2">
                  <button
                    onClick={() => setChoice('RUNNER')}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                      choice === 'RUNNER'
                        ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-sm'
                        : 'bg-white border-slate-100 text-[#1e293b] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${choice === 'RUNNER' ? 'bg-white/10' : 'bg-slate-50'}`}>
                        <Truck size={18} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold tracking-tight">Pulse Runner</p>
                        <p className={`text-[11px] font-medium ${choice === 'RUNNER' ? 'text-white/60' : 'text-[#94a3b8]'}`}>
                          Delivered to your drop-off point
                        </p>
                      </div>
                    </div>
                    {choice === 'RUNNER' && <Check size={18} strokeWidth={2.5} />}
                  </button>

                  {/* Drop-off accordion */}
                  <AnimatePresence>
                    {choice === 'RUNNER' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-2">
                          <p className="text-[11px] font-medium text-[#94a3b8] px-1">Select your drop-off point</p>
                          {hubs.map((hub: any) => (
                            <button
                              key={hub.id}
                              onClick={() => setLocation(hub.id)}
                              className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                                location === hub.id
                                  ? 'bg-slate-50 border-[#1e293b]'
                                  : 'bg-white border-slate-100 hover:border-slate-200'
                              }`}
                            >
                              <div>
                                <p className="text-[13px] font-bold text-[#1e293b]">{hub.label}</p>
                                <p className="text-[11px] font-medium text-[#94a3b8]">{hub.sub}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-[13px] font-bold text-[#1e293b]">RM {hub.zone === 'campus' ? '3.50' : '5.00'}</p>
                                <p className="text-[10px] font-medium text-[#94a3b8]">{hub.zone === 'campus' ? 'on campus' : 'off campus'}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════ STEP 2: PAYMENT ════ */}
          {step === 2 && (
            <motion.div
              key="step-payment"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Price Breakdown (dark card) */}
              <div className="bg-[#1e293b] rounded-xl p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-white/60">Items ({qty})</span>
                  <span className="text-[13px] font-bold text-white">RM {(itemPrice * qty).toFixed(2)}</span>
                </div>
                {choice === 'RUNNER' && (
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-white/60">Runner Fee</span>
                    <span className="text-[13px] font-bold text-white">RM {runnerFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Payable</p>
                    <p className="text-[28px] font-bold text-white tracking-tighter leading-none">RM{total.toFixed(2)}</p>
                  </div>
                  <ShieldCheck size={22} className="text-white/20" />
                </div>
              </div>

              {/* QR Section */}
              <section className="space-y-4">
                <div className="space-y-0.5">
                  <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Scan & Pay</h2>
                  <p className="text-[11px] font-medium text-[#94a3b8]">Use any banking app to transfer to the seller.</p>
                </div>
                <div className="flex justify-center py-4">
                  <div className="w-48 h-48 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                    <QrCode size={130} className="text-[#1e293b] opacity-80" />
                  </div>
                </div>
              </section>

              {/* Receipt Upload */}
              <section className="space-y-3">
                <div className="space-y-0.5">
                  <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Upload Receipt</h2>
                  <p className="text-[11px] font-medium text-[#94a3b8]">Screenshot of your successful transfer.</p>
                </div>
                <label className={`w-full h-28 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  receipt ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                }`}>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    setReceipt(e.target.files?.[0] || null);
                    setError(null);
                  }} />
                  {receipt ? (
                    <>
                      <div className="w-9 h-9 bg-emerald-100 text-emerald-500 rounded-xl flex items-center justify-center">
                        <Check size={18} strokeWidth={2.5} />
                      </div>
                      <p className="text-[12px] font-bold text-emerald-600 px-4 text-center truncate max-w-full">{receipt.name}</p>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Receipt Ready</p>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center">
                        <CreditCard size={16} className="text-[#94a3b8]" />
                      </div>
                      <p className="text-[12px] font-bold text-[#94a3b8]">Tap to upload proof</p>
                    </>
                  )}
                </label>
              </section>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-xl"
                  >
                    <p className="text-[12px] font-bold text-red-600 text-center">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── STICKY FOOTER CTA ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-100">
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="w-full h-12 bg-[#1e293b] text-white rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-30 transition-all"
          >
            Continue to Payment <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handlePlaceOrder}
            disabled={!canProceedStep2 || posting}
            className="w-full h-12 bg-[#1e293b] text-white rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-30 transition-all"
          >
            {posting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <><span>Place Order</span><Check size={16} strokeWidth={2.5} /></>
            )}
          </button>
        )}
      </footer>

    </main>
  );
}
