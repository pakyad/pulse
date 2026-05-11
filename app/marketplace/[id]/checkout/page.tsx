'use client'
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth, functions, storage } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  ChevronLeft, Truck, X, Plus, Package, Check, QrCode, ArrowRight, ShieldCheck, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Campus Drop-Off Locations ──
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
  
  const [item, setItem] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'DELIVERY' | 'PAYMENT'>('DELIVERY');
  
  // Checkout State
  const [choice, setChoice] = useState<'SELF_COLLECT' | 'RUNNER' | null>(null);
  const [location, setLocation] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      const docRef = doc(db, 'items', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setItem({ id: docSnap.id, ...data });
        // Set default location based on campus
        const hubs = CAMPUS_HUBS[data.campus_id || 'MIIT'] || CAMPUS_HUBS['MIIT'];
        setLocation(hubs[0].id);
      }
      setPageLoading(false);
    };
    fetchItem();
  }, [id]);

  const hubs = item ? (CAMPUS_HUBS[item.campus_id || 'MIIT'] || CAMPUS_HUBS['MIIT']) : [];
  const selectedSpot = hubs.find((s: any) => s.id === location) || hubs[0];
  const runnerFee = selectedSpot?.zone === 'campus' ? 3.50 : 5.00;
  const itemPrice = Number(item?.price) || 0;
  const total = (itemPrice * qty) + (choice === 'RUNNER' ? runnerFee : 0);

  const handlePlaceOrder = async () => {
    if (!auth.currentUser) return router.push('/auth');
    if (!receipt) return setError("Please upload your payment receipt");
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Upload Receipt
      const receiptRef = ref(storage, `receipts/${Date.now()}_${receipt.name}`);
      const uploadResult = await uploadBytes(receiptRef, receipt);
      const receiptUrl = await getDownloadURL(uploadResult.ref);

      // 2. Trigger Cloud Function
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
      
      router.push(`/orders/success?id=${result.data.parentId}`);
    } catch (e: any) {
      console.error("[Checkout Failure]:", e);
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" /></div>;
  if (!item) return <div className="min-h-screen bg-white flex items-center justify-center text-[12px] font-black uppercase tracking-widest text-slate-300">Listing Void</div>;

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">
      
      {/* ── HEADER ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-50 px-6 py-5 flex items-center gap-4">
        <button onClick={() => step === 'PAYMENT' ? setStep('DELIVERY') : router.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-[15px] font-bold tracking-tight">Checkout</h1>
          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Step {step === 'DELIVERY' ? '1 of 2' : '2 of 2'}</p>
        </div>
      </nav>

      <div className="pt-28 px-6 max-w-xl mx-auto space-y-12">
        
        <AnimatePresence mode="wait">
          {step === 'DELIVERY' ? (
            <motion.section 
              key="delivery"
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 10 }}
              className="space-y-10"
            >
              {/* Item Summary */}
              <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-[28px] border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 overflow-hidden shrink-0">
                  <img src={item.image_url} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[13px] font-bold text-slate-900 truncate">{item.title}</h4>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">RM {itemPrice.toFixed(2)} per unit</p>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] px-1">Quantity</p>
                <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[13px] font-bold">Number of items</p>
                  <div className="flex items-center gap-5 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1 text-slate-400 hover:text-slate-900"><X size={16} className="rotate-45" /></button>
                    <span className="text-[18px] font-black w-6 text-center">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="p-1 text-slate-400 hover:text-slate-900"><Plus size={16} /></button>
                  </div>
                </div>
              </div>

              {/* Delivery Choice */}
              <div className="space-y-4">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] px-1">Delivery Method</p>
                <div className="space-y-3">
                  {/* Option: Self Collection */}
                  <button
                    onClick={() => setChoice('SELF_COLLECT')}
                    className={`w-full p-5 rounded-3xl border text-left flex items-center justify-between transition-all ${
                      choice === 'SELF_COLLECT' ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white border-slate-100 text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Package size={22} />
                      <div>
                        <p className="text-[13px] font-black tracking-tight">Self Collection</p>
                        <p className={`text-[10px] font-medium opacity-60 uppercase tracking-widest`}>Meetup on campus</p>
                      </div>
                    </div>
                    {choice === 'SELF_COLLECT' && <Check size={20} strokeWidth={3} />}
                  </button>

                  {/* Option: Pulse Runner (Accordion) */}
                  <div className="space-y-3">
                    <button
                      onClick={() => setChoice('RUNNER')}
                      className={`w-full p-5 rounded-3xl border text-left flex items-center justify-between transition-all ${
                        choice === 'RUNNER' ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white border-slate-100 text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Truck size={22} />
                        <div>
                          <p className="text-[13px] font-black tracking-tight">Pulse Runner</p>
                          <p className={`text-[10px] font-medium opacity-60 uppercase tracking-widest`}>Delivered to you</p>
                        </div>
                      </div>
                      {choice === 'RUNNER' && <Check size={20} strokeWidth={3} />}
                    </button>

                    <AnimatePresence>
                      {choice === 'RUNNER' && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          className="overflow-hidden space-y-4"
                        >
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] px-1">Drop-off Point</p>
                          <div className="grid grid-cols-1 gap-2">
                            {hubs.map((hub: any) => (
                              <button
                                key={hub.id}
                                onClick={() => setLocation(hub.id)}
                                className={`p-5 rounded-[24px] border text-left transition-all flex items-center justify-between ${
                                  location === hub.id ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-sm' : 'bg-white border-slate-100 text-slate-500'
                                }`}
                              >
                                <div>
                                  <p className="text-[13px] font-bold tracking-tight">{hub.label}</p>
                                  <p className="text-[10px] font-medium opacity-60">{hub.sub}</p>
                                </div>
                                <p className="text-[12px] font-black">RM {hub.zone === 'campus' ? '3.50' : '5.00'}</p>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.section>
          ) : (
            <motion.section 
              key="payment"
              initial={{ opacity: 0, x: 10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -10 }}
              className="space-y-10"
            >
              {/* Price Breakdown */}
              <div className="p-8 bg-slate-900 text-white rounded-[40px] shadow-2xl shadow-slate-900/20 space-y-6">
                <div className="flex justify-between items-center text-[13px] font-medium opacity-60">
                   <span>Items ({qty})</span>
                   <span>RM {(itemPrice * qty).toFixed(2)}</span>
                </div>
                {choice === 'RUNNER' && (
                  <div className="flex justify-between items-center text-[13px] font-medium opacity-60">
                     <span>Delivery Fee</span>
                     <span>RM {runnerFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                   <div>
                     <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">Total Payable</p>
                     <p className="text-[24px] font-black tracking-tighter leading-none">RM{total.toFixed(2)}</p>
                   </div>
                   <ShieldCheck size={32} className="text-white/20" />
                </div>
              </div>

              {/* Payment Terminal */}
              <div className="flex flex-col items-center gap-8 py-4">
                <div className="w-56 h-56 bg-white p-6 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-3xl -z-10" />
                   <QrCode size={160} className="text-slate-900 opacity-90" />
                </div>
                <div className="text-center space-y-2">
                   <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Campus Payment</p>
                   <p className="text-[15px] font-bold text-slate-900">Scan QR to pay student vendor</p>
                </div>
              </div>

              {/* Receipt Upload */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] px-1">Proof of Payment</p>
                <label className="w-full h-32 rounded-[32px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all group">
                  <input type="file" className="hidden" onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
                  {receipt ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-1">
                        <Check size={20} strokeWidth={3} />
                      </div>
                      <span className="text-[13px] font-bold text-slate-900">{receipt.name.slice(0, 20)}...</span>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Receipt Logged</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CreditCard size={18} />
                      </div>
                      <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Upload Receipt</span>
                    </>
                  )}
                </label>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                   <p className="text-[12px] font-bold text-red-600 text-center">{error}</p>
                </motion.div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

      </div>

      {/* Footer Action */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-8 pb-12">
         <div className="max-w-xl mx-auto">
            <button 
              onClick={() => step === 'DELIVERY' ? setStep('PAYMENT') : handlePlaceOrder()} 
              disabled={!choice || (step === 'PAYMENT' && !receipt) || loading}
              className="w-full h-15 bg-slate-900 text-white rounded-[20px] font-bold text-[13px] flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 active:scale-95 disabled:opacity-20 transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" />
              ) : step === 'DELIVERY' ? (
                <>Next: Payment <ArrowRight size={18} /></>
              ) : (
                <>Place Order <Check size={18} strokeWidth={3} /></>
              )}
            </button>
         </div>
      </footer>

    </main>
  );
}
