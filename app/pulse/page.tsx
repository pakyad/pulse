'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, query, orderBy, limit } from 'firebase/firestore';
import { 
  Search, ChevronLeft, Activity, Plus, Map as MapIcon, 
  Bus, Users, ChevronRight, Radio, ArrowUpRight, Box
} from 'lucide-react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import CampusVitals from '@/components/shared/CampusVitals';
import CreatePulsePost from '@/components/pulse/CreatePulsePost';

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[21px] font-bold text-[#1e293b] tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[13px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

const MOSAIC_TILES = [
  { id: 't1', label: 'Campus Map', icon: MapIcon, path: '/map', color: 'bg-slate-50', span: 'col-span-8' },
  { id: 't2', label: 'Shuttle Bus', icon: Bus, path: '/bus', color: 'bg-slate-50', span: 'col-span-4' },
  { id: 't3', label: 'Student Directory', icon: Users, path: '/contacts', color: 'bg-slate-50', span: 'col-span-12' },
];

export default function PulseBulletinPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPulseCreateOpen, setIsPulseCreateOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [annIndex, setAnnIndex] = useState(0);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubAuth = auth.onAuthStateChanged((user) => {
      // Clear existing listeners on auth change
      unsubs.forEach(u => u());
      unsubs = [];

      if (user) {
        // 👤 Profile Sync
        const uProfile = onSnapshot(doc(db, 'users', user.uid), 
          s => setProfile(s.data()),
          e => console.error("[Pulse] Profile Sync Error:", e)
        );
        unsubs.push(uProfile);
      }

      // 📢 Announcements (Public)
      const uAnn = onSnapshot(
        query(collection(db, 'announcements'), orderBy('created_at', 'desc')), 
        s => setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() }))),
        e => console.error("[Pulse] Announce Sync Error:", e)
      );
      unsubs.push(uAnn);

      // 🏢 Facilities (Public)
      const uFac = onSnapshot(
        collection(db, 'facilities'), 
        s => setFacilities(s.docs.map(d => ({ id: d.id, ...d.data() }))),
        e => console.error("[Pulse] Facilities Sync Error:", e)
      );
      unsubs.push(uFac);

      // 📅 Events (Public)
      const uEvents = onSnapshot(
        query(collection(db, 'events'), orderBy('date', 'asc'), limit(10)), 
        s => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))),
        e => console.error("[Pulse] Events Sync Error:", e)
      );
      unsubs.push(uEvents);
    });

    return () => { 
      unsubAuth(); 
      unsubs.forEach(u => u()); 
    };
  }, []);

  useEffect(() => {
    if (announcements.length === 0) return;
    const timer = setInterval(() => setAnnIndex(p => (p + 1) % announcements.length), 5000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-40">
      
      {/* ── GLOBAL NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
         <div className="flex items-center gap-3">
            <button onClick={() => router.push('/home')} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all">
               <ChevronLeft size={18} />
            </button>
            <p className="text-[14px] font-bold tracking-tight">Pulse</p>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => setIsSearchOpen(true)} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all">
               <Search size={18} />
            </button>
            <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
         </div>
      </nav>

      <div className="pt-24 px-6 space-y-12">

         {/* ── CAMPUS BULLETIN (HIDDEN IF EMPTY) ── */}
         <AnimatePresence>
            {announcements.length > 0 && (
               <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 overflow-hidden">
                  <div className="px-1">
                     <Subtext>Official announcements and university news</Subtext>
                  </div>
                  
                  <div className="relative h-[180px] bg-[#1e293b] rounded-[20px] p-10 overflow-hidden shadow-xl shadow-slate-900/10">
                     <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                     <AnimatePresence mode="wait">
                        <motion.div
                          key={annIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-2 relative z-10"
                        >
                           <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{announcements[annIndex].tag || 'Official'}</span>
                           <h3 className="text-[20px] font-bold text-white leading-tight pr-12">{announcements[annIndex].headline}</h3>
                           <p className="text-[13px] text-white/50 font-medium line-clamp-2">{announcements[annIndex].body}</p>
                        </motion.div>
                     </AnimatePresence>
                     <div className="absolute bottom-8 right-10 flex gap-2">
                        {announcements.map((_, i) => (
                          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === annIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/20'}`} />
                        ))}
                     </div>
                  </div>
               </motion.section>
            )}
         </AnimatePresence>

         {/* ── CAMPUS SERVICES ── */}
         <section className="space-y-8">
            <div className="px-1">
               <Heading>Campus Services</Heading>
               <Subtext>Quick access to university tools and directories</Subtext>
            </div>
            <div className="grid grid-cols-12 gap-4">
               {MOSAIC_TILES.map(tile => (
                  <button 
                    key={tile.id} 
                    onClick={() => router.push(tile.path)}
                    className={`${tile.span} h-[100px] ${tile.color} rounded-[32px] p-6 flex items-center justify-between group active:scale-[0.98] border border-slate-100 transition-all hover:border-slate-300 shadow-sm`}
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#1e293b] border border-slate-50 shadow-sm">
                           <tile.icon size={22} />
                        </div>
                        <p className="text-[15px] font-bold text-[#1e293b] tracking-tight">{tile.label}</p>
                     </div>
                     <ChevronRight size={18} className="text-slate-200 group-hover:text-[#1e293b] transition-colors" />
                  </button>
               ))}
            </div>
         </section>

         {/* ── CAMPUS EVENTS (HIDDEN IF EMPTY) ── */}
         <AnimatePresence>
            {events.length > 0 && (
               <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-8 overflow-hidden">
                  <div className="flex justify-between items-end px-1">
                     <div>
                        <Heading>Recent Activity</Heading>
                        <Subtext>Current campus events and student posts</Subtext>
                     </div>
                     <button className="text-[12px] font-bold text-[#1e293b] flex items-center gap-1.5 active:scale-95 transition-all">
                        See All <ArrowUpRight size={16} />
                     </button>
                  </div>
                  <div className="flex gap-5 overflow-x-auto no-scrollbar -mx-8 px-8 pb-2">
                     {events.map(item => (
                        <motion.div 
                          key={item.id}
                          whileTap={{ scale: 0.98 }}
                          className="relative shrink-0 w-[240px] h-[320px] rounded-[20px] overflow-hidden group cursor-pointer shadow-lg shadow-slate-900/5"
                        >
                           <img src={item.img || item.image_url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={item.title} />
                           <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
                           <div className="absolute top-6 left-6">
                              <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-[9px] font-bold text-white uppercase tracking-widest border border-white/10">{item.status}</span>
                           </div>
                           <div className="absolute bottom-8 left-8 right-8">
                              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{item.tag}</p>
                              <h3 className="text-[18px] font-bold text-white tracking-tight leading-tight">{item.title}</h3>
                           </div>
                        </motion.div>
                     ))}
                  </div>
               </motion.section>
            )}
         </AnimatePresence>

         {/* ── FACILITY STATUS ── */}
         <section className="space-y-8 pb-12">
            <div className="px-1">
               <Heading>Facility Status</Heading>
               <Subtext>Check occupancy and availability for campus rooms</Subtext>
            </div>
            <div className="space-y-3">
               {facilities.length > 0 ? facilities.map(item => (
                  <button 
                    key={item.id}
                    className="w-full h-[84px] px-8 bg-white border border-slate-100 rounded-[32px] flex items-center justify-between group active:scale-[0.98] transition-all hover:border-slate-300 shadow-sm"
                  >
                     <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-[#1e293b] group-hover:text-white transition-all">
                           <Radio size={20} />
                        </div>
                        <div className="text-left">
                           <h4 className="text-[15px] font-bold text-[#1e293b] tracking-tight">{item.name}</h4>
                           <p className="text-[12px] text-[#94a3b8] font-medium">Available: {item.count}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${item.status === 'available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500'}`} />
                        <ChevronRight size={18} className="text-slate-200" />
                     </div>
                  </button>
               )) : (
                  <div className="py-10 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-100 flex flex-col items-center justify-center text-[#94a3b8] gap-3">
                     <Radio size={24} strokeWidth={1} className="opacity-20" />
                     <p className="text-[11px] font-bold uppercase tracking-widest">No facility data found</p>
                  </div>
               )}
            </div>
         </section>
      </div>

      <CampusVitals />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CreatePulsePost isOpen={isPulseCreateOpen} onClose={() => setIsPulseCreateOpen(false)} />

      <AnimatePresence>
         {(profile?.role === 'ADMIN' || profile?.role === 'CLUB' || profile?.role === 'OFFICIAL') && (
           <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }} whileTap={{ scale: 0.9 }} onClick={() => setIsPulseCreateOpen(true)} className="fixed bottom-32 right-8 w-16 h-16 bg-[#1e293b] text-white rounded-[24px] shadow-2xl shadow-slate-900/20 flex items-center justify-center z-50 border border-white/10">
             <Plus size={28} />
           </motion.button>
         )}
      </AnimatePresence>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </main>
  );
}
