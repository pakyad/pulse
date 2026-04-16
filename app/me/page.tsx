'use client'
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { LogOut, Zap, ShieldCheck, ChevronRight, Package, CreditCard, Activity } from 'lucide-react';
import Link from 'next/link';

export default function MePage() {
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const unsubProfile = onSnapshot(userRef, (snap) => {
          if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
        });

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

  // THE OVERRIDE: Use database name, but fallback to "IYAD MOHMAD" if it's still loading
  const displayName = profile?.full_name || "IYAD MOHMAD";
  const displayMatric = profile?.matric_no || "52213123246";

  return (
    <main className="min-h-screen bg-[#0A0F1E] pb-32 font-sans">
      {/* Header */}
      <div className="px-6 pt-12 flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Pulse ID</h2>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-orange rounded-full animate-ping" />
            <p className="text-[8px] font-bold text-orange uppercase tracking-[0.3em]">System Online</p>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-white/5 p-4 rounded-[24px] border border-white/10 text-white/40 hover:text-orange hover:bg-white/10 transition-all active:scale-95 shadow-lg">
          <LogOut size={20} />
        </button>
      </div>

      {/* THE ELITE ID CARD */}
      <div className="px-6 mb-12">
        <div className="relative bg-gradient-to-br from-[#001F3F] to-[#1a2238] rounded-[3rem] p-10 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] border border-white/5">
          {/* Decorative Background Elements */}
          <div className="absolute -top-10 -right-10 opacity-10 rotate-12">
            <Zap size={240} className="text-white" />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-orange" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div className="px-4 py-1.5 bg-orange text-[#001F3F] rounded-xl shadow-lg shadow-orange/20">
                <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                  {profile?.role || 'CLUB ADMIN'}
                </span>
              </div>
              <ShieldCheck size={24} className="text-white/20" />
            </div>

            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mb-2 leading-none">Authenticated User</p>
            <h1 className="text-4xl font-black text-white uppercase italic leading-none mb-12 tracking-tighter">
              {displayName}
            </h1>

            <div className="flex justify-between items-end border-t border-white/5 pt-8">
              <div>
                <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest mb-1.5">Matric ID</p>
                <p className="text-sm font-mono font-black text-orange tracking-[0.2em]">
                  {displayMatric}
                </p>
              </div>
              <div className="text-right">
                 <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1.5">Encryption</p>
                 <p className="text-[10px] font-black text-white italic tracking-tighter">PULSE_V4.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LEDGER SECTION */}
      <div className="px-6">
        <div className="flex justify-between items-center mb-8 px-1">
          <div>
            <p className="text-white/20 text-[8px] font-black uppercase tracking-[0.4em] mb-1">Operational Signals</p>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Active Deployments</h3>
          </div>
          <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 shadow-inner">
            <span className="text-[10px] font-black text-white italic uppercase">{orders.length} Signals</span>
          </div>
        </div>

        <div className="space-y-4">
          {orders.map(order => (
            <Link href={`/orders/${order.id}`} key={order.id}>
              <div className="group bg-white/2 p-6 rounded-[2.5rem] border border-white/5 hover:border-orange/40 hover:bg-white/5 transition-all flex justify-between items-center active:scale-95 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-orange/20 transition-colors shadow-inner">
                    <Activity size={22} className="text-white/40 group-hover:text-orange" />
                  </div>
                  <div>
                    <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mb-1 leading-none">Handshake Manifest</p>
                    <h4 className="text-lg font-black text-white uppercase italic tracking-tighter transition-colors group-hover:text-orange">#{order.claim_token}</h4>
                  </div>
                </div>
                <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-orange transition-all shadow-lg">
                  <ChevronRight size={22} className="text-white group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
          
          {orders.length === 0 && !loading && (
            <div className="py-20 text-center bg-white/2 border-2 border-dashed border-white/5 rounded-[3rem]">
              <Package size={48} className="mx-auto text-white opacity-10 mb-4" />
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">No Active Deployments Detected</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
