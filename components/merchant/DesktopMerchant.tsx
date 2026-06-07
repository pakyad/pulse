import React from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import SwipeToReady from './SwipeToReady';
import { deleteDoc, doc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Plus, Bell, LogOut, LayoutGrid, Package, BarChart3, Settings, Search, Info, Pencil, Trash2, ShieldAlert, ClipboardList, CheckCircle2, X, ShoppingBag } from 'lucide-react';
import CreateListing from '@/components/CreateListing';
import AvatarDropdown from '@/components/shared/AvatarDropdown';
import VoxelStatus from '@/components/shared/VoxelStatus';

export default function DesktopMerchant({ 
  merchant, 
  revenue, 
  activeOrdersCount, 
  pipelineOrders,
  completedOrders,
  items,
  onViewProof,
  handleAcceptOrder,
  handlePrepareOrder,
  handleMarkReady,
  handleMessageUser,
  handleCallRunner,
  handleConfirmDelivery,
  toggleItemStatus
}: any) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isInlineFormOpen, setIsInlineFormOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  //  FIX 7: Inline Form State 
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    maxPerStudent: '',
    category: 'Academic'
  });
  const [formImages, setFormImages] = React.useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5);
      setFormImages(files);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant?.uid || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // -- PCS VALIDATION GATE --
      const functions = getFunctions(undefined, 'us-central1');
      const pcsValidate = httpsCallable(functions, 'pcsValidate');
      const pcsResult = await pcsValidate({ 
        itemTitle: formData.name, 
        itemPrice: parseFloat(formData.price), 
        category: formData.category.toUpperCase(), 
        sellerId: merchant.uid, 
        itemId: 'preview'
      });
      const pcsData = pcsResult.data as any;

      if (!pcsData.isApproved) {
        setIsSubmitting(false);
        alert('Price too high! Market price is RM' + pcsData.marketBaselinePrice + '. Max allowed is RM' + pcsData.maxAllowedStudentPrice + '. Please lower your price.');
        return;
      }

      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/lib/firebase');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

      const imageUrls = await Promise.all(
        formImages.map(async (file) => {
          const storageRef = ref(storage, `items/${merchant.uid}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          return getDownloadURL(snapshot.ref);
        })
      );

      await addDoc(collection(db, "items"), {
        title: formData.name, // Mapping 'name' to 'title' as per existing schema
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_count: parseInt(formData.stock),
        stock: parseInt(formData.stock),
        maxPerStudent: formData.maxPerStudent ? parseInt(formData.maxPerStudent) : null,
        category: formData.category.toUpperCase(),
        imageUrls,
        image_url: imageUrls[0] || null, // Primary image
        seller_id: merchant.uid,
        seller_name: merchant.full_name,
        status: "ACTIVE",
        merchant: true,
        pcs_certified: true,
        created_at: serverTimestamp()
      });

      setFormData({ name: '', description: '', price: '', stock: '', maxPerStudent: '', category: 'Academic' });
      setFormImages([]);
      setIsInlineFormOpen(false);
      alert("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [selectedOrders, setSelectedOrders] = React.useState<string[]>([]);

  const handleBulkMarkReady = async () => {
    try {
      const { writeBatch, doc, serverTimestamp } = await import('firebase/firestore');
      const batch = writeBatch(db);
      selectedOrders.forEach(orderId => {
        const orderRef = doc(db, 'orders', orderId);
        batch.update(orderRef, { status: 'READY', ready_at: serverTimestamp() });
      });
      await batch.commit();
      setSelectedOrders([]);
      alert(`${selectedOrders.length} orders marked as ready.`);
    } catch (e) {
      console.error(e);
      alert('Failed to mark orders as ready.');
    }
  };

  const handleExportOrders = () => {
    const csvRows = [
      ['Order Code', 'Buyer Name', 'Item', 'Quantity', 'Handover Node', 'Status', 'Amount', 'Created At']
    ];
    pipelineOrders.forEach((o: any) => {
      csvRows.push([
        o.id.slice(-6).toUpperCase(),
        o.customer_name || 'Student',
        o.title,
        o.items?.[0]?.qty || 1,
        o.drop_off_location || 'Campus Delivery',
        o.status,
        Number(o.total || o.price || 0).toFixed(2),
        o.created_at?.toDate ? o.created_at.toDate().toLocaleString() : new Date(o.created_at).toLocaleString()
      ].map(str => `"${String(str).replace(/"/g, '""')}"`));
    });
    const csvString = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pulse_orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const isClub = merchant?.role === 'CLUB' || merchant?.is_verified_merchant;

  const filteredAttentionItems = items?.filter((item: any) => {
    const isAttention = (item.stock_count ?? 99) <= 5;
    if (!isAttention) return false;
    if (!searchTerm) return true;
    return item.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#F9F9FB] selection:bg-gray-100 hidden md:flex">
      
      {/*  Fixed Sidebar (Column 1)  */}
      <aside className="w-64 h-screen bg-[#FFFFFF] border-r-[0.5px] border-[#E5E5EA] fixed left-0 top-0 flex flex-col z-30">
        
        {/* Header */}
        <div className="px-6 py-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
             <span className="text-white font-semibold text-[14px]">P</span>
          </div>
          <h1 className="text-[24px] font-bold text-[#1C1C1E] tracking-tight">Pulse</h1>
        </div>

        {/* Directory Links */}
        <nav className="flex-1 px-4 py-2 space-y-1.5">
          <button 
            onClick={() => router.push('/merchant')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white"
          >
            <LayoutGrid size={20} />
            <span className="text-sm font-medium">Overview</span>
          </button>
          
          <button 
            onClick={() => router.push('/orders')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Bell size={20} />
            <span className="text-sm">Live Orders</span>
          </button>
          <button 
            onClick={() => router.push('/marketplace')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Package size={20} />
            <span className="text-sm">Products</span>
          </button>
          {isClub && (
            <>
              <button 
                onClick={() => router.push('/merchant/disputes')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ClipboardList size={20} />
                <span className="text-sm">Log</span>
              </button>
              <button 
                onClick={() => router.push('/me/insights')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <BarChart3 size={20} />
                <span className="text-sm">Analytics</span>
              </button>
            </>
          )}
          <button 
            onClick={() => router.push('/me/edit')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Settings size={20} />
            <span className="text-sm">Settings</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t-[0.5px] border-[#E5E5EA]">
          <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/*  Main Content Area  */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen bg-white text-slate-900">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-10 py-6 flex items-center justify-between sticky top-0 z-30">
          <div>
             <div className="flex items-center gap-3">
               <h1 className="text-2xl font-semibold text-gray-900">Shop Manager</h1>
               <span className={`text-[11px] font-medium px-[10px] py-[3px] rounded-[20px] border ${
                 isClub ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'
               }`}>
                 {isClub ? 'CLUB MERCHANT' : 'SELLER'}
               </span>
             </div>
             <p className="text-xs text-[#1D9E75] font-medium mt-1">Logged in as {merchant?.full_name}</p>
          </div>

          <div className="flex items-center gap-6">
             <div className="relative flex items-center w-80 h-10 rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
               <div className="px-3 text-slate-400">
                 <Search size={16} />
               </div>
               <input className="h-full w-full outline-none text-[12px] pr-2 bg-transparent placeholder-slate-400 font-medium" type="text" placeholder="Search orders, student names..." /> 
             </div>

             {isClub && (
               <button 
                 onClick={() => setIsInlineFormOpen(!isInlineFormOpen)}
                 className="h-10 px-6 bg-slate-900 text-white text-[13px] font-bold rounded-md hover:bg-blue-700 transition-all"
               >
                 + Add Product
               </button>
             )}

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

        {/*  FIX 7: Inline Form  */}
        <AnimatePresence>
          {isInlineFormOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-50 border-b border-slate-200 overflow-hidden"
            >
              <form onSubmit={handleFormSubmit} className="p-10 max-w-4xl space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-bold text-slate-900">Add New Product</h2>
                  <button type="button" onClick={() => setIsInlineFormOpen(false)} className="text-slate-400 hover:text-slate-900">
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">Product Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium outline-none focus:border-slate-900 transition-all"
                        placeholder="e.g. Calculus Textbook"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">Description</label>
                      <textarea 
                        required
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium outline-none focus:border-slate-900 transition-all resize-none"
                        placeholder="Tell students about your product..."
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">Price (RM)</label>
                        <input 
                          required
                          type="number" 
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({...formData, price: e.target.value})}
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium outline-none focus:border-slate-900 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">Stock Quantity</label>
                        <input 
                          required
                          type="number" 
                          value={formData.stock}
                          onChange={(e) => setFormData({...formData, stock: e.target.value})}
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium outline-none focus:border-slate-900 transition-all"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">Purchase limit per student</label>
                      <input 
                        type="number" 
                        value={formData.maxPerStudent}
                        onChange={(e) => setFormData({...formData, maxPerStudent: e.target.value})}
                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium outline-none focus:border-slate-900 transition-all"
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium outline-none focus:border-slate-900 transition-all appearance-none"
                      >
                        <option>Academic</option>
                        <option>Tech</option>
                        <option>Hostel</option>
                        <option>Apparel</option>
                        <option>Services</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">Product Images (Up to 5)</label>
                  <div className="flex gap-4">
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-white hover:border-slate-900 transition-all group">
                      <Plus size={20} className="text-slate-300 group-hover:text-slate-900" />
                      <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-900">Upload</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    {formImages.map((file, i) => (
                      <div key={i} className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                        <button type="button" onClick={() => setFormImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    disabled={isSubmitting}
                    type="submit" 
                    className="h-12 px-10 bg-slate-900 text-white text-[14px] font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : 'Publish Product'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsInlineFormOpen(false)}
                    className="h-12 px-10 bg-white border border-slate-200 text-slate-600 text-[14px] font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/*  ADMINISTRATIVE VIEW  */}
        <div className="p-10 space-y-12">
          
          {/* Data Tables */}
          <div className="grid grid-cols-1 gap-12">
             
              {/* FIX 5: Orders to Do / Active Pipeline */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[20px] mb-[20px]">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <h3 className="text-[16px] font-semibold text-[#111827]">Active Pipeline</h3>
                       <div className="flex items-center gap-1 text-[13px] text-[#6B7280]">
                          <Info size={14} /> Manage and fulfill your active orders.
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <button onClick={handleExportOrders} className="bg-white border border-[#D1D5DB] text-[#374151] rounded-full px-[18px] py-[8px] text-[13px] font-medium transition-all hover:bg-slate-50">
                         Export Orders
                       </button>
                       <span className="text-[13px] text-[#111827] font-semibold">{pipelineOrders.length} Orders</span>
                    </div>
                 </div>
                 
                 <div className="divide-y divide-slate-100">
                    {pipelineOrders.length === 0 ? (
                      <p className="py-10 text-center text-[#6B7280] italic text-[13px]">No active orders found.</p>
                    ) : pipelineOrders.map((o: any) => (
                      <div key={o.id} className="py-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <input 
                              type="checkbox" 
                              checked={selectedOrders.includes(o.id)}
                              onChange={() => toggleOrderSelection(o.id)}
                              className="w-4 h-4 rounded border-slate-300 text-[#111827] focus:ring-[#111827] cursor-pointer"
                            />
                            <div className="w-10 h-10 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-slate-400">
                               <Package size={18} />
                            </div>
                             <div>
                                <p className="text-[14px] font-bold text-[#111827]">{o.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[11px] font-medium px-[10px] py-[3px] rounded-[20px] ${
                                    o.status === 'PAID' ? 'bg-[#FEF3C7] text-[#92400E]' :
                                    o.status === 'PREPARING' ? 'bg-[#DBEAFE] text-[#1E40AF]' :
                                    o.status === 'READY' ? 'bg-[#D1FAE5] text-[#065F46]' :
                                    o.status === 'RUNNER_ASSIGNED' ? 'bg-[#EDE9FE] text-[#4C1D95]' :
                                    o.status === 'PICKED_UP' ? 'bg-[#CFFAFE] text-[#164E63]' :
                                    o.status === 'DELIVERED' ? 'bg-[#F3F4F6] text-[#374151]' :
                                    o.status === 'CANCELLED' ? 'bg-[#FEE2E2] text-[#991B1B]' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {o.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                             </div>
                         </div>
                         <div className="flex items-center gap-4">
                            {/* status PAID (or PENDING_VENDOR): Prepare Order */}
                            {(o.status === 'PAID' || o.status === 'PENDING_VENDOR') && (
                              <button 
                                onClick={() => handlePrepareOrder(o.id, o.items || [])}
                                className="bg-[#111827] text-white rounded-full px-[18px] py-[8px] text-[13px] font-medium transition-all hover:bg-slate-800"
                              >
                                Prepare Order
                              </button>
                            )}

                            {/* status PREPARING: Mark Ready for Pickup */}
                            {o.status === 'PREPARING' && (
                              <button 
                                onClick={() => handleMarkReady(o.id)}
                                className="bg-[#111827] text-white rounded-full px-[18px] py-[8px] text-[13px] font-medium transition-all hover:bg-slate-800"
                              >
                                Mark Ready
                              </button>
                            )}

                            {/* status READY or RUNNER_ASSIGNED: Message Runner & Message Buyer */}
                            {(o.status === 'READY' || o.status === 'READY_FOR_PICKUP' || o.status === 'PENDING_RUNNER' || o.runner_id) && (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleMessageUser(o.id, o.buyer_id, o.customer_name, 'BUYER', o.title)}
                                  className="bg-[#111827] text-white rounded-full px-[18px] py-[8px] text-[13px] font-medium transition-all hover:bg-slate-800"
                                >
                                  Message Buyer
                                </button>
                                {(o.runner_id || o.status === 'PENDING_RUNNER') && (
                                  <button 
                                    onClick={() => handleMessageUser(o.id, o.runner_id || 'DEMO_RUNNER', o.runner_name || 'Runner', 'RUNNER', undefined, o.drop_off_location)}
                                    className="bg-white border border-[#D1D5DB] text-[#374151] rounded-full px-[18px] py-[8px] text-[13px] font-medium transition-all hover:bg-slate-50"
                                  >
                                    Message Runner
                                  </button>
                                )}
                              </div>
                            )}

                            {/* status PICKED_UP: Collected notice */}
                            {o.status === 'PICKED_UP' && (
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#D1FAE5] text-[#065F46] rounded-[20px] border border-emerald-100">
                                <CheckCircle2 size={14} />
                                <span className="text-[11px] font-medium">Collected</span>
                              </div>
                            )}
                            
                            {/* Handoff Confirmation */}
                            {o.status !== 'DELIVERED' && o.status !== 'COMPLETED' && o.status !== 'PAID' && o.status !== 'PENDING_VENDOR' && (
                              <button 
                                onClick={() => handleConfirmDelivery(o.id)}
                                disabled={o.handshake?.seller_confirmed}
                                className={`rounded-full px-[18px] py-[8px] text-[13px] font-medium transition-all shadow-sm ${
                                  o.handshake?.seller_confirmed 
                                  ? 'bg-[#D1FAE5] text-[#065F46] border border-emerald-100' 
                                  : 'bg-[#111827] text-white hover:bg-slate-800'
                                }`}
                              >
                                {o.handshake?.seller_confirmed ? 'Handoff Sent' : 'Confirm Delivery'}
                              </button>
                            )}
                            <button 
                              onClick={() => onViewProof(o)}
                              className="bg-white border border-[#D1D5DB] text-[#374151] rounded-full px-[18px] py-[8px] text-[13px] font-medium transition-all hover:bg-slate-50"
                            >
                              Audit
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Completed Orders Section */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[20px] mb-[20px]">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[16px] font-semibold text-[#111827]">Completed Orders</h3>
                    <span className="text-[13px] text-[#6B7280] font-medium">{completedOrders.length} orders</span>
                 </div>

                 <div className="divide-y divide-slate-100">
                    {completedOrders.length === 0 ? (
                      <p className="py-10 text-center text-[#6B7280] italic text-[13px]">No completed orders yet.</p>
                    ) : completedOrders.map((o: any) => (
                      <div key={o.id} className="py-6 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded border border-emerald-100 flex items-center justify-center text-emerald-600">
                               <CheckCircle2 size={18} />
                            </div>
                             <div>
                                <p className="text-[14px] font-bold text-[#111827]">{o.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] font-medium px-[10px] py-[3px] rounded-[20px] bg-[#F3F4F6] text-[#374151]">
                                    {o.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                             </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="text-right">
                               <p className="text-[14px] font-bold text-[#111827]">RM {Number(o.total || o.price || 0).toFixed(2)}</p>
                               <p className="text-[12px] text-[#6B7280]">{o.delivery_type || 'N/A'}</p>
                            </div>
                            <button 
                              onClick={() => onViewProof(o)}
                              className="bg-white border border-[#D1D5DB] text-[#374151] rounded-full px-[18px] py-[8px] text-[13px] font-medium transition-all hover:bg-slate-50"
                            >
                              Details
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

          {/* Key Indicators */}
          {isClub && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                 <Info size={14} className="text-[#6B7280]" />
                 <p className="text-[13px] font-medium text-[#6B7280] italic">Daily summary of shop activity for {merchant?.full_name}.</p>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[20px]">
                   <p className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-tight">Total Earnings</p>
                   <h2 className="text-[28px] font-bold text-[#111827] mt-2">RM {revenue.toFixed(2)}</h2>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[20px]">
                   <p className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-tight">Orders to Do</p>
                   <h2 className="text-[28px] font-bold text-[#111827] mt-2">{activeOrdersCount}</h2>
                </div>
              </div>
            </section>
          )}

          {/*  Minimal Inventory Registry (Matured) */}
          {isClub && items?.some((i: any) => (i.stock_count ?? 99) <= 5) && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-amber-500" />
                  <p className="text-[13px] font-semibold text-[#111827]">Inventory Attention</p>
                </div>
                
                {/*  Drake Searchbar */}
                <div className="relative group">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#111827] transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search registry..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 w-64 pl-9 pr-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-medium text-[#111827] placeholder:text-slate-300 focus:outline-none focus:bg-white focus:border-slate-200 transition-all"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-sm">
                {filteredAttentionItems?.length > 0 ? (
                  filteredAttentionItems.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between px-6 py-4 bg-white hover:bg-slate-50 transition-colors border-b border-[#E5E7EB] last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300">
                          <Package size={14} />
                        </div>
                        <span className="text-[13px] font-bold text-[#111827]">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className={`text-[13px] font-semibold ${item.stock_count <= 0 ? 'text-red-500' : 'text-amber-500'}`}>
                          {item.stock_count <= 0 ? 'OUT OF STOCK' : `${item.stock_count} REMAINING`}
                        </span>
                        <button 
                          onClick={() => router.push(`/marketplace/${item.id}/edit`)}
                          className="text-[11px] font-bold text-[#6B7280] hover:text-[#111827] transition-colors "
                        >
                          Restock
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 bg-white flex flex-col items-center justify-center text-center">
                    <Search size={24} className="text-slate-100 mb-2" />
                    <p className="text-[11px] font-bold text-slate-300 ">No matching assets found</p>
                  </div>
                )}
              </div>
            </section>
          )}

             {/* My Inventory: Visual Grid */}
             {isClub && (
               <div className="space-y-6">
                 <div className="flex items-center justify-between px-1">
                   <div className="flex items-center gap-3">
                     <h3 className="text-[16px] font-semibold text-[#111827]">My Inventory</h3>
                     <div className="flex items-center gap-1 text-[13px] text-[#6B7280]">
                       <Info size={12} /> Manage your listed items and stock.
                     </div>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                   {items?.length === 0 ? (
                     <p className="col-span-2 text-center py-12 text-[#6B7280] italic text-[13px]">No assets registered in the registry.</p>
                   ) : (
                     items.map((item: any) => (
                       <div key={item.id} className="bg-white border border-[#E5E7EB] rounded-[12px] p-[20px] mb-[20px] flex items-center gap-6 hover:border-slate-300 transition-all group">
                         <div className="w-20 h-20 bg-slate-50 rounded-[12px] overflow-hidden shrink-0 border-[0.5px] border-slate-100">
                           {item.image_url ? (
                             <img src={item.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-200">
                               <LayoutGrid size={24} strokeWidth={1.5} />
                             </div>
                           )}
                         </div>

                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                             <p className="text-[15px] font-semibold text-[#111827] truncate tracking-tight">{item.title}</p>
                             {item.stock_count > 0 && item.stock_count <= 10 && (
                               <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-bold rounded-full border border-red-100">Low Stock</span>
                             )}
                             {(item.stock_count <= 0 || item.status === 'OUT_OF_STOCK') && (
                               <span className="px-2 py-0.5 bg-slate-100 text-[#6B7280] text-[9px] font-bold rounded-full border border-slate-200">Out of Stock</span>
                             )}
                           </div>
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-medium text-[#6B7280]">RM{item.price}</p>
                              <PriceHealthIndicator price={item.price} category={item.category} subcategory={item.subcategory} />
                              <span className="w-1 h-1 bg-slate-200 rounded-full" />
                             <div className="flex items-center gap-1.5">
                               <p className={`text-[13px] font-medium ${
                                 (item.stock_count ?? 0) === 0 ? 'text-red-500' :
                                 (item.stock_count ?? 0) <= 5 ? 'text-amber-500' : 
                                 'text-[#6B7280]'
                               }`}>
                                 {item.stock_count ?? 0} STOCK
                               </p>
                             </div>
                           </div>
                         </div>

                         <div className="flex items-center gap-2 shrink-0">
                           <button
                             onClick={() => toggleItemStatus(item.id, item.status)}
                             className={`h-10 px-4 rounded-[12px] text-[11px] font-semibold transition-all ${
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
                             className="h-10 w-10 rounded-[12px] bg-slate-50 border-[0.5px] border-slate-100 flex items-center justify-center text-[#6B7280] hover:text-[#111827] hover:border-slate-300 transition-all"
                           >
                             <Pencil size={14} />
                           </button>
                           <button
                             title="Delete listing"
                             onClick={async () => { if (!confirm('Delete this listing?')) return; try { await deleteDoc(doc(db, 'items', item.id)); } catch(e) { alert('Failed to delete.'); } }}
                             className="h-10 w-10 rounded-[12px] bg-red-50 border-[0.5px] border-red-100 flex items-center justify-center text-red-300 hover:text-red-500 hover:border-red-300 transition-all"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </div>
             )}

          </div>
        </div>

      </main>

      {/*  FIX 16: Floating Action Bar  */}
      <AnimatePresence>
        {selectedOrders.length >= 2 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 ml-32 z-50 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 border border-slate-700"
          >
            <span className="text-[13px] font-bold">{selectedOrders.length} orders selected</span>
            <div className="w-px h-4 bg-slate-700" />
            <button 
              onClick={handleBulkMarkReady}
              className="bg-white text-slate-900 px-5 py-2 rounded-full text-[12px] font-bold hover:bg-slate-100 transition-colors"
            >
              Mark All as Ready
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  MODAL LAYER  */}
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
