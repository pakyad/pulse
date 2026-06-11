'use client'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Loader2, Briefcase,
  BookOpen, Home, Cpu, Shirt,
  ShieldCheck, ShieldAlert, Globe, AlertCircle, X
} from 'lucide-react';
import BackButton from '@/components/shared/BackButton';
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, onSnapshot, getDocs, serverTimestamp, setDoc, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';
import SmartFormFields from '@/components/marketplace/SmartFormFields';
import { CAMPUS_NODES, getLocationBadge } from '@/lib/core/locations';

const CATEGORY_LABELS: Record<CategoryID, string> = {
  ACADEMIC: 'Academic',
  HOSTEL: 'Hostel',
  TECH: 'Tech',
  APPAREL: 'Apparel',
  SERVICES: 'Services',
};

const CATEGORY_ICONS: Record<CategoryID, React.ElementType> = {
  ACADEMIC: BookOpen,
  HOSTEL: Home,
  TECH: Cpu,
  APPAREL: Shirt,
  SERVICES: Briefcase,
};

const SERVICES_SUBCATEGORIES = [
  'Tutoring & Academic Help',
  'Coding & Debugging',
  'Design & Creative',
  'Resume & Career',
  'Photography & Video',
  'Translation & Writing',
  'Other Campus Services',
  'Other',
];

const CUSTOM_CATEGORY_LABELS = {
  Handmade: 'Handmade',
  'Food and Beverages': 'Food and Beverages',
  'Art and Craft': 'Art and Craft',
  Services: 'Services',
  Other: 'Other',
};

type PcsStatus = 'APPROVED' | 'FLAGGED' | 'BLOCKED_NO_REFERENCE' | 'FREE_MARKET' | 'COPYRIGHT_BLOCKED' | 'ERROR' | 'SOFT_WARNING';

interface PcsNotice {
  marketBaselinePrice: number;
  maxAllowedStudentPrice: number;
  itemTitle: string;
  pcsStatus: PcsStatus;
  justification?: string;
}

