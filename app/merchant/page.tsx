"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  BarChart2, Package, ShoppingBag, User, Plus, Camera, 
  ChevronRight, Truck, CheckCircle2, Trash2, 
  Home, LogOut, RefreshCw, X, Zap, LayoutDashboard, 
  Settings, ArrowUpRight, Clock, ShieldCheck, HelpCircle
} from "lucide-react";
import dynamic from "next/dynamic";

const HandshakeQR = dynamic(() => import("@/components/HandshakeQR"), { ssr: false });
import QRScanner from "@/components/merchant/QRScanner";

type Tab = "hub" | "inventory" | "orders" | "settings";

const STATUS_MAP: Record<string, { label: string; dot: string; border: string; color: string }> = {
  PENDING: { label: "Pickup required", dot: "bg-amber-400 animate-pulse", border: "border-l-amber-400", color: "text-amber-600" },
  AWAITING_RUNNER: { label: "Dispatching", dot: "bg-blue-400 animate-pulse", border: "border-l-blue-400", color: "text-blue-600" },
  ON_THE_WAY: { label: "Transit", dot: "bg-violet-400 animate-pulse", border: "border-l-violet-400", color: "text-violet-600" },
  COLLECTED: { label: "Fulfilled", dot: "bg-emerald-400", border: "border-l-emerald-400", color: "text-emerald-600" },
  COMPLETE: { label: "Fulfilled", dot: "bg-emerald-400", border: "border-l-emerald-400", color: "text-emerald-600" },
};

