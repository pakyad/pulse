'use client'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Loader2, Briefcase,
  BookOpen, Home, Cpu, Shirt,
  ShieldCheck, ShieldAlert, Globe, AlertCircle
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, doc, onSnapshot, getDocs, serverTimestamp, setDoc, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';
import SmartFormFields from '@/components/marketplace/SmartFormFields';
import { CAMPUS_NODES, getLocationBadge } from '@/lib/core/locations';

//  DOMAIN ICONS (aligned with Marketplace page icon pattern) 
const CATEGORY_ICONS: Record<CategoryID, React.ElementType> = {
  ACADEMIC: BookOpen,
  HOSTEL: Home,
  TECH: Cpu,
  APPAREL: Shirt,
  SERVICES: Briefcase,
};

const CATEGORY_LABELS: Record<CategoryID, string> = {
  ACADEMIC: 'Academic',
  HOSTEL: 'Hostel',
  TECH: 'Tech',
  APPAREL: 'Apparel',
  SERVICES: 'Services',
};

const SERVICES_SUBCATEGORIES = [
  'Tutoring & Academic Help',
  'Coding & Debugging',
  'Design & Creative',
  'Resume & Career',
  'Photography & Video',
  'Translation & Writing',
  'Other Campus Services',
];

interface MarketCheck {
  market_baseline: number | null;
  max_campus_price: number;
  source: 'SERP_LIVE' | 'FIRESTORE_CACHE' | 'FIRESTORE_REFERENCE' | 'STATIC_CEILING' | 'NOT_COMPARABLE' | 'EXEMPT';
  source_detail: string;
  is_enforced: boolean;
  comparable?: boolean;
}

