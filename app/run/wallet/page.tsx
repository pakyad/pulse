'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Plus, Upload, ChevronRight, History, FileText, 
  PieChart, ShieldCheck, ArrowDownLeft, ArrowUpRight, 
  Settings as SettingsIcon, HelpCircle, ShieldAlert 
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function RunnerWalletPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubProfile) unsubProfile();

      if (user) {
        unsubProfile = onSnapshot(doc(db, 'users', user.uid), (s) => setProfile(s.data()));
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const MANAGEMENT_ITEMS = [
    { icon: History, label: 'Live Transactions', desc: 'Real-time fund tracking', path: '/run/history' },
    { icon: PieChart, label: 'Performance Analytics', desc: 'Revenue & efficiency metrics', path: '/run/analytics' },
    { icon: FileText, label: 'Institutional Statements', desc: 'Official E-Invoice exports', path: '/run/statements' },
    { icon: SettingsIcon, label: 'Runner Preferences', desc: 'Auto-accept, vehicle type', path: '/run/settings' },
    { icon: HelpCircle, label: 'Carrier Support', desc: 'Active job assistance', path: '/run/support' },
    { icon: ShieldAlert, label: 'Compliance & Safety', desc: 'Legal & Insurance registry', path: '/run/legal' },
  ];

  return (
    <main className="min-h-screen bg-white font-sans antialiased text-navy max-w-md mx-auto border-x border-slate-50 shadow-sm">
      
      {/* ── INTEGRATED HEADER ── */}
      <section className="relative pt-12 pb-20 bg-[#0A0F1E] rounded-b-[3.5rem] shadow-2xl shadow-navy/20 overflow-hidden">
        {/* Deep Ambient Light */}
        <div className="absolute top-[-50%] left-[-20%] w-[140%] aspect-square bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 px-8">
          <div className="flex items-center justify-between mb-12">
            <button onClick={() => router.push('/run')} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors active:scale-90">
              <ArrowLeft size={22} />
            </button>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Secure Sync</span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white ml-1">Account Balance</p>
            <div className="flex items-baseline gap-3">
              <span className="text-[18px] font-bold text-white/40">RM</span>
              <h2 className="text-[58px] font-bold text-white tracking-tighter leading-none">
                {(profile?.balance || 45.00).toFixed(2)}
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACTION TERMINAL ── */}
      <section className="px-8 -mt-10 relative z-20">
         <div className="bg-white rounded-[2.5rem] p-3 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center gap-2">
            <button className="flex-1 h-[72px] bg-slate-50 hover:bg-slate-100/80 rounded-[1.8rem] flex items-center justify-center gap-3 transition-all active:scale-[0.97] group">
               <div className="w-9 h-9 bg-white text-navy rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                  <ArrowDownLeft size={18} strokeWidth={2.5} />
               </div>
               <span className="text-[12px] font-bold text-navy tracking-tight">Deposit</span>
            </button>
            <button className="flex-1 h-[72px] bg-navy hover:bg-navy/90 rounded-[1.8rem] flex items-center justify-center gap-3 transition-all active:scale-[0.97] group shadow-lg shadow-navy/20">
               <div className="w-9 h-9 bg-white/10 text-white rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                  <ArrowUpRight size={18} strokeWidth={2.5} />
               </div>
               <span className="text-[12px] font-bold text-white tracking-tight">Withdraw</span>
            </button>
         </div>
      </section>

      {/* ── CONSOLIDATED ACCOUNT MANAGEMENT ── */}
      <section className="px-8 py-12 space-y-10 pb-32">
        
        <div className="space-y-5">
           <h3 className="text-[13px] font-black text-navy uppercase tracking-[0.3em] ml-1">Account Management</h3>
           <div className="space-y-2">
              {MANAGEMENT_ITEMS.map((item, i) => (
                <button 
                  key={i}
                  onClick={() => router.push(item.path)}
                  className="w-full p-5 bg-white border border-slate-50 hover:border-slate-100 hover:bg-slate-50/50 rounded-[1.8rem] flex items-center gap-4 transition-all group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 group-hover:bg-white transition-colors flex items-center justify-center text-slate-400">
                    <item.icon size={18} strokeWidth={2} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-[14px] font-bold text-navy leading-none">{item.label}</h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">{item.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-200 group-hover:text-navy transition-colors" />
                </button>
              ))}
           </div>
        </div>

        {/* ── FOOTER LOGO ── */}
        <div className="pt-8 flex flex-col items-center gap-4 opacity-20">
           <div className="w-12 h-1 px-4 bg-slate-100 rounded-full" />
           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-navy">Pulse Protocol</p>
        </div>

      </section>

    </main>
  );
}
