"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, Trash2, Loader2, ImagePlus,
  BookOpen, Home, Cpu, Shirt, Briefcase,
  ArrowUpRight, Zap, TrendingUp
} from 'lucide-react';

import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';
import SmartFormFields from '@/components/marketplace/SmartFormFields';

interface CreateListingProps {
  userId: string;
  role: string;
  onClose: () => void;
  existingItem?: any;
}

type PcsStatus = 'APPROVED' | 'FLAGGED' | 'BLOCKED_NO_REFERENCE' | 'FREE_MARKET' | 'COPYRIGHT_BLOCKED' | 'ERROR';

interface PcsNotice {
  marketBaselinePrice: number;
  maxAllowedStudentPrice: number;
  itemTitle: string;
  pcsStatus: PcsStatus;
  justification?: string;
}

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

const CUSTOM_CATEGORY_LABELS = {
  Handmade: 'Handmade',
  'Food and Beverages': 'Food and Beverages',
  'Art and Craft': 'Art and Craft',
  Services: 'Services',
  Other: 'Other',
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

export default function CreateListing({ userId, role, onClose, existingItem }: CreateListingProps) {
  const router = useRouter();
  const [listingType, setListingType] = useState(existingItem?.listing_type || (existingItem?.pcs_is_custom ? 'custom' : 'standard'));
  const [selectedCategory, setSelectedCategory] = useState<string>(existingItem?.category || '');
  const [subcategory, setSubcategory] = useState(existingItem?.subcategory || '');
  
  // State for images
  const [existingImages, setExistingImages] = useState<string[]>(existingItem?.imageUrls || existingItem?.images || []);
  const [newImageFiles, setNewImageFiles] = useState<{file: File, preview: string}[]>([]);
  
  const [title, setTitle] = useState(existingItem?.title || '');
  const [description, setDescription] = useState(existingItem?.description || '');
  const [price, setPrice] = useState(existingItem?.price?.toString() || '');
  const [metadata, setMetadata] = useState<Record<string, any>>(existingItem?.metadata || {});
  const [stock, setStock] = useState(existingItem?.stock_count?.toString() || '1');

  const [isPosting, setIsPosting] = useState(false);
  const [pcsError, setPcsError] = useState<PcsNotice | null>(null);
  const [justification, setJustification] = useState('');
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [appealSubmitted, setAppealSubmitted] = useState(false);

  // -- FORCE SYNC EXISTING ITEM DATA --
  useEffect(() => {
    if (existingItem) {
      setSelectedCategory(existingItem.category || '');
      setSubcategory(existingItem.subcategory || '');
      setExistingImages(existingItem.imageUrls || existingItem.images || []);
      setTitle(existingItem.title || '');
      setDescription(existingItem.description || '');
      setPrice(existingItem.price?.toString() || '');
      setMetadata(existingItem.metadata || {});
      setStock(existingItem.stock_count?.toString() || '0');
      setListingType(existingItem.listing_type || (existingItem.pcs_is_custom ? 'custom' : 'standard'));
    }
  }, [existingItem]);

  useEffect(() => {
    if (existingItem) return;
    setSelectedCategory('');
    setSubcategory('');
    setPcsError(null);
  }, [listingType, existingItem]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setNewImageFiles(prev => [...prev, ...newFiles].slice(0, 10 - existingImages.length));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handlePost = async () => {
    if (!selectedCategory) return;
    setIsPosting(true);
    setPcsError(null);
    try {
      const user = auth.currentUser;
      const sellerId = userId || user?.uid || 'ANON';

      let sellerName = user?.displayName || 'Pulse Vendor';
      if (user) {
        const { getDoc } = await import('firebase/firestore');
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        const userProfile = userSnap.data();
        if (userProfile) sellerName = userProfile.full_name || userProfile.fullName || sellerName;
      }

      const itemId = existingItem?.id || doc(collection(db, 'items')).id;

      // 1. Upload new images to Firebase Storage
      const uploadedUrls: string[] = [];
      for (const item of newImageFiles) {
        const storageRef = ref(storage, `items/${sellerId}/${Date.now()}_${item.file.name}`);
        const snapshot = await uploadBytes(storageRef, item.file);
        const url = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(url);
      }

      const finalImages = [...existingImages, ...uploadedUrls];

      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions(undefined, 'us-central1');
      const pcsValidate = httpsCallable(functions, 'pcsValidate');
      const pcsResult = await pcsValidate({
        itemTitle: title,
        itemPrice: parseFloat(price),
        category: selectedCategory,
        subcategory: listingType === 'custom' ? selectedCategory : subcategory,
        sellerId,
        itemId,
        isCustomItem: listingType === 'custom'
      });

      const pcsData = pcsResult.data as any;

      if (pcsData.pcsStatus === 'FREE_MARKET') {
        // FREE_MARKET approved - continue to save listing
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

      const stockCount = stock !== '' ? parseInt(stock, 10) : null;
      const itemStatus = stockCount === 0 ? 'SOLD_OUT' : 'ACTIVE';

      const data = {
        title,
        description,
        category: selectedCategory,
        subcategory: listingType === 'custom' ? selectedCategory : subcategory,
        listing_type: listingType,
        price: parseFloat(price),
        stock_count: stockCount,
        metadata,
        images: finalImages, // Keep images for compatibility
        imageUrls: finalImages,
        image_url: finalImages[0] || '',
        seller_id: sellerId,
        seller_name: sellerName,
        status: itemStatus,
        is_price_flagged: false,
        price_flag_count: 0,
        flag_source: null,
        price_appeal: '',
        is_official: role?.toUpperCase() === 'CLUB' || role?.toUpperCase() === 'MERCHANT',
        pcs_certified: pcsData.isApproved === true,
        pcs_status: pcsData.pcsStatus || 'FREE_MARKET',
        pcs_market_price: pcsData.marketBaselinePrice || 0,
        pcs_max_allowed: pcsData.maxAllowedStudentPrice || 0,
        pcs_reason: pcsData.justification || pcsData.pcsStatus || 'PCS validated',
        pcs_is_custom: pcsData.isCustomItem === true,
        updated_at: serverTimestamp(),
      };

      if (existingItem) {
        await updateDoc(doc(db, 'items', existingItem.id), data);
      } else {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'items', itemId), {
          ...data,
          created_at: serverTimestamp()
        });
      }
      onClose();
    } catch (e) {
      console.log('LISTING ERROR:', JSON.stringify(e, null, 2));
      console.error(e);
      alert('Failed to process listing.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleSubmitJustification = async () => {
    if (!justification.trim()) return;
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const { getDoc } = await import('firebase/firestore');
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const userProfile = userSnap.data();
      const sellerName = userProfile?.full_name || userProfile?.fullName || user.displayName || 'Pulse Vendor';

      const itemId = doc(collection(db, 'items')).id;
      const numPrice = parseFloat(price);
      const stockCount = stock !== '' ? parseInt(stock, 10) : null;

      const uploadedUrls: string[] = [];
      for (const item of newImageFiles) {
        const storageRef = ref(storage, `items/${user.uid}_${Date.now()}_${item.file.name}`);
        const snapshot = await uploadBytes(storageRef, item.file);
        const url = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(url);
      }
      const finalImages = [...existingImages, ...uploadedUrls];

      let appealImageUrl = '';
      if (receiptImage) {
        const receiptRef = ref(storage, `appeals/${user.uid}_${Date.now()}_receipt.${receiptImage.name.split('.').pop()}`);
        const snapshot = await uploadBytes(receiptRef, receiptImage);
        appealImageUrl = await getDownloadURL(snapshot.ref);
      }

      const { setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'items', itemId), {
        title,
        description,
        category: selectedCategory,
        subcategory: listingType === 'custom' ? selectedCategory : subcategory,
        listing_type: listingType,
        price: numPrice,
        stock_count: stockCount,
        metadata,
        images: finalImages,
        image_url: finalImages[0] || '',
        seller_id: user.uid,
        seller_name: sellerName,
        fulfillment_mode: 'DELIVERY',
        handover_node: '',
        pcs_market_price: pcsError?.marketBaselinePrice || 0,
        pcs_max_allowed: pcsError?.maxAllowedStudentPrice || 0,
        pcs_reason: pcsError?.justification || 'FLAGGED',
        appeal_reason: justification.trim(),
        appeal_image_url: appealImageUrl || null,
        pcs_certified: false,
        pcs_status: 'FLAGGED',
        is_price_flagged: true,
        price_flag_count: 1,
        flag_source: 'AI',
        status: 'PENDING_REVIEW',
        created_at: serverTimestamp(),
      });

      await addDoc(collection(db, 'appeals'), {
        itemId,
        itemTitle: title,
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

  const totalImageCount = existingImages.length + newImageFiles.length;
  const isCustomListing = listingType === 'custom';
  const customPriceOverLimit = isCustomListing && Number(price) > 500;
  const canPost = !!title && !!price && !!selectedCategory && (isCustomListing || !!subcategory) && totalImageCount > 0 && !isPosting && !customPriceOverLimit;
  const categoryLabels = isCustomListing ? CUSTOM_CATEGORY_LABELS : CATEGORY_LABELS;
  const subcategoryOptions = useMemo(() => {
    const source = selectedCategory === 'SERVICES'
      ? SERVICES_SUBCATEGORIES
      : MARKETPLACE_CATEGORIES[selectedCategory as CategoryID]?.subcategories ?? [];
    const labels = source.map((sub) => typeof sub === 'string' ? sub : sub.label);
    return labels.includes('Other') ? labels : [...labels, 'Other'];
  }, [selectedCategory]);

  // Derive the dynamic title hint from the selected subcategory config
  const selectedSubcategoryConfig = useMemo(() => {
    if (!selectedCategory || isCustomListing) return null;
    return MARKETPLACE_CATEGORIES[selectedCategory as CategoryID]?.subcategories
      .find((s) => s.label === subcategory) ?? null;
  }, [selectedCategory, subcategory, isCustomListing]);

  const titleHint = selectedSubcategoryConfig?.titleHint ?? 'e.g. Logitech MX Master 3, Thomas Calculus...';

  return (
    <div className="fixed inset-0 z-1000 flex flex-col bg-white overflow-hidden font-sans antialiased text-slate-900">
      
      {/*  HEADER (Mirroring student navigation)  */}
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

        {/*  Actionable Intelligence (Institutional Guidance) */}
        {existingItem && existingItem.stock_count <= 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-6 bg-slate-900 rounded-2xl text-white shadow-md shadow-slate-900/10"
          >
            <div className="flex items-center gap-2 mb-4 text-amber-400">
               <Zap size={16} />
               <p className="text-[10px] font-semibold">Opportunity Detected</p>
            </div>
            <h3 className="text-[16px] font-bold tracking-tight mb-2">Demand is peaking for this asset.</h3>
            <p className="text-[12px] text-white/60 font-medium leading-relaxed mb-6">
              Students have been viewing this listing even while it was out of stock. Restock now to capture the current campus demand velocity.
            </p>
            <div className="grid grid-cols-2 gap-3">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-semibold text-white/40  mb-1">Recommendation</p>
                  <p className="text-[12px] font-bold italic text-white/90">Restock +10 units</p>
               </div>
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-semibold text-white/40  mb-1">Pricing Health</p>
                  <p className="text-[12px] font-bold text-emerald-400">Competitive</p>
               </div>
            </div>
          </motion.div>
        )}

        <section className="space-y-3 mb-10">
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
        
        {/*  SECTION: CLASSIFICATION  */}
        <section className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">{existingItem ? 'Category' : 'What are you listing?'}</h2>
            <p className="text-[11px] font-medium text-[#94a3b8]">{existingItem ? 'Change the category if needed.' : 'Choose the category that fits your item.'}</p>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-6 px-6">
            {Object.keys(categoryLabels).map((id) => {
              const isActive = selectedCategory === id;
              const Icon = !isCustomListing ? CATEGORY_ICONS[id as CategoryID] : null;
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
                  {Icon && <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />}
                  <span className="text-[12px] font-bold tracking-[-0.2px]">{categoryLabels[id as keyof typeof categoryLabels]}</span>
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

            {/*  SUBCATEGORY  */}
            {!isCustomListing && <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Subcategory</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Pick the most specific match.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {subcategoryOptions.map((label) => {
                  const isActive = subcategory === label;
                  return (
                    <button
                      key={label}
                      onClick={() => { setSubcategory(label); }}
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
            </section>}

            {/*  SMART CATEGORY FIELDS  */}
            {!isCustomListing && subcategory && (
              <section className="pt-2 border-t border-slate-100">
                <SmartFormFields
                  categoryId={selectedCategory as CategoryID}
                  subcategory={subcategory}
                  onSubcategoryChange={setSubcategory}
                  metadata={metadata}
                  onMetadataChange={(k, v) => setMetadata(prev => ({ ...prev, [k]: v }))}
                />
              </section>
            )}

            

            {/*  IMAGES  */}
            <section className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center pt-6">
                <div className="space-y-0.5">
                  <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Photos</h2>
                  <p className="text-[11px] font-medium text-[#94a3b8]">Add up to 10 images.</p>
                </div>
                <span className="text-[11px] font-bold text-[#94a3b8]">{totalImageCount}/10</span>
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
                {totalImageCount < 10 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 w-24 h-24 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-100 transition-all"
                  >
                    <Plus size={18} className="text-[#94a3b8]" />
                    <span className="text-[9px] font-bold text-[#94a3b8] ">Add</span>
                  </button>
                )}
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                
                {/* Existing Images */}
                {existingImages.map((img, i) => (
                  <div key={`existing-${i}`} className="shrink-0 w-24 h-24 relative rounded-xl overflow-hidden border border-slate-100 group">
                    <img src={img} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeExistingImage(i)}
                      className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                {/* New Images */}
                {newImageFiles.map((item, i) => (
                  <div key={`new-${i}`} className="shrink-0 w-24 h-24 relative rounded-xl overflow-hidden border border-slate-100 group">
                    <img src={item.preview} className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-blue-500 text-white text-[8px] font-bold rounded-md shadow-sm">NEW</div>
                    <button
                      onClick={() => removeNewImage(i)}
                      className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/*  NAME  */}
            <section className="space-y-3 pt-6 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Item Name</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Keep it short and clear.</p>
              </div>
              <input
                ref={titleInputRef}
                placeholder="e.g. Calculus Textbook, Canon EOS..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors"
              />
            </section>

            {/*  DESCRIPTION (condition-aware)  */}
            <section className="space-y-3 pt-6 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Description</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Condition, reason for selling, any notes.</p>
              </div>
              <textarea
                placeholder={metadata.condition === 'For Parts Only' ? 'Describe what is broken or missing, and what parts are still functional...' : 'Describe the condition, what is included (original box, charger, accessories), and any scratches or wear...'}
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors resize-none leading-relaxed"
              />
            </section>

            

            {/*  PRICE  */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Price</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">{existingItem ? 'Change your asking price.' : 'Set your asking price in Ringgit.'}</p>
              </div>

              <div className="flex items-center gap-0 h-12 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:border-slate-900 transition-colors">
                <span className="px-4 text-[13px] font-bold text-[#94a3b8] border-r border-slate-100">RM</span>
                <input
                  type="number"
                  placeholder={isCustomListing ? 'Max RM 500 for custom items' : '0.00'}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 h-full px-4 bg-transparent text-[14px] font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none"
                />
              </div>
              {customPriceOverLimit && (
                <p className="text-[11px] font-bold text-red-500">Custom items cannot be listed above RM 500</p>
              )}

              {/*  PCS ERROR ALERT  */}
              <AnimatePresence>
                {pcsError && pcsError.pcsStatus !== 'FREE_MARKET' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
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
                         }`}>
                           <span className="text-sm"></span>
                         </div>
                         <div className="flex-1">
                            {pcsError.pcsStatus === 'ERROR' ? (
                                <>
                                  <p className="text-sm font-semibold text-red-900 mb-0.5">Validation Error</p>
                                  <p className="text-xs text-red-800 leading-relaxed">{pcsError.justification || "Oops! Our AI price checker hit a tiny snag while verifying your item. Give it another try!"}</p>
                                </>
                            ) : pcsError.pcsStatus === 'BLOCKED_NO_REFERENCE' ? (
                                <>
                                  <p className="text-sm font-semibold text-gray-900 mb-0.5">Almost there! Help us check your price</p>
                                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{pcsError.justification}</p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => { setPcsError(null); document.getElementById('price')?.focus() || window.scrollTo({top:0, behavior:'smooth'}); }}
                                      className="bg-gray-900 text-white text-xs font-medium rounded-xl px-4 py-2 hover:bg-gray-800 active:scale-95 transition-all"
                                    >
                                      Update Price
                                    </button>
                                    <button
                                      onClick={() => { setPcsError(null); titleInputRef.current?.focus(); }}
                                      className="bg-gray-200 text-gray-900 text-xs font-medium rounded-xl px-4 py-2 hover:bg-gray-300 active:scale-95 transition-all"
                                    >
                                      Update Item Name
                                    </button>
                                  </div>
                                </>
                            ) : pcsError.pcsStatus === 'COPYRIGHT_BLOCKED' ? (
                             <>
                               <p className="text-sm font-semibold text-gray-900 mb-0.5">This item cannot be listed</p>
                               <p className="text-xs text-gray-500 leading-relaxed">{pcsError.justification}</p>
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
                              <button
                                onClick={() => { setPrice(String(pcsError?.maxAllowedStudentPrice)); setPcsError(null); }}
                                className="bg-gray-900 text-white text-xs font-medium rounded-xl px-4 py-2 hover:bg-gray-800 active:scale-95 transition-all"
                              >
                                Update Price to RM {Number(pcsError?.maxAllowedStudentPrice).toFixed(2)}
                              </button>
                              
                              <div className="mt-3 border-t border-gray-100 pt-3">
                                <p className="text-xs text-gray-500 mb-2">Or keep your price & share why it's fair:</p>
                                <textarea
                                  value={justification}
                                  onChange={(e) => setJustification(e.target.value)}
                                  placeholder="e.g. Brand new sealed. Includes extra accessories."
                                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-gray-900 mb-2"
                                />

                                <div className="mb-3">
                                  {receiptPreview ? (
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 group">
                                      <img src={receiptPreview} className="w-full h-full object-cover" alt="Receipt preview" />
                                      <button 
                                        onClick={() => { setReceiptImage(null); setReceiptPreview(null); }}
                                        className="absolute inset-0 bg-slate-900/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2 w-fit">
                                      <ImagePlus size={14} />
                                      Attach Receipt / Proof
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            setReceiptImage(e.target.files[0]);
                                            setReceiptPreview(URL.createObjectURL(e.target.files[0]));
                                          }
                                        }} 
                                      />
                                    </label>
                                  )}
                                </div>

                                <button
                                  onClick={handleSubmitJustification}
                                  className="w-full border border-gray-200 text-gray-700 text-xs font-medium rounded-xl px-4 py-2 hover:bg-gray-50"
                                >
                                  Keep & Share Reason
                                </button>
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

            {/*  STOCK  */}
            <section className="space-y-3 pt-6 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">{existingItem ? 'Stock' : 'Stock'}</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">{existingItem ? 'Update how many you have left. Set to 0 if sold out.' : 'How many do you have? Set to 0 to mark as sold out.'}</p>
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
            </section>

            {/*  CONDITION-DEPENDENT FIELD: broken item details  */}
            {metadata.condition === 'For Parts Only' && (
              <section className="space-y-3 pt-6 border-t border-slate-100">
                <div className="space-y-0.5">
                  <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">What's broken?</h2>
                  <p className="text-[11px] font-medium text-[#94a3b8]">Describe the issue so buyers know exactly what to expect.</p>
                </div>
                <textarea
                  value={metadata.broken_details || ''}
                  onChange={(e) => setMetadata(prev => ({ ...prev, broken_details: e.target.value }))}
                  placeholder="e.g. Screen has a small crack but touch still works, missing charger..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors resize-none leading-relaxed"
                />
              </section>
            )}
          </motion.div>
        )}
      </div>

      {/*  STICKY FOOTER ACTION  */}
      <div className="fixed bottom-0 left-0 right-0 z-60 p-8 bg-white/90 backdrop-blur-2xl border-t border-slate-50 pb-safe">
        {isPosting ? (
          <button disabled className="w-full bg-gray-900 text-white rounded-2xl py-3.5 text-sm font-medium flex items-center justify-center gap-2.5 opacity-95 shadow-sm">
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>Sizing up the market...</span>
          </button>
        ) : (
          <button 
            disabled={!canPost}
            onClick={handlePost}
            className={`w-full h-12 rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 transition-all ${
                  canPost
                    ? 'bg-slate-900 text-white active:scale-95 shadow-sm'
                    : 'bg-slate-50 text-slate-200 border border-slate-100'
                }`}
          >
            <ArrowUpRight size={18} />
            {existingItem ? 'Update Listing' : 'Publish Listing'}
          </button>
        )}
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
/* CREATE LISTING COMPONENT (SHARED)
   What: Reusable listing form used across the app
   Key feature: Calls pcsValidate before saving - blocks if price too high
   PCS location: functions/src/index.ts -> pcsValidate
   Data writes: items collection
   Related: app/marketplace/create/page.tsx
*/
