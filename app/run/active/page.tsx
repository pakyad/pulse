'use client'
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Navigation, Phone, MessageSquare, CheckCircle2, 
  AlertTriangle, ShieldAlert, Package, Navigation2, Loader2,
  Clock, MapPin, ArrowRight, ShieldCheck, Star, Zap, X,
  Camera, Upload, Info, Lock, Shield
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { GoogleMap, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const MAP_OPTIONS = {
  disableDefaultUI: true,
  styles: [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] }
  ]
};

const LIBRARIES_CENTER = { lat: 3.1718, lng: 101.7538 }; 
const PICKUP_COORD = { lat: 3.1718, lng: 101.7538 }; 

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function ActiveRunContent() {
   const router = useRouter();
   const [step, setStep] = useState<number | null>(null); 
   const [mission, setMission] = useState<any>(null);
   const [pin, setPin] = useState<string[]>([]);
   const [isPinError, setIsPinError] = useState(false);
   const [isVerifying, setIsVerifying] = useState(false);
   const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
   
   const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
   const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
   const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);

   const { isLoaded, loadError } = useJsApiLoader({
     id: 'google-map-script',
     googleMapsApiKey: GOOGLE_MAPS_API_KEY
   });

   const isApiConfigured = !!(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.startsWith("AIza") && !loadError);

   useEffect(() => {
      let unsubSnapshot: any = null;
      const unsubAuth = auth.onAuthStateChanged((user) => {
         if (!user) { router.push('/auth'); return; }
         const userRef = doc(db, 'users', user.uid);
         unsubSnapshot = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
               const data = docSnap.data();
               const activeMission = data.current_missions?.[0];
               if (activeMission) {
                  setMission(activeMission);
                  setStep(activeMission.step || 1);
               } else {
                  router.push('/run');
               }
            }
         }, (err) => console.error("Firestore Error:", err));
      });
      return () => {
         unsubAuth();
         if (unsubSnapshot) unsubSnapshot();
      };
   }, [router]);

   useEffect(() => {
      if (typeof window === 'undefined' || !navigator.geolocation) return;
      const watchId = navigator.geolocation.watchPosition((pos) => {
         const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
         setUserCoords(coords);
         if (step === 1) {
            const dist = getDistance(coords.lat, coords.lng, PICKUP_COORD.lat, PICKUP_COORD.lng);
            setDistanceToTarget(dist);
         }
      }, (err) => console.warn("Geolocation denied:", err), { enableHighAccuracy: true });
      return () => navigator.geolocation.clearWatch(watchId);
   }, [step]);

   useEffect(() => {
     if (!isApiConfigured || !isLoaded || !mission || !step) return;
     try {
        const directionsService = new google.maps.DirectionsService();
        directionsService.route({
           origin: step <= 2 ? "UniKL City Campus" : "Cafe Block A UniKL",
           destination: step <= 2 ? "Cafe Block A UniKL" : "UniKL Library",
           travelMode: google.maps.TravelMode.WALKING,
        }, (result, status) => {
           if (status === 'OK') setDirections(result);
        });
     } catch (e) { console.warn("Map Service Error:", e); }
   }, [isApiConfigured, isLoaded, mission, step]);

   const handleVerifyPin = async (finalPin: string) => {
      setIsVerifying(true);
      setIsPinError(false);
      await new Promise(r => setTimeout(r, 1000));
      if (finalPin === '1234') { 
         handleStepUpdate();
      } else {
         setIsPinError(true);
         setPin([]);
      }
      setIsVerifying(false);
   };

   const onKeyPress = (num: string) => {
      if (pin.length >= 4) return;
      const newPin = [...pin, num];
      setPin(newPin);
      if (newPin.length === 4) handleVerifyPin(newPin.join(''));
   };

   const handleStepUpdate = async () => {
      if (!auth.currentUser || !mission || step === null) return;
      const nextStep = step + 1;
      try {
         const userRef = doc(db, 'users', auth.currentUser.uid);
         if (nextStep > 5) {
            const snap = await getDoc(userRef);
            const payout = mission.payout || 4.50;
            await addDoc(collection(db, 'users', auth.currentUser.uid, 'transactions'), {
               item: mission.title, price: payout, date: new Date().toLocaleString(), timestamp: new Date()
            });
            await updateDoc(userRef, { current_missions: [], balance: (snap.data()?.balance || 0) + payout });
            router.push('/run');
         } else {
            await updateDoc(userRef, { current_missions: [{ ...mission, step: nextStep }] });
         }
      } catch (error) { console.error(error); }
   };

   if (step === null) {
      return (
         <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 relative">
               <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
               <div className="absolute inset-0 rounded-full border-2 border-navy border-t-transparent animate-spin" />
            </div>
            <div className="text-center space-y-1">
               <p className="text-[11px] font-black uppercase tracking-[0.4em] text-navy animate-pulse">Syncing Protocol</p>
               <p className="text-[10px] font-bold text-slate-300">Awaiting Handshake...</p>
            </div>
         </div>
      );
   }

   const isTooFar = step === 1 && distanceToTarget !== null && distanceToTarget > 30;

   return (
      <div className="min-h-screen bg-[#FDFDFD] font-sans text-navy antialiased overflow-hidden">
         
         <AnimatePresence>
            {step === 5 && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-8 text-center">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                     <CheckCircle2 size={48} />
                  </div>
                  <h1 className="text-[14px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2">Directive Complete</h1>
                  <p className="text-[48px] font-black text-navy tracking-tighter leading-none mb-12">+RM {mission?.payout?.toFixed(2) || '4.50'}</p>
                  <button onClick={handleStepUpdate} className="w-full h-16 bg-navy text-white rounded-2xl font-bold">Dismiss & Return</button>
               </motion.div>
            )}
         </AnimatePresence>

         <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-12 pb-4 flex items-center justify-between bg-white/90 backdrop-blur-xl border-b border-slate-50">
            <button onClick={() => router.back()} className="p-2 -ml-2 bg-slate-50 rounded-full text-navy/40"><X size={20} /></button>
            <div className="flex flex-col items-center">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{mission?.id || 'PULSE-0000'}</p>
               <h1 className="text-[15px] font-bold text-navy">
                  {step === 4 ? "Security Handshake" : step === 3 ? "In Transit" : step === 2 ? "At Vendor" : "To Pickup"}
               </h1>
            </div>
            <button className="p-2 bg-red-50 text-red-500 rounded-full"><ShieldAlert size={20} /></button>
         </nav>

         <div className="absolute inset-0 z-0 pt-28">
            {isApiConfigured && isLoaded ? (
               <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={LIBRARIES_CENTER} zoom={16} options={MAP_OPTIONS as any}>
                  {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: false }} />}
               </GoogleMap>
            ) : (
               <div className="w-full h-full bg-[#FDFDFD] flex items-center justify-center opacity-10">
                  <MapPin size={64} strokeWidth={1} />
               </div>
            )}
         </div>

         <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-8">
            <div className={`bg-white/95 backdrop-blur-2xl border border-white shadow-2xl rounded-[2.5rem] p-7 pt-8 transition-all duration-500 ${step === 4 ? 'bg-navy/95 text-white' : ''}`}>
               
               <AnimatePresence mode="wait">
                  {step <= 3 ? (
                     <motion.div key="mission" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="flex justify-between items-start">
                           <div className="space-y-1">
                              <h2 className="text-[24px] font-black tracking-tighter leading-none">{step <= 2 ? mission?.from : mission?.to}</h2>
                              <div className="flex items-center gap-2 mt-1">
                                 <p className="text-[13px] font-bold text-slate-400">{step <= 2 ? 'Pickup Point' : 'Dropoff Point'}</p>
                                 {step === 1 && distanceToTarget !== null && (
                                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${distanceToTarget <= 30 ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                                       {Math.round(distanceToTarget)}m
                                    </div>
                                 )}
                              </div>
                           </div>
                           <button className="w-12 h-12 rounded-full bg-slate-100/10 flex items-center justify-center"><Phone size={20} /></button>
                        </div>

                        {step === 2 && (
                           <div className="space-y-4">
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Evidence Capture</p>
                              {!evidencePhoto ? (
                                 <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 cursor-pointer">
                                    <Camera className="w-8 h-8 text-slate-300 mb-2" />
                                    <p className="text-[12px] font-bold text-slate-400">Capture Order Photo</p>
                                    <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => {
                                       const file = e.target.files?.[0];
                                       if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => setEvidencePhoto(reader.result as string);
                                          reader.readAsDataURL(file);
                                       }
                                    }} />
                                 </label>
                              ) : (
                                 <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-white/20 shadow-lg">
                                    <img src={evidencePhoto} className="w-full h-full object-cover" />
                                    <button onClick={() => setEvidencePhoto(null)} className="absolute top-2 right-2 p-1 bg-white/90 rounded-full"><X size={12} /></button>
                                 </div>
                              )}
                           </div>
                        )}

                        <div className={`bg-slate-50/5 rounded-2xl p-5 border ${step === 4 ? 'border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Order Bundle</p>
                           <div className="space-y-3">
                              {(mission?.items || []).map((item: any, i: number) => (
                                 <div key={i} className="flex justify-between items-center text-[14px] font-bold">
                                    <span>{item.qty}x {item.name}</span>
                                    <span className="opacity-20">#{mission?.id?.split('-')?.[1] || '0000'}</span>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <button onClick={handleStepUpdate} disabled={isTooFar || (step === 2 && !evidencePhoto)} className="w-full h-16 bg-navy text-white rounded-2xl font-bold shadow-xl disabled:opacity-30 disabled:grayscale transition-all">
                           {step === 1 ? "Arrived at Pickup" : step === 2 ? "Confirm Pickup" : "Arrived at Dropoff"}
                        </button>
                     </motion.div>
                  ) : (
                     <motion.div key="handshake" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-4">
                        <div className="text-center space-y-2">
                           <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-inner">
                              <ShieldCheck className="text-emerald-500" size={32} />
                           </div>
                           <h2 className="text-[28px] font-black text-white tracking-tighter leading-none">Security Sync</h2>
                           <p className="text-[14px] font-bold text-white/40">Enter PIN from {mission?.customer?.name || 'Customer'}</p>
                        </div>

                        <div className="flex justify-center gap-4">
                           {[0, 1, 2, 3].map((i) => (
                              <motion.div 
                                 key={i}
                                 animate={isPinError ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                                 className={`w-14 h-20 rounded-[1.2rem] border-2 flex items-center justify-center text-[32px] font-black transition-all ${
                                    pin[i] ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-white/10 bg-white/5 text-white/20'
                                 } ${isPinError ? 'border-red-500 bg-red-500/10 text-red-500' : ''}`}
                              >
                                 {pin[i] ? '•' : ''}
                              </motion.div>
                           ))}
                        </div>

                        <div className="grid grid-cols-3 gap-3 px-4">
                           {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                              <button key={num} onClick={() => onKeyPress(num)} className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-90 transition-all text-[24px] font-bold">{num}</button>
                           ))}
                           <div className="h-16 flex items-center justify-center opacity-10"><Shield size={20} /></div>
                           <button onClick={() => onKeyPress('0')} className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-90 transition-all text-[24px] font-bold">0</button>
                           <button onClick={() => setPin(prev => prev.slice(0, -1))} className="h-16 rounded-2xl bg-white/5 flex items-center justify-center active:scale-90 transition-all"><ChevronLeft size={24} /></button>
                        </div>

                        {isVerifying && (
                           <div className="flex items-center justify-center gap-3 text-emerald-500 font-bold animate-pulse">
                              <Loader2 size={18} className="animate-spin" />
                              <span className="text-[13px] uppercase tracking-widest">Verifying Protocol...</span>
                           </div>
                        )}
                     </motion.div>
                  )}
               </AnimatePresence>

            </div>
         </motion.div>

      </div>
   );
}

export default function ActiveRunPage() {
   return (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
         <ActiveRunContent />
      </Suspense>
   );
}
