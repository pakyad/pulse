import React from 'react';
import { useRouter } from 'next/navigation';

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

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans selection:bg-[#F2F2F7] md:hidden">
      
      {/* Top App Bar (Sticky) */}
      <div className="bg-[#FFFFFF] sticky top-0 z-20 px-5 py-4 flex items-center justify-between border-b-[0.5px] border-[#E5E5EA]">
        <h1 className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Pulse Merchant</h1>
        <div className="flex items-center gap-4">
           <button className="relative text-[#1C1C1E] active:opacity-70 transition-opacity">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
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

               {urgentOrders.length < 2 && [1].slice(urgentOrders.length).map((i) => (
                 <div key={`mock-${i}`} className="flex items-center justify-between py-4 border-b-[0.5px] border-[#F2F2F7]">
                    <div>
                       <p className="text-[15px] font-bold text-[#1C1C1E] tracking-tight uppercase">#9MXK2P</p>
                       <p className="text-[13px] font-medium text-amber-600 mt-1">2 mins ago</p>
                    </div>
                    <button className="bg-[#1C1C1E] text-white text-[14px] font-bold px-5 py-2.5 rounded-full active:scale-95 transition-transform">
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
                       <div className="w-[48px] h-[48px] bg-[#F2F2F7] rounded-[12px] flex items-center justify-center shrink-0 border-[0.5px] border-[#E5E5EA] overflow-hidden">
                          {item.image_url ? (
                             <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                             <svg className="w-6 h-6 text-[#C7C7CC]" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
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

               {topItems.length === 0 && (
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-[48px] h-[48px] bg-[#F2F2F7] rounded-[12px] flex items-center justify-center shrink-0 border-[0.5px] border-[#E5E5EA]">
                          <svg className="w-6 h-6 text-[#C7C7CC]" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                       </div>
                       <div>
                          <p className="text-[15px] font-bold text-[#1C1C1E] tracking-tight">MIDI Canvas Tote Bag</p>
                          <p className="text-[13px] font-medium text-[#8E8E93] mt-0.5">5 left</p>
                       </div>
                    </div>
                    <div className="w-[51px] h-[31px] rounded-full p-[2px] bg-[#34C759] transition-colors duration-200 ease-in-out cursor-pointer shrink-0">
                      <div className="w-[27px] h-[27px] bg-white rounded-full shadow-[0_3px_8px_rgba(0,0,0,0.15)] transform translate-x-[20px] transition-transform duration-200 ease-in-out" />
                    </div>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* Bottom Navigation Bar (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t-[0.5px] border-[#E5E5EA] pb-8 pt-3 px-6 z-30">
         <div className="flex items-center justify-between max-w-md mx-auto">
            <button onClick={() => router.push('/merchant')} className="flex flex-col items-center gap-1 min-w-[64px]">
               <svg className="w-[24px] h-[24px] text-[#1C1C1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
               <span className="text-[10px] font-bold text-[#1C1C1E]">Home</span>
            </button>
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <svg className="w-[24px] h-[24px] text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
               <span className="text-[10px] font-bold text-[#8E8E93]">Orders</span>
            </button>
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <svg className="w-[24px] h-[24px] text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
               <span className="text-[10px] font-bold text-[#8E8E93]">Menu</span>
            </button>
            <button className="flex flex-col items-center gap-1 min-w-[64px]">
               <svg className="w-[24px] h-[24px] text-[#8E8E93]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               <span className="text-[10px] font-bold text-[#8E8E93]">Profile</span>
            </button>
         </div>
      </div>

    </div>
  );
}
