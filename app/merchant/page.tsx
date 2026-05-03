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
  Settings, ArrowUpRight, Clock, ShieldCheck, HelpCircle, Wallet
} from "lucide-react";
import dynamic from "next/dynamic";

const HandshakeQR = dynamic(() => import("@/components/HandshakeQR"), { ssr: false });
import QRScanner from "@/components/merchant/QRScanner";
import HeartbeatLine from "@/components/shared/HeartbeatLine";
import ReceiptViewer from "@/components/merchant/ReceiptViewer";

type Tab = "hub" | "inventory" | "orders" | "analytics" | "settings";

const STATUS_MAP: Record<string, { label: string; dot: string; border: string; color: string; action?: boolean }> = {
  PENDING_VENDOR: { label: "New Order", dot: "bg-amber-400 animate-pulse", border: "border-l-amber-400", color: "text-amber-600", action: true },
  WAITING_FOR_RUNNER: { label: "Awaiting Runner", dot: "bg-blue-400 animate-pulse", border: "border-l-blue-400", color: "text-blue-600" },
  RUNNER_EN_ROUTE_TO_VENDOR: { label: "Runner Coming", dot: "bg-[#00C4B4] animate-pulse", border: "border-l-[#00C4B4]", color: "text-[#00C4B4]" },
  IN_TRANSIT: { label: "In Transit", dot: "bg-violet-400 animate-pulse", border: "border-l-violet-400", color: "text-violet-600" },
  DELIVERED: { label: "Delivered", dot: "bg-emerald-400", border: "border-l-emerald-400", color: "text-emerald-600" },
};

