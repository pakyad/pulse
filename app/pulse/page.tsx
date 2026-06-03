'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, query, orderBy, where, limit } from 'firebase/firestore';
import {
  ChevronLeft, Search, ChevronRight, ArrowRight,
  Radio, Package, Megaphone, BookOpen, Wrench, Store, Zap, Plus,
  Calendar, MapPin, Users
} from 'lucide-react';
import SearchOverlay from '@/components/shared/SearchOverlay';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import { RadarCard, ReportRadarModal } from '@/components/pulse/RadarModule';

// ─── DEMO DATA ───────────────────────────────────────────────────────────────

const DEMO_ANNOUNCEMENTS = [
  {
    id: 'ann_demo_1', type: 'ADMIN', tag: 'ACADEMIC',
    headline: 'Final Exam Timetable Published — Check Your Portal',
    body: 'All final examination venues and timetables for Semester 2 2025/2026 have been finalized. Students are required to check the official Academic Portal for their specific room assignments. No changes will be accommodated after 48 hours of this notice.',
    created_at: { toDate: () => new Date(Date.now() - 1000 * 60 * 90) },
  },
  {
    id: 'ann_demo_2', type: 'ADMIN', tag: 'SYSTEM',
    headline: 'Library Booking System — Scheduled Maintenance Tonight',
    body: 'The Library Management System will undergo scheduled maintenance from 1:00 AM to 4:00 AM on 31 May 2026. All active seat bookings will be preserved. The physical library remains open.',
    created_at: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 3) },
  },
  {
    id: 'ann_demo_3', type: 'OFFICIAL', tag: 'MARKETPLACE',
    headline: 'New Vendor Approved — BiteClub Now Serving Block A',
    body: 'Pulse Marketplace is pleased to announce that BiteClub has been officially approved as a verified campus vendor. Their menu will be available for runner deliveries across Block A, B, and the Library Complex starting Monday.',
    created_at: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 24) },
  },
  {
    id: 'ann_demo_4', type: 'OFFICIAL', tag: 'CAMPUS NOTICE',
    headline: 'Café Rasa Operating Hours Extended Until 9PM',
    body: 'In response to student feedback, Café Rasa will extend operations until 9:00 PM Monday through Friday effective immediately. Weekend hours remain unchanged.',
    created_at: { toDate: () => new Date(Date.now() - 1000 * 60 * 60 * 48) },
  },
];

const DEMO_RADAR = [
  { id: 'radar_1', type: 'LOST',  title: 'Lost: MacBook Charger (USB-C)',       detail: 'Last seen at Level 3 Library, near the window seats. White charger with blue tape on cable.', reward: 'RM 10 reward', contact: 'DM @haziq_miit',            time: '2h ago' },
  { id: 'radar_2', type: 'FOUND', title: 'Found: Student ID Card',               detail: 'Found at Café Rasa counter. Name on card: Ahmad Faris. Surrendered to the security guard on duty.', contact: 'Collect at Guard Post, Main Lobby', time: '4h ago' },
  { id: 'radar_3', type: 'LOST',  title: 'Lost: Blue Casio Scientific Calculator', detail: 'Possibly left in Lab 214 after CFD class on Thursday. Has a "Amir" sticker on the back.', reward: 'RM 15 reward', contact: 'Call 011-2398XXXX', time: '1d ago' },
  { id: 'radar_4', type: 'FOUND', title: 'Found: Airpods Pro (Gen 2) Case',      detail: 'Found in the male prayer room after Zohor. White AirPod Pro case, no pods inside.',            contact: 'DM @pulse_campus to claim',      time: '1d ago' },
];

