'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { Trophy, Medal, Star, Zap, Crown, ChevronLeft, LayoutGrid, ShieldCheck, Activity, ChevronRight } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

// ── STANDARDIZED TYPOGRAPHY COMPONENTS ──
const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[24px] font-bold text-[#000000] tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[14px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

export default function LeaderboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) onSnapshot(doc(db, 'users', user.uid), s => setProfile(s.data()));
    });

    const q = query(
      collection(db, "users"),
      where("role", "==", "CLUB"),
      orderBy("hustle_score", "desc"),
      limit(10)
    );

    const unsubClubs = onSnapshot(q, (snap) => {
      setClubs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubAuth(); unsubClubs(); };
  }, []);

  const getRankStyle = (index: number) => {
    if (index === 0) return { bg: 'bg-amber-50', text: 'text-amber-600', icon: Crown };
    if (index === 1) return { bg: 'bg-slate-100', text: 'text-slate-600', icon: Medal };
    if (index === 2) return { bg: 'bg-orange-50', text: 'text-orange-600', icon: Star };
    return { bg: 'bg-slate-50', text: 'text-[#94a3b8]', icon: Trophy };
  };

  if (loading) return null;

  return (
    <main className="min-h-screen bg-white text-[#000000] antialiased pb-40">
      
      {/* ── GLOBAL NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-8 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
         <div className="flex items-center gap-3">
            <BackButton />
            <p className="text-[15px] font-bold tracking-tight">Leaderboard</p>
         </div>
         <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} />
      </nav>

      <div className="pt-32 px-8 space-y-12">
         
         <section className="px-1">
            <Heading>Club Rankings</Heading>
            <Subtext>Top performing student organizations by activity</Subtext>
         </section>

         <section className="space-y-4">
            <AnimatePresence mode="popLayout">
               {clubs.map((club, index) => {
                  const style = getRankStyle(index);
                  const RankIcon = style.icon;
                  return (
                     <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={club.id} 
                        className="h-[88px] px-8 bg-white border border-slate-100 rounded-[20px] flex items-center justify-between group hover:border-slate-300 transition-all shadow-sm"
                     >
                        <div className="flex items-center gap-6">
                           <div className={`w-12 h-12 rounded-2xl ${style.bg} ${style.text} flex items-center justify-center border border-white`}>
                              {index < 3 ? <RankIcon size={20} /> : <p className="text-[14px] font-bold">#{index + 1}</p>}
                           </div>
                           <div className="text-left">
                              <p className="text-[16px] font-bold text-[#000000] tracking-tight">{club.full_name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <p className="text-[12px] font-medium text-[#94a3b8]">{club.hustle_score || 0} HP</p>
                                 <div className="w-1 h-1 rounded-full bg-slate-200" />
                                 <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">{club.performance_tier || 'NOVICE'}</p>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-4">
                           <div className="hidden sm:flex flex-col items-end">
                              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Level</p>
                              <p className="text-[14px] font-bold text-[#000000]">{Math.floor((club.hustle_score || 0) / 100) + 1}</p>
                           </div>
                           <ChevronRight size={18} className="text-slate-200" />
                        </div>
                     </motion.div>
                  );
               })}
            </AnimatePresence>

            {clubs.length === 0 && (
               <div className="py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 flex flex-col items-center justify-center text-[#94a3b8] gap-3">
                  <Activity size={32} strokeWidth={1} className="opacity-30" />
                  <p className="text-[12px] font-bold uppercase tracking-widest">No rankings available yet</p>
               </div>
            )}
         </section>

         <footer className="pt-10 px-4">
            <div className="p-8 bg-slate-50/50 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck size={16} className="text-slate-400" />
                  <p className="text-[11px] font-bold text-[#000000] uppercase tracking-widest">Fair Play</p>
               </div>
               <p className="text-[12px] text-[#94a3b8] font-medium leading-relaxed">
                  Rankings are updated in real-time based on verified deliveries and student interactions within the Pulse app.
               </p>
            </div>
         </footer>
      </div>

      
    </main>
  );
}
