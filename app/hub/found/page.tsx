'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Plus } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';
import { RadarCard, ReportRadarModal } from '@/components/pulse/RadarModule';

const DEMO_RADAR = [
  { id: 'radar_1', type: 'LOST',  title: 'Lost: MacBook Charger (USB-C)',       detail: 'Last seen at Level 3 Library, near the window seats. White charger with blue tape on cable.', reward: 'RM 10 reward', contact: 'DM @haziq_miit',            time: '2h ago', reporter_uid: 'demo_user_1', reporter_name: 'Haziq' },
  { id: 'radar_2', type: 'FOUND', title: 'Found: Student ID Card',               detail: 'Found at Caf Rasa counter. Name on card: Ahmad Faris. Surrendered to the security guard on duty.', contact: 'Collect at Guard Post, Main Lobby', time: '4h ago', reporter_uid: 'demo_user_2', reporter_name: 'Faris' },
  { id: 'radar_3', type: 'LOST',  title: 'Lost: Blue Casio Scientific Calculator', detail: 'Possibly left in Lab 214 after CFD class on Thursday. Has a "Amir" sticker on the back.', reward: 'RM 15 reward', contact: 'Call 011-2398XXXX', time: '1d ago', reporter_uid: 'demo_user_3', reporter_name: 'Amir' },
  { id: 'radar_4', type: 'FOUND', title: 'Found: Airpods Pro (Gen 2) Case',      detail: 'Found in the male prayer room after Zohor. White AirPod Pro case, no pods inside.',            contact: 'DM @pulse_campus to claim',      time: '1d ago', reporter_uid: 'demo_user_4', reporter_name: 'Pulse Admin' },
];

export default function FoundHub() {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'BOARD' | 'MY_POSTS'>('BOARD');

  useEffect(() => {
    setMounted(true);
    
    let unsub: (() => void) | undefined;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsub) unsub();
      
      const q = query(collection(db, 'campus_radar'), orderBy('created_at', 'desc'));
      unsub = onSnapshot(q, (snap) => {
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
      }, (err) => {
        console.error('[Radar] Listener Error:', err);
      });
    });

    return () => {
      unsubAuth();
      if (unsub) unsub();
    };
  }, []);

  if (!mounted) return null;

  const handleResolve = async (id: string) => {
     try {
        await updateDoc(doc(db, 'campus_radar', id), { resolved: true });
     } catch(e) {
        console.error('Failed to resolve', e);
     }
  };

  const allData = items.length > 0 ? items : DEMO_RADAR;
  const myUid = auth.currentUser?.uid || 'demo_user_1';
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  const campusBoard = allData.filter((i) => {
     if (i.resolved) return false;
     if (i.created_at?.toDate) {
        if (Date.now() - i.created_at.toDate().getTime() > fourteenDaysMs) return false;
     }
     return true;
  });

  const myPosts = allData.filter((i) => i.reporter_uid === myUid);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased pb-40">
      {/*  NAV  */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-[#F8FAFC]/80 backdrop-blur-xl border-b-[0.5px] border-slate-200/50">
        <div className="flex items-center gap-3">
          <BackButton />
          <p className="text-[14px] font-bold tracking-tight">Lost & Found</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300 ">Live</span>
          </div>
          <button
            onClick={() => setIsReportOpen(true)}
            className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-400 border border-slate-200/60 active:scale-95 transition-all shadow-sm hover:text-slate-600 hover:border-slate-300"
          >
            <Plus size={18} strokeWidth={2} />
          </button>
        </div>
      </nav>

      <div className="pt-24 px-4 space-y-6">
        {/*  TABS  */}
        <div className="flex bg-slate-200/50 p-1 rounded-[14px]">
           <button 
              onClick={() => setActiveTab('BOARD')}
              className={`flex-1 h-9 rounded-[10px] text-[13px] font-bold transition-all ${activeTab === 'BOARD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
              Campus Board
           </button>
           <button 
              onClick={() => setActiveTab('MY_POSTS')}
              className={`flex-1 h-9 rounded-[10px] text-[13px] font-bold transition-all ${activeTab === 'MY_POSTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
              My Posts
           </button>
        </div>

        {/*  LISTINGS  */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4 [&>div]:w-full!">
            {activeTab === 'BOARD' && (
               campusBoard.length > 0 ? (
                  campusBoard.map((item: any) => <RadarCard key={item.id} item={item} isMyPost={item.reporter_uid === myUid} onMarkResolved={handleResolve} />)
               ) : (
                  <div className="text-center py-20 text-slate-400 font-medium text-[13px]">No active posts in the last 14 days.</div>
               )
            )}
            
            {activeTab === 'MY_POSTS' && (
               myPosts.length > 0 ? (
                  myPosts.map((item: any) => <RadarCard key={item.id} item={item} isMyPost={true} onMarkResolved={handleResolve} />)
               ) : (
                  <div className="text-center py-20 text-slate-400 font-medium text-[13px]">You haven't posted anything yet.</div>
               )
            )}
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
