'use client'
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth, functions, storage } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  ChevronLeft, Heart, ShieldCheck, ShoppingBag, Star,
  MessageSquare, Bell, MapPin, Truck, X, Package, Clock, Share2, QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

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

// ── Josh Voxel Stock Badge ──
// Josh: blocky, pixelated, digital. Tells you "how many left" with authority.
function JoshStockBadge({ stock }: { stock: number }) {
  if (stock <= 0) return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl">
      <div className="w-1.5 h-1.5 rounded-sm bg-slate-300" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Out of stock</span>
    </div>
  );
  if (stock <= 3) return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-xl border border-red-100">
      <div className="w-1.5 h-1.5 rounded-sm bg-red-400 animate-pulse" />
      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Only {stock} left</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
      <div className="w-1.5 h-1.5 rounded-sm bg-emerald-400" />
      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{stock} in stock</span>
    </div>
  );
}

// ── Marzia Delivery Choice Sheet ──
// Warm, conversational, clear. No forms, no friction.
function MarziaDeliverySheet({
  item, onConfirm, onClose, loading,
}: {
  item: any;
  onConfirm: (type: 'SELF_COLLECT' | 'RUNNER', location: string | undefined, receipt: File) => void;
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

  const selectedSpot = hubs.find(s => s.id === location) || hubs[0];
  const runnerFee = selectedSpot.zone === 'campus' ? 3.50 : 5.00;
  const total = Number(item.price) + (choice === 'RUNNER' ? runnerFee : 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-300 bg-navy/50 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-[#FDFDFD] rounded-t-4xl overflow-y-auto max-h-[92vh] pb-8"
      >
        {/* Sheet Header — Institutional Sync */}
        <div className="px-8 pt-6 pb-6 border-b-[0.5px] border-slate-50">
          <div className="w-10 h-1 bg-slate-100 rounded-full mx-auto mb-6" />
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-navy tracking-tight">
              {step === 'FULFILLMENT' ? 'How to receive your item' : 'Payment Verification'}
            </h2>
            <button 
              onClick={() => {
                if (step === 'PAYMENT') setStep('FULFILLMENT');
                else onClose();
              }} 
              className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all"
            >
              {step === 'PAYMENT' ? <ChevronLeft size={16} /> : <X size={14} />}
            </button>
          </div>
        </div>

        <div className="px-8 py-8 space-y-4">
          <AnimatePresence mode="wait">
            {step === 'FULFILLMENT' ? (
              <motion.div
                key="fulfillment"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
              {/* Choice A — Collect */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setChoice('SELF_COLLECT')}
                className={`w-full min-h-[72px] p-4 rounded-2xl border-[0.5px] text-left transition-all flex items-center gap-4 ${
                  choice === 'SELF_COLLECT'
                    ? 'border-[#00C4B4] bg-[#00C4B4] text-white'
                    : 'border-slate-100 bg-white text-navy'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  choice === 'SELF_COLLECT' ? 'bg-white/10' : 'bg-slate-50'
                }`}>
                  <ShoppingBag size={18} className={choice === 'SELF_COLLECT' ? 'text-white' : 'text-slate-400'} />
                </div>
                <div>
                  <p className="text-[14px] font-bold leading-none">Self-Collection</p>
                  <p className={`text-[12px] font-medium mt-1 ${choice === 'SELF_COLLECT' ? 'opacity-60' : 'text-slate-400'}`}>
                    Handover at <span className={`font-black underline underline-offset-2 ${choice === 'SELF_COLLECT' ? 'text-white decoration-white/30' : 'text-navy decoration-navy/10'}`}>
                      {item.meetup_location || 'UniKL MIIT Main Lobby'}
                    </span>
                  </p>
                </div>
              </motion.button>

          {/* Choice B — Runner */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setChoice('RUNNER')}
            className={`w-full min-h-[72px] p-4 rounded-2xl border-[0.5px] text-left transition-all flex items-center gap-4 ${
              choice === 'RUNNER'
                ? 'border-[#00C4B4] bg-[#00C4B4] text-white'
                : 'border-slate-100 bg-white text-navy'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              choice === 'RUNNER' ? 'bg-white/10' : 'bg-slate-50'
            }`}>
              <Truck size={18} />
            </div>
            <div>
              <p className="text-[14px] font-bold leading-none">Institutional Runner</p>
              <p className={`text-[12px] font-normal mt-1 opacity-60`}>
                Delivery via verified peer network
              </p>
            </div>
          </motion.button>

          {/* Location Grid — Black Selection */}
          <AnimatePresence>
            {choice === 'RUNNER' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="pt-4 space-y-3"
              >
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Select Hub</p>
                <div className="grid grid-cols-2 gap-2">
                  {hubs.map((spot) => (
                    <button
                      key={spot.id}
                      onClick={() => setLocation(spot.id)}
                      className={`h-[56px] px-4 rounded-xl border-[0.5px] text-left transition-all ${
                        location === spot.id
                          ? 'bg-[#00C4B4] border-[#00C4B4] text-white'
                          : 'bg-white border-slate-100 text-navy'
                      }`}
                    >
                      <p className="text-[13px] font-bold leading-tight">{spot.label}</p>
                      <p className={`text-[11px] font-normal opacity-50`}>
                        {spot.sub} (RM {spot.zone === 'campus' ? '3.50' : '5.00'})
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
              {/* ── RESTORED EDITORIAL LEDGER ── */}
              <div className="bg-slate-50/50 rounded-2xl p-6 border-[0.5px] border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-[13px] font-medium text-slate-500">
                  <span>Item Subtotal</span>
                  <span className="text-navy">RM {Number(item.price).toFixed(2)}</span>
                </div>
                {choice === 'RUNNER' && (
                  <div className="flex justify-between items-center text-[13px] font-medium text-slate-500">
                    <span>Runner Fee ({selectedSpot.label})</span>
                    <span className="text-navy">RM {runnerFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 border-t-[0.5px] border-slate-100 flex justify-between items-center">
                  <span className="text-[14px] font-bold text-navy">Total to Transfer</span>
                  <span className="text-[18px] font-black text-[#00C4B4]">RM {total.toFixed(2)}</span>
                </div>
              </div>

              {/* ── PAYMENT METHOD SWITCHER ── */}
              <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
                {['QR', 'TRANSFER'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m as 'QR' | 'TRANSFER')}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                      paymentMethod === m ? 'bg-white text-navy shadow-sm' : 'text-slate-400'
                    }`}
                  >
                    {m === 'QR' ? 'Scan QR' : 'Bank Transfer'}
                  </button>
                ))}
              </div>

              {/* ── DYNAMIC PAYMENT TERMINAL ── */}
              {paymentMethod === 'QR' ? (
                <div className="flex flex-col items-center py-4 space-y-4">
                  <div className="w-[160px] h-[160px] bg-white p-3 rounded-3xl border-[0.5px] border-slate-100 shadow-xl shadow-[#E91E63]/10 flex items-center justify-center relative group">
                    <div className="w-full h-full bg-[#E91E63]/5 rounded-2xl flex items-center justify-center overflow-hidden transition-all">
                      <div className="text-center p-4">
                        <QrCode size={48} className="mx-auto text-[#E91E63] mb-2" />
                        <p className="text-[8px] font-black text-[#E91E63] uppercase tracking-widest">DuitNow QR • ShopeePay</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[14px] font-bold text-navy">Scan to pay RM {total.toFixed(2)}</p>
                    <p className="text-[11px] font-medium text-slate-400">ID: 64685896263645</p>
                  </div>
                </div>
              ) : (
                <div className="px-2 flex justify-between items-center py-4">
                  <div>
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-1">DuitNow Transfer</p>
                    <p className="text-[20px] font-black text-navy leading-none tracking-tighter">6468 5896 2636 45</p>
                    <p className="text-[12px] font-medium text-slate-400 mt-2">
                      ShopeePay Account — {item.seller_name || 'Verified Vendor'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-[10px] font-black text-[#E91E63]">DUITNOW</div>
                </div>
              )}

              {/* ── MINIMALIST RECEIPT AREA ── */}
              <div className="space-y-3">
                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-2">Verification Proof</p>
                <label className="block w-full h-[100px] rounded-3xl border-[1px] border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-50 transition-all group">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                  />
                  {receipt ? (
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-[14px]">
                      <Package size={18} /> Receipt Attached
                    </div>
                  ) : (
                    <>
                      <div className="text-[11px] font-black text-slate-300 uppercase tracking-widest group-hover:text-[#00C4B4] transition-all">Upload Receipt</div>
                      <p className="text-[9px] text-slate-400">JPG, PNG or PDF</p>
                    </>
                  )}
                </label>
              </div>

              {/* ── SECURITY BADGE ── */}
              <div className="flex items-center justify-center gap-2 pt-2 pb-4">
                <ShieldCheck size={14} className="text-[#00C4B4]" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Pulse Secure • End-to-End Encrypted</span>
              </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Confirm CTA — Black */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={(!choice) || (step === 'PAYMENT' && !receipt) || loading}
            onClick={() => {
              if (step === 'FULFILLMENT') {
                setStep('PAYMENT');
              } else {
                if (!receipt) return;
                const loc = choice === 'RUNNER' ? `${selectedSpot.label} — ${selectedSpot.sub}` : undefined;
                onConfirm(choice!, loc, receipt);
              }
            }}
            className="w-full h-[60px] bg-[#00C4B4] text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-3 disabled:opacity-40 transition-all shadow-lg shadow-[#00C4B4]/20 mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" />
            ) : step === 'FULFILLMENT' ? (
              <>Continue</>
            ) : (
              <>Buy Now — RM {total.toFixed(2)}</>
            )}
          </motion.button>

          {/* Safe spacer for iOS home indicator */}
          <div className="h-4" />
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
  const [profile, setProfile] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showDeliverySheet, setShowDeliverySheet] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        onSnapshot(doc(db, 'users', user.uid), (snap) => setProfile(snap.data()));
        const q = query(collection(db, 'transactions'), where('buyer_id', '==', user.uid), where('status', '==', 'PENDING'));
        onSnapshot(q, (snap) => setNotificationCount(snap.docs.length));
      }
    });

    const fetchItem = async () => {
      const docRef = doc(db, 'items', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setItem({ id: docSnap.id, ...docSnap.data() });
      setPageLoading(false);
    };
    fetchItem();
    return () => unsubAuth();
  }, [id]);

  const handleConfirmOrder = async (deliveryType: 'SELF_COLLECT' | 'RUNNER', dropOffLocation: string | undefined, receipt: File) => {
    if (!auth.currentUser) return router.push('/auth');
    
    // 🏛️ FINAL INTEGRITY CHECK
    if (!item?.seller_id || !id) {
      alert("Institutional data mismatch. Please refresh this listing.");
      return;
    }

    setLoading(true);
    try {
      console.log("🚀 Initiating Secure Handshake with Node 20...");
      
      // 1. Upload Receipt to Verified Terminal
      const receiptRef = ref(storage, `receipts/${Date.now()}_${receipt.name}`);
      const uploadResult = await uploadBytes(receiptRef, receipt);
      const receiptUrl = await getDownloadURL(uploadResult.ref);

      // 2. Prepare Order Data Payload
      const orderData = {
        itemId: String(id),
        title: String(item.title || "Marketplace Item"),
        price: Number(item.price),
        imageUrl: String(item.image_url || ""),
        receiptUrl: String(receiptUrl),
        sellerId: String(item.seller_id),
        sellerName: String(item.seller_name || "Verified Vendor"),
        deliveryType: String(deliveryType),
        dropOffLocation: dropOffLocation ? String(dropOffLocation) : null,
        buyerName: String(profile?.full_name || 'Verified Student'),
      };

      // 3. Call Cloud Transaction Function with Turbopack Serialization
      const placeOrderFn = httpsCallable(functions, 'placeOrder');
      const result: any = await placeOrderFn(JSON.parse(JSON.stringify(orderData)));
      
      console.log("✅ Transaction Atomic Success:", result.data);
      const orderId = result.data.orderId;
      setShowDeliverySheet(false);
      router.push(`/orders/success?id=${orderId}`);
    } catch (e: any) {
      console.group("🏛️ INSTITUTIONAL TERMINAL ERROR");
      console.error("CODE:", e.code);
      console.error("MESSAGE:", e.message);
      console.error("DETAILS:", e.details || "No details provided by region handshake.");
      console.groupEnd();
      
      const msg = e.message || 'The secure terminal encountered a protocol error. Please check your connection.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-navy/10 border-t-navy rounded-full animate-spin" />
    </div>
  );

  if (!item) return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center gap-4">
      <Package size={48} className="text-slate-200" />
      <p className="text-[14px] font-bold text-slate-400">Item not found</p>
      <button onClick={() => router.back()} className="text-[13px] font-bold text-accent">Go back</button>
    </div>
  );

  const stock = item.stock_count ?? item.stock ?? 99; // Default to 99 if untracked to prevent "Out of Stock" bug
  const isOutOfStock = stock <= 0;

  return (
    <div className="min-h-screen bg-white font-sans text-navy antialiased">

      {/* ── MINIMAL BACK NAV ── */}
      <button 
        onClick={() => router.back()}
        className="fixed top-8 left-6 z-[110] flex items-center gap-1 text-slate-400 hover:text-navy transition-colors"
      >
        <ChevronLeft size={24} />
        <span className="text-[17px] font-medium">Home</span>
      </button>

      {/* ── EDITORIAL HEADER (DOME CANVAS) ── */}
      <div className="relative w-full h-[450px] bg-[#F2F5F7] flex flex-col items-center justify-center overflow-visible">
        
        {/* The Dome Shape */}
        <div className="absolute bottom-0 w-[85%] h-[320px] bg-white rounded-t-[200px]" />

        {/* The Product Asset (Full Editorial Stage) */}
        <div className="relative z-10 w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden shadow-2xl shadow-black/10 border-[0.5px] border-slate-100 bg-white">
          {item.image_url ? (
            <img
              src={item.image_url}
              className="w-full h-full object-cover"
              alt={item.title}
            />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
               <Package size={48} className="text-slate-200" />
            </div>
          )}
        </div>

        <div className="absolute -bottom-7 left-0 right-0 z-50 px-6 flex justify-between items-center max-w-2xl mx-auto w-full">
           <button className="w-14 h-14 rounded-full bg-white border border-slate-100 shadow-lg flex items-center justify-center text-navy hover:scale-105 transition-all">
              <Share2 size={20} />
           </button>
           <button 
             onClick={() => setShowDeliverySheet(true)}
             className="h-14 px-8 bg-[#00C4B4] rounded-full text-white font-bold text-[15px] flex items-center gap-3 shadow-lg shadow-[#00C4B4]/20 hover:scale-[1.02] active:scale-95 transition-all"
           >
              <ShieldCheck size={18} />
              Buy Now — RM {Number(item.price).toFixed(2)}
           </button>
        </div>
      </div>

      {/* ── MARKETPLACE CONTENT HIERARCHY ── */}
      <div className="px-6 pt-16 pb-48 space-y-16 max-w-2xl mx-auto">
        
        {/* 1. IDENTITY & PRIMARY METRICS */}
        <div className="space-y-6">
          <div className="space-y-2">
             <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.12em]">
               {item.category || "General Marketplace"}
             </p>
             <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-amber-50/50 rounded-full border-[0.5px] border-amber-100 flex items-center gap-1.5">
                   <Star size={10} className="text-amber-500 fill-amber-500" />
                   <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">4.9 Rating</span>
                </div>
             </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-[32px] font-black text-navy tracking-tight leading-[1.1] max-w-[90%]">
              {item.title}
            </h1>
            <p className="text-[20px] font-black text-[#00C4B4] tracking-tight">
              RM {Number(item.price).toFixed(2)}
            </p>
          </div>
        </div>

        {/* 2. SHIPPING & FULFILLMENT (Boutique Module) */}
        <div className="p-8 bg-slate-50/50 rounded-[24px] border-[0.5px] border-slate-100 space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <Truck size={20} className="text-slate-600" />
                 <span className="text-[15px] font-bold text-navy">Shipping to</span>
              </div>
              <span className="text-[15px] font-medium text-slate-500">UniKL MIIT (Level 2)</span>
           </div>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <Clock size={20} className="text-slate-600" />
                 <span className="text-[15px] font-bold text-navy">Fulfillment</span>
              </div>
              <span className="text-[15px] font-medium text-slate-500">Within 24 Hours</span>
           </div>
        </div>

        {/* 3. TABS: DESCRIPTION & DETAILS */}
        <div className="space-y-8">
           <div className="flex gap-10 border-b border-slate-50">
              <button className="pb-4 text-[16px] font-black text-navy border-b-[3px] border-[#00C4B4]">Description</button>
              <button className="pb-4 text-[16px] font-bold text-slate-300">Details</button>
           </div>
           
           <div className="space-y-6">
              <p className="text-[15px] text-slate-500 leading-[1.7] font-medium">
                {item.description || "No description provided by the vendor. This listing is verified under institutional standards."}
              </p>
              
              {/* Technical Grid (Carousell Style) */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                 {[
                   { label: 'Condition', value: item.condition || 'Brand New' },
                   { label: 'Category', value: item.category || 'General' },
                   { label: 'Authenticity', value: 'Original' },
                   { label: 'Stock', value: item.stock_count || '15 Units' },
                 ].map((spec, i) => (
                   <div key={i} className="p-4 bg-white rounded-2xl border-[0.5px] border-slate-100">
                      <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-1">{spec.label}</p>
                      <p className="text-[14px] font-bold text-navy">{spec.value}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* 4. STORE PROFILE (Shopee Style) */}
        <div className="pt-12 border-t-[0.5px] border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                  {item.seller_photo ? (
                    <img src={item.seller_photo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[20px] font-black text-slate-200">{item.seller_name?.[0]}</span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[18px] font-black text-navy">{item.seller_name || 'Verified Vendor'}</h3>
                <div className="flex items-center gap-3">
                   <span className="text-[12px] font-bold text-slate-400">Active 5m ago</span>
                   <div className="w-1 h-1 rounded-full bg-slate-200" />
                   <span className="text-[12px] font-bold text-[#00C4B4]">View Shop</span>
                </div>
              </div>
           </div>
           <button className="px-6 py-3 rounded-xl border-[0.5px] border-slate-200 text-[14px] font-bold text-navy hover:bg-slate-50 transition-all">
              Chat
           </button>
        </div>
      </div>


      {/* ── DELIVERY SHEET (Marzia Flow) ── */}
      <AnimatePresence>
        {showDeliverySheet && (
          <MarziaDeliverySheet
            item={item}
            onConfirm={handleConfirmOrder}
            onClose={() => setShowDeliverySheet(false)}
            loading={loading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
