import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Bell, User, LayoutGrid, ClipboardList, BarChart3, Bike, PackageCheck, Info } from 'lucide-react';
import CreateListing from '@/components/CreateListing';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

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
    <div className="min-h-screen bg-white flex flex-col text-slate-900 selection:bg-blue-100 md:hidden pb-32">
      
      {/* ── HEADER ── */}
      <header className="px-6 py-6 border-b border-slate-100 sticky top-0 bg-white z-30">
        <div className="flex items-center justify-between">
           <div>
              <h1 className="text-[20px] font-bold text-slate-900">{merchant?.full_name || 'Merchant Terminal'}</h1>
              <p className="text-[12px] text-slate-500 mt-0.5">Active Session Registry</p>
           </div>
           <div className="flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-slate-900 relative">
                 <Bell size={20} />
                 {urgentOrders?.length > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>}
              </button>
               <AvatarDropdown 
                  photoUrl={merchant?.photo_url} 
                  userName={merchant?.full_name || 'Merchant'} 
               />
           </div>
        </div>
      </header>

      <div className="flex-1 space-y-10 py-8">
         
         {/* ── STATUS OVERVIEW ── */}
         <section className="px-6 space-y-4">
            <div className="flex items-center gap-2">
               <Info size={12} className="text-slate-400" />
               <p className="text-[10px] font-medium text-slate-400">Node metrics track live liquidity and fulfillment tasks for the current session.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 border border-slate-100 rounded-xl">
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">Total Balance</p>
                  <p className="text-[24px] font-bold text-slate-900 mt-1 tracking-tight">RM {revenue.toFixed(2)}</p>
               </div>
               <div className="p-4 border border-slate-100 rounded-xl">
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">Active Tasks</p>
                  <p className="text-[24px] font-bold text-slate-900 mt-1 tracking-tight">{activeOrdersCount}</p>
               </div>
            </div>
         </section>

         {/* ── PENDING ACTIONS ── */}
         <section className="px-6 space-y-4">
            <div className="flex items-center justify-between">
               <h2 className="text-[14px] font-bold text-slate-900 flex items-center gap-2">
                  Pending Acceptance
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">{urgentOrders?.length || 0}</span>
               </h2>
            </div>
            <div className="flex items-center gap-2">
               <Info size={12} className="text-slate-400" />
               <p className="text-[10px] font-medium text-slate-400 italic">Instruction: Fulfill pending requests immediately to avoid reputation decay.</p>
            </div>
            
            {urgentOrders?.length === 0 ? (
               <div className="py-12 border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-400">
                  <PackageCheck size={24} />
                  <p className="text-[12px] mt-2 font-medium">No pending requests</p>
               </div>
            ) : (
               <div className="space-y-3">
                  {urgentOrders.map((o: any) => (
                    <div key={o.id} className="p-5 border border-slate-100 rounded-xl space-y-4">
                       <div className="flex justify-between items-start">
                          <div>
                             <p className="text-[11px] text-slate-400 font-mono">ID: {o.id.substring(0,8).toUpperCase()}</p>
                             <h3 className="text-[16px] font-bold text-slate-900 mt-1 tracking-tight">{o.title}</h3>
                          </div>
                          <p className="text-[16px] font-bold text-slate-900">RM {o.price}</p>
                       </div>
                       <button 
                          onClick={() => handleAcceptOrder(o.id)}
                          className="w-full h-12 bg-blue-600 text-white rounded-lg font-bold text-[14px] active:bg-blue-700 transition-colors shadow-sm"
                       >
                          Accept Order
                       </button>
                    </div>
                  ))}
               </div>
            )}
         </section>

         {/* ── ACTIVE PIPELINE ── */}
         <section className="px-6 space-y-4">
            <h2 className="text-[14px] font-bold text-slate-900">In Preparation</h2>
            <div className="flex items-center gap-2">
               <Info size={12} className="text-slate-400" />
               <p className="text-[10px] font-medium text-slate-400 italic">Directive: Signals runners for pickup once prep is finalized.</p>
            </div>
            <div className="space-y-2">
               {preparingOrders?.length === 0 ? (
                  <p className="text-[12px] text-slate-400 italic py-4">No orders currently in preparation.</p>
               ) : (
                  preparingOrders.map((o: any) => (
                     <div key={o.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                        <div>
                           <p className="text-[13px] font-bold text-slate-900 tracking-tight">{o.title}</p>
                           <p className="text-[11px] text-blue-600 font-medium mt-1 uppercase tracking-tight">Status: {o.status.replace('_', ' ')}</p>
                        </div>
                        <button 
                           onClick={() => handleCallRunner(o.id)}
                           disabled={o.status === 'AWAITING_RUNNER'}
                           className={`px-4 h-10 rounded-lg text-[12px] font-bold transition-all ${
                              o.status === 'AWAITING_RUNNER' 
                              ? 'bg-slate-50 text-slate-400 border border-slate-100' 
                              : 'bg-slate-900 text-white active:bg-black'
                           }`}
                        >
                           {o.status === 'AWAITING_RUNNER' ? 'Awaiting Pickup' : 'Ready for Runner'}
                        </button>
                     </div>
                  ))
               )}
            </div>
         </section>

         {/* ── SYSTEM DIRECTIVES (BOOST) ── */}
         <section className="px-6 space-y-4">
            <h2 className="text-[14px] font-bold text-slate-900">System Directives: Boost Registry</h2>
            <div className="flex items-center gap-2">
               <Info size={12} className="text-slate-400" />
               <p className="text-[10px] font-medium text-slate-400 italic">Instruction: Complete directives to unlock elite institutional status.</p>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/30">
               {[
                  { id: 'verify', title: 'Path to Verified Elite', text: 'Submit your student ID and store permit to the Pulse Registry to unlock higher transaction limits and the blue shield badge.' },
                  { id: 'assets', title: 'Asset Visibility Mastery', text: 'Use high-resolution 1:1 aspect ratio images and clear, descriptive titles starting with keywords to appear first in search nodes.' },
                  { id: 'logistics', title: 'Logistics Synergy', text: 'Keep prep time under 10 minutes to maintain a high reliability score, making your tasks prioritized on the Runner Radar.' }
               ].map((tip, idx) => {
                  const [isOpen, setIsOpen] = React.useState(false);
                  return (
                     <div key={tip.id} className={`border-b border-slate-100 last:border-0 ${isOpen ? 'bg-white' : ''}`}>
                        <button 
                           onClick={() => setIsOpen(!isOpen)}
                           className="w-full px-5 py-4 flex items-center justify-between text-left transition-colors"
                        >
                           <span className="text-[13px] font-bold text-slate-900">{tip.title}</span>
                           <Plus size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
                        </button>
                        {isOpen && (
                           <div className="px-5 pb-5 animate-in slide-in-from-top-1 duration-200">
                              <p className="text-[12px] text-slate-500 leading-relaxed font-medium">{tip.text}</p>
                              <button className="mt-3 text-[11px] font-bold text-blue-600 hover:underline">Apply Directive →</button>
                           </div>
                        )}
                     </div>
                  );
               })}
            </div>
         </section>

         {/* ── INVENTORY MANAGEMENT ── */}
         <section className="px-6 space-y-4">
            <h2 className="text-[14px] font-bold text-slate-900">Asset Management</h2>
            <div className="flex items-center gap-2">
               <Info size={12} className="text-slate-400" />
               <p className="text-[10px] font-medium text-slate-400 italic">Directive: Monitor asset status to control marketplace liquidity.</p>
            </div>
            <div className="space-y-3">
               {topItems?.length === 0 ? (
                  <p className="text-[12px] text-slate-400 italic">No assets registered in this node.</p>
               ) : (
                  topItems.map((item: any) => (
                     <div key={item.id} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm flex items-center justify-between">
                        <div>
                           <p className="text-[13px] font-bold text-slate-900">{item.title}</p>
                           <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">RM {item.price}</p>
                        </div>
                        <button 
                           onClick={() => toggleItemStatus(item.id, item.status)}
                           className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${
                              item.status === 'ACTIVE' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-slate-50 text-slate-400 border-slate-100'
                           }`}
                        >
                           {item.status}
                        </button>
                     </div>
                  ))
               )}
            </div>
         </section>

      </div>

      {/* ── ACTION FAB ── */}
      <button 
        onClick={() => setIsCreateOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg active:bg-blue-700 transition-all z-40"
      >
         <Plus size={24} />
      </button>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pb-8 pt-3 px-10 z-30 flex justify-between items-center shadow-sm">
         <button onClick={() => router.push('/merchant')} className="flex flex-col items-center gap-1">
            <LayoutGrid size={20} className="text-blue-600" />
            <span className="text-[10px] font-bold text-blue-600">Dashboard</span>
         </button>
         <button onClick={() => router.push('/me/orders')} className="flex flex-col items-center gap-1 group">
            <ClipboardList size={20} className="text-slate-400 group-active:text-blue-600 transition-colors" />
            <span className="text-[10px] font-bold text-slate-400 group-active:text-blue-600">History</span>
         </button>
         <button onClick={() => router.push('/activity')} className="flex flex-col items-center gap-1 group">
            <BarChart3 size={20} className="text-slate-400 group-active:text-blue-600 transition-colors" />
            <span className="text-[10px] font-bold text-slate-400 group-active:text-blue-600">Insights</span>
         </button>
         <button onClick={() => router.push('/me')} className="flex flex-col items-center gap-1 group">
            <User size={20} className="text-slate-400 group-active:text-blue-600 transition-colors" />
            <span className="text-[10px] font-bold text-slate-400 group-active:text-blue-600">Account</span>
         </button>
      </nav>

      {isCreateOpen && (
        <CreateListing userId={merchant?.uid} role="merchant" onClose={() => setIsCreateOpen(false)} />
      )}
    </div>
  );
}
