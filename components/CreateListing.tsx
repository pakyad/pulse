"use client";

import React, { useState } from 'react';

import { createItemListing } from '@/lib/marketplace-utils';
import { submitProductListing } from '@/app/actions/productActions';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { X, MapPin, ChevronRight, Plus, Truck, Handshake, Package, Search, Trash2, Camera, Info, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateListingProps {
  userId: string;
  role: string;
  onClose: () => void;
}

const MIIT_HOTSPOTS = ["Setapak, MIIT Level 2", "SMK Taman Melawati", "Library Lounge"];
const CATEGORIES = [
  { id: 'tech', label: 'Computers & Tech', icon: '💻', subs: ['Desktops', 'Laptops & Notebooks', 'Parts & Accessories'] },
  { id: 'books', label: 'Books & Stationery', icon: '📚', subs: ['Textbooks', 'Novels', 'Stationery'] },
  { id: 'apparel', label: 'Fashion', icon: '👕', subs: ['Men\'s Fashion', 'Women\'s Fashion'] },
  { id: 'services', label: 'Services', icon: '🛠️', subs: ['Runner', 'Academic Tutor'] },
];

const CONDITIONS = [
  { label: 'Brand new', desc: 'Never used. May come with original packaging or tag.' },
  { label: 'Like new', desc: 'Used once or twice. As good as new.' },
  { label: 'Lightly used', desc: 'Used with care. Flaws, if any, are barely noticeable.' },
  { label: 'Well used', desc: 'Has minor flaws or defects.' },
  { label: 'Heavily used', desc: 'Has obvious signs of use or defects.' },
];

export default function CreateListing({ userId, role, onClose }: CreateListingProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'flagged' | 'error'>('idle');
  const [message, setMessage] = useState('');
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
      // 1. Asset Preparation (Client-side Storage)
      const file = images[0].file;
      const storageRef = ref(storage, `items/${userId}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // 2. Registry Handshake (Server Action)
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("price", form.price);
      formData.append("category", form.category);
      formData.append("justification", form.justification);
      formData.append("vendorId", userId);
      formData.append("image_url", imageUrl);
      formData.append("stock_count", form.stock_count);

      const res = await submitProductListing(formData);

      if (res.success) {
        setMessage(res.message);
        if (res.isFlagged) {
          setStatus('flagged');
        } else {
          setStatus('success');
          setTimeout(() => onClose(), 2000);
        }
      } else {
        setStatus('error');
        setMessage(res.message || "An error occurred.");
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage("Failed to connect to the Pulse Registry.");
    }
  };

  const isFormValid = images.length > 0 && form.title && form.price && form.category && form.condition;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-white overflow-hidden font-sans antialiased text-black">
      
      {/* ── TOP NAV (Institutional) ── */}
      <div className="flex justify-between items-center px-6 pt-16 pb-6 bg-white border-b-[0.5px] border-[#F2F2F7]">
        <button onClick={onClose} className="p-2 -ml-2 text-black/40 hover:text-black transition-colors">
          <X size={20} />
        </button>
        <h1 className="text-[14px] font-black uppercase tracking-[0.2em] text-black">Create Listing</h1>
        <button 
          disabled={!isFormValid || status === 'loading'}
          onClick={handleUpload}
          className={`text-[13px] font-black uppercase tracking-widest transition-all ${isFormValid ? 'text-[#00927C]' : 'text-black/10'}`}
        >
          {status === 'loading' ? '...' : 'Post'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar bg-white pb-32">
        
        {/* ── SECTION: PHOTO (Optical Layout) ── */}
        <section className="px-6 py-10 space-y-6">
          <div className="flex justify-between items-end">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30">Asset Documentation</p>
            <p className="text-[10px] font-bold text-[#00927C] uppercase tracking-widest">{images.length} / 4</p>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {images.map((img, i) => (
              <div key={i} className="shrink-0 w-32 h-32 rounded-[22px] bg-white border-[0.5px] border-[#F2F2F7] overflow-hidden relative group">
                <img src={img.preview} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center active:scale-90 transition-all"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {images.length < 4 && (
              <label className="shrink-0 w-32 h-32 rounded-[22px] border-[0.5px] border-dashed border-[#F2F2F7] flex flex-col items-center justify-center gap-2 cursor-pointer active:bg-slate-50 transition-all">
                <Plus size={20} className="text-black/20" />
                <span className="text-[9px] font-black uppercase tracking-widest text-black/20">Add Photo</span>
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>
        </section>

        {/* ── FEEDBACK LAYER (Dynamic State) ── */}
        <AnimatePresence>
          {(status === 'success' || status === 'flagged' || status === 'error') && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="px-6 mb-6"
            >
              {status === 'success' && (
                <div className="p-5 rounded-[22px] bg-[#E8F5E9] border-[0.5px] border-[#81C784] flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#4CAF50] flex items-center justify-center shrink-0">
                    <Check size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-[#1B5E20] uppercase tracking-wider mb-1">Authorization Success</p>
                    <p className="text-[13px] text-[#2E7D32] font-medium leading-tight">{message}</p>
                  </div>
                </div>
              )}

              {status === 'flagged' && (
                <div className="p-5 rounded-[22px] bg-[#FFF8E1] border-[0.5px] border-[#FFD54F] flex gap-4 items-start shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-[#FFB300] flex items-center justify-center shrink-0">
                    <AlertCircle size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-[#7F4D00] uppercase tracking-wider mb-1">Manual Vetting Required</p>
                    <p className="text-[13px] text-[#A67C00] font-medium leading-tight">{message}</p>
                    <button 
                      onClick={onClose}
                      className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#7F4D00] underline underline-offset-4"
                    >
                      Return to Terminal
                    </button>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="p-5 rounded-[22px] bg-[#FFEBEE] border-[0.5px] border-[#E57373] flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#F44336] flex items-center justify-center shrink-0">
                    <X size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-[#B71C1C] uppercase tracking-wider mb-1">Registry Rejection</p>
                    <p className="text-[13px] text-[#C62828] font-medium leading-tight">{message}</p>
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>


        {/* ── SECTION: PRIMARY DETAILS ── */}
        <section className="px-6 space-y-12">
          
          {/* Title Input */}
          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30">Listing Title</label>
             <input 
              placeholder="What are you listing?"
              value={form.title}
              className="w-full py-4 text-[18px] font-bold text-black border-b-[0.5px] border-[#F2F2F7] focus:border-[#00927C] focus:outline-none transition-colors placeholder:text-black/10"
              onChange={(e) => setForm({...form, title: e.target.value})}
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30">Classification</label>
            <button 
              onClick={() => setSheet('category')}
              className="w-full h-16 px-6 rounded-[22px] bg-white border-[0.5px] border-[#F2F2F7] flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <span className={`text-[14px] font-bold ${form.category ? 'text-black' : 'text-black/20'}`}>
                {form.category ? `${form.category} • ${form.subCategory || 'Select'}` : 'Select Category'}
              </span>
              <ChevronRight size={18} className="text-black/10 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Condition Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30">Asset Integrity</label>
            <button 
              onClick={() => setSheet('condition')}
              className="w-full h-16 px-6 rounded-[22px] bg-white border-[0.5px] border-[#F2F2F7] flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <span className={`text-[14px] font-bold ${form.condition ? 'text-black' : 'text-black/20'}`}>
                {form.condition || 'Select Condition'}
              </span>
              <ChevronRight size={18} className="text-black/10 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          {/* Price Input */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30">Valuation</label>
            <div className="flex items-center gap-3 py-4 border-b-[0.5px] border-[#F2F2F7] focus-within:border-[#00927C] transition-colors">
              <span className="text-[18px] font-black">RM</span>
              <input 
                type="number"
                placeholder="0.00"
                value={form.price}
                className="flex-1 bg-transparent text-[24px] font-black focus:outline-none placeholder:text-black/5"
                onChange={(e) => setForm({...form, price: e.target.value})}
              />
            </div>
          </div>
          
          {/* Stock Input (REQ_V102) */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30">Inventory Depth</label>
            <div className="flex items-center gap-3 py-4 border-b-[0.5px] border-[#F2F2F7]">
              <Package size={18} className="text-black/10" />
              <input 
                type="number"
                placeholder="Units available"
                value={form.stock_count}
                className="flex-1 bg-transparent text-[18px] font-bold focus:outline-none placeholder:text-black/5"
                onChange={(e) => setForm({...form, stock_count: e.target.value})}
              />
            </div>
          </div>

          {/* Justification Field (Price Monitoring Edge Case) */}
          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30">Registry Justification</label>
             <textarea 
               placeholder="Selling a premium item? Explain why (e.g., brand, extras)..."
               value={form.justification}
               className="w-full p-6 text-[14px] font-medium text-black bg-white border-[0.5px] border-[#F2F2F7] rounded-[22px] focus:border-black focus:outline-none transition-all placeholder:text-black/10 min-h-[120px] resize-none"
               onChange={(e) => setForm({...form, justification: e.target.value})}
             />
             <p className="text-[9px] font-bold text-black/20 uppercase tracking-widest leading-relaxed">
               Providing context helps Admins authorize high-value listings faster.
             </p>
          </div>


          {/* Campus Base */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30">Institutional Hub</label>
            <div className="flex gap-2">
              {['MIIT', 'UBIS', 'BMI'].map((campus) => (
                <button
                  key={campus}
                  onClick={() => setForm({...form, campus_id: campus, meetup_location: `UniKL ${campus} Lobby`})}
                  className={`flex-1 h-12 rounded-[12px] border-[0.5px] font-black text-[11px] uppercase tracking-widest transition-all ${
                    form.campus_id === campus 
                      ? 'bg-black text-white border-black' 
                      : 'bg-white text-black/20 border-[#F2F2F7]'
                  }`}
                >
                  {campus}
                </button>
              ))}
            </div>
          </div>

          {/* Fulfillment Matrix */}
          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-[0.15em] text-black/30">Logistics Protocol</label>
             <div className="bg-white rounded-[22px] border-[0.5px] border-[#F2F2F7] overflow-hidden">
                {/* Meet-up Row */}
                <div className="p-6 border-b-[0.5px] border-[#F2F2F7]">
                   <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-[12px] bg-slate-50 flex items-center justify-center text-black/40">
                            <Handshake size={18} />
                         </div>
                         <span className="text-[14px] font-bold text-black uppercase tracking-tight">Hand-to-Hand</span>
                      </div>
                      <button 
                        onClick={() => setForm({...form, meetup_enabled: !form.meetup_enabled})}
                        className={`w-11 h-6 rounded-full transition-all relative ${form.meetup_enabled ? 'bg-[#00927C]' : 'bg-black/5'}`}
                      >
                        <motion.div animate={{ x: form.meetup_enabled ? 22 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </button>
                   </div>
                   {form.meetup_enabled && (
                      <div className="ml-14 flex items-center justify-between">
                         <p className="text-[12px] text-black/40 font-medium truncate pr-4">{form.meetup_location}</p>
                         <button className="text-[10px] font-black uppercase tracking-widest text-[#00927C] shrink-0">Edit</button>
                      </div>
                   )}
                </div>

                {/* Delivery Row */}
                <div className="p-6">
                   <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-[12px] bg-slate-50 flex items-center justify-center text-black/40">
                            <Truck size={18} />
                         </div>
                         <span className="text-[14px] font-bold text-black uppercase tracking-tight">Institutional Run</span>
                      </div>
                      <button 
                        onClick={() => setForm({...form, delivery_enabled: !form.delivery_enabled})}
                        className={`w-11 h-6 rounded-full transition-all relative ${form.delivery_enabled ? 'bg-[#00927C]' : 'bg-black/5'}`}
                      >
                        <motion.div animate={{ x: form.delivery_enabled ? 22 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </button>
                   </div>
                   {form.delivery_enabled && (
                      <div className="ml-14 flex items-center justify-between">
                         <p className="text-[12px] text-black/40 font-medium italic">Integrated Pulse Logistics</p>
                         <button className="text-[10px] font-black uppercase tracking-widest text-[#00927C] shrink-0">Config</button>
                      </div>
                   )}
                </div>
             </div>
          </div>

        </section>
      </div>

      {/* ── ACTION FOOTER ── */}
      <div className="p-8 bg-white border-t-[0.5px] border-[#F2F2F7] pb-12">
        <motion.button 
          whileTap={isFormValid && status !== 'loading' ? { scale: 0.98 } : {}}
          onClick={handleUpload}
          disabled={status === 'loading' || !isFormValid}
          className={`w-full h-16 rounded-[22px] font-black text-[14px] uppercase tracking-[0.2em] transition-all duration-500 ${
            isFormValid && status !== 'loading' ? 'bg-black text-white shadow-2xl shadow-black/20' : 'bg-black/5 text-black/10'
          }`}
        >
          {status === 'loading' ? 'Processing Handshake...' : 'Authorize Listing'}
        </motion.button>
      </div>

      {/* ── BOTTOM SHEETS (Institutional) ── */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSheet(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[400]"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[500] flex flex-col max-h-[85vh] shadow-3xl border-t-[0.5px] border-[#F2F2F7]"
            >
              <div className="px-8 pt-8 pb-4">
                <div className="w-12 h-1 bg-black/5 rounded-full mx-auto mb-8" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20 mb-1">Marketplace Protocol</p>
                    <h3 className="text-[20px] font-black text-black uppercase tracking-tighter">{sheet} Selection</h3>
                  </div>
                  <button onClick={() => setSheet(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-black/20">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-32 pt-6">
                {sheet === 'category' && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-[12px] px-5 py-4 mb-8 flex items-center gap-4 border-[0.5px] border-[#F2F2F7]">
                      <Search size={16} className="text-black/20" />
                      <input placeholder="Search classifications..." className="bg-transparent text-[14px] font-bold focus:outline-none w-full placeholder:text-black/10" />
                    </div>
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => { setForm({...form, category: cat.label}); setSheet('subcategory'); }}
                        className="w-full h-20 px-6 text-left flex items-center justify-between border-[0.5px] border-[#F2F2F7] rounded-[22px] bg-white hover:bg-slate-50 transition-all group"
                      >
                        <div className="flex items-center gap-5">
                          <span className="text-[24px] grayscale group-hover:grayscale-0 transition-all">{cat.icon}</span>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-black text-black uppercase tracking-tight">{cat.label}</span>
                            <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest">Active Directory</span>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-black/10 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                )}

                {sheet === 'subcategory' && (
                  <div className="space-y-3">
                     <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em] mb-6">{form.category} Spectrum</p>
                     {CATEGORIES.find(c => c.label === form.category)?.subs.map(sub => (
                       <button 
                         key={sub}
                         onClick={() => { setForm({...form, subCategory: sub}); setSheet(null); }}
                         className="w-full h-16 px-6 text-left flex items-center justify-between border-[0.5px] border-[#F2F2F7] rounded-[22px] bg-white hover:bg-slate-50 transition-all group"
                       >
                         <span className="text-[14px] font-black text-black uppercase tracking-tight">{sub}</span>
                         <ChevronRight size={16} className="text-black/10 group-hover:translate-x-1 transition-all" />
                       </button>
                     ))}
                  </div>
                )}

                {sheet === 'condition' && (
                  <div className="space-y-3">
                    {CONDITIONS.map(cond => (
                      <button 
                        key={cond.label} 
                        onClick={() => { setForm({...form, condition: cond.label}); setSheet(null); }}
                        className={`w-full min-h-[80px] px-6 py-4 text-left flex items-center justify-between border-[0.5px] rounded-[22px] transition-all ${
                          form.condition === cond.label 
                            ? 'bg-black border-black text-white' 
                            : 'bg-white border-[#F2F2F7] text-black'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="text-[14px] font-black uppercase tracking-tight">{cond.label}</p>
                          <p className={`text-[11px] font-medium mt-1 opacity-40 leading-tight uppercase tracking-wide`}>{cond.desc}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          form.condition === cond.label ? 'border-white bg-white/20' : 'border-black/5'
                        }`}>
                           {form.condition === cond.label && <Check size={14} className="text-white" />}
                        </div>
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
