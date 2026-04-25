'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bus, 
  Printer, 
  ChevronLeft, 
  ArrowUpRight, 
  Settings,
  Map,
  FileUp,
  History,
  CalendarCheck,
  Users,
  Waves
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ServicesHub() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">
      {/* 1. SIMPLE HEADER */}
      <section className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-50">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-navy hover:bg-slate-50 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Campus Hub</p>
          <h1 className="text-[18px] font-bold tracking-widest text-navy">Services</h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-navy/40">
          <Settings size={18} />
        </button>
      </section>

      <div className="max-w-2xl mx-auto px-6 mt-10 space-y-12">
        
        {/* 2. ADMIN SUBMISSION (ACTIONABLE) */}
        <section className="space-y-4">
           <div className="flex justify-between items-end">
              <div>
                 <h3 className="text-[17px] font-bold text-navy tracking-tight">Submit to Admin</h3>
                 <p className="text-[13px] text-slate-400">Quickly upload MCs, receipts, or official letters.</p>
              </div>
              <button 
                onClick={() => router.push('/hub/admin')}
                className="text-[11px] font-bold text-navy uppercase tracking-widest flex items-center gap-2"
              >
                 <History size={14} /> My Submissions
              </button>
           </div>

           <div 
             onClick={() => router.push('/hub/admin')}
             className="bg-white border border-slate-100 rounded-[2.5rem] p-10 text-center group hover:border-navy hover:bg-slate-50 transition-all cursor-pointer"
           >
              <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto mb-4 flex items-center justify-center text-slate-300 group-hover:bg-navy group-hover:text-white transition-all">
                 <FileUp size={24} />
              </div>
              <h4 className="text-[16px] font-bold text-navy">Tap to submit a request</h4>
              <p className="text-[12px] text-slate-400 mt-1">Select a channel (MC, Appeal, Finance).</p>
           </div>
        </section>

        {/* 3. BUS TRACKING */}
        <section className="space-y-4">
           <div className="flex justify-between items-end">
              <div>
                 <h3 className="text-[17px] font-bold text-navy tracking-tight">Bus Tracking</h3>
                 <p className="text-[13px] text-slate-400">See where the campus bus is right now.</p>
              </div>
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[9px] font-bold uppercase tracking-widest">Live Map</span>
              </div>
           </div>

           <div className="relative h-56 bg-slate-100 rounded-[2.5rem] overflow-hidden border border-slate-200/50">
              <div className="absolute inset-0 opacity-40 grayscale pointer-events-none" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1000&auto=format&fit=crop)' }} />
              
              <motion.div 
                animate={{ x: [20, 200, 20], y: [40, 100, 40] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-10 h-10 bg-navy rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"
              >
                <Bus size={16} />
              </motion.div>

              <div className="absolute bottom-5 left-5 right-5 flex gap-2">
                 <div className="flex-1 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl shadow-lg">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Current Stop</p>
                    <p className="text-[13px] font-bold text-navy">Main Gate</p>
                 </div>
                 <div className="w-12 h-12 bg-white shadow-lg rounded-2xl flex items-center justify-center text-navy hover:bg-slate-50 cursor-pointer">
                    <Map size={18} />
                 </div>
              </div>
           </div>
        </section>

        {/* 4. HOSTEL HUB */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <h3 className="text-[17px] font-bold text-navy tracking-tight">Hostel Status</h3>
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 h-[184px] flex flex-col justify-between group cursor-pointer hover:border-navy transition-all">
                 <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-navy">
                       <Waves size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Room: B-4-12</span>
                 </div>
                 <div>
                    <h4 className="text-[16px] font-bold text-navy">My Residence</h4>
                    <p className="text-[12px] text-slate-400 mt-1">UniKL MIIT Residence A. Check your stay details and key sync status.</p>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-[17px] font-bold text-navy tracking-tight">New Application</h3>
              <div className="bg-navy rounded-[2.5rem] p-6 text-white h-[184px] flex flex-col justify-between group cursor-pointer hover:bg-navy/90 transition-all shadow-xl shadow-navy/20">
                 <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400">
                       <CalendarCheck size={18} />
                    </div>
                    <ArrowUpRight size={18} className="text-white/20 group-hover:text-white" />
                 </div>
                 <div>
                    <h4 className="text-[16px] font-bold">Apply for Hostel</h4>
                    <p className="text-[12px] text-white/40 mt-1">Submit a new application or renew your stay for the next semester.</p>
                 </div>
              </div>
           </div>
        </section>

        {/* 5. QUICK LINKS */}
        <section className="space-y-3">
           <h3 className="text-[17px] font-bold text-navy tracking-tight">Other Services</h3>
           {[
             { name: "Printing Rules", icon: Printer },
             { name: "Bus Schedule", icon: Bus },
             { name: "Campus Map", icon: Map },
           ].map((u, i) => (
             <div key={i} className="p-5 bg-white border border-slate-50 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-navy group-hover:text-white transition-all">
                      <u.icon size={18} />
                   </div>
                   <h4 className="text-[14px] font-bold text-navy">{u.name}</h4>
                </div>
                <ArrowUpRight size={16} className="text-slate-200 group-hover:text-navy" />
             </div>
           ))}
        </section>

      </div>
    </main>
  );
}