export default function CreateListingPage() {
  const router = useRouter();
  const [listingType, setListingType] = useState('standard');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [stock, setStock] = useState('');
  const [justification, setJustification] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [fulfillmentMode, setFulfillmentMode] = useState<'DELIVERY' | 'MEETUP_ONLY'>('DELIVERY');
  const [handoverNode, setHandoverNode] = useState(CAMPUS_NODES[0].token);

  const [isPosting, setIsPosting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [pcsError, setPcsError] = useState<PcsNotice | null>(null);
  const [appealSubmitted, setAppealSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPcsError(null);
  }, [selectedCategory, subcategory]);

  useEffect(() => {
    setSelectedCategory('');
    setSubcategory('');
    setPcsError(null);
  }, [listingType]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string].slice(0, 10));
      reader.readAsDataURL(file);
    });
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setReceiptImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePost = async (skipSoftWarning: boolean | React.MouseEvent = false) => {
    if (!selectedCategory) return;
    
    const numPrice = parseFloat(price);
    if (!title || title.trim().length < 3) { alert('Please enter a valid product name.'); return; }
    if (isNaN(numPrice) || numPrice <= 0) { alert('Please enter a valid price greater than 0.'); return; }
    if (!selectedCategory) { alert('Please select a category.'); return; }

    setIsPosting(true);
    setPostError(null);
    setPcsError(null);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const userProfile = userSnap.data();
      const sellerName = userProfile?.full_name || userProfile?.fullName || user.displayName || 'Pulse Student';

      const sellerId = user.uid;
      const itemId = doc(collection(db, 'items')).id;

      let finalPcsCertified = true;
      let finalPcsStatus = 'FREE_MARKET';
      let finalPcsMarketPrice = 0;
      let finalPcsMaxAllowed = 0;
      let finalPcsReason = 'PCS validated';
      let finalPcsIsCustom = listingType === 'custom';

      if (skipSoftWarning !== true) {
        const functions = getFunctions(undefined, 'us-central1');
        const pcsValidate = httpsCallable(functions, 'pcsValidate');
        const pcsResult = await pcsValidate({
          itemTitle: title,
          itemPrice: numPrice,
          category: selectedCategory,
          subcategory: listingType === 'custom' ? selectedCategory : subcategory,
          sellerId,
          itemId,
          isCustomItem: listingType === 'custom'
        });

        const pcsData = pcsResult.data as any;

        if (pcsData.pcsStatus === 'FREE_MARKET') {
          // Free market approved — continue to save
        }

        if (pcsData.isApproved === false) {
          setPcsError({
            marketBaselinePrice: pcsData.marketBaselinePrice,
            maxAllowedStudentPrice: pcsData.maxAllowedStudentPrice,
            itemTitle: title,
            pcsStatus: pcsData.pcsStatus || 'FLAGGED',
            justification: pcsData.justification
          });
          setIsPosting(false);
          return;
        }

        finalPcsCertified = pcsData.isApproved === true;
        finalPcsStatus = pcsData.pcsStatus || 'FREE_MARKET';
        finalPcsMarketPrice = pcsData.marketBaselinePrice || 0;
        finalPcsMaxAllowed = pcsData.maxAllowedStudentPrice || 0;
        finalPcsReason = pcsData.justification || pcsData.pcsStatus || 'PCS validated';
        finalPcsIsCustom = pcsData.isCustomItem === true;
      } else if (pcsError) {
        finalPcsCertified = false;
        finalPcsStatus = pcsError.pcsStatus || 'SOFT_WARNING';
        finalPcsMarketPrice = pcsError.marketBaselinePrice || 0;
        finalPcsMaxAllowed = pcsError.maxAllowedStudentPrice || 0;
        finalPcsReason = pcsError.justification || 'Soft warning acknowledged';
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

      const itemData = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        subcategory: listingType === 'custom' ? selectedCategory : subcategory,
        listing_type: listingType,
        price: numPrice,
        stock_count: stockCount,
        metadata,
        images: imageUrls,
        image_url: imageUrls[0] || null,
        seller_id: user.uid,
        seller_name: sellerName,
        fulfillment_mode: fulfillmentMode,
        handover_node: handoverNode,
        status: stockCount === 0 ? 'SOLD_OUT' : 'ACTIVE',
        is_price_flagged: false,
        price_flag_count: 0,
        report_count: 0,
        flag_source: null,
        price_justification: justification.trim() || '',
        pcs_certified: finalPcsCertified,
        pcs_status: finalPcsStatus,
        pcs_market_price: finalPcsMarketPrice,
        pcs_max_allowed: finalPcsMaxAllowed,
        pcs_reason: finalPcsReason,
        pcs_is_custom: finalPcsIsCustom,
        created_at: serverTimestamp(),
      };

      await setDoc(doc(db, 'items', itemId), itemData);
      router.push('/marketplace');
    } catch (e: any) {
      console.log('LISTING ERROR:', JSON.stringify(e, null, 2));
      console.error('[CreateListing]', e);
      setIsUploading(false);
      setIsPosting(false);
      setPostError('Failed to post listing. Please try again.');
    }
  };

  const handleSubmitJustification = async () => {
    if (!justification.trim()) return;
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const userProfile = userSnap.data();
      const sellerName = userProfile?.full_name || userProfile?.fullName || user.displayName || 'Pulse Student';

      const itemId = doc(collection(db, 'items')).id;
      const numPrice = parseFloat(price);
      const stockCount = stock !== '' ? parseInt(stock, 10) : null;

      const imageUrls: string[] = await Promise.all(
        images.map(async (base64, i) => {
          const storageRef = ref(storage, `listings/${user.uid}_${Date.now()}_${i}.jpg`);
          await uploadString(storageRef, base64, 'data_url');
          return getDownloadURL(storageRef);
        })
      );

      let appealImageUrl = '';
      if (receiptImage) {
        const receiptRef = ref(storage, `appeals/${user.uid}_${Date.now()}.jpg`);
        await uploadString(receiptRef, receiptImage, 'data_url');
        appealImageUrl = await getDownloadURL(receiptRef);
      }

      await setDoc(doc(db, 'items', itemId), {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        subcategory: listingType === 'custom' ? selectedCategory : subcategory,
        listing_type: listingType,
        price: numPrice,
        stock_count: stockCount,
        metadata,
        images: imageUrls,
        image_url: imageUrls[0] || null,
        appeal_image_url: appealImageUrl || null,
        seller_id: user.uid,
        seller_name: sellerName,
        fulfillment_mode: fulfillmentMode,
        handover_node: handoverNode,
        pcs_market_price: pcsError?.marketBaselinePrice || 0,
        pcs_max_allowed: pcsError?.maxAllowedStudentPrice || 0,
        pcs_reason: pcsError?.justification || 'FLAGGED',
        appeal_reason: justification.trim(),
        price_justification: justification.trim(),
        pcs_certified: false,
        pcs_status: 'FLAGGED',
        is_price_flagged: true,
        price_flag_count: 1,
        flag_source: 'AI',
        report_count: 0,
        status: 'PENDING_REVIEW',
        created_at: serverTimestamp(),
      });

      await addDoc(collection(db, 'appeals'), {
        itemId,
        itemTitle: title.trim(),
        price: numPrice,
        category: selectedCategory,
        sellerId: user.uid,
        sellerName,
        justification_text: justification.trim(),
        appeal_image_url: appealImageUrl || null,
        status: 'PENDING',
        created_at: serverTimestamp(),
      });

      setAppealSubmitted(true);
    } catch (e) {
      console.error('[Appeal]', e);
      alert('Failed to submit appeal. Please try again.');
    }
  };

  const isCustomListing = listingType === 'custom';
  const customPriceOverLimit = isCustomListing && Number(price) > 500;
  const canPost = !!title && !!price && !!selectedCategory && (isCustomListing || !!subcategory) && images.length > 0 && !isPosting && !customPriceOverLimit;
  const categoryLabels = isCustomListing ? CUSTOM_CATEGORY_LABELS : CATEGORY_LABELS;
  const subcategoryOptions = useMemo(() => {
    const source = selectedCategory === 'SERVICES'
      ? SERVICES_SUBCATEGORIES
      : MARKETPLACE_CATEGORIES[selectedCategory as CategoryID]?.subcategories ?? [];
    const labels = source.map((sub) => typeof sub === 'string' ? sub : sub.label);
    return labels.includes('Other') ? labels : [...labels, 'Other'];
  }, [selectedCategory]);

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">
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
        <section className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => setListingType('standard')}
              className={listingType === 'standard'
                ? 'bg-gray-900 text-white rounded-full px-6 py-2.5 text-sm font-medium'
                : 'border border-gray-200 text-gray-600 rounded-full px-6 py-2.5 text-sm font-medium'
              }
            >
              Standard Item
            </button>
            <button
              onClick={() => setListingType('custom')}
              className={listingType === 'custom'
                ? 'bg-gray-900 text-white rounded-full px-6 py-2.5 text-sm font-medium'
                : 'border border-gray-200 text-gray-600 rounded-full px-6 py-2.5 text-sm font-medium'
              }
            >
              Handmade / Custom
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">What are you listing?</h2>
            <p className="text-[11px] font-medium text-[#94a3b8]">Choose the category that fits your item.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-6 px-6">
            {Object.keys(categoryLabels).map((id) => {
              const isActive = selectedCategory === id;
              const Icon = !isCustomListing ? CATEGORY_ICONS[id as CategoryID] : null;
              return (
                <button
                  key={id}
                  onClick={() => { setSelectedCategory(id); setSubcategory(''); }}
                  className={`h-[32px] px-4 rounded-full flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap border-[0.5px] ${
                    isActive ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-slate-50/50 border-slate-900/10 text-slate-400'
                  }`}
                >
                  {Icon && <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />}
                  <span className="text-[12px] font-bold tracking-[-0.2px]">{categoryLabels[id as keyof typeof categoryLabels]}</span>
                </button>
              );
            })}
          </div>
        </section>

        {selectedCategory && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            {!isCustomListing && <section className="space-y-3 pt-2 border-t border-slate-100">
              <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Subcategory</h2>
              <div className="flex flex-wrap gap-2">
                {subcategoryOptions.map((label) => {
                  const isActive = subcategory === label;
                  return (
                    <button
                      key={label}
                      onClick={() => setSubcategory(label)}
                      className={`h-[32px] px-4 rounded-full flex items-center border-[0.5px] transition-all text-[12px] font-bold ${
                        isActive ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-slate-50/50 border-slate-900/10 text-slate-400'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>}

            <section className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Photos</h2>
                <span className="text-[11px] font-bold text-[#94a3b8]">{images.length}/10</span>
              </div>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1">
                <button onClick={() => fileInputRef.current?.click()} className="shrink-0 w-24 h-24 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-1.5">
                  <Plus size={18} className="text-[#94a3b8]" /><span className="text-[9px] font-bold text-[#94a3b8]">Add</span>
                </button>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                {images.map((img, i) => (
                  <div key={i} className="shrink-0 w-24 h-24 relative rounded-xl overflow-hidden border border-slate-100 group">
                    <img src={img} className="w-full h-full object-cover" />
                    <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3 pt-2 border-t border-slate-100">
              <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Item Name</h2>
              <input ref={titleInputRef} placeholder="Item name..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-900 focus:outline-none focus:border-slate-900" />
            </section>

            <section className="space-y-3 pt-2 border-t border-slate-100">
              <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Price</h2>
              <div className="flex items-center h-12 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:border-slate-900">
                <span className="px-4 text-[13px] font-bold text-[#94a3b8] border-r border-slate-100">RM</span>
                <input type="number" placeholder={isCustomListing ? 'Max RM 500 for custom items' : '0.00'} value={price} onChange={(e) => setPrice(e.target.value)} className="flex-1 h-full px-4 bg-transparent text-[14px] font-bold text-slate-900 focus:outline-none" />
              </div>
              {customPriceOverLimit && (
                <p className="text-[11px] font-bold text-red-500">Custom items cannot be listed above RM 500</p>
              )}
              <AnimatePresence>
                {pcsError && pcsError.pcsStatus !== 'FREE_MARKET' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <div className={`rounded-2xl p-4 mt-3 border ${
                       pcsError.pcsStatus === 'BLOCKED_NO_REFERENCE' || pcsError.pcsStatus === 'COPYRIGHT_BLOCKED' || pcsError.pcsStatus === 'ERROR'
                         ? 'bg-red-50 border-red-100'
                         : 'bg-amber-50 border-amber-100'
                     }`}>
                       <div className="flex items-start gap-3">
                         <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                           pcsError.pcsStatus === 'BLOCKED_NO_REFERENCE' || pcsError.pcsStatus === 'COPYRIGHT_BLOCKED' || pcsError.pcsStatus === 'ERROR'
                             ? 'bg-red-100'
                             : 'bg-amber-100'
                         }`}><span className="text-sm"></span></div>
                         <div className="flex-1">
                            {pcsError.pcsStatus === 'ERROR' ? (
                                <>
                                  <p className="text-sm font-semibold text-red-900 mb-0.5">Validation Error</p>
                                  <p className="text-xs text-red-800 leading-relaxed">{pcsError.justification || "Our price checking system encountered an error. Please try again."}</p>
                                </>
                            ) : pcsError.pcsStatus === 'BLOCKED_NO_REFERENCE' ? (
                                <>
                                  <p className="text-sm font-semibold text-gray-900 mb-0.5">Help us verify your price 🤔</p>
                                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{pcsError.justification}</p>
                                  <button onClick={() => { titleInputRef.current?.focus(); }} className="bg-gray-900 text-white text-xs font-medium rounded-xl px-4 py-2 hover:bg-gray-800">Update Item Name</button>
                                </>
                            ) : pcsError.pcsStatus === 'COPYRIGHT_BLOCKED' ? (
                             <>
                               <p className="text-sm font-semibold text-gray-900 mb-0.5">This item cannot be listed</p>
                               <p className="text-xs text-gray-500 leading-relaxed">{pcsError.justification}</p>
                             </>
                            ) : pcsError.pcsStatus === 'SOFT_WARNING' ? (
                              <>
                                <p className="text-sm font-semibold text-amber-900 mb-0.5">Market Advice</p>
                                <p className="text-xs text-amber-800 leading-relaxed mb-3">{pcsError.justification}</p>
                                <button onClick={() => { handlePost(true); setPcsError(null); }} className="bg-amber-900 text-white text-xs font-medium rounded-xl px-4 py-2 hover:bg-amber-800">Acknowledge & Post Anyway</button>
                              </>
                            ) : appealSubmitted ? (
                            <>
                              <p className="text-sm font-semibold text-emerald-900 mb-0.5">Appeal submitted</p>
                              <p className="text-xs text-emerald-700 leading-relaxed">Your appeal has been submitted. Admin will review within 24 hours.</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-gray-900 mb-0.5">Heads up on your price! 💸</p>
                              <p className="text-xs text-gray-500 leading-relaxed mb-3">{pcsError.justification}</p>
                              <button onClick={() => { setPrice(String(pcsError?.maxAllowedStudentPrice)); setPcsError(null); }} className="bg-gray-900 text-white text-xs font-medium rounded-xl px-4 py-2 hover:bg-gray-800">Update Price to RM {Number(pcsError?.maxAllowedStudentPrice).toFixed(2)}</button>
                              
                              <div className="mt-3 border-t border-gray-100 pt-3">
                                <p className="text-xs text-gray-500 mb-2">Or keep your price & share why it's fair:</p>
                                <textarea
                                  value={justification}
                                  onChange={(e) => setJustification(e.target.value)}
                                  placeholder="e.g. Brand new sealed. Includes extra accessories."
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-gray-900 mb-2"
                                />
                                
                                <input 
                                  type="file" 
                                  ref={receiptInputRef} 
                                  onChange={handleReceiptUpload} 
                                  accept="image/*" 
                                  className="hidden" 
                                />
                                {!receiptImage ? (
                                  <button 
                                    onClick={() => receiptInputRef.current?.click()} 
                                    className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 text-gray-500 text-xs font-medium rounded-xl px-4 py-3 hover:bg-gray-50 hover:text-gray-700 mb-3 transition-colors"
                                  >
                                    <Plus size={14} /> Attach Receipt / Proof (Optional)
                                  </button>
                                ) : (
                                  <div className="relative w-full h-24 mb-3 rounded-xl border border-gray-200 overflow-hidden group">
                                    <img src={receiptImage} alt="Receipt preview" className="w-full h-full object-cover" />
                                    <button 
                                      onClick={() => setReceiptImage(null)} 
                                      className="absolute top-2 right-2 w-6 h-6 bg-white/90 text-red-500 rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X size={12} strokeWidth={3} />
                                    </button>
                                  </div>
                                )}

                                <button onClick={handleSubmitJustification} className="w-full border border-gray-200 text-gray-700 text-xs font-medium rounded-xl px-4 py-2 hover:bg-gray-50">Keep & Share Reason</button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <div className="pt-4">
              {isPosting ? (
                <button disabled className="w-full bg-gray-900 text-white rounded-2xl py-3.5 text-sm font-medium flex items-center justify-center gap-2.5 opacity-95 shadow-sm">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Sizing up the market...</span>
                </button>
              ) : (
                <button disabled={!canPost || isUploading} onClick={handlePost} className={`w-full h-12 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all ${canPost && !isUploading ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-200 border border-slate-100'}`}>
                  {isUploading ? 'Uploading Photos...' : 'Publish Listing'}
                </button>
              )}
              {postError && <p className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-center mt-3">{postError}</p>}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
/* CREATE LISTING PAGE
   What: Student creates a new item listing
   Key feature: PCS price validation runs here before saving
   PCS: calls pcsValidate Cloud Function -> functions/src/index.ts
   Data writes: items collection
   Related: components/CreateListing.tsx, functions/src/index.ts
*/
