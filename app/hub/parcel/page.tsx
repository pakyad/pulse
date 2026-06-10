'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Mail, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  AlertCircle,
  MapPin,
  QrCode,
  ShieldCheck
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';
import { useRouter } from 'next/navigation';

const PARCELS = [
  { id: 'P-8801', courier: 'Shopee Xpress', status: 'READY', location: 'Block A Guard', date: '2h ago', icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'M-1022', courier: 'Pos Laju (Letter)', status: 'COLLECTED', location: 'Registry Desk', date: 'Yesterday', icon: Mail, color: 'text-slate-400', bg: 'bg-slate-50' },
  { id: 'P-8795', courier: 'J&T Express', status: 'PENDING', location: 'Main Lobby', date: '3h ago', icon: Package, color: 'text-amber-500', bg: 'bg-amber-50' },
];

export default function ParcelHub() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-white pb-32 font-sans antialiased text-slate-900">
      
      {/*  COMPACT HEADER  */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <p className="text-[14px] font-bold tracking-tight">Parcel & Mail</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
            <Package size={16} />
          </div>
        </div>
      </nav>

      <div className="pt-24 px-5 max-w-lg mx-auto space-y-8">
        
        {/*  QUICK SCAN (COMPACT)  */}
        <section 
          className="p-5 bg-slate-900 rounded-[24px] text-white flex items-center justify-between group active:scale-95 transition-all cursor-pointer shadow-lg shadow-slate-900/10"
        >
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                 <QrCode size={20} />
              </div>
              <div>
                 <p className="text-[13px] font-bold tracking-tight">Scan Collection QR</p>
                 <p className="text-[11px] text-white/50 font-medium">Verify your identity at the desk</p>
              </div>
           </div>
           <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-all" />
        </section>

        {/*  PARCEL LIST  */}
        <section className="space-y-4">
           <div className="px-1 flex justify-between items-center">
              <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Active Deliveries</h3>
              <span className="text-[10px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full">Live</span>
           </div>

           <div className="space-y-2">
              {PARCELS.map((item) => (
                <div key={item.id} className="p-3.5 bg-white border border-slate-100 rounded-[20px] flex items-center justify-between group hover:border-slate-300 transition-all">
                   <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-[14px] ${item.bg} flex items-center justify-center ${item.color}`}>
                         <item.icon size={18} />
                      </div>
                      <div>
                         <h4 className="text-[13px] font-bold text-slate-800 leading-none mb-1">{item.courier}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.id} - {item.location}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`text-[10px] font-bold mb-0.5 ${item.color}`}>{item.status}</p>
                      <p className="text-[9px] font-medium text-slate-300">{item.date}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/*  NOTIFICATION TOGGLE (TIGHT)  */}
        <section className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-[20px] flex items-start gap-4">
           <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <AlertCircle size={16} />
           </div>
           <div className="space-y-0.5">
              <p className="text-[12px] font-bold text-indigo-900">Arrived? We'll ping you.</p>
              <p className="text-[11px] font-medium text-indigo-700/70 leading-snug">Real-time alerts for all incoming mail under your matric number.</p>
           </div>
        </section>

        {/*  DESK INFO  */}
        <section className="pt-4 border-t border-slate-50 flex items-center justify-between px-1">
           <div className="flex items-center gap-2">
              <MapPin size={12} className="text-slate-300" />
              <p className="text-[11px] font-bold text-slate-400">Registry Desk: Level 2, Block A</p>
           </div>
           <p className="text-[11px] font-bold text-slate-400">8:30 AM  5:00 PM</p>
        </section>

      </div>
    </main>
  );
}
