'use client'
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  ChevronLeft, Truck, Plus, Package, Check, Globe, Users,
  ArrowRight, ShieldCheck, CheckCircle2, Lock, ShieldAlert
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { motion, AnimatePresence } from 'framer-motion';

import { placeSingleOrder } from '@/app/actions/orderActions';

import { CAMPUS_NODES, LocationNode, getLocationBadge } from '@/lib/core/locations';

const FPX_BANKS = [
// ...
  { id: 'maybank', label: 'Maybank2u',  logo: 'https://raw.githubusercontent.com/iyadmohmad/pulse-assets/main/banks/maybank.png' },
  { id: 'cimb',    label: 'CIMB Clicks', logo: 'https://raw.githubusercontent.com/iyadmohmad/pulse-assets/main/banks/cimb.png' },
  { id: 'rhb',     label: 'RHB Now',     logo: 'https://raw.githubusercontent.com/iyadmohmad/pulse-assets/main/banks/rhb.png' },
  { id: 'hlb',     label: 'Hong Leong',  logo: 'https://raw.githubusercontent.com/iyadmohmad/pulse-assets/main/banks/hlb.png' },
  { id: 'pbb',     label: 'Public Bank', logo: 'https://raw.githubusercontent.com/iyadmohmad/pulse-assets/main/banks/publicbank.png' },
  { id: 'ambank',  label: 'AmOnline',    logo: 'https://raw.githubusercontent.com/iyadmohmad/pulse-assets/main/banks/ambank.png' },
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
  const [roomNumber, setRoomNumber] = useState('');
  const [qty,      setQty]      = useState(1);

  // Step 2  Payment
  const [paymentMethod, setPaymentMethod] = useState<'FPX' | 'TNG'>('FPX');
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [payStatus,    setPayStatus]    = useState<PayStatus>('idle');

  const [errorState,    setErrorState]    = useState<null | 'INSUFFICIENT_STOCK' | 'PAYMENT_FAILED'>(null);

  //  Services delivery 
  const [serviceMethod, setServiceMethod] = useState<'DIGITAL' | 'F2F_CAMPUS' | null>(null);
  const [serviceContactInfo, setServiceContactInfo] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'items', id as string));
        if (snap.exists()) {
          const data = snap.data();
          console.log('[Checkout] raw item data:', JSON.stringify(data, null, 2));
          setItem({ id: snap.id, ...data });
          setLocation(CAMPUS_NODES[0].token);
          //  Pulse Reset: If item is sold out, we shouldn't even be here
          if (data.stock_count !== undefined && data.stock_count !== null && data.stock_count <= 0) {
            router.push(`/marketplace/${id}`);
          }
          if (data.fulfillment_mode === 'MEETUP_ONLY') {
            setChoice('SELF_COLLECT');
          }
        }
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [id, router]);

  //  Derived 
  const selectedNode = CAMPUS_NODES.find(n => n.token === location) || CAMPUS_NODES[0];
  const isPremium    = selectedNode.tier === 'PREMIUM';
  const runnerFee    = selectedNode.fee;
  const itemPrice    = Number(item?.price) || 0;
  const isService    = item?.category?.toUpperCase() === 'SERVICES';
  const total        = (itemPrice * qty) + (isService ? 0 : (choice === 'RUNNER' ? runnerFee : 0));

  const canProceedStep1 = isService
    ? !!serviceMethod && (serviceMethod === 'F2F_CAMPUS' || !!serviceContactInfo)
    : !!choice && (choice === 'SELF_COLLECT' || (!!location && (!isPremium || !!roomNumber)));
  const canPay          = (paymentMethod === 'TNG' || (paymentMethod === 'FPX' && !!selectedBank)) && payStatus === 'idle' && !errorState;

  //  Pay 
  const handlePay = async () => {
    if (!auth.currentUser || !canPay) return;

    //  Pre-Payment Guard
    if (item.stock_count !== undefined && item.stock_count !== null && item.stock_count < qty) {
      setErrorState('INSUFFICIENT_STOCK');
      return;
    }

    setPayStatus('processing');
    await new Promise(r => setTimeout(r, 2500));
    try {
      const dropOffStr = isService
        ? (serviceMethod === 'F2F_CAMPUS' ? location : '')
        : (choice === 'RUNNER' 
          ? (isPremium ? `RAH-DOOR-${roomNumber}` : selectedNode.token) 
          : (item.handover_node || 'MIIT-G-LOBBY'));

      const result = await placeSingleOrder({
        itemId: id as string,
        qty: qty,
        choice: isService ? 'SELF_COLLECT' : choice!,
        dropOffStr: dropOffStr,
        itemPrice: itemPrice,
        total: total,
        buyerId: auth.currentUser!.uid,
        buyerName: auth.currentUser!.displayName || 'Student',
        image_url: itemImage,
        deliveryMethod: isService ? serviceMethod! : undefined,
        serviceContactInfo: isService ? serviceContactInfo : undefined,
      });

      if (!result.success) {
        throw new Error(result.message || 'TRANSACTION_FAILED');
      }

      setPayStatus('done');
      await new Promise(r => setTimeout(r, 1600));
      router.replace(`/orders/success?id=${result.parentId}`);
    } catch (e: any) {
      console.error('[FPX Pay]', e);
      setPayStatus('idle');
      
      if (e.message === 'SOLD_OUT') {
        setErrorState('INSUFFICIENT_STOCK');
      } else {
        setErrorState('PAYMENT_FAILED');
        console.error('[FPX Pay] Unexpected failure:', e.message);
      }
    }
  };

  if (pageLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-slate-400 rounded-full animate-spin" />
    </div>
  );
  if (!item) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[11px] font-bold  text-[#94a3b8]">Item not found</p>
    </div>
  );

  const itemImage = item.images?.[0] || item.image_url || '';

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">

      {/*  ERROR OVERLAYS  */}
      <AnimatePresence>
        {errorState && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 bg-white flex flex-col items-center justify-center px-10 text-center"
          >
            <div className={`w-16 h-16 ${errorState === 'INSUFFICIENT_STOCK' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'} border rounded-2xl flex items-center justify-center mb-6`}>
              {errorState === 'INSUFFICIENT_STOCK' ? <Lock size={32} className="text-red-500" /> : <ShieldAlert size={32} className="text-slate-400" />}
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight mb-2">
              {errorState === 'INSUFFICIENT_STOCK' ? 'Insufficient Stock' : 'Checkout Failed'}
            </h2>
            <p className="text-[13px] font-medium text-[#94a3b8] leading-relaxed mb-8">
              {errorState === 'INSUFFICIENT_STOCK' 
                ? "Someone just bought the last remaining units while you were in checkout. We have not charged your account."
                : "Something went wrong while processing your order. Please try again or contact support if the issue persists."}
            </p>
            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={() => {
                  if (errorState === 'INSUFFICIENT_STOCK') router.push(`/marketplace/${id}`);
                  else setErrorState(null);
                }}
                className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-[14px] active:scale-95 transition-all"
              >
                {errorState === 'INSUFFICIENT_STOCK' ? 'Return to Item' : 'Try Again'}
              </button>
              {errorState === 'PAYMENT_FAILED' && (
                <button 
                  onClick={() => router.push(`/marketplace/${id}`)}
                  className="w-full h-12 bg-white border border-slate-200 text-slate-900 rounded-xl font-bold text-[14px] active:scale-95 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <span className="text-slate-900 font-semibold text-[13px] tracking-widest">FPX</span>
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-[15px] font-bold text-slate-900 tracking-tight">Connecting to bank...</p>
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
                <p className="text-[10px] font-medium text-slate-300 ">Do not close this page</p>
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
                  <p className="text-[16px] font-bold text-slate-900 tracking-tight">Payment Successful</p>
                  <p className="text-[12px] font-medium text-[#94a3b8]">RM {total.toFixed(2)} via FPX</p>
                </div>
                <p className="text-[10px] font-medium text-slate-300 ">Placing your order...</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/*  NAV  */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <BackButton fallback="/marketplace" />
          <div>
            <p className="text-[14px] font-bold tracking-tight">Checkout</p>
            <p className="text-[11px] font-medium text-[#94a3b8]">
              {step === 1 ? 'Step 1 of 2  Delivery' : 'Step 2 of 2  Payment'}
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

        {/*  ITEM SUMMARY  */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0">
            {itemImage
              ? <img src={itemImage} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full bg-slate-50" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-900 truncate">{item.title}</p>
            <p className="text-[11px] font-medium text-[#94a3b8]">RM {itemPrice.toFixed(2)} per unit</p>
          </div>
          {/* Qty stepper */}
          <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-lg px-3 py-2 shrink-0">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-5 h-5 flex items-center justify-center text-[#94a3b8] active:scale-90 transition-all text-lg font-bold leading-none"></button>
            <span className="text-[13px] font-bold w-5 text-center">{qty}</span>
            <button 
              onClick={() => setQty(q => q + 1)} 
              disabled={qty >= (item?.stock_count || 99)}
              className="w-5 h-5 flex items-center justify-center active:scale-90 transition-all disabled:opacity-20"
            >
              <Plus size={14} className="text-[#94a3b8]" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/*  STEP 1: DELIVERY  */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">How do you want it?</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Choose your preferred delivery method.</p>
              </div>

              {isService ? (
                <div className="space-y-3">
                  {/* Digital / Online */}
                  <button
                    onClick={() => setServiceMethod(serviceMethod === 'DIGITAL' ? null : 'DIGITAL')}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                      serviceMethod === 'DIGITAL'
                        ? 'bg-slate-50 border-slate-400'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-[#94a3b8]">
                        <Globe size={18} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 tracking-tight">Digital / Online</p>
                        <p className="text-[11px] font-medium text-[#94a3b8]">Receive via email or chat  Free</p>
                      </div>
                    </div>
                    {serviceMethod === 'DIGITAL' && (
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} className="text-slate-900" />
                      </div>
                    )}
                  </button>

                  {serviceMethod === 'DIGITAL' && (
                    <div className="px-1">
                      <label className="text-[11px] font-bold text-slate-900 mb-1 block">Your contact info for delivery</label>
                      <input
                        type="text"
                        placeholder="e.g. Student ID, email, or phone number"
                        value={serviceContactInfo}
                        onChange={(e) => setServiceContactInfo(e.target.value)}
                        maxLength={200}
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-[13px] font-semibold text-slate-900 focus:outline-none focus:border-slate-400 placeholder:text-[#94a3b8]"
                      />
                    </div>
                  )}

                  {/* F2F Campus Session */}
                  <button
                    onClick={() => setServiceMethod(serviceMethod === 'F2F_CAMPUS' ? null : 'F2F_CAMPUS')}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                      serviceMethod === 'F2F_CAMPUS'
                        ? 'bg-slate-50 border-slate-400'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-[#94a3b8]">
                        <Users size={18} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 tracking-tight">F2F Campus Session</p>
                        <p className="text-[11px] font-medium text-[#94a3b8]">Meet on campus for the service  Free</p>
                      </div>
                    </div>
                    {serviceMethod === 'F2F_CAMPUS' && (
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} className="text-slate-900" />
                      </div>
                    )}
                  </button>

                  {serviceMethod === 'F2F_CAMPUS' && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-medium text-[#94a3b8] px-1">Select your preferred campus location</p>
                      {CAMPUS_NODES.map((node) => (
                        <button
                          key={node.token}
                          onClick={() => { setLocation(node.token); setRoomNumber(''); }}
                          className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                            location === node.token
                              ? 'bg-slate-50 border-slate-300'
                              : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getLocationBadge(node.zone)}`}>
                                {node.zone}
                              </span>
                              <p className="text-[13px] font-bold text-slate-900">{node.label}</p>
                            </div>
                            <p className="text-[11px] font-medium text-[#94a3b8]">{node.tier === 'PREMIUM' ? 'Residential area' : 'Common area'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
              <div className="space-y-3">
                {/* Self Collect */}
                <div className="space-y-2">
                  <button
                    onClick={() => setChoice(choice === 'SELF_COLLECT' ? null : 'SELF_COLLECT')}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
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
                        <p className="text-[13px] font-bold text-slate-900 tracking-tight">Self Collect</p>
                        <p className="text-[11px] font-medium text-[#94a3b8]">Meet the seller on campus  Free</p>
                      </div>
                    </div>
                    {choice === 'SELF_COLLECT' && (
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} className="text-slate-900" />
                      </div>
                    )}
                  </button>

                  {/* Self Collect Details */}
                  <AnimatePresence>
                    {choice === 'SELF_COLLECT' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }} className="overflow-hidden"
                      >
                        <div className="pt-2 px-1">
                           <p className="text-[11px] font-bold text-slate-900 mb-1">Meetup Location</p>
                           <p className="text-[11px] font-medium text-[#94a3b8]">The seller has locked in this exact meetup point.</p>
                           <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
                              {(() => {
                                 const token = item?.handover_node || 'MIIT-G-LOBBY';
                                 const node = CAMPUS_NODES.find(n => n.token === token);
                                 return node ? (
                                    <>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getLocationBadge(node.zone)}`}>{node.zone}</span>
                                      <span className="text-[13px] font-bold text-slate-900">{node.label}</span>
                                    </>
                                 ) : (
                                    <span className="text-[13px] font-bold text-slate-900">{token}</span>
                                 );
                              })()}
                           </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Pulse Runner */}
                {item?.fulfillment_mode !== 'MEETUP_ONLY' && (
                  <div className="space-y-2">
                    <button
                    onClick={() => setChoice(choice === 'RUNNER' ? null : 'RUNNER')}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
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
                        <p className="text-[13px] font-bold text-slate-900 tracking-tight">Pulse Runner</p>
                        <p className="text-[11px] font-medium text-[#94a3b8]">Delivered to your drop-off point</p>
                      </div>
                    </div>
                    {choice === 'RUNNER' && (
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} className="text-slate-900" />
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
                          {CAMPUS_NODES.map((node) => (
                            <div key={node.token} className="space-y-2">
                              <button
                                onClick={() => { setLocation(node.token); setRoomNumber(''); }}
                                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                                  location === node.token
                                    ? 'bg-slate-50 border-slate-300'
                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getLocationBadge(node.zone)}`}>
                                      {node.zone}
                                    </span>
                                    <p className="text-[13px] font-bold text-slate-900">{node.label}</p>
                                  </div>
                                  <p className="text-[11px] font-medium text-[#94a3b8]">{node.tier === 'PREMIUM' ? 'Requires resident access card' : 'Standard drop-off point'}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[13px] font-bold text-slate-900">RM {node.fee.toFixed(2)}</p>
                                  <p className="text-[10px] font-medium text-[#94a3b8] ">{node.tier}</p>
                                </div>
                              </button>
                              
                              {/* Premium Room Entry Box */}
                              {location === node.token && node.tier === 'PREMIUM' && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                  className="px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl"
                                >
                                  <label className="text-[11px] font-bold text-indigo-900 mb-1 block">Room / Unit Number</label>
                                  <input 
                                    type="text"
                                    placeholder="e.g. 1204"
                                    value={roomNumber}
                                    onChange={(e) => setRoomNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                                    maxLength={8}
                                    className="w-full h-10 px-3 rounded-lg border border-indigo-200 bg-white text-[13px] font-bold text-slate-900 focus:outline-none focus:border-indigo-400 placeholder:text-indigo-200"
                                  />
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                )}
              </div>
              )}
            </motion.div>
          )}

          {/*  STEP 2: PAYMENT  FPX  */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/*  Inline total  minimal, no dark card  */}
              <div className="flex items-center justify-between px-1 pt-1">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium text-[#94a3b8]">
                    {qty} item{qty > 1 ? 's' : ''}{isService ? '  Free delivery' : (choice === 'RUNNER' ? `  Runner RM${runnerFee.toFixed(2)}` : '')}
                  </p>
                  <p className="text-[22px] font-bold text-slate-900 tracking-tight leading-none">RM {total.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300 ">
                  <ShieldCheck size={11} />
                  Secured
                </div>
              </div>

              {/*  Section header  */}
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">How would you like to pay?</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Select your payment method below.</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden cursor-pointer" onClick={() => setPaymentMethod('FPX')}>
                {/* Method header */}
                <div className="flex items-center gap-4 px-4 py-4 border-b border-slate-100 bg-white">
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-[#0066CC] flex items-center justify-center font-bold text-white text-[11px]">FPX</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-slate-900">FPX Online Banking</p>
                    <p className="text-[11px] font-medium text-[#94a3b8]">Pay directly from your bank</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                    {paymentMethod === 'FPX' && <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
                  </div>
                </div>

                {/* Bank Grid */}
                <AnimatePresence>
                  {paymentMethod === 'FPX' && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-3 grid grid-cols-2 gap-2.5 bg-slate-50 border-t border-slate-100">
                        {FPX_BANKS.map(bank => (
                          <button
                            key={bank.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedBank(bank.id); }}
                            className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${
                              selectedBank === bank.id 
                                ? 'bg-white border-slate-900 shadow-[0_0_0_1px_#0f172a]' 
                                : 'bg-white border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'
                            }`}
                          >
                            {/* Checkmark icon if selected */}
                            {selectedBank === bank.id && (
                              <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-sm">
                                <Check size={10} strokeWidth={3} />
                              </div>
                            )}
                            
                            {/* Bank Logo / Icon */}
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 overflow-hidden">
                              {bank.id === 'maybank' && <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[11px] text-white tracking-tight" style={{background: '#F6A400'}}>MBB</div>}
                              {bank.id === 'cimb' && <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[11px] text-white tracking-tight" style={{background: '#C00'}}>CIMB</div>}
                              {bank.id === 'rhb' && <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[11px] text-white tracking-tight" style={{background: '#0066B3'}}>RHB</div>}
                              {bank.id === 'hlb' && <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[11px] text-white tracking-tight" style={{background: '#0055A0'}}>HLB</div>}
                              {bank.id === 'pbb' && <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[11px] text-white tracking-tight" style={{background: '#003087'}}>PBB</div>}
                              {bank.id === 'ambank' && <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[11px] text-white tracking-tight" style={{background: '#E31837'}}>AMB</div>}
                            </div>
                            
                            <span className={`text-[11px] font-bold text-center leading-tight ${
                              selectedBank === bank.id ? 'text-slate-900' : 'text-slate-400'
                            }`}>
                              {bank.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/*  TNG eWallet card  */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden cursor-pointer" onClick={() => setPaymentMethod('TNG')}>
                <div className="flex items-center gap-4 px-4 py-4 bg-white">
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-[11px]" style={{background: '#00AEEF'}}>TNG</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-slate-900">Touch 'n Go eWallet</p>
                    <p className="text-[11px] font-medium text-[#94a3b8]">Seamless and instant</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0">
                    {paymentMethod === 'TNG' && <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
                  </div>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/*  FOOTER CTA  */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-100">
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="w-full h-12 bg-white border border-slate-200 shadow-sm text-slate-900 hover:bg-slate-50 rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 active:scale-95 disabled:opacity-20 transition-all"
          >
            Continue to Payment <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handlePay}
            disabled={!canPay}
            className="w-full h-12 bg-white border border-slate-200 shadow-sm text-slate-900 hover:bg-slate-50 rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 active:scale-95 disabled:opacity-20 transition-all"
          >
            Pay RM {total.toFixed(2)} via {paymentMethod}
          </button>
        )}
      </footer>

    </main>
  );
}
