'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { 
  Bell, Search, ChevronLeft, Activity, 
  ArrowRight, Plus, Map as MapIcon, Zap,
  Users, BookOpen, Coffee, Bus, Cloud, Train, AlertCircle,
  ChevronDown
} from 'lucide-react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import CreateListing from '@/components/CreateListing';
import CampusVitals from '@/components/shared/CampusVitals';

// ── Pulse Bulletin Data ──
const ANNOUNCEMENTS = [
  {
    id: 'a1',
    tag: 'HOSTEL · ADMINISTRATIVE',
    headline: 'Hostel Applications Now Open',
    body: 'Apply for Semester 2 2026/27 hostel placement via the UniKL Portal. Deadline: 30 April.',
  },
  {
    id: 'a2',
    tag: 'EXAM · REGISTRAR',
    headline: 'Final Exam Timetable Released',
    body: 'The official Final Examination timetable for May 2026 is now available for download.',
  },
  {
    id: 'a3',
    tag: 'FINANCE · NOTICE',
    headline: 'Tuition Fee Deadline: 10 May',
    body: 'Ensure all outstanding fees are settled before the deadline to avoid registration holds.',
  },
];

// ── Discovery Layer: Mosaic Hub ──
const MOSAIC_TILES = [
  { id: 't1', label: 'Campus Map', icon: MapIcon, path: '/map', color: 'bg-[#F2F5FF]', textColor: 'text-[#5C7CFA]', span: 'col-span-8 h-40' },
  { id: 't2', label: 'Bus', icon: Bus, path: '/bus', color: 'bg-[#FFF9DB]', textColor: 'text-[#FCC419]', span: 'col-span-4 h-40' },
  { id: 't3', label: 'Staff Directory', icon: Users, path: '/contacts', color: 'bg-[#F0FFF4]', textColor: 'text-[#38D9A9]', span: 'col-span-12 h-32' },
];

