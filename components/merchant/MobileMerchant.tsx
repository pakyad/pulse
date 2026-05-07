import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Bell, User, LayoutGrid, ClipboardList, BarChart3, Bike, PackageCheck, Info, ChevronRight, ShieldCheck, Zap } from 'lucide-react';
import CreateListing from '@/components/CreateListing';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🏛️ Pulse Mobile Merchant Terminal
 * Optimized for high-velocity logistics fulfillment.
 */
export default function MobileMerchant({ 
  merchant, 
  revenue, 
  activeOrdersCount, 
  urgentOrders, 
  preparingOrders,
  topItems, 
  recentOrders,
  handleAcceptOrder, 
  handleCallRunner,
  toggleItemStatus,
  onViewProof
}: any) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col text-slate-900 selection:bg-blue-100 md:hidden pb-32 font-sans antialiased">
      
      {/* ── HEADER ── */}
      <header className="px-8 py-8 border-b-[0.5px] border-slate-100 sticky top-0 bg-white/80 backdrop-blur-xl z-50">
        <div className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-[26px] font-black text-slate-900 tracking-tighter leading-none">{merchant?.full_name || 'Terminal'}</h1>
              <p className="text-[14px] font-medium text-slate-400 leading-relaxed">Active node session for institutional fulfillment.</p>
           </div>
           <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 relative border border-slate-50">
                 <Bell size={20} />
                 {urgentOrders?.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white shadow-sm"></span>}
              </button>
               <AvatarDropdown 
                  photoUrl={merchant?.photo_url} 
                  userName={merchant?.full_name || 'Merchant'} 
               />
           </div>
        </div>
      </header>

      <div className="flex-1 space-y-12 py-10 px-8">
         
         {/* ── STATUS OVERVIEW ── */}
         <section className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-8 bg-slate-50/50 rounded-[36px] border border-slate-50 space-y-6 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Liquidity</p>
                  <div className="space-y-1">
                     <p className="text-[13px] font-bold text-slate-300">RM</p>
                     <p className="text-[28px] font-black text-slate-900 tracking-tighter leading-none">{revenue.toFixed(2)}</p>
                  </div>
               </div>
               <div className="p-8 bg-slate-900 rounded-[36px] text-white space-y-6 shadow-xl shadow-slate-900/10">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Live Tasks</p>
                  <div className="space-y-1">
                     <p className="text-[13px] font-bold text-white/40">NODE</p>
                     <p className="text-[28px] font-black text-white tracking-tighter leading-none">{activeOrdersCount}</p>
                  </div>
               </div>
            </div>
         </section>

         {/* ── PENDING ACTIONS ── */}
         <section className="space-y-1">
            <div className="flex justify-between items-baseline">
               <h2 className="text-[26px] font-black text-slate-900 tracking-tight flex items-center gap-3">
                  Pending Handoff
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-black uppercase tracking-widest">{urgentOrders?.length || 0}</span>
               </h2>
            </div>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed">Verify and prep pending orders for institutional distribution.</p>
            
            {urgentOrders?.length === 0 ? (
               <div className="py-16 bg-slate-50/30 border border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center text-slate-200">
                  <PackageCheck size={32} />
                  <p className="text-[11px] mt-4 font-black uppercase tracking-widest">Registry Clear</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {urgentOrders.map((o: any) => (
                    <motion.div 
                      key={o.id} 
                      whileTap={{ scale: 0.98 }}
                      className="p-6 bg-white border border-slate-50 rounded-[36px] shadow-sm shadow-slate-200/50 space-y-6"
                    >
                       <div className="flex justify-between items-start">
                          <div className="space-y-1">
                             <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">ORDER #{o.id.substring(0,8).toUpperCase()}</p>
                             <h3 className="text-[18px] font-black text-slate-900 tracking-tight leading-none">{o.title}</h3>
                          </div>
                          <p className="text-[18px] font-black text-slate-900">RM{o.price}</p>
                       </div>
                       <button 
                          onClick={() => handleAcceptOrder(o.id)}
                          className="w-full h-14 bg-blue-600 text-white rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                       >
                          Verify & Prep
                       </button>
                    </motion.div>
                  ))}
               </div>
            )}
         </section>

         {/* ── ACTIVE PIPELINE ── */}
         <section className="space-y-1">
            <h2 className="text-[26px] font-black text-slate-900 tracking-tight">Active Pipeline</h2>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed">Live telemetry of assets currently in the fulfillment loop.</p>
            <div className="space-y-3 mt-6">
               {preparingOrders?.length === 0 ? (
                  <p className="text-[13px] text-slate-300 font-medium italic">Pipeline is clear.</p>
               ) : (
                  preparingOrders.map((o: any) => (
                     <div key={o.id} className="flex items-center justify-between p-6 bg-slate-50/50 border border-slate-50 rounded-[32px] shadow-sm">
                        <div className="space-y-1">
                           <p className="text-[15px] font-black text-slate-900 tracking-tight">{o.title}</p>
                           <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{o.status.replace('_', ' ')}</p>
                        </div>
                        <button 
                           onClick={() => handleCallRunner(o.id)}
                           disabled={o.status === 'AWAITING_RUNNER'}
                           className={`h-11 px-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                              o.status === 'AWAITING_RUNNER' 
                              ? 'bg-white text-slate-300 border border-slate-100 shadow-sm' 
                              : 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 active:scale-95'
                           }`}
                        >
                           {o.status === 'AWAITING_RUNNER' ? 'Synced' : 'Call Runner'}
                        </button>
                     </div>
                  ))
               )}
            </div>
         </section>

         {/* ── SYSTEM DIRECTIVES ── */}
         <section className="space-y-1">
            <h2 className="text-[26px] font-black text-slate-900 tracking-tight">Node Directives</h2>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed">Execute operational protocols to optimize node performance.</p>
            <div className="bg-slate-50/50 rounded-[40px] border border-slate-50 overflow-hidden mt-6">
               {[
                  { id: 'verify', icon: ShieldCheck, title: 'Identity Registry', text: 'Submit student ID to unlock high-velocity transaction nodes.' },
                  { id: 'assets', icon: Zap, title: 'Liquidity Mastery', text: 'Optimize 1:1 image ratios for superior marketplace visibility.' },
               ].map((tip, idx) => {
                  const [isOpen, setIsOpen] = React.useState(false);
                  return (
                     <div key={tip.id} className={`border-b border-slate-50 last:border-0 ${isOpen ? 'bg-white' : ''}`}>
                        <button 
                           onClick={() => setIsOpen(!isOpen)}
                           className="w-full px-8 py-6 flex items-center justify-between text-left transition-colors"
                        >
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOpen ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                 <tip.icon size={20} />
                              </div>
                              <span className="text-[15px] font-black text-slate-900 tracking-tight">{tip.title}</span>
                           </div>
                           <Plus size={18} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                             <motion.div 
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               className="px-8 pb-8 overflow-hidden"
                             >
                                <p className="text-[13px] text-slate-500 leading-relaxed font-medium">{tip.text}</p>
                                <button className="mt-5 text-[11px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                  Initialize Protocol <ChevronRight size={14} strokeWidth={3} />
                                </button>
                             </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                  );
               })}
            </div>
         </section>

         {/* ── ASSET MANAGEMENT ── */}
         <section className="space-y-1 pb-12">
            <h2 className="text-[26px] font-black text-slate-900 tracking-tight">Asset Registry</h2>
            <p className="text-[14px] font-medium text-slate-400 leading-relaxed">Manage institutional liquidity and inventory status nodes.</p>
            <div className="space-y-4 mt-6">
               {topItems?.length === 0 ? (
                  <p className="text-[13px] text-slate-300 italic">No assets registered.</p>
               ) : (
                  topItems.map((item: any) => (
                     <div key={item.id} className="p-6 bg-white border border-slate-50 rounded-[36px] shadow-sm shadow-slate-200/50 flex items-center justify-between">
                        <div className="space-y-1.5">
                           <p className="text-[16px] font-black text-slate-900 tracking-tight leading-none">{item.title}</p>
                           <div className="flex items-center gap-3">
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">RM{item.price}</p>
                              <span className="w-1.5 h-1.5 bg-slate-100 rounded-full" />
                              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{item.stock_count ?? 0} UNITS</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => toggleItemStatus(item.id, item.status)}
                           className={`h-10 px-4 rounded-[14px] text-[10px] font-black uppercase tracking-widest border transition-all ${
                              item.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/10' 
                              : 'bg-slate-50 text-slate-300 border-slate-100'
                           }`}
                        >
                           {item.status === 'active' ? 'Active' : 'Hidden'}
                        </button>
                     </div>
                  ))
               )}
            </div>
         </section>

      </div>

      {/* ── ACTION FAB ── */}
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsCreateOpen(true)}
        className="fixed bottom-32 right-8 w-16 h-16 bg-slate-900 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-slate-900/30 z-40 active:bg-black transition-all"
      >
         <Plus size={28} strokeWidth={3} />
      </motion.button>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t-[0.5px] border-slate-100 pb-10 pt-4 px-12 z-50 flex justify-between items-center shadow-2xl">
         <button onClick={() => router.push('/merchant')} className="flex flex-col items-center gap-1.5">
            <LayoutGrid size={22} className="text-slate-900" strokeWidth={2.5} />
            <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Hub</span>
         </button>
         <button onClick={() => router.push('/me/orders')} className="flex flex-col items-center gap-1.5 opacity-30">
            <ClipboardList size={22} />
            <span className="text-[9px] font-black uppercase tracking-widest">Ledger</span>
         </button>
         <button onClick={() => router.push('/activity')} className="flex flex-col items-center gap-1.5 opacity-30">
            <BarChart3 size={22} />
            <span className="text-[9px] font-black uppercase tracking-widest">Nodes</span>
         </button>
         <button onClick={() => router.push('/me')} className="flex flex-col items-center gap-1.5 opacity-30">
            <User size={22} />
            <span className="text-[9px] font-black uppercase tracking-widest">ID</span>
         </button>
      </nav>

      <AnimatePresence>
        {isCreateOpen && (
          <CreateListing userId={merchant?.uid} role="merchant" onClose={() => setIsCreateOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
