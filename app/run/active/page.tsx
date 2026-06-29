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
import { doc, onSnapshot, updateDoc, getDoc, addDoc, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api';
import MapErrorBoundary from '@/components/shared/MapErrorBoundary';
import BackButton from '@/components/shared/BackButton';
import { parseLocationToken, getLocationBadge } from '@/lib/core/locations';
import { completeDelivery } from '@/app/actions/deliveryActions';
import { calculateDistance, getDropOffCoords } from '@/lib/core/locations';

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

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) reject(new Error('Geolocation not supported'));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 10000, maximumAge: 5000
    });
  });
}

// Default coordinates if mission ones missing
const CAMPUS_CENTER = { lat: 3.1594, lng: 101.6998 };

const ChecklistMissionView = ({ mission, onComplete }: { mission: any, onComplete: (payout: number) => void }) => {
  const [step, setStep] = useState(mission.status === 'PICKED_UP' ? 2 : 1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [podPhoto, setPodPhoto] = useState<File | null>(null);
  const [podPreview, setPodPreview] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [pickupPhoto, setPickupPhoto] = useState<File | null>(null);
  const [pickupPreview, setPickupPreview] = useState<string | null>(null);
  const router = useRouter();
  
  const handleConfirmPickup = async () => {
    if (!pickupPhoto) {
      alert('Please take a photo first');
      return;
    }
    if (!auth.currentUser || !mission) {
      alert('Session error - please refresh');
      return;
    }
    setIsProcessing(true);
    try {
      const uid = auth.currentUser.uid;
      const orderId = mission.id;
      const fileName = Date.now() + '_' + orderId + '.jpg';
      const storageRef = ref(storage, 'delivery_proofs/' + fileName);
      const snap = await uploadBytes(storageRef, pickupPhoto);
      const url = await getDownloadURL(snap.ref);
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'PICKED_UP',
        pickup_photo: url,
        runner_id: uid
      });
      setStep(2);
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    }
    setIsProcessing(false);
  };

  const handleCompleteDelivery = async () => {
    if (!podPhoto) {
      alert('Please take a photo first');
      return;
    }
    if (!auth.currentUser || !mission) {
      alert('Session error. Please refresh.');
      return;
    }
    setIsCompleting(true);
    try {
      // GPS proximity gate — runner must be within 50m of drop-off node
      const runnerPos = await getCurrentPosition();
      const runnerCoords = { lat: runnerPos.coords.latitude, lng: runnerPos.coords.longitude };
      const buyerCoords = getDropOffCoords(mission.drop_off_location);
      const distance = calculateDistance(runnerCoords.lat, runnerCoords.lng, buyerCoords.lat, buyerCoords.lng);
      if (distance > 50) {
        alert('You must be within 50 metres of the buyer to confirm delivery.');
        setIsCompleting(false);
        return;
      }

      const uid = auth.currentUser.uid;
      const orderId = mission.id;
      const fileName = Date.now() + '_' + orderId + '.jpg';
      const storageRef = ref(storage, 'delivery_proofs/' + fileName);
      const snap = await uploadBytes(storageRef, podPhoto);
      const url = await getDownloadURL(snap.ref);
      const res = await completeDelivery(orderId, url, uid, runnerCoords, buyerCoords);
      if (!res.success) { alert(res.message || 'Failed to complete delivery.'); return; }
      alert('Delivery confirmed!');
      setStep(5);
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const getPhone = (locationStr: string) => {
    const match = locationStr?.match(/\(([^,]+),\s*([^)]+)\)/);
    return match ? match[2] : '';
  };

  if (step === 6) {
    return (
      <div className="fixed inset-0 z-100 bg-white flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
          <CheckCircle2 size={40} />
        </div>
        <h1 className="text-[14px] font-semibold text-blue-600 mb-2">Delivery Confirmed</h1>
        <p className="text-[42px] font-semibold text-slate-900 tracking-tighter leading-none mb-10">
          +RM {(mission.total_price || mission.payout || 4.5).toFixed(2)}
        </p>
        <button onClick={() => { onComplete(mission.total_price || mission.payout || 4.5); router.push('/run'); }} className="w-full max-w-xs h-14 bg-slate-900 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-all">
          Dismiss & Return
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pt-6 pb-10 font-sans antialiased text-slate-900">
      <nav className="px-6 pb-5 flex items-center justify-between border-b border-slate-100">
         <div className="flex items-center gap-3">
           <button onClick={() => router.push('/run/terminal')} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all">
             <ChevronLeft size={20} />
           </button>
           <div>
             <h1 className="text-[14px] font-bold text-slate-900">Custom Errand</h1>
             <p className="text-[11px] font-medium text-[#94a3b8]">{mission.id.slice(0,8).toUpperCase()}</p>
           </div>
         </div>
         <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 text-[11px] font-bold">
           RM {(mission.total_price || mission.payout || 4.5).toFixed(2)}
         </div>
      </nav>

      <div className="px-6 space-y-6 flex-1 pt-8">
        <div className="space-y-1">
           <p className="text-[11px] font-semibold text-slate-400 ">{mission.type || 'PARCEL ERRAND'}</p>
           <h2 className="text-[22px] font-semibold tracking-tight leading-none text-slate-900">
              {mission.items_summary || mission.title || "Custom Errand"}
           </h2>
           <p className="text-[13px] font-medium text-[#94a3b8] mt-1">Requested by <span className="font-bold text-slate-900">{mission.customer_name || mission.buyer_name}</span></p>
        </div>

        <div className="space-y-4">
           <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">Mission Checklist</h3>

           <div className={`rounded-2xl p-5 border transition-all duration-300 ${step === 1 ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-white border-slate-100 opacity-70'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-semibold ${step === 1 ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>1</div>
                <p className="text-[13px] font-bold text-slate-900">Pickup</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-white border border-slate-100 p-3.5 rounded-xl">
                  <Store className="text-slate-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 mb-0.5">Pickup Location</p>
                    <p className="text-[13px] font-bold text-slate-900 leading-snug">{mission.pickup_location || mission.handover_node || 'Merchant Node'}</p>
                  </div>
                </div>
                {step === 1 && (
                  <>
                    {pickupPreview ? (
                      <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-slate-100">
                        <img src={pickupPreview} className="w-full h-full object-cover" />
                        <button onClick={() => { setPickupPreview(null); setPickupPhoto(null); }} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm"><X size={12} /></button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer">
                        <Camera className="w-6 h-6 text-slate-400 mb-1" />
                        <p className="text-[11px] font-bold text-slate-500">Capture Pickup Photo</p>
                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) { setPickupPhoto(file); setPickupPreview(URL.createObjectURL(file)); }
                        }} />
                      </label>
                    )}
                    <button onClick={handleConfirmPickup} disabled={isProcessing} className="w-full h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all shadow-md shadow-slate-900/10 disabled:opacity-50">
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : "Confirm Pickup"}
                    </button>
                  </>
                )}
                {step > 1 && <div className="flex items-center gap-2 text-blue-600 font-bold text-[12px] pt-1"><CheckCircle2 size={16} strokeWidth={2.5} /> Item Secured</div>}
              </div>
           </div>

           <div className={`rounded-2xl p-5 border transition-all duration-300 ${step === 2 ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-white border-slate-100 opacity-50'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-semibold ${step === 2 ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>2</div>
                <p className="text-[13px] font-bold text-slate-900">Delivery</p>
              </div>
               <div className="space-y-4">
                 <div className="flex items-start gap-3 bg-white border border-slate-100 p-3.5 rounded-xl">
                   <MapPin className="text-slate-400 shrink-0 mt-0.5" size={16} />
                   <div>
                     <p className="text-[10px] font-semibold text-slate-400 mb-0.5">Drop-off Point</p>
                     <p className="text-[13px] font-bold text-slate-900 leading-snug">{mission.drop_off_location || 'Campus Destination'}</p>
                   </div>
                 </div>
                 {step === 2 && (
                   <>
                     {podPreview ? (
                       <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-slate-100">
                         <img src={podPreview} className="w-full h-full object-cover" />
                         <button onClick={() => { setPodPreview(null); setPodPhoto(null); }} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm"><X size={12} /></button>
                       </div>
                     ) : (
                       <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer">
                         <Camera className="w-6 h-6 text-slate-400 mb-1" />
                         <p className="text-[11px] font-bold text-slate-500">Capture Drop-off Photo</p>
                         <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) { setPodPhoto(file); setPodPreview(URL.createObjectURL(file)); }
                         }} />
                       </label>
                     )}
                     <button onClick={handleCompleteDelivery} disabled={isCompleting} className="w-full h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all shadow-md shadow-slate-900/10 disabled:opacity-50">
                       {isCompleting ? <Loader2 size={16} className="animate-spin" /> : "Complete Delivery"}
                     </button>
                   </>
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
   const statusToStep: Record<string, number> = {
     PREPARING: 1,
     READY_FOR_PICKUP: 1,
     PICKED_UP: 4,
     IN_TRANSIT: 4,
     ARRIVED_AT_DESTINATION: 5,
   };
   const [step, setStep] = useState<number>(initialMission.step || statusToStep[initialMission.status] || 1); 
   const [mission, setMission] = useState<any>(initialMission);
   const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
   const [podPhoto, setPodPhoto] = useState<File | null>(null);
   const [podPreview, setPodPreview] = useState<string | null>(null);
   const [pickupPhoto, setPickupPhoto] = useState<File | null>(null);
   const [pickupPreview, setPickupPreview] = useState<string | null>(null);
   const [isCompleting, setIsCompleting] = useState(false);

   // Dynamic coordinates from mission/order data
   const pickupCoord = mission?.merchant_coords || mission?.pickup_coords || CAMPUS_CENTER;
   const dropoffCoord = mission?.handover_coords || mission?.dropoff_coords || CAMPUS_CENTER;

   const { isLoaded, loadError } = useJsApiLoader({
     id: 'google-map-script',
     googleMapsApiKey: GOOGLE_MAPS_API_KEY
   });

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
     if (!isLoaded || !mission) return;
     try {
        const directionsService = new google.maps.DirectionsService();
        directionsService.route({
           origin: pickupCoord,
           destination: dropoffCoord,
           travelMode: google.maps.TravelMode.WALKING,
        }, (result, status) => {
           if (status === 'OK') setDirections(result);
        });
     } catch (e) { }
   }, [isLoaded, mission, pickupCoord, dropoffCoord]);

    const handleCompleteDelivery = async () => {
       if (!podPhoto) {
         alert('Please take a photo first');
         return;
       }
       if (!auth.currentUser || !mission) {
         alert('Session error. Please refresh.');
         return;
       }
       setIsCompleting(true);
       try {
         // GPS proximity gate — runner must be within 50m of drop-off node
         const runnerPos = await getCurrentPosition();
         const runnerCoords = { lat: runnerPos.coords.latitude, lng: runnerPos.coords.longitude };
         const buyerCoords = getDropOffCoords(mission.drop_off_location);
         const distance = calculateDistance(runnerCoords.lat, runnerCoords.lng, buyerCoords.lat, buyerCoords.lng);
         if (distance > 50) {
           alert('You must be within 50 metres of the buyer to confirm delivery.');
           setIsCompleting(false);
           return;
         }

         const orderId = mission.id;
         const uid = auth.currentUser.uid;
         const fileName = Date.now() + '_' + orderId + '.jpg';
         const storageRef = ref(storage, 'delivery_proofs/' + fileName);
         const snap = await uploadBytes(storageRef, podPhoto);
         const url = await getDownloadURL(snap.ref);
         const res = await completeDelivery(orderId, url, uid, runnerCoords, buyerCoords);
         if (!res.success) { alert(res.message || 'Failed to complete delivery.'); return; }
         alert('Delivery confirmed!');
         setStep(5);
       } catch (e: any) {
         alert('Error: ' + e.message);
       } finally {
         setIsCompleting(false);
       }
    };

   const handleConfirmPickup = async () => {
      if (!pickupPhoto) {
        alert('Please take a photo first');
        return;
      }
      if (!auth.currentUser || !mission) {
        alert('Session error - please refresh');
        return;
      }
      setIsCompleting(true);
      try {
        const uid = auth.currentUser.uid;
        const orderId = mission.id;
        const fileName = Date.now() + '_' + orderId + '.jpg';
        const storageRef = ref(storage, 'delivery_proofs/' + fileName);
        const snap = await uploadBytes(storageRef, pickupPhoto);
        const url = await getDownloadURL(snap.ref);
        await updateDoc(doc(db, 'orders', orderId), {
          status: 'PICKED_UP',
          pickup_photo: url,
          runner_id: uid
        });
        const nextStep = step + 1;
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { current_missions: [{ ...mission, step: nextStep }] });
        setStep(nextStep);
      } catch (e: any) {
        console.error(e);
        alert('Error: ' + e.message);
      } finally {
        setIsCompleting(false);
      }
   };

   const handleStepUpdate = async () => {
      if (!auth.currentUser || !mission) return;
      const nextStep = step + 1;
      try {
         const userRef = doc(db, 'users', auth.currentUser.uid);
         await updateDoc(userRef, { current_missions: [{ ...mission, step: nextStep }] });
         setStep(nextStep);
      } catch (error) { console.error(error); }
   };

   return (
      <div className="min-h-screen bg-white font-sans text-slate-900 antialiased overflow-x-hidden">
         <AnimatePresence>
             {step === 5 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-100 bg-white flex flex-col items-center justify-center px-8 text-center">
                   <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                      <CheckCircle2 size={40} />
                   </div>
                   <h1 className="text-[14px] font-semibold text-blue-600 mb-2">Delivery Verified</h1>
                   <p className="text-[42px] font-semibold text-slate-900 tracking-tighter leading-none mb-10">+RM {mission?.payout?.toFixed(2) || '4.50'}</p>
                   <button onClick={() => router.push('/run')} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold shadow-md active:scale-95 transition-all">Dismiss & Return</button>
                </motion.div>
             )}
         </AnimatePresence>

         <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-8 pb-4 flex items-center justify-between bg-white/90 backdrop-blur-xl border-b border-slate-100">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all"><ChevronLeft size={20} /></button>
            <div className="flex flex-col items-center">
                <h1 className="text-[14px] font-bold text-slate-900">
                   {step === 5 ? "Proof of Delivery" : step === 4 ? "At Drop-off" : step === 3 ? "In Transit" : step === 2 ? "At Merchant" : "To Merchant"}
                </h1>
               <p className="text-[11px] font-medium text-[#94a3b8] mt-0.5">{mission?.id?.slice(0,8).toUpperCase()}</p>
            </div>
            <button className="w-10 h-10 rounded-xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center"><ShieldAlert size={18} /></button>
         </nav>

         <div className="absolute inset-0 z-0 pt-24 pb-48">
            <MapErrorBoundary>
               {GOOGLE_MAPS_API_KEY && isLoaded ? (
                  <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={step <= 2 ? pickupCoord : dropoffCoord} zoom={17} options={MAP_OPTIONS as any}>
                     {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#2563eb', strokeWeight: 4 } }} />}
                     {step <= 2 && <Marker position={pickupCoord} label={{ text: '1', color: '#fff' }} />}
                     {step >= 3 && <Marker position={dropoffCoord} label={{ text: '2', color: '#2563eb' }} />}
                  </GoogleMap>
               ) : (
                  <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center opacity-40">
                     <MapPin size={48} className="text-slate-300" />
                     <p className="text-[12px] font-bold text-slate-400 mt-2">Map Loading...</p>
                  </div>
               )}
            </MapErrorBoundary>
         </div>

         <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-6 pb-safe">
            <div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] p-6 transition-all duration-500">
                <AnimatePresence mode="wait">
                   {step <= 4 ? (
                      <motion.div key="mission" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                         <div className="flex justify-between items-start">
                            <div className="space-y-1">
                               <h2 className="text-[20px] font-semibold tracking-tight leading-none text-slate-900">
                                 {step <= 2 ? (mission?.pickup_location || 'Merchant Area') : (mission?.drop_off_location || 'Drop-off Zone')}
                               </h2>
                               <p className="text-[12px] font-medium text-[#94a3b8] mt-1.5">{step <= 2 ? 'Pickup Point' : 'Drop-off Point'}</p>
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => window.location.href=`https://waze.com/ul?ll=${step<=2?pickupCoord.lat:dropoffCoord.lat},${step<=2?pickupCoord.lng:dropoffCoord.lng}&navigate=yes`} className="h-10 px-4 rounded-xl bg-slate-50 border border-slate-100 text-blue-600 font-bold text-[12px] flex items-center justify-center gap-1.5 active:scale-95 transition-transform"><Navigation size={14} /> Waze</button>
                               <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center active:scale-95 transition-transform"><Phone size={16} /></button>
                            </div>
                         </div>

                         {step === 4 ? (
                             <div className="space-y-3">
                                <p className="text-[11px] font-semibold text-slate-400 ">Drop-off Proof</p>
                                {podPreview ? (
                                   <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-slate-100">
                                      <img src={podPreview} className="w-full h-full object-cover" />
                                      <button onClick={() => setPodPreview(null)} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm"><X size={12} /></button>
                                   </div>
                                ) : (
                                   <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer">
                                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                                      <p className="text-[11px] font-bold text-slate-500">Capture Drop-off Photo</p>
                                      <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => {
                                         const file = e.target.files?.[0];
                                         if (file) { setPodPhoto(file); setPodPreview(URL.createObjectURL(file)); }
                                      }} />
                                   </label>
                                )}
                             </div>
                           ) : step === 2 ? (
                            <div className="space-y-3">
                              <p className="text-[11px] font-semibold text-slate-400 ">Pickup Proof</p>
                              {pickupPreview ? (
                                <div className="relative w-full h-24 rounded-2xl overflow-hidden border border-slate-100">
                                  <img src={pickupPreview} className="w-full h-full object-cover" />
                                  <button onClick={() => { setPickupPreview(null); setPickupPhoto(null); }} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm"><X size={12} /></button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-slate-200 rounded-2xl bg-slate-50 cursor-pointer">
                                  <Camera className="w-6 h-6 text-slate-400 mb-1" />
                                  <p className="text-[11px] font-bold text-slate-500">Capture Pickup Photo</p>
                                  <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) { setPickupPhoto(file); setPickupPreview(URL.createObjectURL(file)); }
                                  }} />
                                </label>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-2xl p-4 bg-slate-50/50 border border-slate-100">
                              <p className="text-[10px] font-semibold mb-2.5 text-slate-400 uppercase tracking-widest">Order Bundle</p>
                              <div className="space-y-2">
                                {(mission?.items || []).map((item: any, i: number) => (
                                   <div key={i} className="flex justify-between items-center text-[13px] font-bold text-slate-900">
                                      <span>{item.qty}x {item.name || item.title}</span>
                                      <span className="text-slate-300">#{mission.id.slice(-4).toUpperCase()}</span>
                                   </div>
                                ))}
                             </div>
                           </div>
                         )}

                          <button onClick={step === 2 ? handleConfirmPickup : step === 4 ? handleCompleteDelivery : handleStepUpdate} disabled={isCompleting} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 text-[14px]">
                             {isCompleting && <Loader2 size={18} className="animate-spin" />}
                             {step === 1 ? "Arrived at Pickup" : step === 2 ? "Confirm Pickup" : step === 3 ? "Arrived at Drop-off" : "Confirm Delivery"}
                         </button>
                      </motion.div>
                   ) : (
                      <div className="py-6 text-center space-y-5">
                         <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto shadow-sm"><Camera size={28} /></div>
                         <div><h2 className="text-[20px] font-semibold text-slate-900 tracking-tight leading-none">Photo Proof</h2><p className="text-[12px] font-medium text-[#94a3b8] mt-1.5">Capture the item at the drop-off location</p></div>
                         {podPreview ? (
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                               <img src={podPreview} className="w-full h-full object-cover" /><button onClick={() => setPodPreview(null)} className="absolute top-3 right-3 p-2 bg-white/90 rounded-full shadow-md"><X size={14} /></button>
                            </div>
                         ) : (
                            <label className="flex flex-col items-center justify-center w-full h-40 border border-dashed border-slate-300 rounded-2xl bg-slate-50 cursor-pointer transition-all">
                               <Camera className="w-8 h-8 text-slate-300 mb-3" /><p className="text-[12px] font-semibold text-slate-400 ">Open Camera</p>
                               <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) { setPodPhoto(file); setPodPreview(URL.createObjectURL(file)); }
                               }} />
                            </label>
                         )}
                         <button onClick={handleCompleteDelivery} disabled={isCompleting} className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-2 shadow-md disabled:opacity-30 active:scale-95 transition-all">
                            {isCompleting && <Loader2 size={18} className="animate-spin" />}
                            {isCompleting ? "Processing..." : "Confirm Delivery"}
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
     if (!loading && !mission && !showSuccess) { router.push('/run/terminal'); }
  }, [loading, mission, showSuccess, router]);

  const handleMissionComplete = async (payout: number) => {
     if (!auth.currentUser || !mission) return;
     const userRef = doc(db, 'users', auth.currentUser.uid);
     const snap = await getDoc(userRef);
     await addDoc(collection(db, 'users', auth.currentUser.uid, 'transactions'), {
        item: mission.items_summary || mission.title, price: payout, date: new Date().toLocaleString(), timestamp: new Date()
     });
     await updateDoc(userRef, { current_missions: [], balance: (snap.data()?.balance || 0) + payout });
     setPayoutAmount(payout);
     setShowSuccess(true);
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-10 h-10 border-[3px] border-slate-100 border-t-blue-600 rounded-full animate-spin" /></div>;

  if (showSuccess) {
    return (
       <div className="fixed inset-0 z-100 bg-white flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 border border-blue-100"><CheckCircle2 size={40} /></div>
          <h1 className="text-[13px] font-semibold text-blue-600 mb-2">Drop-off Verified</h1>
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
/* RUNNER ACTIVE MISSION PAGE
   What: Runner manages a single active delivery
   Shows: Map, step-by-step delivery flow, photo upload, confirm buttons
   Key: Confirm Delivery uploads to delivery_proofs/ in Firebase Storage
   Data: orders collection (single order)
   Related: app/run/missions/page.tsx
*/
