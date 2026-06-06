'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, query, orderBy, where, limit } from 'firebase/firestore';
import {
  ChevronLeft, Search, ChevronRight, ArrowRight,
  Radio, Package, Megaphone, BookOpen, Wrench, Store, Zap, Plus,
  Calendar, MapPin, Users, CheckCircle2
} from 'lucide-react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import { RadarCard, ReportRadarModal } from '@/components/pulse/RadarModule';
import ActiveOrderBanner from '@/components/shared/ActiveOrderBanner';
import FloatingActiveTask from '@/components/runner/FloatingActiveTask';

// ─── DEMO DATA ───────────────────────────────────────────────────────────────

const DEMO_ANNOUNCEMENTS = [
  {
    id: 'ann_demo_1', type: 'ADMIN', tag: 'ACADEMIC',
    headline: 'Final Exam Timetable Published — Check Your Portal',
    body: 'All final examination venues and timetables for Semester 2 2025/2026 have been finalized. Students are required to check the official Academic Portal for their specific room assignments. No changes will be accommodated after 48 hours of this notice.',
    created_at: { toDate: () => new Date('2026-06-03T09:00:00Z') },
  },
  {
    id: 'ann_demo_2', type: 'ADMIN', tag: 'SYSTEM',
    headline: 'Library Booking System — Scheduled Maintenance Tonight',
    body: 'The Library Management System will undergo scheduled maintenance from 1:00 AM to 4:00 AM on 31 May 2026. All active seat bookings will be preserved. The physical library remains open.',
    created_at: { toDate: () => new Date('2026-06-02T14:30:00Z') },
  },
  {
    id: 'ann_demo_3', type: 'OFFICIAL', tag: 'MARKETPLACE',
    headline: 'New Vendor Approved — BiteClub Now Serving Block A',
    body: 'Pulse Marketplace is pleased to announce that BiteClub has been officially approved as a verified campus vendor. Their menu will be available for runner deliveries across Block A, B, and the Library Complex starting Monday.',
    created_at: { toDate: () => new Date('2026-06-01T08:15:00Z') },
  },
  {
    id: 'ann_demo_4', type: 'OFFICIAL', tag: 'CAMPUS NOTICE',
    headline: 'Café Rasa Operating Hours Extended Until 9PM',
    body: 'In response to student feedback, Café Rasa will extend operations until 9:00 PM Monday through Friday effective immediately. Weekend hours remain unchanged.',
    created_at: { toDate: () => new Date('2026-05-30T11:45:00Z') },
  },
];

const DEMO_RADAR = [
  { id: 'radar_1', type: 'LOST',  title: 'Lost: MacBook Charger (USB-C)',       detail: 'Last seen at Level 3 Library, near the window seats. White charger with blue tape on cable.', reward: 'RM 10 reward', contact: 'DM @haziq_miit',            time: '2h ago', reporter_uid: 'demo_user_1', reporter_name: 'Haziq' },
  { id: 'radar_2', type: 'FOUND', title: 'Found: Student ID Card',               detail: 'Found at Café Rasa counter. Name on card: Ahmad Faris. Surrendered to the security guard on duty.', contact: 'Collect at Guard Post, Main Lobby', time: '4h ago', reporter_uid: 'demo_user_2', reporter_name: 'Faris' },
  { id: 'radar_3', type: 'LOST',  title: 'Lost: Blue Casio Scientific Calculator', detail: 'Possibly left in Lab 214 after CFD class on Thursday. Has a "Amir" sticker on the back.', reward: 'RM 15 reward', contact: 'Call 011-2398XXXX', time: '1d ago', reporter_uid: 'demo_user_3', reporter_name: 'Amir' },
  { id: 'radar_4', type: 'FOUND', title: 'Found: Airpods Pro (Gen 2) Case',      detail: 'Found in the male prayer room after Zohor. White AirPod Pro case, no pods inside.',            contact: 'DM @pulse_campus to claim',      time: '1d ago', reporter_uid: 'demo_user_4', reporter_name: 'Pulse Admin' },
];

