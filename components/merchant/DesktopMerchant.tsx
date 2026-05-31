import React from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import SwipeToReady from './SwipeToReady';
import { deleteDoc, doc } from 'firebase/firestore';
import { Plus, Bell, LogOut, LayoutGrid, Package, BarChart3, Settings, Search, Info, Pencil, Trash2, ShieldAlert, ClipboardList } from 'lucide-react';
import CreateListing from '@/components/CreateListing';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import VoxelStatus from '@/components/shared/VoxelStatus';

export default function DesktopMerchant({ 
  merchant, 
  revenue, 
  activeOrdersCount, 
  attentionCount, 
  recentOrders,
  items,
  onViewProof,
  handleAcceptOrder,
  handleCallRunner,
  handleConfirmDelivery,
  toggleItemStatus
}: any) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredAttentionItems = items?.filter((item: any) => {
    const isAttention = (item.stock_count ?? 99) <= 5;
    if (!isAttention) return false;
    if (!searchTerm) return true;
    return item.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#F2F2F7] selection:bg-gray-100 hidden md:flex">
      
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
            onClick={() => router.push('/merchant/disputes')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-[#8E8E93] hover:bg-[#F2F2F7] hover:text-[#1C1C1E] rounded-xl transition-colors font-medium group"
          >
            <ClipboardList size={20} />
            <span className="text-[15px] tracking-[-0.24px]">Log</span>
          </button>
          <button 
            onClick={() => router.push('/me/insights')}
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
             <h1 className="text-[20px] font-bold text-slate-900">Shop Manager</h1>
             <p className="text-[13px] text-slate-500 mt-1">Logged in as {merchant?.full_name}</p>
          </div>

          <div className="flex items-center gap-6">
             <div className="relative flex items-center w-80 h-10 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
               <div className="px-3 text-slate-400">
                 <Search size={16} />
               </div>
               <input className="h-full w-full outline-none text-[12px] pr-2 bg-transparent placeholder-slate-400 font-medium" type="text" placeholder="Search orders, student names..." /> 
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
             <button 
               onClick={() => { auth.signOut(); router.push('/auth'); }}
               className="text-slate-400 hover:text-rose-600 transition-colors"
             >
                <LogOut size={20} />
             </button>
              <AvatarDropdown 
                 photoUrl={merchant?.photo_url} 
                 userName={merchant?.full_name || 'Merchant'} 
              />
          </div>
        </header>

        {/* ── ADMINISTRATIVE VIEW ── */}
        <div className="p-10 space-y-12">
          
          {/* Data Tables */}
          <div className="grid grid-cols-1 gap-12">
             
             {/* Pending Acceptance List */}
             <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <h3 className="text-[14px] font-bold text-slate-900">Current Orders</h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                         <Info size={12} /> Track your active orders here.
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
                           <button 
                             onClick={() => handleAcceptOrder(o.id)}
                             className="h-9 px-5 bg-blue-600 text-white rounded-md text-[12px] font-bold hover:bg-blue-700"
                           >
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
                               <div className="flex items-center gap-2 mt-0.5">
                                 <VoxelStatus status={o.status} size={10} />
                                 <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest leading-none">
                                   {o.status.replace(/_/g, ' ')}
                                 </p>
                               </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                           {o.status === 'PREPARING' && (
                             <div className="w-48"><SwipeToReady orderId={o.id} /></div>
                           )}
                           {o.status === 'READY_FOR_PICKUP' && (
                             <span className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded text-[11px] font-bold border border-amber-100 flex items-center gap-2">
                               <Package size={12} />
                               Waiting for Runner
                             </span>
                           )}
                           {o.status === 'AWAITING_RUNNER' && (
                             <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-[11px] font-bold border border-blue-100">
                               Runner Called
                             </span>
                           )}
                           
                           {/* 🏛️ The Handshake Directive */}
                           {o.status !== 'DELIVERED' && o.status !== 'COMPLETED' && (
                             <button 
                               onClick={() => handleConfirmDelivery(o.id)}
                               disabled={o.handshake?.seller_confirmed}
                               className={`h-8 px-4 rounded text-[11px] font-bold transition-all shadow-sm ${
                                 o.handshake?.seller_confirmed 
                                 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                 : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95'
                               }`}
                             >
                               {o.handshake?.seller_confirmed ? 'Handoff Sent' : 'Confirm Delivery'}
                             </button>
                           )}
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

          {/* Key Indicators */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
               <Info size={14} className="text-slate-400" />
               <p className="text-[11px] font-medium text-slate-400 italic">Daily summary of shop activity for {merchant?.full_name}.</p>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                 <p className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">Total Earnings</p>
                 <h2 className="text-[28px] font-bold text-slate-900 mt-2">RM {revenue.toFixed(2)}</h2>
              </div>
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                 <p className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">Orders to Do</p>
                 <h2 className="text-[28px] font-bold text-slate-900 mt-2">{activeOrdersCount}</h2>
              </div>
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                 <p className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">System Reach</p>
                 <h2 className="text-[28px] font-bold text-slate-900 mt-2">Institutional</h2>
              </div>
            </div>
          </section>

          {/* 🏛️ Minimal Inventory Registry (Matured) */}
          {items?.some((i: any) => (i.stock_count ?? 99) <= 5) && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-amber-500" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Inventory Attention</p>
                </div>
                
                {/* 🔍 Drake Searchbar */}
                <div className="relative group">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search registry..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 w-64 pl-9 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-slate-200 transition-all"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                {filteredAttentionItems?.length > 0 ? (
                  filteredAttentionItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between px-6 py-4 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                          <Package size={14} />
                        </div>
                        <span className="text-[13px] font-bold text-[#000000]">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className={`text-[13px] font-black ${item.stock_count <= 0 ? 'text-red-500' : 'text-amber-500'}`}>
                          {item.stock_count <= 0 ? 'OUT OF STOCK' : `${item.stock_count} REMAINING`}
                        </span>
                        <button 
                          onClick={() => router.push(`/marketplace/${item.id}/edit`)}
                          className="text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
                        >
                          Restock
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 bg-white flex flex-col items-center justify-center text-center">
                    <Search size={24} className="text-slate-100 mb-2" />
                    <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">No matching assets found</p>
                  </div>
                )}
              </div>
            </section>
          )}

             {/* My Inventory: Visual Grid */}
             <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                   <div className="flex items-center gap-3">
                      <h3 className="text-[14px] font-bold text-slate-900">My Inventory</h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                         <Info size={12} /> Manage your listed items and stock.
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   {items?.length === 0 ? (
                      <p className="col-span-2 text-center py-12 text-slate-400 italic text-[13px]">No assets registered in the registry.</p>
                   ) : (
                      items.map((item: any) => (
                         <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-6 hover:border-slate-300 transition-all group">
                            {/* 🖼️ Precise Asset Thumbnail */}
                            <div className="w-20 h-20 bg-slate-50 rounded-[20px] overflow-hidden shrink-0 border-[0.5px] border-slate-100">
                               {item.image_url ? (
                                  <img src={item.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                               ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                                     <LayoutGrid size={24} strokeWidth={1.5} />
                                  </div>
                               )}
                            </div>

                            {/* 📄 Metadata Block */}
                            <div className="flex-1 min-w-0">
                               <p className="text-[15px] font-black text-slate-900 truncate tracking-tight mb-1">{item.title}</p>
                               <div className="flex items-center gap-3">
                                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">RM{item.price}</p>
                                   <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                   <div className="flex items-center gap-1.5">
                                      <p className={`text-[11px] font-black uppercase tracking-widest ${
                                         (item.stock_count ?? 0) === 0 ? 'text-red-500' :
                                         (item.stock_count ?? 0) <= 5 ? 'text-amber-500' : 
                                         'text-slate-400'
                                      }`}>
                                         {item.stock_count ?? 0} STOCK
                                      </p>
                                      {(item.stock_count ?? 0) <= 5 && (item.stock_count ?? 0) > 0 && (
                                         <span className="text-[9px] font-black bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full border border-amber-100">LOW</span>
                                      )}
                                      {(item.stock_count ?? 0) === 0 && (
                                         <span className="text-[9px] font-black bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-100">EMPTY</span>
                                      )}
                                   </div>
                               </div>
                            </div>

                             {/* 🛠️ Control Nodes */}
                             <div className="flex items-center gap-2 shrink-0">
                                <button
                                   onClick={() => toggleItemStatus(item.id, item.status)}
                                   className={`h-10 px-5 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${
                                      item.status === 'active'
                                      ? 'bg-emerald-50 text-emerald-600 border-[0.5px] border-emerald-100'
                                      : 'bg-slate-50 text-slate-300 border-[0.5px] border-slate-100'
                                   }`}
                                >
                                   {item.status === 'active' ? 'Active' : 'Hidden'}
                                </button>
                                <button
                                   onClick={() => router.push(`/marketplace/${item.id}/edit`)}
                                   title="Edit listing"
                                   className="h-10 w-10 rounded-[16px] bg-slate-50 border-[0.5px] border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#000000] hover:border-slate-300 transition-all"
                                >
                                   <Pencil size={14} />
                                </button>
                                <button
                                   title="Delete listing"
                                   onClick={async () => { if (!confirm('Delete this listing?')) return; try { await deleteDoc(doc(db, 'items', item.id)); } catch(e) { alert('Failed to delete.'); } }}
                                   className="h-10 w-10 rounded-[16px] bg-red-50 border-[0.5px] border-red-100 flex items-center justify-center text-red-300 hover:text-red-500 hover:border-red-300 transition-all"
                                >
                                   <Trash2 size={14} />
                                </button>
                             </div>
                         </div>
                      ))
                   )}
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
