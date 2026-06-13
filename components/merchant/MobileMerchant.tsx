import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Bell, User, LayoutGrid, ClipboardList, BarChart3, Bike, PackageCheck, Info, ChevronRight, CheckCircle2, Pencil, Trash2, ShieldAlert, Package, LogOut, ChevronLeft, MessageSquare, AlertCircle, Settings, X, Loader2, ShoppingBag, TrendingUp, Trophy } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { deleteDoc, doc, collection, query, onSnapshot, where, addDoc, serverTimestamp } from 'firebase/firestore';
import CreateListing from '@/components/CreateListing';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import IncomingOrderAlert from './IncomingOrderAlert';
import DisputeThread from './DisputeThread';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

export default function MobileMerchant({ 
  merchant, 
  revenue, 
  activeOrdersCount, 
  incomingOrders,
  urgentOrders, 
  preparingOrders,
  historyOrders,
  topItems,
  recentOrders,
  handleAcceptOrder, 
  handlePrepareOrder,
  handleMarkReady,
  handleMessageUser,
  handleCallRunner,
  handleConfirmDelivery,
  toggleItemStatus,
  onViewProof
}: any) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any>(null);
  const [view, setView] = React.useState<'terminal' | 'disputes' | 'insights' | 'account'>('terminal');

  const isClub = merchant?.role === 'CLUB' || merchant?.is_verified_merchant;
  const pipelineOrders = (recentOrders || []).filter((o: any) => 
    !["DELIVERED", "CANCELLED", "COMPLETED"].includes(o.status)
  );

  const pulseData = React.useMemo(() => {
    const pending = (recentOrders || []).filter((o: any) => o.status === 'PAID' || o.status === 'PENDING_VENDOR').length;
    const preparing = (recentOrders || []).filter((o: any) => o.status === 'PREPARING').length;
    const ready = (recentOrders || []).filter((o: any) => o.status === 'READY' || o.status === 'READY_FOR_PICKUP' || o.status === 'PENDING_RUNNER').length;
    return { pending, preparing, ready };
  }, [recentOrders]);

  const [unreadNotifications, setUnreadNotifications] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [selectedDispute, setSelectedDispute] = React.useState<any>(null);

  React.useEffect(() => {
    if (!merchant?.uid) return;
    const qNotifs = query(collection(db, "notifications"), where("user_id", "==", merchant.uid), where("is_read", "==", false));
    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => setUnreadNotifications(snapshot.docs.length));
    return () => unsubNotifs();
  }, [merchant?.uid]);

  const stats = React.useMemo(() => {
    const all = recentOrders || [];
    const delivered = all.filter((o: any) => o.status === 'DELIVERED' || o.status === 'COMPLETED');
    const totalRevenue = delivered.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const totalOrders = delivered.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRevenue = delivered.filter((o: any) => {
      const d = o.created_at?.toDate ? o.created_at.toDate() : new Date(o.created_at);
      return d >= startOfMonth;
    }).reduce((s: number, o: any) => s + (o.total || 0), 0);

    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const label = d.toLocaleDateString('en-MY', { weekday: 'short' });
      const rev = delivered.filter((o: any) => {
        const od = o.created_at?.toDate ? o.created_at.toDate() : new Date(o.created_at);
        return od.toDateString() === d.toDateString();
      }).reduce((s: number, o: any) => s + (o.total || 0), 0);
      return { day: label, revenue: rev };
    });

    const pendingCount = all.filter((o: any) => !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.status)).length;
    const cancelledCount = all.filter((o: any) => o.status === 'CANCELLED').length;
    const deliveredCount = totalOrders;

    const products: Record<string, { name: string, revenue: number, units: number }> = {};
    delivered.forEach((o: any) => {
      const title = o.title || 'Unknown Item';
      if (!products[title]) products[title] = { name: title, revenue: 0, units: 0 };
      products[title].revenue += (o.total || 0);
      products[title].units += 1;
    });
    const topProducts = Object.values(products).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue, totalOrders, avgOrder, monthRevenue,
      last7Days, deliveredCount, pendingCount, cancelledCount,
      topProducts
    };
  }, [recentOrders]);

  return (
    <div className="min-h-screen bg-white flex flex-col text-[#111827] md:hidden pb-[60px] font-sans antialiased">
      <header className="h-[56px] px-6 border-b-[0.5px] border-[#E5E7EB] sticky top-0 bg-white/80 backdrop-blur-xl z-50 flex items-center justify-between">
         <div className="flex items-center gap-3">
            {view !== 'terminal' && (
              <button onClick={() => setView('terminal')} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center active:scale-95 transition-all">
                <ChevronLeft size={20} />
              </button>
            )}
            <h1 className="text-[16px] font-medium text-[#111827] tracking-tight">
              {view === 'terminal' ? (merchant?.full_name || 'Terminal') : view === 'disputes' ? 'Disputes' : view === 'insights' ? 'Analytics' : 'Account'}
            </h1>
         </div>
         <div className="flex items-center gap-4">
           {view === 'terminal' && (
             <button onClick={() => router.push('/merchant/notifications')} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center relative active:scale-95 transition-all">
                <Bell size={18} />
                {unreadNotifications > 0 && <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-50 text-[9px] font-bold text-white border-2 border-white">{unreadNotifications}</span>}
             </button>
           )}
           <AvatarDropdown photoUrl={merchant?.photo_url} userName={merchant?.full_name || 'Merchant'} />
         </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === 'terminal' && (
            <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 space-y-8">
              <div className="flex gap-3 px-6">
                <div className="flex-1 bg-[#F9FAFB] rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-[#111827] tracking-tight">{pulseData.pending}</p>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mt-1 font-medium">Pending</p>
                </div>
                <div className="flex-1 bg-[#F9FAFB] rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-[#111827] tracking-tight">{pulseData.preparing}</p>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mt-1 font-medium">Preparing</p>
                </div>
                <div className="flex-1 bg-[#F9FAFB] rounded-2xl p-4 text-center">
                  <p className="text-3xl font-bold text-[#111827] tracking-tight">{pulseData.ready}</p>
                  <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mt-1 font-medium">Ready</p>
                </div>
              </div>

              <section className="px-6 space-y-6">
                <div>
                  <h3 className="text-[17px] font-semibold text-[#111827] tracking-tight">Orders</h3>
                  <p className="text-[13px] text-[#9CA3AF] mt-0.5">Manage incoming and active orders.</p>
                </div>
                <div className="flex bg-[#F3F4F6] rounded-full p-1 mb-4">
                  <button onClick={() => setActiveTab('ACTIVE')} className={`flex-1 text-[13px] py-2 transition-all ${activeTab === 'ACTIVE' ? 'bg-[#111827] text-white font-semibold rounded-full' : 'text-[#9CA3AF] font-medium'}`}>Active {pipelineOrders.length > 0 ? `(${pipelineOrders.length})` : ''}</button>
                  <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 text-[13px] py-2 transition-all ${activeTab === 'HISTORY' ? 'bg-[#111827] text-white font-semibold rounded-full' : 'text-[#9CA3AF] font-medium'}`}>History</button>
                </div>
                <div className="space-y-3">
                  {activeTab === 'ACTIVE' ? (
                    pipelineOrders.length === 0 ? <div className="py-12 text-center text-[#9CA3AF] text-sm">No active orders</div> :
                    pipelineOrders.map((o: any) => {
                      const isSelfCollect = o.delivery_method === 'SELF_COLLECT' || o.delivery_type === 'SELF_COLLECT';
                      const statusSteps = ['PENDING_VENDOR', 'PREPARING', 'READY', 'PICKED_UP', 'DELIVERED'];
                      const currentStep = statusSteps.indexOf(o.status);
                      const progress = currentStep >= 0 ? ((currentStep + 1) / statusSteps.length) * 100 : 0;
                      return (
                       <div key={o.id} className="bg-white rounded-2xl border border-[#F3F4F6] p-4 mb-3 shadow-sm">
                         <div className="flex justify-between items-start mb-3">
                           <div>
                             <p className="text-[15px] font-semibold text-[#111827]">{o.customer_name || 'Student'}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                               <span className={o.status === 'READY' || o.status === 'READY_FOR_PICKUP' ? 'text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-0.5' : 'text-[11px] font-medium bg-amber-50 text-amber-700 rounded-full px-2.5 py-0.5'}>{o.status.replace(/_/g, ' ')}</span>
                               {isSelfCollect && <span className="text-[10px] font-medium text-purple-600">Self collect</span>}
                             </div>
                           </div>
                           <div className="text-right"><p className="text-[15px] font-semibold text-[#111827]">RM {o.total?.toFixed(2)}</p></div>
                         </div>
                         <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-3">
                           <div className="h-full bg-slate-900 rounded-full transition-all" style={{ width: `${progress}%` }} />
                         </div>
                         {(o.status === 'PAID' || o.status === 'PENDING_VENDOR') && <button onClick={() => handlePrepareOrder(o.id, o.items || [])} className="w-full bg-[#111827] text-white text-[14px] font-medium rounded-full py-3 mt-3 active:scale-95 transition-transform">Prepare Order</button>}
                         {o.status === 'PREPARING' && <button onClick={() => handleMarkReady(o.id)} className="w-full bg-[#111827] text-white text-[14px] font-medium rounded-full py-3 mt-3 active:scale-95 transition-transform">Mark Ready</button>}
                         {o.status === 'READY' && !isSelfCollect && <button onClick={() => handleCallRunner(o.id)} className="w-full bg-blue-600 text-white text-[14px] font-medium rounded-full py-3 mt-3 active:scale-95 transition-transform">Call Runner</button>}
                         {o.status === 'READY' && isSelfCollect && <button onClick={() => handleConfirmDelivery(o.id)} className="w-full bg-emerald-600 text-white text-[14px] font-medium rounded-full py-3 mt-3 active:scale-95 transition-transform">Complete Order</button>}
                         {o.status === 'PICKED_UP' && <button onClick={() => handleConfirmDelivery(o.id)} disabled={o.handshake?.seller_confirmed} className="w-full bg-[#111827] text-white text-[14px] font-medium rounded-full py-3 mt-3 active:scale-95 transition-transform disabled:opacity-50">{o.handshake?.seller_confirmed ? 'Handoff Sent' : 'Confirm Handoff'}</button>}
                       </div>
                      );
                    })
                  ) : (
                    (historyOrders || []).map((o: any) => (
                      <div key={o.id} className="bg-white rounded-2xl border border-[#F3F4F6] p-4 mb-3 shadow-sm opacity-80 flex justify-between items-center">
                        <div><p className="text-[14px] font-medium text-[#111827]">{o.title}</p><p className="text-[11px] text-[#9CA3AF]">{o.status}</p></div>
                        <p className="text-[14px] font-semibold text-[#111827]">RM {o.total?.toFixed(2)}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="px-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div><h3 className="text-[17px] font-semibold text-[#111827] tracking-tight">Inventory</h3><p className="text-[13px] text-[#9CA3AF] mt-0.5">Your listings on the market.</p></div>
                  <button onClick={() => setIsCreateOpen(true)} className="w-10 h-10 rounded-full bg-[#111827] text-white flex items-center justify-center shadow-md active:scale-95 transition-all"><Plus size={20} /></button>
                </div>
                <div className="space-y-2">
                  {topItems?.map((item: any) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-[#F3F4F6] p-3 flex items-center gap-3 shadow-sm">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">{item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={20} /></div>}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#111827] truncate">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[12px] text-[#9CA3AF]">RM {item.price?.toFixed(2)}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${(item.stock_count ?? 0) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{item.stock_count ?? 0}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <button onClick={async (e) => { e.stopPropagation(); const { updateDoc, doc } = await import('firebase/firestore'); const newStock = Math.max(0, (item.stock_count ?? 0) - 1); await updateDoc(doc(db, 'items', item.id), { stock_count: newStock }); }} className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">-</button>
                          <button onClick={async (e) => { e.stopPropagation(); const { updateDoc, doc } = await import('firebase/firestore'); const newStock = (item.stock_count ?? 0) + 1; await updateDoc(doc(db, 'items', item.id), { stock_count: newStock }); }} className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+</button>
                        </div>
                      </div>
                      <button onClick={() => setEditingItem(item)} className="p-2 text-slate-300 hover:text-[#111827]"><Pencil size={16} /></button>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {view === 'insights' && (
            <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6">
              <div className="grid grid-cols-2 gap-3 px-4 mb-3">
                <div className="bg-[#F9FAFB] rounded-2xl p-4"><p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-medium mb-1">Total Revenue</p><p className="text-[26px] font-bold text-[#111827] tracking-tight">RM {stats.totalRevenue.toFixed(2)}</p></div>
                <div className="bg-[#F9FAFB] rounded-2xl p-4"><p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-medium mb-1">This Month</p><p className="text-[26px] font-bold text-[#111827] tracking-tight">RM {stats.monthRevenue.toFixed(2)}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-3 px-4 mb-4">
                <div className="bg-[#F9FAFB] rounded-2xl p-3 text-center"><p className="text-[22px] font-bold text-[#111827]">{stats.totalOrders}</p><p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">Orders</p></div>
                <div className="bg-[#F9FAFB] rounded-2xl p-3 text-center"><p className="text-[22px] font-bold text-[#111827]">RM {stats.avgOrder.toFixed(0)}</p><p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">Avg Order</p></div>
                <div className="bg-[#F9FAFB] rounded-2xl p-3 text-center"><p className="text-[22px] font-bold text-[#10B981]">{merchant?.trust_rating || '5.0'}</p><p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">Rating</p></div>
              </div>
              <div className="mx-4 mb-4 bg-white rounded-2xl border border-[#F3F4F6] p-4 shadow-sm">
                <p className="text-[15px] font-semibold text-[#111827] mb-3">Sales This Week</p>
                <ResponsiveContainer width="100%" height={130}>
                  <LineChart data={stats.last7Days}>
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false}/>
                    <Tooltip formatter={(v: any) => ['RM ' + Number(v).toFixed(2), 'Revenue']} contentStyle={{ borderRadius: '12px', border: '1px solid #F3F4F6', fontSize: '12px' }}/>
                    <Line type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mx-4 mb-4 bg-white rounded-2xl border border-[#F3F4F6] p-4 shadow-sm">
                <p className="text-[15px] font-semibold text-[#111827] mb-3">Order Status</p>
                <div className="flex items-center gap-4">
                  <PieChart width={140} height={140}>
                    <Pie data={[{name:'Delivered',value:stats.deliveredCount,fill:'#111827'},{name:'Pending',value:stats.pendingCount,fill:'#D1D5DB'},{name:'Cancelled',value:stats.cancelledCount || 0.1,fill:'#F3F4F6'}]} dataKey="value" innerRadius={44} outerRadius={64} strokeWidth={0}>
                      <Cell fill="#111827" /><Cell fill="#D1D5DB" /><Cell fill="#F3F4F6" />
                    </Pie>
                  </PieChart>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#111827]"/><span className="text-[13px] text-[#111827]">Delivered</span><span className="ml-auto text-[13px] font-semibold text-[#111827]">{stats.deliveredCount}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#D1D5DB]"/><span className="text-[13px] text-[#111827]">Pending</span><span className="ml-auto text-[13px] font-semibold text-[#111827]">{stats.pendingCount}</span></div>
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#F3F4F6] border border-gray-200"/><span className="text-[13px] text-[#111827]">Cancelled</span><span className="ml-auto text-[13px] font-semibold text-[#111827]">{stats.cancelledCount}</span></div>
                  </div>
                </div>
              </div>
              <div className="mx-4 mb-4 bg-white rounded-2xl border border-[#F3F4F6] p-4 shadow-sm">
                <p className="text-[15px] font-semibold text-[#111827] mb-3">Top Products</p>
                {stats.topProducts.slice(0,5).map((p,i) => (
                  <div key={i} className={"flex items-center py-2.5 " + (i < stats.topProducts.length - 1 ? "border-b border-[#F9FAFB]" : "") + (i === 0 ? " bg-amber-50 -mx-4 px-4 rounded-xl" : "")}>
                    <span className="text-[12px] text-[#9CA3AF] w-5">{i+1}</span>
                    {i === 0 && <span className="text-[14px] mr-1.5"></span>}
                    <span className="text-[14px] font-medium text-[#111827] flex-1 truncate">{p.name}</span>
                    <span className="text-[14px] font-semibold text-[#111827]">RM {p.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mx-4 mb-6 bg-white rounded-2xl border border-[#F3F4F6] p-4 shadow-sm">
                <p className="text-[15px] font-semibold text-[#111827] mb-3">Recent Sales</p>
                {(recentOrders || []).filter((o:any) => o.status === 'DELIVERED').slice(0,5).map((o: any,i: number) => (
                  <div key={i} className={"flex items-center gap-3 py-3 " + (i < 4 ? "border-b border-[#F9FAFB]" : "")}>
                    <div className="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center flex-shrink-0"><span className="text-[13px] font-semibold text-[#6B7280]">{(o.customer_name || 'S')[0].toUpperCase()}</span></div>
                    <div className="flex-1 min-w-0"><p className="text-[14px] font-medium text-[#111827] truncate">{o.title}</p><p className="text-[12px] text-[#9CA3AF]">{o.customer_name || 'Student'}</p></div>
                    <div className="text-right flex-shrink-0"><p className="text-[14px] font-semibold text-[#111827]">RM {Number(o.total || o.price || 0).toFixed(2)}</p><p className="text-[11px] text-[#9CA3AF]">{o.created_at?.toDate ? o.created_at.toDate().toLocaleDateString('en-MY', {day:'numeric',month:'short'}) : ''}</p></div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 px-6 space-y-6">
              <div>
                <h3 className="text-[17px] font-semibold text-[#111827] tracking-tight">Order Log</h3>
                <p className="text-[13px] text-[#9CA3AF] mt-0.5">Full order history.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 bg-[#F9FAFB] rounded-2xl p-4"><p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-medium">Total</p><p className="text-[22px] font-bold text-[#111827]">{(recentOrders || []).length}</p></div>
                <div className="flex-1 bg-[#F9FAFB] rounded-2xl p-4"><p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-medium">Delivered</p><p className="text-[22px] font-bold text-[#111827]">{(historyOrders || []).length}</p></div>
                <div className="flex-1 bg-[#F9FAFB] rounded-2xl p-4"><p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest font-medium">Pending</p><p className="text-[22px] font-bold text-[#111827]">{pipelineOrders.length}</p></div>
              </div>
              <div className="space-y-2">
                {(recentOrders || []).sort((a: any, b: any) => {
                  const ta = a.created_at?.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at || 0).getTime();
                  const tb = b.created_at?.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at || 0).getTime();
                  return tb - ta;
                }).map((o: any) => (
                  <div key={o.id} className="bg-white rounded-2xl border border-[#F3F4F6] p-4 shadow-sm flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[#111827] truncate">{o.title || 'Order'}</p>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                        {o.customer_name || 'Student'} · #{o.id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-[14px] font-semibold text-[#111827]">RM {Number(o.total || o.price || 0).toFixed(2)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                        o.status === 'DELIVERED' || o.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                        o.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                        o.status === 'READY' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}>{o.status.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'account' && (
            <motion.div key="account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 px-6 space-y-8">
              <div className="p-5 bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] flex items-center gap-4 shadow-sm">
                <AvatarDropdown photoUrl={merchant?.photo_url} userName={merchant?.full_name || 'Merchant'} />
                <div><p className="text-[16px] font-medium text-[#111827]">{merchant?.full_name || 'Merchant'}</p><p className="text-[13px] text-[#9CA3AF]">{merchant?.role === 'CLUB' ? 'Club Merchant' : 'Seller'}</p></div>
              </div>
              <button onClick={() => router.push('/me/edit')} className="w-full p-5 bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] flex items-center justify-between shadow-sm active:scale-98 transition-all"><div className="flex items-center gap-3"><Settings size={18} className="text-[#9CA3AF]" /><span className="text-[16px] font-medium text-[#111827]">Settings</span></div><ChevronRight size={16} className="text-[#9CA3AF]" /></button>
              <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full p-5 bg-white border-[0.5px] border-red-100 rounded-[12px] flex items-center justify-between shadow-sm active:scale-98 transition-all"><div className="flex items-center gap-3"><LogOut size={18} className="text-red-400" /><span className="text-[16px] font-medium text-red-500">Logout</span></div><ChevronRight size={16} className="text-red-300" /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t-[0.5px] border-[#E5E7EB] px-6 h-[60px] pb-safe">
        <div className="flex items-center justify-between h-full max-w-lg mx-auto">
            {[{id:'terminal',label:'Terminal',icon:LayoutGrid},{id:'logs',label:'Log',icon:ClipboardList},{id:'insights',label:'Stats',icon:BarChart3},{id:'account',label:'Account',icon:User}].filter(n => isClub || ['terminal','account'].includes(n.id)).map((nav: any) => {
              const active = view === nav.id;
              return (<button key={nav.id} onClick={() => setView(nav.id)} className="flex flex-col items-center justify-center gap-1 group"><nav.icon size={22} strokeWidth={active ? 2.5 : 2} className={active ? 'text-[#111827]' : 'text-[#9CA3AF]'} /><span className={`text-[10px] font-medium transition-all ${active ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>{nav.label}</span></button>);
            })}
        </div>
      </nav>

      <AnimatePresence>
         {(isCreateOpen || editingItem) && (
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-0 z-1000">
               <CreateListing key={editingItem?.id || 'create'} userId={merchant?.uid} role={merchant?.role} onClose={() => { setIsCreateOpen(false); setEditingItem(null); }} existingItem={editingItem} />
            </motion.div>
         )}
      </AnimatePresence>
      <AnimatePresence>{incomingOrders?.length > 0 && <IncomingOrderAlert key={incomingOrders[0].id} order={incomingOrders[0]} />}</AnimatePresence>
      <AnimatePresence>{selectedDispute && <DisputeThread dispute={selectedDispute} onClose={() => setSelectedDispute(null)} />}</AnimatePresence>
    </div>
  );
}
