"use client";

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
import { motion, AnimatePresence } from 'framer-motion';

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

  // Stats Logic
  const monthRevenue = React.useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return completedOrders.filter((o: any) => {
      const d = o.created_at?.toDate ? o.created_at.toDate() : new Date(o.created_at);
      return d >= startOfMonth;
    }).reduce((s: number, o: any) => s + (o.total || 0), 0);
  }, [completedOrders]);

  // Inline Form State 
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
        title: formData.name,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_count: parseInt(formData.stock),
        category: formData.category.toUpperCase(),
        image_url: imageUrls[0] || null,
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
    const csvRows = [['Order Code', 'Buyer Name', 'Item', 'Handover Node', 'Status', 'Amount', 'Created At']];
    pipelineOrders.forEach((o: any) => {
      csvRows.push([
        o.id.slice(-6).toUpperCase(),
        o.customer_name || 'Student',
        o.title,
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
    setSelectedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
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
      
      {/*  Fixed Sidebar  */}
      <aside className="w-64 h-screen bg-white border-r-[0.5px] border-[#E5E5EA] fixed left-0 top-0 flex flex-col z-30">
        <div className="px-6 py-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-semibold">P</div>
          <h1 className="text-[24px] font-bold text-[#1C1C1E] tracking-tight">Pulse</h1>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5">
          <button onClick={() => router.push('/merchant')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white shadow-sm">
            <LayoutGrid size={18} />
            <span>Overview</span>
          </button>
          <button onClick={() => router.push('/merchant/analytics')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>
          <button onClick={() => router.push('/marketplace')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Package size={18} />
            <span>Inventory</span>
          </button>
          <button onClick={() => router.push('/me/edit')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t-[0.5px] border-[#E5E5EA]">
          <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/*  Main Content  */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen bg-white">
        <header className="bg-white border-b border-slate-200 px-10 py-6 flex items-center justify-between sticky top-0 z-30">
          <div>
             <div className="flex items-center gap-3">
               <h1 className="text-2xl font-semibold text-gray-900">Shop Manager</h1>
               <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${isClub ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                 {isClub ? 'CLUB MERCHANT' : 'SELLER'}
               </span>
             </div>
             <p className="text-xs text-[#1D9E75] font-medium mt-1">Logged in as {merchant?.full_name}</p>
          </div>

          <div className="flex items-center gap-6">
             {isClub && (
               <button onClick={() => setIsInlineFormOpen(!isInlineFormOpen)} className="h-10 px-6 bg-slate-900 text-white text-[13px] font-bold rounded-md hover:bg-blue-700 transition-all">
                 + Add Product
               </button>
             )}
             <AvatarDropdown photoUrl={merchant?.photo_url} userName={merchant?.full_name || 'Merchant'} />
          </div>
        </header>

        {/* Mini Stats Strip */}
        <div className="px-10 pt-8 grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 flex-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900">RM {revenue.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">This Month</p>
            <p className="text-xl font-bold text-gray-900">RM {monthRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">Active Orders</p>
            <p className="text-xl font-bold text-gray-900">{activeOrdersCount}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">Total Listings</p>
            <p className="text-xl font-bold text-gray-900">{items?.length || 0}</p>
          </div>
        </div>

        {/* Inline Form */}
        <AnimatePresence>
          {isInlineFormOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50 border-b border-slate-200 overflow-hidden">
              <form onSubmit={handleFormSubmit} className="p-10 max-w-4xl space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-bold text-slate-900">Add New Product</h2>
                  <button type="button" onClick={() => setIsInlineFormOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
                </div>
                {/* Form Inputs... */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <input required className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[14px]" placeholder="Product Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    <textarea required rows={4} className="w-full p-4 bg-white border border-slate-200 rounded-xl text-[14px]" placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div className="space-y-6">
                    <input required type="number" step="0.01" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[14px]" placeholder="Price (RM)" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                    <input required type="number" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[14px]" placeholder="Stock Quantity" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
                    <select className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-[14px]" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option>Academic</option><option>Tech</option><option>Hostel</option><option>Apparel</option><option>Services</option>
                    </select>
                  </div>
                </div>
                <button disabled={isSubmitting} type="submit" className="h-12 px-10 bg-slate-900 text-white font-bold rounded-xl disabled:opacity-50">
                  {isSubmitting ? 'Validating...' : 'Publish Product'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-10 space-y-12">
           {/* Active Pipeline */}
           <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[20px]">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[16px] font-semibold text-[#111827]">Active Pipeline</h3>
                 <button onClick={handleExportOrders} className="bg-white border border-[#D1D5DB] text-[#374151] rounded-full px-4 py-2 text-xs font-medium">Export CSV</button>
              </div>
              <div className="divide-y divide-slate-100">
                 {pipelineOrders.map((o: any) => (
                    <div key={o.id} className="py-6 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                       <div className="flex items-center gap-4">
                          <input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={() => toggleOrderSelection(o.id)} />
                          <div>
                             <p className="text-[14px] font-bold text-[#111827]">{o.title}</p>
                             <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 uppercase mt-1 inline-block">{o.status.replace(/_/g, ' ')}</span>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          {(o.status === 'PAID' || o.status === 'PENDING_VENDOR') && <button onClick={() => handlePrepareOrder(o.id, o.items)} className="bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold">Prepare</button>}
                          {o.status === 'PREPARING' && <button onClick={() => handleMarkReady(o.id)} className="bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold">Ready</button>}
                          <button onClick={() => onViewProof(o)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-xs font-bold">Details</button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </main>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedOrders.length >= 2 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 ml-32 z-50 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6">
            <span className="text-sm font-bold">{selectedOrders.length} orders</span>
            <button onClick={handleBulkMarkReady} className="bg-white text-slate-900 px-5 py-2 rounded-full text-xs font-bold">Mark Ready</button>
          </motion.div>
        )}
      </AnimatePresence>

      {isCreateOpen && (
        <CreateListing userId={merchant?.uid} role="merchant" onClose={() => setIsCreateOpen(false)} />
      )}
    </div>
  );
}
