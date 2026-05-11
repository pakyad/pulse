'use client'
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, ChevronRight, Check, AlertCircle, 
  Plus, Trash2, Eye, Send, MapPin, Package,
  Layers, Tag, Info, Sparkles, Loader2, ShieldCheck, Handshake, Truck
} from 'lucide-react';

import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const MAIN_CATEGORIES = ['Tech', 'Books', 'Food', 'Stationery', 'Clothes', 'Health', 'Sports', 'Hobbies', 'Services', 'Other'];

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
  const [isPosting, setIsPosting] = useState(false);
  const [isAppealOpen, setIsAppealOpen] = useState(false);
  const [appealText, setAppealText] = useState('');
  
  const GOVERNANCE_REGISTRY: Record<string, { limit: number, type: 'REGULATED' | 'PREMIUM' }> = {
    'Food': { limit: 30, type: 'REGULATED' },
    'Books': { limit: 150, type: 'REGULATED' },
    'Stationery': { limit: 50, type: 'REGULATED' },
    'Tech': { limit: 5000, type: 'PREMIUM' },
    'Clothes': { limit: 300, type: 'PREMIUM' },
    'Health': { limit: 200, type: 'PREMIUM' },
    'Sports': { limit: 400, type: 'PREMIUM' },
    'Hobbies': { limit: 500, type: 'PREMIUM' },
    'Services': { limit: 1000, type: 'PREMIUM' },
    'Other': { limit: 1000, type: 'PREMIUM' }
  };

  const [governanceStatus, setGovernanceStatus] = useState<'STABLE' | 'WARNING' | 'BLOCKED'>('STABLE');

  useEffect(() => {
    if (category && price) {
      const rule = GOVERNANCE_REGISTRY[category];
      if (rule) {
        const isOver = parseFloat(price) > rule.limit;
        if (isOver) {
          if (rule.type === 'REGULATED') {
            setPriceError(`REGISTRY ALERT: RM ${rule.limit}.00 max ceiling for ${category.toUpperCase()}.`);
            setGovernanceStatus('BLOCKED');
          } else {
            setPriceError(`MARKET NOTE: Recommended ceiling is RM ${rule.limit}.00.`);
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

  const handlePost = async () => {
    setIsPosting(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "items"), {
        title,
        description: appealText || description,
        category,
        condition,
        price: parseFloat(price),
        stock: parseInt(quantity),
        delivery_mode: delivery,
        images,
        seller_id: user?.uid || 'ANON-SELLER',
        seller_name: user?.displayName || 'Pulse Student',
        status: governanceStatus === 'BLOCKED' ? 'pending_exemption' : 'ACTIVE',
        governance_status: governanceStatus,
        is_exemption_request: governanceStatus === 'BLOCKED',
        created_at: serverTimestamp()
      });
      router.push('/marketplace');
    } catch (e) {
      console.error(e);
      alert("Relay failed.");
    } finally {
      setIsPosting(false);
    }
  };

  const getPostButtonText = () => {
    if (isPosting) return 'RELAYING';
    if (governanceStatus === 'BLOCKED') return 'APPEAL AUDIT';
    return 'CONFIRM LISTING';
  };

  return (
    <main className="min-h-screen bg-white font-sans text-[#1e293b] antialiased pb-40">
      {/* ── HEADER (Compact Skibidi) ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-8 py-8 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-50">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 text-[#94a3b8] hover:text-[#1e293b] transition-all">
               <X size={24} />
            </button>
            <div>
               <h1 className="text-[15px] font-bold tracking-tight text-[#1e293b]">Institutional Registry</h1>
               <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Campus Center</p>
            </div>
         </div>
      </nav>

      {/* ── CONTENT (Compact Skibidi) ── */}
      <div className="pt-28 px-8">
        
        {/* 1. ASSETS SECTION */}
        <section className="py-10 border-b border-slate-50">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-[17px] font-bold text-[#1e293b] tracking-tight">Visual Assets</h2>
              <span className="text-[12px] font-bold text-[#94a3b8] leading-relaxed">{images.length}/10</span>
           </div>
           
           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-32 h-32 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 hover:bg-slate-100 transition-all group"
              >
                <Plus size={20} className="text-[#94a3b8] group-hover:text-[#1e293b]" />
                <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Add</span>
              </button>
              
              <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />

              {images.map((img, i) => (
                <div key={i} className="shrink-0 w-32 h-32 relative rounded-xl border border-slate-50 group overflow-hidden">
                  <img src={img} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-2 right-2 w-7 h-7 bg-white shadow-xl rounded-full flex items-center justify-center text-[#1e293b] opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
           </div>
        </section>

        {/* ── FORM SECTION (Compact Flow) ── */}
        <div className="space-y-12 py-10">
          
          {/* Classification */}
          <section className="space-y-6 border-b border-slate-50 pb-10">
             <h2 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em]">Classification</h2>
             <div className="flex flex-wrap gap-3">
                {MAIN_CATEGORIES.map(cat => (
                   <button 
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl border transition-all duration-300 text-[13px] font-bold tracking-tight ${
                      category === cat ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-lg shadow-slate-900/10' : 'bg-white border-slate-50 text-[#94a3b8] hover:border-slate-200'
                    }`}
                   >
                      {cat}
                   </button>
                ))}
             </div>
          </section>

          {/* Product Identity */}
          <div className="space-y-4 border-b border-slate-50 pb-10">
             <h2 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em]">Product Identity</h2>
             <input 
               placeholder="ENTER TITLE..."
               value={title}
               onChange={(e) => setTitle(e.target.value.toUpperCase())}
               className="w-full bg-transparent text-[24px] font-bold text-[#1e293b] placeholder:text-slate-100 focus:outline-none tracking-tight leading-none"
             />
          </div>

          <div className="space-y-4 border-b border-slate-50 pb-10">
             <h2 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em]">Specifications</h2>
             <textarea 
               placeholder="PROVIDE DETAILS..."
               rows={3}
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               className="w-full bg-transparent text-[16px] font-bold text-[#1e293b] placeholder:text-slate-100 focus:outline-none resize-none leading-relaxed"
             />
          </div>

          {/* Quality State */}
          <div className="space-y-6 border-b border-slate-50 pb-10">
             <h2 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em]">Quality State</h2>
             <div className="grid grid-cols-1 gap-4">
                {CONDITION_OPTS.map(opt => (
                   <button 
                     key={opt.label}
                     onClick={() => setCondition(opt.label)}
                     className={`p-6 rounded-xl border text-left transition-all duration-300 ${
                       condition === opt.label ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-lg' : 'bg-white border-slate-50 text-[#94a3b8] hover:border-slate-200'
                     }`}
                   >
                      <p className="text-[15px] font-bold tracking-tight uppercase">{opt.label}</p>
                      <p className={`text-[12px] font-bold mt-1 leading-relaxed ${condition === opt.label ? 'text-white/40' : 'text-[#94a3b8]'}`}>{opt.desc}</p>
                   </button>
                ))}
             </div>
          </div>
          
          {/* Market Value */}
          <div className="space-y-4 border-b border-slate-50 pb-10">
             <h2 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em]">Market Value (RM)</h2>
             <div className="flex items-baseline gap-4">
                <span className="text-[21px] font-bold text-slate-100">RM</span>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-transparent text-[32px] font-bold text-[#1e293b] focus:outline-none tracking-tighter"
                />
             </div>
          </div>

          {/* Inventory */}
          <div className="space-y-4 border-b border-slate-50 pb-10">
             <h2 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em]">Stock Inventory</h2>
             <input 
                type="number" 
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-transparent text-[32px] font-bold text-[#1e293b] focus:outline-none tracking-tighter"
             />
          </div>

          {/* Relay Strategy */}
          <div className="space-y-8 pb-10">
             <h2 className="text-[16px] font-bold text-[#1e293b] tracking-tight">Relay Strategy</h2>
             <div className="space-y-6">
               {['Pick up', 'Runner'].map((opt) => (
                 <button 
                   key={opt}
                   onClick={() => setDelivery(opt)}
                   className="flex items-center justify-between w-full group py-3 border-b border-slate-50 hover:border-slate-200 transition-all"
                 >
                    <div className="flex items-center gap-6 text-left">
                       <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${delivery === opt ? 'bg-[#1e293b] text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
                          {opt === 'Pick up' ? <Handshake size={18} /> : <Truck size={18} />}
                       </div>
                       <span className={`text-[16px] font-bold tracking-tight transition-all ${delivery === opt ? 'text-[#1e293b]' : 'text-[#94a3b8]'}`}>{opt}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${delivery === opt ? 'bg-[#1e293b] border-[#1e293b]' : 'border-slate-100'}`}>
                       {delivery === opt && <Check size={12} strokeWidth={3} className="text-white" />}
                    </div>
                 </button>
               ))}
             </div>
          </div>
        </div>

        {/* ── AUDIT NOTICE ── */}
        {priceError && (
           <div className="py-12 border-t border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                 <ShieldCheck size={18} className="text-[#1e293b]" />
                 <h2 className="text-[16px] font-bold text-[#1e293b] tracking-tight">Audit Required</h2>
              </div>
              <p className="text-[11px] font-bold text-[#94a3b8] leading-relaxed uppercase">
                 {priceError}
              </p>
           </div>
        )}
      </div>

      {/* ── STICKY FOOTER ACTION ── */}
      <div className="fixed bottom-0 left-0 right-0 z-60 p-8 bg-white/90 backdrop-blur-2xl border-t border-slate-50">
        <button 
          disabled={!title || !price || !category || images.length === 0 || isPosting}
          onClick={() => {
             if (governanceStatus === 'BLOCKED' && !isAppealOpen) {
                setIsAppealOpen(true);
             } else {
                handlePost();
             }
          }}
          className={`w-full h-16 rounded-2xl flex items-center justify-center gap-4 transition-all duration-500 shadow-2xl ${
            !title || !price || !category || images.length === 0 || isPosting
              ? 'bg-slate-50 text-slate-200'
              : 'bg-[#1e293b] text-white shadow-[#1e293b]/30'
          }`}
        >
          <span className="text-[16px] font-bold uppercase tracking-[0.3em] ml-2">{getPostButtonText()}</span>
          {isPosting && <Loader2 className="animate-spin" size={20} />}
        </button>
      </div>

      {/* ── EXEMPTION AUDIT MODAL ── */}
      <AnimatePresence>
         {isAppealOpen && (
            <div className="fixed inset-0 z-1000 flex items-center justify-center p-8">
               <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setIsAppealOpen(false)}
                  className="absolute inset-0 bg-[#1e293b]/60 backdrop-blur-md"
               />
               <motion.div 
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                  className="relative w-full max-w-md bg-white rounded-[32px] p-10 space-y-10 shadow-3xl"
               >
                  <div className="space-y-4">
                     <p className="text-[11px] font-bold text-[#94a3b8] leading-relaxed">Administrative Audit</p>
                     <h2 className="text-[18px] font-bold text-[#1e293b] tracking-tight">Request Exemption</h2>
                  </div>
                  <textarea 
                     value={appealText}
                     onChange={(e) => setAppealText(e.target.value)}
                     placeholder="State justification..."
                     className="w-full h-40 p-6 bg-slate-50 rounded-2xl border border-slate-100 text-[16px] font-bold text-[#1e293b] focus:outline-none resize-none shadow-inner"
                  />
                  <div className="flex gap-4">
                     <button onClick={() => setIsAppealOpen(false)} className="flex-1 h-14 rounded-2xl border border-slate-100 text-[12px] font-bold uppercase tracking-[0.2em] text-[#94a3b8]">Cancel</button>
                     <button onClick={() => { setIsAppealOpen(false); handlePost(); }} className="flex-1 h-14 rounded-2xl bg-[#1e293b] text-white text-[12px] font-bold uppercase tracking-[0.2em] shadow-xl">Submit</button>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </main>
  );
}