export default function MerchantTerminal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'inventory' | 'ledger'>('overview');
  const [merchant, setMerchant] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { router.push("/auth"); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      setMerchant(snap.exists() ? { ...snap.data(), uid: user.uid } : { full_name: user.displayName || "Merchant", email: user.email, uid: user.uid });
      
      const unsubItems = onSnapshot(query(collection(db, "items"), where("seller_id", "==", user.uid), where("status", "==", "active")), 
        (s) => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      const unsubOrders = onSnapshot(query(collection(db, "orders"), where("seller_id", "==", user.uid)), (s) => {
        setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setLoading(false);
      });

      return () => { unsubItems(); unsubOrders(); };
    });
    return () => unsub();
  }, [router]);

  const revenue = useMemo(() => orders.filter(o => ["DELIVERED"].includes(o.status)).reduce((s, o) => s + Number(o.price || 0), 0), [orders]);
  const activeOrders = useMemo(() => orders.filter(o => ["PENDING_VENDOR", "WAITING_FOR_RUNNER", "RUNNER_EN_ROUTE_TO_VENDOR", "IN_TRANSIT"].includes(o.status)), [orders]);

  const handleAcceptOrder = async (orderId: string) => { await updateDoc(doc(db, "orders", orderId), { status: "WAITING_FOR_RUNNER" }); };
  const handleDeclineOrder = async (orderId: string) => { 
    if (confirm("Decline this order? Funds will need to be manually refunded if already paid.")) {
      await updateDoc(doc(db, "orders", orderId), { status: "DECLINED" }); 
    }
  };
  const handleSignOut = async () => { await auth.signOut(); router.push("/auth"); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F9F9FB]"><div className="w-8 h-8 border-2 border-[#00C4B4] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <main className="min-h-screen bg-[#F9F9FB] flex font-sans text-[#1C1C1E] antialiased">
      
      {/* ── PERSISTENT SIDEBAR ── */}
      <nav className="w-80 bg-white border-r border-[#F2F2F7] flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 pb-12">
           <h1 className="text-[20px] font-bold tracking-tight">Kelab Bola UniKL</h1>
           <p className="text-[11px] font-medium text-[#8E8E93] uppercase tracking-widest mt-1">Institutional Vendor</p>
        </div>

        <div className="flex-1 px-4 space-y-1">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'orders', label: 'Order Desk', icon: ShoppingBag },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'ledger', label: 'Ledger', icon: Wallet },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-[#F9F9FB] text-[#1C1C1E] font-bold border-l-4 border-[#00C4B4]' 
                  : 'text-[#8E8E93] hover:text-[#1C1C1E]'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[15px]">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-8 border-t border-[#F2F2F7] space-y-6">
           <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold">Store Open</span>
              <button 
                onClick={() => setIsStoreOpen(!isStoreOpen)}
                className={`w-12 h-6 rounded-full transition-all relative p-1 ${isStoreOpen ? 'bg-[#00C4B4]' : 'bg-slate-200'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all ${isStoreOpen ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
           </div>
           <button onClick={handleSignOut} className="w-full py-4 text-left flex items-center gap-4 text-[#8E8E93] hover:text-red-500 transition-colors">
              <LogOut size={20} />
              <span className="text-[15px] font-medium">Sign Out</span>
           </button>
        </div>
      </nav>

      {/* ── WORKSPACE CANVAS ── */}
      <div className="flex-1 pl-80">
        <div className="max-w-6xl mx-auto p-12">
          
          {activeTab === 'overview' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-[28px] font-bold tracking-tight">Dashboard Overview</h2>
               
               <div className="grid grid-cols-3 gap-6">
                  {[
                    { count: activeOrders.length, label: 'Pending Acceptance', color: 'text-red-500', id: 'orders' },
                    { count: orders.filter(o => o.status === 'WAITING_FOR_RUNNER').length, label: 'Awaiting Runner', color: 'text-orange-500', id: 'orders' },
                    { count: items.filter(i => i.stock_count === 0).length, label: 'Out of Stock', color: 'text-[#8E8E93]', id: 'inventory' },
                  ].map((card, i) => (
                    <button key={i} onClick={() => setActiveTab(card.id as any)} className="bg-white border border-[#F2F2F7] rounded-2xl p-8 text-left space-y-2 hover:border-[#00C4B4] transition-all">
                       <p className={`text-[32px] font-bold ${card.color}`}>{card.count}</p>
                       <p className="text-[13px] font-bold text-[#1C1C1E]">{card.label}</p>
                    </button>
                  ))}
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white border border-[#F2F2F7] rounded-3xl p-10 space-y-2">
                     <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Today's Revenue</p>
                     <h4 className="text-[42px] font-bold text-[#1C1C1E] tracking-tighter">RM {revenue.toFixed(2)}</h4>
                  </div>
                  <div className="bg-white border border-[#F2F2F7] rounded-3xl p-10 space-y-2">
                     <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider">Items Sold</p>
                     <h4 className="text-[42px] font-bold text-[#1C1C1E] tracking-tighter">{orders.length}</h4>
                  </div>
               </div>

               <div className="bg-white border border-[#F2F2F7] rounded-[2.5rem] p-12 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-bold text-[#1C1C1E]">7-Day Revenue Trend</h3>
                    <button 
                      onClick={() => setIsScannerOpen(true)}
                      className="flex items-center gap-2 text-[13px] font-bold text-navy hover:text-[#00C4B4] transition-colors"
                    >
                      <Camera size={16} /> Registry Verify
                    </button>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2">
                    {[40, 70, 45, 90, 65, 80, 100, 50, 75, 95].map((h, i) => (
                      <div key={i} className="flex-1 bg-[#F9F9FB] rounded-t-lg transition-all" style={{ height: `${h}%` }} />
                    ))}
                  </div>
               </div>
            </div>
          )}

          {/* ... other tabs ... */}


          {activeTab === 'orders' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex items-center justify-between">
                  <h2 className="text-[28px] font-bold tracking-tight">Order Desk</h2>
                  <button className="text-[14px] font-bold text-[#00C4B4] uppercase tracking-widest">Bulk Accept</button>
               </div>
               
               <div className="flex gap-8 border-b border-[#F2F2F7]">
                  {['Pending', 'Preparing', 'In Transit', 'Completed'].map((tab, i) => (
                    <button key={i} className={`pb-4 text-[14px] font-bold ${i === 0 ? 'text-[#1C1C1E] border-b-2 border-[#00C4B4]' : 'text-[#8E8E93]'}`}>
                      {tab}
                    </button>
                  ))}
               </div>

               <div className="space-y-4">
                   {activeOrders.map(o => (
                    <div key={o.id} className="bg-white border border-[#F2F2F7] rounded-2xl p-8 flex items-center justify-between">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-[#F9F9FB] rounded-xl overflow-hidden flex items-center justify-center text-[#8E8E93]">
                             {o.image_url ? <img src={o.image_url} className="w-full h-full object-cover" /> : <Package size={24} />}
                          </div>
                          <div>
                             <div className="flex items-center gap-2">
                               <h4 className="text-[16px] font-bold text-[#1C1C1E]">{o.title}</h4>
                               <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                                 o.delivery_type === 'RUNNER' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                               }`}>
                                 {o.delivery_type === 'RUNNER' ? 'Runner' : 'Collect'}
                               </span>
                             </div>
                             <p className="text-[12px] font-medium text-[#8E8E93] mt-1">
                               From {o.buyer_name} {o.drop_off_location ? `• ${o.drop_off_location}` : ''}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-8">
                          <div className="text-right">
                             <p className="text-[18px] font-bold text-[#1C1C1E]">RM {Number(o.price).toFixed(2)}</p>
                             {o.receipt_url && (
                               <button 
                                 onClick={() => setViewingReceipt(o)}
                                 className="text-[11px] font-bold text-[#00C4B4] uppercase tracking-widest hover:underline"
                                >
                                 View Receipt
                               </button>
                             )}
                          </div>
                          <div className="flex flex-col gap-2">
                             <button 
                               onClick={() => handleAcceptOrder(o.id)} 
                               className="bg-[#1C1C1E] text-white px-8 py-3 rounded-xl font-bold text-[14px] hover:bg-black transition-all"
                             >
                               Accept
                             </button>
                             <button 
                               onClick={() => handleDeclineOrder(o.id)} 
                               className="text-[11px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors"
                             >
                               Decline
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex items-center justify-between">
                  <h2 className="text-[28px] font-bold tracking-tight">Inventory Registry</h2>
                  <button onClick={() => router.push('/post')} className="bg-[#1C1C1E] text-white px-8 py-3 rounded-xl font-bold text-[14px]">Add Asset</button>
               </div>
               <div className="bg-white border border-[#F2F2F7] rounded-3xl overflow-hidden">
                  <table className="w-full text-left">
                     <thead className="bg-[#F9F9FB] border-b border-[#F2F2F7]">
                        <tr>
                           <th className="px-8 py-6 text-[12px] font-bold text-[#8E8E93] uppercase">Product</th>
                           <th className="px-8 py-6 text-[12px] font-bold text-[#8E8E93] uppercase">Price</th>
                           <th className="px-8 py-6 text-[12px] font-bold text-[#8E8E93] uppercase">Stock</th>
                           <th className="px-8 py-6 text-[12px] font-bold text-[#8E8E93] uppercase">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-[#F2F2F7]">
                        {items.map(item => (
                          <tr key={item.id}>
                             <td className="px-8 py-6 font-bold">{item.title}</td>
                             <td className="px-8 py-6">RM {item.price}</td>
                             <td className="px-8 py-6">{item.stock_count || 0}</td>
                             <td className="px-8 py-6">
                                <div className="w-10 h-5 bg-[#00C4B4] rounded-full relative p-0.5">
                                   <div className="w-4 h-4 bg-white rounded-full absolute right-0.5" />
                                </div>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
               <h2 className="text-[28px] font-bold tracking-tight">Financial Ledger</h2>
               <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white border border-[#F2F2F7] rounded-3xl p-12 space-y-6">
                     <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Available Balance</p>
                     <h4 className="text-[48px] font-bold text-[#1C1C1E]">RM 1,240.50</h4>
                     <button className="w-full py-4 bg-[#00C4B4] text-white rounded-2xl font-bold uppercase tracking-widest text-[13px] shadow-lg shadow-[#00C4B4]/20">Withdraw Funds</button>
                  </div>
                  <div className="bg-white border border-[#F2F2F7] rounded-3xl p-12 space-y-6">
                     <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Pending Clearing</p>
                     <h4 className="text-[48px] font-bold text-[#1C1C1E]">RM 185.00</h4>
                     <p className="text-[13px] text-[#8E8E93]">Est. clearance: 2 days</p>
                  </div>
               </div>
            </div>
          )}

        </div>
      </div>

      <ReceiptViewer 
        isOpen={!!viewingReceipt}
        onClose={() => setViewingReceipt(null)}
        imageUrl={viewingReceipt?.receipt_url}
        orderId={viewingReceipt?.id || ""}
        amount={Number(viewingReceipt?.price || 0)}
        timestamp={viewingReceipt?.created_at}
      />
    </main>
  );
}
