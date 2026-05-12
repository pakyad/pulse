'use client'
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth, functions } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  ChevronLeft, Truck, Plus, Package, Check,
  ArrowRight, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Campus Drop-Off Locations ──
const CAMPUS_HUBS: Record<string, any[]> = {
  'MIIT': [
    { id: 'k',        label: 'Block K',    sub: 'Main Lobby',       zone: 'campus' },
    { id: 'n',        label: 'Block N',    sub: 'Ground Floor',     zone: 'campus' },
    { id: 'lib',      label: 'Library',    sub: 'Level 1 entrance', zone: 'campus' },
    { id: 'hostel_a', label: 'Kolej MARA', sub: 'Outside campus',   zone: 'off_campus' },
  ],
  'UBIS': [
    { id: 'ubis_l', label: 'UBIS Lobby', sub: 'Main Entrance', zone: 'campus' },
    { id: 'ubis_c', label: 'UBIS Cafe',  sub: 'Level 1',       zone: 'campus' },
  ],
  'BMI': [
    { id: 'bmi_m', label: 'BMI Main',   sub: 'Security Post', zone: 'campus' },
    { id: 'bmi_h', label: 'BMI Hostel', sub: 'Block B',       zone: 'off_campus' },
  ],
};

const FPX_BANKS = [
  { id: 'maybank', label: 'Maybank2u' },
  { id: 'cimb',    label: 'CIMB Clicks' },
  { id: 'rhb',     label: 'RHB Now' },
  { id: 'hlb',     label: 'Hong Leong Connect' },
  { id: 'pbb',     label: 'Public Bank' },
  { id: 'ambank',  label: 'AmOnline' },
  { id: 'bsn',     label: 'BSN' },
  { id: 'affin',   label: 'Affin Online' },
];

type PayStatus = 'idle' | 'processing' | 'done';

