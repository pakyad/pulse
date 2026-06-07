"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import SwipeToReady from './SwipeToReady';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
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
    return (completedOrders || []).filter((o: any) => {
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
    const all = [...(pipelineOrders || []), ...(completedOrders || [])].sort((a,b) => {
      const ta = a.created_at?.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at).getTime();
      const tb = b.created_at?.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at).getTime();
      return tb - ta;
    });
    const csvRows = [['Order Code', 'Buyer Name', 'Item', 'Handover Node', 'Status', 'Amount', 'Created At']];
    all.forEach((o: any) => {
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

  const [activeSection, setActiveSection] = React.useState<'overview' | 'products' | 'settings' | 'log'>('overview');

  const isActive = (section: string) => activeSection === section;
  const activeClass = "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-gray-900 text-white font-medium shadow-sm transition-all";
  const idleClass = "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium";

  const renderContent = () => {
    if (activeSection === 'products') {
      return (
        <div className="p-10 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[17px] font-semibold text-[#111827] tracking-tight">Inventory</h3>
              <p className="text-[13px] text-[#9CA3AF] mt-0.5">Manage your listed items.</p>
            </div>
            <button onClick={() => setIsCreateOpen(true)} className="h-10 px-6 bg-slate-900 text-white text-[13px] font-bold rounded-md hover:bg-slate-800 transition-all">+ New Listing</button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {items?.map((item: any) => (
              <div key={item.id} className="bg-white rounded-2xl border border-[#F3F4F6] p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[12px] bg-white border border-[#E5E7EB] overflow-hidden">
                    {item.image_url ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><LayoutGrid size={20} /></div>}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#111827]">{item.title}</p>
                    <p className="text-[12px] text-[#9CA3AF]">RM {item.price?.toFixed(2)} - {item.stock_count} in stock</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const newStatus = item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
                      updateDoc(doc(db, 'items', item.id), { status: newStatus });
                    }}
                    className={"text-xs rounded-full px-3 py-1.5 border transition-all " + (item.status === 'ACTIVE' ? "text-amber-600 border-amber-100 hover:bg-amber-50" : "text-emerald-600 border-emerald-100 hover:bg-emerald-50")}
                  >
                    {item.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                  </button>
                  <button onClick={() => router.push('/marketplace/' + item.id + '/edit')} className="text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 transition-colors">Edit</button>
                  <button onClick={async () => { if (!confirm('Delete this listing? This cannot be undone.')) return; try { await deleteDoc(doc(db, 'items', item.id)); } catch(e) { alert('Failed.'); } }} className="text-xs text-red-500 border border-red-100 rounded-full px-3 py-1.5 hover:bg-red-50 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeSection === 'settings') {
      return (
        <div className="p-10">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-3xl">
            <p className="text-xs text-[#1D9E75] font-medium mb-1">Merchant Portal</p>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h1>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Shop Visibility</p>
                  <p className="text-xs text-gray-500 mt-0.5">Toggle your shop active or paused</p>
                </div>
                <button className="bg-gray-900 text-white text-xs rounded-full px-4 py-1.5 hover:bg-gray-800 transition-colors">Active</button>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Edit Profile</p>
                  <p className="text-xs text-gray-500 mt-0.5">Update your shop name and details</p>
                </div>
                <button onClick={() => router.push('/me/edit')} className="border border-gray-200 text-gray-600 text-xs rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors">Edit</button>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Notification Preferences</p>
                  <p className="text-xs text-gray-500 mt-0.5">Manage order and system alerts</p>
                </div>
                <button className="border border-gray-200 text-gray-600 text-xs rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors">Manage</button>
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-semibold text-red-500">Sign Out</p>
                  <p className="text-xs text-gray-500 mt-0.5">Log out of your merchant account</p>
                </div>
                <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="border border-red-100 text-red-500 text-xs rounded-full px-4 py-1.5 hover:bg-red-50 transition-colors">Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'log') {
      const allOrders = [...(pipelineOrders || []), ...(completedOrders || [])].sort((a, b) => {
        const ta = a.created_at?.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at).getTime();
        const tb = b.created_at?.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at).getTime();
        return tb - ta;
      });

      return (
        <div className="p-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-[#1D9E75] font-medium mb-1">Merchant Portal</p>
              <h1 className="text-2xl font-semibold text-gray-900">Order Log</h1>
            </div>
            <button onClick={handleExportOrders} className="bg-gray-900 text-white text-xs rounded-full px-4 py-2 hover:bg-gray-800 transition-colors">Export CSV</button>
          </div>

          <div className="flex gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{allOrders.length}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{(completedOrders || []).length}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{allOrders.filter(o => o.status === 'CANCELLED').length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 font-bold">Order Code</th>
                  <th className="px-6 py-4 font-bold">Item</th>
                  <th className="px-6 py-4 font-bold">Buyer</th>
                  <th className="px-6 py-4 font-bold">Amount</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 uppercase">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{order.title}</td>
                    <td className="px-6 py-4 text-gray-600">{order.customer_name || 'Student'}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">RM {Number(order.total || order.price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                        order.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                        order.status === 'READY' ? 'bg-blue-50 text-blue-700' :
                        order.status === 'PREPARING' ? 'bg-purple-50 text-purple-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {order.created_at?.toDate ? order.created_at.toDate().toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="p-10 space-y-12">
        {/* Strike Awareness Banner */}
        {merchant?.strike_count >= 1 && (
          <div className="mb-8">
            {merchant.strike_count < 3 ? (
              <div className={"rounded-2xl p-4 flex items-center gap-3 shadow-sm " + (merchant.strike_count === 1 ? "bg-amber-50 border border-amber-100" : "bg-orange-50 border border-orange-100")}>
                <div className={"w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 " + (merchant.strike_count === 1 ? "bg-amber-100" : "bg-orange-100")}>
                  <ShieldAlert size={20} className={merchant.strike_count === 1 ? "text-amber-600" : "text-orange-600"}/>
                </div>
                <div>
                  <p className={"text-sm font-bold " + (merchant.strike_count === 1 ? "text-amber-900" : "text-orange-900")}>
                    {merchant.strike_count === 1 ? "1 pricing warning on record" : "2 warnings - one more and your shop will be suspended"}
                  </p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Maintain fair campus pricing to keep your shop active.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl p-4 flex items-center gap-3 bg-red-50 border border-red-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert size={20} className="text-red-600"/>
                </div>
                <div>
                  <p className="text-sm font-bold text-red-900">Shop suspended - 3 pricing violations</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Contact admin@pulse.edu to appeal your suspension.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Pipeline */}
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[20px] shadow-sm">
          <div className="flex items-center justify-between mb-6">
             <div>
               <h3 className="text-[17px] font-semibold text-[#111827] tracking-tight">Active Pipeline</h3>
               <p className="text-[13px] text-[#9CA3AF] mt-0.5">Manage live orders currently in flow.</p>
             </div>
             <button onClick={handleExportOrders} className="bg-white border border-[#D1D5DB] text-[#374151] rounded-full px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-colors">Export CSV</button>
          </div>
          <div className="divide-y divide-slate-100">
             {(pipelineOrders || []).length === 0 ? (
               <div className="py-12 text-center text-gray-500 text-sm">No active orders</div>
             ) : (
               pipelineOrders.map((o: any) => (
                  <div key={o.id} className="py-6 flex items-center justify-between hover:bg-slate-50/50 transition-all px-2 -mx-2 rounded-xl">
                     <div className="flex items-center gap-4">
                        <input type="checkbox" checked={selectedOrders.includes(o.id)} onChange={() => toggleOrderSelection(o.id)} className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900" />
                        <div>
                           <p className="text-[15px] font-semibold text-[#111827]">{o.title}</p>
                           <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full uppercase mt-1 inline-block ${o.status === 'READY' || o.status === 'READY_FOR_PICKUP' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{o.status.replace(/_/g, ' ')}</span>
                           <p className="text-[12px] text-[#9CA3AF] mt-1">Order #{o.id.slice(-6).toUpperCase()}</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        {(o.status === 'PAID' || o.status === 'PENDING_VENDOR') && <button onClick={() => handlePrepareOrder(o.id, o.items)} className="bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-800 transition-all active:scale-95">Prepare</button>}
                        {o.status === 'PREPARING' && <button onClick={() => handleMarkReady(o.id)} className="bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-800 transition-all active:scale-95">Ready</button>}
                        <button onClick={() => onViewProof(o)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-50 transition-all active:scale-95">Details</button>
                     </div>
                  </div>
               ))
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex font-sans">
      
      {/*  Fixed Sidebar  */}
      <aside className="w-64 h-screen bg-white border-r-[0.5px] border-[#E5E5EA] fixed left-0 top-0 flex flex-col z-30">
        <div className="px-6 py-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-semibold">P</div>
          <h1 className="text-[24px] font-bold text-[#1C1C1E] tracking-tight">Pulse</h1>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5">
          <button onClick={() => setActiveSection('overview')} className={isActive('overview') ? activeClass : idleClass}>
            <LayoutGrid size={18} />
            <span>Overview</span>
          </button>
          <button onClick={() => setActiveSection('log')} className={isActive('log') ? activeClass : idleClass}>
            <ClipboardList size={18} />
            <span>Live Orders</span>
          </button>
          <button onClick={() => setActiveSection('products')} className={isActive('products') ? activeClass : idleClass}>
            <Package size={18} />
            <span>Products</span>
          </button>
          <button onClick={() => router.push('/merchant/analytics')} className={idleClass}>
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>
          <button onClick={() => setActiveSection('settings')} className={isActive('settings') ? activeClass : idleClass}>
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
          <div className="bg-gray-50 rounded-xl p-4 flex-1 shadow-sm border border-slate-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900">RM {revenue.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex-1 shadow-sm border border-slate-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">This Month</p>
            <p className="text-xl font-bold text-gray-900">RM {monthRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex-1 shadow-sm border border-slate-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">Active Orders</p>
            <p className="text-xl font-bold text-gray-900">{activeOrdersCount}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 flex-1 shadow-sm border border-slate-100">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-1">Total Listings</p>
            <p className="text-xl font-bold text-gray-900">{(items || []).length}</p>
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
                <button disabled={isSubmitting} type="submit" className="h-12 px-10 bg-slate-900 text-white font-bold rounded-xl disabled:opacity-50 transition-all active:scale-95">
                  {isSubmitting ? 'Validating...' : 'Publish Product'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {renderContent()}
      </main>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedOrders.length >= 2 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 ml-32 z-50 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6">
            <span className="text-sm font-bold">{selectedOrders.length} orders</span>
            <button onClick={handleBulkMarkReady} className="bg-white text-slate-900 px-5 py-2 rounded-full text-xs font-bold hover:bg-slate-50 transition-colors">Mark Ready</button>
          </motion.div>
        )}
      </AnimatePresence>

      {isCreateOpen && (
        <CreateListing userId={merchant?.uid} role="merchant" onClose={() => setIsCreateOpen(false)} />
      )}
    </div>
  );
}
