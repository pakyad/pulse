"use client";

import React, { useState } from 'react';

import { createItemListing } from '@/lib/marketplace-utils';
import { submitProductListing } from '@/app/actions/productActions';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, MapPin, ChevronRight, Plus, Truck, Handshake, Package, Search, Trash2, Camera, Info, Check, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateListingProps {
  userId: string;
  role: string;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'tech', label: 'Computers & Tech', icon: '💻', subs: ['Desktops', 'Laptops & Notebooks', 'Parts & Accessories'] },
  { id: 'books', label: 'Books', icon: '📚', subs: ['Textbooks', 'Novels', 'Reference Material'] },
  { id: 'food', label: 'Food', icon: '🍱', subs: ['Home-cooked', 'Packaged Snacks', 'Beverages'] },
  { id: 'stationery', label: 'Stationery', icon: '✏️', subs: ['Pens & Paper', 'Art Supplies', 'Calculators'] },
  { id: 'apparel', label: 'Fashion', icon: '👕', subs: ['Men\'s Fashion', 'Women\'s Fashion', 'Accessories'] },
  { id: 'health', label: 'Health & Beauty', icon: '🧴', subs: ['Skincare', 'Personal Care', 'Vitamins'] },
  { id: 'sports', label: 'Sports', icon: '⚽', subs: ['Gear', 'Apparel', 'Training Tools'] },
  { id: 'hobbies', label: 'Hobbies', icon: '🎮', subs: ['Games', 'Collectibles', 'Arts & Crafts'] },
  { id: 'services', label: 'Services', icon: '🛠️', subs: ['Runner', 'Academic Tutor', 'Creative Services'] },
  { id: 'other', label: 'Other Assets', icon: '📦', subs: ['General', 'Bundle Deals'] },
];

const CONDITIONS = [
  { label: 'Brand new', desc: 'Never used. Original packaging.' },
  { label: 'Like new', desc: 'As good as new.' },
  { label: 'Lightly used', desc: 'Used with care.' },
  { label: 'Well used', desc: 'Has minor flaws.' },
  { label: 'Heavily used', desc: 'Obvious signs of use.' },
];

