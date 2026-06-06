import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Bell, User, LayoutGrid, ClipboardList, BarChart3, Bike, PackageCheck, Info, ChevronRight, CheckCircle2, Pencil, Trash2, ShieldAlert, Package, LogOut, ChevronLeft, MessageSquare, AlertCircle, Settings, X, Loader2 } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { deleteDoc, doc, collection, query, onSnapshot, where, addDoc, serverTimestamp } from 'firebase/firestore';
import CreateListing from '@/components/CreateListing';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import SwipeToReady from './SwipeToReady';
import { motion, AnimatePresence } from 'framer-motion';
import IncomingOrderAlert from './IncomingOrderAlert';
import DisputeThread from './DisputeThread';
import PriceHealthIndicator from '@/components/marketplace/PriceHealthIndicator';

/**
 * Pulse Mobile Merchant Terminal
 */
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
  const pendingList = [...(urgentOrders || []), ...(preparingOrders || [])];
  const historyList = historyOrders || [];
  const pulseData = React.useMemo(() => {
    const pending = (recentOrders || []).filter((o: any) => o.status === 'PENDING_VENDOR').length;
    const preparing = (recentOrders || []).filter((o: any) => o.status === 'PREPARING' || o.status === 'READY_FOR_PICKUP').length;
    const delivering = (recentOrders || []).filter((o: any) => o.status === 'PENDING_RUNNER').length;
    const total = pending + preparing + delivering;
    return { pending, preparing, delivering, total };
  }, [recentOrders]);

  // ── DISPUTES STATE ──
  const [activeTab, setActiveTab] = React.useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [selectedDayIndex, setSelectedDayIndex] = React.useState<number | null>(null);
  const [disputes, setDisputes] = React.useState<any[]>([]);
  const [disputesLoading, setDisputesLoading] = React.useState(true);
  const [selectedDispute, setSelectedDispute] = React.useState<any>(null);
  const [disputesTab, setDisputesTab] = React.useState<'PENDING' | 'RESOLVED'>('PENDING');
  const [seeding, setSeeding] = React.useState(false);

  const seedDispute = async () => {
    if (!merchant?.uid || seeding) return;
    setSeeding(true);
    try {
      const sampleOrders = recentOrders?.filter((o: any) => o.status === 'COMPLETED' || o.status === 'DELIVERED') || [];
      const refOrder = sampleOrders[0];
      await addDoc(collection(db, 'disputes'), {
        order_id: refOrder?.id || 'test-order',
        buyer_id: refOrder?.buyer_id || 'test-buyer',
        seller_id: merchant.uid,
        reporter_name: 'Aiman',
        order_code: refOrder?.id?.slice(-4).toUpperCase() || 'TEST',
        reason: 'Item never delivered',
        narrative: 'I went to the meetup spot but nobody was there. I waited for 15 minutes and the seller never showed up.',
        status: 'AWAITING_ADMIN',
        created_at: serverTimestamp(),
      });
    } catch (e) {
      console.error('Seed failed', e);
    } finally {
      setSeeding(false);
    }
  };

  React.useEffect(() => {
    if (view !== 'disputes' || !isClub || !merchant?.uid) return;
    const q = query(collection(db, 'disputes'), where('seller_id', '==', merchant.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => {
        const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(0);
        const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setDisputes(data);
      setDisputesLoading(false);
    });
    return () => unsub();
  }, [view, isClub, merchant?.uid]);

  const pendingDisputes = disputes.filter((d: any) => d.status !== 'RESOLVED' && d.status !== 'SETTLED');
  const resolvedDisputes = disputes.filter((d: any) => d.status === 'RESOLVED' || d.status === 'SETTLED');
  const currentDisputes = disputesTab === 'PENDING' ? pendingDisputes : resolvedDisputes;

  const viewLabels: Record<string, string> = {
    terminal: 'Manage your shop and fulfill orders.',
    disputes: 'Track and resolve order disputes.',
    insights: 'Performance summary for your shop.',
    account: 'Your profile and account settings.'
  };

  return (
    <div className="min-h-screen bg-white flex flex-col text-slate-900 selection:bg-blue-100 md:hidden pb-32 font-sans antialiased">
      
      {/* ── HEADER ── */}
      <header className="px-8 py-8 border-b-[0.5px] border-slate-50 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <div className="flex items-center justify-between">
           <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                {view === 'terminal' && (
                  <>
                    <h1 className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">{merchant?.full_name || 'Terminal'}</h1>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                      isClub ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                    }`}>
                      {isClub ? 'CLUB' : 'SELLER'}
                    </span>
                  </>
                )}
                {view === 'disputes' && <h1 className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">Disputes</h1>}
                {view === 'insights' && <h1 className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">Analytics</h1>}
                {view === 'account' && <h1 className="text-[17px] font-bold text-slate-900 tracking-tight leading-none">Account</h1>}
              </div>
              <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed">{viewLabels[view]}</p>
           </div>
           <div className="flex items-center gap-4">
             {view !== 'terminal' && (
               <button onClick={() => setView('terminal')} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] hover:text-slate-900 border border-slate-50">
                 <ChevronLeft size={18} />
               </button>
             )}
             {view === 'terminal' && (
               <>
                 <button className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] hover:text-slate-900 relative border border-slate-50">
                    <Bell size={18} />
                    {urgentOrders?.length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-slate-900 rounded-full border-2 border-white"></span>}
                 </button>
                 <AvatarDropdown 
                    photoUrl={merchant?.photo_url} 
                    userName={merchant?.full_name || 'Merchant'} 
                 />
               </>
             )}
           </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ════════════════ TERMINAL VIEW ════════════════ */}
          {view === 'terminal' && (
            <motion.div
              key="terminal"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12 py-10 px-8"
            >
              {/* Today */}
              {pulseData.total > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Pending', count: pulseData.pending },
                    { label: 'Preparing', count: pulseData.preparing },
                    { label: 'Delivering', count: pulseData.delivering }
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                      <p className="text-[20px] font-bold text-slate-900">{s.count}</p>
                      <p className="text-[9px] font-bold text-[#94a3b8] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              <section className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="space-y-1">
                      <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Orders</h3>
                      <p className="text-[11px] font-medium text-[#94a3b8]">Manage incoming and active orders.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    {(['ACTIVE', 'HISTORY'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                          activeTab === tab 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-[#94a3b8] opacity-50 hover:opacity-100'
                        }`}
                      >
                        {tab}
                        {tab === 'ACTIVE' && pendingList.length > 0 && ` (${pendingList.length})`}
                      </button>
                    ))}
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {activeTab === 'ACTIVE' && (
                      pendingList.length === 0 ? (
                        <div className="py-16 px-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#94a3b8] mb-4 shadow-sm border border-slate-100">
                            <PackageCheck size={24} strokeWidth={1.5} />
                          </div>
                          <h3 className="text-[14px] font-bold text-slate-900 tracking-tight mb-1">No active orders</h3>
                          <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed max-w-[220px]">
                            New orders from students will appear here.
                          </p>
                        </div>
                      ) : (
                        pendingList.map((o: any) => (
                          <motion.div key={o.id} whileTap={{ scale: 0.98 }} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-[#94a3b8]">
                                  <ClipboardList size={16} />
                                </div>
                                <div>
                                  <p className="text-[14px] font-bold text-slate-900 tracking-tight">{o.customer_name || 'Student'}</p>
                                  <p className="text-[10px] font-medium text-[#94a3b8]">Order #{o.id.slice(-4).toUpperCase()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[14px] font-bold text-slate-900">RM {o.total?.toFixed(2)}</p>
                                <p className="text-[9px] font-bold text-slate-900 uppercase tracking-wider">{o.status.replace(/_/g, ' ')}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-1 border-t border-slate-50">
                              {o.status === 'PENDING_VENDOR' ? (
                                <button onClick={() => handleAcceptOrder(o.id)} className="flex-1 h-11 bg-slate-900 text-white rounded-xl text-[11px] font-bold active:scale-95 transition-all shadow-sm shadow-slate-900/10">
                                  Accept Order
                                </button>
                              ) : o.status === 'PREPARING' ? (
                                <div className="flex-1"><SwipeToReady orderId={o.id} /></div>
                              ) : (
                                <div className="flex-1 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                  <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                    <Bike size={14} /> Waiting for runner
                                  </p>
                                </div>
                              )}
                              <button className="w-11 h-11 rounded-xl bg-slate-50 text-[#94a3b8] flex items-center justify-center border border-slate-100">
                                <Info size={16} />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )
                    )}
                    {activeTab === 'HISTORY' && (
                      historyList.length === 0 ? (
                        <div className="py-16 px-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#94a3b8] mb-4 shadow-sm border border-slate-100">
                            <ClipboardList size={24} strokeWidth={1.5} />
                          </div>
                          <h3 className="text-[14px] font-bold text-slate-900 tracking-tight mb-1">No past orders</h3>
                          <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed max-w-[220px]">
                            Completed and cancelled orders will show up here.
                          </p>
                        </div>
                      ) : (
                        historyList.map((o: any) => (
                          <div key={o.id} className="p-6 bg-white border border-slate-50 rounded-2xl shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${o.status === 'CANCELLED' ? 'bg-red-50 text-red-400' : ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(o.status) ? 'bg-blue-50 text-slate-900' : 'bg-emerald-50 text-emerald-500'}`}>
                                  {o.status === 'CANCELLED' ? <Trash2 size={18} /> : ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(o.status) ? <Bike size={18} /> : <CheckCircle2 size={18} />}
                                </div>
                                <div>
                                  <p className="text-[14px] font-bold text-slate-900">{o.customer_name || 'Student'}</p>
                                  <p className="text-[10px] font-medium text-[#94a3b8]">Order #{o.id.slice(-4).toUpperCase()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[14px] font-bold text-slate-900">RM {o.total?.toFixed(2)}</p>
                                <p className={`text-[9px] font-bold ${o.status === 'CANCELLED' ? 'text-red-500' : ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(o.status) ? 'text-slate-900' : 'text-emerald-500'}`}>
                                  {o.status.replace(/_/g, ' ')}
                                </p>
                              </div>
                            </div>
                            {['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(o.status) && (
                              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 flex items-center justify-between">
                                <p className="text-[10px] font-bold text-[#94a3b8] flex items-center gap-2">
                                  <User size={12} /> With {o.runner_name || 'Runner'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-900 truncate ml-4">{o.drop_off_location || 'Campus'}</p>
                              </div>
                            )}
                          </div>
                        ))
                      )
                    )}
                  </motion.div>
                </AnimatePresence>
              </section>

              {isClub && topItems?.some((i: any) => (i.stock_count ?? 99) <= 5) && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <ShieldAlert size={14} className="text-slate-400" />
                    <p className="text-[10px] font-semibold text-slate-500 leading-none">Low Stock</p>
                  </div>
                  <div className="bg-white border border-slate-50 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-50">
                    {topItems.filter((i: any) => (i.stock_count ?? 99) <= 5).map((item: any) => (
                      <div key={item.id} className="p-6 flex items-center justify-between bg-white active:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-100">
                            <Package size={18} />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-slate-900 truncate max-w-[120px]">{item.title}</p>
                            <button onClick={() => setEditingItem(item)} className="mt-2 h-8 px-4 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-all shadow-sm shadow-slate-900/10 active:scale-95">
                              Restock Item
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[14px] font-semibold leading-none ${item.stock_count <= 0 ? 'text-red-500' : 'text-slate-500'}`}>
                            {item.stock_count <= 0 ? 'EMPTY' : item.stock_count}
                          </p>
                          <p className="text-[9px] font-semibold text-slate-300 mt-1">left</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {isClub && (
                <section className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <div className="space-y-1">
                      <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Inventory</h3>
                      <p className="text-[11px] font-medium text-[#94a3b8]">Items listed on the marketplace.</p>
                    </div>
                    <button onClick={() => setIsCreateOpen(true)} className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/10">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {topItems?.map((item: any) => (
                      <div key={item.id} className="p-5 bg-slate-50/50 border border-slate-50 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 overflow-hidden">
                            {item.image_url ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><LayoutGrid size={20} /></div>}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-slate-900 tracking-tight">{item.title}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[11px] font-medium text-[#94a3b8]">RM {item.price?.toFixed(2)}</p>
                              <PriceHealthIndicator price={item.price} category={item.category} subcategory={item.subcategory} />
                              <span className="w-1 h-1 bg-slate-200 rounded-full" />
                              <p className={`text-[11px] font-bold uppercase tracking-tight ${(item.stock_count ?? 0) === 0 ? 'text-red-500' : (item.stock_count ?? 0) <= 5 ? 'text-slate-500' : 'text-[#94a3b8]'}`}>
                                {item.stock_count ?? 0} in stock
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingItem(item)} title="Edit" className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                            <Pencil size={14} />
                          </button>
                          <button title="Delete" onClick={async () => { if (!confirm('Delete this listing?')) return; try { await deleteDoc(doc(db, 'items', item.id)); } catch(e) { alert('Failed.'); } }} className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {/* ════════════════ LOG VIEW ════════════════ */}
          {view === 'disputes' && (
            <motion.div
              key="disputes"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="py-10 px-8 space-y-8"
            >
              {(() => {
                const toRespond = disputes.filter((d: any) => d.status === 'AWAITING_ADMIN');
                const underReview = disputes.filter((d: any) => d.status === 'MERCHANT_RESPONDED');
                const resolvedCount = disputes.filter((d: any) => d.status === 'RESOLVED' || d.status === 'SETTLED').length;

                return (
                  <>
                    {/* Seed button */}
                    {disputes.length === 0 && !disputesLoading && (
                      <button
                        onClick={seedDispute}
                        disabled={seeding}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 disabled:opacity-30"
                      >
                        {seeding ? <Loader2 size={14} className="animate-spin" /> : <AlertCircle size={14} />}
                        Create Test Dispute
                      </button>
                    )}

                    {/* Dispute Summary */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'To Respond', count: toRespond.length, sub: 'needs your reply', color: 'text-red-500' },
                        { label: 'Under Review', count: underReview.length, sub: 'waiting on admin', color: 'text-blue-600' },
                        { label: 'Resolved', count: resolvedCount, sub: 'cases closed', color: 'text-emerald-600' }
                      ].map(s => (
                        <div key={s.label} className="p-4 bg-white border border-slate-100 rounded-2xl space-y-1.5">
                          <p className="text-[9px] font-bold text-[#94a3b8]">{s.label}</p>
                          <p className={`text-[22px] font-bold tracking-tight leading-none ${s.color}`}>{s.count}</p>
                          <p className="text-[8px] font-medium text-[#94a3b8]">{s.sub}</p>
                        </div>
                      ))}
                    </div>

                    {/* Disputes */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-6 border-b border-slate-50">
                        {['PENDING', 'RESOLVED'].map(tab => (
                          <button key={tab} onClick={() => setDisputesTab(tab as any)} className={`pb-3 text-[10px] font-bold transition-all relative ${disputesTab === tab ? 'text-slate-900' : 'text-[#94a3b8] hover:text-slate-900'}`}>
                            {tab === 'PENDING' ? `Active (${pendingDisputes.length})` : `Resolved (${resolvedDisputes.length})`}
                            {disputesTab === tab && <motion.div layoutId="disputesTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3">
                        {currentDisputes.length === 0 ? (
                          <div className="py-16 px-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
                            <CheckCircle2 size={24} className="text-[#94a3b8] mb-3" />
                            <h3 className="text-[14px] font-bold text-slate-900 tracking-tight mb-1">No {disputesTab === 'PENDING' ? 'active' : 'resolved'} disputes</h3>
                            <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed max-w-[200px]">
                              {disputesTab === 'PENDING' ? 'Any issues raised by students will show up here.' : 'Resolved disputes will be archived here.'}
                            </p>
                          </div>
                        ) : (
                          currentDisputes.map((dispute: any, idx: number) => (
                            <motion.div
                              key={dispute.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.04 }}
                              onClick={() => setSelectedDispute(dispute)}
                              className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all cursor-pointer group space-y-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    dispute.status === 'MERCHANT_RESPONDED' ? 'bg-blue-50 text-blue-600' : dispute.status === 'RESOLVED' || dispute.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                                  }`}>
                                    {dispute.status === 'RESOLVED' || dispute.status === 'SETTLED' ? <CheckCircle2 size={16} /> : dispute.status === 'MERCHANT_RESPONDED' ? <MessageSquare size={16} /> : <AlertCircle size={16} />}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[13px] font-bold text-slate-900 truncate">{dispute.reporter_name}</p>
                                      <span className="text-[8px] font-bold text-[#94a3b8] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">#{dispute.order_code}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2 mt-0.5">{dispute.reason}: {dispute.narrative}</p>
                                  </div>
                                </div>
                                <ChevronRight size={14} className="text-slate-200 group-hover:text-slate-500 shrink-0 mt-1.5" />
                              </div>
                              <div className="flex items-center justify-between pt-2.5 border-t border-slate-50">
                                <span className="text-[9px] font-medium text-[#94a3b8]">
                                  {dispute.created_at?.toDate ? dispute.created_at.toDate().toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : 'Pending'}
                                </span>
                                <span className={`text-[9px] font-bold ${
                                  dispute.status === 'RESOLVED' || dispute.status === 'SETTLED' ? 'text-emerald-600' : dispute.status === 'MERCHANT_RESPONDED' ? 'text-blue-600' : 'text-red-500'
                                }`}>
                                  {dispute.status === 'RESOLVED' || dispute.status === 'SETTLED' ? 'Resolved' : dispute.status === 'MERCHANT_RESPONDED' ? 'Under Review' : 'Open'}
                                </span>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* ════════════════ INSIGHTS VIEW ════════════════ */}
          {view === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="py-10 px-8 space-y-8"
            >
              {(() => {
                const statuses = ['COMPLETED', 'DELIVERED', 'READY_FOR_PICKUP', 'PREPARING', 'PENDING_VENDOR', 'PENDING_RUNNER', 'CANCELLED'];
                const statusColors: Record<string, string> = {
                  COMPLETED: 'bg-emerald-500', DELIVERED: 'bg-emerald-400',
                  READY_FOR_PICKUP: 'bg-blue-500', PREPARING: 'bg-amber-400',
                  PENDING_VENDOR: 'bg-amber-500', PENDING_RUNNER: 'bg-slate-400',
                  CANCELLED: 'bg-red-400'
                };
                const statusLabels: Record<string, string> = {
                  COMPLETED: 'Completed', DELIVERED: 'Delivered',
                  READY_FOR_PICKUP: 'Ready', PREPARING: 'Preparing',
                  PENDING_VENDOR: 'Pending', PENDING_RUNNER: 'Runner',
                  CANCELLED: 'Cancelled'
                };
                const counts = statuses.map(s => ({ status: s, count: recentOrders?.filter((o: any) => o.status === s).length || 0 }));
                const totalOrders = counts.reduce((s, c) => s + c.count, 0);
                const activeOrders = ['PENDING_VENDOR', 'PREPARING', 'READY_FOR_PICKUP', 'PENDING_RUNNER'].map(s => counts.find(c => c.status === s)?.count || 0).reduce((a, b) => a + b, 0);
                const completedOrders = ['COMPLETED', 'DELIVERED'].map(s => counts.find(c => c.status === s)?.count || 0).reduce((a, b) => a + b, 0);

                const now = new Date();
                const dayOfWeek = now.getDay();
                const monday = new Date(now);
                monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                monday.setHours(0,0,0,0);
                const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const pastelColors = ['bg-rose-300', 'bg-orange-300', 'bg-amber-300', 'bg-lime-300', 'bg-emerald-300', 'bg-sky-300', 'bg-violet-300'];
                const weekDays = dayNames.map((_, i) => {
                  const d = new Date(monday);
                  d.setDate(monday.getDate() + i);
                  return d;
                });
                const weekCounts = weekDays.map(d => {
                  const next = new Date(d);
                  next.setDate(d.getDate() + 1);
                  return recentOrders?.filter((o: any) => {
                    if (!o.created_at) return false;
                    const t = o.created_at?.toDate ? o.created_at.toDate() : new Date(o.created_at);
                    return t >= d && t < next;
                  }).length || 0;
                });
                const maxWeek = Math.max(...weekCounts, 1);
                const bestDayIndex = weekCounts.indexOf(Math.max(...weekCounts));
                const totalThisWeek = weekCounts.reduce((a, b) => a + b, 0);

                const recentActivity = [...(recentOrders || [])]
                  .sort((a: any, b: any) => {
                    const ta = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at || 0);
                    const tb = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at || 0);
                    return tb.getTime() - ta.getTime();
                  })
                  .slice(0, 5);

                const needingRestock = (topItems || [])
                  .filter((i: any) => (i.stock_count ?? 0) <= 10)
                  .sort((a: any, b: any) => (a.stock_count ?? 0) - (b.stock_count ?? 0))
                  .slice(0, 5);

                const topSelling = [...(recentOrders || [])]
                  .filter((o: any) => o.status !== 'CANCELLED')
                  .reduce((acc: Record<string, { title: string, count: number, revenue: number }>, o: any) => {
                    const key = o.title || 'Unknown';
                    if (!acc[key]) acc[key] = { title: key, count: 0, revenue: 0 };
                    acc[key].count++;
                    acc[key].revenue += Number(o.total || o.price || 0);
                    return acc;
                  }, {});
                const topSellingSorted = Object.values(topSelling)
                  .sort((a: any, b: any) => b.count - a.count)
                  .slice(0, 5);

                const ordersByDay = weekDays.map(d => {
                  const next = new Date(d);
                  next.setDate(d.getDate() + 1);
                  return (recentOrders || []).filter((o: any) => {
                    if (!o.created_at) return false;
                    const t = o.created_at?.toDate ? o.created_at.toDate() : new Date(o.created_at);
                    return t >= d && t < next;
                  });
                });

                return (
                  <>
                    {/* Revenue Card */}
                    <div className="p-6 bg-white border border-slate-100 rounded-2xl">
                      <p className="text-[10px] font-bold text-[#94a3b8]">Total Earnings</p>
                      <p className="text-[28px] font-bold text-slate-900 tracking-tight mt-2">RM {revenue.toFixed(2)}</p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-[#94a3b8]">
                        <span>{totalOrders} orders</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span>{activeOrders} active</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span>{completedOrders} completed</span>
                      </div>
                    </div>

                    {/* Weekly Trend */}
                    <div className="p-6 bg-white border border-slate-100 rounded-2xl space-y-5">
                      <div>
                        <h4 className="text-[13px] font-bold text-slate-900">Weekly Trend</h4>
                        <p className="text-[10px] text-[#94a3b8] mt-0.5 leading-relaxed">
                          {totalThisWeek > 0
                            ? `${totalThisWeek} order${totalThisWeek > 1 ? 's' : ''} this week. Tap a bar for details.`
                            : 'No orders recorded this week yet.'}
                        </p>
                      </div>
                      <div className="relative flex items-end gap-2 h-28">
                        {weekCounts.map((count, i) => (
                          <button key={i} onClick={() => setSelectedDayIndex(selectedDayIndex === i ? null : i)} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                            <span className="text-[9px] font-bold text-slate-400">{count}</span>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${(count / maxWeek) * 100}%` }}
                              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
                              className={`w-full rounded-t-lg transition-all duration-200 cursor-pointer ${count > 0 ? pastelColors[i] : 'bg-slate-100'} ${selectedDayIndex === i ? 'scale-y-105 shadow-md' : 'hover:opacity-80'}`}
                              style={{ minHeight: count > 0 ? 4 : 0 }}
                            />
                            <span className={`text-[8px] font-bold uppercase transition-colors ${selectedDayIndex === i ? 'text-slate-900' : 'text-[#94a3b8]'}`}>{dayNames[i]}</span>

                            {/* Popover anchored to this bar */}
                            {selectedDayIndex === i && (() => {
                              const orders = ordersByDay[i] || [];
                              if (orders.length === 0) return null;
                              return (
                                <motion.div
                                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2.5 h-2.5 rounded-full ${pastelColors[i]}`} />
                                      <span className="text-[11px] font-bold text-slate-900">{dayNames[i]}</span>
                                      <span className="text-[9px] font-medium text-[#94a3b8]">{orders.length} order{orders.length > 1 ? 's' : ''}</span>
                                    </div>
                                    <button onClick={() => setSelectedDayIndex(null)} className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900">
                                      <X size={12} />
                                    </button>
                                  </div>
                                  <div className="px-4 py-3 space-y-3 max-h-40 overflow-y-auto">
                                    {orders.map((o: any) => (
                                      <div key={o.id} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${o.status === 'COMPLETED' || o.status === 'DELIVERED' ? 'bg-emerald-500' : o.status === 'CANCELLED' ? 'bg-red-400' : 'bg-amber-400'}`} />
                                          <div className="min-w-0">
                                            <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">{o.customer_name || 'Student'}</p>
                                            <p className="text-[8px] font-medium text-[#94a3b8] truncate leading-tight">{o.title}</p>
                                          </div>
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-900 shrink-0">RM{Number(o.total || o.price || 0).toFixed(2)}</p>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              );
                            })()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Top Selling Items */}
                    {topSellingSorted.length > 0 && (
                      <div className="p-6 bg-white border border-slate-100 rounded-2xl space-y-4">
                        <div>
                          <h4 className="text-[13px] font-bold text-slate-900">Best Sellers</h4>
                          <p className="text-[10px] text-[#94a3b8] mt-0.5 leading-relaxed">Most ordered items.</p>
                        </div>
                        <div className="space-y-2">
                          {topSellingSorted.map((item: any, i: number) => (
                            <div key={item.title} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                              <span className="text-[9px] font-bold text-[#94a3b8] w-4">#{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-slate-900 truncate">{item.title}</p>
                                <p className="text-[9px] font-medium text-[#94a3b8]">{item.count} order{item.count > 1 ? 's' : ''}</p>
                              </div>
                              <p className="text-[11px] font-bold text-slate-900 shrink-0">RM {item.revenue.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stock Watch */}
                    {needingRestock.length > 0 && (
                      <div className="p-6 bg-white border border-slate-100 rounded-2xl space-y-4">
                        <div>
                          <h4 className="text-[13px] font-bold text-slate-900">Low Stock</h4>
                          <p className="text-[10px] text-[#94a3b8] mt-0.5 leading-relaxed">
                            {needingRestock.length} item{needingRestock.length > 1 ? 's' : ''} running low.
                          </p>
                        </div>
                        <div className="space-y-2">
                          {needingRestock.map((item: any, i: number) => (
                            <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                              <span className="text-[9px] font-bold text-[#94a3b8] w-4">#{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-slate-900 truncate">{item.title}</p>
                                <p className="text-[9px] font-medium text-[#94a3b8]">RM {item.price}</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-[11px] font-bold ${(item.stock_count ?? 0) <= 0 ? 'text-red-500' : (item.stock_count ?? 0) <= 5 ? 'text-amber-500' : 'text-slate-900'}`}>
                                  {item.stock_count ?? 0}
                                </p>
                                <p className="text-[8px] font-medium text-[#94a3b8]">left</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Activity */}
                    {recentActivity.length > 0 && (
                      <div className="p-6 bg-white border border-slate-100 rounded-2xl space-y-4">
                        <div>
                          <h4 className="text-[13px] font-bold text-slate-900">Recent Orders</h4>
                          <p className="text-[10px] text-[#94a3b8] mt-0.5 leading-relaxed">Latest 5 orders.</p>
                        </div>
                        <div className="space-y-0">
                          {recentActivity.map((o: any) => (
                            <div key={o.id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${o.status === 'COMPLETED' || o.status === 'DELIVERED' ? 'bg-emerald-500' : o.status === 'CANCELLED' ? 'bg-red-400' : 'bg-amber-400'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold text-slate-900 truncate">{o.customer_name || 'Student'}</p>
                                <p className="text-[9px] font-medium text-[#94a3b8]">{o.status.replace(/_/g, ' ')}</p>
                              </div>
                              <p className="text-[12px] font-bold text-slate-900 shrink-0">RM {Number(o.total || o.price || 0).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* ════════════════ ACCOUNT VIEW ════════════════ */}
          {view === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="py-10 px-8 space-y-8"
            >
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                <AvatarDropdown photoUrl={merchant?.photo_url} userName={merchant?.full_name || 'Merchant'} />
                <div>
                  <p className="text-[16px] font-bold text-slate-900">{merchant?.full_name || 'Merchant'}</p>
                  <p className="text-[11px] font-medium text-[#94a3b8]">{merchant?.role === 'CLUB' ? 'Club Merchant' : 'Seller'}</p>
                </div>
              </div>
              <button onClick={() => router.push('/me/edit')} className="w-full p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-slate-200 transition-all">
                <div className="flex items-center gap-3">
                  <Settings size={18} className="text-[#94a3b8]" />
                  <span className="text-[14px] font-bold text-slate-900">Settings</span>
                </div>
                <ChevronRight size={16} className="text-[#94a3b8]" />
              </button>
              <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full p-5 bg-white border border-red-100 rounded-2xl flex items-center justify-between hover:border-red-200 transition-all">
                <div className="flex items-center gap-3">
                  <LogOut size={18} className="text-red-400" />
                  <span className="text-[14px] font-bold text-red-500">Logout</span>
                </div>
                <ChevronRight size={16} className="text-red-300" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t-[0.5px] border-slate-50 px-8 py-6">
        <div className="flex items-center justify-between max-w-lg mx-auto">
            {[
              { id: 'terminal', label: 'Terminal', icon: LayoutGrid },
              ...(isClub ? [{ id: 'disputes', label: 'Log', icon: ClipboardList }] : []),
              ...(isClub ? [{ id: 'insights', label: 'Stats', icon: BarChart3 }] : []),
              { id: 'account', label: 'Account', icon: User }
            ].map((nav: any) => {
              const active = view === nav.id;
              return (
                <button 
                  key={nav.id}
                  onClick={() => setView(nav.id)}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' : 'text-[#94a3b8] group-hover:text-slate-900'}`}>
                    <nav.icon size={20} strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-bold tracking-widest uppercase transition-all ${active ? 'text-slate-900' : 'text-[#94a3b8] opacity-50'}`}>{nav.label}</span>
                </button>
              );
            })}
        </div>
      </nav>

      {/* CREATE/EDIT LISTING OVERLAY */}
      <AnimatePresence>
         {(isCreateOpen || editingItem) && (
            <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-0 z-1000"
            >
               <CreateListing 
                  key={editingItem?.id || 'create'}
                  userId={merchant?.uid} 
                  role={merchant?.role} 
                  onClose={() => { setIsCreateOpen(false); setEditingItem(null); }} 
                  existingItem={editingItem}
               />
            </motion.div>
         )}
      </AnimatePresence>
      {/* Incoming Order Alert Overlay */}
      <AnimatePresence>
        {incomingOrders?.length > 0 && (
          <IncomingOrderAlert 
            key={incomingOrders[0].id}
            order={incomingOrders[0]} 
          />
        )}
      </AnimatePresence>

      {/* Dispute Response Overlay */}
      <AnimatePresence>
        {selectedDispute && (
          <DisputeThread 
            dispute={selectedDispute} 
            onClose={() => setSelectedDispute(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
