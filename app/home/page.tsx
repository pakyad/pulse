"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Settings, Search, ChevronLeft, ChevronRight, ArrowUpRight, GraduationCap, Zap, Cpu, BarChart3, Monitor, Video } from 'lucide-react';
import ServiceGrid from '@/components/shared/ServiceGrid';
import SearchOverlay from '@/components/shared/SearchOverlay';
import FeaturedBanner, { BannerSlide } from '@/components/shared/FeaturedBanner';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, orderBy, limit } from 'firebase/firestore';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import RunnerEnrollmentSheet from '@/components/shared/RunnerEnrollmentSheet';
import ProductCard from '@/components/shared/ProductCard';

// ── Fallback data (used when Firestore has no campaigns/announcements) ──
const HERO_SLIDES: BannerSlide[] = [
  {
    id: 'h1', ctaPath: '/pulse',
    headline: "Synchronize Your Stipend",
    subline: 'Check your MARA allowance status & payment schedule',
    bgColor: '#A3B18A' // Muted Sage
  },
  {
    id: 'h2', ctaPath: '/pulse',
    headline: "Clear Outstanding Fees",
    subline: 'Your Semester 4 tuition clearance is pending authorization.',
    bgColor: '#344E41' // Deep Forest/Organic Green
  },
  {
    id: 'h3', ctaPath: '/pulse',
    headline: "Final Results Published",
    subline: 'Your academic transcript for Sem 3 is now officially available.',
    bgColor: '#588157' // Moss Green
  },
];

const ANNOUNCEMENTS_FALLBACK = [
  { id: 'a1', tag: 'ADMIN', title: 'Hostel Applications Now Open', time: '2h ago', path: '/pulse' },
  { id: 'a2', tag: 'EVENT', title: 'Motivational Talk Tomorrow at 9AM', time: '4h ago', path: '/pulse' },
  { id: 'a3', tag: 'CLUB', title: "Badminton Club Merch Launch", time: '6h ago', path: '/marketplace' },
];

