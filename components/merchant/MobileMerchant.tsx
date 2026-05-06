import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Bell, User, LayoutGrid, ClipboardList, Settings, LogOut, Search, ChevronRight } from 'lucide-react';
import CreateListing from '@/components/CreateListing';

export default function MobileMerchant({ 
  merchant, 
  revenue, 
  activeOrdersCount, 
  urgentOrders, 
  topItems, 
  recentOrders,
  handleAcceptOrder, 
  toggleItemStatus,
  onViewProof
}: any) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col selection:bg-gray-100 md:hidden">
      
      {/* Top App Bar (Sticky) */}
      <div className="bg-[#FFFFFF] sticky top-0 z-20 px-6 py-5 flex items-center justify-between border-b-[0.5px] border-slate-100">
        <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Pulse Merchant</h1>
        <div className="flex items-center gap-4">
           <button className="relative text-slate-900 active:opacity-70 transition-opacity">
              <Bell size={22} />
              {urgentOrders.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#FFFFFF] rounded-full"></span>}
           </button>
           <div className="w-8 h-8 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border-[0.5px] border-slate-200">
              <span className="text-[13px] font-bold text-slate-900">{merchant?.full_name?.charAt(0) || 'V'}</span>
           </div>
        </div>
      </div>

      <div className="flex-1 pb-24">
         {/* Today's Snapshot */}
         <div className="px-6 py-8 border-b-[0.5px] border-slate-100 bg-slate-50/30">
            <div className="grid grid-cols-2 gap-6">
               <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Today's Revenue</p>
                  <h2 className="text-[24px] font-bold text-slate-900 tracking-tight leading-none">RM {revenue.toFixed(2)}</h2>
               </div>
               <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Active Orders</p>
                  <h2 className="text-[24px] font-bold text-slate-900 tracking-tight leading-none">{activeOrdersCount}</h2>
               </div>
            </div>
         </div>

         {/* Live Action Queue */}
         <div className="px-6 py-10">
            <h2 className="text-[18px] font-bold text-slate-900 tracking-tight mb-6">Needs Attention</h2>
            
            <div className="flex flex-col gap-4">
               {urgentOrders.length === 0 ? (
                 <p className="text-[15px] text-slate-400 font-medium py-2">You're all caught up!</p>
               ) : urgentOrders.map((o: any, idx: number) => (
                 <div key={o.id} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div>
                       <p className="text-[14px] font-bold text-slate-900 tracking-tight uppercase">#{o.id.substring(0,6)}</p>
                       <p className="text-[12px] font-medium text-amber-600 mt-0.5">2 mins ago</p>
                    </div>
                    <button 
                      onClick={() => handleAcceptOrder(o.id)}
                      className="bg-accent text-white text-[13px] font-bold px-6 py-2.5 rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-accent/10"
                    >
                       Accept
                    </button>
                 </div>
               ))}
            </div>
         </div>

         {/* Quick Inventory */}
         <div className="px-6 py-10 bg-slate-50/50">
            <h2 className="text-[18px] font-bold text-slate-900 tracking-tight mb-6">Top Items</h2>
            
          <div className="flex flex-col space-y-4">
               {topItems.map((item: any) => (
                 <div key={item.id} className="flex items-center justify-between bg-white p-5 rounded-4xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="w-[54px] h-[54px] bg-white rounded-3xl flex items-center justify-center shrink-0 border-[0.5px] border-slate-200 overflow-hidden shadow-sm">
                          {item.image_url ? (
                             <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                             <Search size={20} className="text-slate-300" />
                          )}
                       </div>
                       <div>
                          <p className="text-[15px] font-bold text-slate-900 tracking-tight">{item.title}</p>
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-1">RM {item.price}</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                       {/* 🏛️ Stock Editor Module */}
                       <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                          <button 
                            onClick={async () => {
                              const { updateDoc, doc } = await import('firebase/firestore');
                              const newStock = Math.max(0, (item.stock_count || 0) - 1);
                              await updateDoc(doc(db, "items", item.id), { stock_count: newStock });
                            }}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 active:bg-white rounded-xl transition-colors"
                          >
                             -
                          </button>
                          <span className="w-8 text-center text-[13px] font-bold text-slate-900">{item.stock_count || 0}</span>
                          <button 
                            onClick={async () => {
                              const { updateDoc, doc } = await import('firebase/firestore');
                              const newStock = (item.stock_count || 0) + 1;
                              await updateDoc(doc(db, "items", item.id), { stock_count: newStock });
                            }}
                            className="w-8 h-8 flex items-center justify-center text-slate-900 active:bg-white rounded-xl transition-colors"
                          >
                             +
                          </button>
                       </div>

                       <button 
                         onClick={() => toggleItemStatus(item.id, item.status)}
                         className={`w-[44px] h-[24px] rounded-full p-[2px] transition-colors duration-200 shrink-0 ${item.status === 'active' ? 'bg-emerald-500' : 'bg-slate-200'}`}
                       >
                         <div className={`w-[20px] h-[20px] bg-white rounded-full shadow-sm transform transition-transform duration-200 ${item.status === 'active' ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Recent History */}
         <div className="px-6 py-12">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Recent History</h2>
               <button className="text-[13px] font-semibold text-slate-400">See All</button>
            </div>
            
            <div className="flex flex-col space-y-4">
               {recentOrders.length === 0 ? (
                 <p className="text-[15px] text-slate-400 font-medium">No order history yet.</p>
               ) : recentOrders.map((o: any) => (
                 <div key={o.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-4xl border border-slate-100 active:scale-[0.98] transition-transform" onClick={() => onViewProof(o)}>
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-3xl flex items-center justify-center ${o.status === 'DELIVERED' || o.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-900'}`}>
                          <ClipboardList size={20} />
                       </div>
                       <div>
                          <p className="text-[14px] font-bold text-slate-900 uppercase tracking-wide">#{o.id.substring(0,6)}</p>
                          <p className="text-[12px] font-semibold text-slate-400 mt-0.5 uppercase tracking-widest">{o.status}</p>
                       </div>
                    </div>
                    {o.proofOfDeliveryUrl && (
                       <div className="w-8 h-8 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                          <span className="text-[10px] font-bold">PDF</span>
                       </div>
                    )}
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* ── CREATE LISTING TRIGGER (FAB) ── */}
      <div className="fixed bottom-28 right-6 z-40">
         <button 
           onClick={() => setIsCreateOpen(true)}
           className="w-16 h-16 bg-accent text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-accent/40 active:scale-90 transition-all border border-white/10 group"
         >
            <Plus size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
         </button>
      </div>

      {/* Bottom Navigation Bar (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t-[0.5px] border-slate-100 pb-8 pt-4 px-8 z-30">
         <div className="flex items-center justify-between max-w-md mx-auto">
            <button onClick={() => router.push('/merchant')} className="flex flex-col items-center gap-1.5 min-w-[64px]">
               <LayoutGrid size={22} className="text-slate-900" />
               <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 min-w-[64px]">
               <ClipboardList size={22} className="text-slate-400" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Orders</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 min-w-[64px]">
               <Search size={22} className="text-slate-400" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Explore</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 min-w-[64px]">
               <User size={22} className="text-slate-400" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile</span>
            </button>
         </div>
      </div>

      {/* ── MODAL LAYER ── */}
      {isCreateOpen && (
        <CreateListing 
          userId={merchant?.uid} 
          role="merchant" 
          onClose={() => setIsCreateOpen(false)} 
        />
      )}

    </div>
  );
}
