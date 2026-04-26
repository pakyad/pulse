'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { Bell, Settings, Search, ChevronLeft, ChevronRight, Activity, Shield, AlertTriangle, Clock, CheckCircle, BookOpen, CalendarDays, Home, Users, ArrowRight } from 'lucide-react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

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
  { id: 'f1', name: 'Library East', status: 'open',    hours: '24/7',      color: 'bg-emerald-500' },
  { id: 'f2', name: 'Lab A-301',    status: 'open',    hours: '8AM–10PM',  color: 'bg-emerald-500' },
  { id: 'f3', name: 'Cafeteria',    status: 'limited', hours: 'Until 3PM', color: 'bg-amber-400'   },
  { id: 'f4', name: 'IT Helpdesk',  status: 'open',    hours: '9AM–5PM',   color: 'bg-emerald-500' },
  { id: 'f5', name: 'Prayer Room',  status: 'open',    hours: 'All day',   color: 'bg-emerald-500' },
  { id: 'f6', name: 'Sports Hall',  status: 'closed',  hours: 'Renovation',color: 'bg-red-400'     },
];

const NEWS_FEED = [
  { id: 'n1', tag: 'ACHIEVEMENT', title: 'UniKL MIIT Ranked Top 5 Engineering Schools Nationwide', time: '1d ago', img: 'https://images.unsplash.com/photo-1523240715639-99781313a4be?q=80&w=200&auto=format&fit=crop' },
  { id: 'n2', tag: 'POLICY',      title: 'Updated Student Code of Conduct Takes Effect May 2026', time: '2d ago', img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=200&auto=format&fit=crop' },
  { id: 'n3', tag: 'RESEARCH',    title: 'New Innovation Lab Opens at MIIT North Campus',         time: '3d ago', img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=200&auto=format&fit=crop' },
];

const STATUS_LABEL: Record<string, string> = { open: 'Open', limited: 'Limited', closed: 'Closed' };

export default function PulseBulletinPage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const router = useRouter();

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
          <button onClick={() => setIsSearchOpen(true)} className="w-full h-11 bg-slate-50 border border-slate-100 rounded-full flex items-center px-4 gap-3">
            <Search size={18} className="text-slate-300" />
            <span className="text-[13px] font-bold text-slate-300">Search Pulse</span>
          </button>
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
        <div className="px-5">
          <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Pulse Bulletin</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[11px] font-medium text-slate-400">UniKL City Campus · Live</p>
          </div>
        </div>

        {/* ── PRIORITY CARD (FeaturedBanner Style) ── */}
        <div className="px-5">
          <motion.div whileTap={{ scale: 0.98 }} className="relative rounded-[2.5rem] overflow-hidden bg-purple-500 p-8 flex flex-col justify-between shadow-sm cursor-pointer min-h-[220px]">
             {/* Subtle internal texture/pattern */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
             <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">{PRIORITY_CARD.tag}</span>
                </div>
                <div>
                  <h2 className="text-white text-[28px] font-bold leading-tight tracking-tight mb-2">{PRIORITY_CARD.headline}</h2>
                  <p className="text-white/80 text-[13px] font-medium leading-snug line-clamp-2 max-w-[260px] mb-6">{PRIORITY_CARD.body}</p>
                  <button className="px-6 py-3 bg-white text-navy text-[13px] font-bold rounded-[1rem] shadow-sm active:scale-95 transition-all flex items-center gap-2 w-fit">
                    {PRIORITY_CARD.cta} <ArrowRight size={16} />
                  </button>
                </div>
             </div>
          </motion.div>
        </div>

        {/* ── CAMPUS LIFE ── */}
        <div>
          <div className="px-5 mb-6">
            <h3 className="text-[18px] font-bold text-navy tracking-tight">Campus Life</h3>
            <p className="text-[12px] text-slate-400 font-medium mt-0.5">Events, notices & club activity</p>
          </div>
          <div className="flex gap-4 overflow-x-auto px-5 no-scrollbar pb-1">
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

        {/* ── ACADEMIC EKG ── */}
        <div className="px-5">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="text-[18px] font-bold text-navy tracking-tight">Academic Alerts</h3>
          </div>
          <div className="bg-white border border-slate-100 rounded-4xl overflow-hidden shadow-sm">
            {ACADEMIC_ALERTS.map((alert, i) => (
              <div key={alert.id}>
                <button
                  onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                  className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50/80 transition-all text-left ${i < ACADEMIC_ALERTS.length - 1 ? 'border-b border-slate-50' : ''}`}
                >
                  <div className={`w-9 h-9 ${alert.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                    <alert.icon size={16} className={alert.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-navy leading-tight truncate">{alert.title}</p>
                      {alert.urgent && <div className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{alert.category}</span>
                      <span className="text-[9px] text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400 font-medium">{alert.time}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className={`text-slate-200 transition-transform shrink-0 ${expandedAlert === alert.id ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedAlert === alert.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className={`px-5 pb-4 pt-2 ${i < ACADEMIC_ALERTS.length - 1 ? 'border-b border-slate-50' : ''}`}>
                        <p className="text-[12px] text-slate-400 font-medium leading-relaxed ml-13">
                          This is an official academic alert from the UniKL Registrar's Office. Please log into the student portal for full details and any action required.
                        </p>
                        <button className="mt-3 text-[11px] font-bold text-accent">Open Portal →</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* ── FACILITY LEDGER ── */}
        <div>
          <div className="px-5 mb-6 flex items-center gap-2">
            <h3 className="text-[18px] font-bold text-navy tracking-tight">Facility Status</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 no-scrollbar pb-1">
            {FACILITIES.map((f) => (
              <div key={f.id} className="shrink-0 w-[130px] bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className={`w-2.5 h-2.5 rounded-full ${f.color} mb-3`} />
                <p className="text-[13px] font-bold text-navy leading-tight">{f.name}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">{STATUS_LABEL[f.status]}</p>
                <p className="text-[9px] font-bold text-slate-300 mt-0.5 uppercase tracking-widest">{f.hours}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── INSTITUTIONAL REGISTRY ── */}
        <div className="px-5">
          <h3 className="text-[18px] font-bold text-navy tracking-tight mb-6">Institutional Registry</h3>
          <div className="space-y-1">
            {NEWS_FEED.map((item, i) => (
              <button
                key={item.id}
                className={`w-full flex items-start gap-4 py-5 text-left group transition-all hover:bg-slate-50/50 rounded-2xl px-2 ${i < NEWS_FEED.length - 1 ? 'border-b border-slate-50' : ''}`}
              >
                <div className="flex-1 min-w-0 py-0.5">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{item.tag}</span>
                  <h4 className="text-[14px] font-bold text-navy leading-snug mt-1.5 group-hover:text-accent transition-colors line-clamp-2">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-2">{item.time}</p>
                </div>
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-slate-50">
                  <img src={item.img} className="w-full h-full object-cover" alt={item.title} />
                </div>
              </button>
            ))}
          </div>
          <button className="w-full mt-6 h-14 border border-slate-100 rounded-2xl text-[12px] font-bold text-slate-400 uppercase tracking-widest active:scale-95 transition-all bg-white shadow-sm">
            Load More
          </button>
        </div>

      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  );
}