const DEMO_EVENTS = [
  { id: 'ev_1', title: 'MIIT Developer Summit 2026',    organiser: 'Tech Society',    date: 'Fri, 6 Jun',  time: '9:00 AM',  location: 'Auditorium A, Level 5',     tag: 'Tech',     imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80' },
  { id: 'ev_2', title: 'Campus Career & Internship Fair', organiser: 'Student Affairs', date: 'Mon, 9 Jun',  time: '10:00 AM', location: 'Main Hall, Block B',        tag: 'Career',   imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80' },
  { id: 'ev_3', title: 'Inter-Faculty Sports Day',       organiser: 'Sports Council',  date: 'Sat, 14 Jun', time: '8:00 AM',  location: 'UniKL MIIT Sports Complex', tag: 'Sports',   imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80' },
  { id: 'ev_4', title: 'UI/UX Design Workshop',          organiser: 'Creative Club',   date: 'Wed, 11 Jun', time: '2:00 PM',  location: 'Lab 301, Block C',          tag: 'Workshop', imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = [
  'PENDING', 'PENDING_VENDOR', 'PENDING_RUNNER', 'PREPARING',
  'READY_FOR_PICKUP', 'AWAITING_RUNNER', 'PICKED_UP',
  'IN_TRANSIT', 'ON_THE_WAY', 'ARRIVED_AT_DESTINATION',
];

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

function statusLabel(raw: string): string {
  const MAP: Record<string, string> = {
    PENDING: 'Waiting', PENDING_VENDOR: 'Waiting',
    PENDING_RUNNER: 'Finding Runner', AWAITING_RUNNER: 'Finding Runner',
    PREPARING: 'Preparing', READY_FOR_PICKUP: 'Ready for Pickup',
    PICKED_UP: 'Picked Up', IN_TRANSIT: 'In Transit',
    ON_THE_WAY: 'On the Way', ARRIVED_AT_DESTINATION: 'Almost There',
  };
  return MAP[(raw || '').toUpperCase()] ?? (raw || '').replace(/_/g, ' ');
}

function tagIcon(tag: string) {
  const t = (tag || '').toUpperCase();
  if (t === 'SYSTEM' || t === 'MAINTENANCE') return <Wrench size={11} />;
  if (t === 'MARKETPLACE' || t === 'COMMERCE') return <Store size={11} />;
  if (t === 'ACADEMIC') return <BookOpen size={11} />;
  if (t === 'URGENT') return <Zap size={11} />;
  return <Megaphone size={11} />;
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function ActiveOrderCard({ order }: { order: any }) {
  const router = useRouter();
  const code = `#${(order.order_code || order.id?.slice(0, 6) || '------').toUpperCase()}`;
  const isMoving = ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'ARRIVED_AT_DESTINATION']
    .includes((order.status || '').toUpperCase());
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
      <button
        onClick={() => router.push(`/orders/${order.id}`)}
        className="w-full text-left bg-[#111111] rounded-2xl p-5 flex items-center justify-between group active:scale-95 transition-transform"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <Package size={17} className="text-white" />
          </div>
          <div className="space-y-1">
            <p className="text-[13px] font-bold text-white leading-none truncate max-w-[180px]">{order.title || 'Your Order'}</p>
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isMoving ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[11px] font-semibold text-white/50">{statusLabel(order.status)}</span>
              <span className="text-[11px] text-white/20">{code}</span>
            </div>
          </div>
        </div>
        <ArrowRight size={16} className="text-white/30 group-hover:text-white/60 transition-colors shrink-0" />
      </button>
    </motion.div>
  );
}

function AnnouncementCard({ ann }: { ann: any }) {
  const [expanded, setExpanded] = useState(false);
  const tag = (ann.tag || ann.type || 'OFFICIAL').toUpperCase();
  return (
    <button
      onClick={() => setExpanded(e => !e)}
      className="w-full text-left py-5 border-b border-slate-100 last:border-0 group active:opacity-60 transition-opacity"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.16em]">
              {tagIcon(tag)}{tag}
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
            <span className="text-[10px] font-medium text-slate-300">{relativeTime(ann.created_at)}</span>
          </div>
          <p className="text-[14px] font-bold text-slate-900 leading-snug tracking-tight">{ann.headline || ann.title}</p>
          <AnimatePresence>
            {expanded && ann.body && (
              <motion.p
                key="body"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[12px] font-medium text-[#94a3b8] leading-relaxed overflow-hidden pt-1"
              >
                {ann.body}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.18 }}
          className="shrink-0 mt-1 text-slate-200 group-hover:text-slate-400 transition-colors"
        >
          <ChevronRight size={15} />
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
  const [activeOrder,    setActiveOrder]    = useState<any>(null);
  const [loadingAnn,     setLoadingAnn]     = useState(true);
  const [radarItems,     setRadarItems]     = useState<any[]>([]);
  const [isReportOpen,   setIsReportOpen]   = useState(false);
  const [events,         setEvents]         = useState<any[]>([]);
  const [selectedEvent,  setSelectedEvent]  = useState<any | null>(null);

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    const unsubAuth = auth.onAuthStateChanged((user) => {
      unsubs.forEach(u => u());
      unsubs.length = 0;

      if (user) {
        const uProfile = onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()), e => console.error('[Pulse] Profile:', e));
        unsubs.push(uProfile);

        const uOrder = onSnapshot(
          query(collection(db, 'orders'), where('buyer_id', '==', user.uid), where('status', 'in', ACTIVE_STATUSES)),
          snap => {
            if (snap.empty) { setActiveOrder(null); return; }
            const sorted = snap.docs
              .map(d => ({ id: d.id, ...d.data() as any }))
              .sort((a, b) => {
                const ta = a.created_at?.toMillis?.() ?? new Date(a.created_at || 0).getTime();
                const tb = b.created_at?.toMillis?.() ?? new Date(b.created_at || 0).getTime();
                return tb - ta;
              });
            setActiveOrder(sorted[0] ?? null);
          },
          e => console.warn('[Pulse] ActiveOrder:', e)
        );
        unsubs.push(uOrder);
      }

      const uAnn = onSnapshot(
        query(collection(db, 'announcements'), where('type', 'in', ['OFFICIAL', 'ADMIN']), orderBy('created_at', 'desc'), limit(20)),
        snap => { setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoadingAnn(false); },
        () => {
          const uFallback = onSnapshot(
            query(collection(db, 'announcements'), orderBy('created_at', 'desc'), limit(20)),
            snap => {
              setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((a: any) => a.type === 'OFFICIAL' || a.type === 'ADMIN'));
              setLoadingAnn(false);
            },
            () => setLoadingAnn(false)
          );
          unsubs.push(uFallback);
        }
      );
      unsubs.push(uAnn);

      const uRadar = onSnapshot(query(collection(db, 'campus_radar'), orderBy('created_at', 'desc'), limit(20)), snap => setRadarItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
      unsubs.push(uRadar);

      const uEvents = onSnapshot(query(collection(db, 'events'), orderBy('date', 'asc'), limit(10)), snap => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {});
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

      <div className="pt-24 px-6 space-y-10">

        {/* ── ACTIVE ORDER ── */}
        <AnimatePresence>
          {activeOrder && (
            <motion.section key="active-order">
              <ActiveOrderCard order={activeOrder} />
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── ANNOUNCEMENTS ── */}
        <section className="space-y-4">
          <div className="px-1">
            <h2 className="text-[21px] font-bold text-slate-900 tracking-tight">Announcements</h2>
            <p className="text-[13px] font-medium text-[#94a3b8] mt-0.5">Official notices from the university</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            {loadingAnn ? (
              <div className="divide-y divide-slate-100">
                {[1, 2, 3].map(i => (
                  <div key={i} className="px-6 py-5 space-y-2.5 animate-pulse">
                    <div className="h-2.5 w-20 bg-slate-100 rounded-full" />
                    <div className="h-4 w-3/4 bg-slate-100 rounded-full" />
                  </div>
                ))}
              </div>
            ) : displayAnnouncements.length > 0 ? (
              <div className="px-6">
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
              <h2 className="text-[21px] font-bold text-slate-900 tracking-tight">Campus Radar</h2>
              <p className="text-[13px] font-medium text-[#94a3b8] mt-0.5">Lost items · Found items · Peer alerts</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Live</span>
              </div>
              <button
                onClick={() => setIsReportOpen(true)}
                className="w-8 h-8 rounded-xl bg-[#111111] flex items-center justify-center text-white active:scale-95 transition-all"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-6 px-6">
            {displayRadar.map((item: any) => <RadarCard key={item.id} item={item} />)}
          </div>
        </section>

        {/* ── HAPPENING THIS WEEK ── */}
        <section className="space-y-4">
          <div className="px-1">
            <h2 className="text-[21px] font-bold text-slate-900 tracking-tight">Happening This Week</h2>
            <p className="text-[13px] font-medium text-[#94a3b8] mt-0.5">Campus events and activities</p>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-6 px-6">
            {(events.length > 0 ? events : DEMO_EVENTS).map((ev: any) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="shrink-0 w-[240px] bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-slate-200 transition-all group cursor-pointer active:scale-95"
              >
                <div className="h-[120px] relative bg-slate-100 overflow-hidden">
                  {ev.imageUrl
                    ? <img src={ev.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" alt={ev.title} />
                    : <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100" />
                  }
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-sm text-[9px] font-black uppercase tracking-[0.15em] text-slate-900 shadow-sm">{ev.tag || 'Event'}</span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-[14px] font-bold text-slate-900 leading-snug line-clamp-2">{ev.title}</p>
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
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-md flex items-end justify-center p-4"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-4 left-4 px-2.5 py-1 rounded-md bg-white/90 text-[9px] font-black uppercase tracking-widest text-slate-900">
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
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(selectedEvent.title)}&location=${encodeURIComponent(selectedEvent.location)}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 h-12 bg-[#111111] text-white rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    Add to Calendar
                  </a>
                  <button
                    onClick={() => setSelectedEvent(null)}
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
