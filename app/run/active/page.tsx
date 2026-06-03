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
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';
import MapErrorBoundary from '@/components/shared/MapErrorBoundary';

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
const DROPOFF_COORD = { lat: 3.1725, lng: 101.7545 }; 

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

const ChecklistMissionView = ({ mission, onComplete }: { mission: any, onComplete: (payout: number) => void }) => {
  const [step, setStep] = useState(mission.status === 'PICKED_UP' ? 2 : 1);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  
  const handleConfirmPickup = async () => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'orders', mission.orderId || mission.id), { status: 'RUNNER_DELIVERING' });
      setStep(2);
    } catch (e) {
      console.error(e);
    }
    setIsProcessing(false);
  };

  const handleCompleteDelivery = async () => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, 'orders', mission.orderId || mission.id), { status: 'DELIVERED', completed_at: new Date().toISOString() });
      onComplete(mission.total_price || mission.payout || 4.5);
    } catch (e) {
      console.error(e);
    }
    setIsProcessing(false);
  };

  const getPhone = (locationStr: string) => {
    const match = locationStr?.match(/\(([^,]+),\s*([^)]+)\)/);
    return match ? match[2] : '';
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col pt-12 pb-10 font-sans antialiased text-slate-900">
      <nav className="px-6 pb-6 flex items-center justify-between border-b border-slate-100">
         <button onClick={() => router.push('/run/terminal')} className="w-10 h-10 flex items-center justify-start text-slate-400 active:scale-95 transition-all">
           <ChevronLeft size={24} />
         </button>
         <h1 className="text-[15px] font-bold text-slate-900">Active Mission</h1>
         <div className="text-right">
           <p className="text-[18px] font-black text-emerald-500">RM {(mission.total_price || mission.payout || 4.5).toFixed(2)}</p>
         </div>
      </nav>

      <div className="px-6 space-y-6 flex-1 pt-6">
        {/* Mission Brief */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
           <div className="flex items-start justify-between gap-4">
             <div>
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{mission.type || 'DELIVERY'}</p>
               <h2 className="text-[20px] font-black text-slate-900 mt-1 leading-tight">{mission.items_summary || mission.title}</h2>
               <p className="text-[13px] font-bold text-slate-500 mt-2">Requested by {mission.buyer_name}</p>
             </div>
             {mission.attached_file && (
               <div className="w-16 h-16 rounded-2xl bg-slate-100 shrink-0 overflow-hidden shadow-inner">
                 <img src={mission.attached_file} className="w-full h-full object-cover" alt="Item" />
               </div>
             )}
           </div>
        </div>

        {/* Phase 1: Pickup */}
        <div className={`rounded-[24px] p-6 border transition-all duration-500 ${step === 1 ? 'bg-white shadow-md border-slate-200' : 'bg-slate-50/50 border-transparent opacity-60'}`}>
           <div className="flex items-center gap-3 mb-4">
             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${step === 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
             <p className="text-[14px] font-black uppercase tracking-widest text-slate-900">Secure the Item</p>
           </div>
           
           <div className="space-y-4">
             <div className="flex items-start gap-3 bg-[#FDFDFD] border border-slate-100 p-4 rounded-2xl">
               <MapPin className="text-slate-400 shrink-0 mt-0.5" size={18} />
               <div>
                 <p className="text-[13px] font-bold text-slate-900 leading-relaxed">{mission.pickup_location}</p>
               </div>
             </div>
             
             {step === 1 && (
               <div className="grid grid-cols-[1fr_2fr] gap-3 pt-2">
                 <a href={`tel:${getPhone(mission.pickup_location)}`} className="h-14 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center font-bold active:scale-95 transition-all shadow-sm">
                   <Phone size={18} />
                 </a>
                 <button onClick={handleConfirmPickup} disabled={isProcessing} className="h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all shadow-md shadow-slate-900/20 disabled:opacity-50">
                   {isProcessing ? <Loader2 size={18} className="animate-spin" /> : "Confirm Pickup"}
                 </button>
               </div>
             )}
             {step > 1 && (
               <div className="flex items-center gap-2 text-emerald-500 font-bold text-[13px] pt-2">
                 <CheckCircle2 size={18} strokeWidth={3} /> Item Secured
               </div>
             )}
           </div>
        </div>

        {/* Phase 2: Drop-off */}
        <div className={`rounded-[24px] p-6 border transition-all duration-500 ${step === 2 ? 'bg-white shadow-md border-emerald-100' : 'bg-slate-50/50 border-transparent opacity-60'}`}>
           <div className="flex items-center gap-3 mb-4">
             <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${step === 2 ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-200 text-slate-500'}`}>2</div>
             <p className="text-[14px] font-black uppercase tracking-widest text-slate-900">Final Handover</p>
           </div>
           
           <div className="space-y-4">
             <div className="flex items-start gap-3 bg-[#FDFDFD] border border-slate-100 p-4 rounded-2xl">
               <Navigation2 className="text-slate-400 shrink-0 mt-0.5" size={18} />
               <div>
                 <p className="text-[13px] font-bold text-slate-900 leading-relaxed">{mission.drop_off_location}</p>
               </div>
             </div>
             
             {step === 2 && (
               <div className="grid grid-cols-[1fr_2fr] gap-3 pt-2">
                 <a href={`tel:${getPhone(mission.drop_off_location)}`} className="h-14 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl flex items-center justify-center font-bold active:scale-95 transition-all shadow-sm">
                   <Phone size={18} />
                 </a>
                 <button onClick={handleCompleteDelivery} disabled={isProcessing} className="h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all shadow-md shadow-emerald-500/30 disabled:opacity-50">
                   {isProcessing ? <Loader2 size={18} className="animate-spin" /> : "Complete Delivery"}
                 </button>
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

function ActiveRunContent({ initialMission }: { initialMission: any }) {
   const router = useRouter();
   const [step, setStep] = useState<number>(initialMission.step || 1); 
   const [mission, setMission] = useState<any>(initialMission);
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
      if (!auth.currentUser) return;
      const unsubSnapshot = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
         if (docSnap.exists()) {
            const data = docSnap.data();
            const activeMission = data.current_missions?.[0];
            if (activeMission) {
               setMission(activeMission);
               setStep(activeMission.step || 1);
            }
         }
      });
      return () => unsubSnapshot();
   }, []);

    useEffect(() => {
       if (typeof window === 'undefined' || !navigator.geolocation) return;
       let lastWriteTime = 0;
       const watchId = navigator.geolocation.watchPosition(async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          if (step === 1) {
             const dist = getDistance(coords.lat, coords.lng, PICKUP_COORD.lat, PICKUP_COORD.lng);
             setDistanceToTarget(dist);
          }
          if (step === 3 && mission) {
             const now = Date.now();
             if (now - lastWriteTime > 5000) {
                lastWriteTime = now;
                try {
                   await updateDoc(doc(db, 'orders', mission.orderId || mission.id), {
                      runner_location: { latitude: coords.lat, longitude: coords.lng },
                      runner_location_updated_at: new Date().toISOString()
                   });
                } catch (err) { }
             }
          }
       }, (err) => console.warn("Geolocation denied:", err), { enableHighAccuracy: true });
       return () => navigator.geolocation.clearWatch(watchId);
    }, [step, mission]);

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
     } catch (e) { }
   }, [isApiConfigured, isLoaded, mission, step]);

   const handleCompleteDelivery = async () => {
      if (!auth.currentUser || !mission || !podPhoto) return;
      setIsCompleting(true);
      
      try {
         const storageRef = ref(storage, `delivery_proofs/${mission.id}_${Date.now()}.jpg`);
         const uploadResult = await uploadBytes(storageRef, podPhoto);
         const proofUrl = await getDownloadURL(uploadResult.ref);

         const res = await completeDelivery(mission.orderId || mission.id, proofUrl);

         if (res.success) {
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

            setStep(6); 
         }
      } catch (error) {
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

   const isTooFar = step === 1 && distanceToTarget !== null && distanceToTarget > 30;

   return (
      <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-900 antialiased overflow-hidden">
         <AnimatePresence>
            {step === 6 && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-100 bg-white flex flex-col items-center justify-center px-8 text-center">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                     <CheckCircle2 size={48} />
                  </div>
                  <h1 className="text-[14px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2">Drop-off Verified</h1>
                  <p className="text-[48px] font-black text-slate-900 tracking-tighter leading-none mb-12">+RM {mission?.payout?.toFixed(2) || '4.50'}</p>
                  <button onClick={() => router.push('/run')} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-bold">Dismiss & Return</button>
               </motion.div>
            )}
         </AnimatePresence>

         <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-12 pb-4 flex items-center justify-between bg-white/90 backdrop-blur-xl border-b border-slate-50">
            <button onClick={() => router.back()} className="p-2 -ml-2 bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
            <div className="flex flex-col items-center">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{mission?.id || 'PULSE-0000'}</p>
                <h1 className="text-[15px] font-bold text-slate-900">
                   {step === 5 ? "Proof of Delivery" : step === 4 ? "At Dropoff" : step === 3 ? "In Transit" : step === 2 ? "At Vendor" : "To Pickup"}
                </h1>
            </div>
            <button className="p-2 bg-red-50 text-red-500 rounded-full"><ShieldAlert size={20} /></button>
         </nav>

         <div className="absolute inset-0 z-0 pt-28">
            <MapErrorBoundary>
               {isApiConfigured && isLoaded ? (
                  <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={step <= 2 ? PICKUP_COORD : DROPOFF_COORD} zoom={17} options={MAP_OPTIONS as any}>
                     {directions && <DirectionsRenderer directions={directions} options={{ 
                        suppressMarkers: true,
                        polylineOptions: { strokeColor: '#0f172a', strokeWeight: 3, strokeOpacity: 0.8 } 
                     }} />}
                     
                     {step <= 2 && <Marker position={PICKUP_COORD} label={{ text: '1', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 14, fillColor: '#0f172a', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }} />}
                     {step >= 3 && <Marker position={DROPOFF_COORD} label={{ text: '2', color: '#0f172a', fontSize: '12px', fontWeight: 'bold' }} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 14, fillColor: '#fff', fillOpacity: 1, strokeColor: '#0f172a', strokeWeight: 2 }} />}
                  </GoogleMap>
               ) : (
                  <div className="w-full h-full bg-[#FDFDFD] flex items-center justify-center opacity-10">
                     <MapPin size={64} strokeWidth={1} />
                  </div>
               )}
            </MapErrorBoundary>
         </div>

         <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-8">
            <div className={`bg-white/95 backdrop-blur-2xl border border-white shadow-md rounded-[2.5rem] p-7 pt-8 transition-all duration-500 ${step === 4 ? 'bg-slate-900 text-white' : ''}`}>
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
                             <div className="flex gap-2">
                               <button 
                                 onClick={() => {
                                   const target = step <= 2 ? PICKUP_COORD : DROPOFF_COORD;
                                   window.location.href = `https://waze.com/ul?ll=${target.lat},${target.lng}&navigate=yes`;
                                 }}
                                 className="h-12 px-5 rounded-full bg-blue-50 text-slate-900 font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                               >
                                 <Navigation size={16} /> Waze
                               </button>
                               <button className="w-12 h-12 rounded-full bg-slate-100/10 flex items-center justify-center border border-slate-100"><Phone size={20} /></button>
                             </div>
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
                                  <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-white/20 shadow-md">
                                     <img src={(step === 5 ? podPreview : evidencePhoto) as string} className="w-full h-full object-cover" />
                                     <button onClick={() => step === 5 ? setPodPreview(null) : setEvidencePhoto(null)} className="absolute top-2 right-2 p-1 bg-white/90 rounded-full"><X size={12} /></button>
                                  </div>
                               )}
                            </div>
                         )}

                         <div className={`bg-slate-50/5 rounded-2xl p-5 border ${step === 5 ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-100'}`}>
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
                           className="w-full h-16 bg-slate-900 text-white rounded-2xl font-bold shadow-md disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-3"
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
                            <h2 className="text-[28px] font-black text-slate-900 tracking-tighter leading-none">Photo Proof</h2>
                            <p className="text-[14px] font-bold text-slate-400 mt-2">Capture the item at the drop-off location</p>
                         </div>
                         
                         {podPreview ? (
                            <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-md">
                               <img src={podPreview} className="w-full h-full object-cover" />
                               <button onClick={() => setPodPreview(null)} className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow-md"><X size={16} /></button>
                            </div>
                         ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-all">
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
                            className="w-full h-18 bg-slate-900 text-white rounded-[1.5rem] font-black text-[14px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-md shadow-slate-900/20 disabled:opacity-20"
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

function ActiveRunGate() {
  const router = useRouter();
  const [mission, setMission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(0);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
       if (!user) { router.push('/auth'); return; }
       const unsubSnapshot = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
             const data = docSnap.data();
             const activeMission = data.current_missions?.[0];
             if (activeMission) {
                setMission(activeMission);
             } else if (mission) {
                // Was active but now empty -> completed or cancelled
             } else {
                router.push('/run/terminal');
             }
          }
          setLoading(false);
       });
       return () => unsubSnapshot();
    });
    return () => unsubAuth();
  }, [router]);

  const handleMissionComplete = async (payout: number) => {
     if (!auth.currentUser) return;
     const userRef = doc(db, 'users', auth.currentUser.uid);
     const snap = await getDoc(userRef);
     
     await addDoc(collection(db, 'users', auth.currentUser.uid, 'transactions'), {
        item: mission.items_summary || mission.title, price: payout, date: new Date().toLocaleString(), timestamp: new Date()
     });

     await updateDoc(userRef, { 
        current_missions: [], 
        balance: (snap.data()?.balance || 0) + payout 
     });
     
     setPayoutAmount(payout);
     setShowSuccess(true);
  };

  if (loading) return <div className="min-h-screen bg-[#FDFDFD]" />;

  if (showSuccess) {
    return (
       <div className="fixed inset-0 z-100 bg-white flex flex-col items-center justify-center px-8 text-center">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
             <CheckCircle2 size={48} />
          </div>
          <h1 className="text-[14px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2">Drop-off Verified</h1>
          <p className="text-[48px] font-black text-slate-900 tracking-tighter leading-none mb-12">+RM {payoutAmount.toFixed(2)}</p>
          <button onClick={() => router.push('/run/terminal')} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-bold active:scale-95 transition-all">Dismiss & Return</button>
       </div>
    );
  }

  if (!mission) return null;

  if (mission.type === 'PARCELS' || mission.type === 'ERRANDS') {
     return <ChecklistMissionView mission={mission} onComplete={handleMissionComplete} />;
  }

  return <ActiveRunContent initialMission={mission} />;
}

export default function ActiveRunPage() {
   return (
      <Suspense fallback={<div className="min-h-screen bg-white" />}>
         <ActiveRunGate />
      </Suspense>
   );
}
