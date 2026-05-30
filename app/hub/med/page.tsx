'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Clock, 
  MapPin, 
  PhoneCall, 
  ShieldAlert, 
  ChevronLeft,
  Activity,
  Calendar,
  Pill,
  ArrowRight
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { useRouter } from 'next/navigation';
import EKGModule from '@/components/pulse/EKGModule';

export default function MedHub() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-white pb-32 font-sans antialiased text-navy">
      {/* 1. PREMIUM HEADER */}
      <section className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <BackButton />
        <div className="text-center">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Health & Wellness</p>
          <h1 className="text-[18px] font-bold tracking-widest text-navy">Campus Clinic</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
          <Heart size={18} fill="currentColor" />
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-6 space-y-12 mt-8">
        
        {/* 2. HEALTH STATUS */}
        <section className="space-y-4">
           <div className="flex justify-between items-end">
              <div>
                <h3 className="text-[17px] font-bold text-navy tracking-tight">Your Health</h3>
                <p className="text-[13px] text-slate-400">Last updated: 2m ago</p>
              </div>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold tracking-widest uppercase border border-emerald-100">
                Live
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EKGModule title="Heart Rate" status="STABLE" val="72 bpm" type="WAVE" />
              <EKGModule title="Stress Level" status="ONLINE" val="LOW" type="WAVE" />
           </div>
        </section>

        {/* 3. CLINIC STATUS */}
        <section className="bg-navy rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-navy/20 group">
           <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">MIIT Campus Clinic</p>
                    <h2 className="text-2xl font-bold tracking-tight">Wait Time</h2>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <MapPin size={20} className="text-emerald-400" />
                 </div>
              </div>

              <div className="flex items-end gap-6">
                 <p className="text-[64px] font-black tracking-tighter leading-none text-white">12<span className="text-2xl text-white/20 ml-2">min</span></p>
                 <div className="pb-2 space-y-1">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Est. Wait</p>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-medium text-white/40 italic">Clinic is quiet right now</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                 <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">On-duty Doctors</p>
                    <p className="text-xl font-bold">04</p>
                 </div>
                 <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Pharmacy</p>
                    <p className="text-xl font-bold">OPEN</p>
                 </div>
              </div>
           </div>
        </section>

        {/* 4. MEDICAL SERVICES */}
        <section className="grid grid-cols-2 gap-4">
           {[
             { label: 'Book Consult', sub: 'MIIT Clinic', icon: Calendar, color: 'bg-blue-50 text-blue-600' },
             { label: 'Pharmacy', sub: 'E-Prescription', icon: Pill, color: 'bg-emerald-50 text-emerald-600' },
             { label: 'Health Record', sub: 'Private & Secure', icon: Activity, color: 'bg-violet-50 text-violet-600' },
             { label: 'Find Clinic', sub: 'Campus Map', icon: MapPin, color: 'bg-amber-50 text-amber-600' },
           ].map((item, i) => (
             <motion.button 
               key={i}
               whileHover={{ y: -4, scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               className="p-6 bg-slate-50 rounded-[2.5rem] flex flex-col items-start gap-6 text-left group border border-transparent hover:border-slate-100 hover:bg-white transition-all shadow-sm hover:shadow-xl hover:shadow-navy/5"
             >
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center shadow-sm`}>
                   <item.icon size={22} strokeWidth={2} />
                </div>
                <div>
                   <p className="text-[15px] font-bold text-navy tracking-widest leading-none mb-1">{item.label}</p>
                   <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{item.sub}</p>
                </div>
             </motion.button>
           ))}
        </section>

        {/* 5. EMERGENCY SOS */}
        <section className="pb-10">
           <button className="w-full bg-red-500 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-red-500/20 active:scale-95 transition-all">
              <div className="flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                       <ShieldAlert size={32} />
                    </div>
                    <div className="text-left">
                       <h3 className="text-[20px] font-bold tracking-tight">Emergency SOS</h3>
                       <p className="text-[13px] text-white/60 font-medium">Alert Campus Security & Medical Team</p>
                    </div>
                 </div>
                 <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-red-500 transition-all">
                    <PhoneCall size={18} />
                 </div>
              </div>
           </button>
        </section>

      </div>

      {/* FLOATING ACTION PILL */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <button className="bg-navy text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl shadow-navy/40 hover:scale-105 active:scale-95 transition-all">
          <span className="text-[11px] font-black uppercase tracking-widest">Connect with Medic</span>
          <ArrowRight size={16} className="text-emerald-400" />
        </button>
      </div>

    </main>
  );
}
