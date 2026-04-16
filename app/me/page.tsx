'use client'
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ArrowRight, LogOut, Zap, User, Package, Award, Star, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function MePage() {
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // 1. Listen to Profile Data
        const userRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(userRef, (snap) => {
          if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
        });

        // 2. Listen to Active Orders (The Ledger)
        const q = query(
          collection(db, "transactions"),
          where("buyer_id", "==", user.uid),
          where("status", "==", "PENDING"),
          orderBy("created_at", "desc")
        );
        const unsubOrders = onSnapshot(q, (snap) => {
          setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          setLoading(false);
        });

        return () => { unsubProfile(); unsubOrders(); };
      } else {
        window.location.href = '/auth';
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogout = () => signOut(auth).then(() => window.location.href = '/auth');

  // Performance Logic
  const score = profile?.hustle_score || 0;
  const getRank = () => {
    if (score >= 500) return { name: 'GOLD RANK', color: 'text-yellow-500', next: 'MAX', barColor: 'bg-yellow-500' };
    if (score >= 150) return { name: 'SILVER RANK', color: 'text-slate-400', next: 500, barColor: 'bg-slate-400' };
    return { name: 'BRONZE RANK', color: 'text-orange', next: 150, barColor: 'bg-orange' };
  };

  const rank = getRank();
  const progress = (score / (rank.next === 'MAX' ? score : rank.next)) * 100;

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center bg-pearl">
    <div className="w-12 h-12 bg-navy animate-pulse rounded-xl mb-4" />
    <p className="text-[10px] text-navy/20 font-black uppercase tracking-[0.5em] text-center italic">SYNCING PULSE...</p>
  </div>;

  return (
    <main className="px-6 pt-12 pb-32 max-w-lg mx-auto min-h-screen bg-pearl">
      {/* Tactical Header */}
      <header className="flex justify-between items-center mb-10 pt-4">
        <div>
          <p className="text-orange text-[8px] font-black uppercase tracking-[0.3em] mb-1 leading-none">System Access</p>
          <h1 className="text-2xl font-black text-navy italic uppercase leading-none">Pulse ID</h1>
        </div>

        <button 
          onClick={handleLogout}
          className="group flex items-center gap-3 bg-navy/5 hover:bg-orange/10 p-4 rounded-[20px] transition-all border border-navy/5 shadow-sm"
          title="Terminate Session"
        >
          <span className="text-[9px] font-black text-navy/40 group-hover:text-orange uppercase tracking-widest hidden sm:block">
            Terminate Session
          </span>
          <LogOut size={18} className="text-navy/40 group-hover:text-orange transition-colors" />
        </button>
      </header>

      {/* Digital ID Card */}
      <div className="hologram-card p-10 bg-white shadow-[0_40px_80px_rgba(0,31,63,0.1)] relative overflow-hidden mb-8 border-none">
        <div className="absolute top-[-10%] right-[-10%] p-4 text-navy opacity-[0.03] rotate-12">
            <Zap size={220} />
        </div>
        
        <header className="mb-10 relative z-10">
            <p className="text-[10px] font-black text-orange uppercase tracking-[0.4em] mb-3 leading-none underline decoration-orange decoration-2">Verified Stakeholder</p>
            <h1 className="text-4xl font-black text-navy uppercase tracking-tighter italic leading-tight">{profile?.full_name}</h1>
        </header>

        <div className="mt-auto relative z-10">
          <p className="text-[9px] text-navy/30 uppercase font-black tracking-widest mb-1">Optical Matric Identifier</p>
          <p className="text-base font-mono font-black text-navy border-l-2 border-orange pl-3">{profile?.matric_no}</p>
        </div>
      </div>

      {/* Performance Ledger Card */}
      <div className="hologram-card p-8 bg-white/50 backdrop-blur-xl mb-12 border-navy/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
            <Award size={64} className="text-navy" />
        </div>

        <div className="flex justify-between items-end mb-6 relative z-10">
            <div>
                <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.3em] mb-2 leading-none">Institutional Standing</p>
                <h4 className={`text-3xl font-black uppercase italic tracking-tighter leading-none ${rank.color}`}>{rank.name}</h4>
            </div>
            <div className="text-right">
                <p className="text-[8px] font-black text-navy/30 uppercase tracking-widest mb-1 leading-none">Activity Pulse</p>
                <p className="text-xl font-black tracking-tighter tabular-nums text-navy leading-none">{score} <span className="text-[10px] uppercase font-bold tracking-widest opacity-20">HP</span></p>
            </div>
        </div>
        
        {/* Optical Progress Bar */}
        <div className="h-2 w-full bg-navy/5 rounded-full overflow-hidden mb-3 shadow-inner">
            <div 
                className={`h-full ${rank.barColor} transition-all duration-1000 ease-out`} 
                style={{ width: `${progress}%` }} 
            />
        </div>
        
        <div className="flex justify-between items-center opacity-40">
            <div className="flex items-center gap-1">
                <Star size={10} className="fill-current" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">Tiers</span>
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest leading-none italic">
                {rank.next === 'MAX' ? 'Elite Pulse Attained' : `Next Rank at ${rank.next} HP`}
            </p>
        </div>
      </div>

      {/* Active Projects Ledger */}
      <div className="flex justify-between items-center mb-6 px-1">
        <h3 className="text-[10px] font-black text-navy/30 uppercase tracking-[0.3em] leading-none">Active Pulse Ledger</h3>
        <div className="flex items-center gap-1.5 bg-orange/10 px-2 py-1 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />
            <span className="text-[8px] font-black text-orange uppercase leading-none">Syncing</span>
        </div>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="hologram-card p-16 flex flex-col items-center opacity-20 border-dashed border-navy/10">
            <Package size={40} className="mb-4 text-navy/20" />
            <p className="text-[10px] font-black uppercase tracking-widest text-navy/40 leading-none">Zero Active Deployments</p>
          </div>
        ) : (
          orders.map(order => (
            <Link href={`/orders/${order.id}`} key={order.id} className="block group">
              <div className="hologram-card p-6 rounded-[32px] flex justify-between items-center group-hover:bg-white transition-all transform group-active:scale-95 border border-navy/5 bg-white/40">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-navy/5 rounded-2xl flex items-center justify-center group-hover:bg-orange/5 transition-colors">
                        <Package className="text-navy/20 group-hover:text-orange transition-colors" size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-navy/40 font-bold uppercase mb-1 tracking-widest leading-none">Handshake Manifest</p>
                        <p className="text-sm font-black text-navy uppercase tracking-tight group-hover:text-orange leading-none italic">#{order.claim_token}</p>
                    </div>
                </div>
                <div className="bg-navy p-3 rounded-2xl shadow-xl group-hover:bg-orange transition-all">
                  <ArrowRight size={18} className="text-white" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
