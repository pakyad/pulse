'use client'
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Plus, Trash2, Loader2,
  UtensilsCrossed, BookOpen, Wrench, Home, Cpu,
  TrendingUp
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';


import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { MARKETPLACE_DOMAINS, DomainID } from '@/lib/marketplace/domains';
import SmartFormFields from '@/components/marketplace/SmartFormFields';
import { analysePrice, PriceIntelligence } from '@/lib/marketplace/price-governance';

// ── DOMAIN ICONS (aligned with Marketplace page icon pattern) ──
const DOMAIN_ICONS: Record<DomainID, React.ElementType> = {
  HUNGER: UtensilsCrossed,
  ACADEMIC: BookOpen,
  SERVICES: Wrench,
  HOSTEL: Home,
  TECH: Cpu,
};

const DOMAIN_LABELS: Record<DomainID, string> = {
  HUNGER: 'Food',
  ACADEMIC: 'Books',
  SERVICES: 'Services',
  HOSTEL: 'Hostel',
  TECH: 'Tech',
};

export default function CreateListingPage() {
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState<DomainID | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [stock, setStock] = useState('');
  const [justification, setJustification] = useState('');

  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── MARKET INTELLIGENCE ENGINE (Trust-First, Advisory Only) ──
  const priceIntel: PriceIntelligence | null = useMemo(() => {
    const numericPrice = parseFloat(price);
    if (!selectedDomain || !price || isNaN(numericPrice) || numericPrice <= 0) return null;
    return analysePrice(numericPrice, selectedDomain as DomainID, subcategory);
  }, [selectedDomain, subcategory, price]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string].slice(0, 10));
      reader.readAsDataURL(file);
    });
  };

  const handlePost = async () => {
    if (!selectedDomain) return;
    setIsPosting(true);
    setPostError(null);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Upload images to Firebase Storage → get download URLs
      setIsUploading(true);
      const imageUrls: string[] = await Promise.all(
        images.map(async (base64, i) => {
          const storageRef = ref(storage, `listings/${user.uid}_${Date.now()}_${i}.jpg`);
          await uploadString(storageRef, base64, 'data_url');
          return getDownloadURL(storageRef);
        })
      );
      setIsUploading(false);

      // Trust-First: ALL listings go live. Auto-flag only egregious ones.
      const isAutoFlagged = priceIntel?.shouldAutoFlag === true;
      const stockCount = stock !== '' ? parseInt(stock, 10) : null;

      await addDoc(collection(db, 'items'), {
        title,
        description,
        domain: selectedDomain,
        subcategory,
        price: parseFloat(price),
        stock_count: stockCount,
        metadata,
        images: imageUrls,
        image_url: imageUrls[0] || null,
        seller_id: user.uid,
        seller_name: user.displayName || 'Pulse Student',
        // Always goes live — never blocked
        status: stockCount === 0 ? 'sold_out' : 'active',
        price_tier: priceIntel?.tier || 'COMPLIANT',
        governance_ceiling: priceIntel?.ceiling || null,
        is_price_flagged: isAutoFlagged,
        price_flag_count: isAutoFlagged ? 1 : 0,
        flag_source: isAutoFlagged ? 'SYSTEM' : null,
        price_appeal: isAutoFlagged ? justification : '',
        created_at: serverTimestamp(),
      });
      router.push('/marketplace');
    } catch (e: any) {
      console.error('[CreateListing]', e);
      setIsUploading(false);
      setPostError(e?.code === 'storage/unauthorized'
        ? 'Image upload failed. Please check your connection.'
        : 'Failed to post listing. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Sellers are never blocked — canPost has no price restriction
  const canPost = !!title && !!price && !!subcategory && images.length > 0 && !isPosting;

  return (
    <main className="min-h-screen bg-white text-[#000000] antialiased pb-40">

      {/* ── NAV (matches Marketplace page nav exactly) ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <p className="text-[14px] font-bold tracking-tight">New Listing</p>
            <p className="text-[10px] font-medium text-[#94a3b8]">Institutional Registry</p>
          </div>
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-10">

        {/* ── SECTION: CLASSIFICATION (matches Marketplace filter pill pattern) ── */}
        <section className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">What are you listing?</h2>
            <p className="text-[11px] font-medium text-[#94a3b8]">Choose the category that fits your item.</p>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-6 px-6">
            {(Object.keys(DOMAIN_LABELS) as DomainID[]).map((id) => {
              const isActive = selectedDomain === id;
              const Icon = DOMAIN_ICONS[id];
              return (
                <button
                  key={id}
                  onClick={() => { setSelectedDomain(id); setSubcategory(''); }}
                  className={`h-[32px] px-4 rounded-full flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap border-[0.5px] ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-slate-50/50 border-slate-900/10 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[12px] font-bold tracking-[-0.2px]">{DOMAIN_LABELS[id]}</span>
                </button>
              );
            })}
          </div>
        </section>

        {selectedDomain && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-10"
          >

            {/* ── SECTION: IMAGES ── */}
            <section className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">Photos</h2>
                  <p className="text-[11px] font-medium text-[#94a3b8]">Add up to 10 images.</p>
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
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">Name</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Keep it short and clear.</p>
              </div>
              <input
                placeholder="e.g. Calculus Textbook, Canon EOS..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-[#000000] placeholder:text-slate-200 focus:outline-none focus:border-blue-600 transition-colors"
              />
            </section>

            {/* ── SECTION: DETAILS ── */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">Description</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Condition, reason for selling, any notes.</p>
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
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">Price</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Set your asking price in Ringgit.</p>
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
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">Stock</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">How many do you have? Set to 0 to mark as sold out.</p>
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
              {stock !== '' && parseInt(stock, 10) === 0 && (
                <p className="text-[11px] font-bold text-red-400">This listing will be marked as Sold Out immediately.</p>
              )}
            </section>

            {/* ── SECTION: SMART DOMAIN FIELDS ── */}
            <section className="pt-2 border-t border-slate-100">
              <div className="space-y-0.5 mb-6">
                <h2 className="text-[14px] font-bold text-[#000000] tracking-tight">More Details</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">
                  Specific information about this type of listing.
                </p>
              </div>
              <SmartFormFields
                domainId={selectedDomain as DomainID}
                subcategory={subcategory}
                onSubcategoryChange={setSubcategory}
                metadata={metadata}
                onMetadataChange={(k, v) => setMetadata(prev => ({ ...prev, [k]: v }))}
              />
            </section>

            {/* ── POST BUTTON ── */}
            <div className="pt-4">
              <button
                disabled={!canPost || isUploading}
                onClick={handlePost}
                className={`w-full h-12 rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 transition-all ${
                  canPost && !isUploading
                    ? 'bg-blue-600 text-white active:scale-[0.98] shadow-sm'
                    : 'bg-slate-50 text-slate-200 border border-slate-100'
                }`}
              >
                {(isPosting || isUploading) && <Loader2 size={16} className="animate-spin" />}
                {isUploading ? 'Uploading Photos...' : isPosting ? 'Publishing...' : 'Publish Listing'}
              </button>
              {/* ── POST ERROR TOAST ── */}
              {postError && (
                <p className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center mt-3">
                  {postError}
                </p>
              )}
            </div>

          </motion.div>
        )}
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </main>
  );
}
