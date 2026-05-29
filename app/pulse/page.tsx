'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, query, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';
import { 
  Search, ChevronLeft, Activity, Plus,
  ShoppingBag, Footprints, ClipboardList, ChevronRight, Radio, Box
} from 'lucide-react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import CampusVitals from '@/components/shared/CampusVitals';
import CreatePulsePost from '@/components/pulse/CreatePulsePost';

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[21px] font-bold text-[#000000] tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[13px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

// Quick-stat tiles — all routes are live and working
const MOSAIC_TILES = [
  { id: 't1', label: 'Marketplace', sublabel: 'Browse active listings', icon: ShoppingBag, path: '/marketplace', color: 'bg-slate-50', span: 'col-span-8' },
  { id: 't2', label: 'Deliveries', sublabel: 'Request a run', icon: Footprints, path: '/run', color: 'bg-slate-50', span: 'col-span-4' },
  { id: 't3', label: 'My Orders', sublabel: 'Track your purchases', icon: ClipboardList, path: '/me/orders', color: 'bg-slate-50', span: 'col-span-12' },
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
    <main className="min-h-screen bg-white text-[#000000] antialiased pb-40">
      
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

         {/* ── OFFICIAL BREAKING NEWS BANNER ── */}
         <section className="space-y-4">
            <div className="px-1">
               <Subtext>Official announcements and university news</Subtext>
            </div>
            
            {announcements.filter(a => a.type === 'OFFICIAL' || a.tag === 'ADMIN').length > 0 ? (
               <div className="relative h-[180px] bg-[#111111] rounded-[32px] p-10 overflow-hidden shadow-xl shadow-slate-900/10">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <AnimatePresence mode="wait">
                     <motion.div
                       key={annIndex}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -20 }}
                       className="space-y-2 relative z-10"
                     >
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">{announcements.filter(a => a.type === 'OFFICIAL' || a.tag === 'ADMIN')[annIndex % Math.max(1, announcements.filter(a => a.type === 'OFFICIAL' || a.tag === 'ADMIN').length)]?.tag || 'Official'}</span>
                        <h3 className="text-[20px] font-bold text-white leading-tight pr-12">{announcements.filter(a => a.type === 'OFFICIAL' || a.tag === 'ADMIN')[annIndex % Math.max(1, announcements.filter(a => a.type === 'OFFICIAL' || a.tag === 'ADMIN').length)]?.headline}</h3>
                        <p className="text-[13px] text-white/50 font-medium line-clamp-2">{announcements.filter(a => a.type === 'OFFICIAL' || a.tag === 'ADMIN')[annIndex % Math.max(1, announcements.filter(a => a.type === 'OFFICIAL' || a.tag === 'ADMIN').length)]?.body}</p>
                     </motion.div>
                  </AnimatePresence>
                  <div className="absolute bottom-8 right-10 flex gap-2">
                     {announcements.filter(a => a.type === 'OFFICIAL' || a.tag === 'ADMIN').map((_, i) => (
                       <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === (annIndex % Math.max(1, announcements.filter(a => a.type === 'OFFICIAL' || a.tag === 'ADMIN').length)) ? 'w-6 bg-white' : 'w-1.5 bg-white/20'}`} />
                     ))}
                  </div>
               </div>
            ) : (
               <div className="h-[180px] bg-slate-50/50 border border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Radio size={24} className="opacity-50" />
                  <p className="text-[13px] font-medium tracking-tight">No active announcements</p>
               </div>
            )}
         </section>

         {/* ── CAMPUS QUICK ACCESS ── */}
         <section className="space-y-8">
            <div className="px-1">
               <Heading>Quick Access</Heading>
               <Subtext>Shortcuts to your most-used campus services</Subtext>
            </div>
            <div className="grid grid-cols-12 gap-4">
               {MOSAIC_TILES.map(tile => (
                  <button 
                    key={tile.id} 
                    onClick={() => router.push(tile.path)}
                    className={`${tile.span} h-[100px] ${tile.color} rounded-[32px] p-6 flex items-center justify-between group active:scale-[0.98] border border-slate-100 transition-all hover:border-slate-200 shadow-sm`}
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#000000] border border-slate-100 shadow-sm">
                           <tile.icon size={20} />
                        </div>
                        <div className="text-left">
                           <p className="text-[14px] font-bold text-[#000000] tracking-tight">{tile.label}</p>
                           {'sublabel' in tile && <p className="text-[11px] font-medium text-[#94a3b8] mt-0.5">{tile.sublabel}</p>}
                        </div>
                     </div>
                     <ChevronRight size={16} className="text-slate-200 group-hover:text-slate-400 transition-colors shrink-0" />
                  </button>
               ))}
            </div>
         </section>

         {/* Removed Campus Feed as per request */}
      </div>

      <CampusVitals />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </main>
  );
}