export default function CheckoutPage() {
  const { id } = useParams();
  const router  = useRouter();

  const [item,        setItem]        = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [step,        setStep]        = useState<1 | 2>(1);

  // Step 1
  const [choice,   setChoice]   = useState<'SELF_COLLECT' | 'RUNNER' | null>(null);
  const [location, setLocation] = useState('');
  const [qty,      setQty]      = useState(1);

  // Step 2 — FPX
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [payStatus,    setPayStatus]    = useState<PayStatus>('idle');

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
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id]);

  // ── Derived ──
  const hubs         = item ? (CAMPUS_HUBS[item.campus_id || 'MIIT'] || CAMPUS_HUBS['MIIT']) : [];
  const selectedSpot = hubs.find((s: any) => s.id === location) || hubs[0];
  const runnerFee    = selectedSpot?.zone === 'campus' ? 3.50 : 5.00;
  const itemPrice    = Number(item?.price) || 0;
  const total        = (itemPrice * qty) + (choice === 'RUNNER' ? runnerFee : 0);

  const canProceedStep1 = !!choice && (choice === 'SELF_COLLECT' || !!location);
  const canPay          = !!selectedBank && payStatus === 'idle';

  // ── FPX Pay ──
  const handlePay = async () => {
    if (!auth.currentUser || !selectedBank) return;
    setPayStatus('processing');
    await new Promise(r => setTimeout(r, 2500));
    try {
      // Option B: Direct Firestore Write (Bypassing Cloud Functions for Demo)
      const { runTransaction, serverTimestamp, collection } = await import('firebase/firestore');
      const parentOrderId = `PULSE-${Date.now()}`;
      
      await runTransaction(db, async (transaction) => {
        // Decrement stock
        const itemRef = doc(db, 'items', id as string);
        const itemDoc = await transaction.get(itemRef);
        if (itemDoc.exists()) {
           const currentStock = itemDoc.data().stock_count || 0;
           transaction.update(itemRef, { stock_count: Math.max(0, currentStock - qty) });
        }

        // Sub-order
        const subOrderRef = doc(collection(db, 'orders'));
        const dropOffStr = choice === 'RUNNER' ? `${selectedSpot.label} — ${selectedSpot.sub}` : null;
        
        // 🏛️ Runner-First Protocol:
        // If RUNNER, it must go to the Radar first. If SELF_COLLECT, it goes to the Merchant to accept.
        const initialStatus = choice === 'RUNNER' ? 'PENDING_RUNNER' : 'PENDING_VENDOR';

        transaction.set(subOrderRef, {
          order_id: subOrderRef.id,
          parent_id: parentOrderId,
          buyer_id: auth.currentUser!.uid,
          seller_id: item.seller_id,
          seller_name: item.seller_name || 'Merchant',
          customer_name: auth.currentUser!.displayName || 'Student',
          title: item.title,
          price: itemPrice * qty,
          total: total,
          items: [{ productId: id, title: item.title, price: itemPrice, qty, vendorId: item.seller_id }],
          delivery_type: choice,
          drop_off_location: dropOffStr,
          status: initialStatus,
          handshake: {
            seller_confirmed: false,
            buyer_confirmed: false,
            seller_coords: null,
            buyer_coords: null,
            verification_type: 'PENDING'
          },
          created_at: serverTimestamp()
        });

        // Parent Order
        const parentRef = doc(db, 'parent_orders', parentOrderId);
        transaction.set(parentRef, {
          id: parentOrderId,
          buyer_id: auth.currentUser!.uid,
          total_price: total,
          item_count: 1,
          status: 'PAID',
          items_summary: item.title,
          created_at: serverTimestamp()
        });
      });

      setPayStatus('done');
      await new Promise(r => setTimeout(r, 1600));
      router.push(`/orders/success?id=${parentOrderId}`);
    } catch (e: any) {
      console.error('[FPX Pay]', e);
      setPayStatus('idle');
      alert("Order failed. Please try again.");
    }
  };

  if (pageLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-slate-400 rounded-full animate-spin" />
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

      {/* ════ PAYMENT PROCESSING OVERLAY ════ */}
      <AnimatePresence>
        {(payStatus === 'processing' || payStatus === 'done') && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 bg-white flex flex-col items-center justify-center px-10 gap-5"
          >
            {payStatus === 'processing' ? (
              <>
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                  <span className="text-[#1e293b] font-black text-[13px] tracking-widest">FPX</span>
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-[15px] font-bold text-[#1e293b] tracking-tight">Connecting to bank...</p>
                  <p className="text-[12px] font-medium text-[#94a3b8]">
                    {FPX_BANKS.find(b => b.id === selectedBank)?.label}
                  </p>
                </div>
                <div className="w-44 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-slate-400 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '90%' }}
                    transition={{ duration: 2.2, ease: 'easeInOut' }}
                  />
                </div>
                <p className="text-[10px] font-medium text-slate-300 uppercase tracking-widest">Do not close this page</p>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center"
                >
                  <CheckCircle2 size={32} className="text-emerald-500" strokeWidth={2} />
                </motion.div>
                <div className="space-y-1 text-center">
                  <p className="text-[16px] font-bold text-[#1e293b] tracking-tight">Payment Successful</p>
                  <p className="text-[12px] font-medium text-[#94a3b8]">RM {total.toFixed(2)} via FPX</p>
                </div>
                <p className="text-[10px] font-medium text-slate-300 uppercase tracking-widest">Placing your order...</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
          <div className={`h-1.5 rounded-full transition-all ${step === 1 ? 'w-6 bg-slate-300' : 'w-6 bg-emerald-400'}`} />
          <div className={`h-1.5 rounded-full transition-all ${step === 2 ? 'w-6 bg-slate-400' : 'w-1.5 bg-slate-100'}`} />
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-8">

        {/* ── ITEM SUMMARY ── */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0">
            {itemImage
              ? <img src={itemImage} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full bg-slate-50" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#1e293b] truncate">{item.title}</p>
            <p className="text-[11px] font-medium text-[#94a3b8]">RM {itemPrice.toFixed(2)} per unit</p>
          </div>
          {/* Qty stepper */}
          <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-lg px-3 py-2 shrink-0">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-5 h-5 flex items-center justify-center text-[#94a3b8] active:scale-90 transition-all text-lg font-bold leading-none">−</button>
            <span className="text-[13px] font-bold w-5 text-center">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="w-5 h-5 flex items-center justify-center active:scale-90 transition-all">
              <Plus size={14} className="text-[#94a3b8]" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ════ STEP 1: DELIVERY ════ */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
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
                      ? 'bg-slate-50 border-slate-400'
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-[#94a3b8]">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#1e293b] tracking-tight">Self Collect</p>
                      <p className="text-[11px] font-medium text-[#94a3b8]">Meet the seller on campus · Free</p>
                    </div>
                  </div>
                  {choice === 'SELF_COLLECT' && (
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <Check size={12} strokeWidth={3} className="text-[#1e293b]" />
                    </div>
                  )}
                </button>

                {/* Pulse Runner */}
                <div className="space-y-2">
                  <button
                    onClick={() => setChoice('RUNNER')}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                      choice === 'RUNNER'
                        ? 'bg-slate-50 border-slate-400'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-[#94a3b8]">
                        <Truck size={18} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#1e293b] tracking-tight">Pulse Runner</p>
                        <p className="text-[11px] font-medium text-[#94a3b8]">Delivered to your drop-off point</p>
                      </div>
                    </div>
                    {choice === 'RUNNER' && (
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} className="text-[#1e293b]" />
                      </div>
                    )}
                  </button>

                  <AnimatePresence>
                    {choice === 'RUNNER' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }} className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-2">
                          <p className="text-[11px] font-medium text-[#94a3b8] px-1">Select your drop-off point</p>
                          {hubs.map((hub: any) => (
                            <button
                              key={hub.id}
                              onClick={() => setLocation(hub.id)}
                              className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                                location === hub.id
                                  ? 'bg-slate-50 border-slate-300'
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

          {/* ════ STEP 2: PAYMENT — FPX ════ */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* ── Inline total — minimal, no dark card ── */}
              <div className="flex items-center justify-between px-1 pt-1">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium text-[#94a3b8]">
                    {qty} item{qty > 1 ? 's' : ''}{choice === 'RUNNER' ? ` · Runner RM${runnerFee.toFixed(2)}` : ''}
                  </p>
                  <p className="text-[22px] font-bold text-[#1e293b] tracking-tight leading-none">RM {total.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  <ShieldCheck size={11} />
                  Secured
                </div>
              </div>

              {/* ── Section header ── */}
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">How would you like to pay?</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Select your payment method below.</p>
              </div>

              {/* ── FPX card ── */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                {/* Method header */}
                <div className="flex items-center gap-4 px-4 py-4 border-b border-slate-100 bg-white">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-[#1e293b] font-black text-[11px] tracking-widest">FPX</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#1e293b]">FPX Online Banking</p>
                    <p className="text-[11px] font-medium text-[#94a3b8]">Pay directly from your bank</p>
                  </div>
                  {/* Radio — always selected */}
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  </div>
                </div>

                {/* Bank list */}
                <div className="divide-y divide-slate-100">
                  {FPX_BANKS.map(bank => (
                    <button
                      key={bank.id}
                      onClick={() => setSelectedBank(bank.id)}
                      className={`w-full flex items-center justify-between px-4 py-3.5 transition-all active:scale-[0.99] ${
                        selectedBank === bank.id ? 'bg-white' : 'hover:bg-white/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[10px] font-black tracking-wider shrink-0 transition-all ${
                          selectedBank === bank.id
                            ? 'bg-slate-100 border-slate-200 text-[#1e293b]'
                            : 'bg-white border-slate-100 text-[#94a3b8]'
                        }`}>
                          {bank.label.slice(0, 2).toUpperCase()}
                        </div>
                        <span className={`text-[13px] font-bold transition-colors ${
                          selectedBank === bank.id ? 'text-[#1e293b]' : 'text-[#94a3b8]'
                        }`}>
                          {bank.label}
                        </span>
                      </div>
                      {selectedBank === bank.id && (
                        <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                          <Check size={11} strokeWidth={3} className="text-emerald-500" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Security note */}
              <div className="flex items-center gap-1.5 justify-center">
                <ShieldCheck size={11} className="text-slate-200" />
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Demo mode · No real charges</p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FOOTER CTA ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-100">
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-20 transition-all"
          >
            Continue to Payment <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handlePay}
            disabled={!canPay}
            className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-20 transition-all"
          >
            Pay RM {total.toFixed(2)} via FPX
          </button>
        )}
      </footer>

    </main>
  );
}
