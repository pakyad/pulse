import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Bell, User, LayoutGrid, ClipboardList, Search, Bike, PackageCheck } from 'lucide-react';
import CreateListing from '@/components/CreateListing';

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
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col selection:bg-gray-100 md:hidden">
      
      {/* ── TOP NAV ── */}
      <div className="bg-[#FFFFFF] sticky top-0 z-20 px-6 py-5 flex items-center justify-between border-b-[0.5px] border-slate-100">
        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Terminal</h1>
        <div className="flex items-center gap-4">
           <button className="relative text-slate-900 active:opacity-70 transition-opacity">
              <Bell size={22} />
              {urgentOrders?.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#FFFFFF] rounded-full"></span>}
           </button>
           <div className="w-8 h-8 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border-[0.5px] border-slate-200">
              <span className="text-[13px] font-bold text-slate-900">{merchant?.full_name?.charAt(0) || 'V'}</span>
           </div>
        </div>
      </div>

      <div className="flex-1 pb-32">
         {/* ── METRICS SNAPSHOT ── */}
         <div className="px-6 py-8 bg-slate-50/30">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Revenue</p>
                  <h2 className="text-[22px] font-black text-slate-900 tracking-tight leading-none">RM {revenue.toFixed(2)}</h2>
               </div>
               <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Active</p>
                  <h2 className="text-[22px] font-black text-slate-900 tracking-tight leading-none">{activeOrdersCount}</h2>
               </div>
            </div>
         </div>

         {/* ── ACTION QUEUE ── */}
         <div className="px-6 py-10 space-y-12">
            
            {/* Phase 1: Incoming Orders (The Handshake) */}
            <div>
               <h2 className="text-[18px] font-bold text-slate-900 tracking-tight mb-6 flex items-center gap-2">
                  Needs Attention {urgentOrders?.length > 0 && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-full">{urgentOrders.length}</span>}
               </h2>
               
               <div className="flex flex-col gap-4">
                  {urgentOrders?.length === 0 ? (
                    <p className="text-[14px] text-slate-400 font-medium py-4 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">Zero pending orders</p>
                  ) : urgentOrders.map((o: any) => (
                    <div key={o.id} className="p-6 bg-white rounded-4xl border border-slate-100 shadow-sm">
                       <div className="flex items-center justify-between mb-4">
                          <div>
                             <p className="text-[14px] font-bold text-slate-900 uppercase">#{o.id.substring(0,6)}</p>
                             <p className="text-[12px] font-medium text-slate-400 mt-1">{o.title || "Marketplace Item"}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[15px] font-black text-slate-900">RM {o.price}</p>
                             <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">{o.deliveryType}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => handleAcceptOrder(o.id)}
                         className="w-full h-[56px] bg-slate-100 text-slate-900 rounded-3xl font-bold text-[15px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                       >
                          <PackageCheck size={20} />
                          Accept Order
                       </button>
                    </div>
                  ))}
               </div>
            </div>

            {/* Phase 2: In-Progress (The Logistics Bridge) */}
            <div>
               <h2 className="text-[18px] font-bold text-slate-900 tracking-tight mb-6">In Preparation</h2>
               
               <div className="flex flex-col gap-4">
                  {preparingOrders?.length === 0 ? (
                    <p className="text-[14px] text-slate-400 font-medium py-4 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">No active prep</p>
                  ) : preparingOrders.map((o: any) => (
                    <div key={o.id} className="p-6 bg-white rounded-4xl border border-slate-100 shadow-sm">
                       <div className="flex items-center justify-between mb-4">
                          <div>
                             <p className="text-[14px] font-bold text-slate-900 uppercase">#{o.id.substring(0,6)}</p>
                             <p className="text-[12px] font-medium text-slate-400 mt-1">{o.title || "Marketplace Item"}</p>
                          </div>
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase">Preparing</span>
                       </div>
                       
                       {o.deliveryType === 'RUNNER' ? (
                         <button 
                           onClick={() => handleCallRunner(o.id)}
                           className="w-full h-[56px] bg-slate-900 text-white rounded-3xl font-bold text-[15px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                         >
                            <Bike size={20} />
                            Ready: Call Runner
                         </button>
                       ) : (
                         <button 
                           onClick={() => handleCallRunner(o.id)} // Shared handler for 'Ready'
                           className="w-full h-[56px] bg-emerald-600 text-white rounded-3xl font-bold text-[15px] active:scale-[0.98] transition-all"
                         >
                            Mark Ready
                         </button>
                       )}
                    </div>
                  ))}
               </div>
            </div>

         </div>

         {/* ── INVENTORY ── */}
         <div className="px-6 py-12 bg-slate-50/50">
            <h2 className="text-[18px] font-bold text-slate-900 tracking-tight mb-6">Inventory</h2>
            <div className="flex flex-col space-y-3">
               {topItems?.map((item: any) => (
                 <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                          {item.image_url && <img src={item.image_url} className="w-full h-full object-cover" />}
                       </div>
                       <div>
                          <p className="text-[14px] font-bold text-slate-900">{item.title}</p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">RM {item.price}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[13px] font-black text-slate-900">{item.stock_count || 0}</span>
                       <button 
                          onClick={() => toggleItemStatus(item.id, item.status)}
                          className={`w-10 h-6 rounded-full p-1 transition-colors ${item.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                       >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${item.status === 'active' ? 'translate-x-4' : ''}`} />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* ── CREATE FAB ── */}
      <button 
        onClick={() => setIsCreateOpen(true)}
        className="fixed bottom-28 right-6 w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-2xl active:scale-90 transition-all z-40"
      >
         <Plus size={28} />
      </button>

      {/* ── BOTTOM BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t-[0.5px] border-slate-100 pb-10 pt-4 px-10 z-30 flex justify-between items-center">
         <button onClick={() => router.push('/merchant')} className="flex flex-col items-center gap-1 opacity-100">
            <LayoutGrid size={22} className="text-slate-900" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
         </button>
         <button className="flex flex-col items-center gap-1 opacity-30">
            <ClipboardList size={22} />
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
         </button>
         <button className="flex flex-col items-center gap-1 opacity-30">
            <Search size={22} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Audit</span>
         </button>
         <button className="flex flex-col items-center gap-1 opacity-30">
            <User size={22} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
         </button>
      </div>

      {isCreateOpen && (
        <CreateListing userId={merchant?.uid} role="merchant" onClose={() => setIsCreateOpen(false)} />
      )}
    </div>
  );
}
