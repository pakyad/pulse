'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Plus } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';
import { RadarCard, ReportRadarModal } from '@/components/pulse/RadarModule';

const DEMO_RADAR = [
  { id: 'radar_1', type: 'LOST',  title: 'Lost: MacBook Charger (USB-C)',       detail: 'Last seen at Level 3 Library, near the window seats. White charger with blue tape on cable.', reward: 'RM 10 reward', contact: 'DM @haziq_miit',            time: '2h ago' },
  { id: 'radar_2', type: 'FOUND', title: 'Found: Student ID Card',               detail: 'Found at Café Rasa counter. Name on card: Ahmad Faris. Surrendered to the security guard on duty.', contact: 'Collect at Guard Post, Main Lobby', time: '4h ago' },
  { id: 'radar_3', type: 'LOST',  title: 'Lost: Blue Casio Scientific Calculator', detail: 'Possibly left in Lab 214 after CFD class on Thursday. Has a "Amir" sticker on the back.', reward: 'RM 15 reward', contact: 'Call 011-2398XXXX', time: '1d ago' },
  { id: 'radar_4', type: 'FOUND', title: 'Found: Airpods Pro (Gen 2) Case',      detail: 'Found in the male prayer room after Zohor. White AirPod Pro case, no pods inside.',            contact: 'DM @pulse_campus to claim',      time: '1d ago' },
];

export default function FoundHub() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Listen to campus_radar database
    const q = query(collection(db, 'campus_radar'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => {
        const d = doc.data();
        let timeStr = 'Just now';
        if (d.created_at?.toDate) {
          const diff = Math.floor((Date.now() - d.created_at.toDate().getTime()) / 1000);
          if (diff < 3600) timeStr = `${Math.floor(diff / 60)}m ago`;
          else if (diff < 86400) timeStr = `${Math.floor(diff / 3600)}h ago`;
          else timeStr = `${Math.floor(diff / 86400)}d ago`;
        }
        return {
          id: doc.id,
          ...d,
          time: timeStr
        };
      });
      setItems(data);
    });

    return () => unsub();
  }, []);

  if (!mounted) return null;

  const displayRadar = items.length > 0 ? items : DEMO_RADAR;

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <BackButton />
          <p className="text-[14px] font-bold tracking-tight">Directory</p>
        </div>
      </nav>

      <div className="pt-24 px-6 space-y-10">
        {/* ── CAMPUS RADAR ── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
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
                className="w-8 h-8 rounded-xl bg-[#111111] flex items-center justify-center text-white active:scale-95 transition-all shadow-sm"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Stacking the cards vertically and forcing them to be full width */}
          <div className="flex flex-col gap-4 [&>div]:w-full!">
            {displayRadar.map((item: any) => <RadarCard key={item.id} item={item} />)}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isReportOpen && (
          <ReportRadarModal onClose={() => setIsReportOpen(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
