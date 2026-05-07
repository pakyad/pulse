'use client'
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth, functions, storage } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  ChevronLeft, Heart, ShieldCheck, ShoppingBag, Star,
  MessageSquare, Bell, MapPin, Truck, X, Plus, Package, Clock, Share2, QrCode, Check, ArrowRight
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

  const [mockUserLocation, setMockUserLocation] = useState({ lat: 3.1590, lng: 101.7010 });
  const distanceKm = calculateDistance(
    mockUserLocation.lat, mockUserLocation.lng,
    TARGET_COORDS.lat, TARGET_COORDS.lng
  );
  const isWithinRadius = distanceKm <= MAX_DELIVERY_RADIUS_KM;

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
      className="fixed inset-0 z-1000 bg-navy/50 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 420, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-[#FDFDFD] rounded-t-[48px] overflow-y-auto max-h-[92vh] pb-8 shadow-2xl"
      >
        {/* Sheet Header — Institutional Sync */}
        <div className="px-8 pt-8 pb-6 border-b-[0.5px] border-slate-100">
          <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-black text-slate-900 tracking-tight">
              {step === 'FULFILLMENT' ? 'Logistics Directives' : 'Registry Verification'}
            </h2>
            <button 
              onClick={() => {
                if (step === 'PAYMENT') setStep('FULFILLMENT');
                else onClose();
              }} 
              className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all border border-slate-50 shadow-sm"
            >
              {step === 'PAYMENT' ? <ChevronLeft size={18} /> : <X size={16} />}
            </button>
          </div>
        </div>

        <div className="px-8 py-8">
          <AnimatePresence mode="wait">
            {step === 'FULFILLMENT' ? (
              <motion.div
                key="fulfillment"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* 🏛️ QUANTITY SELECTOR */}
                <div className="p-6 bg-slate-50/50 rounded-[36px] border border-slate-50 flex items-center justify-between shadow-sm">
                   <div className="space-y-1">
                      <p className="text-[17px] font-black text-slate-900 tracking-tight">Units for Handoff</p>
                      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Institutional Qty</p>
                   </div>
                   <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                      <button 
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                      >
                         <X size={14} className="rotate-45" />
                      </button>
                      <span className="text-[18px] font-black w-6 text-center">{qty}</span>
                      <button 
                        onClick={() => setQty(Math.min(item.stock_count || 10, qty + 1))}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                      >
                         <Plus size={14} />
                      </button>
                   </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Select Fulfillment Node</p>
                  
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setChoice('SELF_COLLECT')}
                    className={`w-full p-6 rounded-[36px] border border-slate-50 text-left transition-all flex items-center justify-between group shadow-sm shadow-slate-100 ${
                      choice === 'SELF_COLLECT'
                        ? 'bg-blue-50/80 border-blue-100'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                        choice === 'SELF_COLLECT' ? 'bg-white text-blue-500' : 'bg-slate-50 text-slate-400'
                      }`}>
                        <ShoppingBag size={24} />
                      </div>
                      <div>
                        <p className="text-[17px] font-black tracking-tight text-slate-900">Direct Collection</p>
                        <p className="text-[12px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.meetup_location || 'Campus Lobby'}</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                       choice === 'SELF_COLLECT' ? 'border-blue-500 bg-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-100'
                    }`}>
                       {choice === 'SELF_COLLECT' && <Check size={12} className="text-white" strokeWidth={4} />}
                    </div>
                  </motion.button>

                  <motion.button
                    whileTap={isWithinRadius ? { scale: 0.98 } : {}}
                    onClick={() => isWithinRadius && setChoice('RUNNER')}
                    disabled={!isWithinRadius}
                    className={`w-full p-6 rounded-[36px] border border-slate-50 text-left transition-all flex items-center justify-between group shadow-sm shadow-slate-100 ${
                      !isWithinRadius
                        ? 'bg-slate-50/30 opacity-40 grayscale cursor-not-allowed'
                        : choice === 'RUNNER'
                        ? 'bg-emerald-50/80 border-emerald-100'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                        !isWithinRadius ? 'bg-slate-100 text-slate-300' : choice === 'RUNNER' ? 'bg-white text-emerald-500' : 'bg-slate-50 text-slate-400'
                      }`}>
                        <Truck size={24} />
                      </div>
                      <div>
                        <p className="text-[17px] font-black tracking-tight text-slate-900">Institutional Runner</p>
                        <p className="text-[12px] font-bold text-slate-400 mt-1 uppercase tracking-widest">On-Demand Radar</p>
                      </div>
                    </div>

                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                       choice === 'RUNNER' ? 'border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-100'
                    }`}>
                       {choice === 'RUNNER' && <Check size={12} className="text-white" strokeWidth={4} />}
                    </div>
                  </motion.button>
                </div>

                <AnimatePresence>
                  {choice === 'RUNNER' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="pt-4 space-y-4"
                    >
                      <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Target Campus Hub</p>
                      <div className="grid grid-cols-2 gap-4">
                        {hubs.map((spot) => (
                          <button
                            key={spot.id}
                            onClick={() => setLocation(spot.id)}
                            className={`p-6 rounded-[32px] border border-slate-50 text-left transition-all shadow-sm ${
                              location === spot.id
                                ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/20'
                                : 'bg-white text-slate-900'
                            }`}
                          >
                            <p className="text-[15px] font-black tracking-tight">{spot.label}</p>
                            <p className={`text-[11px] font-bold mt-1 uppercase tracking-widest ${location === spot.id ? 'text-slate-400' : 'text-slate-300'}`}>
                              RM {spot.zone === 'campus' ? '3.50' : '5.00'}
                            </p>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => {
                    setMockUserLocation(prev => 
                      prev.lat === 3.1590 ? { lat: 3.0000, lng: 101.7000 } : { lat: 3.1590, lng: 101.7010 }
                    );
                    if (choice === 'RUNNER' && isWithinRadius) setChoice(null);
                  }}
                  className="text-[9px] text-slate-200 hover:text-slate-300 w-full text-center tracking-[0.3em] uppercase transition-colors"
                >
                  Geofence Shift ({isWithinRadius ? 'Inside' : 'Outside'})
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-slate-50/50 rounded-[40px] p-8 border border-slate-50 space-y-5 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Asset Value</span>
                    <span className="text-[15px] font-black text-slate-900">RM {Number(item.price).toFixed(2)}</span>
                  </div>
                  {choice === 'RUNNER' && (
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Logistics Hub</span>
                      <span className="text-[15px] font-black text-slate-900">RM {runnerFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[13px] font-black text-slate-900 uppercase tracking-[0.2em]">Final Registry</span>
                    <span className="text-[28px] font-black text-slate-900 tracking-tighter">RM{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2 p-2 bg-slate-50/50 rounded-[28px] border border-slate-50">
                  {['QR', 'TRANSFER'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m as 'QR' | 'TRANSFER')}
                      className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                        paymentMethod === m ? 'bg-white text-navy shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      {m === 'QR' ? 'Scan Hub' : 'Institutional Bank'}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'QR' ? (
                  <div className="flex flex-col items-center py-4 space-y-6">
                    <div className="w-[200px] h-[200px] bg-white p-5 rounded-[48px] border border-slate-50 shadow-2xl shadow-slate-200/50 flex items-center justify-center relative">
                      <div className="w-full h-full bg-slate-50 rounded-[32px] flex items-center justify-center overflow-hidden">
                        <QrCode size={64} className="text-slate-900 opacity-80" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pulse Terminal Node</p>
                      <p className="text-[17px] font-black text-slate-900 tracking-tight mt-1">Settle RM{total.toFixed(2)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 bg-white rounded-[32px] border border-slate-50 shadow-sm flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">DuitNow Terminal</p>
                      <p className="text-[22px] font-black text-slate-900 tracking-tighter">6468 5896 2636</p>
                      <p className="text-[12px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                        {item.seller_name || 'Pulse Resident'}
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                       <ShieldCheck size={24} />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] px-2">Institutional Audit</p>
                  <label className="w-full h-[120px] rounded-[36px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 hover:border-slate-200 transition-all group">
                    <input type="file" className="hidden" onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
                    {receipt ? (
                      <div className="flex items-center gap-3 text-emerald-500 font-black text-[14px] uppercase tracking-widest">
                        <Check size={20} strokeWidth={4} /> Ledger Uploaded
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-all">
                           <Plus size={20} />
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Attach Receipt Proof</span>
                      </>
                    )}
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={(!choice) || (step === 'PAYMENT' && !receipt) || loading}
            onClick={() => {
              if (step === 'FULFILLMENT') {
                setStep('PAYMENT');
              } else {
                if (!receipt) return;
                const loc = choice === 'RUNNER' ? `${selectedSpot.label} — ${selectedSpot.sub}` : undefined;
                onConfirm(choice!, loc, receipt, qty);
              }
            }}
            className="w-full h-[72px] bg-slate-900 text-white rounded-[32px] font-black text-[15px] flex items-center justify-center gap-3 disabled:opacity-20 transition-all shadow-2xl shadow-slate-900/20 mt-8 uppercase tracking-[0.2em]"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white animate-spin rounded-full" />
            ) : step === 'FULFILLMENT' ? (
              <>Initiate Transaction <ArrowRight size={18} strokeWidth={3} /></>
            ) : (
              <>Finalize Handshake <ShieldCheck size={18} strokeWidth={3} /></>
            )}
          </motion.button>
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
        const nq = query(collection(db, 'orders'), where('buyer_id', '==', user.uid), where('status', 'in', ['PENDING', 'AWAITING_RUNNER', 'IN_TRANSIT']));
        onSnapshot(nq, (snap) => setNotificationCount(snap.docs.length));
      }
    });

    const fetchItem = async () => {
      const FALLBACK_LIST = [
        { id: 'd_pro_kit', title: 'Official UniKL Football Match-Day Kit (PRO)', price: 120, description: 'Institutional performance jersey for active match-day participation. Limited edition forest green / slate accents.', image_url: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?q=80&w=600', seller_name: 'Kelab Bola UniKL', seller_id: 'kelabbola', is_official: true, category: 'Official', stock_count: 15 },
        { id: 'd_scarf_fix', title: 'UniKL Football Club Scarf', price: 25, description: 'Knitted wool scarf for match days and chilly labs. Classic forest green/slate.', image_url: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=600', seller_name: 'Kelab Bola UniKL', seller_id: 'kelabbola', is_official: true, category: 'Official', stock_count: 50 },
        { id: 'd_jersey_2026', title: 'Official UniKL Football Jersey 2026', price: 95, description: 'The official 2026 home kit for UniKL Football Club. Breathable fabric with embroidered crest.', image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600', seller_name: 'Kelab Bola UniKL', seller_id: 'kelabbola', is_official: true, category: 'Official', stock_count: 22 }
      ];

      const docRef = doc(db, 'items', id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setItem({ id: docSnap.id, ...docSnap.data() });
      } else {
        const fallback = FALLBACK_LIST.find(f => f.id === id);
        if (fallback) {
          setItem(fallback);
        }
      }
      setPageLoading(false);
    };
    fetchItem();
    return () => unsubAuth();
  }, [id]);

  const handleConfirmOrder = async (deliveryType: 'SELF_COLLECT' | 'RUNNER', dropOffLocation: string | undefined, receipt: File, qty: number) => {
    if (!auth.currentUser) return router.push('/auth');
    if (!item?.seller_id || !id) {
      alert("Institutional data mismatch. Please refresh this listing.");
      return;
    }

    setLoading(true);
    try {
      const receiptRef = ref(storage, `receipts/${Date.now()}_${receipt.name}`);
      const uploadResult = await uploadBytes(receiptRef, receipt);
      const receiptUrl = await getDownloadURL(uploadResult.ref);

      const placeOrder = httpsCallable(functions, 'placeOrder');
      const safeData = JSON.parse(JSON.stringify({
        userId: auth.currentUser.uid,
        cartItems: [
          {
            productId: String(id),
            title: String(item.title),
            price: Number(item.price),
            qty: qty,
            vendorId: String(item.seller_id),
            sellerName: String(item.seller_name)
          }
        ],
        deliveryType: String(deliveryType),
        dropOffLocation: dropOffLocation || null,
        receiptUrl: String(receiptUrl)
      }));

      const result: any = await placeOrder(safeData);
      const parentId = result.data.parentId;
      setShowDeliverySheet(false);
      router.push(`/orders/success?id=${parentId}`);
    } catch (e: any) {
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

  const stock = item.stock_count ?? item.stock ?? 99;

  return (
    <div className="min-h-screen bg-white font-sans text-navy antialiased">
      <button 
        onClick={() => router.back()}
        className="fixed top-8 left-6 z-100 flex items-center gap-1 text-slate-400 hover:text-navy transition-colors"
      >
        <ChevronLeft size={24} />
        <span className="text-[17px] font-medium">Home</span>
      </button>

      <div className="relative w-full h-[450px] bg-[#F2F5F7] flex flex-col items-center justify-center overflow-visible">
        <div className="absolute bottom-0 w-[85%] h-[320px] bg-white rounded-t-[200px]" />
        <div className="relative z-10 w-full max-w-[340px] aspect-square rounded-[48px] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100 bg-white">
          {item.image_url ? (
            <img src={item.image_url} className="w-full h-full object-cover" alt={item.title} />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
               <Package size={56} className="text-slate-200" />
            </div>
          )}
        </div>

        <div className="absolute -bottom-10 left-0 right-0 z-50 px-8 flex justify-between items-center max-w-2xl mx-auto w-full">
           <button className="w-16 h-16 rounded-[28px] bg-white border border-slate-50 shadow-2xl shadow-slate-200/50 flex items-center justify-center text-slate-900 hover:scale-105 transition-all">
              <Share2 size={24} />
           </button>
           <button 
             onClick={() => setShowDeliverySheet(true)}
             className="h-16 px-10 bg-slate-900 rounded-[28px] text-white font-black text-[15px] flex items-center gap-4 shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
           >
              <ShieldCheck size={20} strokeWidth={2.5} />
              Buy Now — RM{Number(item.price).toFixed(0)}
           </button>
        </div>
      </div>

      <div className="px-8 pt-20 pb-48 space-y-16 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="space-y-2">
             <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.2em]">
               {item.category || "General Marketplace"}
             </p>
             <div className="flex items-center gap-2">
                <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-50 flex items-center gap-2">
                   <Star size={12} className="text-amber-500 fill-amber-500" />
                   <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">4.9 Rating</span>
                </div>
             </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-[40px] font-black text-slate-900 tracking-tighter leading-none max-w-[95%]">
              {item.title}
            </h1>
            <p className="text-[28px] font-black text-slate-900 tracking-tighter">
              RM{Number(item.price).toFixed(0)}
            </p>
          </div>
        </div>

        <div className="p-10 bg-slate-50/50 rounded-[48px] border border-slate-50 space-y-8 shadow-sm">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                    <Truck size={24} className="text-slate-400" />
                 </div>
                 <div>
                    <p className="text-[17px] font-black text-slate-900 tracking-tight">Institutional Delivery</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Verified Runner Node</p>
                 </div>
              </div>
              <Check size={20} className="text-emerald-500" strokeWidth={4} />
           </div>
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                    <Clock size={24} className="text-slate-400" />
                 </div>
                 <div>
                    <p className="text-[17px] font-black text-slate-900 tracking-tight">Rapid Handoff</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">~24H Registry Lock</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-12">
           <div className="flex gap-16 border-b border-slate-50">
              <button className="pb-6 text-[15px] font-black text-slate-900 border-b-4 border-slate-900 uppercase tracking-widest">Description</button>
              <button className="pb-6 text-[15px] font-black text-slate-300 uppercase tracking-widest">Details</button>
           </div>
           
           <div className="space-y-8">
              <p className="text-[17px] text-slate-500 leading-[1.6] font-medium">
                {item.description || "No description provided by the vendor. This listing is verified under institutional standards."}
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-4">
                 {[
                   { label: 'Condition', value: item.condition || 'Mint' },
                   { label: 'Node', value: item.campus_id || 'MIIT' },
                   { label: 'Security', value: 'Encrypted' },
                   { label: 'Stock', value: `${stock} Units` },
                 ].map((spec, i) => (
                   <div key={i} className="p-6 bg-white rounded-[32px] border border-slate-50 shadow-sm">
                      <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-2">{spec.label}</p>
                      <p className="text-[16px] font-black text-slate-900 tracking-tight">{spec.value}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="pt-20 border-t border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-[36px] bg-slate-50 border border-slate-50 overflow-hidden flex items-center justify-center shadow-2xl shadow-slate-200/50">
                  {item.seller_photo ? (
                    <img src={item.seller_photo} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[32px] font-black text-slate-200">{item.seller_name?.[0] || 'V'}</span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-500 border-4 border-white rounded-full shadow-lg shadow-emerald-500/20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[22px] font-black text-slate-900 tracking-tighter">{item.seller_name || 'Verified Vendor'}</h3>
                <div className="flex items-center gap-4">
                   <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Resident Merchant</span>
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                   <span className="text-[12px] font-black text-slate-900 uppercase tracking-widest underline underline-offset-8">Profile</span>
                </div>
              </div>
           </div>
           <button className="h-16 w-16 rounded-[28px] border border-slate-100 flex items-center justify-center text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
              <MessageSquare size={24} />
           </button>
        </div>
      </div>

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

      <AnimatePresence>
        {errorToast && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-12 left-8 right-8 z-2000 bg-slate-900 text-white rounded-[32px] p-8 shadow-2xl flex items-center gap-6 border border-white/10"
          >
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            </div>
            <p className="text-[14px] font-black uppercase tracking-tight flex-1">
              {errorToast.message}
            </p>
            <button onClick={() => setErrorToast(null)} className="text-white/20 hover:text-white transition-all p-2">
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