export default function CreateListingPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<CategoryID | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [stock, setStock] = useState('');
  const [justification, setJustification] = useState('');
  const [fulfillmentMode, setFulfillmentMode] = useState<'DELIVERY' | 'MEETUP_ONLY'>('DELIVERY');
  const [handoverNode, setHandoverNode] = useState(CAMPUS_NODES[0].token);

  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [pcsError, setPcsError] = useState<{
    marketBaselinePrice: number;
    maxAllowedStudentPrice: number;
    itemTitle: string;
  } | null>(null);

  //  PCS VERIFICATION STATE 
  const [pcsPhase, setPcsPhase] = useState<'idle' | 'verifying' | 'approved' | 'rejected'>('idle');
  const [pcsResult, setPcsResult] = useState<any>(null);
  const [pcsItemId, setPcsItemId] = useState<string | null>(null);
  const [pcsApprovedBanner, setPcsApprovedBanner] = useState(false);
  const pcsUnsubRef = useRef<(() => void) | null>(null);

  //  LIVE MARKET INTELLIGENCE 
  const [marketCheck, setMarketCheck] = useState<MarketCheck | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup PCS listener on unmount
  useEffect(() => {
    return () => {
      if (pcsUnsubRef.current) pcsUnsubRef.current();
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fire price check when title + category + subcategory are all set
  const triggerPriceCheck = useCallback(async (t: string, cat: string, sub: string, p?: string) => {
    if (t.trim().length < 10 || !cat || !sub) return; // Require 10+ chars AND subcategory
    setMarketLoading(true);
    setMarketCheck(null);
    try {
      const res = await fetch('/api/marketplace/price-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t.trim(), category: cat, subcategory: sub, proposedPrice: p ? parseFloat(p) : undefined, sellerId: auth.currentUser?.uid }),
      });
      if (res.ok) {
        const data = await res.json();
        setMarketCheck(data);
      }
    } catch (e) {
      console.error('[PriceCheck] fetch failed', e);
    } finally {
      setMarketLoading(false);
    }
  }, []);

  // Reset market check and PCS state when category or subcategory changes
  useEffect(() => {
    setMarketCheck(null);
    setPcsPhase('idle');
    setPcsResult(null);
    setPcsItemId(null);
    setPcsApprovedBanner(false);
    if (pcsUnsubRef.current) {
      pcsUnsubRef.current();
      pcsUnsubRef.current = null;
    }
  }, [selectedCategory, subcategory]);

  // Debounced title-driven check  only fires when title + subcategory both ready
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (title.trim().length >= 10 && selectedCategory && subcategory) {
      debounceRef.current = setTimeout(() => {
        const fullTitle = metadata.brand ? `${metadata.brand} ${title.trim()}` : title.trim();
        triggerPriceCheck(fullTitle, selectedCategory as string, subcategory, price);
      }, 900);
    } else if (!subcategory || title.trim().length < 10) {
      setMarketCheck(null);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [title, selectedCategory, subcategory, triggerPriceCheck, metadata.brand]);

  // Derive the dynamic title hint from the selected subcategory config
  const selectedSubcategoryConfig = useMemo(() => {
    if (!selectedCategory) return null;
    return MARKETPLACE_CATEGORIES[selectedCategory as CategoryID]?.subcategories
      .find((s) => s.label === subcategory) ?? null;
  }, [selectedCategory, subcategory]);

  const titleHint = selectedSubcategoryConfig?.titleHint ?? 'e.g. Logitech MX Master 3, Thomas Calculus...';


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string].slice(0, 10));
      reader.readAsDataURL(file);
    });
  };

  const checkIsPriceControlled = async (sub: string): Promise<boolean> => {
    const snap = await getDocs(collection(db, 'PriceGuidelines'));
    let controlled = false;
    snap.forEach((doc) => {
      const data = doc.data();
      const subs: any[] = data.subcategories || [];
      const match = subs.find((s) => s.label === sub);
      if (match) controlled = match.is_price_controlled === true;
    });
    return controlled;
  };

  const handlePost = async () => {
    if (!selectedCategory) return;
    setIsPosting(true);
    setPostError(null);
    setPcsError(null);
    
    const numPrice = parseFloat(price);
    console.log('PCS validating:', title, numPrice);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const sellerId = user.uid;
      const itemId = doc(collection(db, 'items')).id;

      const functions = getFunctions(undefined, 'us-central1');
      const pcsValidate = httpsCallable(functions, 'pcsValidate');
      const pcsResult = await pcsValidate({
        itemTitle: title,
        itemPrice: numPrice,
        category: selectedCategory,
        subcategory,
        sellerId,
        itemId
      });

      console.log('PCS result:', JSON.stringify(pcsResult.data));
      const pcsData = pcsResult.data as any;

      if (pcsData.isApproved === false) {
        setPcsError({
          marketBaselinePrice: pcsData.marketBaselinePrice,
          maxAllowedStudentPrice: pcsData.maxAllowedStudentPrice,
          itemTitle: title
        });
        setIsPosting(false);
        return; // HARD STOP  nothing below this runs
      }

      setIsUploading(true);
      const imageUrls: string[] = await Promise.all(
        images.map(async (base64, i) => {
          const storageRef = ref(storage, `listings/${user.uid}_${Date.now()}_${i}.jpg`);
          await uploadString(storageRef, base64, 'data_url');
          return getDownloadURL(storageRef);
        })
      );
      setIsUploading(false);

      const stockCount = stock !== '' ? parseInt(stock, 10) : null;
      const isPriceEnforced = marketCheck?.is_enforced ?? false;
      const isAutoFlagged = isPriceEnforced && numPrice > (marketCheck?.max_campus_price ?? Infinity);

      const itemData = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        subcategory,
        price: numPrice,
        stock_count: stockCount,
        metadata,
        images: imageUrls,
        image_url: imageUrls[0] || null,
        seller_id: user.uid,
        seller_name: user.displayName || 'Pulse Student',
        fulfillment_mode: fulfillmentMode,
        handover_node: handoverNode,
        status: stockCount === 0 ? 'sold_out' : 'active',
        governance_ceiling: marketCheck?.max_campus_price || null,
        market_baseline: marketCheck?.market_baseline || null,
        market_source: marketCheck?.source || 'STATIC_CEILING',
        is_price_flagged: isAutoFlagged,
        price_flag_count: isAutoFlagged ? 1 : 0,
        report_count: 0,
        flag_source: isAutoFlagged ? 'SYSTEM' : null,
        price_justification: justification.trim() || '',
        pcs_certified: true,
        created_at: serverTimestamp(),
      };

      const { setDoc: _setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'items', itemId), itemData);
      router.push('/marketplace');
    } catch (e: any) {
      console.error('[CreateListing]', e);
      setIsUploading(false);
      setIsPosting(false);
      setPcsPhase('idle');
      setPostError(e?.code === 'storage/unauthorized'
        ? 'Image upload failed. Please check your connection.'
        : 'Failed to post listing. Please try again.');
    }
  };

  const numPrice = parseFloat(price);
  const isPriceBlocked = !!(marketCheck?.validation?.zone === 'red');
  const canPost = !!title && !!price && !!subcategory && images.length > 0 && !isPosting && !isPriceBlocked && pcsPhase !== 'verifying';

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">

      {/*  NAV (matches Marketplace page nav exactly)  */}
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

        {/*  SECTION: CLASSIFICATION (matches Marketplace filter pill pattern)  */}
        <section className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">What are you listing?</h2>
            <p className="text-[11px] font-medium text-[#94a3b8]">Choose the category that fits your item.</p>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-6 px-6">
            {(Object.keys(CATEGORY_LABELS) as CategoryID[]).map((id) => {
              const isActive = selectedCategory === id;
              const Icon = CATEGORY_ICONS[id];
              return (
                <button
                  key={id}
                  onClick={() => { setSelectedCategory(id); setSubcategory(''); }}
                  className={`h-[32px] px-4 rounded-full flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap border-[0.5px] ${
                    isActive
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
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
            className="space-y-10"
          >

            {/*  SECTION: SUBCATEGORY  */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Subcategory</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Pick the most specific match.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(selectedCategory === 'SERVICES' ? SERVICES_SUBCATEGORIES : MARKETPLACE_CATEGORIES[selectedCategory as CategoryID]?.subcategories ?? []).map((sub) => {
                  const label = typeof sub === 'string' ? sub : sub.label;
                  const isActive = subcategory === label;
                  return (
                    <button
                      key={label}
                      onClick={() => setSubcategory(label)}
                      className={`h-[32px] px-4 rounded-full flex items-center border-[0.5px] transition-all active:scale-95 text-[12px] font-bold tracking-[-0.2px] whitespace-nowrap ${
                        isActive
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-slate-50/50 border-slate-900/10 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/*  SECTION: SMART CATEGORY FIELDS  */}
            {subcategory && selectedCategory !== 'SERVICES' && MARKETPLACE_CATEGORIES[selectedCategory as CategoryID]?.customFields?.some(f => !f.applicableSubcategories || f.applicableSubcategories.includes(subcategory)) && (
              <section className="pt-2 border-t border-slate-100">
                <div className="space-y-0.5 mb-6">
                  <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">More Details</h2>
                  <p className="text-[11px] font-medium text-[#94a3b8]">
                    Specific information about this type of listing.
                  </p>
                </div>
                <SmartFormFields
                  categoryId={selectedCategory as CategoryID}
                  subcategory={subcategory}
                  onSubcategoryChange={setSubcategory}
                  metadata={metadata}
                  onMetadataChange={(k, v) => setMetadata(prev => ({ ...prev, [k]: v }))}
                />
              </section>
            )}

            {/*  SECTION: IMAGES  */}
            <section className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Photos</h2>
                  <p className="text-[11px] font-medium text-[#94a3b8]">Add up to 10 images.</p>
                </div>
                <span className="text-[11px] font-bold text-[#94a3b8]">{images.length}/10</span>
              </div>

              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 w-24 h-24 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-100 transition-all"
                >
                  <Plus size={18} className="text-[#94a3b8]" />
                  <span className="text-[9px] font-bold text-[#94a3b8] ">Add</span>
                </button>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                {images.map((img, i) => (
                  <div key={i} className="shrink-0 w-24 h-24 relative rounded-xl overflow-hidden border border-slate-100 group">
                    <img src={img} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/*  SECTION: NAME  */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Item Name</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">
                  {subcategory ? `Be specific  include brand and model where possible.` : 'Select a subcategory first to see naming guidance.'}
                </p>
              </div>
              <input
                placeholder={titleHint}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-colors"
              />
              {title.trim().length > 0 && title.trim().length < 10 && (
                <p className="text-[10px] font-bold text-slate-900">
                  Be more specific.
                </p>
              )}
            </section>

            {/*  SECTION: DETAILS  */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Description</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Condition, reason for selling, any notes.</p>
              </div>
              <textarea
                placeholder="Tell the buyer what they need to know..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors resize-none leading-relaxed"
              />
            </section>



            {/*  SECTION: PRICE  */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Price</h2>
                  <p className="text-[11px] font-medium text-[#94a3b8]">Set your asking price in Ringgit.</p>
                </div>
                {marketLoading && (
                  <div className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-300 ">Checking market...</span>
                  </div>
                )}
              </div>

              <div className={`flex items-center gap-0 h-12 bg-slate-50 border rounded-xl overflow-hidden transition-colors ${
                isPriceBlocked ? 'border-red-300 bg-red-50/30' : 'border-slate-100 focus-within:border-slate-900'
              }`}>
                <span className={`px-4 text-[13px] font-bold border-r ${isPriceBlocked ? 'text-red-400 border-red-200' : 'text-[#94a3b8] border-slate-100'}`}>RM</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 h-full px-4 bg-transparent text-[14px] font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none"
                />
              </div>

              {/*  PCS ERROR ALERT  */}
              <AnimatePresence>
                {pcsError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="rounded-2xl p-4 mt-3 border border-amber-200 bg-amber-50">
                      <div className="flex items-start gap-3">
                        <span className="text-xl"></span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-900 mb-1">Heads up  price is a bit high</p>
                          <p className="text-xs text-amber-700 leading-relaxed">We checked the market and found <strong>{pcsError.itemTitle}</strong> going for around <strong>RM{pcsError.marketBaselinePrice.toFixed(2)}</strong> online. To keep things fair for students, campus listings are capped at <strong>RM{pcsError.maxAllowedStudentPrice.toFixed(2)}</strong>  that's 10% below retail.</p>
                          <button 
                            onClick={() => { setPrice(pcsError.maxAllowedStudentPrice.toString()); setPcsError(null); }}
                            className="mt-3 bg-amber-900 text-white text-xs rounded-full px-4 py-1.5 hover:bg-amber-800 transition-colors"
                          >
                            Set to RM{pcsError.maxAllowedStudentPrice.toFixed(2)} and continue {'>'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/*  LIVE MARKET INTELLIGENCE PANEL  */}
              <AnimatePresence mode="wait">
                {marketCheck && !marketLoading && (() => {
                  const numericPrice = parseFloat(price);
                  const hasPriceInput = !!price && !isNaN(numericPrice) && numericPrice > 0;
                  const isBlocked = marketCheck.validation?.zone === 'red';
                  const isWarning = marketCheck.validation?.zone === 'yellow';
                  const isCompliant = marketCheck.validation?.zone === 'green';

                  if (!marketCheck.market_baseline) {
                    return null; // Removed hardcoded ceiling text
                  }

                  return (
                    <motion.div
                      key="market-panel-live"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                      className={`rounded-2xl border overflow-hidden mt-2 ${
                        isBlocked
                          ? 'bg-red-50/80 border-red-100'
                          : isCompliant
                          ? 'bg-emerald-50/80 border-emerald-100'
                          : isWarning
                          ? 'bg-amber-50/80 border-amber-100'
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      {/* Header row */}
                      <div className={`px-4 py-3 flex items-center gap-3 border-b ${
                        isBlocked ? 'border-red-100/50 bg-red-50' :
                        isCompliant ? 'border-emerald-100/50 bg-emerald-50/50' :
                        'border-slate-100'
                      }`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isBlocked ? 'bg-red-100' : isCompliant ? 'bg-emerald-100' : isWarning ? 'bg-amber-100' : 'bg-slate-100'
                        }`}>
                          {isBlocked
                            ? <ShieldAlert size={14} className="text-red-500" />
                            : isCompliant
                            ? <ShieldCheck size={14} className="text-emerald-600" />
                            : isWarning ? <AlertCircle size={14} className="text-amber-500" /> : <Globe size={14} className="text-slate-400" />
                          }
                        </div>
                        <div className="flex-1">
                          <p className={`text-[12px] font-bold tracking-tight ${
                            isBlocked ? 'text-red-700' : isCompliant ? 'text-emerald-700' : isWarning ? 'text-amber-700' : 'text-slate-600'
                          }`}>
                            {isBlocked
                              ? 'Listing Paused  Price Too High'
                              : isCompliant
                              ? 'Campus-Compliant Price '
                              : isWarning ? 'Fair Price Range' : 'Market Intelligence Active'
                            }
                          </p>
                        </div>
                        <span className={`text-[9px] font-semibold px-2 py-1 rounded-md ${
                          marketCheck.source === 'SERP_LIVE'
                            ? 'bg-blue-50 text-blue-500'
                            : marketCheck.source === 'FIRESTORE_CACHE'
                            ? 'bg-violet-50 text-violet-500'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                        {marketCheck.source === 'SERP_LIVE' ? 'Live Data' :
                           marketCheck.source === 'FIRESTORE_CACHE' ? 'Cached' : 'Reference'}
                        </span>
                      </div>

                      {/* Price data rows */}
                      <div className="px-4 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-400">Open Market (Shopee/Lazada)</span>
                          <span className="text-[12px] font-bold text-slate-600">RM {marketCheck.market_baseline.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-400">Max Campus Price (10%)</span>
                          <span className={`text-[13px] font-semibold ${isBlocked ? 'text-red-500' : 'text-slate-900'}`}>
                            RM {marketCheck.max_campus_price.toFixed(2)}
                          </span>
                        </div>
                        {hasPriceInput ? (
                          <div className="flex items-center justify-between border-t border-slate-100/80 pt-2 mt-1">
                            <span className="text-[11px] font-medium text-slate-400">Your Price</span>
                            <span className={`text-[13px] font-semibold ${isBlocked ? 'text-red-500' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                              RM {numericPrice.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <div className="border-t border-slate-100/80 pt-2 mt-1">
                            <p className="text-[10px] font-medium text-slate-300 text-center">
                              Enter your price above to check compliance 
                            </p>
                          </div>
                        )}
                       </div>

                      {/* Blocked message */}
                      {isBlocked && (
                        <div className="px-4 pb-4">
                          <div className="p-3 bg-red-100/60 rounded-xl flex gap-2">
                            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-medium text-red-700 leading-relaxed">
                              We found this item on Shopee for RM {marketCheck.market_baseline.toFixed(2)}. Campus listings must be priced at most RM {marketCheck.max_campus_price.toFixed(2)} to guarantee a student discount.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Justification box for borderline cases */}
                      {!isBlocked && !isCompliant && !isNaN(numericPrice) && numericPrice > 0 && (
                        <div className="px-4 pb-4">
                          <textarea
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            placeholder="Optional: add a note explaining your pricing (e.g. bundle deal, accessories included)..."
                            className="w-full min-h-[56px] p-3 text-[11px] font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 placeholder:text-slate-300 transition-colors text-slate-700 resize-none"
                            rows={2}
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </section>

            {/*  SECTION: STOCK  */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Stock</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">How many do you have? Set to 0 to mark as sold out.</p>
              </div>
              <div className="flex items-center gap-0 h-12 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:border-slate-900 transition-colors">
                <span className="px-4 text-[13px] font-bold text-[#94a3b8] border-r border-slate-100">Qty</span>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="flex-1 h-full px-4 bg-transparent text-[14px] font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none"
                />
              </div>
              {stock !== '' && parseInt(stock, 10) === 0 && (
                <p className="text-[11px] font-bold text-red-400">This listing will be marked as Sold Out immediately.</p>
              )}
            </section>

            {/*  SECTION: DELIVERY PREFERENCE  */}
            {selectedCategory === 'SERVICES' ? (
              <section className="pt-2 border-t border-slate-100">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
                  <span className="text-[16px] shrink-0 mt-0.5"></span>
                  <p className="text-[12px] font-medium text-slate-500 leading-relaxed">
                    Services are fulfilled directly between you and the buyer  either online or via campus meetup. No runner needed.
                  </p>
                </div>
              </section>
            ) : (
              <section className="space-y-4 pt-2 border-t border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Delivery Method</h2>
                  <p className="text-[11px] font-medium text-[#94a3b8]">Can a campus runner deliver this, or do you prefer to meet the buyer yourself?</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => setFulfillmentMode('DELIVERY')}
                     className={`p-4 rounded-xl border text-left flex flex-col transition-all active:scale-95 ${fulfillmentMode === 'DELIVERY' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                   >
                      <span className="text-[13px] font-bold mb-1">Runner Delivery</span>
                      <span className={`text-[10px] font-medium leading-tight ${fulfillmentMode === 'DELIVERY' ? 'text-white/80' : 'text-slate-400'}`}>Pulse runners will handle delivery</span>
                   </button>
                   <button 
                     onClick={() => setFulfillmentMode('MEETUP_ONLY')}
                     className={`p-4 rounded-xl border text-left flex flex-col transition-all active:scale-95 ${fulfillmentMode === 'MEETUP_ONLY' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                   >
                      <span className="text-[13px] font-bold mb-1">Strictly Meetup</span>
                      <span className={`text-[10px] font-medium leading-tight ${fulfillmentMode === 'MEETUP_ONLY' ? 'text-white/80' : 'text-slate-400'}`}>You meet the buyer face-to-face</span>
                   </button>
                </div>
                
                <div className="pt-2">
                   <div className="space-y-1.5 mb-2">
                      <label className="text-[12px] font-bold text-slate-900">Handover Node</label>
                      <p className="text-[10px] font-medium text-slate-400 leading-tight">Where is this item located? Buyers will collect it here, or Runners will pick it up from here.</p>
                   </div>
                   <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 flex flex-col max-h-[180px] overflow-y-auto no-scrollbar">
                      {CAMPUS_NODES.map(node => (
                         <button
                            key={node.token}
                            onClick={() => setHandoverNode(node.token)}
                            className={`px-3 py-2.5 rounded-lg text-left flex items-center justify-between transition-all ${handoverNode === node.token ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-slate-100/50 border border-transparent'}`}
                         >
                            <div className="flex items-center gap-2">
                               <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${getLocationBadge(node.zone)}`}>{node.zone}</span>
                               <span className="text-[12px] font-bold text-slate-900">{node.label}</span>
                            </div>
                         </button>
                      ))}
                   </div>
                </div>
              </section>
            )}



            {/*  POST BUTTON  */}
            <div className="pt-4">
              <button
                disabled={!canPost || isUploading}
                onClick={handlePost}
                className={(isPosting || isUploading) 
                  ? "w-full bg-gray-900 text-white rounded-full py-3 text-sm font-medium border-2 border-gray-700 flex items-center justify-center gap-2 opacity-90 animate-pulse transition-all"
                  : `w-full h-12 rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 transition-all ${
                      (canPost && !isUploading)
                        ? 'bg-slate-900 text-white active:scale-95 shadow-sm'
                        : 'bg-slate-50 text-slate-200 border border-slate-100'
                    }`
                }
              >
                {(isPosting || isUploading) ? (
                  <>
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    {isUploading ? 'Uploading Photos...' : 'Checking market price...'}
                  </>
                ) : (
                  'Publish Listing'
                )}
              </button>

              {/*  PCS APPROVED BANNER  */}
              {pcsApprovedBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center"
                >
                  <p className="text-[12px] font-bold text-emerald-700"> Price approved  listing is live!</p>
                </motion.div>
              )}

              {/*  POST ERROR TOAST  */}
              {postError && (
                <p className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center mt-3">
                  {postError}
                </p>
              )}
            </div>

          </motion.div>
        )}
      </div>

      
    </main>
  );
}
