"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { 
  ChevronLeft, Package, Zap, ArrowRight, Activity, 
  MapPin, Clock, DollarSign, Filter, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

function formatTimeAgo(timestamp: any, nowMs: number) {
  if (!timestamp) return 'just now';
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((nowMs - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch (e) {
    return 'recently';
  }
}

export default function MissionBoard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let unsubMissions: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        onSnapshot(doc(db, "users", user.uid), (snap) => {
          const data = snap.data();
          if (!data?.is_verified_runner) { 
            router.push('/run'); 
            return; 
          }
          setProfile(data);
          setLoading(false);

          // 🏛️ Start mission listener ONLY if verified
          if (!unsubMissions) {
            const q = query(
              collection(db, "orders"), 
              where("status", "in", ["PENDING_RUNNER"])
            );
            
            unsubMissions = onSnapshot(q, (snap) => {
              const allMissions = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter((o: any) => o.delivery_type === 'RUNNER' || o.deliveryType === 'RUNNER' || o.delivery_type === 'runner' || o.deliveryType === 'runner')
                .filter((o: any) => !o.runner_id)
                .sort((a: any, b: any) => {
                   const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at).getTime();
                   const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at).getTime();
                   return (timeB || 0) - (timeA || 0); // Newest first
                });
              setMissions(allMissions);
            }, (err) => {
              console.error("[Missions] Order Sync Error:", err);
            });
          }
        }, (err) => {
           console.error("[Missions] Profile Sync Error:", err);
        });
      } else { 
        router.push('/auth'); 
      }
    });

    return () => {
      unsubAuth();
      if (unsubMissions) unsubMissions();
    };
  }, [router]);

  const handleClaim = async (missionId: string) => {
    if (!auth.currentUser) return;
    setIsProcessing(true);
    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, "orders", missionId);
        const snap = await tx.get(ref);
        if (!snap.exists() || snap.data().runner_id) throw "Mission already claimed by another node.";
        tx.update(ref, { 
          runner_id: auth.currentUser?.uid, 
          runner_name: profile?.full_name || 'Runner',
          status: 'AWAITING_MERCHANT_ACCEPT',
          accepted_at: serverTimestamp()
        });
      });
      router.push('/run/terminal');
    } catch (e: any) { 
      alert(e); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  if (loading) return null;

  return (
    <main className="min-h-screen bg-white font-sans antialiased text-[#1e293b]">
      {/* ── MATURED NAVIGATION ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
         <div className="flex items-center gap-3">
            <button onClick={() => router.push('/run')} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 active:scale-95 transition-all">
               <ChevronLeft size={20} />
            </button>
            <div>
               <p className="text-[24px] font-bold tracking-tight text-slate-900 leading-none">Orders</p>
            </div>
         </div>
         <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name} className="scale-90" />
      </nav>

      <div className="pt-24 pb-32 px-6 space-y-8">
         {/* ── RELAXED FILTER PILLS ── */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['all', 'food', 'parcels', 'academic', 'errands'].map(t => (
               <button 
                 key={t} 
                 onClick={() => setFilter(t)}
                 className={`px-5 h-9 rounded-full text-[12px] font-medium transition-all whitespace-nowrap ${filter === t.toLowerCase() ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-100/50'}`}
               >
                 {t}
               </button>
            ))}
         </div>

         {/* ── MISSION LIST ── */}
         <div className="space-y-4">
            <AnimatePresence mode="popLayout">
               {missions.length > 0 ? (
                  missions.filter(m => filter === 'all' || m.type?.toLowerCase() === filter).map((mission, idx) => (
                    <motion.div 
                      key={mission.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6"
                    >
                       <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                <Package size={22} />
                             </div>
                             <div>
                                <h3 className="text-[16px] font-bold text-slate-900 tracking-tight">{mission.seller_name || 'Merchant'}</h3>
                                <p className="text-[12px] text-slate-400 font-medium lowercase">{mission.title || 'Item'} • #{mission.id.substring(0,8)}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[18px] font-bold text-emerald-600">RM {(mission.deliveryFee || 3.50).toFixed(2)}</p>
                             <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Payout</p>
                          </div>
                       </div>

                       <div className="space-y-3 bg-slate-50/50 p-5 rounded-[24px] border border-slate-100/50">
                          <div className="flex items-center gap-3">
                             <MapPin size={14} className="text-slate-300" />
                             <p className="text-[13px] font-bold text-slate-700">{mission.drop_off_location || 'Campus Center'}</p>
                          </div>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <Clock size={14} className="text-slate-300" />
                                <p className="text-[13px] font-medium text-slate-400 italic lowercase">pickup at {mission.seller_name || 'merchant'}</p>
                             </div>
                             <span className="text-[11px] font-bold text-[#1e293b] bg-slate-200/50 px-2.5 py-0.5 rounded-full lowercase tracking-tight">
                                {formatTimeAgo(mission.created_at, now)}
                             </span>
                          </div>
                       </div>

                       <button 
                         disabled={isProcessing}
                         onClick={() => handleClaim(mission.id)}
                         className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-[14px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
                       >
                          {isProcessing ? <Activity className="animate-spin" size={18} /> : <Zap size={18} className="text-amber-400 fill-amber-400" />}
                          <span className="lowercase">claim mission</span>
                       </button>
                    </motion.div>
                  ))
               ) : (
                  <div className="py-24 flex flex-col items-center justify-center text-center space-y-8">
                     <div className="relative w-20 h-20">
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 180, 270, 360],
                            borderRadius: ["20%", "50%", "20%"]
                          }}
                          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-2 border-dashed border-slate-100" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="grid grid-cols-2 gap-1 animate-pulse">
                              {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 bg-slate-200 rounded-xs" />)}
                           </div>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[16px] font-bold text-slate-900 lowercase">searching for orders...</p>
                        <p className="text-[12px] text-slate-400 font-medium lowercase leading-relaxed">
                           no orders yet. we'll let you know.
                        </p>
                     </div>
                  </div>
               )}
            </AnimatePresence>
         </div>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </main>
  );
}
