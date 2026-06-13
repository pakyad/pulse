"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useCart } from '@/lib/context/CartContext';
import {
  ChevronLeft, Truck, Package, Check, X,
  ArrowRight, ShieldCheck, CheckCircle2
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { motion, AnimatePresence } from 'framer-motion';

//  Campus Drop-Off Locations 
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
  { id: 'maybank',    label: 'Maybank2u',         logo: 'https://seeklogo.com/images/M/maybank-logo-72F7E91D24-seeklogo.com.png' },
  { id: 'cimb',       label: 'CIMB Clicks',        logo: 'https://seeklogo.com/images/C/cimb-bank-logo-2782A7D2C0-seeklogo.com.png' },
  { id: 'rhb',        label: 'RHB Now',            logo: 'https://seeklogo.com/images/R/rhb-bank-logo-18E29A7264-seeklogo.com.png' },
  { id: 'hlb',        label: 'Hong Leong Connect', logo: 'https://seeklogo.com/images/H/hong-leong-bank-logo-720C731776-seeklogo.com.png' },
  { id: 'pbb',        label: 'Public Bank',        logo: 'https://seeklogo.com/images/P/public-bank-logo-7704204D7F-seeklogo.com.png' },
  { id: 'ambank',     label: 'AmOnline',           logo: 'https://seeklogo.com/images/A/ambank-logo-A27E742A94-seeklogo.com.png' },
  { id: 'bsn',        label: 'BSN',                logo: 'https://seeklogo.com/images/B/bsn-logo-B1389D6613-seeklogo.com.png' },
  { id: 'bank_islam', label: 'Bank Islam',         logo: 'https://seeklogo.com/images/B/bank-islam-logo-6677F67E3F-seeklogo.com.png' },
];

type PayStatus = 'idle' | 'processing' | 'done';

