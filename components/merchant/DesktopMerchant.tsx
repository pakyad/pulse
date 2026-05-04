import React from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

export default function DesktopMerchant({ 
  merchant, 
  revenue, 
  activeOrdersCount, 
  attentionCount, 
  recentOrders 
}: any) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex font-sans selection:bg-teal-100 hidden md:flex">
      
      {/* ── Fixed Sidebar (Column 1) ── */}
      <aside className="w-64 h-screen bg-[#FFFFFF] border-r-[0.5px] border-[#E5E5EA] fixed left-0 top-0 flex flex-col z-30">
        
        {/* Header */}
        <div className="px-6 py-8 flex items-center gap-2">
          <h1 className="text-[24px] font-bold text-[#1C1C1E] tracking-tight">Pulse</h1>
          <span className="text-[10px] font-bold bg-[#F2F2F7] text-[#8E8E93] px-2 py-[2px] rounded-full uppercase tracking-widest">Merchant</span>
        </div>

        {/* Directory Links */}
        <nav className="flex-1 px-4 py-2 space-y-1.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#F2F2F7] text-[#1C1C1E] rounded-xl transition-colors group">
            <svg className="w-5 h-5 text-[#1C1C1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-[15px] font-bold tracking-[-0.24px]">Overview</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            <span className="text-[15px] tracking-[-0.24px]">Live Orders</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <span className="text-[15px] tracking-[-0.24px]">Products</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-[15px] tracking-[-0.24px]">Analytics</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-[15px] tracking-[-0.24px]">Settings</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t-[0.5px] border-[#E5E5EA]">
          <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="text-[15px] tracking-[-0.24px]">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area (Column 2) ── */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        
        {/* Sticky Top Bar */}
        <div className="bg-[#FFFFFF] sticky top-0 z-20 px-8 py-4 flex items-center justify-between border-b-[0.5px] border-[#E5E5EA] shadow-[0_2px_10px_rgba(0,0,0,0.015)]">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative flex items-center w-full h-10 rounded-xl bg-[#F2F2F7] overflow-hidden border-[0.5px] border-transparent focus-within:border-[#E5E5EA] focus-within:bg-[#FFFFFF] transition-all">
              <div className="grid place-items-center h-full w-12 text-[#8E8E93]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input className="peer h-full w-full outline-none text-[15px] text-[#1C1C1E] pr-2 bg-transparent placeholder-[#AEAEB2]" type="text" id="search" placeholder="Search orders, products..." /> 
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-5 ml-4">
             <button className="relative text-[#8E8E93] hover:text-[#1C1C1E] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {attentionCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#FFFFFF] rounded-full"></span>}
             </button>
             <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center border-[0.5px] border-[#E5E5EA] overflow-hidden cursor-pointer shadow-sm">
                <span className="text-[14px] font-bold text-teal-700">{merchant?.full_name?.charAt(0) || 'V'}</span>
             </div>
          </div>
        </div>

        {/* Dashboard Grid Container */}
        <div className="p-8 space-y-6 max-w-[1200px] w-full">
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#FFFFFF] p-6 rounded-[16px] border-[0.5px] border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[13px] font-medium text-[#8E8E93] mb-1">Total Revenue</p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-[32px] font-bold text-[#1C1C1E] tracking-tight leading-none">RM {revenue.toFixed(2)}</h2>
                <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-[2px] rounded-md tracking-wide">+12% this week</span>
              </div>
            </div>
            
            <div className="bg-[#FFFFFF] p-6 rounded-[16px] border-[0.5px] border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[13px] font-medium text-[#8E8E93] mb-1">Active Orders</p>
              <div className="flex items-baseline gap-3">
                 <h2 className="text-[32px] font-bold text-[#1C1C1E] tracking-tight leading-none mb-2">{activeOrdersCount}</h2>
                 <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-[2px] rounded-md tracking-wide">{attentionCount} need attention</span>
              </div>
            </div>

            <div className="bg-[#FFFFFF] p-6 rounded-[16px] border-[0.5px] border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[13px] font-medium text-[#8E8E93] mb-1">Profile Views</p>
              <div className="flex items-baseline gap-3">
                 <h2 className="text-[32px] font-bold text-[#1C1C1E] tracking-tight leading-none mb-2">342</h2>
                 <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-[2px] rounded-md tracking-wide">+5% this week</span>
              </div>
            </div>
          </div>

          {/* Analytics Chart */}
          <div className="bg-[#FFFFFF] p-6 rounded-[16px] border-[0.5px] border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
             <h3 className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.41px] mb-8">Revenue Overview</h3>
             <div className="h-48 flex items-end justify-between gap-4 border-b-[0.5px] border-[#E5E5EA] pb-3">
                <div className="flex-1 flex flex-col items-center gap-3 group">
                   <div className="w-full h-[40%] bg-teal-100 group-hover:bg-teal-500 rounded-t-[6px] transition-all relative">
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[#1C1C1E] opacity-0 group-hover:opacity-100 transition-opacity">RM40</span>
                   </div>
                   <span className="text-[11px] font-medium text-[#8E8E93]">Mon</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-3 group">
                   <div className="w-full h-[70%] bg-teal-100 group-hover:bg-teal-500 rounded-t-[6px] transition-all relative">
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[#1C1C1E] opacity-0 group-hover:opacity-100 transition-opacity">RM70</span>
                   </div>
                   <span className="text-[11px] font-medium text-[#8E8E93]">Tue</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-3 group">
                   <div className="w-full h-[50%] bg-teal-100 group-hover:bg-teal-500 rounded-t-[6px] transition-all relative">
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[#1C1C1E] opacity-0 group-hover:opacity-100 transition-opacity">RM50</span>
                   </div>
                   <span className="text-[11px] font-medium text-[#8E8E93]">Wed</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-3 group">
                   <div className="w-full h-[85%] bg-teal-500 rounded-t-[6px] transition-all relative">
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[#1C1C1E] opacity-0 group-hover:opacity-100 transition-opacity">RM85</span>
                   </div>
                   <span className="text-[11px] font-bold text-[#1C1C1E]">Thu</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-3 group">
                   <div className="w-full h-[60%] bg-teal-100 group-hover:bg-teal-500 rounded-t-[6px] transition-all relative">
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[#1C1C1E] opacity-0 group-hover:opacity-100 transition-opacity">RM60</span>
                   </div>
                   <span className="text-[11px] font-medium text-[#8E8E93]">Fri</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-3 group">
                   <div className="w-full h-[100%] bg-teal-100 group-hover:bg-teal-500 rounded-t-[6px] transition-all relative">
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[#1C1C1E] opacity-0 group-hover:opacity-100 transition-opacity">RM100</span>
                   </div>
                   <span className="text-[11px] font-medium text-[#8E8E93]">Sat</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-3 group">
                   <div className="w-full h-[30%] bg-teal-100 group-hover:bg-teal-500 rounded-t-[6px] transition-all relative">
                      <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[#1C1C1E] opacity-0 group-hover:opacity-100 transition-opacity">RM30</span>
                   </div>
                   <span className="text-[11px] font-medium text-[#8E8E93]">Sun</span>
                </div>
             </div>
          </div>

          {/* Bottom Split (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-[#FFFFFF] p-6 rounded-[16px] border-[0.5px] border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.41px]">Top Products</h3>
                   <button className="text-[13px] font-semibold text-teal-600 hover:text-teal-700 transition-colors">See all</button>
                </div>
                <div className="space-y-5">
                   {[
                     { title: 'MIDI Canvas Tote Bag', sales: 24, revenue: 552 },
                     { title: 'Nasi Lemak Ayam', sales: 18, revenue: 108 },
                     { title: 'Data Comm Notes', sales: 12, revenue: 60 }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-[#F2F2F7] -mx-3 px-3 py-2 rounded-xl transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="w-[44px] h-[44px] bg-[#F2F2F7] rounded-[10px] border-[0.5px] border-[#E5E5EA] flex items-center justify-center shrink-0">
                              <svg className="w-5 h-5 text-[#AEAEB2]" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                           </div>
                           <div className="min-w-0 pr-4">
                              <p className="text-[15px] font-semibold text-[#1C1C1E] tracking-[-0.24px] truncate">{item.title}</p>
                              <p className="text-[13px] font-medium text-[#8E8E93] mt-[2px]">{item.sales} sold</p>
                           </div>
                        </div>
                        <p className="text-[15px] font-bold text-[#1C1C1E]">RM {item.revenue.toFixed(2)}</p>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-[#FFFFFF] p-6 rounded-[16px] border-[0.5px] border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.41px]">Live Order Queue</h3>
                   <button className="text-[13px] font-semibold text-teal-600 hover:text-teal-700 transition-colors">View All</button>
                </div>
                <div className="space-y-3">
                   {recentOrders.length === 0 ? (
                     <p className="text-[13px] font-medium text-[#8E8E93] text-center py-6">No recent orders in queue.</p>
                   ) : recentOrders.map((o: any) => (
                     <div key={o.id} className="flex items-center justify-between bg-[#FFFFFF] border-[0.5px] border-[#E5E5EA] p-4 rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow cursor-pointer">
                        <div>
                           <p className="text-[14px] font-bold text-[#1C1C1E] uppercase tracking-wide">#{o.id.substring(0,6)}</p>
                           <p className="text-[13px] font-medium text-[#8E8E93] mt-[2px] truncate max-w-[140px]">{o.title}</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className={`px-2.5 py-[3px] rounded-md text-[11px] font-bold uppercase tracking-widest ${
                             o.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'
                           }`}>
                             {o.status === 'PENDING' ? 'Preparing' : 'Ready'}
                           </span>
                           <button className="text-[13px] font-semibold text-[#8E8E93] hover:text-[#1C1C1E] transition-colors">View</button>
                        </div>
                     </div>
                   ))}
                   
                   {recentOrders.length < 3 && [1,2,3].slice(recentOrders.length).map((i) => (
                     <div key={`mock-${i}`} className="flex items-center justify-between bg-[#FFFFFF] border-[0.5px] border-[#E5E5EA] p-4 rounded-xl">
                        <div>
                           <p className="text-[14px] font-bold text-[#1C1C1E] uppercase tracking-wide">#MOCK{i}X</p>
                           <p className="text-[13px] font-medium text-[#8E8E93] mt-[2px] truncate max-w-[140px]">Campus Graphic Tee</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="px-2.5 py-[3px] rounded-md text-[11px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600">Preparing</span>
                           <button className="text-[13px] font-semibold text-[#8E8E93] hover:text-[#1C1C1E] transition-colors">View</button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

          </div>
        </div>

      </main>
    </div>
  );
}
