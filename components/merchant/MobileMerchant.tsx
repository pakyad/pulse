import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Bell, User, LayoutGrid, ClipboardList, BarChart3, Bike, PackageCheck, Info, ChevronRight, CheckCircle2, Pencil, Trash2, ShieldAlert, Package, LogOut, ChevronLeft, MessageSquare, AlertCircle, Settings, X, Loader2, ShoppingBag, TrendingUp } from 'lucide-react';
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
  const historyList = historyOrders || [];
  
  // FIX 2 & 3: Match desktop filtering
  const pipelineOrders = (recentOrders || []).filter((o: any) => 
    !["DELIVERED", "CANCELLED", "COMPLETED"].includes(o.status)
  );
  const pendingList = pipelineOrders;

  const pulseData = React.useMemo(() => {
    const pending = (recentOrders || []).filter((o: any) => o.status === 'PAID' || o.status === 'PENDING_VENDOR').length;
    const preparing = (recentOrders || []).filter((o: any) => o.status === 'PREPARING').length;
    const delivering = (recentOrders || []).filter((o: any) => o.status === 'READY' || o.status === 'READY_FOR_PICKUP' || o.status === 'PENDING_RUNNER').length;
    const total = pending + preparing + delivering;
    return { pending, preparing, delivering, total };
  }, [recentOrders]);

  const [unreadNotifications, setUnreadNotifications] = React.useState(0);

  React.useEffect(() => {
    if (!merchant?.uid) return;
    const qNotifs = query(
      collection(db, "notifications"),
      where("userId", "==", merchant.uid),
      where("read", "==", false)
    );
    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      setUnreadNotifications(snapshot.docs.length);
    });
    return () => unsubNotifs();
  }, [merchant?.uid]);
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

  //  STATS TAB (FIX 10) 
  const [statsData, setStatsData] = React.useState<any>({
    totalEarned: 0,
    itemsSold: 0,
    activeListings: 0,
    trustRating: 0,
    bestSellingItem: '...',
    recentSales: [],
    loading: true
  });

  React.useEffect(() => {
    if (view !== 'insights' || !merchant?.uid) return;

    // 1. Listen for Delivered Orders
    const qOrders = query(
      collection(db, "orders"), 
      where("seller_id", "==", merchant.uid),
      where("status", "==", "DELIVERED")
    );
    
    const unsubOrders = onSnapshot(qOrders, (snapshot) => {
      const delivered = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalEarned = delivered.reduce((s, o: any) => s + Number(o.total || o.price || 0), 0);
      
      // Best Selling Item
      const products: Record<string, number> = {};
      delivered.forEach((o: any) => {
        const title = o.title || (o.items?.[0]?.title) || 'Unknown Item';
        products[title] = (products[title] || 0) + 1;
      });
      const bestSellingItem = Object.entries(products)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'No sales yet';

      // Recent Sales (Last 5)
      const recentSales = [...delivered]
        .sort((a: any, b: any) => {
          const da = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
          const db = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
          return db.getTime() - da.getTime();
        })
        .slice(0, 5);

      setStatsData(prev => ({ 
        ...prev, 
        totalEarned, 
        itemsSold: delivered.length, 
        bestSellingItem,
        recentSales,
        loading: false 
      }));
    });

    // 2. Listen for Active Items
    const qItems = query(
      collection(db, "items"), 
      where("seller_id", "==", merchant.uid),
      where("status", "==", "active")
    );
    const unsubItems = onSnapshot(qItems, (snapshot) => {
      setStatsData(prev => ({ ...prev, activeListings: snapshot.docs.length }));
    });

    // 3. Trust Rating from User Doc
    const unsubUser = onSnapshot(doc(db, "users", merchant.uid), (snap) => {
      setStatsData(prev => ({ ...prev, trustRating: snap.data()?.trust_rating || 0 }));
    });

    return () => {
      unsubOrders();
      unsubItems();
      unsubUser();
    };
  }, [view, merchant?.uid]);

  const viewLabels: Record<string, string> = {
    terminal: 'Manage your shop and fulfill orders.',
    disputes: 'Track and resolve order disputes.',
    insights: 'Performance summary for your shop.',
    account: 'Your profile and account settings.'
  };

  return (
    <div className="min-h-screen bg-white flex flex-col text-[#111827] selection:bg-blue-100 md:hidden pb-[60px] font-sans antialiased">
      
      {/*  HEADER  */}
      <header className="h-[56px] px-6 border-b-[0.5px] border-[#E5E7EB] sticky top-0 bg-white/80 backdrop-blur-xl z-50 flex items-center justify-between">
         <div className="flex items-center gap-3">
            {view !== 'terminal' && (
              <button onClick={() => setView('terminal')} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[#111827] active:scale-95 transition-all">
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-[16px] font-medium text-[#111827] tracking-tight">
                {view === 'terminal' ? (merchant?.full_name || 'Terminal') : 
                 view === 'disputes' ? 'Disputes' :
                 view === 'insights' ? 'Analytics' : 'Account'}
              </h1>
              {view === 'terminal' && (
                <span className={`text-[11px] font-medium px-[10px] py-[3px] rounded-[20px] ${
                  isClub ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {isClub ? 'CLUB' : 'SELLER'}
                </span>
              )}
            </div>
         </div>
         <div className="flex items-center gap-4">
           {view === 'terminal' && (
             <button onClick={() => router.push('/merchant/notifications')} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-[#111827] relative active:scale-95 transition-all">
                <Bell size={18} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white">
                    {unreadNotifications}
                  </span>
                )}
             </button>
           )}
           <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E5E7EB]">
             <AvatarDropdown 
                photoUrl={merchant?.photo_url} 
                userName={merchant?.full_name || 'Merchant'} 
             />
           </div>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/*  TERMINAL VIEW  */}
          {view === 'terminal' && (
            <motion.div
              key="terminal"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 py-6 px-6"
            >
              {/* Today */}
              {pulseData.total > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Pending', count: pulseData.pending },
                    { label: 'Preparing', count: pulseData.preparing },
                    { label: 'Ready', count: pulseData.delivering }
                  ].map(s => (
                    <div key={s.label} className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] p-4 text-center">
                      <p className="text-[20px] font-bold text-[#111827]">{s.count}</p>
                      <p className="text-[11px] font-medium text-[#9CA3AF] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              <section className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="space-y-1">
                      <h3 className="text-[16px] font-medium text-[#111827] tracking-tight">Orders</h3>
                      <p className="text-[13px] text-[#9CA3AF]">Manage incoming and active orders.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 bg-slate-50 p-1 rounded-[12px] border border-slate-100">
                    {(['ACTIVE', 'HISTORY'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 rounded-[10px] text-[11px] font-medium transition-all ${
                          activeTab === tab 
                            ? 'bg-white text-[#111827] shadow-sm' 
                            : 'text-[#9CA3AF]'
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
                        <div className="py-16 px-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-[12px] flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 bg-white rounded-[12px] flex items-center justify-center text-[#9CA3AF] mb-4 shadow-sm border border-slate-100">
                            <PackageCheck size={24} strokeWidth={1.5} />
                          </div>
                          <h3 className="text-[16px] font-medium text-[#111827] tracking-tight mb-1">No active orders</h3>
                          <p className="text-[13px] text-[#9CA3AF] leading-relaxed max-w-[220px]">
                            New orders from students will appear here.
                          </p>
                        </div>
                      ) : (
                        pendingList.map((o: any) => (
                          <motion.div key={o.id} whileTap={{ scale: 0.98 }} className="p-4 bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-[#9CA3AF]">
                                  <ClipboardList size={16} />
                                </div>
                                <div>
                                  <p className="text-[16px] font-medium text-[#111827] tracking-tight">{o.customer_name || 'Student'}</p>
                                  <p className="text-[11px] text-[#9CA3AF]">Order #{o.id.slice(-4).toUpperCase()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[16px] font-medium text-[#111827]">RM {o.total?.toFixed(2)}</p>
                                <span className="text-[11px] font-medium px-[10px] py-[3px] rounded-[20px] bg-slate-100 text-[#111827] uppercase tracking-wider">{o.status.replace(/_/g, ' ')}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 pt-1 border-t border-slate-50">
                              {/* status PAID / PENDING_VENDOR: Prepare Order */}
                              {(o.status === 'PAID' || o.status === 'PENDING_VENDOR') && (
                                <button 
                                  onClick={() => handlePrepareOrder(o.id, o.items || [])} 
                                  className="w-full h-11 bg-[#111827] text-white rounded-full text-[13px] font-medium active:scale-95 transition-all shadow-sm"
                                >
                                  Prepare Order
                                </button>
                              )}

                              {/* status PREPARING: Mark Ready */}
                              {o.status === 'PREPARING' && (
                                <button 
                                  onClick={() => handleMarkReady(o.id)} 
                                  className="w-full h-11 bg-[#111827] text-white rounded-full text-[13px] font-medium active:scale-95 transition-all shadow-sm"
                                >
                                  Mark Ready for Pickup
                                </button>
                              )}

                              {/* status READY / PENDING_RUNNER: Message options */}
                              {(o.status === 'READY' || o.status === 'READY_FOR_PICKUP' || o.status === 'PENDING_RUNNER' || o.runner_id) && (
                                <div className="grid grid-cols-2 gap-2">
                                  <button 
                                    onClick={() => handleMessageUser(o.id, o.buyer_id, o.customer_name, 'BUYER', o.title)}
                                    className="h-11 bg-[#111827] text-white rounded-full text-[13px] font-medium active:scale-95 transition-all"
                                  >
                                    Buyer
                                  </button>
                                  {(o.runner_id || o.status === 'PENDING_RUNNER') && (
                                    <button 
                                      onClick={() => handleMessageUser(o.id, o.runner_id || 'DEMO_RUNNER', o.runner_name || 'Runner', 'RUNNER', undefined, o.drop_off_location)}
                                      className="h-11 bg-white border border-[#D1D5DB] text-[#374151] rounded-full text-[13px] font-medium active:scale-95 transition-all"
                                    >
                                      Runner
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* status PICKED_UP: Collected notice */}
                              {o.status === 'PICKED_UP' && (
                                <div className="w-full h-11 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                                  <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1.5">
                                    <CheckCircle2 size={14} /> Collected by Runner
                                  </p>
                                </div>
                              )}

                              {/* Handshake / Confirmation (if not final) */}
                              {o.status !== 'DELIVERED' && o.status !== 'COMPLETED' && o.status !== 'PAID' && o.status !== 'PENDING_VENDOR' && (
                                <button 
                                  onClick={() => handleConfirmDelivery(o.id)}
                                  disabled={o.handshake?.seller_confirmed}
                                  className={`h-11 rounded-full text-[13px] font-medium transition-all ${
                                    o.handshake?.seller_confirmed 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                    : 'bg-[#111827] text-white active:scale-95'
                                  }`}
                                >
                                  {o.handshake?.seller_confirmed ? 'Handoff Sent' : 'Confirm Delivery'}
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))
                      )
                    )}
                    {activeTab === 'HISTORY' && (
                      historyList.length === 0 ? (
                        <div className="py-16 px-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-[12px] flex flex-col items-center justify-center text-center">
                          <div className="w-14 h-14 bg-white rounded-[12px] flex items-center justify-center text-[#9CA3AF] mb-4 shadow-sm border border-slate-100">
                            <ClipboardList size={24} strokeWidth={1.5} />
                          </div>
                          <h3 className="text-[16px] font-medium text-[#111827] tracking-tight mb-1">No past orders</h3>
                          <p className="text-[13px] text-[#9CA3AF] leading-relaxed max-w-[220px]">
                            Completed and cancelled orders will show up here.
                          </p>
                        </div>
                      ) : (
                        historyList.map((o: any) => (
                          <div key={o.id} className="p-4 bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] shadow-sm space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${o.status === 'CANCELLED' ? 'bg-red-50 text-red-400' : ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(o.status) ? 'bg-blue-50 text-[#111827]' : 'bg-emerald-50 text-emerald-500'}`}>
                                  {o.status === 'CANCELLED' ? <Trash2 size={18} /> : ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(o.status) ? <Bike size={18} /> : <CheckCircle2 size={18} />}
                                </div>
                                <div>
                                  <p className="text-[16px] font-medium text-[#111827]">{o.customer_name || 'Student'}</p>
                                  <p className="text-[11px] text-[#9CA3AF]">Order #{o.id.slice(-4).toUpperCase()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[16px] font-medium text-[#111827]">RM {o.total?.toFixed(2)}</p>
                                <span className={`text-[11px] font-medium px-[10px] py-[3px] rounded-[20px] ${o.status === 'CANCELLED' ? 'bg-red-50 text-red-500' : ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(o.status) ? 'bg-blue-50 text-[#111827]' : 'bg-emerald-50 text-emerald-500'}`}>
                                  {o.status.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>
                            {['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(o.status) && (
                              <div className="p-3 bg-slate-50/50 rounded-[12px] border border-slate-50 flex items-center justify-between">
                                <p className="text-[11px] font-medium text-[#9CA3AF] flex items-center gap-2">
                                  <User size={12} /> With {o.runner_name || 'Runner'}
                                </p>
                                <p className="text-[11px] font-medium text-[#111827] truncate ml-4">{o.drop_off_location || 'Campus'}</p>
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
                    <ShieldAlert size={14} className="text-[#9CA3AF]" />
                    <p className="text-[11px] font-medium text-[#9CA3AF] leading-none">Low Stock</p>
                  </div>
                  <div className="bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm divide-y divide-slate-50">
                    {topItems.filter((i: any) => (i.stock_count ?? 99) <= 5).map((item: any) => (
                      <div key={item.id} className="p-4 flex items-center justify-between bg-white active:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-[12px] bg-slate-50 flex items-center justify-center text-slate-100">
                            <Package size={18} />
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-[#111827] truncate max-w-[120px]">{item.title}</p>
                            <button onClick={() => setEditingItem(item)} className="mt-2 h-8 px-4 rounded-full bg-white border border-[#D1D5DB] text-[11px] font-medium text-[#374151] hover:bg-slate-50 flex items-center justify-center transition-all active:scale-95">
                              Restock
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[16px] font-medium leading-none ${item.stock_count <= 0 ? 'text-red-500' : 'text-[#374151]'}`}>
                            {item.stock_count <= 0 ? 'EMPTY' : item.stock_count}
                          </p>
                          <p className="text-[11px] font-medium text-[#9CA3AF] mt-1">left</p>
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
                      <h3 className="text-[16px] font-medium text-[#111827] tracking-tight">Inventory</h3>
                      <p className="text-[13px] text-[#9CA3AF]">Items listed on the marketplace.</p>
                    </div>
                    <button onClick={() => setIsCreateOpen(true)} className="w-9 h-9 rounded-full bg-[#111827] text-white flex items-center justify-center shadow-md active:scale-95 transition-all">
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {topItems?.map((item: any) => (
                      <div key={item.id} className="p-4 bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[12px] bg-white border border-[#E5E7EB] overflow-hidden">
                            {item.image_url ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><LayoutGrid size={20} /></div>}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[16px] font-medium text-[#111827] tracking-tight">{item.title}</p>
                              {item.stock_count > 0 && item.stock_count <= 10 && (
                                <span className="px-[10px] py-[3px] bg-red-50 text-red-600 text-[11px] font-medium rounded-[20px] border border-red-100 uppercase tracking-tighter">Low</span>
                              )}
                              {(item.stock_count <= 0 || item.status === 'OUT_OF_STOCK') && (
                                <span className="px-[10px] py-[3px] bg-slate-100 text-[#9CA3AF] text-[11px] font-medium rounded-[20px] border border-slate-200 uppercase tracking-tighter">Empty</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] text-[#9CA3AF]">RM {item.price?.toFixed(2)}</p>
                              <PriceHealthIndicator price={item.price} category={item.category} subcategory={item.subcategory} />
                              <span className="w-1 h-1 bg-slate-200 rounded-full" />
                              <p className={`text-[11px] font-medium uppercase tracking-tight ${(item.stock_count ?? 0) === 0 ? 'text-red-500' : (item.stock_count ?? 0) <= 5 ? 'text-amber-500' : 'text-[#9CA3AF]'}`}>
                                {item.stock_count ?? 0} left
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingItem(item)} title="Edit" className="w-9 h-9 rounded-full bg-slate-50 border border-slate-50 flex items-center justify-center text-[#9CA3AF] active:scale-95 transition-all">
                            <Pencil size={14} />
                          </button>
                          <button title="Delete" onClick={async () => { if (!confirm('Delete this listing?')) return; try { await deleteDoc(doc(db, 'items', item.id)); } catch(e) { alert('Failed.'); } }} className="w-9 h-9 rounded-full bg-slate-50 border border-slate-50 flex items-center justify-center text-red-300 active:scale-95 transition-all">
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

          {/*  LOG VIEW (FIX 14)  */}
          {view === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="py-6 px-0 space-y-4"
            >
              <div className="flex gap-2 overflow-x-auto no-scrollbar px-6 pb-2 sticky top-[56px] z-40 bg-white/90 backdrop-blur-md py-2 border-b border-slate-50">
                {['All', 'Active', 'Completed', 'Cancelled'].map(tab => {
                  const isActiveTab = (activeTab as string || 'All') === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-5 py-2.5 rounded-full text-[11px] font-medium transition-all shrink-0 ${isActiveTab ? 'bg-[#111827] text-white' : 'bg-white text-[#374151] border border-[#D1D5DB] hover:bg-slate-50'}`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              <div className="px-6 space-y-3">
                {(() => {
                  const filteredOrders = (historyOrders || []).filter((o: any) => {
                    const currentTab = activeTab as string || 'All';
                    if (currentTab === 'Active') return ['PAID', 'PREPARING', 'READY', 'RUNNER_ASSIGNED', 'PICKED_UP'].includes(o.status);
                    if (currentTab === 'Completed') return o.status === 'DELIVERED';
                    if (currentTab === 'Cancelled') return o.status === 'CANCELLED';
                    return true;
                  });

                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'PAID': return 'bg-[#FEF3C7] text-[#92400E]';
                      case 'PREPARING': return 'bg-[#DBEAFE] text-[#1E40AF]';
                      case 'READY': return 'bg-[#D1FAE5] text-[#065F46]';
                      case 'RUNNER_ASSIGNED': return 'bg-[#EDE9FE] text-[#4C1D95]';
                      case 'PICKED_UP': return 'bg-[#CFFAFE] text-[#164E63]';
                      case 'DELIVERED': return 'bg-[#F3F4F6] text-[#374151]';
                      case 'CANCELLED': return 'bg-[#FEE2E2] text-[#991B1B]';
                      default: return 'bg-slate-100 text-[#374151]';
                    }
                  };

                  if (filteredOrders.length === 0) {
                    return (
                      <div className="py-20 text-center flex flex-col items-center">
                        <ClipboardList size={32} className="text-[#9CA3AF] mb-4" />
                        <p className="text-[13px] font-medium text-[#111827]">No orders found</p>
                      </div>
                    );
                  }

                  return filteredOrders.map((o: any) => (
                    <div key={o.id} className="p-4 bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-medium text-[#9CA3AF]">
                            {o.created_at?.toDate ? o.created_at.toDate().toLocaleString('en-MY', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}
                          </p>
                          <p className="text-[11px] font-mono font-bold text-[#9CA3AF] mt-0.5">#{o.id.slice(-6).toUpperCase()}</p>
                        </div>
                        <span className={`px-[10px] py-[3px] rounded-[20px] text-[11px] font-medium uppercase tracking-wider ${getStatusColor(o.status)}`}>
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between items-end border-t border-slate-50 pt-3">
                        <div>
                          <p className="text-[16px] font-medium text-[#111827]">{o.customer_name || 'Student'}</p>
                          <p className="text-[13px] text-[#9CA3AF]">{o.title}</p>
                        </div>
                        <p className="text-[16px] font-medium text-[#111827]">RM {Number(o.total || o.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          )}

          {/*  INSIGHTS VIEW (FIX 10)  */}
          {view === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="py-6 px-6 space-y-8"
            >
              {statsData.loading ? (
                <div className="space-y-6">
                  <div className="h-40 bg-slate-50 rounded-[20px] animate-pulse" />
                  <div className="flex gap-3">
                    <div className="h-10 flex-1 bg-slate-50 rounded-full animate-pulse" />
                    <div className="h-10 flex-1 bg-slate-50 rounded-full animate-pulse" />
                    <div className="h-10 flex-1 bg-slate-50 rounded-full animate-pulse" />
                  </div>
                </div>
              ) : (
                <>
                  {/* Hero Card */}
                  <div className="p-8 bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] relative overflow-hidden shadow-sm">
                    <div className="relative z-10">
                      <p className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-widest mb-1">Total Earned</p>
                      <h2 className="text-[32px] font-bold text-[#111827] tracking-tighter leading-none">RM {statsData.totalEarned.toFixed(2)}</h2>
                    </div>
                  </div>

                  {/* Stat Pills */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    <div className="px-5 py-2.5 bg-[#111827] text-white rounded-full flex items-center gap-2 shrink-0">
                      <ShoppingBag size={14} />
                      <span className="text-[11px] font-medium">{statsData.itemsSold} Sold</span>
                    </div>
                    <div className="px-5 py-2.5 bg-white border border-[#D1D5DB] text-[#374151] rounded-full flex items-center gap-2 shrink-0">
                      <Package size={14} />
                      <span className="text-[11px] font-medium">{statsData.activeListings} Active</span>
                    </div>
                    <div className="px-5 py-2.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-full flex items-center gap-2 shrink-0">
                      <TrendingUp size={14} />
                      <span className="text-[11px] font-medium"> {statsData.trustRating}</span>
                    </div>
                  </div>

                  {/* Best Selling Item */}
                  <div className="p-5 bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] space-y-3 shadow-sm">
                    <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-widest">Top Selling</p>
                    <div className="flex items-center gap-3 text-[#111827]">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                        <TrendingUp size={20} />
                      </div>
                      <p className="text-[16px] font-medium tracking-tight truncate flex-1"> {statsData.bestSellingItem}</p>
                    </div>
                  </div>

                  {/* Recent Sales List */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[16px] font-medium text-[#111827] tracking-tight">Recent Sales</h3>
                    </div>
                    <div className="space-y-4">
                      {statsData.recentSales.map((sale: any) => (
                        <div key={sale.id} className="flex items-center justify-between group p-4 bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                              <User size={16} className="text-[#9CA3AF]" />
                            </div>
                            <div>
                              <p className="text-[16px] font-medium text-[#111827] tracking-tight leading-tight">{sale.title}</p>
                              <p className="text-[13px] text-[#9CA3AF] mt-0.5">{sale.customer_name || 'Student'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[16px] font-medium text-[#111827]">RM {Number(sale.total || sale.price || 0).toFixed(2)}</p>
                            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                              {sale.created_at?.toDate ? sale.created_at.toDate().toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : '...'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/*  ACCOUNT VIEW  */}
          {view === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="py-6 px-6 space-y-8"
            >
              <div className="p-5 bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] flex items-center gap-4 shadow-sm">
                <AvatarDropdown photoUrl={merchant?.photo_url} userName={merchant?.full_name || 'Merchant'} />
                <div>
                  <p className="text-[16px] font-medium text-[#111827]">{merchant?.full_name || 'Merchant'}</p>
                  <p className="text-[13px] text-[#9CA3AF]">{merchant?.role === 'CLUB' ? 'Club Merchant' : 'Seller'}</p>
                </div>
              </div>
              <button onClick={() => router.push('/me/edit')} className="w-full p-5 bg-white border-[0.5px] border-[#E5E7EB] rounded-[12px] flex items-center justify-between shadow-sm active:scale-98 transition-all">
                <div className="flex items-center gap-3">
                  <Settings size={18} className="text-[#9CA3AF]" />
                  <span className="text-[16px] font-medium text-[#111827]">Settings</span>
                </div>
                <ChevronRight size={16} className="text-[#9CA3AF]" />
              </button>
              <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full p-5 bg-white border-[0.5px] border-red-100 rounded-[12px] flex items-center justify-between shadow-sm active:scale-98 transition-all">
                <div className="flex items-center gap-3">
                  <LogOut size={18} className="text-red-400" />
                  <span className="text-[16px] font-medium text-red-500">Logout</span>
                </div>
                <ChevronRight size={16} className="text-red-300" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/*  BOTTOM NAV  */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t-[0.5px] border-[#E5E7EB] px-6 h-[60px]">
        <div className="flex items-center justify-between h-full max-w-lg mx-auto">
            {[
              { id: 'terminal', label: 'Terminal', icon: LayoutGrid },
              ...(isClub ? [{ id: 'logs', label: 'Log', icon: ClipboardList }] : []),
              ...(isClub ? [{ id: 'insights', label: 'Stats', icon: BarChart3 }] : []),
              { id: 'account', label: 'Account', icon: User }
            ].map((nav: any) => {
              const active = view === nav.id;
              return (
                <button 
                  key={nav.id}
                  onClick={() => setView(nav.id)}
                  className="flex flex-col items-center justify-center gap-1 group"
                >
                  <nav.icon size={22} strokeWidth={active ? 2.5 : 2} className={active ? 'text-[#111827]' : 'text-[#9CA3AF]'} />
                  <span className={`text-[10px] font-medium transition-all ${active ? 'text-[#111827]' : 'text-[#9CA3AF]'}`}>{nav.label}</span>
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
