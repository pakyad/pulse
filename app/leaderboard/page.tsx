'use client'
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Trophy, Medal, Star, Zap, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LeaderboardPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🛰️ Real-time Competitive Sync
    const q = query(
      collection(db, "users"),
      where("role", "==", "CLUB"),
      orderBy("hustle_score", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setClubs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return (
        <div className="relative">
            <Trophy className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" size={28} />
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -right-2 opacity-50"
            >
                <Crown size={12} className="text-yellow-500" />
            </motion.div>
        </div>
    );
    if (index === 1) return <Medal className="text-slate-400" size={26} />;
    if (index === 2) return <Star className="text-orange" size={24} />;
    return <span className="text-navy/20 font-black text-lg ">#{index + 1}</span>;
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pearl">
        <div className="w-12 h-12 bg-navy animate-pulse rounded-xl mb-4" />
        <p className="text-[10px] text-navy/20 font-black  tracking-[0.5em] text-center ">CALIBRATING RANKINGS...</p>
    </div>
  );

  return (
    <main className="px-6 pt-16 pb-32 max-w-lg mx-auto bg-pearl min-h-screen">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
            <div className="h-[2px] w-8 bg-orange" />
            <p className="text-orange text-[10px] font-black  tracking-[0.4em]">Ecosystem Status</p>
        </div>
        <h1 className="text-4xl font-black text-navy    leading-none">Leaderboard</h1>
      </header>

      <section className="space-y-4">
        <AnimatePresence mode="popLayout">
            {clubs.map((club, index) => {
                const level = Math.floor((club.hustle_score || 0) / 100) + 1;
                return (
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        key={club.id} 
                        className={`hologram-card p-6 flex justify-between items-center bg-white border border-navy/5 ${
                            index === 0 ? 'ring-2 ring-yellow-500/20 bg-white/80' : 
                            index === 1 ? 'bg-white/60' : 
                            index === 2 ? 'bg-white/40' : 'bg-white/20'
                        }`}
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-12 flex justify-center items-center">
                                {getRankIcon(index)}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-navy  tracking-widest leading-none mb-1.5">{club.full_name}</h4>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-bold text-navy/40  tracking-widest leading-none">
                                        {club.hustle_score || 0} HP
                                    </p>
                                    <div className="w-1 h-1 rounded-full bg-navy/10" />
                                    <p className="text-[8px] font-black text-orange  tracking-[0.2em] leading-none ">
                                        {club.performance_tier || 'NOVICE'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                            <div className="bg-navy px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg shadow-navy/10 border border-white/10">
                                <Zap size={10} className="text-orange animate-pulse" />
                                <span className="text-[9px] font-black text-white   ">LVL {level}</span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </AnimatePresence>

        {clubs.length === 0 && (
            <div className="p-20 border-2 border-dashed border-navy/5 rounded-[40px] flex flex-col items-center opacity-20">
                <Trophy size={40} className="mb-4" />
                <p className="text-[10px] font-black  tracking-widest ">Awaiting competitive signals</p>
            </div>
        )}
      </section>

      {/* Institutional Insight */}
      <footer className="mt-12 p-8 border-t border-navy/5">
        <p className="text-[9px] text-navy/30 font-bold  tracking-widest text-center leading-relaxed">
            Rankings are updated in real-time based on verified field handshakes and ecosystem volume.
        </p>
      </footer>
    </main>
  );
}
