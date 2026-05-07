"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Settings, Search, ChevronLeft, ChevronRight, ArrowUpRight, GraduationCap, Zap } from 'lucide-react';
import ServiceGrid from '@/components/shared/ServiceGrid';
import SearchOverlay from '@/components/shared/SearchOverlay';
import FeaturedBanner, { BannerSlide } from '@/components/shared/FeaturedBanner';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, orderBy, limit } from 'firebase/firestore';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

// ── Fallback data (used when Firestore has no campaigns/announcements) ──
const HERO_SLIDES: BannerSlide[] = [
  {
    id: 'h1', ctaPath: '/pulse',
    headline: "Synchronize Your Stipend",
    subline: 'Check your MARA allowance status & payment schedule',
    bgColor: '#4A5D23' // Olive Green
  },
  {
    id: 'h2', ctaPath: '/pulse',
    headline: "Clear Outstanding Fees",
    subline: 'Your Semester 4 tuition clearance is pending authorization.',
    bgColor: '#1E293B' // Navy Slate
  },
  {
    id: 'h3', ctaPath: '/pulse',
    headline: "Final Results Published",
    subline: 'Your academic transcript for Sem 3 is now officially available.',
    bgColor: '#8B5CF6' // Purple
  },
];

const ANNOUNCEMENTS_FALLBACK = [
  { id: 'a1', tag: 'ADMIN', title: 'Hostel Applications Now Open', time: '2h ago', path: '/pulse' },
  { id: 'a2', tag: 'EVENT', title: 'Motivational Talk Tomorrow at 9AM', time: '4h ago', path: '/pulse' },
  { id: 'a3', tag: 'CLUB', title: "Badminton Club Merch Launch", time: '6h ago', path: '/marketplace' },
];