export default function CartCheckoutPage() {
  const router  = useRouter();
  const { cart, cartTotal, removeSelected } = useCart();
  const checkoutItems = cart.filter(i => i.selected);
  const checkoutTotal = checkoutItems.reduce((acc, i) => acc + (i.price * i.qty), 0);

  const [step, setStep]               = useState<1 | 2>(1);
  const [preferences, setPreferences] = useState<Record<string, { type: 'RUNNER' | 'SELF_COLLECT', location: string, floor?: string, room?: string }>>({});
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [payStatus,    setPayStatus]    = useState<PayStatus>('idle');
  const [orderError,   setOrderError]   = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Initialize delivery preference from each cart item's stored deliveryType
  useEffect(() => {
    if (checkoutItems.length > 0 && Object.keys(preferences).length === 0) {
      const initial: any = {};
      checkoutItems.forEach(item => {
        initial[item.productId] = { type: item.deliveryType || 'SELF_COLLECT', location: 'k' };
      });
      setPreferences(initial);
    }
  }, [checkoutItems]);

  // If cart empties outside of a payment flow, show message then redirect
  useEffect(() => {
    if (checkoutItems.length === 0 && payStatus === 'idle') {
      setIsRedirecting(true);
      const t = setTimeout(() => router.push('/marketplace'), 1500);
      return () => clearTimeout(t);
    }
  }, [checkoutItems, router, payStatus]);

  const hubs = CAMPUS_HUBS['MIIT'];

  const calculateTotal = () => {
    let runnerFees = 0;
    checkoutItems.forEach(item => {
      const pref = preferences[item.productId];
      if (pref?.type === 'RUNNER') {
        const hub = hubs.find(h => h.id === pref.location) || hubs[0];
        runnerFees += (hub.zone === 'campus' ? 3.50 : 5.00);
      }
    });
    return checkoutTotal + runnerFees + platformFee;
  };

  const platformFee  = 1.50;
  const total           = calculateTotal() + platformFee;
  const canProceedStep1 = checkoutItems.length > 0 && Object.keys(preferences).length === checkoutItems.length;
  const canPay          = !!selectedBank && payStatus === 'idle';

  const handlePay = async () => {
    if (!auth.currentUser || !selectedBank) return;
    setPayStatus('processing');

    try {
      const placeOrder = httpsCallable(functions, 'placeOrder');

      const itemsWithPrefs = checkoutItems.map(item => {
        const pref = preferences[item.productId];
        const hub = hubs.find(h => h.id === pref.location) || hubs[0];
        return {
          ...item,
          deliveryType: pref.type,
          dropOffLocation: pref.type === 'RUNNER' ? `${hub.label}  ${hub.sub}` : null,
          floorLevel: pref.floor || null,
          roomNumber: pref.room || null
        };
      });

      const result = await placeOrder({
        cartItems: itemsWithPrefs,
        deliveryType: 'MULTI_DISPATCH',
        receiptUrl: 'https://pulse.edu/demo-receipt.pdf',
        platformFee: platformFee
      });

      const { parentId } = result.data as any;

      setPayStatus('done');
      removeSelected();
      await new Promise(r => setTimeout(r, 1600));
      router.push(`/orders/success?id=${parentId}`);
    } catch (e: any) {
      console.error('[Cart Checkout]', e);
      setPayStatus('idle');
      setOrderError(e.message || "Something went wrong. Please try again.");
    }
  };

  // Empty cart redirect screen
  if (isRedirecting) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
          <Package size={28} className="text-slate-300" />
        </div>
        <p className="text-[15px] font-bold text-slate-900 tracking-tight">Your bag is empty</p>
        <p className="text-[12px] font-medium text-slate-400">Taking you back to the marketplace...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">

      {/*  PAYMENT PROCESSING OVERLAY  */}
      <AnimatePresence>
        {(payStatus === 'processing' || payStatus === 'done') && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 bg-white flex flex-col items-center justify-center px-10 gap-5"
          >
            {payStatus === 'processing' ? (
              <>
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                  <div className="w-10 h-10 rounded-lg bg-[#0066CC] flex items-center justify-center font-bold text-white text-[11px]">FPX</div>
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-[15px] font-bold text-slate-900 tracking-tight">Almost there...</p>
                  <p className="text-[12px] font-medium text-[#94a3b8]">Sending your orders to shops</p>
                </div>
                <div className="w-44 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-slate-900 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '90%' }}
                    transition={{ duration: 3, ease: 'easeInOut' }}
                  />
                </div>
                <p className="text-[10px] font-medium text-slate-300 ">Processing Payment</p>
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
                  <p className="text-[16px] font-bold text-slate-900 tracking-tight">Order Placed!</p>
                  <p className="text-[12px] font-medium text-[#94a3b8]">RM {total.toFixed(2)} paid successfully</p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/*  IN-UI ERROR TOAST  */}
      <AnimatePresence>
        {orderError && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-20 left-6 right-6 z-300 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl flex items-center justify-between shadow-md"
          >
            <p className="text-[12px] font-bold leading-tight">{orderError}</p>
            <button onClick={() => setOrderError(null)} className="w-6 h-6 flex items-center justify-center text-red-400 ml-3 shrink-0">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  NAV  */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <p className="text-[14px] font-bold tracking-tight">Cart Checkout</p>
            <p className="text-[11px] font-medium text-[#94a3b8]">
              {step === 1 ? 'Choose Delivery' : 'Select Bank'}
            </p>
          </div>
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-8">

        {/*  LOGISTICS SELECTION (STEP 1)  */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="space-y-1">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Delivery Method</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">How would you like to get your items?</p>
              </div>

              <div className="space-y-6">
                {checkoutItems.map((item) => {
                  const pref = preferences[item.productId] || { type: 'RUNNER', location: 'k' };
                  return (
                    <div key={item.productId} className="space-y-3 p-5 bg-white border border-slate-100 shadow-sm rounded-[24px]">
                       {/* Item Header */}
                       <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                          <div className="w-12 h-12 rounded-[16px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0 overflow-hidden">
                             {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={20} />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-[13px] font-bold text-slate-900 truncate">{item.title}</p>
                             <p className="text-[10px] font-semibold text-slate-300 ">RM {item.price.toFixed(2)}</p>
                          </div>
                       </div>

                       {/* Method Selection */}
                       <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setPreferences(prev => ({ ...prev, [item.productId]: { ...pref, type: 'SELF_COLLECT' } }))}
                            className={`h-12 rounded-[16px] border flex items-center justify-center gap-2 text-[13px] font-semibold transition-all active:scale-95 ${pref.type === 'SELF_COLLECT' ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                          >
                             <Package size={16} /> Self-Collect
                          </button>
                          <button
                            onClick={() => setPreferences(prev => ({ ...prev, [item.productId]: { ...pref, type: 'RUNNER' } }))}
                            className={`h-12 rounded-[16px] border flex items-center justify-center gap-2 text-[13px] font-semibold transition-all active:scale-95 ${pref.type === 'RUNNER' ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                          >
                             <Truck size={16} /> Runner
                          </button>
                       </div>

                       {/* Location Selection (If Runner) */}
                       {pref.type === 'RUNNER' && (
                          <div className="pt-2 space-y-2">
                             <p className="text-[10px] font-semibold text-slate-400  pl-1">Meeting Point</p>
                             <div className="grid grid-cols-2 gap-2">
                                {hubs.map(hub => (
                                   <button
                                      key={hub.id}
                                      onClick={() => setPreferences(prev => ({ ...prev, [item.productId]: { ...pref, location: hub.id } }))}
                                      className={`h-12 px-3 rounded-xl border text-left flex flex-col justify-center transition-all active:scale-95 ${pref.location === hub.id ? 'bg-white border-slate-400 ring-1 ring-slate-400' : 'bg-white/50 border-slate-200 opacity-60'}`}
                                   >
                                      <p className="text-[11px] font-bold text-slate-900 truncate">{hub.label}</p>
                                      <p className="text-[9px] font-medium text-[#94a3b8]">RM {hub.zone === 'campus' ? '3.50' : '5.00'}</p>
                                   </button>
                                ))}
                             </div>
                          </div>
                       )}

                       {/* Indoor Details */}
                       {pref.type === 'RUNNER' && (
                          <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                             <div className="flex items-center gap-2 px-1">
                                <p className="text-[10px] font-semibold text-slate-400 ">Inside Building (Optional)</p>
                                <div className="h-px flex-1 bg-slate-100" />
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                   <label className="text-[9px] font-semibold text-slate-300 uppercase tracking-tightest ml-1">Floor</label>
                                   <input
                                      type="text"
                                      placeholder="e.g. Lvl 4"
                                      value={pref.floor || ''}
                                      onChange={(e) => setPreferences(prev => ({ ...prev, [item.productId]: { ...pref, floor: e.target.value } }))}
                                      className="w-full h-11 px-4 bg-white border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/5 transition-all placeholder:text-slate-200"
                                   />
                                </div>
                                <div className="space-y-1.5">
                                   <label className="text-[9px] font-semibold text-slate-300 uppercase tracking-tightest ml-1">Room / Wing</label>
                                   <input
                                      type="text"
                                      placeholder="e.g. Lab 4.1"
                                      value={pref.room || ''}
                                      onChange={(e) => setPreferences(prev => ({ ...prev, [item.productId]: { ...pref, room: e.target.value } }))}
                                      className="w-full h-11 px-4 bg-white border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/5 transition-all placeholder:text-slate-200"
                                   />
                                </div>
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
                  <p className="text-[28px] font-semibold text-slate-900 tracking-tighter">RM {total.toFixed(2)}</p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold  flex items-center gap-1.5">
                   <ShieldCheck size={12} />
                   Secure
                </div>
              </div>

              <div className="px-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#94a3b8]">Subtotal ({checkoutItems.length} item{checkoutItems.length > 1 ? 's' : ''})</span>
                  <span className="text-[12px] font-bold text-slate-900">RM {cartTotal.toFixed(2)}</span>
                </div>
                {(() => {
                  const runnerTotal = total - cartTotal - platformFee;
                  return runnerTotal > 0 ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-[#94a3b8]">Runner Fees</span>
                      <span className="text-[12px] font-bold text-slate-900">RM {runnerTotal.toFixed(2)}</span>
                    </div>
                  ) : null;
                })()}
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#94a3b8]">Platform Fee</span>
                  <span className="text-[12px] font-bold text-slate-900">RM {platformFee.toFixed(2)}</span>
                </div>
                <div className="h-px bg-slate-100 my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-slate-900">Total</span>
                  <span className="text-[15px] font-bold text-slate-900">RM {total.toFixed(2)}</span>
                </div>
              </div>

               <div className="space-y-3">
                 {FPX_BANKS.map(bank => (
                   <button
                     key={bank.id}
                     onClick={() => setSelectedBank(bank.id)}
                     className={`w-full h-16 px-5 rounded-[20px] flex items-center justify-between border transition-all active:scale-95 ${
                       selectedBank === bank.id
                       ? 'bg-slate-50 border-slate-900 shadow-sm'
                       : 'bg-white border-slate-100 hover:bg-slate-50'
                     }`}
                   >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                            {bank.id === 'maybank' && <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[10px] text-white tracking-tight" style={{background: '#F6A400'}}>MBB</div>}
                            {bank.id === 'cimb' && <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[10px] text-white tracking-tight" style={{background: '#C00'}}>CIMB</div>}
                            {bank.id === 'rhb' && <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[10px] text-white tracking-tight" style={{background: '#0066B3'}}>RHB</div>}
                            {bank.id === 'hlb' && <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[10px] text-white tracking-tight" style={{background: '#0055A0'}}>HLB</div>}
                            {bank.id === 'pbb' && <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[10px] text-white tracking-tight" style={{background: '#003087'}}>PBB</div>}
                            {bank.id === 'ambank' && <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[10px] text-white tracking-tight" style={{background: '#E31837'}}>AMB</div>}
                            {bank.id === 'bsn' && <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[10px] text-white tracking-tight" style={{background: '#003087'}}>BSN</div>}
                            {bank.id === 'bank_islam' && <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[10px] text-white tracking-tight" style={{background: '#C00'}}>BIMB</div>}
                        </div>
                        <span className={`text-[13px] font-bold ${selectedBank === bank.id ? 'text-slate-900' : 'text-slate-400'}`}>
                           {bank.label}
                        </span>
                     </div>

                     <div className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all ${
                        selectedBank === bank.id ? 'border-slate-900 bg-slate-900' : 'border-slate-200 bg-white'
                     }`}>
                        {selectedBank === bank.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                     </div>
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
          className="w-full h-14 bg-slate-900 text-white rounded-[20px] font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-20 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
        >
          {step === 1 ? 'Review Payment' : `Pay RM ${total.toFixed(2)}`}
          <ArrowRight size={18} />
        </button>
      </footer>

    </main>
  );
}
