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
import { auth, db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { completeDelivery } from '@/app/actions/deliveryActions';
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
   const [podPhoto, setPodPhoto] = useState<File | null>(null);
   const [podPreview, setPodPreview] = useState<string | null>(null);
   const [isCompleting, setIsCompleting] = useState(false);

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

   const handleCompleteDelivery = async () => {
      if (!auth.currentUser || !mission || !podPhoto) return;
      setIsCompleting(true);
      
      try {
         // 1. Upload PoD to Storage
         const storageRef = ref(storage, `delivery_proofs/${mission.id}_${Date.now()}.jpg`);
         const uploadResult = await uploadBytes(storageRef, podPhoto);
         const proofUrl = await getDownloadURL(uploadResult.ref);

         // 2. Finalize via Server Action
         const res = await completeDelivery(mission.orderId || mission.id, proofUrl);

         if (res.success) {
            // 3. Cleanup Local Runner State
            const userRef = doc(db, 'users', auth.currentUser.uid);
            const snap = await getDoc(userRef);
            const payout = mission.payout || 4.50;
            
            await addDoc(collection(db, 'users', auth.currentUser.uid, 'transactions'), {
               item: mission.title, price: payout, date: new Date().toLocaleString(), timestamp: new Date()
            });

            await updateDoc(userRef, { 
               current_missions: [], 
               balance: (snap.data()?.balance || 0) + payout 
            });

            setStep(6); // Success state
         }
      } catch (error) {
         console.error("PoD Finalization Error:", error);
      } finally {
         setIsCompleting(false);
      }
   };

   const handleStepUpdate = async () => {
      if (!auth.currentUser || !mission || step === null) return;
      const nextStep = step + 1;
      try {
         const userRef = doc(db, 'users', auth.currentUser.uid);
         await updateDoc(userRef, { current_missions: [{ ...mission, step: nextStep }] });
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
            {step === 6 && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-100 bg-white flex flex-col items-center justify-center px-8 text-center">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                     <CheckCircle2 size={48} />
                  </div>
                  <h1 className="text-[14px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2">Drop-off Verified</h1>
                  <p className="text-[48px] font-black text-navy tracking-tighter leading-none mb-12">+RM {mission?.payout?.toFixed(2) || '4.50'}</p>
                  <button onClick={() => router.push('/run')} className="w-full h-16 bg-navy text-white rounded-2xl font-bold">Dismiss & Return</button>
               </motion.div>
            )}
         </AnimatePresence>

         <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-12 pb-4 flex items-center justify-between bg-white/90 backdrop-blur-xl border-b border-slate-50">
            <button onClick={() => router.back()} className="p-2 -ml-2 bg-slate-50 rounded-full text-navy/40"><X size={20} /></button>
            <div className="flex flex-col items-center">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{mission?.id || 'PULSE-0000'}</p>
                <h1 className="text-[15px] font-bold text-navy">
                   {step === 5 ? "Proof of Delivery" : step === 4 ? "At Dropoff" : step === 3 ? "In Transit" : step === 2 ? "At Vendor" : "To Pickup"}
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
                   {step <= 4 ? (
                      <motion.div key="mission" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                         <div className="flex justify-between items-start">
                            <div className="space-y-1">
                               <h2 className="text-[24px] font-black tracking-tighter leading-none">{step <= 2 ? mission?.from : mission?.to}</h2>
                               <div className="flex items-center gap-2 mt-1">
                                  <p className="text-[13px] font-bold text-slate-400">{step <= 2 ? 'Pickup Point' : 'Dropoff Point'}</p>
                                  {(step === 1 || step === 4) && distanceToTarget !== null && (
                                     <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${distanceToTarget <= 30 ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                                        {Math.round(distanceToTarget)}m
                                     </div>
                                  )}
                               </div>
                            </div>
                            <button className="w-12 h-12 rounded-full bg-slate-100/10 flex items-center justify-center"><Phone size={20} /></button>
                         </div>

                         {(step === 2 || step === 5) && (
                            <div className="space-y-4">
                               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{step === 5 ? 'Drop-off Proof' : 'Evidence Capture'}</p>
                               {!(step === 5 ? podPreview : evidencePhoto) ? (
                                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 cursor-pointer">
                                     <Camera className="w-8 h-8 text-slate-300 mb-2" />
                                     <p className="text-[12px] font-bold text-slate-400">Capture {step === 5 ? 'Drop-off' : 'Order'} Photo</p>
                                     <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                           if (step === 5) {
                                              setPodPhoto(file);
                                              setPodPreview(URL.createObjectURL(file));
                                           } else {
                                              const reader = new FileReader();
                                              reader.onloadend = () => setEvidencePhoto(reader.result as string);
                                              reader.readAsDataURL(file);
                                           }
                                        }
                                     }} />
                                  </label>
                               ) : (
                                  <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-white/20 shadow-lg">
                                     <img src={(step === 5 ? podPreview : evidencePhoto) as string} className="w-full h-full object-cover" />
                                     <button onClick={() => step === 5 ? setPodPreview(null) : setEvidencePhoto(null)} className="absolute top-2 right-2 p-1 bg-white/90 rounded-full"><X size={12} /></button>
                                  </div>
                               )}
                            </div>
                         )}

                         <div className={`bg-slate-50/5 rounded-2xl p-5 border ${step === 5 ? 'bg-navy border-white/10 text-white' : 'bg-slate-50 border-slate-100'}`}>
                            <p className={`text-[11px] font-black uppercase tracking-widest mb-3 ${step === 5 ? 'text-white/40' : 'text-slate-400'}`}>Order Bundle</p>
                            <div className="space-y-3">
                               {(mission?.items || []).map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between items-center text-[14px] font-bold">
                                     <span>{item.qty}x {item.name}</span>
                                     <span className="opacity-20">#{mission?.id?.split('-')?.[1] || '0000'}</span>
                                  </div>
                               ))}
                            </div>
                         </div>

                         <button 
                           onClick={step === 5 ? handleCompleteDelivery : handleStepUpdate} 
                           disabled={isTooFar || (step === 2 && !evidencePhoto) || (step === 5 && !podPhoto) || isCompleting} 
                           className="w-full h-16 bg-navy text-white rounded-2xl font-bold shadow-xl disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-3"
                         >
                            {isCompleting && <Loader2 size={20} className="animate-spin" />}
                            {step === 1 ? "Arrived at Pickup" : 
                             step === 2 ? "Confirm Pickup" : 
                             step === 3 ? "Arrived at Dropoff" : 
                             step === 4 ? "Capture Proof" : "Confirm Completion"}
                         </button>
                      </motion.div>
                   ) : (
                      <div className="py-8 text-center space-y-6">
                         <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                            <Camera size={36} />
                         </div>
                         <div>
                            <h2 className="text-[28px] font-black text-navy tracking-tighter leading-none">Photo Proof</h2>
                            <p className="text-[14px] font-bold text-slate-400 mt-2">Capture the item at the drop-off location</p>
                         </div>
                         
                         {podPreview ? (
                            <div className="relative w-full h-48 rounded-3xl overflow-hidden border-2 border-slate-100 shadow-xl">
                               <img src={podPreview} className="w-full h-full object-cover" />
                               <button onClick={() => setPodPreview(null)} className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-lg"><X size={16} /></button>
                            </div>
                         ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all">
                               <Camera className="w-10 h-10 text-slate-300 mb-4" />
                               <p className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Open Camera</p>
                               <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                     setPodPhoto(file);
                                     setPodPreview(URL.createObjectURL(file));
                                  }
                               }} />
                            </label>
                         )}

                         <button 
                            onClick={handleCompleteDelivery} 
                            disabled={!podPhoto || isCompleting} 
                            className="w-full h-18 bg-navy text-white rounded-[1.5rem] font-black text-[14px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-navy/20 disabled:opacity-20"
                         >
                            {isCompleting && <Loader2 size={20} className="animate-spin" />}
                            {isCompleting ? "Processing..." : "Complete Drop-off"}
                         </button>
                      </div>
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
