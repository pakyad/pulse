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
  ChevronRight,
  Radio
} from 'lucide-react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import CreateListing from '@/components/CreateListing';
import CampusVitals from '@/components/shared/CampusVitals';
import CreatePulsePost from '@/components/pulse/CreatePulsePost';

// ── Pulse Bulletin Data ──
const ANNOUNCEMENTS = [
  {
    id: 'a1',
    tag: 'Hostel · Admin',
    headline: 'Hostel Applications Now Open',
    body: 'Apply for Semester 2 2026/27 hostel placement via the UniKL Portal.',
  },
  {
    id: 'a2',
    tag: 'Exam · Registrar',
    headline: 'Final Exam Timetable Released',
    body: 'The official Final Examination timetable is now available for download.',
  },
  {
    id: 'a3',
    tag: 'Finance · Notice',
    headline: 'Tuition Fee Deadline: 10 May',
    body: 'Ensure all outstanding fees are settled before the deadline.',
  },
];

// ── Discovery Layer: Mosaic Hub ──
const MOSAIC_TILES = [
  { id: 't1', label: 'Campus Map', icon: MapIcon, path: '/map', color: 'bg-blue-50', textColor: 'text-blue-600', span: 'col-span-8 h-36' },
  { id: 't2', label: 'Shuttle Bus', icon: Bus, path: '/bus', color: 'bg-amber-50', textColor: 'text-amber-600', span: 'col-span-4 h-36' },
  { id: 't3', label: 'Staff Directory', icon: Users, path: '/contacts', color: 'bg-emerald-50', textColor: 'text-emerald-600', span: 'col-span-12 h-28' },
];

