'use client'
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Navigation, Phone, MessageSquare, CheckCircle2, 
  AlertTriangle, ShieldAlert, Package, Navigation2, Loader2,
  Clock, MapPin, ArrowRight, ShieldCheck, Star, Zap, X,
  Camera, Upload, Info, Lock, Shield, User, Store
} from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { completeDelivery } from '@/app/actions/deliveryActions';
import { doc, onSnapshot, updateDoc, getDoc, addDoc, collection, query, where } from 'firebase/firestore';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';
import MapErrorBoundary from '@/components/shared/MapErrorBoundary';
import BackButton from '@/components/shared/BackButton';
import { parseLocationToken, getLocationBadge } from '@/lib/core/locations';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const MAP_OPTIONS = {
  disableDefaultUI: true,
  styles: [
    { "elementType": "geometry", "stylers": [{ "color": "#f8fafc" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#f1f5f9" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e2e8f0" }] }
  ]
};

const PICKUP_COORD = { lat: 3.1718, lng: 101.7538 }; 
const DROPOFF_COORD = { lat: 3.1725, lng: 101.7545 }; 

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const 1 = lat1 * Math.PI/180;
  const 2 = lat2 * Math.PI/180;
  const  = (lat2-lat1) * Math.PI/180;
  const  = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(/2) * Math.sin(/2) + Math.cos(1) * Math.cos(2) * Math.sin(/2) * Math.sin(/2);
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
    <div className="min-h-screen bg-white flex flex-col pt-6 pb-10 font-sans antialiased text-slate-900">
      <nav className="px-6 pb-5 flex items-center justify-between border-b border-slate-100">
         <div className="flex items-center gap-3">
           <button onClick={() => router.push('/run/terminal')} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all">
             <ChevronLeft size={20} />
           </button>
           <div>
             <h1 className="text-[14px] font-bold text-slate-900">Custom Delivery</h1>
             <p className="text-[11px] font-medium text-[#94a3b8]">{mission.id || 'Active Mission'}</p>
           </div>
         </div>
         <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-bold">
           RM {(mission.total_price || mission.payout || 4.5).toFixed(2)}
         </div>
      </nav>

      <div className="px-6 space-y-6 flex-1 pt-8">
        
        {/* Mission Brief (Checkout Vibe) */}
        <div className="space-y-1">
           <p className="text-[11px] font-semibold text-slate-400 ">{mission.type || 'PARCEL ERRAND'}</p>
           <h2 className="text-[22px] font-semibold tracking-tight leading-none text-slate-900">
              {mission.items_summary || mission.title || "Custom Errand"}
           </h2>
           <p className="text-[13px] font-medium text-[#94a3b8] mt-1">Requested by <span className="font-bold text-slate-900">{mission.buyer_name}</span></p>
        </div>

        {mission.attached_file && (
           <div className="w-full h-32 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative">
             <img src={mission.attached_file} className="w-full h-full object-cover opacity-90" alt="Item Proof" />
             <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-semibold text-slate-600  shadow-sm">
                Item Photo
             </div>
           </div>
        )}

        <div className="space-y-4">
           <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">Delivery Checklist</h3>

           {/* Phase 1: Pickup */}
           <div className={`rounded-2xl p-5 border transition-all duration-300 ${step === 1 ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-white border-slate-100 opacity-70'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-semibold ${step === 1 ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'bg-slate-100 text-slate-400'}`}>1</div>
                <p className="text-[13px] font-bold text-slate-900">Secure the Item</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-white border border-slate-100 p-3.5 rounded-xl">
                  <User className="text-slate-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400  mb-0.5">Pickup Point</p>
                    <p className="text-[13px] font-bold text-slate-900 leading-snug">{mission.pickup_location}</p>
                  </div>
                </div>
                
                {step === 1 && (
                  <div className="grid grid-cols-[1fr_2.5fr] gap-3 pt-2">
                    <a href={`tel:${getPhone(mission.pickup_location)}`} className="h-12 bg-white border border-slate-200 text-blue-600 rounded-xl flex items-center justify-center font-bold active:scale-95 transition-all shadow-sm">
                      <Phone size={16} />
                    </a>
                    <button onClick={handleConfirmPickup} disabled={isProcessing} className="h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all shadow-md shadow-slate-900/10 disabled:opacity-50">
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : "Confirm Pickup"}
                    </button>
                  </div>
                )}
                {step > 1 && (
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-[12px] pt-1">
                    <CheckCircle2 size={16} strokeWidth={2.5} /> Item Secured successfully
                  </div>
                )}
              </div>
           </div>

           {/* Phase 2: Drop-off */}
           <div className={`rounded-2xl p-5 border transition-all duration-300 ${step === 2 ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-white border-slate-100 opacity-50'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-semibold ${step === 2 ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'bg-slate-100 text-slate-400'}`}>2</div>
                <p className="text-[13px] font-bold text-slate-900">Final Handover</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-white border border-slate-100 p-3.5 rounded-xl">
                  <MapPin className="text-slate-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400  mb-0.5">Drop-off Point</p>
                    <p className="text-[13px] font-bold text-slate-900 leading-snug">{mission.drop_off_location}</p>
                  </div>
                </div>
                
                {step === 2 && (
                  <div className="grid grid-cols-[1fr_2.5fr] gap-3 pt-2">
                    <a href={`tel:${getPhone(mission.drop_off_location)}`} className="h-12 bg-white border border-slate-200 text-blue-600 rounded-xl flex items-center justify-center font-bold active:scale-95 transition-all shadow-sm">
                      <Phone size={16} />
                    </a>
                    <button onClick={handleCompleteDelivery} disabled={isProcessing} className="h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all shadow-md shadow-slate-900/10 disabled:opacity-50">
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : "Complete Delivery"}
                    </button>
                  </div>
                )}
              </div>
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
   const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
   const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
   const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);
   const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
   const [podPhoto, setPodPhoto] = useState<File | null>(null);
   const [podPreview, setPodPreview] = useState<string | null>(null);
   const [isCompleting, setIsCompleting] = useState(false);

   // Parse locations
   const pickupNode = mission?.pickup_location ? parseLocationToken(mission.pickup_location) : null;
   const dropoffNode = mission?.drop_off_location ? parseLocationToken(mission.drop_off_location) : null;
   const isPremiumDropoff = dropoffNode?.tier === 'PREMIUM';

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
        const pickupNode = parseLocationToken(mission.pickup_location || '');
        const dropoffNode = parseLocationToken(mission.drop_off_location || '');
        const origin = step <= 2 ? pickupNode.label : dropoffNode.label;
        const destination = step <= 2 ? dropoffNode.label : pickupNode.label;
        const directionsService = new google.maps.DirectionsService();
        directionsService.route({
           origin: origin || "UniKL City Campus",
           destination: destination || "UniKL City Campus",
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

         const res = await completeDelivery(mission.orderId || mission.id, proofUrl, auth.currentUser.uid);

         if (res.success) {
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
      <div className="min-h-screen bg-white font-sans text-slate-900 antialiased overflow-hidden">
         <AnimatePresence>
            {step === 6 && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-100 bg-white flex flex-col items-center justify-center px-8 text-center">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                     <CheckCircle2 size={40} />
                  </div>
                  <h1 className="text-[14px] font-semibold  text-blue-600 mb-2">Delivery Verified</h1>
                  <p className="text-[42px] font-semibold text-slate-900 tracking-tighter leading-none mb-10">+RM {mission?.payout?.toFixed(2) || '4.50'}</p>
                  <button onClick={() => router.push('/run')} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold shadow-md shadow-slate-900/10 active:scale-95 transition-all">Dismiss & Return</button>
               </motion.div>
            )}
         </AnimatePresence>

         <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-8 pb-4 flex items-center justify-between bg-white/90 backdrop-blur-xl border-b border-slate-100">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all"><ChevronLeft size={20} /></button>
            <div className="flex flex-col items-center">
                <h1 className="text-[14px] font-bold text-slate-900">
                   {step === 5 ? "Proof of Delivery" : step === 4 ? "At Drop-off" : step === 3 ? "In Transit" : step === 2 ? "At Merchant" : "To Merchant"}
                </h1>
               <p className="text-[11px] font-medium text-[#94a3b8] mt-0.5">{mission?.id || 'PULSE-0000'}</p>
            </div>
            <button className="w-10 h-10 rounded-xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center"><ShieldAlert size={18} /></button>
         </nav>

         <div className="absolute inset-0 z-0 pt-24 pb-48">
            <MapErrorBoundary>
               {isApiConfigured && isLoaded ? (
                  <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={step <= 2 ? PICKUP_COORD : DROPOFF_COORD} zoom={17} options={MAP_OPTIONS as any}>
                     {directions && <DirectionsRenderer directions={directions} options={{ 
                        suppressMarkers: true,
                        polylineOptions: { strokeColor: '#2563eb', strokeWeight: 4, strokeOpacity: 0.8 } 
                     }} />}
                     
                     {step <= 2 && <Marker position={PICKUP_COORD} label={{ text: '1', color: '#fff', fontSize: '11px', fontWeight: 'bold' }} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: '#2563eb', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }} />}
                     {step >= 3 && <Marker position={DROPOFF_COORD} label={{ text: '2', color: '#2563eb', fontSize: '11px', fontWeight: 'bold' }} icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: '#fff', fillOpacity: 1, strokeColor: '#2563eb', strokeWeight: 2 }} />}
                  </GoogleMap>
               ) : (
                  <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center opacity-40">
                     <MapPin size={48} className="text-slate-300" />
                     <p className="text-[12px] font-bold text-slate-400 mt-2">Map Unavailable</p>
                  </div>
               )}
            </MapErrorBoundary>
         </div>

         <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-6">
            <div className={`bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-6 transition-all duration-500 ${step === 4 ? 'bg-slate-50' : ''}`}>
                <AnimatePresence mode="wait">
                   {step <= 4 ? (
                      <motion.div key="mission" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                         <div className="flex justify-between items-start">
                            <div className="space-y-1">
                               <h2 className="text-[20px] font-semibold tracking-tight leading-none text-slate-900">
                                 {step <= 2 ? (pickupNode?.label || mission?.from || 'Merchant Area') : (dropoffNode?.label || mission?.to || 'Drop-off Zone')}
                               </h2>
                               <div className="flex items-center gap-2 mt-1.5">
                                  <p className="text-[12px] font-medium text-[#94a3b8]">{step <= 2 ? 'Pickup Point' : 'Drop-off Point'}</p>
                                  {step > 2 && dropoffNode && (
                                     <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold  ${getLocationBadge(dropoffNode.zone)}`}>
                                       {dropoffNode.zone}
                                     </span>
                                  )}
                                  {(step === 1 || step === 4) && distanceToTarget !== null && (
                                     <div className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase shadow-sm ${distanceToTarget <= 30 ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' : 'bg-amber-50 border border-amber-100 text-amber-600'}`}>
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
                                 className="h-10 px-4 rounded-xl bg-slate-50 border border-slate-100 text-blue-600 font-bold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                               >
                                 <Navigation size={14} /> Waze
                               </button>
                               <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center active:scale-95 transition-transform"><Phone size={16} /></button>
                             </div>
                         </div>

                         {/* Premium Warning Banner */}
                         {step > 2 && isPremiumDropoff && (
                           <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl flex items-start gap-3">
                             <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
                               <Lock size={16} />
                             </div>
                             <div className="space-y-0.5 pt-0.5">
                               <p className="text-[12px] font-semibold text-indigo-950  leading-none">Direct-to-Door</p>
                               <p className="text-[11px] font-semibold text-indigo-700 leading-snug">
                                 Requires Resident Access Card coordination at Lift Core. Wait for the buyer at the lobby.
                               </p>
                             </div>
                           </div>
                         )}

                         {(step === 2 || step === 5) && (
                            <div className="space-y-3">
                               <p className="text-[11px] font-semibold text-slate-400 ">{step === 5 ? 'Drop-off Proof' : 'Item Capture'}</p>
                               {!(step === 5 ? podPreview : evidencePhoto) ? (
                                  <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                                     <Camera className="w-6 h-6 text-slate-400 mb-1" />
                                     <p className="text-[11px] font-bold text-slate-500">Capture {step === 5 ? 'Drop-off' : 'Order'} Photo</p>
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
                                  <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                     <img src={(step === 5 ? podPreview : evidencePhoto) as string} className="w-full h-full object-cover" />
                                     <button onClick={() => step === 5 ? setPodPreview(null) : setEvidencePhoto(null)} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm"><X size={12} /></button>
                                  </div>
                               )}
                            </div>
                         )}

                         <div className={`rounded-2xl p-4 border ${step === 5 ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-slate-100'}`}>
                            <p className="text-[10px] font-semibold mb-2.5 text-slate-400">Order Bundle</p>
                            <div className="space-y-2">
                               {(mission?.items || []).map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between items-center text-[13px] font-bold text-slate-900">
                                     <span>{item.qty}x {item.name || item.title}</span>
                                     <span className="text-slate-300">#{mission?.id?.split('-')?.[1] || '0000'}</span>
                                  </div>
                               ))}
                            </div>
                         </div>

                         <button 
                           onClick={step === 5 ? handleCompleteDelivery : handleStepUpdate} 
                           disabled={isTooFar || (step === 2 && !evidencePhoto) || (step === 5 && !podPhoto) || isCompleting} 
                           className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold shadow-md shadow-slate-900/10 disabled:opacity-30 disabled:shadow-none transition-all flex items-center justify-center gap-2 active:scale-95 text-[14px]"
                         >
                            {isCompleting && <Loader2 size={18} className="animate-spin" />}
                            {step === 1 ? "Arrived at Pickup" : 
                             step === 2 ? "Confirm Pickup" : 
                             step === 3 ? "Arrived at Drop-off" : 
                             step === 4 ? "Capture Proof" : "Confirm Completion"}
                         </button>
                      </motion.div>
                   ) : (
                      <div className="py-6 text-center space-y-5">
                         <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                            <Camera size={28} />
                         </div>
                         <div>
                            <h2 className="text-[20px] font-semibold text-slate-900 tracking-tight leading-none">Photo Proof</h2>
                            <p className="text-[12px] font-medium text-[#94a3b8] mt-1.5">Capture the item at the drop-off location</p>
                         </div>
                         
                         {podPreview ? (
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                               <img src={podPreview} className="w-full h-full object-cover" />
                               <button onClick={() => setPodPreview(null)} className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-md"><X size={14} /></button>
                            </div>
                         ) : (
                            <label className="flex flex-col items-center justify-center w-full h-40 border border-dashed border-slate-300 rounded-2xl bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition-all">
                               <Camera className="w-8 h-8 text-slate-300 mb-3" />
                               <p className="text-[12px] font-semibold text-slate-400 ">Open Camera</p>
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
                            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 disabled:opacity-30 disabled:shadow-none active:scale-95 transition-all"
                         >
                            {isCompleting && <Loader2 size={18} className="animate-spin" />}
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
    let unsubActive: (() => void) | null = null;
    const unsubAuth = auth.onAuthStateChanged((user) => {
       if (!user) { router.push('/auth'); return; }
       const qActive = query(
          collection(db, "orders"), 
          where("runner_id", "==", user.uid), 
          where("status", "in", ["PREPARING", "READY_FOR_PICKUP", "IN_TRANSIT", "PICKED_UP", "RUNNER_DELIVERING", "ARRIVED_AT_DESTINATION"])
       );
       unsubActive = onSnapshot(qActive, (snap) => {
          if (!snap.empty) {
             setMission({ id: snap.docs[0].id, ...snap.docs[0].data() });
          } else {
             setMission(null);
          }
          setLoading(false);
       });
    });
    return () => {
       unsubAuth();
       if (unsubActive) unsubActive();
    };
  }, [router]);

  useEffect(() => {
     if (!loading && !mission && !showSuccess) {
        router.push('/run/terminal');
     }
  }, [loading, mission, showSuccess, router]);

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

  if (loading) return (
     <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" />
     </div>
  );

  if (showSuccess) {
    return (
       <div className="fixed inset-0 z-100 bg-white flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
             <CheckCircle2 size={40} />
          </div>
          <h1 className="text-[13px] font-semibold  text-blue-600 mb-2">Drop-off Verified</h1>
          <p className="text-[42px] font-semibold text-slate-900 tracking-tighter leading-none mb-10">+RM {payoutAmount.toFixed(2)}</p>
          <button onClick={() => router.push('/run/terminal')} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold shadow-md shadow-slate-900/10 active:scale-95 transition-all">Dismiss & Return</button>
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
