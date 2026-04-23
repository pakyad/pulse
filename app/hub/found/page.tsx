'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Clock, 
  ChevronLeft, 
  Plus, 
  Filter, 
  Package, 
  Camera, 
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const FOUND_ITEMS = [
  { id: 1, title: "Matric Card (MIIT)", location: "Level 4 Labs", time: "1h ago", img: "https://images.unsplash.com/photo-1611095773767-114b510d16f8?q=80&w=1000&auto=format&fit=crop", status: "VERIFIED" },
  { id: 2, title: "Silver Hydro Flask", location: "Grand Hall", time: "3h ago", img: "https://images.unsplash.com/photo-1602143303410-7199d13f8ed3?q=80&w=1000&auto=format&fit=crop", status: "PENDING" },
  { id: 3, title: "Mechanical Keyboard", location: "Library Hub", time: "5h ago", img: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=1000&auto=format&fit=crop", status: "VERIFIED" },
  { id: 4, title: "Car Keys (Audi)", location: "Parking A1", time: "8h ago", img: "https://images.unsplash.com/photo-1549194382-346a858176b0?q=80&w=1000&auto=format&fit=crop", status: "SECURE" },
];

export default function FoundHub() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('FOUND'); // FOUND | LOST

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">
      {/* 1. DYNAMIC HEADER */}
      <section className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-50 border-b border-slate-50">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-navy hover:bg-slate-50 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Items</p>
          <h1 className="text-[18px] font-bold tracking-tight text-navy">Lost & Found</h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-navy/40">
          <Filter size={18} />
        </button>
      </section>

      <div className="max-w-2xl mx-auto px-6 mt-8 space-y-12">
        
        {/* 2. REGISTRY SWITCHER */}
        <div className="flex bg-slate-50 p-1.5 rounded-[2rem] border border-slate-100 relative">
           <motion.div 
             className="absolute inset-1.5 w-[calc(50%-6px)] bg-white rounded-[1.8rem] shadow-sm z-0"
             animate={{ x: activeTab === 'FOUND' ? 0 : '100%' }}
             transition={{ type: "spring", stiffness: 300, damping: 30 }}
           />
           {['FOUND', 'LOST'].map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-widest relative z-10 transition-colors ${activeTab === tab ? 'text-navy' : 'text-slate-300'}`}
             >
               {tab} Items
             </button>
           ))}
        </div>

        {/* 3. SEARCH & REPORT */}
        <section className="space-y-4">
           <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-navy transition-colors">
                 <Search size={20} />
              </div>
              <input 
                 type="text" 
                 placeholder="Search for an item..."
                 className="w-full h-14 bg-white border border-slate-100 rounded-[2rem] pl-16 pr-6 text-[14px] font-medium outline-none focus:border-navy focus:shadow-2xl focus:shadow-navy/5 transition-all"
              />
           </div>

           <div className="bg-amber-50 rounded-[3rem] p-8 border border-amber-100/50 flex items-center justify-between group cursor-pointer hover:bg-amber-100/30 transition-all">
              <div className="space-y-1">
                 <h3 className="text-[18px] font-bold text-amber-900 tracking-tight leading-none">Report an Item</h3>
                 <p className="text-[13px] text-amber-700/60 font-medium">Found something? Let others know.</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10 group-hover:scale-110 transition-transform">
                 <Camera size={24} />
              </div>
           </div>
        </section>

        {/* 4. ITEM LIST */}
        <section className="space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="text-[17px] font-bold text-navy tracking-tight">Recently Found</h3>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Live Update</span>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {FOUND_ITEMS.map((item, i) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row group cursor-pointer hover:shadow-2xl hover:shadow-navy/5 transition-all"
                >
                   <div className="w-full md:w-40 aspect-square md:aspect-auto overflow-hidden relative bg-slate-50">
                      <img src={item.img} className="w-full h-full object-cover transition-all duration-700" alt="" />
                      <div className="absolute top-3 left-3">
                         <div className="px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-full border border-white/20 shadow-sm">
                            <p className="text-[9px] font-bold text-navy uppercase tracking-widest">{item.status}</p>
                         </div>
                      </div>
                   </div>
                   <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="space-y-1">
                         <div className="flex items-center gap-2 mb-1">
                            <Clock size={12} className="text-slate-300" />
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{item.time}</p>
                         </div>
                         <h4 className="text-[18px] font-bold text-navy leading-tight tracking-tight group-hover:text-amber-600 transition-colors">{item.title}</h4>
                         <div className="flex items-center gap-2 pt-1 text-slate-400">
                            <MapPin size={14} strokeWidth={1.5} />
                            <p className="text-[13px] font-medium leading-none">{item.location}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50">
                         <div className="flex items-center gap-2 text-green-600">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Ready to Claim</span>
                         </div>
                         <button className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-navy group-hover:translate-x-2 transition-transform">
                            Claim <ArrowRight size={16} />
                         </button>
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* 5. HOW TO CLAIM */}
        <section className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 text-center space-y-4">
           <div className="w-12 h-12 rounded-full bg-white mx-auto flex items-center justify-center text-navy shadow-sm">
              <CheckCircle2 size={24} />
           </div>
           <div className="space-y-1">
              <h3 className="text-[17px] font-bold text-navy tracking-tight">How to Claim</h3>
              <p className="text-[13px] text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
                 To get your item back, you need to show your Student ID for verification.
              </p>
           </div>
           <button className="text-[11px] font-bold text-navy uppercase tracking-widest underline underline-offset-8 decoration-slate-200">
              View Policies
           </button>
        </section>

      </div>

      {/* FLOATING ACTION PILL */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <button className="bg-navy text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl shadow-navy/40 hover:scale-105 active:scale-95 transition-all">
          <Plus size={18} />
          <span className="text-[11px] font-black uppercase tracking-widest text-nowrap">Report found item</span>
        </button>
      </div>

    </main>
  );
}
