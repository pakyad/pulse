"use client";

import { useState } from 'react';
import { createItemListing } from '@/lib/marketplace-utils';
import { X, MapPin, ChevronRight, Plus, Truck, Handshake, Package, Search, Trash2, Camera, Info, Check } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<{file: File | null, preview: string}[]>([]);
  const [activeDraft, setActiveDraft] = useState(0);
  const [form, setForm] = useState({ 
    title: '', 
    price: '', 
    category: '',
    subCategory: '',
    condition: '',
    meetup_enabled: true,
    delivery_enabled: false,
    meetup_location: MIIT_HOTSPOTS[0],
  });

  const [sheet, setSheet] = useState<'category' | 'subcategory' | 'condition' | 'location' | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setImages(prev => [...prev, { file: selectedFile, preview: URL.createObjectURL(selectedFile) }]);
    }
  };

  const handleUpload = async () => {
    setLoading(true);
    try {
      await createItemListing(userId, role, form, images[0]?.file);
      onClose(); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = images.length > 0 && form.title && form.price && form.category && form.condition;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col bg-[#F9F9F9] overflow-hidden font-sans antialiased text-[#222222]">
      
      {/* ── TOP NAV ── */}
      <div className="flex justify-between items-center px-6 pt-12 pb-4 bg-white">
        <button onClick={onClose} className="p-2 -ml-2 text-[#222222]">
          <X size={24} />
        </button>
        <button className="text-[15px] font-bold text-[#222222]">Post all <span className="ml-1 text-slate-300">›</span></button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar bg-white pb-20">
        
        {/* ── LISTING HEADER ── */}
        <div className="px-6 py-6 flex justify-between items-end">
          <h2 className="text-[22px] font-bold text-[#222222]">Listing 1</h2>
        </div>

        {/* ── PHOTO SECTION ── */}
        <section className="px-6 space-y-4 mb-10">
          <p className="text-[14px] font-bold text-[#222222]">Photo</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <div key={i} className="shrink-0 w-28 h-28 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden relative group">
                <img src={img.preview} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 p-1 bg-black/40 rounded-full flex items-center justify-center active:scale-90 transition-all"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {[...Array(4 - images.length)].map((_, i) => (
              <label key={i} className="shrink-0 w-28 h-28 rounded-lg border border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer active:bg-slate-50 transition-all">
                <Plus size={24} className="text-slate-400" />
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Tap to edit photos. Drag and drop to reorder.</p>
        </section>

        {/* ── CATEGORY ── */}
        <section className="px-6 space-y-4 mb-10">
          <p className="text-[14px] font-bold text-[#222222]">Category</p>
          <button 
            onClick={() => setSheet('category')}
            className="w-full h-14 px-5 rounded-xl bg-slate-50 border border-transparent flex items-center justify-between group active:scale-[0.99] transition-all"
          >
            <span className={`text-[15px] font-medium ${form.category ? 'text-[#222222]' : 'text-slate-400'}`}>
              {form.category ? `${form.category} >> ${form.subCategory}` : 'All Categories'}
            </span>
            <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-all" />
          </button>
        </section>

        {/* ── TITLE & CONDITION ── */}
        <section className="px-6 space-y-10 mb-10">
          <div className="space-y-3">
            <p className="text-[14px] font-bold text-[#222222]">Listing title</p>
            <input 
              placeholder="Name your listing"
              value={form.title}
              className="w-full py-3 text-[16px] font-medium text-[#222222] border-b border-slate-100 focus:border-[#00927C] focus:outline-none transition-colors"
              onChange={(e) => setForm({...form, title: e.target.value})}
            />
          </div>

          <div onClick={() => setSheet('condition')} className="space-y-3 cursor-pointer group">
            <p className="text-[14px] font-bold text-[#222222]">Condition</p>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
               <span className={`text-[16px] font-medium ${form.condition ? 'text-[#222222]' : 'text-slate-300'}`}>
                {form.condition || 'Select condition'}
               </span>
               <ChevronRight size={20} className="text-slate-200 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[14px] font-bold text-[#222222]">Price</p>
            <div className="flex items-center gap-2 py-2 border-b border-slate-100 focus-within:border-[#00927C] transition-colors">
              <span className="text-[16px] font-bold">RM</span>
              <input 
                type="number"
                placeholder="0"
                className="flex-1 bg-transparent text-[16px] font-bold focus:outline-none placeholder:text-slate-200"
                onChange={(e) => setForm({...form, price: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* ── FULFILLMENT (Logistics Sync) ── */}
        <section className="px-6">
           <p className="text-[14px] font-bold text-[#222222] mb-4">Fulfillment</p>
           <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
              {/* Meet-up Row */}
              <div className="p-4 border-b border-slate-200/50">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                       <Handshake size={18} className="text-slate-400" />
                       <span className="text-[15px] font-bold text-[#222222]">Meet-up</span>
                    </div>
                    <button 
                      onClick={() => setForm({...form, meetup_enabled: !form.meetup_enabled})}
                      className={`w-11 h-6 rounded-full transition-all relative ${form.meetup_enabled ? 'bg-[#00927C]' : 'bg-slate-200'}`}
                    >
                      <motion.div animate={{ x: form.meetup_enabled ? 22 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                 </div>
                 {form.meetup_enabled && (
                    <div className="ml-7 flex items-center justify-between">
                       <p className="text-[13px] text-slate-500 font-medium truncate pr-4">{form.meetup_location}</p>
                       <button className="text-[12px] font-bold text-[#00927C] shrink-0">Edit</button>
                    </div>
                 )}
              </div>

              {/* Delivery Row */}
              <div className="p-4">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                       <Truck size={18} className="text-slate-400" />
                       <span className="text-[15px] font-bold text-[#222222]">Delivery</span>
                    </div>
                    <button 
                      onClick={() => setForm({...form, delivery_enabled: !form.delivery_enabled})}
                      className={`w-11 h-6 rounded-full transition-all relative ${form.delivery_enabled ? 'bg-[#00927C]' : 'bg-slate-200'}`}
                    >
                      <motion.div animate={{ x: form.delivery_enabled ? 22 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                 </div>
                 {form.delivery_enabled && (
                    <div className="ml-7 flex items-center justify-between">
                       <p className="text-[13px] text-slate-500 font-medium">Standard (2-4 days)</p>
                       <button className="text-[12px] font-bold text-[#00927C] shrink-0">Config</button>
                    </div>
                 )}
              </div>
           </div>
        </section>
      </div>

      {/* ── STICKY FOOTER ACTION ── */}
      <div className="relative z-50 p-6 bg-white border-t border-slate-100">
        <motion.button 
          whileTap={isFormValid ? { scale: 0.96 } : {}}
          onClick={handleUpload}
          disabled={loading || !isFormValid}
          className={`w-full h-14 rounded-xl font-bold text-[16px] transition-all duration-300 ${
            isFormValid ? 'bg-[#00927C] text-white shadow-lg' : 'bg-slate-100 text-slate-300'
          }`}
        >
          {loading ? 'Posting...' : 'List it!'}
        </motion.button>
      </div>

      {/* ── BOTTOM SHEETS ── */}
      <AnimatePresence>
        {sheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSheet(null)}
              className="fixed inset-0 bg-black/40 z-[400]"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[500] flex flex-col max-h-[85vh] shadow-2xl"
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto my-4" />
              
              <div className="px-8 pb-6 flex items-center justify-between">
                <button onClick={() => setSheet(null)}><X size={24} className="text-[#222222]" /></button>
                <h3 className="text-[17px] font-bold text-[#222222] capitalize">{sheet}</h3>
                <div className="w-6" />
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-32">
                {sheet === 'category' && (
                  <div className="space-y-2">
                    <div className="bg-slate-50 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 border border-slate-100">
                      <Search size={18} className="text-slate-300" />
                      <input placeholder="Search for a category" className="bg-transparent text-[15px] font-medium focus:outline-none w-full" />
                    </div>
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => { setForm({...form, category: cat.label}); setSheet('subcategory'); }}
                        className="w-full py-4 text-left flex items-center justify-between border-b border-slate-50 group active:bg-slate-50 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-[20px]">{cat.icon}</span>
                          <span className="text-[15px] font-medium">{cat.label}</span>
                        </div>
                        <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                )}

                {sheet === 'subcategory' && (
                  <div className="space-y-2">
                     <h4 className="text-[24px] font-bold text-[#222222] mb-6">{form.category}</h4>
                     {CATEGORIES.find(c => c.label === form.category)?.subs.map(sub => (
                       <button 
                         key={sub}
                         onClick={() => { setForm({...form, subCategory: sub}); setSheet(null); }}
                         className="w-full py-5 text-left flex items-center justify-between border-b border-slate-50 group active:bg-slate-50 transition-all"
                       >
                         <span className="text-[15px] font-medium">{sub}</span>
                         <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                       </button>
                     ))}
                  </div>
                )}

                {sheet === 'condition' && (
                  <div className="space-y-4">
                    {CONDITIONS.map(cond => (
                      <button 
                        key={cond.label} 
                        onClick={() => { setForm({...form, condition: cond.label}); setSheet(null); }}
                        className="w-full py-5 text-left flex items-start justify-between gap-4 group border-b border-slate-50"
                      >
                        <div className="flex-1">
                          <p className="text-[15px] font-bold text-[#222222] mb-1">{cond.label}</p>
                          <p className="text-[13px] text-slate-500 font-medium leading-snug">{cond.desc}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 mt-1 flex items-center justify-center transition-all ${form.condition === cond.label ? 'border-[#00927C] bg-[#00927C]' : 'border-slate-200'}`}>
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
