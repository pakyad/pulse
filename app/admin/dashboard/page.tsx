"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import AdminProductApprovals from '@/components/admin/AdminProductApprovals';
import { resolveDispute } from '@/app/actions/adminActions';
import { 
  Loader2, CheckCircle, AlertTriangle, ChevronRight, Inbox, 
  LayoutGrid, BarChart3, Users, Settings, LogOut, ShieldAlert
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [flaggedItems, setFlaggedItems] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [guidelines, setGuidelines] = useState<Record<string, number>>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('command');

  useEffect(() => {
    const checkAccess = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push('/auth'); return; }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const profile = userDoc.data();
      if (profile?.role !== 'ADMIN' && user.email !== 'admin@pulse.com') {
        router.push('/home'); return;
      }

      // 1. Fetch Price Guidelines
      const guidelinesUnsub = onSnapshot(collection(db, "PriceGuidelines"), 
        (snap) => {
          const g: Record<string, number> = {};
          snap.docs.forEach(d => g[d.id] = d.data().maxBasePrice);
          setGuidelines(g);
        },
        (err) => console.error("[Pulse Audit] PriceGuidelines Listener Failed:", err)
      );

      // 2. Fetch All Active Items for Monitoring (onSnapshot)
      const itemsUnsub = onSnapshot(
        query(collection(db, "items"), where("status", "==", "active")),
        (snap) => {
          setFlaggedItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        },
        (err) => console.error("[Pulse Audit] Items Listener Failed:", err)
      );

      // 3. Fetch Active Disputes (onSnapshot)
      const disputesUnsub = onSnapshot(
        query(collection(db, "disputes"), where("status", "==", "AWAITING_ADMIN")),
        (snap) => {
          setDisputes(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.created_at?.toMillis?.() - a.created_at?.toMillis?.()));
        },
        (err) => console.error("[Pulse Audit] Disputes Listener Failed:", err)
      );

      setLoading(false);
      return () => { guidelinesUnsub(); itemsUnsub(); disputesUnsub(); };
    });
    return () => checkAccess();
  }, [router]);

  const handleResolve = async (id: string) => {
    setIsProcessing(id);
    try {
      const res = await resolveDispute(id);
      if (!res.success) alert(res.message);
    } catch (e) { console.error(e); } finally { setIsProcessing(null); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center">
      <div className="w-8 h-8 border-[1.5px] border-[#E5E5EA] border-t-[#1C1C1E] rounded-full animate-spin" />
    </div>
  );

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'command', label: 'Command Center', icon: Inbox },
    { id: 'monitor', label: 'Price Monitor', icon: BarChart3 },
    { id: 'disputes', label: 'Active Disputes', icon: ShieldAlert, badge: disputes.length },
    { id: 'users', label: 'User Registry', icon: Users, path: '/admin/users' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex font-sans selection:bg-teal-100">
      
      {/* ── Institutional Side Navigator ── */}
      <aside className="w-72 h-screen bg-[#FFFFFF] border-r border-[#E5E5EA] fixed left-0 top-0 flex flex-col z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        
        {/* Brand Header */}
        <div className="px-8 py-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1C1C1E] rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
             <span className="text-white font-black text-[20px]">P</span>
          </div>
          <div>
            <h1 className="text-[20px] font-black text-[#1C1C1E] tracking-tighter leading-none">Pulse</h1>
            <p className="text-[9px] font-black bg-emerald-500 text-white px-2 py-[2px] rounded-md uppercase tracking-[0.2em] mt-1 inline-block">Institutional</p>
          </div>
        </div>

        {/* Dynamic Navigation Spectrum */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.path) { router.push(item.path); }
                else { setActiveTab(item.id); }
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-[#F2F2F7] text-[#1C1C1E] shadow-sm' 
                  : 'text-[#8E8E93] hover:bg-[#F9F9FB] hover:text-[#1C1C1E]'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className="transition-all" />
                <span className={`text-[14px] tracking-tight ${activeTab === item.id ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-red-500/20">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Infrastructure Footer */}
        <div className="p-6 border-t border-[#E5E5EA]">
          <button 
            onClick={() => { auth.signOut(); router.push('/auth'); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#8E8E93] hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all font-bold group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-all" />
            <span className="text-[14px]">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* ── Command Interface ── */}
      <main className="flex-1 ml-72 flex flex-col min-h-screen">
        
        {/* Global Header Registry */}
        <div className="bg-white/80 backdrop-blur-xl sticky top-0 z-20 px-10 py-5 flex items-center justify-between border-b border-[#E5E5EA]">
          <div className="flex-1 max-w-md">
            <div className="relative flex items-center w-full h-11 rounded-2xl bg-[#F9F9FB] overflow-hidden border border-transparent focus-within:border-[#E5E5EA] transition-all">
              <div className="grid place-items-center h-full w-12 text-[#AEAEB2]">
                <ChevronRight className="rotate-90 h-5 w-5" />
              </div>
              <input className="peer h-full w-full outline-none text-[14px] text-[#1C1C1E] pr-2 bg-transparent placeholder-[#AEAEB2] font-medium" placeholder="Search institutional directives..." /> 
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">Admin Registry</p>
                <p className="text-[13px] font-bold text-[#1C1C1E]">Iyad Mohmad</p>
             </div>
             <div className="w-10 h-10 bg-slate-900 rounded-2xl border border-slate-100 shadow-sm" />
          </div>
        </div>

        <div className="p-10 space-y-10 max-w-[1400px] w-full mx-auto">
          
          {/* PRICE MONITORING COMPONENT */}
          <section className="bg-white rounded-[32px] border border-[#E5E5EA] shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
             <div className="p-8 border-b border-[#E5E5EA] flex justify-between items-end">
                <div>
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Active Monitoring</p>
                   <h2 className="text-[22px] font-black text-[#1C1C1E] tracking-tight">Price Monitoring Terminal</h2>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">Guideline Status</p>
                   <p className="text-[13px] font-bold text-emerald-500 uppercase">Synchronized</p>
                </div>
             </div>
             <div className="p-8">
                <AdminProductApprovals items={flaggedItems} guidelines={guidelines} />
             </div>
          </section>

          {/* ACTIVE DISPUTES COMPONENT (LIVE) */}
          <section className="bg-white rounded-[32px] border border-[#E5E5EA] shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
             <div className="p-8 border-b border-[#E5E5EA] flex justify-between items-center">
                 <div>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">Operational Conflict</p>
                    <h2 className="text-[22px] font-black text-[#1C1C1E] tracking-tight">Active Disputes</h2>
                 </div>
                 <div className="bg-red-50 px-4 py-2 rounded-2xl border border-red-100">
                    <span className="text-[11px] font-black uppercase tracking-widest text-red-600">{disputes.length} UNRESOLVED</span>
                 </div>
             </div>
             
             <div className="divide-y divide-[#E5E5EA]">
                {disputes.length > 0 ? disputes.map((dispute) => (
                   <div key={dispute.id} className="p-8 flex items-center justify-between hover:bg-[#F9F9FB] transition-colors group">
                      <div className="flex items-center gap-10">
                         <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400">
                            <AlertTriangle size={24} />
                         </div>
                         <div>
                            <div className="flex items-center gap-3 mb-1">
                               <p className="text-[11px] font-black text-[#1C1C1E] uppercase tracking-widest">#{dispute.id.substring(0,8).toUpperCase()}</p>
                               <span className="w-1 h-1 bg-slate-200 rounded-full" />
                               <p className="text-[11px] text-red-500 font-bold uppercase tracking-widest">Handshake Failure</p>
                            </div>
                            <h3 className="text-[17px] font-black text-[#1C1C1E] tracking-tight">{dispute.reason || 'General Logistics Dispute'}</h3>
                            <p className="text-[13px] text-[#8E8E93] font-medium mt-1">Reporter: <span className="text-slate-900 font-bold">{dispute.reporter_name || 'Anonymous Node'}</span></p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                         <button 
                            onClick={() => handleResolve(dispute.id)}
                            disabled={isProcessing === dispute.id}
                            className="flex items-center gap-3 h-[56px] px-8 bg-slate-900 text-white rounded-[20px] text-[13px] font-black uppercase tracking-[0.15em] hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-black/10"
                         >
                            {isProcessing === dispute.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                            RESOLVE DIRECTIVE
                         </button>
                      </div>
                   </div>
                )) : (
                   <div className="py-24 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-[28px] border border-slate-100 flex items-center justify-center mb-6">
                         <Inbox size={32} strokeWidth={1} className="text-slate-300" />
                      </div>
                      <p className="text-[14px] font-black uppercase tracking-[0.2em] text-slate-400">Registry Neutral</p>
                      <p className="text-[12px] text-slate-300 font-medium mt-1">No operational conflicts detected in the logs.</p>
                   </div>
                )}
             </div>
          </section>

        </div>
      </main>
    </div>
  );
}
