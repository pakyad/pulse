import React from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Plus, Bell, LogOut, LayoutGrid, Package, BarChart3, Settings, Search, Info } from 'lucide-react';
import CreateListing from '@/components/CreateListing';

export default function DesktopMerchant({ 
  merchant, 
  revenue, 
  activeOrdersCount, 
  attentionCount, 
  recentOrders,
  onViewProof
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
          <button 
            onClick={() => router.push('/merchant')}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-600 rounded-xl transition-colors group"
          >
            <LayoutGrid size={20} />
            <span className="text-[15px] font-bold tracking-[-0.24px]">Overview</span>
          </button>
          
          <button 
            onClick={() => router.push('/orders')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium group"
          >
            <Bell size={20} />
            <span className="text-[15px] tracking-[-0.24px]">Live Orders</span>
          </button>
          <button 
            onClick={() => router.push('/marketplace')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium group"
          >
            <Package size={20} />
            <span className="text-[15px] tracking-[-0.24px]">Products</span>
          </button>
          <button 
            onClick={() => router.push('/activity')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium group"
          >
            <BarChart3 size={20} />
            <span className="text-[15px] tracking-[-0.24px]">Analytics</span>
          </button>
          <button 
            onClick={() => router.push('/me/edit')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium group"
          >
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

      {/* ── Main Content Area ── */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen bg-white text-slate-900">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-10 py-6 flex items-center justify-between sticky top-0 z-30">
          <div>
             <h1 className="text-[20px] font-bold text-slate-900">Merchant Dashboard</h1>
             <p className="text-[13px] text-slate-500 mt-1">Operational Oversight: {merchant?.full_name}</p>
          </div>

          <div className="flex items-center gap-6">
             <div className="relative flex items-center w-64 h-10 rounded-md border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
               <div className="px-3 text-slate-400">
                 <Search size={16} />
               </div>
               <input className="h-full w-full outline-none text-[13px] pr-2 bg-transparent placeholder-slate-400" type="text" placeholder="Search entries..." /> 
             </div>

             <button 
               onClick={() => setIsCreateOpen(true)}
               className="h-10 px-6 bg-blue-600 text-white text-[13px] font-bold rounded-md hover:bg-blue-700 transition-all"
             >
                New Entry
             </button>

             <div className="w-px h-6 bg-slate-200" />

             <button className="text-slate-400 hover:text-slate-900">
                <Bell size={20} />
             </button>
             <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-center font-bold text-slate-600">
                {merchant?.full_name?.charAt(0)}
             </div>
          </div>
        </header>

        {/* ── ADMINISTRATIVE VIEW ── */}
        <div className="p-10 space-y-12">
          
          {/* Key Indicators */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
               <Info size={14} className="text-slate-400" />
               <p className="text-[11px] font-medium text-slate-400 italic">Institutional Metrics: Node tracking live liquidity and fulfillment status for {merchant?.full_name}.</p>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                 <p className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">Total Revenue</p>
                 <h2 className="text-[28px] font-bold text-slate-900 mt-2">RM {revenue.toFixed(2)}</h2>
              </div>
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                 <p className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">Active Directives</p>
                 <h2 className="text-[28px] font-bold text-slate-900 mt-2">{activeOrdersCount}</h2>
              </div>
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                 <p className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">System Reach</p>
                 <h2 className="text-[28px] font-bold text-slate-900 mt-2">Institutional</h2>
              </div>
            </div>
          </section>

          {/* Data Tables */}
          <div className="grid grid-cols-1 gap-12">
             
             {/* Pending Acceptance List */}
             <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <h3 className="text-[14px] font-bold text-slate-900">Pending Actions</h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                         <Info size={12} /> Fulfill records to maintain merit score.
                      </div>
                   </div>
                   <span className="text-[12px] text-blue-600 font-bold">{recentOrders.filter((o: any) => o.status === 'PENDING_VENDOR').length} Required</span>
                </div>
                
                <div className="divide-y divide-slate-100">
                   {recentOrders.filter((o: any) => o.status === 'PENDING_VENDOR').length === 0 ? (
                     <p className="p-10 text-center text-slate-400 italic text-[13px]">No pending records found in the current session.</p>
                   ) : recentOrders.filter((o: any) => o.status === 'PENDING_VENDOR').map((o: any) => (
                     <div key={o.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                        <div className="space-y-1">
                           <p className="text-[12px] font-mono text-slate-400">ID: {o.id.substring(0,12).toUpperCase()}</p>
                           <h4 className="text-[15px] font-bold text-slate-900">{o.title}</h4>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="text-right">
                              <p className="text-[14px] font-bold text-slate-900">RM {Number(o.price).toFixed(2)}</p>
                              <p className="text-[12px] text-slate-400">{o.deliveryType || 'N/A'}</p>
                           </div>
                           <button className="h-9 px-5 bg-blue-600 text-white rounded-md text-[12px] font-bold hover:bg-blue-700">
                              Accept
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Logistics Pipeline Table */}
             <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                   <h3 className="text-[14px] font-bold text-slate-900">Active Pipeline</h3>
                </div>

                <div className="divide-y divide-slate-100">
                   {recentOrders.filter((o: any) => o.status !== 'PENDING_VENDOR').length === 0 ? (
                     <p className="p-10 text-center text-slate-400 italic text-[13px]">Registry is currently empty.</p>
                   ) : recentOrders.filter((o: any) => o.status !== 'PENDING_VENDOR').map((o: any) => (
                     <div key={o.id} className="p-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400">
                              <Package size={18} />
                           </div>
                           <div>
                              <p className="text-[14px] font-bold text-slate-900">{o.title}</p>
                              <p className="text-[12px] text-blue-600 font-medium">Status: {o.status.replace('_', ' ')}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <button 
                             onClick={() => onViewProof(o)}
                             className="h-8 px-4 border border-slate-200 rounded text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                           >
                             Audit
                           </button>
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
