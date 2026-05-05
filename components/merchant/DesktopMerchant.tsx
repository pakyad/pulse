import React from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Plus, Bell, LogOut, LayoutGrid, Package, BarChart3, Settings, Search } from 'lucide-react';
import CreateListing from '@/components/CreateListing';

export default function DesktopMerchant({ 
  merchant, 
  revenue, 
  activeOrdersCount, 
  attentionCount, 
  recentOrders 
}: any) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex selection:bg-gray-100 hidden md:flex">
      
      {/* ── Fixed Sidebar (Column 1) ── */}
      <aside className="w-64 h-screen bg-[#FFFFFF] border-r-[0.5px] border-[#E5E5EA] fixed left-0 top-0 flex flex-col z-30">
        
        {/* Header */}
        <div className="px-6 py-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
             <span className="text-white font-black text-[14px]">P</span>
          </div>
          <h1 className="text-[24px] font-bold text-[#1C1C1E] tracking-tight">Pulse</h1>
        </div>

        {/* Directory Links */}
        <nav className="flex-1 px-4 py-2 space-y-1.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#F2F2F7] text-[#1C1C1E] rounded-xl transition-colors group">
            <LayoutGrid size={20} />
            <span className="text-[15px] font-bold tracking-[-0.24px]">Overview</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium">
            <Bell size={20} />
            <span className="text-[15px] tracking-[-0.24px]">Live Orders</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium">
            <Package size={20} />
            <span className="text-[15px] tracking-[-0.24px]">Products</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium">
            <BarChart3 size={20} />
            <span className="text-[15px] tracking-[-0.24px]">Analytics</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium">
            <Settings size={20} />
            <span className="text-[15px] tracking-[-0.24px]">Settings</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t-[0.5px] border-[#E5E5EA]">
          <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors font-medium">
            <LogOut size={20} />
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
                <Search size={18} />
              </div>
              <input className="peer h-full w-full outline-none text-[15px] text-[#1C1C1E] pr-2 bg-transparent placeholder-[#AEAEB2]" type="text" id="search" placeholder="Search orders, products..." /> 
            </div>
          </div>

           {/* Right Actions */}
          <div className="flex items-center gap-5 ml-4">
             <button 
               onClick={() => setIsCreateOpen(true)}
               className="h-10 px-6 bg-black text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-800 transition-all shadow-sm flex items-center gap-2"
             >
                <Plus size={16} strokeWidth={3} /> Post Listing
             </button>

             <button className="relative text-[#8E8E93] hover:text-[#1C1C1E] transition-colors">
                <Bell size={20} />
                {attentionCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#FFFFFF] rounded-full"></span>}
             </button>
             <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center border-[0.5px] border-[#E5E5EA] overflow-hidden cursor-pointer shadow-sm">
                <span className="text-[14px] font-bold text-gray-900">{merchant?.full_name?.charAt(0) || 'V'}</span>
             </div>
          </div>
        </div>

        {/* Dashboard Grid Container */}
        <div className="p-8 space-y-6 max-w-[1200px] w-full">
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#FFFFFF] p-6 rounded-[22px] border-[0.5px] border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[13px] font-medium text-[#8E8E93] mb-1">Total Revenue</p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-[32px] font-bold text-[#1C1C1E] tracking-tight leading-none">RM {revenue.toFixed(2)}</h2>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-[2px] rounded-md tracking-wide">+12% this week</span>
              </div>
            </div>
            
            <div className="bg-[#FFFFFF] p-6 rounded-[22px] border-[0.5px] border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[13px] font-medium text-[#8E8E93] mb-1">Active Orders</p>
              <div className="flex items-baseline gap-3">
                 <h2 className="text-[32px] font-bold text-[#1C1C1E] tracking-tight leading-none mb-2">{activeOrdersCount}</h2>
                 <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-[2px] rounded-md tracking-wide">{attentionCount} need attention</span>
              </div>
            </div>

            <div className="bg-[#FFFFFF] p-6 rounded-[22px] border-[0.5px] border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <p className="text-[13px] font-medium text-[#8E8E93] mb-1">Profile Views</p>
              <div className="flex items-baseline gap-3">
                 <h2 className="text-[32px] font-bold text-[#1C1C1E] tracking-tight leading-none mb-2">342</h2>
                 <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-[2px] rounded-md tracking-wide">+5% this week</span>
              </div>
            </div>
          </div>

          {/* Bottom Split (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-[#FFFFFF] p-6 rounded-[22px] border-[0.5px] border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.41px]">Top Products</h3>
                   <button className="text-[13px] font-semibold text-gray-900 hover:opacity-70 transition-opacity">See all</button>
                </div>
                <div className="space-y-5">
                   {[
                     { title: 'MIDI Canvas Tote Bag', sales: 24, revenue: 552 },
                     { title: 'Nasi Lemak Ayam', sales: 18, revenue: 108 },
                     { title: 'Data Comm Notes', sales: 12, revenue: 60 }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-[#F2F2F7] -mx-3 px-3 py-2 rounded-2xl transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="w-[44px] h-[44px] bg-[#F2F2F7] rounded-[14px] border-[0.5px] border-[#E5E5EA] flex items-center justify-center shrink-0">
                              <Package size={20} className="text-[#AEAEB2]" />
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

             <div className="bg-[#FFFFFF] p-6 rounded-[22px] border-[0.5px] border-[#E5E5EA] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.41px]">Live Order Queue</h3>
                   <button className="text-[13px] font-semibold text-gray-900 hover:opacity-70 transition-opacity">View All</button>
                </div>
                <div className="space-y-3">
                   {recentOrders.length === 0 ? (
                     <p className="text-[13px] font-medium text-[#8E8E93] text-center py-6">No recent orders in queue.</p>
                   ) : recentOrders.map((o: any) => (
                     <div key={o.id} className="flex items-center justify-between bg-[#FFFFFF] border-[0.5px] border-[#E5E5EA] p-4 rounded-2xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow cursor-pointer">
                        <div>
                           <p className="text-[14px] font-bold text-[#1C1C1E] uppercase tracking-wide">#{o.id.substring(0,6)}</p>
                           <p className="text-[13px] font-medium text-[#8E8E93] mt-[2px] truncate max-w-[140px]">{o.title}</p>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className={`px-2.5 py-[3px] rounded-md text-[11px] font-bold uppercase tracking-widest ${
                             o.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                           }`}>
                             {o.status === 'PENDING' ? 'Preparing' : 'Ready'}
                           </span>
                           <button className="text-[13px] font-semibold text-[#8E8E93] hover:text-[#1C1C1E] transition-colors">View</button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

      </main>

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
