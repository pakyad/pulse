'use client'
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, ChevronRight, Check, AlertCircle, 
  Plus, Trash2, Eye, Send, MapPin, Package,
  Layers, Tag, Info, Sparkles
} from 'lucide-react';

// Simple Category Chips (Carousell Style)
const MAIN_CATEGORIES = ['Tech', 'Books', 'Food', 'Hobbies', 'Clothes', 'Other'];

const CONDITION_OPTS = [
  { label: 'New', desc: 'Brand new, never used' },
  { label: 'Like New', desc: 'Used once or twice' },
  { label: 'Good', desc: 'Normal wear and tear' },
  { label: 'Fair', desc: 'Well used but works' }
];

export default function CreateListingPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('New');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [delivery, setDelivery] = useState('Pick up');
  const [priceError, setPriceError] = useState<string | null>(null);
  
  // USP 1: Price Safeguard Registry
  const CATEGORY_LIMITS: Record<string, number> = {
    'Books': 100,
    'Food': 30,
    'Tech': 5000,
    'Other': 1000
  };

  useEffect(() => {
    if (category && price) {
      const limit = CATEGORY_LIMITS[category];
      if (limit && parseFloat(price) > limit) {
        setPriceError(`Institutional Limit: RM ${limit}.00 max for ${category}.`);
      } else {
        setPriceError(null);
      }
    } else {
      setPriceError(null);
    }
  }, [category, price]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result as string].slice(0, 10));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans text-navy antialiased pb-40">
      {/* ── HEADER ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-12 pb-4 bg-white/80 backdrop-blur-xl border-b border-slate-50 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-navy/40 active:scale-90 transition-all">
          <X size={24} />
        </button>
        <h1 className="text-[17px] font-black tracking-tight uppercase">New Listing</h1>
        <div className="w-10" />
      </nav>

      {/* ── CONTENT ── */}
      <div className="pt-32 space-y-0">
        
        {/* 1. PHOTO REEL (Carousell Style) */}
        <section className="bg-white px-6 pb-8 border-b border-slate-50">
           <div className="flex justify-between items-center mb-4">
              <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-300">Visual Assets</h2>
              <span className="text-[11px] font-black text-navy/20">{images.length}/10</span>
           </div>
           
           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-32 h-32 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-all">
                   <Plus size={20} />
                </div>
                <span className="text-[11px] font-bold text-slate-400">Add Photo</span>
              </button>
              
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />

              {images.map((img, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={i} 
                  className="shrink-0 w-32 h-32 relative rounded-3xl overflow-hidden border border-slate-100 shadow-sm"
                >
                  <img src={img} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg">
                    <Trash2 size={12} className="text-red-500" />
                  </button>
                  {i === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/90 py-1 text-center backdrop-blur-sm">
                      <span className="text-[8px] font-black text-white uppercase tracking-widest">Main Cover</span>
                    </div>
                  )}
                </motion.div>
              ))}
           </div>
        </section>

        {/* 2. SMART CATEGORY CHIPS (Carousell/eBay Mix) */}
        <section className="bg-white px-6 py-8 border-b border-slate-50">
           <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-300 mb-4">Quick Category</h2>
           <div className="flex flex-wrap gap-2">
              {MAIN_CATEGORIES.map(cat => (
                 <button 
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-[13px] font-bold border transition-all ${
                    category === cat ? 'bg-navy text-white border-navy shadow-lg shadow-navy/20' : 'bg-slate-50 border-slate-50 text-slate-400'
                  }`}
                 >
                    {cat}
                 </button>
              ))}
           </div>
        </section>

        {/* 3. CORE DETAILS (Simple Words Protocol) */}
        <section className="px-6 py-10 space-y-10">
           
           {/* Listing Title */}
           <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Listing Title</label>
              <input 
                type="text" 
                placeholder="What are you selling?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-0 text-[28px] font-black placeholder:text-slate-100 border-none focus:ring-0 leading-tight"
              />
           </div>

           {/* Condition Ledger (eBay Style) */}
           <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Item Condition</label>
              <div className="grid grid-cols-2 gap-3">
                 {CONDITION_OPTS.map(opt => (
                    <button 
                      key={opt.label}
                      onClick={() => setCondition(opt.label)}
                      className={`p-5 rounded-3xl border text-left transition-all ${
                        condition === opt.label ? 'bg-white border-navy shadow-xl shadow-navy/5' : 'bg-slate-50/50 border-transparent'
                      }`}
                    >
                       <p className={`text-[15px] font-black ${condition === opt.label ? 'text-navy' : 'text-slate-400'}`}>{opt.label}</p>
                       <p className="text-[11px] font-bold text-slate-300 mt-1">{opt.desc}</p>
                    </button>
                 ))}
              </div>
           </div>

           {/* About Section */}
           <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Description</label>
              <textarea 
                placeholder="Tell us about the features, defects, or history..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-6 bg-slate-50 rounded-[2rem] border-none focus:ring-1 ring-navy/5 text-[15px] font-medium placeholder:text-slate-200"
              />
           </div>

           {/* Price & Stock (Unified Ledger) */}
           <div className="grid grid-cols-2 gap-6 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
              <div className="space-y-2">
                 <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Price (RM)</p>
                 <div className="flex items-center gap-1">
                    <span className="text-[20px] font-black text-navy/20">RM</span>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className={`w-full bg-transparent p-0 text-[28px] font-black border-none focus:ring-0 ${priceError ? 'text-red-500' : 'text-navy'}`}
                    />
                 </div>
                 {priceError && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-red-500">
                       <AlertCircle size={12} />
                       <span className="text-[10px] font-black uppercase tracking-widest">{priceError}</span>
                    </motion.div>
                 )}
              </div>
              <div className="space-y-2 border-l border-slate-50 pl-6">
                 <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Stock</p>
                 <input 
                    type="number" 
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-transparent p-0 text-[28px] font-black border-none focus:ring-0"
                 />
              </div>
           </div>

           {/* Delivery Mode */}
           <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 ml-1">Delivery Option</label>
              <div className="flex gap-3">
                {['Pick up', 'Runner'].map((opt) => (
                  <button 
                    key={opt}
                    onClick={() => setDelivery(opt)}
                    className={`flex-1 h-16 rounded-2xl flex items-center justify-center gap-3 border-2 transition-all ${
                      delivery === opt ? 'bg-navy text-white border-navy shadow-xl shadow-navy/20' : 'bg-white border-slate-50 text-slate-300'
                    }`}
                  >
                    {opt === 'Pick up' ? <MapPin size={18} /> : <Package size={18} />}
                    <span className="text-[14px] font-bold">{opt}</span>
                  </button>
                ))}
              </div>
           </div>

        </section>

      </div>

      {/* ── STICKY FOOTER ACTION ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-white/80 backdrop-blur-2xl border-t border-slate-50">
        <div className="flex gap-3 max-w-lg mx-auto">
          <button className="flex-1 h-18 rounded-3xl border border-slate-100 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all">
            <Eye size={18} className="text-navy/40" />
            <span className="text-[10px] font-black uppercase text-navy/40">Check Look</span>
          </button>
          <button 
            disabled={!title || !price || !category || images.length === 0 || !!priceError}
            className="flex-[2.5] h-18 bg-navy text-white rounded-[1.5rem] flex items-center justify-center gap-3 shadow-2xl shadow-navy/30 active:scale-[0.98] disabled:opacity-20 disabled:grayscale transition-all"
          >
            <div className="flex flex-col items-start">
               <span className="text-[15px] font-black tracking-tight">Post Item</span>
               <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Broadcast to Campus</span>
            </div>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </main>
  );
}
