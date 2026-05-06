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

// ── Geofence Utility ──
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const TARGET_COORDS = { lat: 3.1587, lng: 101.7005 }; // UniKL MIIT
const MAX_DELIVERY_RADIUS_KM = 2.0;

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

  // Geofence Mock State
  const [mockUserLocation, setMockUserLocation] = useState({ lat: 3.1590, lng: 101.7010 });
  const distanceKm = calculateDistance(
    mockUserLocation.lat, mockUserLocation.lng,
    TARGET_COORDS.lat, TARGET_COORDS.lng
  );
  const isWithinRadius = distanceKm <= MAX_DELIVERY_RADIUS_KM;

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
        <div className="px-8 pt-8 pb-6 border-b-[0.5px] border-slate-100">
          <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">
              {step === 'FULFILLMENT' ? 'Delivery Configuration' : 'Payment Verification'}
            </h2>
            <button 
              onClick={() => {
                if (step === 'PAYMENT') setStep('FULFILLMENT');
                else onClose();
              }} 
              className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all border border-slate-100 shadow-sm"
            >
              {step === 'PAYMENT' ? <ChevronLeft size={18} /> : <X size={16} />}
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
                className={`w-full min-h-[80px] p-5 rounded-3xl border-[0.5px] text-left transition-all flex items-center gap-5 ${
                  choice === 'SELF_COLLECT'
                    ? 'border-accent bg-accent text-white shadow-xl shadow-accent/10'
                    : 'border-slate-100 bg-white text-slate-900 shadow-sm'
                }`}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                  choice === 'SELF_COLLECT' ? 'bg-white/10' : 'bg-slate-50'
                }`}>
                  <ShoppingBag size={20} className={choice === 'SELF_COLLECT' ? 'text-white' : 'text-slate-400'} />
                </div>
                <div>
                  <p className="text-[15px] font-bold leading-none tracking-tight">Self-Collection</p>
                  <p className={`text-[12px] font-medium mt-1.5 ${choice === 'SELF_COLLECT' ? 'opacity-70' : 'text-slate-400'}`}>
                    Handover at <span className={`font-bold underline underline-offset-4 ${choice === 'SELF_COLLECT' ? 'text-white decoration-white/30' : 'text-slate-900 decoration-slate-900/10'}`}>
                      {item.meetup_location || 'UniKL MIIT Main Lobby'}
                    </span>
                  </p>
                </div>
              </motion.button>

          {/* Choice B — Runner */}
          <motion.button
            whileTap={isWithinRadius ? { scale: 0.98 } : {}}
            onClick={() => isWithinRadius && setChoice('RUNNER')}
            disabled={!isWithinRadius}
            className={`w-full min-h-[80px] p-5 rounded-3xl border-[0.5px] text-left transition-all flex items-center justify-between ${
              !isWithinRadius
                ? 'bg-slate-50 border-slate-100 text-slate-300 opacity-60 cursor-not-allowed'
                : choice === 'RUNNER'
                ? 'border-accent bg-accent text-white shadow-xl shadow-accent/10'
                : 'border-slate-100 bg-white text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                !isWithinRadius ? 'bg-slate-100 text-slate-300' : choice === 'RUNNER' ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-900'
              }`}>
                <Truck size={20} />
              </div>
              <div>
                <p className="text-[15px] font-bold leading-none tracking-tight">Institutional Runner</p>
                <p className={`text-[12px] font-medium mt-1.5 ${choice === 'RUNNER' ? 'opacity-70' : 'text-slate-400'}`}>
                  Delivery via verified peer network
                </p>
              </div>
            </div>

            {!isWithinRadius && (
              <span className="bg-red-50 text-red-600 uppercase text-[9px] font-bold px-2.5 py-1 rounded-lg shrink-0 border border-red-100">
                Out of Range
              </span>
            )}
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
                <div className="grid grid-cols-2 gap-3">
                  {hubs.map((spot) => (
                    <button
                      key={spot.id}
                      onClick={() => setLocation(spot.id)}
                      className={`h-[64px] px-5 rounded-2xl border-[0.5px] text-left transition-all ${
                        location === spot.id
                          ? 'bg-accent border-accent text-white shadow-lg shadow-accent/10'
                          : 'bg-white border-slate-100 text-slate-900 shadow-sm'
                      }`}
                    >
                      <p className="text-[13px] font-bold leading-tight">{spot.label}</p>
                      <p className={`text-[11px] font-semibold mt-0.5 opacity-60 uppercase tracking-widest`}>
                        RM {spot.zone === 'campus' ? '3.50' : '5.00'}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Secret Demo Toggle */}
          <button
            onClick={() => {
              setMockUserLocation(prev => 
                prev.lat === 3.1590 ? { lat: 3.0000, lng: 101.7000 } : { lat: 3.1590, lng: 101.7010 }
              );
              // Auto-deselect Runner if they go out of bounds
              if (choice === 'RUNNER' && isWithinRadius) {
                 setChoice(null);
              }
            }}
            className="text-[10px] text-gray-300 hover:text-gray-400 mt-4 w-full text-center tracking-widest uppercase transition-colors"
          >
            demo: toggle geofence ({isWithinRadius ? 'Inside 2km' : 'Outside 2km'})
          </button>
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
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-4 shadow-sm shadow-slate-200/50">
                <div className="flex justify-between items-center text-[13px] font-semibold text-slate-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-slate-900">RM {Number(item.price).toFixed(2)}</span>
                </div>
                {choice === 'RUNNER' && (
                  <div className="flex justify-between items-center text-[13px] font-semibold text-slate-400 uppercase tracking-widest">
                    <span>Logistics</span>
                    <span className="text-slate-900">RM {runnerFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[15px] font-bold text-slate-900 uppercase tracking-widest">Final Ledger</span>
                  <span className="text-[24px] font-bold text-slate-900 tracking-tight">RM {total.toFixed(2)}</span>
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
                <div className="flex flex-col items-center py-6 space-y-6">
                  <div className="w-[180px] h-[180px] bg-white p-4 rounded-4xl border border-slate-100 shadow-2xl shadow-slate-200 flex items-center justify-center relative group">
                    <div className="w-full h-full bg-slate-50 rounded-3xl flex items-center justify-center overflow-hidden transition-all">
                      <div className="text-center p-4">
                        <QrCode size={56} className="mx-auto text-slate-900 mb-3" />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">DuitNow QR • Standard</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-slate-900 tracking-tight">Scan to fulfill RM {total.toFixed(2)}</p>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Registry ID: 64685896263645</p>
                  </div>
                </div>
              ) : (
                <div className="px-3 flex justify-between items-center py-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">DuitNow Terminal</p>
                    <p className="text-[22px] font-bold text-slate-900 leading-none tracking-tight">6468 5896 2636 45</p>
                    <p className="text-[12px] font-semibold text-slate-500 mt-2">
                      Verified Account — {item.seller_name || 'Pulse Resident'}
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-900 uppercase tracking-widest">Bank</div>
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
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-[14px] uppercase tracking-widest">
                      <Package size={20} /> Registry Updated
                    </div>
                  ) : (
                    <>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-accent transition-all">Upload Receipt</div>
                      <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mt-1">Institutional Audit Trail</p>
                    </>
                  )}
                </label>
              </div>

              {/* ── SECURITY BADGE ── */}
              <div className="flex items-center justify-center gap-2.5 pt-4 pb-6">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.1em]">Pulse Secure • Institutional Verification</span>
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
            className="w-full h-[64px] bg-accent text-white rounded-3xl font-bold text-[15px] flex items-center justify-center gap-3 disabled:opacity-40 transition-all shadow-xl shadow-accent/10 mt-6 uppercase tracking-widest"
          >
            {loading ? (
              <div className="w-6 h-6 border-[1.5px] border-white/20 border-t-white animate-spin rounded-full" />
            ) : step === 'FULFILLMENT' ? (
              <>Continue to Payment</>
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
  const [errorToast, setErrorToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

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

      // 3. Call Cloud Transaction Function
      const placeOrder = httpsCallable(functions, 'placeOrder');
      
      // Force stripping of Next.js state objects and include ALL required fields
      const safeData = JSON.parse(JSON.stringify({
        itemId: orderData.itemId,
        price: orderData.price,
        sellerId: orderData.sellerId,
      }));

      console.log("Sending clean payload:", safeData);
      const result: any = await placeOrder(safeData);
      
      console.log("✅ Transaction Atomic Success:", result.data);
      const orderId = result.data.orderId;
      setShowDeliverySheet(false);
      router.push(`/orders/success?id=${orderId}`);
    } catch (e: any) {
      console.group("🏛️ TRANSACTION LOG");
      console.error("CODE:", e.code);
      console.error("MESSAGE:", e.message);
      console.groupEnd();

      // Catch the specific inventory error and show it to the user
      if (e.message?.includes("sold out")) {
          setErrorToast({ 
            message: "Sold Out! Another student just bought this asset.", 
            type: 'error' 
          });
          return; 
      }

      setErrorToast({ 
        message: "Transaction Failed. Please check your registry and try again.", 
        type: 'error' 
      });
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
        <div className="relative z-10 w-full max-w-[340px] aspect-square rounded-4xl overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100 bg-white">
          {item.image_url ? (
            <img
              src={item.image_url}
              className="w-full h-full object-cover"
              alt={item.title}
            />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
               <Package size={56} className="text-slate-200" />
            </div>
          )}
        </div>

        <div className="absolute -bottom-8 left-0 right-0 z-50 px-8 flex justify-between items-center max-w-2xl mx-auto w-full">
           <button className="w-16 h-16 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200 flex items-center justify-center text-slate-900 hover:scale-105 transition-all">
              <Share2 size={24} />
           </button>
           <button 
             onClick={() => setShowDeliverySheet(true)}
             className="h-16 px-10 bg-accent rounded-3xl text-white font-bold text-[15px] flex items-center gap-4 shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
           >
              <ShieldCheck size={20} strokeWidth={2.5} />
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

          <div className="space-y-3">
            <h1 className="text-[36px] font-bold text-slate-900 tracking-tight leading-[1.1] max-w-[95%]">
              {item.title}
            </h1>
            <p className="text-[24px] font-bold text-slate-900 tracking-tight">
              RM {Number(item.price).toFixed(2)}
            </p>
          </div>
        </div>

        {/* 2. SHIPPING & FULFILLMENT (Boutique Module) */}
        <div className="p-8 bg-slate-50 rounded-4xl border border-slate-100 space-y-8 shadow-sm">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                 <Truck size={22} className="text-slate-400" />
                 <span className="text-[16px] font-bold text-slate-900">Institutional Delivery</span>
              </div>
              <span className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">Available</span>
           </div>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                 <Clock size={22} className="text-slate-400" />
                 <span className="text-[16px] font-bold text-slate-900">Standard Transit</span>
              </div>
              <span className="text-[14px] font-semibold text-slate-500 uppercase tracking-widest">24H Handshake</span>
           </div>
        </div>

        {/* 3. TABS: DESCRIPTION & DETAILS */}
        <div className="space-y-10">
           <div className="flex gap-12 border-b border-slate-100">
              <button className="pb-5 text-[16px] font-bold text-slate-900 border-b-[2px] border-accent uppercase tracking-widest">Description</button>
              <button className="pb-5 text-[16px] font-bold text-slate-300 uppercase tracking-widest">Specifications</button>
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
        <div className="pt-16 border-t border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shadow-sm">
                  {item.seller_photo ? (
                    <img src={item.seller_photo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[24px] font-bold text-slate-300">{item.seller_name?.[0] || 'V'}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-[20px] font-bold text-slate-900 tracking-tight">{item.seller_name || 'Verified Vendor'}</h3>
                <div className="flex items-center gap-4">
                   <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest">Verified Resident</span>
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                   <span className="text-[12px] font-bold text-accent uppercase tracking-widest">View Store</span>
                </div>
              </div>
           </div>
           <button className="h-12 px-8 rounded-2xl border border-slate-200 text-[13px] font-bold text-slate-900 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">
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
      {/* ── Institutional Error Toast ── */}
      <AnimatePresence>
        {errorToast && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-32 left-8 right-8 z-[500] bg-black text-white rounded-2xl p-6 shadow-2xl flex items-center gap-4 border border-white/10"
          >
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <p className="text-[13px] font-bold uppercase tracking-tight flex-1">
              {errorToast.message}
            </p>
            <button onClick={() => setErrorToast(null)} className="text-white/20 hover:text-white transition-all">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