export default function CreateListing({ userId, role, onClose }: CreateListingProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'flagged' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isAppealOpen, setIsAppealOpen] = useState(false);
  const [appealText, setAppealText] = useState('');
  
  const [form, setForm] = useState({ 
    title: '', 
    price: '', 
    category: '',
    subCategory: '',
    condition: '',
    justification: '',
    meetup_enabled: true,
    delivery_enabled: true,
    campus_id: 'MIIT',
    meetup_location: 'Setapak, MIIT Level 2',
    stock_count: '1'
  });

  const [sheet, setSheet] = useState<'category' | 'subcategory' | 'condition' | 'location' | null>(null);
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);

  const [governanceStatus, setGovernanceStatus] = useState<'STABLE' | 'WARNING' | 'BLOCKED'>('STABLE');
  const [priceError, setPriceError] = useState<string | null>(null);

  const GOVERNANCE_REGISTRY: Record<string, { limit: number, type: 'REGULATED' | 'PREMIUM' }> = {
    'Food': { limit: 30, type: 'REGULATED' },
    'Books': { limit: 150, type: 'REGULATED' },
    'Stationery': { limit: 50, type: 'REGULATED' },
    'Computers & Tech': { limit: 5000, type: 'PREMIUM' },
    'Fashion': { limit: 300, type: 'PREMIUM' },
    'Health & Beauty': { limit: 200, type: 'PREMIUM' },
    'Sports': { limit: 400, type: 'PREMIUM' },
    'Hobbies': { limit: 500, type: 'PREMIUM' },
    'Services': { limit: 1000, type: 'PREMIUM' },
    'Other Assets': { limit: 1000, type: 'PREMIUM' }
  };

  React.useEffect(() => {
    if (form.category && form.price) {
      const rule = GOVERNANCE_REGISTRY[form.category];
      if (rule) {
        const isOver = parseFloat(form.price) > rule.limit;
        if (isOver) {
          if (rule.type === 'REGULATED') {
            setPriceError(`Price Ceiling: RM ${rule.limit}.00 max for this category.`);
            setGovernanceStatus('BLOCKED');
          } else {
            setPriceError(`Market Note: Recommended ceiling is RM ${rule.limit}.00.`);
            setGovernanceStatus('WARNING');
          }
        } else {
          setPriceError(null);
          setGovernanceStatus('STABLE');
        }
      }
    } else {
      setPriceError(null);
      setGovernanceStatus('STABLE');
    }
  }, [form.category, form.price]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setImages(prev => [...prev, { file: selectedFile, preview: URL.createObjectURL(selectedFile) }]);
    }
  };

  const handleUpload = async () => {
    if (!images[0]?.file) return;
    setStatus('loading');
    
    try {
      const file = images[0].file;
      const storageRef = ref(storage, `items/${userId}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("price", form.price);
      formData.append("category", form.category);
      formData.append("justification", appealText || form.justification);
      formData.append("vendorId", userId);
      formData.append("image_url", imageUrl);
      formData.append("stock_count", form.stock_count);
      formData.append("governance_type", GOVERNANCE_REGISTRY[form.category]?.type || 'PREMIUM');
      formData.append("is_exemption_request", governanceStatus === 'BLOCKED' ? 'true' : 'false');

      const res = await submitProductListing(formData);

      if (res.success) {
        setMessage(res.message);
        if (res.isFlagged || governanceStatus === 'BLOCKED') {
          setStatus('flagged');
        } else {
          setStatus('success');
          setTimeout(() => onClose(), 2000);
        }
      } else {
        setStatus('error');
        setMessage(res.message || "Action failed.");
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage("Connection error.");
    }
  };

  const isFormValid = images.length > 0 && form.title && form.price && form.category && form.condition;

  const getPostButtonText = () => {
    if (status === 'loading') return 'Broadcasting';
    if (governanceStatus === 'BLOCKED') return 'Review Appeal';
    return 'Confirm Listing';
  };

  return (
    <div className="fixed inset-0 z-1000 flex flex-col bg-white overflow-hidden font-sans antialiased text-[#1e293b]">
      
      {/* ── HEADER (Compact Skibidi) ── */}
      <div className="flex justify-between items-center px-6 py-6 bg-white border-b border-slate-50">
        <button onClick={onClose} className="p-2 -ml-2 text-[#94a3b8] hover:text-[#1e293b] transition-all">
          <X size={20} strokeWidth={2.5} />
        </button>
        <h1 className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#1e293b]">Institutional Registry</h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32 px-8">
        
        {/* ── PHOTO FLOW (Compact) ── */}
        <section className="py-10 border-b border-slate-50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[16px] font-bold text-[#1e293b] tracking-tight">Visual Assets</h2>
            <span className="text-[11px] font-bold text-[#94a3b8]">{images.length}/4</span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {images.map((img, i) => (
              <div key={i} className="shrink-0 w-32 h-32 rounded-xl bg-slate-50 border border-slate-100 relative group overflow-hidden">
                <img src={img.preview} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-2 right-2 w-7 h-7 bg-white shadow-xl rounded-full flex items-center justify-center text-[#1e293b] opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={12} strokeWidth={2} />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <label className="shrink-0 w-32 h-32 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-all group">
                <Plus size={18} className="text-[#94a3b8] group-hover:text-[#1e293b]" />
                <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Add</span>
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>
        </section>

        {/* ── TYPOGRAPHIC FORM (Compact Skibidi) ── */}
        <div className="space-y-10 py-10">
          
          {/* Product Name */}
          <div className="space-y-3 border-b border-slate-50 pb-8">
            <h2 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em]">Product Identity</h2>
            <input 
              placeholder="What are you selling?"
              value={form.title}
              className="w-full bg-transparent text-[21px] font-bold text-[#1e293b] placeholder:text-slate-100 focus:outline-none tracking-tight"
              onChange={(e) => setForm({...form, title: e.target.value})}
            />
          </div>

          {/* Classification */}
          <button onClick={() => setSheet('category')} className="w-full text-left group border-b border-slate-50 pb-8 hover:border-slate-100 transition-all">
            <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Classification</p>
            <div className="flex items-center justify-between">
              <span className={`text-[16px] font-bold ${form.category ? 'text-[#1e293b]' : 'text-slate-200'}`}>
                {form.category || 'Select Type'}
              </span>
              <ChevronRight size={16} className="text-slate-200 group-hover:text-[#1e293b] transition-all" />
            </div>
          </button>

          {/* Quality State */}
          <button onClick={() => setSheet('condition')} className="w-full text-left group border-b border-slate-50 pb-8 hover:border-slate-100 transition-all">
            <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Quality State</p>
            <div className="flex items-center justify-between">
              <span className={`text-[16px] font-bold ${form.condition ? 'text-[#1e293b]' : 'text-slate-200'}`}>
                {form.condition || 'Select Status'}
              </span>
              <ChevronRight size={16} className="text-slate-200 group-hover:text-[#1e293b] transition-all" />
            </div>
          </button>

          {/* Market Value */}
          <div className="border-b border-slate-50 pb-8">
            <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Market Value (RM)</p>
            <div className="flex items-center gap-2">
               <span className="text-[16px] font-bold text-slate-100">RM</span>
               <input 
                 type="number" 
                 placeholder="0.00"
                 value={form.price}
                 className="w-full bg-transparent text-[28px] font-bold text-[#1e293b] placeholder:text-slate-100 focus:outline-none tracking-tighter"
                 onChange={(e) => setForm({...form, price: e.target.value})}
               />
            </div>
          </div>

          {/* Inventory */}
          <div className="border-b border-slate-50 pb-8">
            <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] mb-2">Stock Inventory</p>
            <input 
              type="number" 
              placeholder="1"
              value={form.stock_count}
              className="w-full bg-transparent text-[28px] font-bold text-[#1e293b] placeholder:text-slate-100 focus:outline-none tracking-tighter"
              onChange={(e) => setForm({...form, stock_count: e.target.value})}
            />
          </div>

          {/* Asset Description */}
          <div className="space-y-4">
            <h2 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em]">Asset Specifications</h2>
            <textarea 
              placeholder="Enter item details..."
              rows={3}
              value={form.justification}
              className="w-full bg-transparent text-[15px] font-bold text-[#1e293b] placeholder:text-slate-100 focus:outline-none resize-none leading-relaxed"
              onChange={(e) => setForm({...form, justification: e.target.value})}
            />
          </div>

          {/* Relay Strategy */}
          <div className="space-y-8 py-4">
            <h2 className="text-[16px] font-bold text-[#1e293b] tracking-tight">Relay Strategy</h2>
            <div className="space-y-4">
               {[
                 { id: 'meetup', label: 'In-Person Collection', active: form.meetup_enabled, icon: Handshake },
                 { id: 'delivery', label: 'Pulse Logistics Relay', active: form.delivery_enabled, icon: Truck }
               ].map((opt) => (
                  <button 
                    key={opt.id}
                    onClick={() => setForm({...form, [opt.id === 'meetup' ? 'meetup_enabled' : 'delivery_enabled']: !opt.active})}
                    className="flex items-center justify-between w-full group py-3 border-b border-slate-50 hover:border-slate-100 transition-all"
                  >
                    <div className="flex items-center gap-5 text-left">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${opt.active ? 'bg-[#1e293b] text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
                        <opt.icon size={18} strokeWidth={2} />
                      </div>
                      <span className={`text-[15px] font-bold tracking-tight transition-all ${opt.active ? 'text-[#1e293b]' : 'text-slate-200'}`}>{opt.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${opt.active ? 'bg-[#1e293b] border-[#1e293b]' : 'border-slate-100'}`}>
                       {opt.active && <Check size={12} strokeWidth={3} className="text-white" />}
                    </div>
                  </button>
               ))}
            </div>
          </div>
        </div>

        {/* ── GOVERNANCE ── */}
        {priceError && (
          <div className="py-10 border-t border-slate-100">
             <div className="flex items-center gap-3 mb-3">
                <ShieldCheck size={18} className="text-[#1e293b]" />
                <h2 className="text-[16px] font-bold text-[#1e293b] tracking-tight">Audit Directive</h2>
             </div>
             <p className="text-[12px] font-bold text-[#94a3b8] leading-relaxed uppercase">
                {priceError}
             </p>
          </div>
        )}
      </div>

      {/* ── STICKY FOOTER ACTION (Compact) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-60 p-8 bg-white/90 backdrop-blur-2xl">
        <button 
          onClick={() => {
            if (governanceStatus === 'BLOCKED' && !isAppealOpen) {
               setIsAppealOpen(true);
            } else {
               handleUpload();
            }
          }}
          disabled={status === 'loading' || !isFormValid}
          className={`w-full h-16 rounded-2xl flex items-center justify-center gap-4 transition-all duration-500 shadow-2xl ${
            isFormValid && status !== 'loading' 
              ? 'bg-[#1e293b] text-white' 
              : 'bg-slate-50 text-slate-200'
          }`}
        >
          <span className="text-[14px] font-bold uppercase tracking-[0.3em] ml-2">{getPostButtonText()}</span>
          {status === 'loading' && <Loader2 className="animate-spin" size={18} />}
        </button>
      </div>

      {/* ── EXEMPTION MODAL (Compact) ── */}
      <AnimatePresence>
         {isAppealOpen && (
            <div className="fixed inset-0 z-2000 flex items-center justify-center p-8">
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setIsAppealOpen(false)}
                  className="absolute inset-0 bg-[#1e293b]/80 backdrop-blur-md"
               />
               <motion.div 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                  className="relative w-full max-w-md bg-white rounded-[32px] p-8 space-y-8 shadow-3xl"
               >
                  <div className="space-y-3">
                     <p className="text-[11px] font-bold text-[#94a3b8] leading-relaxed">Administrative Audit</p>
                     <h2 className="text-[18px] font-bold text-[#1e293b] tracking-tight">Request Exemption</h2>
                  </div>
                  <textarea 
                     value={appealText}
                     onChange={(e) => setAppealText(e.target.value)}
                     placeholder="State justification..."
                     className="w-full h-36 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-[16px] font-bold text-[#1e293b] focus:outline-none resize-none shadow-inner"
                  />
                  <div className="flex gap-4">
                     <button onClick={() => setIsAppealOpen(false)} className="flex-1 h-14 rounded-2xl border border-slate-100 text-[11px] font-bold uppercase tracking-[0.2em] text-[#94a3b8]">Cancel</button>
                     <button onClick={() => { setIsAppealOpen(false); handleUpload(); }} className="flex-1 h-14 rounded-2xl bg-[#1e293b] text-white text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl">Submit</button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* ── BOTTOM SHEETS (Compact) ── */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSheet(null)}
              className="fixed inset-0 bg-[#1e293b]/60 backdrop-blur-sm z-400"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 bg-white z-500 flex flex-col max-h-[80vh] rounded-t-[32px] border-t border-slate-50 shadow-3xl"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-[#94a3b8] leading-relaxed">Registry Node</p>
                  <h2 className="text-[18px] font-bold text-[#1e293b] tracking-tight">{sheet} Selection</h2>
                </div>
                <button onClick={() => setSheet(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-[#1e293b] transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {sheet === 'category' && (
                  <div className="grid grid-cols-1 gap-2">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => { setForm({...form, category: cat.label}); setSheet('subcategory'); }}
                        className="w-full h-16 px-6 text-left flex items-center justify-between hover:bg-slate-50 transition-all rounded-xl group"
                      >
                        <span className="text-[16px] font-bold text-[#1e293b] tracking-tight group-hover:translate-x-1 transition-all">{cat.label}</span>
                        <ChevronRight size={16} className="text-slate-100 group-hover:text-[#1e293b] transition-all" />
                      </button>
                    ))}
                  </div>
                )}
                {sheet === 'condition' && (
                  <div className="grid grid-cols-1 gap-2">
                    {CONDITIONS.map(cond => (
                      <button 
                        key={cond.label} 
                        onClick={() => { setForm({...form, condition: cond.label}); setSheet(null); }}
                        className={`w-full h-20 px-6 text-left flex flex-col justify-center transition-all rounded-xl ${form.condition === cond.label ? 'bg-slate-50 border border-slate-100' : 'hover:bg-slate-50'}`}
                      >
                        <span className="text-[16px] font-bold tracking-tight text-[#1e293b]">{cond.label}</span>
                        <p className="text-[12px] font-medium text-[#94a3b8] leading-relaxed mt-1">{cond.desc}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