// ── Visual Layer: Campus Life ──
const CAMPUS_LIFE_CAROUSEL = [
  { id: 'cl1', title: 'Design Thinking', tag: 'Workshop', status: 'Live', img: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=600' },
  { id: 'cl2', title: 'MIIT E-Sports', tag: 'Finals', status: 'New', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600' },
  { id: 'cl3', title: 'Career Fair', tag: 'Career', status: 'Tomorrow', img: 'https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?q=80&w=600' },
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
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [facilities, setFacilities] = useState<any[]>(INITIAL_FACILITIES);
  const [busCount, setBusCount] = useState<string>('Live');
  const [liveAnnouncements, setLiveAnnouncements] = useState<any[]>(ANNOUNCEMENTS);
  const [isPulseCreateOpen, setIsPulseCreateOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % liveAnnouncements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [liveAnnouncements.length]);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubTrans: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubProfile) unsubProfile();
      if (unsubTrans) unsubTrans();
      if (!user) return;

      unsubProfile = onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
      const q = query(collection(db, 'orders'), where('buyer_id', '==', user.uid), where('status', 'in', ['PENDING', 'AWAITING_RUNNER', 'IN_TRANSIT']));
      unsubTrans = onSnapshot(q, (snap) => setNotificationCount(snap.docs.length));
    });

    const facUnsub = onSnapshot(collection(db, 'facilities'), (s) => {
      if (!s.empty) setFacilities(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => setFacilities(INITIAL_FACILITIES));

    const busUnsub = onSnapshot(doc(db, 'vitals', 'occupancy'), (s) => {
      if (s.exists()) setBusCount(s.data().bus || 'Live');
    });

    const annUnsub = onSnapshot(collection(db, 'announcements'), (s) => {
      if (!s.empty) setLiveAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubTrans) unsubTrans();
      facUnsub();
      busUnsub();
      annUnsub();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-40 font-sans antialiased text-slate-800">

      {/* ── SOFT NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-100 px-6 py-4 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b border-slate-50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-all">
          <ChevronLeft size={22} />
        </button>
        <div className="flex-1">
          <button 
            onClick={() => setIsSearchOpen(true)} 
            className="w-full h-10 bg-slate-100/50 rounded-full flex items-center px-4 gap-3 transition-all hover:bg-slate-100"
          >
            <Search size={16} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-400">Search Pulse</span>
          </button>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button onClick={() => router.push('/activity')} className="relative p-2 text-slate-400 hover:text-slate-800 transition-all">
            <Bell size={20} />
            {notificationCount > 0 && (
              <div className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[8px] font-bold h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-white">
                {notificationCount}
              </div>
            )}
          </button>
          <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Pulse'} />
        </div>
      </nav>
      {/* ── Pulse Bulletin ── */}
      <div className="pt-24 px-6 space-y-10">
        
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Campus Bulletin</h2>
          <div className="relative h-[160px] bg-blue-600 rounded-3xl p-8 overflow-hidden shadow-sm">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
             <AnimatePresence mode="wait">
                <motion.div
                  key={announcementIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                   <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{liveAnnouncements[announcementIndex]?.tag}</span>
                   <h3 className="text-xl font-bold text-white leading-tight">{liveAnnouncements[announcementIndex]?.headline}</h3>
                   <p className="text-sm text-white/80 font-medium line-clamp-2">{liveAnnouncements[announcementIndex]?.body}</p>
                </motion.div>
             </AnimatePresence>
             <div className="absolute bottom-6 right-8 flex gap-1.5">
                {liveAnnouncements.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === announcementIndex ? 'w-5 bg-white' : 'w-1 bg-white/30'}`} />
                ))}
             </div>
          </div>
        </section>

        {/* ── Mosaic Hub ── */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">University Hub</h2>
          <div className="grid grid-cols-12 gap-3">
             {MOSAIC_TILES.map(tile => (
                <button 
                  key={tile.id} 
                  onClick={() => router.push(tile.path)}
                  className={`${tile.span} ${tile.color} rounded-3xl p-6 flex flex-col justify-between group active:scale-[0.98] transition-all`}
                >
                   <div className={`w-10 h-10 ${tile.color.replace('50', '100')} rounded-xl flex items-center justify-center`}>
                      <tile.icon className={`${tile.textColor}`} size={20} />
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{tile.id === 't2' ? busCount : 'Pulse'}</p>
                      <h4 className="text-sm font-bold text-slate-800">{tile.label}</h4>
                   </div>
                </button>
             ))}
          </div>
        </section>

        {/* ── Campus Life ── */}
        <section className="space-y-4">
           <div className="flex items-baseline justify-between px-1">
              <h2 className="text-lg font-bold text-slate-800">What's happening</h2>
              <button className="text-xs font-semibold text-blue-600">See all</button>
           </div>
           <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
              {CAMPUS_LIFE_CAROUSEL.map(item => (
                <motion.div 
                  key={item.id}
                  className="relative shrink-0 w-[220px] h-[280px] rounded-3xl overflow-hidden group cursor-pointer border border-slate-50"
                >
                  <img src={item.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={item.title} />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-bold text-white uppercase tracking-wider">{item.status}</span>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <span className="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-1 block">{item.tag}</span>
                    <h3 className="text-sm font-bold text-white leading-tight">{item.title}</h3>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* ── Facility Registry ── */}
        <section className="space-y-4 pb-12">
          <h2 className="text-lg font-bold text-slate-800">Facility Availability</h2>
          <div className="space-y-2">
             {facilities.map(item => (
               <button 
                 key={item.id}
                 onClick={() => router.push(`/hub/facility/${item.id}`)}
                 className="w-full h-16 px-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all hover:border-slate-200"
               >
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                       <Radio size={18} />
                    </div>
                    <div className="flex flex-col items-start">
                      <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                      <p className="text-xs text-slate-400 font-medium">Availability: {item.count}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'available' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                   <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-400" />
                 </div>
               </button>
             ))}
          </div>
        </section>
      </div>

      <CampusVitals />

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <CreatePulsePost 
        isOpen={isPulseCreateOpen} 
        onClose={() => setIsPulseCreateOpen(false)} 
      />

      {/* ── PULSE FAB (Gated by Role) ── */}
      {(profile?.role === 'ADMIN' || profile?.role === 'CLUB' || profile?.role === 'OFFICIAL' || auth.currentUser?.email === 'admin@pulse.com') && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsPulseCreateOpen(true)}
          className="fixed bottom-10 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-100 flex items-center justify-center z-150"
        >
          <Plus size={24} />
        </motion.button>
      )}

    </main>
  );
}