// ── Visual Layer: Campus Life ──
const CAMPUS_LIFE_CAROUSEL = [
  { id: 'cl1', title: 'Design Thinking', tag: 'WORKSHOP', status: 'LIVE', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600' },
  { id: 'cl2', title: 'MIIT E-Sports', tag: 'FINALS', status: 'NEW DROP', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600' },
  { id: 'cl3', title: 'Career Fair', tag: 'CAREER', status: 'TOMORROW', img: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=600' },
];

// ── Information Layer: Academic Ticker ──
const ACADEMIC_ALERTS = [
  { id: 'a1', title: 'Final Exam Timetable Released', time: '1h ago', category: 'EXAM' },
  { id: 'a2', title: 'Tuition Fee Deadline: 10 May', time: '3h ago', category: 'FEE' },
  { id: 'a3', title: 'Sem 1 Results Now Available', time: '1d ago', category: 'RESULT' },
];

const INITIAL_FACILITIES = [
  { id: 'f1', name: 'Library East Node', count: '14/20', status: 'available' },
  { id: 'f2', name: 'Software Lab A-301', count: '8/30', status: 'available' },
  { id: 'f3', name: 'Main Auditorium', count: 'Full', status: 'occupied' },
];

export default function PulseBulletinPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState('1h');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showSellLabel, setShowSellLabel] = useState(true);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [facilities, setFacilities] = useState<any[]>(INITIAL_FACILITIES);
  const [busCount, setBusCount] = useState<string>('Live');
  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowSellLabel(window.scrollY < 100);
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

    // Real-time Facilities Occupancy
    const facUnsub = onSnapshot(collection(db, 'facilities'), (s) => {
      if (!s.empty) {
        setFacilities(s.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }, (err) => {
      console.warn("[Pulse Registry] Facilities Sync Fallback:", err);
      setFacilities(INITIAL_FACILITIES);
    });

    // Real-time Bus Occupancy
    const busUnsub = onSnapshot(doc(db, 'vitals', 'occupancy'), (s) => {
      if (s.exists()) {
        setBusCount(s.data().bus || 'Live');
      }
    }, (err) => {
      console.warn("[Pulse Vitals] Bus Sync Fallback:", err);
    });

    return () => {
      unsub();
      facUnsub();
      busUnsub();
    };
  }, []);

  return (
    <main className="min-h-screen bg-white pb-40 font-sans antialiased text-[#1D1D1F]">

      {/* ── OPTICAL NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 pt-4 pb-4 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b border-[#F2F2F7]">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-[#1D1D1F]/30 hover:text-[#1D1D1F] transition-all active:scale-90">
          <ChevronLeft size={24} strokeWidth={2.5} />
        </button>
        <div className="flex-1">
          <button 
            onClick={() => setIsSearchOpen(true)} 
            className="w-full h-10 bg-[#F5F5F7] rounded-full flex items-center px-4 gap-3 transition-all active:scale-[0.98]"
          >
            <Search size={16} className="text-[#8E8E93]" />
            <span className="text-[13px] font-medium text-[#8E8E93]">Search Pulse</span>
          </button>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button onClick={() => router.push('/activity')} className="relative p-1 text-[#1D1D1F]/30 hover:text-[#1D1D1F] transition-all active:scale-90">
            <Bell size={20} strokeWidth={2.5} />
            {notificationCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5 bg-[#FF3B30] text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-white">
                {notificationCount}
              </div>
            )}
          </button>
          <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'P'} />
        </div>
      </nav>

      <div className="pt-24 space-y-10">

        {/* ── PRIORITY ANNOUNCEMENTS (Official Banner Slider) ── */}
        <div className="px-6">
          <div className="relative rounded-[2rem] overflow-hidden bg-purple-500 h-[180px] cursor-pointer group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            
            <AnimatePresence mode="wait">
              <motion.div 
                key={announcementIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 flex flex-col h-full justify-between p-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{ANNOUNCEMENTS[announcementIndex].tag}</span>
                  </div>
                  <div className="flex gap-1">
                    {ANNOUNCEMENTS.map((_, i) => (
                      <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === announcementIndex ? 'w-4 bg-white' : 'w-1 bg-white/30'}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-white text-[22px] font-bold leading-tight tracking-tight mb-2">{ANNOUNCEMENTS[announcementIndex].headline}</h2>
                  <p className="text-white/80 text-[11px] font-medium leading-snug line-clamp-2 max-w-[260px]">{ANNOUNCEMENTS[announcementIndex].body}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── 1. CAMPUS LIFE (VISUAL LAYER - PRIMARY) ── */}
        <section className="space-y-6">
          <div className="px-6">
            <h2 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight">Campus Life</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto px-6 no-scrollbar pb-2">
            {CAMPUS_LIFE_CAROUSEL.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.97 }}
                className="shrink-0 w-52 aspect-[3/4.5] rounded-3xl overflow-hidden relative group cursor-pointer"
              >
                <img src={item.img} className="w-full h-full object-cover" alt={item.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-4 left-4">
                  <div className="px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">{item.status}</span>
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <span className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em] mb-1.5 block">{item.tag}</span>
                  <h3 className="text-[15px] font-bold text-white leading-tight">{item.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── 2. FACILITY BOOKING (INVISIBLE UTILITY LAYER) ── */}
        <section className="space-y-6">
          <div className="px-6">
            <h2 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight">Facility Booking</h2>
          </div>
          <div className="flex flex-col">
            {facilities.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setSelectedRoom(f)}
                className={`w-full h-[52px] px-6 flex items-center justify-between group active:bg-[#F9F9FB] transition-all border-t border-[#F2F2F7] border-[0.5px] ${i === facilities.length - 1 ? 'border-b' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]" />
                  <span className="text-[13px] font-medium text-[#1D1D1F]">{f.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-bold text-[#8E8E93] opacity-40">{f.count}</span>
                  <span className="text-[11px] font-bold text-[#007AFF] tracking-tight">Reserve ↗</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── 3. STACKED ACCORDION SYSTEM (DIRECTORY & ALERTS) ── */}
        <section className="px-6 !mt-12 space-y-0">
          
          {/* Item 1: Campus Directory */}
          <div className="border-t border-[#F2F2F7] border-[0.5px]">
            <button 
              onClick={() => setIsDirectoryOpen(!isDirectoryOpen)}
              className="w-full py-5 flex items-center justify-between bg-transparent transition-all"
            >
              <h3 className="text-[18px] font-bold text-[#1D1D1F] tracking-tight">Campus Directory</h3>
              <motion.div animate={{ rotate: isDirectoryOpen ? 180 : 0 }}>
                 <ChevronDown size={14} className="text-[#1D1D1F]" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isDirectoryOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pb-8"
                >
                  <div className="grid grid-cols-12 gap-2.5 pt-2">
                    {MOSAIC_TILES.map((tile) => (
                      <motion.button
                        key={tile.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push(tile.path)}
                        className={`${tile.span} ${tile.color} rounded-2xl p-5 flex flex-col justify-between relative`}
                      >
                        <div className="flex justify-between items-start">
                          <div className={`${tile.textColor}`}>
                            <tile.icon size={22} strokeWidth={2.5} />
                          </div>
                          {tile.id === 't2' && (
                            <div className="px-2 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-white/20">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${tile.textColor}`}>{busCount}</span>
                            </div>
                          )}
                        </div>
                        <span className={`text-[13px] font-bold tracking-tight ${tile.textColor}`}>{tile.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Item 2: Academic Alerts */}
          <div className="border-t border-[#F2F2F7] border-[0.5px]">
            <button 
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className="w-full py-5 flex items-center justify-between bg-transparent transition-all"
            >
              <h3 className="text-[18px] font-bold text-[#1D1D1F] tracking-tight">Academic Alerts</h3>
              <motion.div animate={{ rotate: isAlertsOpen ? 180 : 0 }}>
                 <ChevronDown size={14} className="text-[#1D1D1F]" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isAlertsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pb-8"
                >
                  <div className="space-y-5 pt-2">
                    {ACADEMIC_ALERTS.map((alert) => (
                      <div key={alert.id} className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FF9500]" />
                          <p className="text-[13px] font-medium text-[#1D1D1F] leading-snug">{alert.title}</p>
                        </div>
                        <span className="text-[11px] font-bold text-[#8E8E93] whitespace-nowrap opacity-40">{alert.time}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Item 3: Runner Requirements */}
          <div className="border-y border-[#F2F2F7] border-[0.5px]">
            <button 
              onClick={() => setIsRequirementsOpen(!isRequirementsOpen)}
              className="w-full py-5 flex items-center justify-between bg-transparent transition-all"
            >
              <h3 className="text-[18px] font-bold text-[#1D1D1F] tracking-tight">Runner Requirements</h3>
              <motion.div animate={{ rotate: isRequirementsOpen ? 180 : 0 }}>
                 <ChevronDown size={14} className="text-[#1D1D1F]" />
              </motion.div>
            </button>
            <AnimatePresence>
              {isRequirementsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pb-8"
                >
                  <div className="space-y-6 pt-2">
                    <div className="grid grid-cols-1 gap-5">
                      <div>
                        <p className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-1">Academic</p>
                        <p className="text-[11px] font-normal text-[#8E8E93] leading-[1.6]">Minimum GPA 2.0, no active disciplinary records.</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-1">Logistics</p>
                        <p className="text-[11px] font-normal text-[#8E8E93] leading-[1.6]">Valid student ID, access to Block A/B/C.</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-[#1D1D1F] uppercase tracking-wider mb-1">Conduct</p>
                        <p className="text-[11px] font-normal text-[#8E8E93] leading-[1.6]">Adherence to the UniKL Student Code of Conduct.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEnrollmentOpen(true)}
                      className="inline-flex items-center justify-center px-6 h-8 border border-[#1D1D1F] text-[#1D1D1F] text-[10px] font-bold rounded-full hover:bg-[#1D1D1F] hover:text-white transition-all active:scale-95"
                    >
                      Apply to be a Runner
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </section>
      </div>

      <CampusVitals />

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* ── RESERVATION BOTTOM SHEET ── */}
      <AnimatePresence>
        {selectedRoom && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedRoom(null)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110]" 
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 pb-12 z-[120]"
            >
              <div className="w-10 h-1 bg-[#F2F2F7] rounded-full mx-auto mb-8" />
              <div className="mb-8">
                <p className="text-[11px] font-bold text-[#007AFF] uppercase tracking-widest mb-1">Reservation</p>
                <h3 className="text-[24px] font-bold text-[#1D1D1F] tracking-tight">{selectedRoom.name}</h3>
                <p className="text-[14px] text-[#8E8E93] font-medium">Select your duration</p>
              </div>

              <div className="flex gap-3 mb-10 overflow-x-auto no-scrollbar">
                {['30m', '1h', '2h', '3h', '4h'].map((time) => (
                  <button 
                    key={time} 
                    onClick={() => setSelectedDuration(time)}
                    className={`shrink-0 w-20 h-20 rounded-2xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                      selectedDuration === time 
                        ? 'bg-[#1D1D1F] text-white border-[#1D1D1F]' 
                        : 'bg-[#F5F5F7] text-[#1D1D1F]/40 border-transparent'
                    }`}
                  >
                    <span className="text-[16px] font-bold">{time.replace('m', '').replace('h', '')}</span>
                    <span className="text-[10px] font-black uppercase opacity-60">{time.includes('m') ? 'min' : 'hrs'}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="w-full h-14 bg-[#1D1D1F] text-white rounded-xl text-[15px] font-bold active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Confirm Booking <ArrowRight size={18} />
                </button>
                <button 
                  onClick={() => setSelectedRoom(null)}
                  className="w-full h-12 text-[#8E8E93] text-[13px] font-bold active:opacity-60 transition-all"
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

      {/* ── GHOST TRIGGER FAB ── */}
      <motion.button
        layout
        onClick={() => setIsCreateOpen(true)}
        initial={false}
        animate={{ width: showSellLabel ? 110 : 52, height: 52, borderRadius: 26 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-10 right-8 z-[90] bg-[#1D1D1F] text-white flex items-center justify-center overflow-hidden active:scale-95 transition-transform shadow-lg shadow-black/5"
      >
        <motion.div className="flex items-center gap-3 px-6">
          <Plus size={20} strokeWidth={3} className="shrink-0" />
          <AnimatePresence mode="wait">
            {showSellLabel && (
              <motion.span
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="text-[13px] font-bold whitespace-nowrap"
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
