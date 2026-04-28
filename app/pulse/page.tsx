'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { Bell, Settings, Search, ChevronLeft, ChevronRight, Activity, Shield, AlertTriangle, Clock, CheckCircle, BookOpen, CalendarDays, Home, Users, ArrowRight, Plus, Sparkles, Map as MapIcon } from 'lucide-react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import CreateListing from '@/components/CreateListing';

// ── Pulse Bulletin Data ──
const PRIORITY_CARD = {
  tag: 'HOSTEL · ADMINISTRATIVE',
  headline: 'Hostel Applications Now Open',
  body: 'Students can apply for Semester 2 2026/27 hostel placement via the UniKL Student Portal. Priority given to first-year students. Deadline: 30 April 2026.',
  cta: 'Apply on Portal',
  img: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1000&auto=format&fit=crop',
};

const CAMPUS_LIFE = [
  {
    id: 'cl1', category: 'EVENT', label: 'Tomorrow',
    title: 'Motivational Talk: Ignite Your Purpose',
    body: 'Prof. Dr. Zainal Abidin · Main Hall, 9AM–12PM. All students welcome.',
    img: 'https://images.unsplash.com/photo-1540575861501-7c00117fb3c9?q=80&w=600&auto=format&fit=crop',
    color: 'bg-emerald-500',
  },
  {
    id: 'cl2', category: 'CLUB', label: 'New Drop',
    title: "Badminton Club Official Jersey '26 Released",
    body: 'RM 95 · Available at L3 Hub or Pulse Marketplace. Limited to 50 units.',
    img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop',
    color: 'bg-purple-500',
  },
  {
    id: 'cl3', category: 'ADMIN', label: 'Notice',
    title: 'Library Extended Hours: Finals Month',
    body: '24/7 access at East Wing nodes until 15 May. Student ID required for entry.',
    img: 'https://images.unsplash.com/photo-1507733053046-099131bab681?q=80&w=600&auto=format&fit=crop',
    color: 'bg-blue-500',
  },
];

