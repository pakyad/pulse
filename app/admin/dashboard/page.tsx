"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection, query, where, onSnapshot, setDoc, updateDoc, limit } from 'firebase/firestore';
import AdminProductApprovals from '@/components/admin/AdminProductApprovals';
import { resolveDispute, updatePriceGuideline } from '@/app/actions/adminActions';
import { 
  Loader2, CheckCircle, AlertTriangle, ChevronRight, Inbox, 
  LayoutGrid, BarChart3, Users, Settings, LogOut, ShieldAlert,
  Search, ShieldCheck, UserCheck, Clock, ExternalLink, Filter, ChevronDown,
  X, Briefcase, GraduationCap, Mail, Smartphone, CheckCircle2, AlertCircle,
  Blocks, UserPlus, Sparkles
} from 'lucide-react';
import PriceAudit from '@/components/admin/PriceAudit';
import SimplePolicyModal from '@/components/admin/SimplePolicyModal';
import AuditReviewModal from '@/components/admin/AuditReviewModal';
import DisputeResolutionDrawer from '@/components/admin/DisputeResolutionDrawer';
import AddMerchantModal from '@/components/admin/AddMerchantModal';
import { seedClubMerchants } from '@/lib/utils/club-merchant-seeder';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [flaggedItems, setFlaggedItems] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [guidelines, setGuidelines] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('command');
  const [isAddMerchantOpen, setIsAddMerchantOpen] = useState(false);
  const [appeals, setAppeals] = useState<any[]>([]);
  const [governanceLogs, setGovernanceLogs] = useState<any[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [isDisputeDrawerOpen, setIsDisputeDrawerOpen] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState<any>(null);
  const [isUsersExpanded, setIsUsersExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [priceReviews, setPriceReviews] = useState<any[]>([]);
  const [flaggedReviews, setFlaggedReviews] = useState<any[]>([]);

  useEffect(() => {
    let guidelinesUnsub: (() => void) | null = null;
    let itemsUnsub: (() => void) | null = null;
    let disputesUnsub: (() => void) | null = null;
    let usersUnsub: (() => void) | null = null;
    let appealsUnsub: (() => void) | null = null;
    let logsUnsub: (() => void) | null = null;
    let reviewsUnsub: (() => void) | null = null;

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
      
      setLoading(false);

      // 1. Fetch Price Guidelines
      guidelinesUnsub = onSnapshot(collection(db, "PriceGuidelines"), 
        (snap) => {
          const g: Record<string, any> = {};
          snap.docs.forEach(d => g[d.id] = { id: d.id, ...d.data() });
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

      // 5. Fetch Pending Appeals (onSnapshot)
      appealsUnsub = onSnapshot(
        query(collection(db, "appeals"), where("status", "==", "PENDING")),
        (snap) => {
          setAppeals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      );

      // 6. Fetch Governance Logs (onSnapshot)
      logsUnsub = onSnapshot(
        query(collection(db, "governance_logs"), limit(50)),
        (snap) => {
          setGovernanceLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.timestamp?.toMillis?.() - a.timestamp?.toMillis?.()));
        }
      );

      // 7. Fetch PENDING_REVIEW items AND algorithmically auto-flagged items
      reviewsUnsub = onSnapshot(
        query(collection(db, "items"), where("is_price_flagged", "==", true)),
        (snap) => {
          const flagged = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => b.created_at?.toMillis?.() - a.created_at?.toMillis?.());
          setPriceReviews(flagged);
        }
      );
    });

    return () => {
      checkAccess();
      if (guidelinesUnsub) guidelinesUnsub();
      if (itemsUnsub) itemsUnsub();
      if (disputesUnsub) disputesUnsub();
      if (usersUnsub) usersUnsub();
      if (appealsUnsub) appealsUnsub();
      if (logsUnsub) logsUnsub();
      if (reviewsUnsub) reviewsUnsub();
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

  const saveGuideline = async (cat: string, price: number, governanceType: 'REGULATED' | 'PREMIUM' = 'REGULATED') => {
    try {
      const res = await updatePriceGuideline(cat, price, governanceType);
      if (res.success) {
        alert("Institutional Limit Established.");
      } else {
        alert(res.message);
      }
    } catch (e) { console.error(e); }
  };

  // ── Institutional Directive Handlers ──
  const handleAdjudicate = async (appeal: any, action: 'APPROVE' | 'REJECT') => {
    try {
      setIsProcessing(appeal.id);
      const { functions } = await import('@/lib/firebase');
      const { httpsCallable } = await import('firebase/functions');
      const adjudicate = httpsCallable(functions, 'adjudicateAppeal');
      await adjudicate({ itemId: appeal.itemId, appealId: appeal.id, action, adminId: 'ADMIN-CORE' });
      alert(`Directive Sealed: ${action}`);
    } catch (e) {
      console.error(e);
      alert("Adjudication Handshake Failed.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSeedClubs = async () => {
    if (!confirm("Populate Institutional Registry with 5 Club Merchant accounts?")) return;
    setIsSeeding(true);
    try {
      const res = await seedClubMerchants();
      if (res.success) alert("Institutional Registry Populated.");
      else alert("Seeding Registry Failed.");
    } catch (e) { console.error(e); }
    finally { setIsSeeding(false); }
  };

  const verifyUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        is_verified: true,
        verified_at: new Date()
      });
      alert("Institutional Credentials Granted.");
    } catch (e) {
      alert("Credentialing failed.");
    }
  };

  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), { is_suspended: !currentStatus });
    } catch (e) { console.error(e); }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean, roleField: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        [roleField]: !currentStatus
      });
      // Update local state if needed, but onSnapshot should handle it
    } catch (e) {
      alert("Registry update failed.");
    }
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
    setSelectedReviewItem(null);
    alert("Audit Registry Updated: Violation Dismissed.");
  };

  // ── Price Review: Dismiss Flag / Remove Listing ──
  const handlePriceReview = async (itemId: string, action: 'DISMISS' | 'REMOVE') => {
    setIsProcessing(itemId);
    try {
      if (action === 'DISMISS') {
        // Clear the flag — listing stays live
        await updateDoc(doc(db, 'items', itemId), {
          is_price_flagged: false,
          price_flag_count: 0,
          flag_source: null,
          flag_dismissed_by: auth.currentUser?.uid || 'ADMIN',
          flag_dismissed_at: new Date(),
        });
      } else {
        // Remove listing from marketplace
        const reason = prompt('Reason for removal (shown to seller):');
        if (!reason) { setIsProcessing(null); return; }
        await updateDoc(doc(db, 'items', itemId), {
          status: 'REJECTED',
          is_price_flagged: false,
          rejection_reason: reason,
          governance_rejected_by: auth.currentUser?.uid || 'ADMIN',
          governance_rejected_at: new Date(),
        });
      }
    } catch (e) {
      console.error(e);
      alert('Action failed.');
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F9F9FB] flex items-center justify-center">
      <div className="w-8 h-8 border-[1.5px] border-[#E5E5EA] border-t-[#1C1C1E] rounded-full animate-spin" />
    </div>
  );

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'command', label: 'Command Center', icon: Inbox },
    { id: 'price_review', label: 'Price Review', icon: ShieldCheck, badge: priceReviews.length },
    { id: 'monitor', label: 'Price Monitor', icon: BarChart3 },
    { id: 'disputes', label: 'Dispute Mediation', icon: ShieldAlert, badge: disputes.length },
    { 
      id: 'users', 
      label: 'User Registry', 
      icon: Users,
      subItems: [
        { id: 'ALL', label: 'All Identities' },
        { id: 'STUDENT', label: 'Student Registry' },
        { id: 'MERCHANT', label: 'Merchant Registry' },
        { id: 'RUNNER', label: 'Runner Registry' },
      ]
    },
    { id: 'appeals', label: 'Price Appeals', icon: ShieldCheck, badge: appeals.length },
    { id: 'logs', label: 'Governance Logs', icon: Clock },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex font-sans selection:bg-teal-100">
      
      {/* ── Institutional Side Navigator ── */}
      <aside className="w-72 h-screen bg-[#FFFFFF] border-r border-[#E5E5EA] fixed left-0 top-0 flex flex-col z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        
        {/* Brand Header */}
        <div className="px-8 py-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1C1C1E] rounded-xl flex items-center justify-center shadow-md shadow-black/10">
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
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  if (item.subItems) {
                    setIsUsersExpanded(!isUsersExpanded);
                    setActiveTab(item.id);
                  } else { 
                    setActiveTab(item.id); 
                  }
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
                {item.subItems ? (
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${isUsersExpanded ? 'rotate-180' : ''} text-[#AEAEB2]`} 
                  />
                ) : (
                  item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md shadow-red-500/20">{item.badge}</span>
                  )
                )}
              </button>

              {/* Sidebar Sub-options */}
              {item.subItems && isUsersExpanded && (
                <div className="pl-12 pr-2 py-2 space-y-1">
                  {item.subItems.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setActiveSubTab(sub.id);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                        activeTab === item.id && activeSubTab === sub.id
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-[#AEAEB2] hover:text-[#1C1C1E] hover:bg-[#F9F9FB]'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
               <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Marketplace Volume</p>
                  <p className="text-[24px] font-bold text-slate-900">
                    RM {flaggedItems.reduce((acc, curr) => acc + (curr.price || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
               </div>
               <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Directives</p>
                  <p className="text-[24px] font-bold text-slate-900">{disputes.length + flaggedItems.length}</p>
               </div>
               <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Verified Nodes</p>
                  <p className="text-[24px] font-bold text-slate-900">
                    {users.filter(u => u.role === 'MERCHANT' || u.role === 'RUNNER').length}
                  </p>
               </div>
               <div className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Infrastructure Health</p>
                  <p className={`text-[24px] font-bold ${disputes.length > 5 ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {disputes.length > 5 ? 'High Load' : 'Stable'}
                  </p>
               </div>
            </section>
          )}

          {/* 2. PRICE AUDIT TERMINAL */}
          {(activeTab === 'command' || activeTab === 'monitor') && (
            <section className="bg-white rounded-2xl border border-slate-100 p-10">
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

          {activeTab === 'price_review' && (
            <section className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Market Governance</p>
                  <h2 className="text-[22px] font-black text-slate-900 tracking-tight">Flagged Listings Queue</h2>
                  <p className="text-[13px] font-medium text-slate-400 mt-1">
                    Items auto-flagged by the system (price &gt; 150% ceiling) or reported by 3+ buyers.
                  </p>
                </div>
                <div className="px-5 py-2 bg-amber-50 border border-amber-100 rounded-2xl">
                  <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest">{priceReviews.length} Flagged</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {priceReviews.length === 0 ? (
                  <div className="py-32 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-400">
                      <ShieldCheck size={28} />
                    </div>
                    <p className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">All clear — no flagged listings</p>
                  </div>
                ) : (
                  priceReviews.map((item) => {
                    const overBy = item.price - (item.governance_ceiling || 0);
                    const overPct = item.governance_ceiling ? Math.round((overBy / item.governance_ceiling) * 100) : 0;
                    const isSystemFlag = item.flag_source === 'SYSTEM';
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border border-slate-100 p-8 flex items-start justify-between gap-8 shadow-sm"
                      >
                        {/* Left — item info */}
                        <div className="flex-1 space-y-5">
                          <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                              {item.images?.[0]
                                ? <img src={item.images[0]} className="w-full h-full object-cover" alt="" />
                                : <div className="w-full h-full flex items-center justify-center text-slate-300"><ShieldAlert size={20} /></div>
                              }
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-[16px] font-black text-slate-900 tracking-tight">{item.title}</h3>
                                {/* Flag source badge */}
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                  isSystemFlag
                                    ? 'bg-red-50 text-red-500 border border-red-100'
                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                  {isSystemFlag ? '⚡ Auto-Flagged' : '👥 Community Report'}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                {item.domain} · {item.subcategory}
                              </p>
                              <p className="text-[12px] font-medium text-slate-400 mt-0.5">Seller: {item.seller_name || '—'}</p>
                              {!isSystemFlag && (
                                <p className="text-[11px] font-bold text-amber-500 mt-0.5">
                                  {item.price_flag_count || 0} buyer report{(item.price_flag_count || 0) !== 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Price comparison */}
                          <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Listed Price</p>
                              <p className="text-[20px] font-black text-red-500">RM {Number(item.price).toFixed(2)}</p>
                            </div>
                            {item.governance_ceiling && (
                              <>
                                <div className="w-px h-8 bg-slate-200" />
                                <div>
                                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Category Ceiling</p>
                                  <p className="text-[20px] font-black text-slate-900">RM {Number(item.governance_ceiling).toFixed(2)}</p>
                                </div>
                                <div className="w-px h-8 bg-slate-200" />
                                <div>
                                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Over By</p>
                                  <p className="text-[20px] font-black text-amber-500">+{overPct}%</p>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Seller Justification / Appeal */}
                          {item.price_appeal && (
                            <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100/50 space-y-1">
                              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Seller Justification</p>
                              <p className="text-[12px] font-semibold text-red-700 italic">"{item.price_appeal}"</p>
                            </div>
                          )}
                        </div>

                        {/* Right — actions */}
                        <div className="flex flex-col gap-3 shrink-0 w-[180px]">
                          <button
                            onClick={() => handlePriceReview(item.id, 'DISMISS')}
                            disabled={isProcessing === item.id}
                            className="h-12 bg-blue-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black active:scale-95 transition-all disabled:opacity-30"
                          >
                            {isProcessing === item.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Clear Flag
                          </button>
                          <button
                            onClick={() => handlePriceReview(item.id, 'REMOVE')}
                            disabled={isProcessing === item.id}
                            className="h-12 bg-white text-red-500 border border-red-100 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 active:scale-95 transition-all disabled:opacity-30"
                          >
                            <X size={14} />
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
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
                      className="w-full bg-white rounded-2xl border border-slate-100 p-8 text-left hover:shadow-md hover:shadow-slate-200/50 transition-all group flex items-center justify-between"
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

          {/* 4. APPEALS COMMAND CENTER */}
          {activeTab === 'appeals' && (
            <section className="space-y-10">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Economic Adjudication</p>
                     <h2 className="text-[28px] font-black tracking-tight uppercase">Price Appeals Registry</h2>
                     <p className="text-[14px] font-medium text-slate-400">Review justification for category ceiling exemptions.</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <button 
                       onClick={handleSeedClubs}
                       disabled={isSeeding}
                       className="h-10 px-6 bg-white border border-slate-200 shadow-sm text-slate-900 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-[0.98]"
                     >
                        {isSeeding ? <Loader2 className="animate-spin" size={14} /> : <Blocks size={14} />}
                        Seed Institutional Data
                     </button>
                     <div className="px-5 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{appeals.length} Pending Directives</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {appeals.length === 0 ? (
                    <div className="py-40 flex flex-col items-center gap-4 text-center">
                       <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300"><Inbox size={40} /></div>
                       <p className="text-[14px] font-bold text-slate-300 uppercase tracking-widest">No pending appeals in registry.</p>
                    </div>
                  ) : (
                    appeals.map((appeal) => (
                      <motion.div 
                        key={appeal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-10"
                      >
                         <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><ShieldAlert size={24} /></div>
                               <div>
                                  <p className="text-[16px] font-black text-slate-900">{appeal.itemTitle}</p>
                                  <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Merchant: {appeal.sellerName}</p>
                               </div>
                            </div>
                            <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 italic text-[14px] text-slate-600 leading-relaxed">
                               "{appeal.justification_text || 'No justification provided.'}"
                            </div>
                         </div>

                         <div className="w-[300px] space-y-3">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                               <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Proposed Price</span>
                                  <span className="text-[16px] font-black text-slate-900">RM {appeal.price}</span>
                               </div>
                               <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Category</span>
                                  <span className="text-[12px] font-bold text-slate-900">{appeal.category}</span>
                               </div>
                            </div>
                            <div className="flex gap-3">
                               <button 
                                 onClick={() => handleAdjudicate(appeal, 'APPROVE')}
                                 disabled={isProcessing === appeal.id}
                                 className="flex-1 h-14 bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md shadow-black/10 disabled:opacity-20"
                               >
                                  {isProcessing === appeal.id ? '...' : 'Approve'}
                               </button>
                               <button 
                                 onClick={() => handleAdjudicate(appeal, 'REJECT')}
                                 disabled={isProcessing === appeal.id}
                                 className="flex-1 h-14 bg-white text-red-600 border border-red-100 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-50 active:scale-95 transition-all disabled:opacity-20"
                               >
                                  {isProcessing === appeal.id ? '...' : 'Reject'}
                               </button>
                            </div>
                         </div>
                      </motion.div>
                    ))
                  )}
               </div>
            </section>
          )}

          {/* 5. USER REGISTRY (BENTO GRID) */}
          {activeTab === 'users' && (
            <section className="space-y-8">
               <div className="flex justify-between items-center px-2">
                  <div>
                     <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Identity Management</p>
                     <h2 className="text-[22px] font-black text-slate-900 tracking-tight">
                        {activeSubTab === 'ALL' ? 'User Registry' : `${activeSubTab.charAt(0) + activeSubTab.slice(1).toLowerCase()} Registry`}
                     </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setIsAddMerchantOpen(true)}
                      className="h-10 px-4 bg-white border border-slate-200 shadow-sm text-slate-900 hover:bg-slate-50 rounded-xl text-[12px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <UserPlus size={16} />
                      Add Merchant
                    </button>
                    <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Search Identity..." className="h-10 pl-11 pr-4 bg-white border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 outline-none focus:border-slate-300 w-64 transition-all" />
                    </div>
                  </div>
               </div>

                <div className="bg-white border-[0.5px] border-[#F2F2F7] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-[#FDFDFD] border-b-[0.5px] border-[#F2F2F7]">
                            <th className="px-10 py-5 text-[9px] font-black text-black/20 uppercase tracking-[0.3em]">Identity Node</th>
                            <th className="px-10 py-5 text-[9px] font-black text-black/20 uppercase tracking-[0.3em]">Clearance</th>
                            <th className="px-10 py-5 text-[9px] font-black text-black/20 uppercase tracking-[0.3em]">Tenure</th>
                            <th className="px-10 py-5 text-[9px] font-black text-black/20 uppercase tracking-[0.3em] text-right">Directive</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y-[0.5px] divide-[#F2F2F7]">
                         {users
                           .filter(u => {
                             if (activeSubTab === 'ALL') return true;
                             if (activeSubTab === 'RUNNER') return u.is_verified_runner || u.runner_status === 'pending';
                             if (activeSubTab === 'MERCHANT') return u.is_seller || u.merchant_status === 'pending';
                             if (activeSubTab === 'STUDENT') return !u.is_verified_runner && !u.is_seller && u.runner_status !== 'pending' && u.merchant_status !== 'pending';
                             return true;
                           })
                           .map((u) => (
                            <tr key={u.id} className="hover:bg-[#FDFDFD] transition-all group cursor-pointer" onClick={() => setSelectedUser(u)}>
                               <td className="px-10 py-4">
                                  <div className="flex items-center gap-4">
                                     <div className="w-10 h-10 rounded-xl bg-slate-50 overflow-hidden border-[0.5px] border-[#F2F2F7] shadow-sm grayscale group-hover:grayscale-0 transition-all duration-500">
                                        <img src={u.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name}`} alt="" className="w-full h-full object-cover" />
                                     </div>
                                     <div>
                                         <div className="flex items-center gap-2 mb-1">
                                            <p className="text-[14px] font-black text-[#1C1C1E] tracking-tight leading-none">{u.full_name}</p>
                                            {u.role === 'STUDENT' && (
                                               <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${u.is_verified ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                  {u.is_verified ? 'VERIFIED' : 'PENDING'}
                                               </span>
                                            )}
                                         </div>
                                         <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest">{u.matric_no || 'UniKL IDENTITY'}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-10 py-4">
                                  <div className="flex gap-2">
                                     {u.runner_status === 'pending' && !u.is_verified_runner && <span className="px-2.5 py-1 bg-amber-100 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"><Clock size={10} /> Pending Runner</span>}
                                     {u.merchant_status === 'pending' && !u.is_seller && <span className="px-2.5 py-1 bg-amber-100 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"><Clock size={10} /> Pending Merchant</span>}
                                     {u.runner_status === 'pending' && !u.is_verified_runner && <span className="px-2.5 py-1 bg-amber-100 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"><Clock size={10} /> Pending Runner</span>}
                                     {u.is_verified_runner && <span className="px-2.5 py-1 bg-[#1C1C1E] text-white rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={10} /> Runner</span>}
                                     {u.merchant_status === 'pending' && !u.is_seller && <span className="px-2.5 py-1 bg-amber-100 text-amber-600 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"><Clock size={10} /> Pending Merchant</span>}
                                     {u.is_seller && <span className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5"><Briefcase size={10} /> Merchant</span>}
                                     {!u.is_verified_runner && !u.is_seller && u.runner_status !== 'pending' && u.merchant_status !== 'pending' && <span className="px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-md text-[8px] font-black uppercase tracking-widest">Resident</span>}
                                  </div>
                               </td>
                               <td className="px-10 py-4">
                                  <span className="text-[12px] font-bold text-black/30 tracking-tight">Class of 2026</span>
                               </td>
                               <td className="px-10 py-4 text-right">
                                   <div className="flex items-center justify-end gap-3">
                                      {u.role === 'STUDENT' && !u.is_verified && (
                                         <button 
                                           onClick={(e) => { e.stopPropagation(); verifyUser(u.id); }}
                                           className="h-8 px-4 bg-white border border-slate-200 shadow-sm text-slate-900 hover:bg-slate-50 rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-[0.98] transition-all"
                                         >
                                            Grant Credentials
                                         </button>
                                      )}
                                      <button className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-black/10 group-hover:bg-[#1C1C1E] group-hover:text-white transition-all duration-300">
                                         <ChevronRight size={14} strokeWidth={3} />
                                      </button>
                                   </div>
                                </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
            </section>
          )}

          {/* 5. GOVERNANCE AUDIT LOGS */}
          {activeTab === 'logs' && (
            <section className="space-y-10">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">System Audit Trail</p>
                     <h2 className="text-[28px] font-black tracking-tight uppercase text-slate-900">Governance Ledger</h2>
                  </div>
               </div>

               <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                           <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Directive Type</th>
                           <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Target ID</th>
                           <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Event Data</th>
                           <th className="px-10 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {governanceLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                             <td className="px-10 py-5">
                                <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                  log.type === 'PRICE_BLOCK' ? 'bg-red-50 text-red-500' :
                                  log.type === 'ADJUDICATION' ? 'bg-emerald-50 text-emerald-500' :
                                  'bg-slate-100 text-slate-400'
                                }`}>
                                   {log.type}
                                </span>
                             </td>
                             <td className="px-10 py-5">
                                <code className="text-[11px] font-bold text-slate-400">#{log.target_id?.substring(0,8).toUpperCase()}</code>
                             </td>
                             <td className="px-10 py-5">
                                <p className="text-[13px] font-medium text-slate-600">{log.details}</p>
                             </td>
                             <td className="px-10 py-5 text-right">
                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                                   {log.timestamp?.toMillis ? new Date(log.timestamp.toMillis()).toLocaleString() : 'Just Now'}
                                </span>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </section>
          )}

          {/* 6. SETTINGS (Guideline Management) */}
          {activeTab === 'settings' && (
            <section className="bg-white rounded-2xl border border-slate-100 p-10 space-y-12">
               <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Infrastructure Control</p>
                    <h2 className="text-[22px] font-black text-slate-900 tracking-tight">Economic Guidelines</h2>
                  </div>
                  <button 
                    onClick={() => setIsPriceModalOpen(true)}
                    className="h-11 px-6 bg-white border border-slate-200 shadow-sm text-slate-900 hover:bg-slate-50 rounded-xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-[0.98] transition-all"
                  >
                    Establish New Limit
                  </button>
               </div>

                <div className="space-y-16">
                  {/* GROUP 1: REGULATED NECESSITIES */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                       <div className="w-2 h-6 bg-red-500 rounded-full" />
                       <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Institutional Necessities (Regulated)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {Object.entries(guidelines).filter(([_, data]) => (data.governance_type || 'REGULATED') === 'REGULATED').map(([cat, data]) => (
                         <div key={cat} className="p-8 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                            <div className="flex justify-between items-start">
                               <div>
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Asset Category</p>
                                  <p className="text-[17px] font-black text-slate-900 tracking-tight">{data.category}</p>
                               </div>
                               <div className="w-10 h-10 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-red-400">
                                  <ShieldAlert size={18} />
                               </div>
                            </div>
                            <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                               <div>
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Hard Ceiling</p>
                                  <p className="text-[22px] font-black text-slate-900">RM {(data.max_price || data.maxBasePrice || 0).toFixed(2)}</p>
                               </div>
                               <button 
                                 onClick={() => {
                                   const newPrice = prompt(`Update ceiling for ${data.category}:`, String(data.max_price || data.maxBasePrice));
                                   if (newPrice) saveGuideline(data.category, Number(newPrice), 'REGULATED');
                                 }}
                                 className="text-[11px] font-black text-red-500 uppercase tracking-widest underline underline-offset-4"
                               >
                                  Adjust
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  {/* GROUP 2: PREMIUM ASSETS */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                       <div className="w-2 h-6 bg-amber-500 rounded-full" />
                       <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest">Premium Market Assets (Flexible)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {Object.entries(guidelines).filter(([_, data]) => data.governance_type === 'PREMIUM').map(([cat, data]) => (
                         <div key={cat} className="p-8 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                            <div className="flex justify-between items-start">
                               <div>
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Asset Category</p>
                                  <p className="text-[17px] font-black text-slate-900 tracking-tight">{data.category}</p>
                               </div>
                               <div className="w-10 h-10 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-amber-400">
                                  <Sparkles size={18} />
                               </div>
                            </div>
                            <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                               <div>
                                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Advisory Limit</p>
                                  <p className="text-[22px] font-black text-slate-900">RM {(data.max_price || 0).toFixed(2)}</p>
                               </div>
                               <button 
                                 onClick={() => {
                                   const newPrice = prompt(`Update advisory limit for ${data.category}:`, String(data.max_price));
                                   if (newPrice) saveGuideline(data.category, Number(newPrice), 'PREMIUM');
                                 }}
                                 className="text-[11px] font-black text-amber-600 uppercase tracking-widest underline underline-offset-4"
                               >
                                  Adjust
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
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
        limit={selectedReviewItem ? (guidelines[selectedReviewItem.category]?.max_price || guidelines[selectedReviewItem.category]?.maxBasePrice || 0) : 0}
        isRegulated={selectedReviewItem ? (guidelines[selectedReviewItem.category]?.governance_type !== 'PREMIUM') : true}
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

      {/* ── IDENTITY AUDIT DRAWER (Option 1) ── */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} className="fixed inset-0 z-100 bg-black/20 backdrop-blur-md" />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[540px] bg-white z-110 shadow-md flex flex-col"
            >
               <div className="p-10 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">Audit Terminal</p>
                    <h2 className="text-[24px] font-black text-black uppercase tracking-tighter">Identity Review</h2>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-black/20 hover:text-black transition-colors"><X size={24} /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-10 space-y-12">
                  <div className="flex flex-col items-center text-center space-y-4 py-8">
                     <div className="w-32 h-32 rounded-[48px] overflow-hidden border-[0.5px] border-[#F2F2F7] shadow-md relative">
                        <img src={selectedUser.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.full_name}`} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                     </div>
                     <div>
                        <h3 className="text-[28px] font-black text-black tracking-tighter leading-none">{selectedUser.full_name}</h3>
                        <p className="text-[14px] font-bold text-black/30 mt-2">{selectedUser.email}</p>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.3em] mb-6">Registry Authorization</p>
                     
                     <div className="p-8 rounded-2xl bg-[#FDFDFD] border-[0.5px] border-[#F2F2F7] flex items-center justify-between group hover:border-black/5 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-black text-white rounded-[20px] flex items-center justify-center shadow-md"><ShieldCheck size={28} /></div>
                           <div>
                              <p className="text-[17px] font-black text-black tracking-tight">Logistics Verification</p>
                              <p className="text-[13px] font-medium text-black/30">Verified Pulse Runner Node</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => toggleVerification(selectedUser.id, selectedUser.is_verified_runner, 'is_verified_runner')}
                          className={`w-16 h-9 rounded-full relative transition-all duration-500 ${selectedUser.is_verified_runner ? 'bg-[#00927C]' : 'bg-black/10'}`}
                        >
                           <motion.div 
                             animate={{ x: selectedUser.is_verified_runner ? 30 : 6 }}
                             className="absolute top-1.5 w-6 h-6 bg-white rounded-full shadow-md"
                           />
                        </button>
                     </div>

                     <div className="p-8 rounded-2xl bg-[#FDFDFD] border-[0.5px] border-[#F2F2F7] flex items-center justify-between group hover:border-black/5 transition-all">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-blue-600 text-white rounded-[20px] flex items-center justify-center shadow-md"><Briefcase size={28} /></div>
                           <div>
                              <p className="text-[17px] font-black text-black tracking-tight">Merchant Authority</p>
                              <p className="text-[13px] font-medium text-black/30">Verified Pulse Vendor Node</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => toggleVerification(selectedUser.id, selectedUser.is_seller, 'is_seller')}
                          className={`w-16 h-9 rounded-full relative transition-all duration-500 ${selectedUser.is_seller ? 'bg-[#007AFF]' : 'bg-black/10'}`}
                        >
                           <motion.div 
                             animate={{ x: selectedUser.is_seller ? 30 : 6 }}
                             className="absolute top-1.5 w-6 h-6 bg-white rounded-full shadow-md"
                           />
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     {[
                        { label: 'Campus ID', value: selectedUser.matric_no || 'UniKL-PR', icon: GraduationCap },
                        { label: 'Mobile Auth', value: selectedUser.phone || 'N/A', icon: Smartphone },
                        { label: 'Registry Date', value: '24 May 2024', icon: Clock },
                        { label: 'Trust Score', value: '98.2%', icon: CheckCircle2 },
                     ].map(item => (
                        <div key={item.label} className="p-6 bg-white border-[0.5px] border-[#F2F2F7] rounded-2xl">
                           <p className="text-[9px] font-black text-black/20 uppercase tracking-[0.2em] mb-4">{item.label}</p>
                           <div className="flex items-center gap-3">
                              <item.icon size={16} className="text-black/20" />
                              <span className="text-[15px] font-bold text-black truncate">{item.value}</span>
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="p-8 bg-red-50/50 rounded-2xl border-[0.5px] border-red-100/50 space-y-6">
                     <div className="flex items-center gap-4 text-red-600">
                        <AlertCircle size={24} />
                        <p className="text-[17px] font-black tracking-tight">Security Protocol</p>
                     </div>
                     <p className="text-[13px] text-red-800/40 font-medium leading-relaxed italic pr-4">"Suspending this node will immediately revoke all campus-wide logistics tokens and marketplace clearance."</p>
                     <button className="w-full h-16 bg-red-600 text-white rounded-[22px] font-black text-[13px] uppercase tracking-widest shadow-md shadow-red-200 active:scale-95 transition-all">
                        Suspend Resident Node
                     </button>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AddMerchantModal 
        isOpen={isAddMerchantOpen} 
        onClose={() => setIsAddMerchantOpen(false)} 
      />
    </div>
  );
}
