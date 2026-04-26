"use client";

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  ChevronLeft,
  Zap,
  MapPin,
  Scale,
  Award,
  CircleDollarSign,
  HeartPulse,
  Coins,
  Bell,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onSnapshot, doc } from 'firebase/firestore';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

import { motion } from 'framer-motion';

export default function RunnerOnboarding() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        onSnapshot(doc(db, "users", user.uid), (snap) => setProfile(snap.data()));
      }
    });
    return () => unsub();
  }, []);

  return (
    <main className="h-screen h-svh bg-[#FDFDFD] font-sans antialiased text-navy flex flex-col overflow-hidden">
      
      {/* --- STANDARDIZED DASHBOARD HEADER --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-5 pt-12 pb-4 flex items-center justify-between bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50">
         <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-navy hover:bg-slate-50 rounded-xl transition-all active:scale-90">
               <ChevronLeft size={28} strokeWidth={2} />
            </button>
            <h2 className="text-[18px] font-bold tracking-tight text-navy">Runner Protocol</h2>
         </div>

         <div className="flex items-center gap-3 shrink-0">
            <AvatarDropdown 
              photoUrl={profile?.photo_url} 
              userName={profile?.full_name || 'Pulse'} 
            />
         </div>
      </nav>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-2 no-scrollbar pt-32 pb-32 space-y-12">
        
        {/* Asymmetrical Hero */}
        <div className="flex justify-between items-end">
          <div className="max-w-[150px]">
             <h1 className="text-[32px] font-bold tracking-tight text-navy leading-[1.1] mb-2">
               The Runner Protocol.
             </h1>
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">
               Campus logistics.
             </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Yield</p>
             <p className="text-[18px] font-bold text-navy leading-none">RM 15.00</p>
          </div>
        </div>

        {/* Major Benefit Card */}
        <motion.div 
           whileTap={{ scale: 0.98 }}
           className="bg-linear-to-br from-[#8B5CF6] to-[#7C3AED] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-lg shadow-purple-500/20"
        >
           {/* Soft Abstract Shapes */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
           <CircleDollarSign className="absolute -right-6 -bottom-6 text-white/10 w-40 h-40 rotate-12" />
           
           <div className="relative z-10">
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mb-3">Policy</p>
              <h3 className="text-[28px] font-bold tracking-tight leading-tight mb-3">Keep 90% of <br/> Earnings.</h3>
              <p className="text-[12px] text-white/80 leading-snug font-medium max-w-[200px]">10% protocol fee for upkeep. 100% tips go directly to you.</p>
           </div>
        </motion.div>

        {/* Hub-style Perks Grid */}
        <div>
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold text-navy tracking-tight">Protocol Modules</h3>
           </div>
           
           <div className="grid grid-cols-4 gap-y-6">
              {[
                { icon: Clock, label: 'Flex-Shift', color: 'bg-[#1877F2]' },
                { icon: ShieldCheck, label: 'GPS-Secure', color: 'bg-[#DC3545]' },
                { icon: MapPin, label: 'Priority Pods', color: 'bg-[#E83E8C]' },
                { icon: HeartPulse, label: 'GPA Shield', color: 'bg-[#28A745]' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                   <motion.div 
                      whileTap={{ scale: 0.95 }}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm relative overflow-hidden ${item.color}`}
                   >
                      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                      <item.icon size={24} strokeWidth={2.5} className="relative z-10" />
                   </motion.div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center px-1">
                      {item.label}
                   </span>
                </div>
              ))}
           </div>
        </div>

        {/* Institutional Roadmap */}
        <div>
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold text-navy tracking-tight">Career Path</h3>
           </div>
           <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4">
              {[
                { title: 'Novice', fee: '10% Fee', perk: 'Base Access', icon: Zap },
                { title: 'Expert', fee: '8% Fee', perk: 'Priority Hubs', icon: Award },
                { title: 'Elite', fee: '5% Fee', perk: 'UniKL Prestige', icon: Award },
              ].map((item, i) => (
                <div key={i} className="min-w-[140px] bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex flex-col items-center text-center">
                   <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 text-slate-400 flex items-center justify-center mb-4">
                      <item.icon size={20} strokeWidth={2.5} />
                   </div>
                   <h5 className="text-[16px] font-bold text-navy mb-1 tracking-tight">{item.title}</h5>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{item.fee}</p>
                   <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest leading-none">{item.perk}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Protocol Rules */}
        <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-sm">
           <div className="flex items-center gap-3 relative z-10">
              <Scale size={20} className="text-slate-300" />
              <h4 className="text-[12px] font-black text-navy uppercase tracking-widest">Protocol Rules</h4>
           </div>
           <div className="grid gap-4 relative z-10">
              {[
                'Maintain a 4.5+ star performance rating.',
                'Professional campus communication protocol.',
                'Synchronize university wallet for payouts.',
                'Adhere to official packaging standards.'
              ].map((text, i) => (
                <div key={i} className="flex gap-4">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                   <p className="text-[14px] text-slate-500 font-medium leading-relaxed">{text}</p>
                </div>
              ))}
           </div>
        </div>

      </div>

      {/* 3. Footer */}
      <div className="px-6 py-4 pb-12 bg-white/90 backdrop-blur-xl border-t border-slate-50 z-20 fixed bottom-0 left-0 right-0">
        <button 
          onClick={() => router.push('/run/register')}
          className="w-full h-14 bg-navy text-white rounded-[1.2rem] text-[15px] font-bold shadow-xl shadow-navy/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          Begin Onboarding <ArrowRight size={18} />
        </button>
      </div>

    </main>
  );
}