const ACADEMIC_ALERTS = [
  { id: 'aa1', category: 'EXAM',     title: 'Final Exam Timetable Released',     time: '1h ago',  urgent: true,  icon: BookOpen,    iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
  { id: 'aa2', category: 'FEE',      title: 'Tuition Fee Deadline: 10 May 2026', time: '3h ago',  urgent: true,  icon: AlertTriangle, iconBg: 'bg-red-50',    iconColor: 'text-red-500'    },
  { id: 'aa3', category: 'RESULT',   title: 'Sem 1 Results Now Available',        time: '1d ago',  urgent: false, icon: CheckCircle, iconBg: 'bg-emerald-50',iconColor: 'text-emerald-500'},
  { id: 'aa4', category: 'DEADLINE', title: 'Course Add/Drop Closes 28 April',    time: '2d ago',  urgent: false, icon: Clock,       iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
];

const FACILITIES = [
  { id: 'f1', name: 'Library East', status: 'Available Now', seats: '14/20', available: true, color: 'bg-emerald-500' },
  { id: 'f2', name: 'Lab A-301',    status: 'Available Now', seats: '8/30',  available: true, color: 'bg-emerald-500' },
  { id: 'f3', name: 'Auditorium',  status: 'Available Now', seats: '0/200', available: false, color: 'bg-amber-400'   },
];

const NEWS_FEED = [
  { 
    id: 'n1', 
    tag: 'ACHIEVEMENT', 
    title: 'UniKL MIIT Ranked Top 5 Nationwide', 
    time: '1d ago', 
    img: 'https://images.unsplash.com/photo-1523240715639-99781313a4be?q=80&w=200&auto=format&fit=crop',
    circleBg: 'bg-[#FFF3EB]' // Orange tint
  },
  { 
    id: 'n2', 
    tag: 'POLICY',      
    title: 'Updated Student Code of Conduct', 
    time: '2d ago', 
    img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=200&auto=format&fit=crop',
    circleBg: 'bg-[#EBF3FF]' // Blue tint
  },
  { 
    id: 'n3', 
    tag: 'RESEARCH',    
    title: 'New Innovation Lab Opens at North Campus',         
    time: '3d ago', 
    img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=200&auto=format&fit=crop',
    circleBg: 'bg-[#F3E8FF]' // Purple tint
  },
];

const STATUS_LABEL: Record<string, string> = { open: 'Open', limited: 'Limited', closed: 'Closed' };

export default function PulseBulletinPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState('1h');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [scrollDir, setScrollDir] = useState<'up' | 'down'>('up');
  const [showSellLabel, setShowSellLabel] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let lastScroll = 0;
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setShowSellLabel(currentScroll < 100);
      setScrollDir(currentScroll > lastScroll ? 'down' : 'up');
      lastScroll = currentScroll;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) return;
      onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
      const q = query(collection(db, 'transactions'), where('buyer_id', '==', user.uid), where('status', '==', 'PENDING'));
      onSnapshot(q, s => setNotificationCount(s.docs.length));
    });
    return () => unsub();
  }, []);

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">

      {/* ── FIXED NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-100 px-5 pt-8 pb-4 flex items-center gap-3 bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-navy/40 hover:text-navy transition-all active:scale-90">
          <ChevronLeft size={28} strokeWidth={2} />
        </button>
        <div className="flex-1">
          <div className="relative group">
            <button onClick={() => setIsSearchOpen(true)} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-full flex items-center px-4 gap-3">
              <Search size={18} className="text-slate-300" />
              <span className="text-[13px] font-bold text-slate-300">Search Pulse</span>
            </button>
            <AnimatePresence>
              {showSellLabel && (
                <motion.button 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onClick={() => setIsCreateOpen(true)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 py-1 px-3 bg-white/80 rounded-full border border-slate-100 shadow-sm hover:border-accent group-hover:bg-white transition-all"
                >
                  <Sparkles size={12} className="text-accent" />
                  <span className="text-[10px] font-bold text-navy/40">Got something for campus?</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => router.push('/activity')} className="relative p-2 active:scale-90 text-navy/40 hover:text-navy">
            <Bell size={22} strokeWidth={2} />
            {notificationCount > 0 && <div className="absolute top-1.5 right-1.5 bg-accent text-white text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-[#FDFDFD]">{notificationCount}</div>}
          </button>
          <AvatarDropdown 
            photoUrl={profile?.photo_url} 
            userName={profile?.full_name || 'P'} 
          />
        </div>
      </nav>

      <div className="pt-28 space-y-10 pb-12">

        {/* ── EDITORIAL HEADER ── */}
        <div className="px-6">
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Pulse Bulletin</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[11px] font-medium text-slate-400">UniKL City Campus · Live</p>
          </div>
        </div>

        {/* ── PRIORITY CARD (Purple Banner: 180px) ── */}
        <div className="px-6">
          <motion.div whileTap={{ scale: 0.98 }} className="relative rounded-[2rem] overflow-hidden bg-purple-500 p-8 flex flex-col justify-between shadow-sm cursor-pointer h-[180px]">
             {/* Subtle internal texture/pattern */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{PRIORITY_CARD.tag}</span>
                </div>
                <div>
                  <h2 className="text-white text-[24px] font-bold leading-tight tracking-tight mb-2">{PRIORITY_CARD.headline}</h2>
                  <p className="text-white/80 text-[11px] font-medium leading-snug line-clamp-1 max-w-[260px]">{PRIORITY_CARD.body}</p>
                </div>
             </div>
          </motion.div>
        </div>

        {/* ── 1. LIVE STATUS RIBBON (Seamless Entry Points) ── */}
        <div className="space-y-3">
          <div className="px-6 flex items-center justify-between">
            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Live Status</h3>
            <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest">Tap to Reserve</p>
          </div>
          <div className="flex gap-2 overflow-x-auto px-6 no-scrollbar">
            {FACILITIES.map((f) => (
              <motion.button
                key={f.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedRoom(f)}
                className="shrink-0 h-[56px] px-4 rounded-[12px] border border-slate-50 bg-white flex items-center gap-3 shadow-sm"
              >
                <div className={`w-2 h-2 rounded-full ${f.available ? 'bg-teal-500 animate-pulse' : 'bg-red-500'}`} />
                <div className="flex flex-col text-left">
                  <p className="text-[14px] font-bold text-navy leading-none mb-1">{f.name}: {f.seats}</p>
                  <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest">{f.available ? 'Available' : 'Full'}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── CAMPUS LIFE ── */}
        <div>
          <div className="px-6 mb-6">
            <h3 className="text-[18px] font-bold text-navy tracking-tight">Campus Life</h3>
            <p className="text-[11px] text-[#8E8E93] font-medium mt-0.5">Events, notices & club activity</p>
          </div>
          <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar pb-1">
            {CAMPUS_LIFE.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.97 }}
                className="shrink-0 w-[240px] rounded-4xl overflow-hidden cursor-pointer shadow-md shadow-navy/5"
              >
                <div className="relative h-[130px]">
                  <img src={item.img} className="w-full h-full object-cover" alt={item.title} />
                  <div className="absolute inset-0 bg-navy/50" />
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 ${item.color} rounded-lg text-[9px] font-black text-white uppercase tracking-widest`}>{item.label}</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-100 border-t-0 p-4 rounded-b-[2rem]">
                  <h4 className="text-[13px] font-bold text-navy leading-tight line-clamp-2 mb-1">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-snug line-clamp-2">{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── ACADEMIC ALERTS (EDITORIAL MINIMALISM) ── */}
        <div className="px-6">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-[18px] font-bold text-navy tracking-tight">Academic Alerts</h3>
          </div>
          <div className="space-y-1">
            {ACADEMIC_ALERTS.map((alert) => (
              <div key={alert.id} className="py-3 border-b border-slate-50 last:border-0">
                <button
                  onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                  className="w-full flex items-center gap-4 transition-all text-left"
                >
                  {/* Minimalist Colored Dot */}
                  <div className={`w-2 h-2 rounded-full shrink-0 ${alert.iconColor.replace('text-', 'bg-')}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] font-bold text-navy leading-snug truncate">
                        {alert.title}
                      </p>
                      <span className="text-[13px] text-[#8E8E93] font-bold whitespace-nowrap">{alert.time}</span>
                    </div>
                  </div>
                </button>
                <AnimatePresence>
                  {expandedAlert === alert.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-6 pt-3">
                        <p className="text-[11px] text-[#8E8E93] font-medium leading-relaxed">
                          Official academic alert from the UniKL Registrar's Office.
                        </p>
                        <button className="mt-2 text-[11px] font-bold text-accent">Open Portal →</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. DIRECTORY QUICK-ACCESS (Icon Grid) ── */}
        <div className="px-6 space-y-6">
           <h3 className="text-[18px] font-bold text-navy tracking-tight">Directory</h3>
           <div className="grid grid-cols-4 gap-4">
              {[
                { icon: MapIcon, label: 'Campus Map', path: '/map' },
                { icon: Users, label: 'Staff Contacts', path: '/contacts' },
                { icon: Activity, label: 'Bus Tracker', path: '/bus' },
                { icon: BookOpen, label: 'Café Menu', path: '/cafe' },
              ].map((item) => (
                <button 
                  key={item.label}
                  onClick={() => router.push(item.path)}
                  className="flex flex-col items-center gap-3 active:scale-90 transition-all"
                >
                  <item.icon size={24} strokeWidth={1.5} className="text-navy/40" />
                  <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-tighter whitespace-nowrap">{item.label}</span>
                </button>
              ))}
           </div>
        </div>


        {/* ── 3. ACTIONABLE INSTITUTIONAL REGISTRY (Slim Design: 60px) ── */}
        <div className="px-6 pb-24">
          <h3 className="text-[18px] font-bold text-navy tracking-tight mb-6">Institutional Registry</h3>
          <div className="flex flex-col gap-3">
            {NEWS_FEED.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.98 }}
                className="w-full h-[64px] bg-white border border-slate-50 rounded-[12px] px-4 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-all relative group"
              >
                {/* Left Side Content */}
                <div className="flex flex-col min-w-0 pr-12">
                  <h4 className="text-[13px] font-bold text-navy leading-tight line-clamp-1">{item.title}</h4>
                  <p className="text-[11px] text-[#8E8E93] font-medium uppercase tracking-wider">{item.tag} · {item.time}</p>
                </div>

                {/* Ghost Action Button (Deep Link) */}
                <button className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all px-2 py-1 bg-slate-50 rounded-md flex items-center gap-1.5 border border-slate-100">
                  <span className="text-[9px] font-black text-navy uppercase tracking-tighter">View ↗</span>
                </button>

                {/* Right Side Graphic (Tiny) */}
                <div className="w-10 h-10 rounded-[8px] overflow-hidden border border-slate-100 shrink-0 ml-4">
                  <img src={item.img} className="w-full h-full object-cover" alt={item.title} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ── RESERVATION BOTTOM SHEET (THE FRICTIONLESS RESERVE) ── */}
      <AnimatePresence>
        {selectedRoom && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRoom(null)}
              className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-[110]" 
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 pb-12 z-[120] shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
              <div className="mb-8">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-1">Reservation</p>
                <h3 className="text-[24px] font-bold text-navy">{selectedRoom.name}</h3>
                <p className="text-[14px] text-slate-400 font-medium">Select your duration</p>
              </div>

              <div className="flex gap-3 mb-10 overflow-x-auto no-scrollbar">
                {['30m', '1h', '2h', '3h', '4h'].map((time) => (
                  <button 
                    key={time} 
                    onClick={() => setSelectedDuration(time)}
                    className={`shrink-0 w-20 h-20 rounded-3xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                      selectedDuration === time 
                        ? 'bg-navy text-white border-navy shadow-lg shadow-navy/20' 
                        : 'bg-slate-50 text-navy/40 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <span className="text-[16px] font-bold">{time.replace('m', '').replace('h', '')}</span>
                    <span className="text-[10px] font-black uppercase opacity-60">{time.includes('m') ? 'min' : 'hrs'}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="w-full h-16 bg-navy text-white rounded-2xl text-[15px] font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Confirm Booking <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="w-full h-12 text-slate-300 text-[13px] font-bold hover:text-navy/40 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCreateOpen && profile && (
          <CreateListing 
            userId={auth.currentUser?.uid || ''} 
            role={profile.role || 'STUDENT'} 
            onClose={() => setIsCreateOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* ── MORPHING SELL FAB (THE GHOST TRIGGER) ── */}
      <motion.button
        layout
        onClick={() => setIsCreateOpen(true)}
        initial={false}
        animate={{
          width: showSellLabel ? 110 : 56,
          height: 56,
          borderRadius: 28,
        }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20
        }}
        className="fixed bottom-10 right-8 z-[90] bg-navy text-white shadow-2xl flex items-center justify-center overflow-hidden hover:scale-105 active:scale-95 transition-transform"
      >
        <motion.div className="flex items-center gap-3 px-6">
          <Plus size={24} className="shrink-0" />
          <AnimatePresence mode="wait">
            {showSellLabel && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-[14px] font-bold whitespace-nowrap"
              >
                Sell
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.button>

    </main>
  );
}
