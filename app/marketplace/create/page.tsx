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
];

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPcsError(null);
  }, [selectedCategory, subcategory]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string].slice(0, 10));
      reader.readAsDataURL(file);
    });
  };

  const handlePost = async () => {
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

      const pcsData = pcsResult.data as any;

      if (pcsData.isApproved === false) {
        setPcsError({
          marketBaselinePrice: pcsData.marketBaselinePrice,
          maxAllowedStudentPrice: pcsData.maxAllowedStudentPrice,
          itemTitle: title
        });
        setIsPosting(false);
        return;
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
        is_price_flagged: false,
        price_flag_count: 0,
        report_count: 0,
        flag_source: null,
        price_justification: justification.trim() || '',
        pcs_certified: true,
        created_at: serverTimestamp(),
      };

      await setDoc(doc(db, 'items', itemId), itemData);
      router.push('/marketplace');
    } catch (e: any) {
      console.error('[CreateListing]', e);
      setIsUploading(false);
      setIsPosting(false);
      setPostError('Failed to post listing. Please try again.');
    }
  };

  const canPost = !!title && !!price && !!subcategory && images.length > 0 && !isPosting;

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
                    isActive ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-slate-50/50 border-slate-900/10 text-slate-400'
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
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Subcategory</h2>
              <div className="flex flex-wrap gap-2">
                {(selectedCategory === 'SERVICES' ? SERVICES_SUBCATEGORIES : MARKETPLACE_CATEGORIES[selectedCategory as CategoryID]?.subcategories ?? []).map((sub) => {
                  const label = typeof sub === 'string' ? sub : sub.label;
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
            </section>

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
              <input placeholder="Item name..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-900 focus:outline-none focus:border-slate-900" />
            </section>

            <section className="space-y-3 pt-2 border-t border-slate-100">
              <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Price</h2>
              <div className="flex items-center h-12 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:border-slate-900">
                <span className="px-4 text-[13px] font-bold text-[#94a3b8] border-r border-slate-100">RM</span>
                <input type="number" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} className="flex-1 h-full px-4 bg-transparent text-[14px] font-bold text-slate-900 focus:outline-none" />
              </div>
              <AnimatePresence>
                {pcsError && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <div className="rounded-2xl p-4 mt-3 bg-amber-50 border border-amber-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-sm">📊</span></div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 mb-0.5">Whoa, that is a bit steep</p>
                          <p className="text-xs text-gray-500 leading-relaxed mb-3">We found <strong className="text-gray-700">{pcsError?.itemTitle}</strong> going for around <strong className="text-gray-700">RM{pcsError?.marketBaselinePrice}</strong> out there. Campus listings get a 10% friendlier cap so the max here is <strong className="text-gray-700">RM{pcsError?.maxAllowedStudentPrice}</strong>.</p>
                          <button onClick={() => { setPrice(String(pcsError?.maxAllowedStudentPrice)); setPcsError(null); }} className="bg-gray-900 text-white text-xs font-medium rounded-xl px-4 py-2">Set to RM{pcsError?.maxAllowedStudentPrice} and keep going</button>
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
