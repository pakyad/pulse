"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useCart } from '@/lib/context/CartContext';
import {
  ChevronLeft, Truck, Package, Check,
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

export default function CartCheckoutPage() {
  const router  = useRouter();
  const { cart, cartTotal, clearCart } = useCart();

  const [step, setStep] = useState<1 | 2>(1);
  const [preferences, setPreferences] = useState<Record<string, { type: 'RUNNER' | 'SELF_COLLECT', location: string }>>({});
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [payStatus,    setPayStatus]    = useState<PayStatus>('idle');

  // Initialize preferences
  useEffect(() => {
    if (cart.length > 0 && Object.keys(preferences).length === 0) {
      const initial: any = {};
      cart.forEach(item => {
        initial[item.productId] = { type: 'RUNNER', location: 'k' };
      });
      setPreferences(initial);
    }
  }, [cart]);

  useEffect(() => {
    if (cart.length === 0 && payStatus === 'idle') {
      router.push('/marketplace');
    }
  }, [cart, router, payStatus]);

  const hubs = CAMPUS_HUBS['MIIT'];
  
  // Calculate total with individual fees
  const calculateTotal = () => {
    let runnerFees = 0;
    cart.forEach(item => {
      const pref = preferences[item.productId];
      if (pref?.type === 'RUNNER') {
        const hub = hubs.find(h => h.id === pref.location) || hubs[0];
        runnerFees += (hub.zone === 'campus' ? 3.50 : 5.00);
      }
    });
    return cartTotal + runnerFees;
  };

  const total = calculateTotal();
  const canProceedStep1 = cart.length > 0 && Object.keys(preferences).length === cart.length;
  const canPay          = !!selectedBank && payStatus === 'idle';

  const handlePay = async () => {
    if (!auth.currentUser || !selectedBank) return;
    setPayStatus('processing');

    try {
      const placeOrder = httpsCallable(functions, 'placeOrder');
      
      // Map cart items with their individual preferences for the backend
      const itemsWithPrefs = cart.map(item => {
        const pref = preferences[item.productId];
        const hub = hubs.find(h => h.id === pref.location) || hubs[0];
        return {
          ...item,
          deliveryType: pref.type,
          dropOffLocation: pref.type === 'RUNNER' ? `${hub.label} — ${hub.sub}` : null
        };
      });
      
      const result = await placeOrder({
        cartItems: itemsWithPrefs,
        // Global fallbacks for legacy support in cloud function
        deliveryType: 'MULTI_DISPATCH',
        receiptUrl: 'https://pulse.edu/demo-receipt.pdf'
      });

      const { parentId } = result.data as any;

      setPayStatus('done');
      clearCart();
      await new Promise(r => setTimeout(r, 1600));
      router.push(`/orders/success?id=${parentId}`);
    } catch (e: any) {
      console.error('[Cart Checkout]', e);
      setPayStatus('idle');
      alert("Order failed: " + (e.message || "Institutional connectivity error."));
    }
  };

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
                  <p className="text-[15px] font-bold text-[#1e293b] tracking-tight">Decomposing Cart...</p>
                  <p className="text-[12px] font-medium text-[#94a3b8]">Distributing items to vendors</p>
                </div>
                <div className="w-44 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-slate-900 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '90%' }}
                    transition={{ duration: 3, ease: 'easeInOut' }}
                  />
                </div>
                <p className="text-[10px] font-medium text-slate-300 uppercase tracking-widest">Atomic Transaction in Progress</p>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center"
                >
                  <CheckCircle2 size={32} className="text-white" strokeWidth={2} />
                </motion.div>
                <div className="space-y-1 text-center">
                  <p className="text-[16px] font-bold text-[#1e293b] tracking-tight">Mission Initiated</p>
                  <p className="text-[12px] font-medium text-[#94a3b8]">RM {total.toFixed(2)} distributed</p>
                </div>
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
            <p className="text-[14px] font-bold tracking-tight">Cart Checkout</p>
            <p className="text-[11px] font-medium text-[#94a3b8]">
              {step === 1 ? 'Logistics Selection' : 'Payment Handshake'}
            </p>
          </div>
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-8">

        {/* ── LOGISTICS SELECTION (STEP 1) ── */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Logistics Selection</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Choose delivery for each item in your mission.</p>
              </div>

              <div className="space-y-6">
                {cart.map((item) => {
                  const pref = preferences[item.productId] || { type: 'RUNNER', location: 'k' };
                  return (
                    <div key={item.productId} className="space-y-3 p-5 bg-slate-50 border border-slate-100 rounded-[28px]">
                       {/* Item Header */}
                       <div className="flex items-center gap-3 pb-3 border-b border-slate-200/50">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-200 shrink-0 overflow-hidden">
                             {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={18} />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-[13px] font-bold text-[#1e293b] truncate">{item.title}</p>
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">RM {item.price.toFixed(2)}</p>
                          </div>
                       </div>

                       {/* Method Selection */}
                       <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => setPreferences(prev => ({ ...prev, [item.productId]: { ...pref, type: 'SELF_COLLECT' } }))}
                            className={`h-11 rounded-xl border flex items-center justify-center gap-2 text-[12px] font-bold transition-all ${pref.type === 'SELF_COLLECT' ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-md shadow-slate-900/10' : 'bg-white border-slate-200 text-slate-400'}`}
                          >
                             <Package size={14} /> Self-Collect
                          </button>
                          <button 
                            onClick={() => setPreferences(prev => ({ ...prev, [item.productId]: { ...pref, type: 'RUNNER' } }))}
                            className={`h-11 rounded-xl border flex items-center justify-center gap-2 text-[12px] font-bold transition-all ${pref.type === 'RUNNER' ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-md shadow-slate-900/10' : 'bg-white border-slate-200 text-slate-400'}`}
                          >
                             <Truck size={14} /> Runner
                          </button>
                       </div>

                       {/* Location Selection (If Runner) */}
                       {pref.type === 'RUNNER' && (
                          <div className="pt-2 space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Drop-off Point</p>
                             <div className="grid grid-cols-2 gap-2">
                                {hubs.map(hub => (
                                   <button 
                                      key={hub.id}
                                      onClick={() => setPreferences(prev => ({ ...prev, [item.productId]: { ...pref, location: hub.id } }))}
                                      className={`h-12 px-3 rounded-xl border text-left flex flex-col justify-center transition-all ${pref.location === hub.id ? 'bg-white border-slate-400 ring-1 ring-slate-400' : 'bg-white/50 border-slate-200 opacity-60'}`}
                                   >
                                      <p className="text-[11px] font-bold text-[#1e293b] truncate">{hub.label}</p>
                                      <p className="text-[9px] font-medium text-[#94a3b8]">RM {hub.zone === 'campus' ? '3.50' : '5.00'}</p>
                                   </button>
                                ))}
                             </div>
                          </div>
                       )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between px-1">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium text-[#94a3b8]">Final Amount</p>
                  <p className="text-[28px] font-black text-[#1e293b] tracking-tighter">RM {total.toFixed(2)}</p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                   <ShieldCheck size={12} />
                   Secure
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {FPX_BANKS.map(bank => (
                  <button
                    key={bank.id}
                    onClick={() => setSelectedBank(bank.id)}
                    className={`w-full flex items-center justify-between px-5 py-4 transition-all ${
                      selectedBank === bank.id ? 'bg-white' : ''
                    }`}
                  >
                    <span className={`text-[14px] font-bold ${selectedBank === bank.id ? 'text-[#1e293b]' : 'text-[#94a3b8]'}`}>{bank.label}</span>
                    {selectedBank === bank.id && <CheckCircle2 size={18} className="text-emerald-500" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-100">
        <button
          onClick={() => step === 1 ? setStep(2) : handlePay()}
          disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canPay)}
          className="w-full h-14 bg-[#1e293b] text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 disabled:opacity-20 transition-all shadow-xl shadow-slate-900/10"
        >
          {step === 1 ? 'Review Payment' : `Pay RM ${total.toFixed(2)}`}
          <ArrowRight size={18} />
        </button>
      </footer>

    </main>
  );
}
