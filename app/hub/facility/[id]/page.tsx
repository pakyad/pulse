"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { 
  ChevronLeft, 
  Settings, 
  MapPin, 
  Clock, 
  Monitor, 
  Cpu, 
  Wifi, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  Radio
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import FacilityCanvas from '@/components/hub/FacilityCanvas';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

// ── MOCK DATA ENGINE ──
const MOCK_SLOTS: any[] = [
  { id: 'S1', type: 'WORKSTATION', status: 'AVAILABLE', x: 20, y: 30, specs: ['32" 4K Monitor', 'i9 Processor', 'Mechanical Keyboard'] },
  { id: 'S2', type: 'WORKSTATION', status: 'AVAILABLE', x: 20, y: 50, specs: ['Dual 24" Monitors', 'RTX 4080', 'Ergonomic Chair'] },
  { id: 'S3', type: 'WORKSTATION', status: 'OCCUPIED',  x: 20, y: 70 },
  { id: 'S4', type: 'STUDIO',      status: 'AVAILABLE', x: 50, y: 40, specs: ['Blue Yeti Mic', '4K Cam', 'Acoustic Panels'] },
  { id: 'S5', type: 'LOUNGE',      status: 'AVAILABLE', x: 80, y: 30, specs: ['Power Outlets', 'Soft Seating', 'Social Zone'] },
  { id: 'S6', type: 'WORKSTATION', status: 'AVAILABLE', x: 80, y: 60, specs: ['Window View', 'Quiet Zone', 'High-Speed LAN'] },
];

export default function FacilityBookingPage() {
  const router = useRouter();
  const params = useParams();
  const [facility, setFacility] = useState<any>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState('1h');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "facilities", params.id as string), (snap) => {
      if (snap.exists()) {
        setFacility(snap.data());
      } else {
        setFacility({
          name: params.id === 'f1' ? 'Library East Node' : params.id === 'f2' ? 'Software Lab A-301' : 'Main Auditorium',
          zone: 'Level 3 · MIIT',
          noise: 42,
          temp: 22,
          occupancy: '14/20'
        });
      }
    });
    return () => unsub();
  }, [params.id]);

  const selectedSlot = MOCK_SLOTS.find(s => s.id === selectedSlotId);

  const handleConfirmBooking = async () => {
    if (!selectedSlotId || !auth.currentUser) return;
    setIsBooking(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const bookingId = `BK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const bookingData = {
        userId: auth.currentUser.uid,
        facilityId: params.id,
        facilityName: facility.name,
        slotId: selectedSlotId,
        duration: selectedDuration,
        timestamp: serverTimestamp(),
        status: 'ACTIVE'
      };

      await setDoc(doc(db, "bookings", bookingId), bookingData);
      setBookingSuccess(true);
      setTimeout(() => { router.push(`/hub/facility/pass/${bookingId}`); }, 2000);
    } catch (e) {
      console.error("Booking Error:", e);
    } finally {
      setIsBooking(false);
    }
  };

  if (!facility) return null;

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-48 font-sans antialiased text-slate-800">
      
      {/* ── 1. FRIENDLY HEADER (Consumer baseline) ── */}
      <section className="px-6 pt-12 pb-8">
         <div className="flex items-center justify-between mb-8">
            <BackButton />
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Live Campus Data</span>
            </div>
         </div>

         <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 mb-1">{facility.zone}</p>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">
              {facility.name}
            </h1>
         </div>
      </section>

      <div className="max-w-2xl mx-auto px-6 space-y-10">
        
        {/* ── 2. SOFT TELEMETRY CARDS ── */}
        <section className="grid grid-cols-2 gap-4">
           <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                 <Radio size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Availability</p>
                 <p className="text-lg font-bold text-slate-800 leading-none">Open</p>
                 <p className="text-xs font-medium text-slate-400 mt-1.5">Ready for booking</p>
              </div>
           </div>

           <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-slate-900 mb-4">
                 <Clock size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Occupancy</p>
                 <p className="text-lg font-bold text-slate-800 leading-none">{facility.occupancy}</p>
                 <p className="text-xs font-medium text-slate-400 mt-1.5">Live telemetry</p>
              </div>
           </div>
        </section>

        {/* ── 3. APPROACHABLE DESK SELECTOR ── */}
        <section className="space-y-4">
           <div className="flex justify-between items-baseline px-2">
              <h3 className="text-lg font-bold text-slate-800">Select your desk</h3>
              <span className="text-xs font-medium text-slate-400">Interactive Map</span>
           </div>
           <FacilityCanvas 
             slots={MOCK_SLOTS} 
             selectedSlotId={selectedSlotId} 
             onSelectSlot={setSelectedSlotId}
             noiseLevel={facility.noise}
             temperature={facility.temp}
           />
        </section>

        {/* ── 4. SELECTION REGISTRY ── */}
        <AnimatePresence mode="wait">
          {selectedSlotId ? (
            <motion.section 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="space-y-10"
            >
              {/* Desk Detail Card */}
              <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 border border-slate-100">
                       {selectedSlot?.type === 'WORKSTATION' ? <Monitor size={24} /> : <Cpu size={24} />}
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Desk Location</p>
                       <h4 className="text-2xl font-bold text-slate-800">Pod {selectedSlotId}</h4>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 gap-3">
                    {selectedSlot?.specs?.map((spec: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 text-slate-500">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                         <span className="text-sm font-medium">{spec}</span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Duration Registry */}
              <div className="space-y-4">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">How long do you need it?</p>
                 <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                   {['30m', '1h', '2h', '3h', '4h'].map((time) => (
                     <button 
                       key={time} 
                       onClick={() => setSelectedDuration(time)}
                       className={`shrink-0 w-20 h-20 rounded-2xl border-2 transition-all active:scale-[0.95] flex flex-col items-center justify-center gap-0.5 ${
                         selectedDuration === time 
                           ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-blue-100' 
                           : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                       }`}
                     >
                       <span className="text-xl font-bold">{time.replace('m', '').replace('h', '')}</span>
                       <span className="text-[9px] font-bold uppercase tracking-wider">{time.includes('m') ? 'min' : 'hrs'}</span>
                     </button>
                   ))}
                 </div>
              </div>
            </motion.section>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-12 text-center flex flex-col items-center gap-4 opacity-40"
            >
               <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-pulse" />
               </div>
               <p className="text-sm font-medium text-slate-500">Pick a desk to start your reservation</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 5. CONFIRMATION ACTION ── */}
        <AnimatePresence>
          {selectedSlotId && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-10 left-6 right-6 z-[100]"
            >
               <button 
                 disabled={isBooking || bookingSuccess}
                 onClick={handleConfirmBooking}
                 className={`w-full h-16 rounded-2xl flex items-center justify-center gap-4 font-bold text-base transition-all shadow-md ${
                   bookingSuccess 
                     ? 'bg-emerald-500 text-white shadow-emerald-100' 
                     : 'bg-slate-900 text-white shadow-blue-100 active:scale-95'
                 }`}
               >
                 {isBooking ? (
                    <div className="flex items-center gap-3">
                       <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                       <span className="uppercase tracking-widest text-sm">Reserving...</span>
                    </div>
                 ) : bookingSuccess ? (
                    <>
                       <CheckCircle2 size={24} />
                       <span className="uppercase tracking-widest text-sm">Reservation Secured</span>
                    </>
                 ) : (
                    <>
                       <span className="uppercase tracking-widest text-sm font-bold">Book Pod {selectedSlotId}</span>
                       <ArrowRight size={20} />
                    </>
                 )}
               </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