const DEMO_EVENTS = [
  { id: 'ev_1', title: 'MIIT Developer Summit 2026',    organiser: 'Tech Society',    date: 'Fri, 6 Jun',  time: '9:00 AM',  location: 'Auditorium A, Level 5',     tag: 'Tech',     imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80' },
  { id: 'ev_2', title: 'Campus Career & Internship Fair', organiser: 'Student Affairs', date: 'Mon, 9 Jun',  time: '10:00 AM', location: 'Main Hall, Block B',        tag: 'Career',   imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80' },
  { id: 'ev_3', title: 'Inter-Faculty Sports Day',       organiser: 'Sports Council',  date: 'Sat, 14 Jun', time: '8:00 AM',  location: 'UniKL MIIT Sports Complex', tag: 'Sports',   imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80' },
  { id: 'ev_4', title: 'UI/UX Design Workshop',          organiser: 'Creative Club',   date: 'Wed, 11 Jun', time: '2:00 PM',  location: 'Lab 301, Block C',          tag: 'Workshop', imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function relativeTime(ts: any): string {
  if (!ts) return '';
  try {
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return ''; }
}

function tagIcon(tag: string) {
  const t = (tag || '').toUpperCase();
  if (t === 'SYSTEM' || t === 'MAINTENANCE') return <Wrench size={12} />;
  if (t === 'MARKETPLACE' || t === 'COMMERCE') return <Store size={12} />;
  if (t === 'ACADEMIC') return <BookOpen size={12} />;
  if (t === 'URGENT') return <Zap size={12} />;
  return <Megaphone size={12} />;
}

function getTagColor(tag: string) {
  const t = (tag || '').toUpperCase();
  if (t === 'SYSTEM' || t === 'MAINTENANCE') return 'bg-amber-50 text-amber-600 border border-amber-100/50';
  if (t === 'MARKETPLACE' || t === 'COMMERCE') return 'bg-emerald-50 text-emerald-600 border border-emerald-100/50';
  if (t === 'ACADEMIC') return 'bg-blue-50 text-blue-600 border border-blue-100/50';
  if (t === 'URGENT') return 'bg-rose-50 text-rose-600 border border-rose-100/50';
  return 'bg-indigo-50 text-indigo-600 border border-indigo-100/50';
}

function AnnouncementCard({ ann }: { ann: any }) {
  const [expanded, setExpanded] = useState(false);
  const tag = (ann.tag || ann.type || 'OFFICIAL').toUpperCase();
  return (
    <button
      onClick={() => setExpanded(e => !e)}
      className="w-full text-left py-3.5 border-b border-slate-100/80 last:border-0 group active:scale-[0.99] transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold capitalize ${getTagColor(tag)}`}>
              {tagIcon(tag)} {tag.toLowerCase()}
            </span>
            <span className="text-[11px] font-medium text-slate-400">{relativeTime(ann.created_at)}</span>
          </div>
          <p className="text-[14px] font-bold text-slate-800 leading-snug tracking-tight pr-2">{ann.headline || ann.title}</p>
          <AnimatePresence>
            {expanded && ann.body && (
              <motion.p
                key="body"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[12px] font-medium text-slate-500 leading-relaxed overflow-hidden pt-1 pr-2"
              >
                {ann.body}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.18 }}
          className="shrink-0 w-7 h-7 mt-0.5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600 transition-colors shadow-sm"
        >
          <ChevronRight size={14} />
        </motion.div>
      </div>
    </button>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PulsePage() {
  const router = useRouter();
  const [profile,        setProfile]        = useState<any>(null);
  const [isSearchOpen,   setIsSearchOpen]   = useState(false);
  const [announcements,  setAnnouncements]  = useState<any[]>([]);
  const [loadingAnn,     setLoadingAnn]     = useState(true);
  const [radarItems,     setRadarItems]     = useState<any[]>([]);
  const [isReportOpen,   setIsReportOpen]   = useState(false);
  const [events,         setEvents]         = useState<any[]>([]);
  const [selectedEvent,  setSelectedEvent]  = useState<any | null>(null);
  const [addedEventId,   setAddedEventId]   = useState<string | null>(null);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const unsubAuth = auth.onAuthStateChanged((user) => {
      unsubs.forEach(u => u());
      unsubs.length = 0;

      if (user) {
        const uProfile = onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()), e => console.error('[Pulse] Profile:', e));
        unsubs.push(uProfile);
      }

      const uAnn = onSnapshot(
        query(collection(db, 'announcements'), where('type', 'in', ['OFFICIAL', 'ADMIN']), orderBy('created_at', 'desc'), limit(20)),
        snap => { setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoadingAnn(false); },
        (err) => {
          console.error('[Pulse] Announcements:', err);
          const uFallback = onSnapshot(
            query(collection(db, 'announcements'), orderBy('created_at', 'desc'), limit(20)),
            snap => {
              setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((a: any) => a.type === 'OFFICIAL' || a.type === 'ADMIN'));
              setLoadingAnn(false);
            },
            (e) => {
               console.error('[Pulse] Announcements Fallback:', e);
               setLoadingAnn(false);
            }
          );
          unsubs.push(uFallback);
        }
      );
      unsubs.push(uAnn);

      const uRadar = onSnapshot(
        query(collection(db, 'campus_radar'), orderBy('created_at', 'desc'), limit(20)), 
        snap => setRadarItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))), 
        (err) => console.error('[Pulse] Radar:', err)
      );
      unsubs.push(uRadar);

      const uEvents = onSnapshot(
        query(collection(db, 'events'), orderBy('date', 'asc'), limit(10)), 
        snap => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))), 
        (err) => console.error('[Pulse] Events:', err)
      );
      unsubs.push(uEvents);
    });

    return () => { unsubAuth(); unsubs.forEach(u => u()); };
  }, []);

  const displayAnnouncements = (!loadingAnn && announcements.length === 0) ? DEMO_ANNOUNCEMENTS : announcements;

  const displayRadar = radarItems.length > 0
    ? radarItems.map(item => ({
        ...item,
        time: item.created_at?.toDate
          ? (() => {
              const diff = Math.floor((Date.now() - item.created_at.toDate().getTime()) / 1000);
              if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
              if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
              return `${Math.floor(diff / 86400)}d ago`;
            })()
          : 'Just now',
      }))
    : DEMO_RADAR;

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/home')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 active:scale-95 transition-all">
            <ChevronLeft size={20} />
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

      <div className="pt-24 px-4 space-y-10">

        {/* ── ACTIVE ORDER ── */}
        <ActiveOrderBanner />
        <FloatingActiveTask />

        {/* ── ANNOUNCEMENTS ── */}
        <section className="space-y-4">
          <div className="px-1">
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Announcements</h2>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">Official notices from the university</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100/50 overflow-hidden">
            {loadingAnn ? (
              <div className="divide-y divide-slate-100">
                {[1, 2, 3].map(i => (
                  <div key={i} className="px-5 py-4 space-y-3 animate-pulse">
                    <div className="h-5 w-24 bg-slate-100 rounded-full" />
                    <div className="h-4 w-3/4 bg-slate-100 rounded-full" />
                  </div>
                ))}
              </div>
            ) : displayAnnouncements.length > 0 ? (
              <div className="px-5">
                {displayAnnouncements.map(ann => <AnnouncementCard key={ann.id} ann={ann} />)}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-300">
                <Radio size={28} strokeWidth={1.5} />
                <p className="text-[12px] font-bold tracking-tight">No announcements right now</p>
              </div>
            )}
          </div>
        </section>

        {/* ── CAMPUS RADAR ── */}
        <section className="space-y-4">
          <div className="px-1 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Campus Radar</h2>
              <p className="text-[12px] font-medium text-slate-500 mt-0.5">Lost items · Found items · Peer alerts</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsReportOpen(true)}
                className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 active:scale-95 transition-all shadow-sm"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {displayRadar.map((item: any) => <RadarCard key={item.id} item={item} />)}
          </div>
        </section>

        {/* ── HAPPENING THIS WEEK ── */}
        <section className="space-y-4">
          <div className="px-1">
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Happening This Week</h2>
            <p className="text-[12px] font-medium text-slate-500 mt-0.5">Campus events and activities</p>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
            {(events.length > 0 ? events : DEMO_EVENTS).map((ev: any) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="shrink-0 w-[240px] bg-white border border-slate-100/50 rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-md transition-all group cursor-pointer active:scale-[0.98]"
              >
                <div className="h-[120px] relative bg-slate-100 overflow-hidden">
                  {ev.imageUrl
                    ? <img src={ev.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt={ev.title} />
                    : <div className="w-full h-full bg-linear-to-tr from-slate-200 to-slate-100" />
                  }
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-900 shadow-sm">{ev.tag || 'Event'}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2">{ev.title}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                      <Calendar size={12} className="shrink-0 text-slate-400" />
                      <span>{ev.date} · {ev.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                      <MapPin size={12} className="shrink-0 text-slate-400" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100/80">
                    <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                      <Users size={10} className="text-slate-400" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 truncate">{ev.organiser}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <AnimatePresence>
        {isReportOpen && <ReportRadarModal onClose={() => setIsReportOpen(false)} />}
      </AnimatePresence>

      {/* ── EVENT DETAIL SHEET ── */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-200 bg-slate-900/50 backdrop-blur-md flex items-end justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-white w-full max-w-sm rounded-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {selectedEvent.imageUrl && (
                <div className="h-[160px] relative overflow-hidden">
                  <img src={selectedEvent.imageUrl} className="w-full h-full object-cover" alt={selectedEvent.title} />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-4 left-4 px-2.5 py-1 rounded-md bg-white/90 text-[9px] font-semibold text-slate-900">
                    {selectedEvent.tag || 'Event'}
                  </span>
                </div>
              )}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-[18px] font-bold text-slate-900 tracking-tight leading-snug">{selectedEvent.title}</p>
                  <p className="text-[12px] font-medium text-[#94a3b8] mt-1">{selectedEvent.organiser}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[13px] font-medium text-slate-700">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <span>{selectedEvent.date} · {selectedEvent.time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[13px] font-medium text-slate-700">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span>{selectedEvent.location}</span>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      if (addedEventId === selectedEvent.id) return;
                      setAddedEventId(selectedEvent.id);
                    }}
                    className={`flex-1 h-12 rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all ${
                      addedEventId === selectedEvent.id 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                        : 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                    }`}
                  >
                    {addedEventId === selectedEvent.id ? (
                      <>
                        <CheckCircle2 size={16} /> Added to Calendar
                      </>
                    ) : (
                      'Add to Calendar'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      setAddedEventId(null);
                    }}
                    className="h-12 px-5 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl font-bold text-[13px] active:scale-95 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