const MARKET_FALLBACK = [
  { id: 'f1', title: 'Analog Study Pack', price: 45, img: 'https://images.unsplash.com/photo-1497005367839-6e8464697e19?q=80&w=400', seller_name: 'Academic Dept', is_official: true },
  { id: 'f2', title: 'Mechanical Setup', price: 280, img: 'https://images.unsplash.com/photo-1618335829737-2228ad30662b?q=80&w=400', seller_name: 'Elite Tech', is_official: false },
  { id: 'f3', title: 'Varsity Varsity', price: 95, img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400', seller_name: 'BAC Club', is_official: true },
];

const SPOTLIGHT_FALLBACK = [
  { id: 's1', tag: 'ADMIN', title: 'Hostel Registration Open', sub: 'Deadline: 30 April', img: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=400' },
  { id: 's2', tag: 'EVENT', title: 'Robotics Grand Prix', sub: 'Main Hall · 2PM', img: 'https://images.unsplash.com/photo-1561144257-e32e8efc6c4f?q=80&w=400' },
  { id: 's3', tag: 'CLUB',  title: 'Photography Contest', sub: 'Win RM 500 Credits', img: 'https://images.unsplash.com/photo-1452784444945-3f422708fe5e?q=80&w=400' },
];

const TAG_COLORS: Record<string, string> = {
  ADMIN: 'bg-blue-50 text-blue-600',
  EVENT: 'bg-emerald-50 text-emerald-600',
  CLUB:  'bg-purple-50 text-purple-600',
  NEWS:  'bg-slate-50 text-slate-500',
};

const ESSENTIALS_FALLBACK = [
  { id: 'e1', title: 'Stationery Master Pack', price: 25, img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=400', tag: 'ACADEMIC', is_official: false },
  { id: 'e2', title: 'Official MIIT Lab Coat', price: 65, img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400', tag: 'REQUIRED', is_official: true },
  { id: 'e3', title: 'Pulse Gym Stringer', price: 40, img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400', tag: 'FITNESS', is_official: true },
  { id: 'e4', title: 'Calculus Cheat Sheet', price: 12, img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400', tag: 'EXAMS', is_official: false },
];

export default function PulseHome() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [profile, setProfile] = useState<any>(null);
  const [liveItems, setLiveItems] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
    const qItems = query(collection(db, 'items'), where('status', '==', 'active'), limit(20));
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
    return () => { unsubItems(); unsubAnn(); };
  }, []);

  const displayItems = (liveItems.length > 0 ? liveItems : MARKET_FALLBACK)
    .filter(item => {
      const title = item.title?.toLowerCase() || '';
      const passesOfficial = liveItems.length > 0 ? (item.is_official === true) : true;
      return passesOfficial && !title.includes('roti') && !title.includes('murtabak');
    });

  const HOME_SLIDES: BannerSlide[] = [
    ...HERO_SLIDES,
    {
      id: 'h-runner',
      ctaPath: '#',
      headline: "Earn on your schedule.",
      subline: "Join the MIIT Runner network to support your peers.",
      bgColor: '#A3B18A', // Muted Green (Parity with Stipend Banner)
      onClick: () => setIsEnrollmentOpen(true)
    }
  ];

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">
      <div className="pt-40 px-8 space-y-10 pb-12">
        {/* ── HERO BANNER ── */}
        <FeaturedBanner slides={HOME_SLIDES} />

        {/* ── CAMPUS HUB ── */}
        <div>
          <h3 className="text-[17px] font-bold text-navy tracking-tight mb-5">Campus Hub</h3>
          <ServiceGrid />
        </div>

        {/* ── WHAT'S HAPPENING ── */}
        <div>
          <div className="flex justify-between items-baseline mb-5">
            <h3 className="text-[17px] font-bold text-navy tracking-tight">What's happening</h3>
            <button onClick={() => router.push('/pulse')} className="text-[13px] font-medium text-slate-400 hover:text-navy transition-colors">View all</button>
          </div>
          <div className="flex gap-4 -mx-8 px-8 overflow-x-auto no-scrollbar pb-1">
            {SPOTLIGHT_FALLBACK.map((item, idx) => (
              <motion.div key={item.id} whileTap={{ scale: 0.97 }} onClick={() => router.push('/pulse')} className={`shrink-0 ${idx === 0 ? 'w-[280px]' : 'w-[200px]'} cursor-pointer group`}>
                <div className="w-full h-[140px] bg-slate-50 rounded-3xl overflow-hidden mb-3 border border-slate-100 shadow-sm relative">
                  <img src={item.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                </div>
                <div className="px-1">
                  <span className={`text-[10px] font-medium uppercase tracking-widest ${TAG_COLORS[item.tag]?.split(' ')[1] || 'text-slate-400'} opacity-70 mb-1 block`}>{item.tag}</span>
                  <h4 className="text-[14px] font-semibold text-navy leading-tight truncate">{item.title}</h4>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── IN THE MARKET ── */}
        <div>
          <div className="flex justify-between items-baseline mb-5 px-1">
            <h3 className="text-[17px] font-bold text-navy tracking-tight">In the market</h3>
            <button onClick={() => router.push('/marketplace')} className="text-[13px] font-medium text-slate-400 hover:text-navy transition-colors">View all</button>
          </div>
          <div className="flex gap-4 -mx-8 px-8 overflow-x-auto no-scrollbar pb-2">
            {displayItems.slice(0, 6).map((item) => (
              <div key={item.id} className="shrink-0 w-[180px]">
                <ProductCard 
                  item={item} 
                  onClick={() => router.push(`/marketplace/${item.id}`)} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── CAMPUS CLUBS ── */}
        <div>
          <div className="flex justify-between items-baseline mb-5">
            <h3 className="text-[17px] font-bold text-navy tracking-tight">Campus clubs</h3>
            <button onClick={() => router.push('/pulse')} className="text-[13px] font-medium text-slate-400 hover:text-navy transition-colors">Directory</button>
          </div>
          <div className="flex gap-3 -mx-8 px-8 overflow-x-auto no-scrollbar pb-2">
            {[
              { id: 'c1', name: 'MIIT', icon: <Cpu size={16} /> },
              { id: 'c2', name: 'UBIS', icon: <BarChart3 size={16} /> },
              { id: 'c3', name: 'MIDI', icon: <Monitor size={16} /> },
              { id: 'c4', name: 'SRC',  icon: <Video size={16} /> },
            ].map((club) => (
              <motion.div key={club.id} whileTap={{ scale: 0.96 }} onClick={() => router.push('/pulse')} className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-50 bg-slate-50/50 text-navy/60 cursor-pointer transition-all hover:bg-slate-100">
                 {club.icon}
                 <span className="text-[13px] font-medium tracking-tight">{club.name}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── THE ESSENTIALS ── */}
        <div>
          <div className="flex justify-between items-baseline mb-5">
            <h3 className="text-[17px] font-bold text-navy tracking-tight">The essentials</h3>
            <button onClick={() => router.push('/marketplace')} className="text-[13px] font-medium text-slate-400 hover:text-navy transition-colors">See all</button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 pt-4">
            {ESSENTIALS_FALLBACK.map((item) => (
              <ProductCard
                key={item.id}
                item={{
                  ...item,
                  image_url: item.img, // Mapping fallback key
                  seller_name: 'Official Store',
                  is_official: true
                }}
                onClick={() => router.push('/marketplace')}
              />
            ))}
          </div>
        </div>
      </div>

      <RunnerEnrollmentSheet 
        isOpen={isEnrollmentOpen} 
        onClose={() => setIsEnrollmentOpen(false)} 
        onComplete={() => {}}
      />
      
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </main>
  );
}
