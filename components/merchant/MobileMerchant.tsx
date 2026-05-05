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
  handleAcceptOrder, 
  toggleItemStatus 
}: any) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col selection:bg-gray-100 md:hidden">
      
      {/* Top App Bar (Sticky) */}
      <div className="bg-[#FFFFFF] sticky top-0 z-20 px-5 py-4 flex items-center justify-between border-b-[0.5px] border-[#E5E5EA]">
        <h1 className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Pulse Merchant</h1>
        <div className="flex items-center gap-4">
           <button className="relative text-[#1C1C1E] active:opacity-70 transition-opacity">
              <Bell size={22} />
              {urgentOrders.length > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#FFFFFF] rounded-full"></span>}
           </button>
           <div className="w-8 h-8 bg-[#F2F2F7] rounded-full flex items-center justify-center overflow-hidden border-[0.5px] border-[#E5E5EA]">
              <span className="text-[13px] font-bold text-[#1C1C1E]">{merchant?.full_name?.charAt(0) || 'V'}</span>
           </div>
        </div>
      </div>

      <div className="flex-1 pb-24">
         {/* Today's Snapshot */}
         <div className="px-5 py-6 border-b-[0.5px] border-[#E5E5EA]">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[13px] font-medium text-[#8E8E93] mb-1">Today's Revenue</p>
                  <h2 className="text-[24px] font-bold text-[#1C1C1E] tracking-tight leading-none">RM {revenue.toFixed(2)}</h2>
               </div>
               <div>
                  <p className="text-[13px] font-medium text-[#8E8E93] mb-1">Active Orders</p>
                  <h2 className="text-[24px] font-bold text-[#1C1C1E] tracking-tight leading-none">{activeOrdersCount}</h2>
               </div>
            </div>
         </div>

         {/* Live Action Queue */}
         <div className="px-5 py-8 border-b-[0.5px] border-[#E5E5EA]">
            <h2 className="text-[18px] font-bold text-[#1C1C1E] tracking-tight mb-5">Needs Attention</h2>
            
            <div className="flex flex-col">
               {urgentOrders.length === 0 ? (
                 <p className="text-[15px] text-[#8E8E93] font-medium py-2">You're all caught up!</p>
               ) : urgentOrders.map((o: any, idx: number) => (
                 <div key={o.id} className={`flex items-center justify-between py-4 ${idx !== urgentOrders.length - 1 ? 'border-b-[0.5px] border-[#F2F2F7]' : ''}`}>
                    <div>
                       <p className="text-[15px] font-bold text-[#1C1C1E] tracking-tight uppercase">#{o.id.substring(0,6)}</p>
                       <p className="text-[13px] font-medium text-amber-600 mt-1">2 mins ago</p>
                    </div>
                    <button 
                      onClick={() => handleAcceptOrder(o.id)}
                      className="bg-[#1C1C1E] text-white text-[14px] font-bold px-5 py-2.5 rounded-full active:scale-95 transition-transform"
                    >
                       Accept
                    </button>
                 </div>
               ))}
            </div>
         </div>

         {/* Quick Inventory */}
         <div className="px-5 py-8">
            <h2 className="text-[18px] font-bold text-[#1C1C1E] tracking-tight mb-5">Top Items</h2>
            
            <div className="flex flex-col space-y-6">
               {topItems.map((item: any) => (
                 <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-[48px] h-[48px] bg-[#F2F2F7] rounded-2xl flex items-center justify-center shrink-0 border-[0.5px] border-[#E5E5EA] overflow-hidden">
                          {item.image_url ? (
                             <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                             <Search size={20} className="text-[#C7C7CC]" />
                          )}
                       </div>
                       <div>
                          <p className="text-[15px] font-bold text-[#1C1C1E] tracking-tight">{item.title}</p>
                          <p className="text-[13px] font-medium text-[#8E8E93] mt-0.5">{item.stock_count || 0} left</p>
                       </div>
                    </div>
                    
                    <button 
                      onClick={() => toggleItemStatus(item.id, item.status)}
                      className={`w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-200 ease-in-out shrink-0 ${item.status === 'active' ? 'bg-[#34C759]' : 'bg-[#E5E5EA]'}`}
                    >
                      <div className={`w-[27px] h-[27px] bg-white rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15)] transform transition-transform duration-200 ease-in-out ${item.status === 'active' ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                    </button>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* ── CREATE LISTING TRIGGER (FAB) ── */}
      <div className="fixed bottom-28 right-6 z-40">
         <button 
           onClick={() => setIsCreateOpen(true)}
           className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl shadow-black/30 active:scale-90 transition-all border border-white/10 group"
         >
            <Plus size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
         </button>
      </div>

      {/* Bottom Navigation Bar (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t-[0.5px] border-[#E5E5EA] pb-8 pt-3 px-6 z-30">
         <div className="flex items-center justify-between max-w-md mx-auto">
            <button onClick={() => router.push('/merchant')} className="flex flex-col items-center gap-1 min-w-[64px]">
               <LayoutGrid size={22} className="text-[#1C1C1E]" />
               <span className="text-[10px] font-bold text-[#1C1C1E]">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <ClipboardList size={22} className="text-[#8E8E93]" />
               <span className="text-[10px] font-bold text-[#8E8E93]">Orders</span>
            </button>
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <Search size={22} className="text-[#8E8E93]" />
               <span className="text-[10px] font-bold text-[#8E8E93]">Explore</span>
            </button>
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <User size={22} className="text-[#8E8E93]" />
               <span className="text-[10px] font-bold text-[#8E8E93]">Profile</span>
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
