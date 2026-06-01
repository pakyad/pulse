"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Trash2, Loader2,
  UtensilsCrossed, BookOpen, Wrench, Home, Cpu, Shirt,
  ArrowUpRight, Zap, TrendingUp
} from 'lucide-react';

import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/domains';
import SmartFormFields from '@/components/marketplace/SmartFormFields';
import { analysePrice, PriceIntelligence } from '@/lib/marketplace/price-governance';

interface CreateListingProps {
  userId: string;
  role: string;
  onClose: () => void;
  existingItem?: any;
}

const CATEGORY_ICONS: Record<CategoryID, React.ElementType> = {
  HUNGER: UtensilsCrossed,
  ACADEMIC: BookOpen,
  SERVICES: Wrench,
  HOSTEL: Home,
  TECH: Cpu,
  APPAREL: Shirt,
};

const CATEGORY_LABELS: Record<CategoryID, string> = {
  HUNGER: 'Food',
  ACADEMIC: 'Books',
  SERVICES: 'Services',
  HOSTEL: 'Hostel',
  TECH: 'Tech',
  APPAREL: 'Apparel',
};

export default function CreateListing({ userId, role, onClose, existingItem }: CreateListingProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<CategoryID | ''>(existingItem?.category || '');
  const [subcategory, setSubcategory] = useState(existingItem?.subcategory || '');
  const [images, setImages] = useState<string[]>(existingItem?.images || []);
  const [title, setTitle] = useState(existingItem?.title || '');
  const [description, setDescription] = useState(existingItem?.description || '');
  const [price, setPrice] = useState(existingItem?.price?.toString() || '');
  const [metadata, setMetadata] = useState<Record<string, any>>(existingItem?.metadata || {});
  const [stock, setStock] = useState(existingItem?.stock_count?.toString() || '1');
  const [justification, setJustification] = useState(existingItem?.price_appeal || '');

  const [isPosting, setIsPosting] = useState(false);

  // ── FORCE SYNC EXISTING ITEM DATA ──
  useEffect(() => {
    if (existingItem) {
      setSelectedCategory(existingItem.category || '');
      setSubcategory(existingItem.subcategory || '');
      setImages(existingItem.images || []);
      setTitle(existingItem.title || '');
      setDescription(existingItem.description || '');
      setPrice(existingItem.price?.toString() || '');
      setMetadata(existingItem.metadata || {});
      setStock(existingItem.stock_count?.toString() || '0');
    }
  }, [existingItem]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── MARKET INTELLIGENCE ENGINE (Trust-First, Advisory Only) ──
  const priceIntel: PriceIntelligence | null = useMemo(() => {
    const numericPrice = parseFloat(price);
    if (!selectedCategory || !price || isNaN(numericPrice) || numericPrice <= 0) return null;
    return analysePrice(numericPrice, selectedCategory as CategoryID, subcategory);
  }, [selectedCategory, subcategory, price]);

  // 🏛️ Institutional Image Compressor: Prevents 1MB Firestore limit crashes
  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress to 0.7 quality to stay well under the 1MB limit
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setImages(prev => [...prev, compressed].slice(0, 10));
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePost = async () => {
    if (!selectedCategory) return;
    setIsPosting(true);
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const user = auth.currentUser;

      // Trust-First: ALL listings go live. Auto-flag only the egregious ones.
      const isAutoFlagged = priceIntel?.shouldAutoFlag === true;
      const stockCount = stock !== '' ? parseInt(stock, 10) : null;
      const itemStatus = stockCount === 0 ? 'sold_out' : 'active';

      const data = {
        title,
        description,
        category: selectedCategory,
        subcategory,
        price: parseFloat(price),
        stock_count: stockCount,
        metadata,
        images,
        seller_id: userId || user?.uid || 'ANON',
        seller_name: user?.displayName || 'Pulse Vendor',
        // Always goes live — trust the seller by default
        status: itemStatus,
        // Governance intelligence stored for admin reference
        price_tier: priceIntel?.tier || 'COMPLIANT',
        governance_ceiling: priceIntel?.ceiling || null,
        // Auto-flag if price > 150% of ceiling (algorithmic, no buyer needed)
        is_price_flagged: isAutoFlagged,
        price_flag_count: isAutoFlagged ? 1 : 0,
        flag_source: isAutoFlagged ? 'SYSTEM' : null,
        price_appeal: isAutoFlagged ? justification : '',
        is_official: role?.toUpperCase() === 'CLUB' || role?.toUpperCase() === 'MERCHANT',
        updated_at: serverTimestamp(),
      };

      if (existingItem) {
        await updateDoc(doc(db, 'items', existingItem.id), data);
      } else {
        const { addDoc, collection } = await import('firebase/firestore');
        await addDoc(collection(db, 'items'), {
          ...data,
          created_at: serverTimestamp()
        });
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to process listing.');
    } finally {
      setIsPosting(false);
    }
  };

  // Sellers are never blocked — canPost has no price restriction
  const canPost = !!title && !!price && !!subcategory && images.length > 0 && !isPosting;

  return (
    <div className="fixed inset-0 z-1000 flex flex-col bg-white overflow-hidden font-sans antialiased text-[#000000]">
      
      {/* ── HEADER (Mirroring student navigation) ── */}
      <nav className="px-6 py-5 flex items-center justify-between bg-white border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all"
          >
            <X size={18} />
          </button>
          <div>
            <p className="text-[14px] font-bold tracking-tight">{existingItem ? 'Edit Listing' : 'New Listing'}</p>
            <p className="text-[10px] font-medium text-[#94a3b8]">Institutional Registry</p>
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-40 px-6 pt-10">

        {/* 🏛️ Actionable Intelligence (Institutional Guidance) */}
        {existingItem && existingItem.stock_count <= 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-6 bg-slate-900 rounded-2xl text-white shadow-md shadow-slate-900/10"
          >
            <div className="flex items-center gap-2 mb-4 text-amber-400">
               <Zap size={16} />
               <p className="text-[10px] font-black uppercase tracking-widest">Opportunity Detected</p>
            </div>
            <h3 className="text-[16px] font-bold tracking-tight mb-2">Demand is peaking for this asset.</h3>
            <p className="text-[12px] text-white/60 font-medium leading-relaxed mb-6">
              Students have been viewing this listing even while it was out of stock. Restock now to capture the current campus demand velocity.
            </p>
            <div className="grid grid-cols-2 gap-3">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Recommendation</p>
                  <p className="text-[12px] font-bold italic text-white/90">Restock +10 units</p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Pricing Health</p>
                  <p className="text-[12px] font-bold text-emerald-400">Competitive</p>
               </div>
            </div>
          </motion.div>
        )}
        
        {/* ── SECTION: CLASSIFICATION ── */}
        <section className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">{existingItem ? 'Category' : 'What are you listing?'}</h2>
            <p className="text-[11px] font-medium text-[#94a3b8]">{existingItem ? 'Change the category if needed.' : 'Choose the category that fits your item.'}</p>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-6 px-6">
            {(Object.keys(CATEGORY_LABELS) as CategoryID[]).map((id) => {
              const isActive = selectedCategory === id;
              const Icon = CATEGORY_ICONS[id];
              return (
                <button
                  key={id}
                  onClick={() => { setSelectedCategory(id); setSubcategory(''); }}
                  className={`h-[32px] px-4 rounded-full flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap border-[0.5px] ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-slate-50/50 border-slate-900/10 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[12px] font-bold tracking-[-0.2px]">{CATEGORY_LABELS[id]}</span>
                </button>
              );
            })}
          </div>
        </section>

        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-10 mt-10"
          >

            {/* ── SECTION: IMAGES ── */}
            <section className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center pt-6">
                <div className="space-y-0.5">
                  <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">{existingItem ? 'Photos' : 'Photos'}</h2>
                  <p className="text-[11px] font-medium text-[#94a3b8]">{existingItem ? 'Update your product photos (max 10).' : 'Add up to 10 images.'}</p>
                </div>
                <span className="text-[11px] font-bold text-[#94a3b8]">{images.length}/10</span>
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 w-24 h-24 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-100 transition-all"
                >
                  <Plus size={18} className="text-[#94a3b8]" />
                  <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest">Add</span>
                </button>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                {images.map((img, i) => (
                  <div key={i} className="shrink-0 w-24 h-24 relative rounded-xl overflow-hidden border border-slate-100 group">
                    <img src={img} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-blue-600/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* ── SECTION: NAME ── */}
            <section className="space-y-3 pt-6 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">{existingItem ? 'Item Name' : 'Name'}</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">{existingItem ? 'Update the name of this item.' : 'Keep it short and clear.'}</p>
              </div>
              <input
                placeholder="e.g. Calculus Textbook, Canon EOS..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-[#000000] placeholder:text-slate-200 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </section>

            {/* ── SECTION: DETAILS ── */}
            <section className="space-y-3 pt-6 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">{existingItem ? 'Description' : 'Description'}</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">{existingItem ? 'Update condition or add new details.' : 'Condition, reason for selling, any notes.'}</p>
              </div>
              <textarea
                placeholder="Tell the buyer what they need to know..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-[#000000] placeholder:text-slate-200 focus:outline-none focus:border-blue-600 transition-colors resize-none leading-relaxed"
              />
            </section>

            {/* ── SECTION: PRICE ── */}
            <section className="space-y-3 pt-6 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">Price</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">{existingItem ? 'Change your asking price.' : 'Set your asking price in Ringgit.'}</p>
              </div>

              <div className="flex items-center gap-0 h-12 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:border-blue-600 transition-colors">
                <span className="px-4 text-[13px] font-bold text-[#94a3b8] border-r border-slate-100">RM</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 h-full px-4 bg-transparent text-[14px] font-bold text-[#000000] placeholder:text-slate-200 focus:outline-none"
                />
              </div>

              {/* ── MARKET INTELLIGENCE PANEL (Airbnb-style, advisory only) ── */}
              <AnimatePresence>
                {priceIntel && price && (
                  <motion.div
                    key={priceIntel.tier}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-2xl p-4 border transition-all ${
                      priceIntel.tier === 'COMPLIANT'
                        ? 'bg-emerald-50 border-emerald-100'
                        : priceIntel.tier === 'ADVISORY'
                        ? 'bg-amber-50 border-amber-100'
                        : 'bg-slate-50 border-slate-200/60 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        priceIntel.tier === 'COMPLIANT' ? 'bg-emerald-100' :
                        priceIntel.tier === 'ADVISORY' ? 'bg-amber-100' : 'bg-slate-200/60'
                      }`}>
                        <TrendingUp size={14} className={`${
                          priceIntel.tier === 'COMPLIANT' ? 'text-emerald-600' :
                          priceIntel.tier === 'ADVISORY' ? 'text-amber-600' : 'text-slate-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-[12px] font-bold mb-1 ${
                          priceIntel.tier === 'COMPLIANT' ? 'text-emerald-700' :
                          priceIntel.tier === 'ADVISORY' ? 'text-amber-700' : 'text-slate-800'
                        }`}>
                          {priceIntel.message}
                        </p>
                        <p className={`text-[11px] font-medium leading-relaxed ${
                          priceIntel.tier === 'COMPLIANT' ? 'text-emerald-600' :
                          priceIntel.tier === 'ADVISORY' ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {priceIntel.subMessage}
                        </p>
                        {priceIntel.tier === 'AUTO_FLAG' && (
                          <div className="mt-3 space-y-2">
                            <p className="text-[10px] font-semibold text-slate-400">
                              System Advisory: This asking price is outside typical campus boundaries. It will be published live, but flagged silently for market review.
                            </p>
                            <textarea
                              value={justification}
                              onChange={(e) => setJustification(e.target.value)}
                              placeholder="Describe any features justifying this price (e.g., custom bundle, premium packaging...)"
                              className="w-full min-h-[60px] p-3 text-[11px] font-semibold bg-white border border-slate-200/80 rounded-xl focus:outline-none focus:border-slate-800 placeholder:text-slate-300 transition-colors text-slate-800"
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* ── SECTION: STOCK ── */}
            <section className="space-y-3 pt-6 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">{existingItem ? 'Stock' : 'Stock'}</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">{existingItem ? 'Update how many you have left. Set to 0 if sold out.' : 'How many do you have? Set to 0 to mark as sold out.'}</p>
              </div>
              <div className="flex items-center gap-0 h-12 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:border-blue-600 transition-colors">
                <span className="px-4 text-[13px] font-bold text-[#94a3b8] border-r border-slate-100">Qty</span>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="flex-1 h-full px-4 bg-transparent text-[14px] font-bold text-[#000000] placeholder:text-slate-200 focus:outline-none"
                />
              </div>
            </section>

            {/* ── SECTION: SMART CATEGORY FIELDS ── */}
            <section className="pt-6 border-t border-slate-100">
              <div className="space-y-0.5 mb-6">
                <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">{existingItem ? 'More Details' : 'More Details'}</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">{existingItem ? 'Update specific information for this item.' : 'Specific information about this type of listing.'}</p>
              </div>
              <SmartFormFields
                categoryId={selectedCategory as CategoryID}
                subcategory={subcategory}
                onSubcategoryChange={setSubcategory}
                metadata={metadata}
                onMetadataChange={(k, v) => setMetadata(prev => ({ ...prev, [k]: v }))}
              />
            </section>
          </motion.div>
        )}
      </div>

      {/* ── STICKY FOOTER ACTION ── */}
      <div className="fixed bottom-0 left-0 right-0 z-60 p-8 bg-white/90 backdrop-blur-2xl border-t border-slate-50">
        <button 
          disabled={!canPost}
          onClick={handlePost}
          className={`w-full h-12 rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 transition-all ${
            canPost
              ? 'bg-blue-600 text-white active:scale-[0.98] shadow-sm'
              : 'bg-slate-50 text-slate-200 border border-slate-100'
          }`}
        >
          {isPosting ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={18} />}
          {isPosting ? 'Publishing...' : (existingItem ? 'Update Listing' : 'Publish Listing')}
        </button>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}