export default function MerchantTerminal() {
  const [activeTab, setActiveTab] = useState<Tab>("hub");
  const [merchant, setMerchant] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRFor, setShowQRFor] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push("/auth"); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        // Handle case where user profile doesn't exist but auth does
        setMerchant({ full_name: user.displayName || "Merchant", email: user.email, uid: user.uid });
      } else {
        setMerchant({ ...snap.data(), uid: user.uid });
      }
      
      const qI = query(collection(db, "items"), where("seller_id", "==", user.uid), where("status", "==", "active"));
      const unsubItems = onSnapshot(qI, (s) => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const qO = query(collection(db, "transactions"), where("seller_id", "==", user.uid));
      const unsubOrders = onSnapshot(qO, (s) => {
        const docs = s.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setOrders(docs);
        setLoading(false);
      });

      return () => { unsubItems(); unsubOrders(); };
    });
    return () => unsub();
  }, [router]);

  const revenue = useMemo(() => orders.filter(o => ["COLLECTED", "COMPLETE"].includes(o.status)).reduce((s, o) => s + Number(o.price || 0), 0), [orders]);
  const activeOrders = useMemo(() => orders.filter(o => ["PENDING", "AWAITING_RUNNER", "ON_THE_WAY"].includes(o.status)), [orders]);

  const restock = async (id: string, cur: number) => { await updateDoc(doc(db, "items", id), { stock_count: cur + 10 }); };
  const archive = async (id: string) => { if (confirm("Archive this asset?")) await updateDoc(doc(db, "items", id), { status: "archived" }); };

  const handleScan = async (txId: string) => {
    setIsScannerOpen(false);
    const o = orders.find(x => x.id === txId && x.status === "PENDING");
    if (!o) return;
    await updateDoc(doc(db, "transactions", txId), { status: "COLLECTED", completed_at: new Date().toISOString() });
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/auth";
    } catch (e) {
      window.location.href = "/auth";
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]"><div className="w-10 h-10 border-4 border-navy/10 border-t-navy rounded-full animate-spin" /></div>;

  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-32 font-sans antialiased text-navy">
      
      {/* ── Fixed Josh Header ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-10 pb-4 bg-[#FDFDFD]/90 backdrop-blur-xl border-b border-slate-50">
        <div className="max-w-[480px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center text-white shadow-lg shadow-navy/20">
              <Zap size={20} />
            </div>
            <h1 className="text-[18px] font-black tracking-tight uppercase tracking-[0.1em]">Terminal</h1>
          </div>
          <div className="flex items-center gap-2">
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={() => router.push("/home")}
              className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"
            >
              <Home size={18} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }} 
              onClick={handleSignOut}
              className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200"
            >
              <LogOut size={20} strokeWidth={3} />
            </motion.button>
          </div>
        </div>
      </nav>

      <div className="max-w-[480px] mx-auto px-6 pt-28">
        
        {/* Profile Card Summary */}
        <header className="mb-10 p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-50">
            <img src={merchant?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${merchant?.full_name}`} className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-[18px] font-black text-navy">{merchant?.full_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Verified Merchant</span>
            </div>
          </div>
        </header>

        {/* Tab Nav */}
        <nav className="mb-10 p-1.5 bg-slate-50 rounded-[2rem] flex items-center gap-1">
          {(['hub', 'inventory', 'orders', 'settings'] as Tab[]).map((t) => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === t ? 'bg-white text-navy shadow-sm' : 'text-slate-400'
              }`}
            >
              {t === 'settings' ? 'Me' : t}
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          {/* Hub View */}
          {activeTab === "hub" && (
            <motion.div key="hub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 bg-navy rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-navy/20">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Yield</p>
                  <h4 className="text-[42px] font-black tabular-nums tracking-tighter">RM {revenue.toFixed(0)}</h4>
                  <div className="mt-8 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white/30">Sync status: Active</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Active</p>
                  <h4 className="text-[28px] font-black text-navy">{activeOrders.length}</h4>
                </div>
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Assets</p>
                  <h4 className="text-[28px] font-black text-navy">{items.length}</h4>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.button 
                  whileTap={{ scale: 0.97, y: 2 }} 
                  onClick={() => router.push("/post")} 
                  className="h-16 bg-navy text-white rounded-2xl font-black text-[13px] flex items-center justify-center gap-2 shadow-xl shadow-navy/20"
                >
                  <Plus size={18} /> New Item
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.97, y: 2 }} 
                  onClick={() => setIsScannerOpen(true)} 
                  className="h-16 bg-white border border-slate-100 text-navy rounded-2xl font-black text-[13px] flex items-center justify-center gap-2 shadow-sm"
                >
                  <Camera size={18} /> Verify QR
                </motion.button>
              </div>

              <div className="pt-4 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Active Pulse</p>
                {activeOrders.slice(0, 3).map(o => (
                  <div key={o.id} className="bg-white border border-slate-100 rounded-3xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-50 shrink-0 overflow-hidden">
                      {o.image_url ? <img src={o.image_url} className="w-full h-full object-cover" /> : <Package size={20} />}
                    </div>
                    <div className="flex-1 truncate">
                      <p className="text-[14px] font-bold text-navy truncate">{o.title}</p>
                      <p className={`text-[10px] font-black uppercase mt-0.5 ${STATUS_MAP[o.status]?.color}`}>{STATUS_MAP[o.status]?.label}</p>
                    </div>
                    <p className="text-[14px] font-black text-navy">RM {Number(o.price || 0).toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Inventory View */}
          {activeTab === "inventory" && (
            <motion.div key="inventory" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{items.length} Registered Assets</p>
                <button onClick={() => router.push("/post")} className="text-[11px] font-bold text-accent">+ Add New</button>
              </div>
              {items.map(item => (
                <div key={item.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 flex items-center gap-5 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-50 overflow-hidden shrink-0">
                    {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <Package size={24} className="text-slate-300" />}
                  </div>
                  <div className="flex-1 truncate">
                    <h4 className="text-[14px] font-bold text-navy truncate">{item.title}</h4>
                    <p className="text-[18px] font-black text-navy mt-1">RM {Number(item.price).toFixed(0)}</p>
                    <p className={`text-[9px] font-black uppercase mt-1 ${Number(item.stock_count) <= 3 ? 'text-red-500' : 'text-emerald-500'}`}>{item.stock_count || "Tracked"} in stock</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => restock(item.id, item.stock_count ?? 0)} className="p-2.5 rounded-xl bg-slate-50 text-navy"><RefreshCw size={16} /></button>
                    <button onClick={() => archive(item.id)} className="p-2.5 rounded-xl bg-red-50 text-red-400"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Orders View */}
          {activeTab === "orders" && (
            <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{orders.length} Handshakes</p>
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live Sync</span></div>
              </div>
              {orders.map(o => (
                <div key={o.id} className={`bg-white border border-slate-100 rounded-[2rem] p-6 space-y-4 shadow-sm border-l-4 ${STATUS_MAP[o.status]?.border}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-50">
                        {o.image_url ? <img src={o.image_url} className="w-full h-full object-cover" /> : <Package size={18} className="text-slate-300" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-navy truncate">{o.title}</p>
                        <p className="text-[11px] font-medium text-slate-300 mt-0.5">#{o.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <p className="text-[18px] font-black text-navy tabular-nums shrink-0">RM {Number(o.price || 0).toFixed(0)}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${STATUS_MAP[o.status]?.dot}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${STATUS_MAP[o.status]?.color}`}>{STATUS_MAP[o.status]?.label}</span>
                    </div>
                    {o.status === "PENDING" && <button onClick={() => setShowQRFor(showQRFor === o.id ? null : o.id)} className="text-[11px] font-bold text-accent">{showQRFor === o.id ? 'Close' : 'Show QR'}</button>}
                  </div>
                  {showQRFor === o.id && <div className="pt-4 flex justify-center border-t border-slate-50"><HandshakeQR txId={o.id} /></div>}
                </div>
              ))}
            </motion.div>
          )}

          {/* Settings / Me View */}
          {activeTab === "settings" && (
            <motion.div key="me" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 border border-slate-100 p-1 mb-6">
                    <img src={merchant?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${merchant?.full_name}`} className="w-full h-full object-cover rounded-[2.2rem]" />
                  </div>
                  <h3 className="text-[22px] font-black tracking-tight">{merchant?.full_name}</h3>
                  <p className="text-slate-400 text-[13px] font-medium mt-1">{merchant?.email}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 py-8 border-t border-b border-slate-50">
                  <div className="text-center"><p className="text-[18px] font-black text-navy">{items.length}</p><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Assets</p></div>
                  <div className="text-center"><p className="text-[18px] font-black text-navy">{orders.length}</p><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Orders</p></div>
                  <div className="text-center"><p className="text-[18px] font-black text-navy">4.9</p><p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Rating</p></div>
                </div>

                <div className="space-y-3">
                  <button onClick={() => router.push("/home")} className="w-full p-6 bg-slate-50 rounded-3xl flex items-center justify-between font-bold text-navy active:scale-95 transition-all">
                    <div className="flex items-center gap-4"><LayoutDashboard size={20} /> Student Dashboard</div>
                    <ChevronRight size={18} className="text-slate-200" />
                  </button>
                  <button onClick={handleSignOut} className="w-full p-6 bg-red-500 text-white rounded-3xl flex items-center justify-between font-bold active:scale-95 transition-all shadow-lg shadow-red-200">
                    <div className="flex items-center gap-4"><LogOut size={20} /> Sign Out Terminal</div>
                    <ChevronRight size={18} className="text-white/50" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Floating Scanner */}
      {activeTab !== 'settings' && (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center pointer-events-none z-[100]">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsScannerOpen(true)}
            className="w-16 h-16 bg-navy text-white rounded-full shadow-2xl flex items-center justify-center pointer-events-auto border-4 border-white"
          >
            <Camera size={24} />
          </motion.button>
        </div>
      )}

      {isScannerOpen && <QRScanner onScanSuccess={handleScan} onClose={() => setIsScannerOpen(false)} />}
    </main>
  );
}
