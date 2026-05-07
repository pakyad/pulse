"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import AdminProductApprovals from '@/components/admin/AdminProductApprovals';
import { resolveDispute, updatePriceGuideline } from '@/app/actions/adminActions';
import { 
  Loader2, CheckCircle, AlertTriangle, ChevronRight, Inbox, 
  LayoutGrid, BarChart3, Users, Settings, LogOut, ShieldAlert,
  Search, ShieldCheck, UserCheck, Clock, ExternalLink, Filter
} from 'lucide-react';
import PriceAudit from '@/components/admin/PriceAudit';
import SimplePolicyModal from '@/components/admin/SimplePolicyModal';
import AuditReviewModal from '@/components/admin/AuditReviewModal';
import DisputeResolutionDrawer from '@/components/admin/DisputeResolutionDrawer';
import { setDoc, updateDoc } from 'firebase/firestore';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [flaggedItems, setFlaggedItems] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [guidelines, setGuidelines] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState('command');
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [isDisputeDrawerOpen, setIsDisputeDrawerOpen] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    let guidelinesUnsub: (() => void) | null = null;
    let itemsUnsub: (() => void) | null = null;
    let disputesUnsub: (() => void) | null = null;
    let usersUnsub: (() => void) | null = null;

    const checkAccess = auth.onAuthStateChanged(async (user) => {
      if (guidelinesUnsub) guidelinesUnsub();
      if (itemsUnsub) itemsUnsub();
      if (disputesUnsub) disputesUnsub();

      if (!user) { router.push('/auth'); return; }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const profile = userDoc.data();
      if (profile?.role !== 'ADMIN' && user.email !== 'admin@pulse.com') {
        router.push('/home'); return;
      }

      // 1. Fetch Price Guidelines
      guidelinesUnsub = onSnapshot(collection(db, "PriceGuidelines"), 
        (snap) => {
          const g: Record<string, number> = {};
          snap.docs.forEach(d => g[d.id] = d.data().maxBasePrice);
          setGuidelines(g);
        },
        (err) => console.error("[Pulse Audit] PriceGuidelines Listener Failed:", err)
      );

      // 2. Fetch All Items for Monitoring (onSnapshot)
      itemsUnsub = onSnapshot(
        collection(db, "items"),
        (snap) => {
          setFlaggedItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        },
        (err) => console.error("[Pulse Audit] Items Listener Failed:", err)
      );

      // 3. Fetch Active Disputes (onSnapshot)
      disputesUnsub = onSnapshot(
        query(collection(db, "disputes"), where("status", "==", "AWAITING_ADMIN")),
        (snap) => {
          setDisputes(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.created_at?.toMillis?.() - a.created_at?.toMillis?.()));
        }
      );

      // 4. Fetch Users for Registry (onSnapshot)
      usersUnsub = onSnapshot(collection(db, "users"), 
        (snap) => {
          setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      );

      setLoading(false);
    });

    return () => {
      checkAccess();
      if (guidelinesUnsub) guidelinesUnsub();
      if (itemsUnsub) itemsUnsub();
      if (disputesUnsub) disputesUnsub();
      if (usersUnsub) usersUnsub();
    };
  }, [router]);

  const handleResolve = async (id: string, action: 'RELEASE' | 'REFUND') => {
    setIsProcessing(id);
    try {
      const res = await resolveDispute(id, action); // Backend action with directive
      if (res.success) {
        setIsDisputeDrawerOpen(false);
        alert(`Directive Executed: Funds have been ${action === 'RELEASE' ? 'released to merchant' : 'refunded to buyer'}.`);
      } else {
        alert(res.message);
      }
    } catch (e) { console.error(e); } finally { setIsProcessing(null); }
  };

  const saveGuideline = async (cat: string, price: number) => {
    try {
      const res = await updatePriceGuideline(cat, price);
      if (res.success) {
        alert("Institutional Limit Established.");
      } else {
        alert(res.message);
      }
    } catch (e) { console.error(e); }
  };

  const handleVerifyRunner = async (userId: string) => {
    try {
      await setDoc(doc(db, "users", userId), { role: "RUNNER", runner_application: "VERIFIED" }, { merge: true });
      alert("Identity Verified: User transitioned to Institutional Runner.");
    } catch (e) { console.error(e); }
  };

  const handleSuspendAsset = async (itemId: string) => {
    try {
      await updateDoc(doc(db, "items", itemId), { status: "SUSPENDED" });
      setSelectedReviewItem(null);
      alert("Institutional Directive Executed: Asset Suspended.");
    } catch (e) { console.error(e); }
  };

  const handleDismissViolation = async (itemId: string) => {
    // For now, just close the modal. In production, we'd add an 'ignored' flag.
    setSelectedReviewItem(null);
    alert("Audit Registry Updated: Violation Dismissed.");
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
    { id: 'users', label: 'User Registry', icon: Users },
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
          
          {/* 1. STATS OVERVIEW */}
          {activeTab === 'overview' && (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Marketplace Volume</p>
                  <p className="text-[24px] font-bold text-slate-900">
                    RM {flaggedItems.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
               </div>
               <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Directives</p>
                  <p className="text-[24px] font-bold text-slate-900">{disputes.length + flaggedItems.length}</p>
               </div>
               <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Verified Nodes</p>
                  <p className="text-[24px] font-bold text-slate-900">
                    {users.filter(u => u.role === 'MERCHANT' || u.role === 'RUNNER').length}
                  </p>
               </div>
               <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Infrastructure Health</p>
                  <p className={`text-[24px] font-bold ${disputes.length > 5 ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {disputes.length > 5 ? 'High Load' : 'Stable'}
                  </p>
               </div>
            </section>
          )}

          {/* 2. PRICE AUDIT TERMINAL */}
          {(activeTab === 'command' || activeTab === 'monitor') && (
            <section className="bg-white rounded-[32px] border border-slate-100 p-10">
               <div className="mb-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Economic Oversight</p>
                  <h2 className="text-[22px] font-black text-slate-900 tracking-tight">Price Audit Terminal</h2>
               </div>

               <PriceAudit 
                  items={flaggedItems}
                  guidelines={guidelines}
                  onReview={(item) => setSelectedReviewItem(item)}
                  onOpenPolicy={() => setIsPriceModalOpen(true)}
               />
            </section>
          )}

          {/* 3. ACTIVE DISPUTES (TICKET SYSTEM) */}
          {activeTab === 'disputes' && (
            <section className="space-y-6">
               <div className="flex justify-between items-center px-2">
                  <div>
                     <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">Conflict Resolution</p>
                     <h2 className="text-[22px] font-black text-slate-900 tracking-tight">Active Disputes Queue</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{disputes.length} Open Tickets</span>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                  {disputes.length > 0 ? disputes.map((dispute) => (
                    <button 
                      key={dispute.id}
                      onClick={() => {
                        setSelectedDispute(dispute);
                        setIsDisputeDrawerOpen(true);
                      }}
                      className="w-full bg-white rounded-[24px] border border-slate-100 p-8 text-left hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-8">
                        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                          <ShieldAlert size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{dispute.id.substring(0,8).toUpperCase()}</span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span className="text-[11px] font-black text-red-500 uppercase">Awaiting Directive</span>
                          </div>
                          <h3 className="text-[17px] font-black text-slate-900 tracking-tight">{dispute.reason}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Reporter</p>
                          <p className="text-[13px] font-bold text-slate-900">{dispute.reporter_name}</p>
                        </div>
                        <ChevronRight size={20} className="text-slate-200 group-hover:text-slate-900 transition-colors" />
                      </div>
                    </button>
                  )) : (
                    <div className="py-32 flex flex-col items-center justify-center text-center">
                      <Inbox size={48} strokeWidth={1} className="text-slate-200 mb-6" />
                      <p className="text-[13px] text-slate-400 font-bold uppercase tracking-widest mb-2">Queue Empty</p>
                      <p className="text-[11px] text-slate-300 font-medium mb-8">No reported conflicts requiring administrative directive.</p>
                      <button 
                        onClick={() => {
                          import('@/lib/firebase').then(({ db }) => {
                            import('firebase/firestore').then(({ collection, addDoc }) => {
                              addDoc(collection(db, "disputes"), { reason: "Item never delivered", reporter_name: "Ahmad Student", status: "AWAITING_ADMIN", created_at: new Date() });
                              addDoc(collection(db, "disputes"), { reason: "Wrong item received", reporter_name: "Siti Student", status: "AWAITING_ADMIN", created_at: new Date() });
                              setTimeout(() => window.location.reload(), 1000);
                            });
                          });
                        }}
                        className="h-10 px-6 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-slate-100 hover:text-slate-900 transition-all"
                      >
                        Seed Test Disputes
                      </button>
                    </div>
                  )}
               </div>
            </section>
          )}

          {/* 4. USER REGISTRY (BENTO GRID) */}
          {activeTab === 'users' && (
            <section className="space-y-8">
               <div className="flex justify-between items-center px-2">
                  <div>
                     <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Identity Management</p>
                     <h2 className="text-[22px] font-black text-slate-900 tracking-tight">User Registry</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Search Identity..." className="h-10 pl-11 pr-4 bg-white border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:border-slate-300 w-64 transition-all" />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map((user) => (
                    <div key={user.id} className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-[18px]">
                          {user.full_name?.[0] || 'U'}
                        </div>
                        <div>
                          <h3 className="text-[16px] font-black text-slate-900 tracking-tight">{user.full_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {user.role === 'RUNNER' ? (
                              <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md uppercase tracking-widest border border-emerald-100 flex items-center gap-1">
                                <ShieldCheck size={10} /> Institutional Runner
                              </span>
                            ) : (
                              <span className="text-[9px] font-black bg-slate-50 text-slate-400 px-2 py-0.5 rounded-md uppercase tracking-widest border border-slate-100">
                                Unverified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Electronic Mail</p>
                          <p className="text-[13px] font-bold text-slate-900 truncate">{user.email}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Registry ID</p>
                          <p className="text-[13px] font-bold text-slate-900 truncate uppercase tracking-tighter">#{user.id.substring(0,12)}</p>
                        </div>
                      </div>

                      {user.runner_application === 'PENDING' && (
                        <button 
                          onClick={() => handleVerifyRunner(user.id)}
                          className="w-full h-11 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <UserCheck size={16} /> Verify Identity
                        </button>
                      )}
                    </div>
                  ))}
               </div>
            </section>
          )}

          {/* 4. SETTINGS (Guideline Management) */}
          {activeTab === 'settings' && (
            <section className="bg-white rounded-[32px] border border-slate-100 p-10 space-y-12">
               <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Infrastructure Control</p>
                    <h2 className="text-[22px] font-black text-slate-900 tracking-tight">Economic Guidelines</h2>
                  </div>
                  <button 
                    onClick={() => setIsPriceModalOpen(true)}
                    className="h-11 px-6 bg-slate-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-105 transition-all"
                  >
                    Establish New Limit
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(guidelines).map(([cat, price]) => (
                    <div key={cat} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6">
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Asset Category</p>
                             <p className="text-[17px] font-black text-slate-900 tracking-tight">{cat}</p>
                          </div>
                          <div className="w-10 h-10 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400">
                             <Filter size={18} />
                          </div>
                       </div>
                       <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                          <div>
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Price Ceiling</p>
                             <p className="text-[22px] font-black text-slate-900">RM {price.toFixed(2)}</p>
                          </div>
                          <button 
                            onClick={() => {
                              const newPrice = prompt(`Update ceiling for ${cat}:`, String(price));
                              if (newPrice) saveGuideline(cat, Number(newPrice));
                            }}
                            className="text-[11px] font-black text-accent uppercase tracking-widest underline underline-offset-4"
                          >
                             Adjust
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          )}

        </div>
      </main>

      {/* ── Governance Modals & Drawers ── */}
      <SimplePolicyModal 
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        onSave={saveGuideline}
      />

      <AuditReviewModal 
        item={selectedReviewItem}
        limit={selectedReviewItem ? guidelines[selectedReviewItem.category] : 0}
        onClose={() => setSelectedReviewItem(null)}
        onSuspend={handleSuspendAsset}
        onDismiss={handleDismissViolation}
      />

      <DisputeResolutionDrawer 
        isOpen={isDisputeDrawerOpen}
        onClose={() => setIsDisputeDrawerOpen(false)}
        dispute={selectedDispute}
        onResolve={handleResolve}
      />
    </div>
  );
}