const MARKET_FALLBACK = [
  { id: 'f1', title: 'Calculus III Ref Pack', price: 45, img: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400', seller: 'MIIT Academic' },
  { id: 'f2', title: 'Keychron K2 Pro', price: 280, img: 'https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=400', seller: 'Elite Tech' },
  { id: 'f3', title: 'BAC Official Jersey', price: 95, img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400', seller: 'BAC Club' },
];

const SPOTLIGHT_FALLBACK = [
  { id: 's1', tag: 'ADMIN', title: 'Hostel Registration Open', sub: 'Deadline: 30 April', img: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=400' },
  { id: 's2', tag: 'EVENT', title: 'Robotics Grand Prix', sub: 'Main Hall · 2PM', img: 'https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?q=80&w=400' },
  { id: 's3', tag: 'CLUB',  title: 'Photography Contest', sub: 'Win RM 500 Credits', img: 'https://images.unsplash.com/photo-1452784444945-3f422708fe5e?q=80&w=400' },
];

const CLUBS_FALLBACK = [
  { id: 'c1', name: 'MIIT Tech Store', category: 'Official Club', img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=400', color: 'text-blue-500' },
  { id: 'c2', name: 'UBIS Business Society', category: 'Academic', img: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=400', color: 'text-emerald-500' },
  { id: 'c3', name: 'MIDI Design Club', category: 'Creative', img: 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=400', color: 'text-purple-500' },
  { id: 'c4', name: 'SRC Student Council', category: 'Leadership', img: 'https://images.unsplash.com/photo-1521791136064-7986c2923216?q=80&w=400', color: 'text-rose-500' },
];

const ESSENTIALS_FALLBACK = [
  { id: 'e1', title: 'Stationery Master Pack', price: 25, img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=400', tag: 'ACADEMIC' },
  { id: 'e2', title: 'Official MIIT Lab Coat', price: 65, img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400', tag: 'REQUIRED' },
  { id: 'e3', title: 'Pulse Gym Stringer', price: 40, img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400', tag: 'FITNESS' },
  { id: 'e4', title: 'Calculus Cheat Sheet', price: 12, img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400', tag: 'EXAMS' },
];

const TAG_COLORS: Record<string, string> = {
  ADMIN: 'bg-blue-50 text-blue-600',
  EVENT: 'bg-emerald-50 text-emerald-600',
  CLUB:  'bg-purple-50 text-purple-600',
  NEWS:  'bg-slate-50 text-slate-500',
};

export default function PulseHome() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [liveItems, setLiveItems] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [pulsePosts, setPulsePosts] = useState<any[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const [greeting, setGreeting] = useState('Welcome');
  const [mounted, setMounted] = useState(false);
  const firstName = profile?.full_name?.split(' ')[0] || 'Student';

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening');
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

  useEffect(() => {
    const qItems = query(
      collection(db, 'items'), 
      where('status', '==', 'active'), 
      limit(20)
    );
    const unsubItems = onSnapshot(qItems, s => {
      const docs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a: any, b: any) => {
        const tA = a.created_at?.toMillis ? a.created_at.toMillis() : 0;
        const tB = b.created_at?.toMillis ? b.created_at.toMillis() : 0;
        return tB - tA;
      });
      setLiveItems(docs);
    });
    const qAnn = query(collection(db, 'announcements'), orderBy('created_at', 'desc'), limit(3));
    const unsubAnn = onSnapshot(qAnn, s => setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qPulse = query(collection(db, 'pulse_posts'), orderBy('created_at', 'desc'), limit(5));
    const unsubPulse = onSnapshot(qPulse, s => setPulsePosts(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubItems(); unsubAnn(); unsubPulse(); };
  }, []);

  const displayItems = (liveItems.length > 0 ? liveItems : MARKET_FALLBACK)
    .filter(item => {
      const title = item.title?.toLowerCase() || '';
      const passesOfficial = liveItems.length > 0 ? item.is_official === true : true;
      return passesOfficial && !title.includes('roti') && !title.includes('murtabak') && !title.includes('canai');
    });
  const displayAnnouncements = announcements.length > 0
    ? announcements.map(a => ({ ...a, tag: a.category || 'NEWS', path: '/pulse' }))
    : ANNOUNCEMENTS_FALLBACK;

  if (!mounted) return <div className="min-h-screen bg-[#FDFDFD]" />;

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">



      <div className="pt-28 px-6 space-y-12 pb-12">


        {/* ── HERO BANNER ── */}
        <FeaturedBanner slides={HERO_SLIDES} />

        {/* ── CAMPUS HUB ── */}
        <div>
          <h3 className="text-[17px] font-bold text-navy tracking-widest mb-5">Campus Hub</h3>
          <ServiceGrid />
        </div>

        {/* ── WHAT'S HAPPENING ── */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-[17px] font-bold text-navy tracking-tight">What's happening</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Campus news & highlights</p>
            </div>
            <button onClick={() => router.push('/pulse')} className="text-[12px] font-bold text-accent flex items-center gap-1">
              Explore <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-4 -mx-6 px-6 overflow-x-auto no-scrollbar pb-1">
            {SPOTLIGHT_FALLBACK.map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/pulse')}
                className="shrink-0 w-[240px] cursor-pointer group"
              >
                <div className="w-full h-[140px] bg-slate-50 rounded-4xl overflow-hidden mb-3 border border-slate-100 shadow-sm relative">
                  <img src={item.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md rounded-lg shadow-sm">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${TAG_COLORS[item.tag] || 'text-slate-500'}`}>{item.tag}</span>
                  </div>
                </div>
                <h4 className="text-[14px] font-bold text-navy leading-tight truncate px-1">{item.title}</h4>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5 px-1">{item.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── LIVE PULSE FEED (Institutional Design) ── */}
        <div>
          <div className="flex justify-between items-baseline mb-6">
            <h3 className="text-[17px] font-bold text-navy tracking-tight">Live Pulse Feed</h3>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Now
            </span>
          </div>
          <div className="space-y-4">
            {pulsePosts.length > 0 ? pulsePosts.map((post) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-6 rounded-[32px] border-[0.5px] border-slate-100 shadow-sm shadow-slate-200/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-navy">{post.author_name || 'Anonymous Student'}</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{post.time_ago || 'Just now'}</span>
                </div>
                <p className="text-[14px] text-slate-600 leading-relaxed font-medium">
                  {post.content}
                </p>
              </motion.div>
            )) : (
              <div className="py-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200 flex items-center justify-center">
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No active pulse detected</p>
              </div>
            )}
          </div>
        </div>

        {/* ── IN THE MARKET ── */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-[17px] font-bold text-navy tracking-tight">In The Market</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">What students are buying</p>
            </div>
            <button onClick={() => router.push('/marketplace')} className="text-[12px] font-bold text-accent flex items-center gap-1">
              See All <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="flex gap-4 -mx-6 px-6 overflow-x-auto no-scrollbar pb-1">
            {displayItems.slice(0, 4).map((item) => (
              <motion.div
                key={item.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/marketplace/${item.id}`)}
                className="shrink-0 w-[160px] cursor-pointer group"
              >
                <div className="w-full aspect-square bg-slate-50 rounded-2xl overflow-hidden mb-2.5 border border-slate-100 shadow-sm relative">
                  <img src={item.image_url || item.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 image-rendering-pixelated" alt={item.title} />
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none" />
                </div>
                <h4 className="text-[13px] font-bold text-navy leading-tight truncate">{item.title}</h4>
                <p className="text-[13px] font-black text-accent mt-0.5">RM {Number(item.price).toFixed(0)}</p>
              </motion.div>
            ))}
            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/marketplace')}
              className="shrink-0 w-[120px] aspect-square bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all self-start"
            >
              <ArrowUpRight size={20} className="text-slate-300" />
              <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">View All</span>
            </motion.div>
          </div>
        </div>

        {/* ── CAMPUS CLUBS (JOSH DESIGN PROTOCOL) ── */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[17px] font-bold text-navy tracking-tight">Campus Clubs</h3>
            <button onClick={() => router.push('/pulse')} className="text-[11px] font-black text-slate-300 uppercase tracking-widest hover:text-navy transition-colors">Directory</button>
          </div>
          <div className="flex gap-7 -mx-6 px-6 overflow-x-auto no-scrollbar pb-6">
            {[
              { id: 'c1', name: 'MIIT', color: '#3B82F6', icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="4" width="16" height="16" fill="currentColor" />
                  <rect x="8" y="8" width="8" height="8" fill="white" opacity="0.5" />
                  <rect x="11" y="2" width="2" height="4" fill="currentColor" />
                  <rect x="11" y="18" width="2" height="4" fill="currentColor" />
                  <rect x="2" y="11" width="4" height="2" fill="currentColor" />
                  <rect x="18" y="11" width="4" height="2" fill="currentColor" />
                </svg>
              )},
              { id: 'c2', name: 'UBIS', color: '#10B981', icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="14" width="4" height="6" fill="currentColor" />
                  <rect x="10" y="8" width="4" height="12" fill="currentColor" />
                  <rect x="16" y="4" width="4" height="16" fill="currentColor" />
                </svg>
              )},
              { id: 'c3', name: 'MIDI', color: '#8B5CF6', icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="4" width="16" height="10" fill="currentColor" />
                  <rect x="6" y="6" width="4" height="4" fill="white" opacity="0.4" />
                  <rect x="12" y="6" width="4" height="4" fill="white" opacity="0.6" />
                  <rect x="8" y="16" width="8" height="4" fill="currentColor" />
                </svg>
              )},
              { id: 'c4', name: 'SRC', color: '#F43F5E', icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="8" width="12" height="8" fill="currentColor" />
                  <rect x="16" y="6" width="4" height="12" fill="currentColor" />
                  <rect x="6" y="10" width="4" height="4" fill="white" opacity="0.5" />
                </svg>
              )},
            ].map((club, index) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 500, 
                  damping: 15,
                  delay: index * 0.05 
                }}
                whileHover={{ y: -8, scale: 1.05 }}
                whileTap={{ scale: 0.9, y: 0 }}
                onClick={() => router.push('/pulse')}
                className="shrink-0 flex flex-col items-center gap-4 cursor-pointer group"
              >
                {/* Josh Voxel Pod */}
                <div className="w-[64px] h-[64px] relative">
                   {/* 3D Base */}
                  <div className="absolute inset-0 translate-y-1.5 translate-x-1 rounded-2xl bg-slate-200 group-hover:bg-opacity-20 transition-all duration-300" style={{ backgroundColor: `${club.color}33` }} />
                  {/* Main Block */}
                  <div className="absolute inset-0 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center p-3 shadow-sm group-hover:border-opacity-30 transition-all duration-300 overflow-hidden" style={{ borderColor: `${club.color}33` }}>
                     {/* Pixel Grid Overlay */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                    <div className="relative z-10 scale-125 image-rendering-pixelated group-hover:scale-150 transition-all duration-500" style={{ color: club.color }}>
                      {club.icon}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-black text-navy tracking-widest transition-colors uppercase group-hover:text-accent">{club.name}</p>
                  <div className="h-0.5 w-0 transition-all duration-300 mx-auto mt-0.5 rounded-full group-hover:w-full" style={{ backgroundColor: club.color }} />
                </div>
              </motion.div>
            ))}
            
            {/* View More Josh Style */}
            <motion.div
              whileHover={{ y: -8, scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push('/pulse')}
              className="shrink-0 flex flex-col items-center gap-4 cursor-pointer group"
            >
              <div className="w-[64px] h-[64px] rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 group-hover:bg-navy group-hover:text-white group-hover:border-navy transition-all duration-300">
                <ChevronRight size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">More</p>
            </motion.div>
          </div>
        </div>

        {/* ── THE ESSENTIALS (BOB DESIGN PROTOCOL) ── */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-[17px] font-bold text-navy tracking-tight">The Essentials</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Academic & campus must-haves</p>
            </div>
            <button onClick={() => router.push('/marketplace')} className="text-[11px] font-black text-slate-300 uppercase tracking-widest hover:text-navy transition-colors">See All</button>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 items-start pt-4">
            {ESSENTIALS_FALLBACK.map((item, index) => (
              <motion.div
                key={item.id}
                animate={{ y: [0, -6, 0] }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: index * 0.4 
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/marketplace')}
                className={`group cursor-pointer relative ${index % 2 === 1 ? 'mt-10' : ''}`}
              >
                {/* Bobbing Glass Vessel */}
                <div className="relative aspect-4/5 rounded-[2.5rem] overflow-hidden mb-4 glass-card border-white/40 shadow-xl shadow-navy/5 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-navy/10">
                  <div className="absolute inset-0 bg-linear-to-br from-accent/5 via-transparent to-transparent opacity-50" />
                  
                  <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 image-rendering-pixelated" alt={item.title} />
                  
                  {/* Personality Badge */}
                  <div className="absolute top-4 left-4">
                    <div className="px-2 py-1 bg-navy/90 backdrop-blur-md rounded-lg border border-white/10 shadow-lg">
                      <span className="text-[7px] font-black text-white uppercase tracking-[0.2em]">{item.tag}</span>
                    </div>
                  </div>
                </div>

                <div className="px-2 space-y-1">
                  <h4 className="text-[13px] font-bold text-navy leading-tight line-clamp-1">{item.title}</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-black text-accent">RM {item.price}</p>
                    <ArrowUpRight size={14} className="text-slate-200 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>


    </main>
  );
}
