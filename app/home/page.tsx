"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Bell, Settings, Search, ChevronLeft, ChevronRight, 
  ArrowUpRight, GraduationCap, Zap, Package, 
  Activity, LayoutGrid, Sparkles, Navigation, MapPin, Box
} from 'lucide-react';
import ServiceGrid from '@/components/shared/ServiceGrid';
import FeaturedBanner, { BannerSlide } from '@/components/shared/FeaturedBanner';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, orderBy, limit } from 'firebase/firestore';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[15px] font-bold text-slate-900 tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[11px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

export default function PulseHome() {
  const [profile, setProfile] = useState<any>(null);
  const [liveItems, setLiveItems] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    let unsubs: (() => void)[] = [];

    const unsubAuth = auth.onAuthStateChanged((user) => {
      // Clear existing listeners on auth change
      unsubs.forEach(u => u());
      unsubs = [];

      if (user) {
        // 👤 Profile Sync
        const uProfile = onSnapshot(doc(db, 'users', user.uid), 
          s => setProfile(s.data()),
          e => console.warn("[Home] Profile Error:", e)
        );
        unsubs.push(uProfile);

        // 🛍️ Marketplace Items
        const qItems = query(collection(db, 'items'), where('status', '==', 'active'), limit(6));
        const uItems = onSnapshot(qItems, 
          s => setLiveItems(s.docs.map(d => ({ id: d.id, ...d.data() }))),
          e => console.warn("[Home] Items Error:", e)
        );
        unsubs.push(uItems);
      } else {
        setProfile(null);
        setLiveItems([]);
      }

      // 📰 Announcements (Public)
      const qAnn = query(collection(db, 'announcements'), orderBy('created_at', 'desc'), limit(3));
      const uAnn = onSnapshot(qAnn, 
        s => setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() }))),
        e => console.warn("[Home] Announce Error:", e)
      );
      unsubs.push(uAnn);
    });
    
    return () => { 
      unsubAuth(); 
      unsubs.forEach(u => u()); 
    };
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">
      
      {/* ── GLOBAL NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/10">
               <Sparkles size={18} />
            </div>
            <div>
               <p className="text-[13px] font-bold tracking-tight leading-none">Pulse</p>
               <p className="text-[9px] font-medium text-[#94a3b8] mt-1 uppercase tracking-wider">Campus Hub</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => router.push('/marketplace')} className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all">
               <Search size={18} />
            </button>
            <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
         </div>
      </nav>

      <div className="pt-28 px-6 space-y-12">
         
         {/* ── FEATURED BANNER (HIDDEN IF EMPTY) ── */}
         <AnimatePresence>
            {announcements.length > 0 && (
               <motion.section initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <FeaturedBanner slides={announcements.map(a => {
                    // Route the banner to a relevant destination based on announcement tag
                    const tag = (a.tag || '').toUpperCase();
                    const fallback = 
                      tag === 'MARKETPLACE' || tag === 'COMMERCE' ? '/marketplace' :
                      tag === 'EVENT' ? '/pulse' :
                      '/pulse';
                    return {
                      id: a.id,
                      tag: a.tag,
                      headline: a.headline,
                      subline: a.subline || a.body,
                      imageUrl: a.imageUrl,
                      bgColor: a.color || 'slate-900',
                      ctaPath: a.ctaPath || fallback,
                    };
                  })} />


               </motion.section>
            )}
         </AnimatePresence>

         {/* ── CAMPUS DIRECTORY ── */}
         <section className="space-y-8">
            <div className="px-1">
               <Heading>Campus Directory</Heading>
               <Subtext>Quick access to student services and links</Subtext>
            </div>
            <ServiceGrid />
         </section>

         {/* ── MARKETPLACE PREVIEW ── */}
         <section className="space-y-8">
            <div className="flex justify-between items-end px-1">
               <div>
                  <Heading>Marketplace</Heading>
                  <Subtext>Browse items for sale from other students</Subtext>
               </div>
               <button onClick={() => router.push('/marketplace')} className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5 active:scale-95 transition-all">
                  Browse All <LayoutGrid size={14} />
               </button>
            </div>

            {liveItems.length > 0 ? (
               <div className="grid grid-cols-2 gap-4">
                  {liveItems.slice(0, 4).map((item) => (
                     <motion.div
                       key={item.id}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => router.push(`/marketplace/${item.id}`)}
                       className="bg-white rounded-[20px] border-[0.5px] border-slate-100 overflow-hidden group shadow-sm"
                     >
                        <div className="aspect-square bg-slate-50 relative overflow-hidden">
                           <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />
                        </div>
                        <div className="p-5 space-y-1">
                           <h4 className="text-[14px] font-bold text-slate-900 truncate">{item.title}</h4>
                           <div className="flex justify-between items-center">
                              <p className="text-[15px] font-bold text-slate-900">RM {Number(item.price).toFixed(0)}</p>
                              <ChevronRight size={14} className="text-slate-300" />
                           </div>
                        </div>
                     </motion.div>
                  ))}
               </div>
            ) : (
               <div className="py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 flex flex-col items-center justify-center text-[#94a3b8] gap-3">
                  <Box size={32} strokeWidth={1} className="opacity-30" />
                  <p className="text-[12px] font-bold uppercase tracking-widest">No listings found</p>
               </div>
            )}
         </section>

      </div>

      
    </main>
  );
}
