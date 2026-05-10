'use client'
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth, functions, storage } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  ChevronLeft, ShieldCheck, Star,
  MessageSquare, Truck, X, Plus, Package, Clock, Share2, QrCode, Check, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Marzia Drop-Off Locations ──
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const TARGET_COORDS = { lat: 3.1587, lng: 101.7005 };
const MAX_DELIVERY_RADIUS_KM = 2.0;

function MarziaDeliverySheet({
  item, onConfirm, onClose, loading,
}: {
  item: any;
  onConfirm: (type: 'SELF_COLLECT' | 'RUNNER', location: string | undefined, receipt: File, qty: number) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const campus = item.campus_id || 'MIIT';
  const hubs = CAMPUS_HUBS[campus] || CAMPUS_HUBS['MIIT'];
  
  const [step, setStep] = useState<'FULFILLMENT' | 'PAYMENT'>('FULFILLMENT');
  const [choice, setChoice] = useState<'SELF_COLLECT' | 'RUNNER' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'QR' | 'TRANSFER'>('QR');
  const [location, setLocation] = useState(hubs[0].id);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [qty, setQty] = useState(1);

  const selectedSpot = hubs.find(s => s.id === location) || hubs[0];
  const runnerFee = selectedSpot.zone === 'campus' ? 3.50 : 5.00;
  const itemPrice = Number(item.price) || 0;
  const total = (itemPrice * qty) + (choice === 'RUNNER' ? runnerFee : 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-200 bg-slate-900/40 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white rounded-t-2xl overflow-y-auto max-h-[90vh] pb-10 shadow-2xl"
      >
        <div className="px-8 pt-8 pb-4">
          <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8" />
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-black text-slate-900 tracking-tight">
              {step === 'FULFILLMENT' ? 'Logistics' : 'Payment'}
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">
          {step === 'FULFILLMENT' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[14px] font-bold text-slate-900">Quantity</p>
                <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-2xl border border-slate-100">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-1 text-slate-400 hover:text-slate-900"><X size={14} className="rotate-45" /></button>
                  <span className="text-[16px] font-black w-4 text-center">{qty}</span>
                  <button onClick={() => setQty(qty + 1)} className="p-1 text-slate-400 hover:text-slate-900"><Plus size={14} /></button>
                </div>
              </div>

              <div className="space-y-3">
                {['SELF_COLLECT', 'RUNNER'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setChoice(type as any)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      choice === type ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20' : 'bg-white border-slate-100 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {type === 'SELF_COLLECT' ? <Package size={20} /> : <Truck size={20} />}
                      <div>
                        <p className="text-[15px] font-black tracking-tight">{type === 'SELF_COLLECT' ? 'Self Collection' : 'Pulse Runner'}</p>
                        <p className={`text-[11px] font-medium opacity-60 uppercase tracking-widest`}>
                          {type === 'SELF_COLLECT' ? 'Meetup Location' : 'Institutional Delivery'}
                        </p>
                      </div>
                    </div>
                    {choice === type && <Check size={18} strokeWidth={2.5} />}
                  </button>
                ))}
              </div>

              {choice === 'RUNNER' && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">Drop-off Hub</p>
                  <div className="grid grid-cols-2 gap-3">
                    {hubs.map((hub) => (
                      <button
                        key={hub.id}
                        onClick={() => setLocation(hub.id)}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          location === hub.id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-100 text-slate-600'
                        }`}
                      >
                        <p className="text-[14px] font-black tracking-tight">{hub.label}</p>
                        <p className="text-[10px] font-bold opacity-60 mt-0.5">RM {hub.zone === 'campus' ? '3.50' : '5.00'}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                 <div className="flex justify-between items-center text-[13px] font-bold text-slate-500">
                    <span>Order Total</span>
                    <span>RM {(itemPrice * qty).toFixed(2)}</span>
                 </div>
                 {choice === 'RUNNER' && (
                   <div className="flex justify-between items-center text-[13px] font-bold text-slate-500">
                      <span>Delivery Fee</span>
                      <span>RM {runnerFee.toFixed(2)}</span>
                   </div>
                 )}
                 <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Payable</span>
                    <span className="text-[20px] font-black text-slate-900 tracking-tighter">RM{total.toFixed(2)}</span>
                 </div>
               </div>

               <div className="flex flex-col items-center gap-6 py-4">
                 <div className="w-48 h-48 bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-center">
                    <QrCode size={120} className="text-slate-900 opacity-80" />
                 </div>
                 <div className="text-center space-y-1">
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Institutional Terminal</p>
                    <p className="text-[15px] font-bold text-slate-900">Scan to settle registry</p>
                 </div>
               </div>

               <div className="space-y-3">
                  <label className="w-full h-24 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all">
                    <input type="file" className="hidden" onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
                    {receipt ? (
                      <span className="text-[13px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                        <Check size={18} strokeWidth={2.5} /> Receipt Logged
                      </span>
                    ) : (
                      <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Upload Receipt</span>
                    )}
                  </label>
               </div>
            </div>
          )}

          <button
            onClick={() => {
              if (step === 'FULFILLMENT') setStep('PAYMENT');
              else onConfirm(choice!, choice === 'RUNNER' ? `${selectedSpot.label} — ${selectedSpot.sub}` : undefined, receipt!, qty);
            }}
            disabled={!choice || (step === 'PAYMENT' && !receipt) || loading}
            className="w-full h-14 bg-slate-900 text-white rounded-xl font-bold text-[14px] flex items-center justify-center gap-3 disabled:opacity-20 transition-all shadow-xl shadow-slate-900/10 mt-4"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" /> : step === 'FULFILLMENT' ? 'Continue' : 'Complete Handshake'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ItemDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showDeliverySheet, setShowDeliverySheet] = useState(false);
  const [errorToast, setErrorToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      const docRef = doc(db, 'items', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setItem({ id: docSnap.id, ...docSnap.data() });
      setPageLoading(false);
    };
    fetchItem();
  }, [id]);

  const handleConfirmOrder = async (deliveryType: 'SELF_COLLECT' | 'RUNNER', dropOffLocation: string | undefined, receipt: File, qty: number) => {
    if (!auth.currentUser) return router.push('/auth');
    setLoading(true);
    console.log("[Pulse Handshake] Initiating transaction...", { deliveryType, qty });
    
    try {
      // 1. Storage Handshake
      const receiptRef = ref(storage, `receipts/${Date.now()}_${receipt.name}`);
      const uploadResult = await uploadBytes(receiptRef, receipt);
      const receiptUrl = await getDownloadURL(uploadResult.ref);
      console.log("[Pulse Handshake] Receipt logged to Storage:", receiptUrl);
 
      // 2. Cloud Finalization
      const placeOrder = httpsCallable(functions, 'placeOrder');
      const result: any = await placeOrder({
        userId: auth.currentUser.uid,
        cartItems: [{ productId: id, title: item.title, price: item.price, qty, vendorId: item.seller_id, sellerName: item.seller_name }],
        deliveryType: deliveryType, // Match Cloud Function camelCase
        dropOffLocation, 
        receiptUrl
      });
      
      console.log("[Pulse Handshake] Transaction Sealed:", result.data);
      router.push(`/orders/success?id=${result.data.parentId}`);
    } catch (e: any) {
      console.error("[Pulse Handshake] FAILURE:", e);
      setErrorToast({ message: e.message || "Institutional Transaction Failed", type: 'error' });
      // Clear toast after 5s
      setTimeout(() => setErrorToast(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" /></div>;
  if (!item) return <div className="min-h-screen bg-white flex items-center justify-center text-[12px] font-black uppercase tracking-widest text-slate-300">Listing Void</div>;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-slate-100">
      {/* ── TOP NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-100 px-6 py-6 flex items-center justify-between pointer-events-none">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm pointer-events-auto active:scale-90 transition-all">
          <ChevronLeft size={18} />
        </button>
        <button className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm pointer-events-auto active:scale-90 transition-all">
          <Share2 size={16} />
        </button>
      </nav>

      {/* ── ERROR TOAST ── */}
      <AnimatePresence>
        {errorToast && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-24 left-6 right-6 z-200 p-4 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-900/20 flex items-center gap-3"
          >
             <X size={18} />
             <p className="text-[12px] font-black uppercase tracking-widest">{errorToast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-6 px-6 max-w-xl mx-auto pb-40 space-y-10">
        {/* ── IMAGE ── */}
        <section className="w-full aspect-square bg-slate-50 rounded-[28px] overflow-hidden border border-slate-100 shadow-sm relative">
          {item.image_url ? (
            <img src={item.image_url} className="w-full h-full object-cover" alt={item.title} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={64} /></div>
          )}
          <div className="absolute top-6 left-6">
             <div className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-slate-100">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.category || "General"}</p>
             </div>
          </div>
        </section>

        {/* ── CONTENT ── */}
        <main className="space-y-12">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                 {[1,2,3,4,5].map(i => <Star key={i} size={10} className="text-emerald-500 fill-emerald-500" />)}
                 <span className="text-[10px] font-bold text-slate-400 ml-1">12+ Sold</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">In Stock</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">{item.title}</h1>
              <div className="flex items-baseline gap-3">
                <span className="text-[24px] font-black text-slate-900 tracking-tighter">RM {Number(item.price).toFixed(0)}</span>
                <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-400 uppercase tracking-widest">Registry Node</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             {[
                { icon: Truck, title: 'Pulse Delivery', desc: 'Verified Runner' },
                { icon: Clock, title: 'Registry Lock', desc: '~24H Handoff' }
             ].map((badge, i) => (
                <div key={i} className="flex flex-col gap-4 p-5 bg-white border border-slate-100 rounded-[20px] shadow-xs">
                   <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><badge.icon size={18} /></div>
                   <div>
                      <p className="text-[14px] font-bold text-slate-900 tracking-tight">{badge.title}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{badge.desc}</p>
                   </div>
                </div>
             ))}
          </div>

          <div className="space-y-4">
            <div className="flex gap-8 border-b border-slate-100 text-[11px] font-bold uppercase tracking-[0.15em]">
               <span className="pb-3 border-b-2 border-slate-900 text-slate-900">Overview</span>
               <span className="pb-3 text-slate-300 cursor-not-allowed">Technical Details</span>
            </div>
            <p className="text-[14px] text-slate-500 leading-relaxed font-medium">
              {item.description || "Verified institutional asset listed on the Pulse network. High-fidelity handoff protocol enforced."}
            </p>
          </div>

          <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-xs">
                    {item.seller_photo ? (
                      <img src={item.seller_photo} className="w-full h-full object-cover" alt="Seller" />
                    ) : (
                      <span className="text-[16px] font-bold text-slate-200">{item.seller_name?.[0] || 'V'}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 tracking-tight leading-none">{item.seller_name || 'Verified Vendor'}</h3>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1.5">Official Merchant</p>
                </div>
             </div>
             <button className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 active:scale-95 transition-all"><MessageSquare size={18} /></button>
          </div>
        </main>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-100 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-6 pb-12">
         <div className="max-w-xl mx-auto">
            <button onClick={() => setShowDeliverySheet(true)} className="w-full h-15 bg-[#1e293b] text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 active:scale-95 transition-all">
              Initiate Handshake <ArrowUpRight size={18} strokeWidth={2.5} />
            </button>
         </div>
      </footer>

      <AnimatePresence>
        {showDeliverySheet && <MarziaDeliverySheet item={item} onConfirm={handleConfirmOrder} onClose={() => setShowDeliverySheet(false)} loading={loading} />}
      </AnimatePresence>
    </div>
  );
}
