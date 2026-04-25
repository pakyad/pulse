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
    <main className="h-screen h-svh bg-[#FDFDFD] font-sans antialiased text-slate-900 flex flex-col overflow-hidden">
      
      {/* --- STANDARDIZED DASHBOARD HEADER (ACTION FOCUS) --- */}
      <nav className="fixed top-0 left-0 right-0 z-100 px-5 pt-8 pb-4 flex items-center justify-between bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50">
         <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-navy/40 hover:text-navy transition-all active:scale-90">
               <ChevronLeft size={28} strokeWidth={2} />
            </button>
            <h2 className="text-[15px] font-black tracking-widest text-navy uppercase italic">Runner Protocol</h2>
         </div>

         <div className="flex items-center gap-3 shrink-0">
            <button className="p-2 text-navy/40 hover:text-navy transition-all active:scale-90">
               <Bell size={22} strokeWidth={2} />
            </button>
            <AvatarDropdown 
              photoUrl={profile?.photo_url} 
              userName={profile?.full_name || 'Pulse'} 
            />
         </div>
      </nav>

      {/* 2. Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-2 no-scrollbar pt-28">
        
        {/* Asymmetrical Hero (Monochromatic) */}
        <div className="flex justify-between items-end mb-8">
          <div className="max-w-[150px]">
             <h1 className="text-[32px] font-bold tracking-tighter text-slate-900 leading-[0.9] mb-3">
               The Runner <br/> Protocol.
             </h1>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
               Campus logistics.
             </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-right">
             <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Yield</p>
             <p className="text-[18px] font-bold text-slate-900 leading-none">RM 15.00</p>
          </div>
        </div>

        {/* Major Benefit Card (Matured Black) */}
        <div className="bg-slate-900 rounded-[1.8rem] p-6 text-white relative overflow-hidden mb-6 group">
           <CircleDollarSign className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 rotate-12" />
           <div className="relative z-10">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-3">Policy</p>
              <h3 className="text-[20px] font-bold tracking-widest leading-tight mb-2">Keep 90% of <br/> Earnings.</h3>
              <p className="text-[11px] text-white/30 leading-snug font-medium max-w-[180px]">10% protocol fee for upkeep. 100% tips go directly to you.</p>
           </div>
        </div>

        {/* MONOCHROMATIC: Horizontal Scrollable Perks */}
        <div className="mb-10">
           <div className="flex justify-between items-center mb-5 px-1">
              <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Protocol Modules</h3>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
           </div>
           
           <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
              {[
                { icon: Clock, title: 'Flex-Shift', desc: 'Syncs with your lecture schedule automatically.' },
                { icon: ShieldCheck, title: 'GPS-Secure', desc: 'Full satellite tracking for campus security.' },
                { icon: MapPin, title: 'Priority Pods', desc: 'Authorized access to specialized drop-points.' },
                { icon: HeartPulse, title: 'GPA Shield', desc: 'Active monitoring during exam periods.' },
                { icon: Coins, title: 'Settlements', desc: 'Weekly automated transfers to your wallet.' }
              ].map((item, i) => (
                <div key={i} className="min-w-[210px] bg-white border border-slate-100 rounded-4xl p-6 shadow-sm">
                   <div className="w-9 h-9 rounded-2xl bg-slate-50 flex items-center justify-center mb-5">
                      <item.icon size={17} className="text-slate-900" />
                   </div>
                   <h4 className="text-[15px] font-bold text-slate-900 mb-1.5">{item.title}</h4>
                   <p className="text-[12px] text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Institutional Roadmap (Monochromatic) */}
        <div className="mb-10">
           <div className="flex justify-between items-center mb-5 px-1">
              <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Career Path</h3>
              <div className="w-8 h-px bg-slate-100" />
           </div>
           <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4">
              {[
                { title: 'Novice', fee: '10% Fee', perk: 'Base Access', icon: Zap },
                { title: 'Expert', fee: '8% Fee', perk: 'Priority Hubs', icon: Award },
                { title: 'Elite', fee: '5% Fee', perk: 'UniKL Prestige', icon: Award },
              ].map((item, i) => (
                <div key={i} className="min-w-[140px] bg-white border border-slate-100 rounded-[1.8rem] p-5 shadow-sm flex flex-col items-center text-center">
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      <item.icon size={16} className="text-slate-900" />
                   </div>
                   <h5 className="text-[14px] font-bold text-slate-900 mb-1">{item.title}</h5>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{item.fee}</p>
                   <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest leading-none">{item.perk}</p>
                </div>
              ))}
           </div>
        </div>

        {/* Protocol Rules (Monochromatic) */}
        <div className="bg-slate-50 border border-slate-100 rounded-4xl p-7 space-y-6 mb-12">
           <div className="flex items-center gap-3">
              <Scale size={16} className="text-slate-300" />
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Protocol Rules</h4>
           </div>
           <div className="grid gap-4">
              {[
                'Maintain a 4.5+ star performance rating.',
                'Professional campus communication protocol.',
                'Synchronize university wallet for payouts.',
                'Adhere to official packaging standards.'
              ].map((text, i) => (
                <div key={i} className="flex gap-4">
                   <div className="w-1 h-1 rounded-full bg-slate-200 mt-2 shrink-0" />
                   <p className="text-[13px] text-slate-400 font-medium leading-tight">{text}</p>
                </div>
              ))}
           </div>
        </div>

        <div className="h-20" />
      </div>

      {/* 3. Footer (Monochromatic) */}
      <div className="px-6 py-4 pb-24 bg-white/90 backdrop-blur-xl border-t border-slate-50 z-20">
        <button 
          onClick={() => router.push('/run/register')}
          className="w-full h-14 bg-slate-900 text-white rounded-full text-[14px] font-bold shadow-2xl shadow-slate-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          Begin Onboarding <ArrowRight size={16} />
        </button>
      </div>

    </main>
  );
}
