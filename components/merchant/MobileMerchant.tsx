import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Bell, User, LayoutGrid, ClipboardList, BarChart3, Bike, PackageCheck, Info, ChevronRight, ShieldCheck, Zap, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import CreateListing from '@/components/CreateListing';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import SwipeToReady from './SwipeToReady';
import { motion, AnimatePresence } from 'framer-motion';
import IncomingOrderAlert from './IncomingOrderAlert';

/**
 * 🏛️ Pulse Mobile Merchant Terminal
 * concept: skibidi (institutional typography & identity)
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
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // ── SKIBIDI COMPONENTS ──
  const SkibidiHeading = ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-[17px] font-bold text-[#1e293b] tracking-tight leading-none">{children}</h1>
  );

  const SkibidiSubtext = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed">{children}</p>
  );

  // ── TERMINAL STATE MANAGEMENT ──
  const [activeTab, setActiveTab] = React.useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  const pendingList = [...(urgentOrders || []), ...(preparingOrders || [])];
  const historyList = historyOrders || [];

  return (
    <div className="min-h-screen bg-white flex flex-col text-[#1e293b] selection:bg-blue-100 md:hidden pb-32 font-sans antialiased">
      
      {/* ── HEADER (Skibidi concept) ── */}
      <header className="px-8 py-8 border-b-[0.5px] border-slate-50 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <div className="flex items-center justify-between">
           <div className="space-y-1.5">
              <SkibidiHeading>{merchant?.full_name || 'Terminal'}</SkibidiHeading>
              <SkibidiSubtext>Manage your shop and fulfill orders.</SkibidiSubtext>
           </div>
           <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] hover:text-[#1e293b] relative border border-slate-50">
                 <Bell size={18} />
                 {urgentOrders?.length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>}
              </button>
               <AvatarDropdown 
                  photoUrl={merchant?.photo_url} 
                  userName={merchant?.full_name || 'Merchant'} 
               />
           </div>
        </div>
      </header>

      <div className="flex-1 space-y-12 py-10 px-8">
         
         {/* ── STATUS OVERVIEW (Skibidi concept) ── */}
         <section className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-slate-50/30 rounded-[32px] border border-slate-50 space-y-4">
                  <p className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest leading-none">Total Earnings</p>
                  <div className="space-y-0.5">
                     <p className="text-[11px] font-bold text-slate-200">RM</p>
                     <p className="text-[22px] font-bold text-[#1e293b] tracking-tighter leading-none">{revenue.toFixed(2)}</p>
                  </div>
               </div>
               <div className="p-6 bg-[#1e293b] rounded-[32px] text-white space-y-4 shadow-xl shadow-slate-900/10">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Orders to Do</p>
                  <div className="space-y-0.5">
                     <p className="text-[11px] font-bold text-white/40">TOTAL</p>
                     <p className="text-[22px] font-bold text-white tracking-tighter leading-none">{activeOrdersCount}</p>
                  </div>
               </div>
            </div>
         </section>

         {/* ── PENDING ACTIONS (Skibidi concept) ── */}
         <section className="space-y-6">
            <div className="space-y-4">
               <div className="flex items-center justify-between px-1">
                  <div className="space-y-1">
                     <h3 className="text-[15px] font-bold text-[#1e293b] tracking-tight">Order Registry</h3>
                     <p className="text-[11px] font-medium text-[#94a3b8]">Live lifecycle of campus commerce.</p>
                  </div>
               </div>

               {/* TAB NAVIGATION */}
               <div className="flex gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                  {(['ACTIVE', 'HISTORY'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === tab 
                          ? 'bg-white text-[#1e293b] shadow-sm' 
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
                    <div className="py-20 bg-slate-50/20 border border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center text-slate-100">
                        <PackageCheck size={28} strokeWidth={1.5} />
                        <p className="text-[10px] mt-4 font-black uppercase tracking-widest">No Prep Orders</p>
                    </div>
                  ) : (
                    pendingList.map((o: any) => (
                      <motion.div 
                        key={o.id} 
                        whileTap={{ scale: 0.98 }}
                        className="p-6 bg-white border border-slate-50 rounded-[32px] shadow-sm space-y-6"
                      >
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                               <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-[#94a3b8]">
                                  <ClipboardList size={18} />
                               </div>
                               <div>
                                  <p className="text-[15px] font-bold text-[#1e293b] tracking-tight">{o.customer_name || 'Student'}</p>
                                  <p className="text-[11px] font-medium text-[#94a3b8]">Order #{o.id.slice(-4).toUpperCase()}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[15px] font-bold text-[#1e293b]">RM {o.total?.toFixed(2)}</p>
                               <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{o.status.replace(/_/g, ' ')}</p>
                            </div>
                         </div>

                         <div className="flex gap-3 pt-2">
                            {o.status === 'PENDING_VENDOR' ? (
                              <button 
                                onClick={() => handleAcceptOrder(o.id)}
                                className="flex-1 h-12 bg-[#1e293b] text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-900/10"
                              >
                                 Accept Order
                              </button>
                            ) : o.status === 'PREPARING' ? (
                              <div className="flex-1">
                                <SwipeToReady orderId={o.id} />
                              </div>
                            ) : (
                              <div className="flex-1 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                                <p className="text-[11px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                  <Bike size={14} />
                                  Waiting for runner
                                </p>
                              </div>
                            )}
                            <button className="w-12 h-12 rounded-2xl bg-slate-50 text-[#94a3b8] flex items-center justify-center border border-slate-50">
                               <Info size={18} />
                            </button>
                         </div>
                      </motion.div>
                    ))
                  )
                )}

                {activeTab === 'HISTORY' && (
                  historyList.length === 0 ? (
                    <div className="py-20 bg-slate-50/20 border border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center text-slate-100">
                        <ClipboardList size={28} strokeWidth={1.5} />
                        <p className="text-[10px] mt-4 font-black uppercase tracking-widest">No Records Yet</p>
                    </div>
                  ) : (
                    historyList.map((o: any) => (
                      <div key={o.id} className="p-6 bg-white border border-slate-50 rounded-[32px] shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${o.status === 'CANCELLED' ? 'bg-red-50 text-red-400' : ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(o.status) ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                              {o.status === 'CANCELLED' ? <Trash2 size={18} /> : ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(o.status) ? <Bike size={18} /> : <CheckCircle2 size={18} />}
                            </div>
                            <div>
                               <p className="text-[14px] font-bold text-[#1e293b]">{o.customer_name || 'Student'}</p>
                               <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-widest">Order #{o.id.slice(-4).toUpperCase()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[14px] font-bold text-[#1e293b]">RM {o.total?.toFixed(2)}</p>
                             <p className={`text-[9px] font-black uppercase tracking-widest ${o.status === 'CANCELLED' ? 'text-red-500' : ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(o.status) ? 'text-blue-500' : 'text-emerald-500'}`}>
                                {o.status.replace(/_/g, ' ')}
                             </p>
                          </div>
                        </div>
                        {['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY'].includes(o.status) && (
                          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50 flex items-center justify-between">
                             <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest flex items-center gap-2">
                                <User size={12} />
                                With {o.runner_name || 'Runner'}
                             </p>
                             <p className="text-[10px] font-bold text-[#1e293b] truncate ml-4">{o.drop_off_location || 'Campus'}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )
                )}
              </motion.div>
            </AnimatePresence>
         </section>

         {/* ── MANAGE LISTINGS ── */}
         <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
               <div className="space-y-1">
                  <h3 className="text-[15px] font-bold text-[#1e293b] tracking-tight">Active Inventory</h3>
                  <p className="text-[11px] font-medium text-[#94a3b8]">Live assets on the marketplace.</p>
               </div>
               <button 
                onClick={() => setIsCreateOpen(true)}
                className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/10"
               >
                  <Plus size={18} />
               </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {topItems?.map((item: any) => (
                  <div key={item.id} className="p-5 bg-slate-50/50 border border-slate-50 rounded-[32px] flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 overflow-hidden">
                           {item.image_url ? (
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-200">
                                 <LayoutGrid size={20} />
                              </div>
                           )}
                        </div>
                        <div>
                           <p className="text-[14px] font-bold text-[#1e293b] tracking-tight">{item.title}</p>
                           <p className="text-[11px] font-medium text-[#94a3b8]">RM {item.price?.toFixed(2)} • {item.stock_count || 0} in stock</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <button
                           onClick={() => router.push(`/marketplace/${item.id}/edit`)}
                           title="Edit"
                           className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#1e293b] transition-all"
                        >
                           <Pencil size={14} />
                        </button>
                        <button
                           title="Delete"
                           onClick={async () => { if (!confirm('Delete this listing?')) return; try { await deleteDoc(doc(db, 'items', item.id)); } catch(e) { alert('Failed.'); } }}
                           className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-300 hover:text-red-500 transition-all"
                        >
                           <Trash2 size={14} />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </section>
      </div>

      {/* ── BOTTOM NAV (Skibidi concept) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t-[0.5px] border-slate-50 px-8 py-6">
        <div className="flex items-center justify-between max-w-lg mx-auto">
           {[
             { id: 'dashboard', label: 'Terminal', icon: LayoutGrid, path: '/merchant' },
             { id: 'history', label: 'Log', icon: ClipboardList, path: '/merchant/history' },
             { id: 'insights', label: 'Stats', icon: BarChart3, path: '/activity' },
             { id: 'account', label: 'Registry', icon: User, path: '/me' }
           ].map((nav) => {
             const active = pathname === nav.path || (nav.id === 'dashboard' && pathname === '/merchant');
             return (
               <button 
                 key={nav.id}
                 onClick={() => router.push(nav.path)}
                 className="flex flex-col items-center gap-1.5 group"
               >
                 <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${active ? 'bg-[#1e293b] text-white shadow-lg shadow-slate-900/10' : 'text-[#94a3b8] group-hover:text-[#1e293b]'}`}>
                   <nav.icon size={20} strokeWidth={active ? 2.5 : 2} />
                 </div>
                 <span className={`text-[10px] font-bold tracking-widest uppercase transition-all ${active ? 'text-[#1e293b]' : 'text-[#94a3b8] opacity-50'}`}>{nav.label}</span>
               </button>
             );
           })}
        </div>
      </nav>

      {/* CREATE LISTING OVERLAY */}
      <AnimatePresence>
         {isCreateOpen && (
            <motion.div 
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-0 z-1000"
            >
               <CreateListing 
                  userId={merchant?.uid} 
                  role={merchant?.role} 
                  onClose={() => setIsCreateOpen(false)} 
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
    </div>
  );
}
