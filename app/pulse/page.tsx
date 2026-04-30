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
  ChevronDown,
  ChevronRight
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
          <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
        </div>
      </nav>

      {/* ── Pulse Bulletin ── */}
      <div className="pt-24 px-6 space-y-12">
        
        <section className="space-y-6">
          <h2 className="text-[18px] font-bold text-navy">Pulse Bulletin</h2>
          <div className="relative h-[180px] bg-[#5C7CFA] rounded-[22px] p-8 overflow-hidden shadow-xl shadow-indigo-100">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
             <AnimatePresence mode="wait">
                <motion.div
                  key={announcementIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                   <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">{ANNOUNCEMENTS[announcementIndex].tag}</span>
                   <h3 className="text-[22px] font-bold text-white leading-tight">{ANNOUNCEMENTS[announcementIndex].headline}</h3>
                   <p className="text-[13px] text-white/80 font-medium line-clamp-2">{ANNOUNCEMENTS[announcementIndex].body}</p>
                </motion.div>
             </AnimatePresence>
             <div className="absolute bottom-8 right-8 flex gap-1.5">
                {ANNOUNCEMENTS.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === announcementIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} />
                ))}
             </div>
          </div>
        </section>

        {/* ── Campus Updates ── */}
        <section className="space-y-8">
          <h2 className="text-[18px] font-bold text-navy">Campus Updates</h2>
          <div className="grid grid-cols-12 gap-4">
             {MOSAIC_TILES.map(tile => (
                <button 
                  key={tile.id} 
                  onClick={() => router.push(tile.path)}
                  className={`${tile.span} ${tile.color} rounded-[22px] p-6 flex flex-col justify-between group active:scale-[0.98] transition-all`}
                >
                   <tile.icon className={`${tile.textColor}`} size={24} />
                   <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] opacity-40 mb-1">{tile.id === 't2' ? busCount : 'Pulse'}</p>
                      <h4 className={`text-[15px] font-bold text-navy`}>{tile.label}</h4>
                   </div>
                </button>
             ))}
          </div>
        </section>

        {/* ── Visual Stream ── */}
        <section className="space-y-6">
           <div className="flex items-baseline justify-between">
              <h2 className="text-[18px] font-bold text-navy">Campus Life</h2>
              <button className="text-[12px] font-medium text-[#8E8E93]">View All</button>
           </div>
           <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
              {CAMPUS_LIFE_CAROUSEL.map(item => (
                <motion.div 
                  key={item.id}
                  className="relative shrink-0 w-[240px] h-[300px] rounded-[22px] overflow-hidden group cursor-pointer"
                >
                  <img src={item.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-5 left-5">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-bold text-white uppercase tracking-wider">{item.status}</span>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <span className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em] mb-1.5 block">{item.tag}</span>
                    <h3 className="text-[15px] font-bold text-white leading-tight">{item.title}</h3>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* ── Facility Booking ── */}
        <section className="space-y-6">
          <h2 className="text-[18px] font-bold text-navy">Facility Booking</h2>
          <div className="space-y-2">
             {facilities.map(item => (
               <button 
                 key={item.id}
                 onClick={() => setSelectedRoom(item)}
                 className="w-full h-16 px-6 bg-white border border-[#F2F2F7] rounded-[22px] flex items-center justify-between group active:scale-[0.98] transition-all"
               >
                 <div className="flex flex-col items-start">
                   <h4 className="text-[14px] font-bold text-navy">{item.name}</h4>
                   <p className="text-[11px] text-slate-400 font-medium">Capacity: {item.count}</p>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${item.status === 'available' ? 'bg-[#34C759]' : 'bg-[#FF3B30]'}`} />
                   <ChevronRight size={18} className="text-slate-200 group-hover:text-navy" />
                 </div>
               </button>
             ))}
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
                    className={`shrink-0 w-20 h-20 rounded-2xl border flex flex-col items-center justify-center transition-all active:scale-[0.98] ${
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

    </main>
  );
}
