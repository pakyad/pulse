"use client";
import { useState, useEffect } from 'react';
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Camera, ChevronLeft, X, CheckCircle2, Loader2, 
  Tag, AlignLeft, DollarSign, Package, ChevronRight,
  Zap, Rocket, Info, Image as ImageIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';

export default function DeployAsset() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<any>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('10');
  const [category, setCategory] = useState<CategoryID | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzingPrice, setAnalyzingPrice] = useState(false);
  const [priceIntelligence, setPriceIntelligence] = useState<any>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) { router.push('/auth'); return; }
      onSnapshot(doc(db, 'users', u.uid), (s) => setProfile(s.data()));
    });
    return () => unsub();
  }, [router]);

  // Debounced Price Intelligence
  useEffect(() => {
    if (step !== 2 || title.trim().length < 3 || !category || !subcategory) return;
    
    setAnalyzingPrice(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch('/api/price-intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, category, subcategory })
        });
        const data = await res.json();
        if (data.success) {
          setPriceIntelligence(data.data);
        }
      } catch (err) {
        console.error("Price intelligence failed", err);
      } finally {
        setAnalyzingPrice(false);
      }
    }, 800);
    
    return () => clearTimeout(timeoutId);
  }, [title, category, subcategory, step, price]);

  const handleDeploy = async () => {
    if (!auth.currentUser || !image || !category || !subcategory) return;
    setLoading(true);
    try {
      const imgRef = ref(storage, `items/${auth.currentUser.uid}/${Date.now()}_${image.name}`);
      const snap = await uploadBytes(imgRef, image);
      const url = await getDownloadURL(snap.ref);
      
      await addDoc(collection(db, 'items'), {
        title, 
        description, 
        price: Number(price),
        stock_count: Number(stock), 
        category,
        subcategory,
        image_url: url,
        seller_id: auth.currentUser.uid,
        seller_name: profile?.full_name || 'Verified Seller',
        status: 'active', 
        is_active: true,
        is_official: profile?.role === 'CLUB',
        created_at: serverTimestamp(),
      });
      router.push('/merchant');
    } catch (e: any) {
      alert(e.message || 'Deployment error.');
    } finally { setLoading(false); }
  };

  const isOverpriced = priceIntelligence && Number(price) > priceIntelligence.maxAllowed;
  const canNext = step === 1 ? !!preview : step === 2 ? title.trim() && price && Number(price) > 0 && !isOverpriced && category && subcategory : true;

  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans text-navy antialiased pb-40">
      
      {/*  Compact 45% Container  */}
      <div className="max-w-[480px] mx-auto px-6">
        
        {/* Nav */}
        <nav className="pt-10 mb-12 flex items-center justify-between">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => step > 1 ? setStep(s => s - 1) : router.back()} 
            className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center text-navy/30"
          >
            <ChevronLeft size={24} />
          </motion.button>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-navy' : 'w-2 bg-slate-100'}`} />
            ))}
          </div>
          <div className="w-11" />
        </nav>

        <AnimatePresence mode="wait">
          {/* Step 1: Visual Capture */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-[32px] font-semibold tracking-tightest leading-none">Capture <br/>Asset</h1>
                <p className="text-[14px] text-slate-400 font-medium leading-relaxed">Optical clarity drives higher handshake frequency.</p>
              </div>

              <div className="relative aspect-square w-full bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner group">
                {preview ? (
                  <>
                    <img src={preview} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setPreview(null); setImage(null); }} className="absolute top-6 right-6 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-navy shadow-md">
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center shadow-md shadow-slate-900/10 text-slate-200">
                      <ImageIcon size={32} />
                    </div>
                    <p className="text-[11px] font-semibold text-slate-300 ">Select Visual Asset</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setImage(f); setPreview(URL.createObjectURL(f)); } }} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </motion.div>
          )}

          {/* Step 2: Core Data */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-[32px] font-semibold tracking-tightest leading-none">Registry <br/>Data</h1>
                <p className="text-[14px] text-slate-400 font-medium leading-relaxed">Define the market value and category.</p>
              </div>

              <div className="space-y-6">
                
                {/* 1. Category & Subcategory Funnel */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-slate-300  ml-1">Domain</label>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(MARKETPLACE_CATEGORIES) as CategoryID[]).map(catId => (
                        <button 
                          key={catId} 
                          type="button" 
                          onClick={() => { setCategory(catId); setSubcategory(null); }} 
                          className={`px-4 py-2.5 rounded-xl text-[11px] font-bold border transition-all ${category === catId ? 'bg-navy text-white border-navy shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                        >
                          {MARKETPLACE_CATEGORIES[catId].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {category && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 overflow-hidden pt-2">
                        <label className="text-[10px] font-semibold text-slate-300  ml-1">Type</label>
                        <div className="flex flex-wrap gap-2">
                          {MARKETPLACE_CATEGORIES[category].subcategories.map(sub => (
                            <button 
                              key={sub.label} 
                              type="button" 
                              onClick={() => setSubcategory(sub.label)} 
                              className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-all ${subcategory === sub.label ? 'bg-cyan-100 text-cyan-800 border-cyan-200 shadow-sm' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {subcategory && category && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-4 border-t border-slate-100">
                      <div className="space-y-2">
                        <label className="text-[10px] font-semibold text-slate-300  ml-1">
                          {MARKETPLACE_CATEGORIES[category].subcategories.find(s => s.label === subcategory)?.titleHint.includes('Brand') ? 'Brand & Model' : 'Asset Identity'}
                        </label>
                        <input 
                          value={title} 
                          onChange={e => setTitle(e.target.value)} 
                          placeholder={MARKETPLACE_CATEGORIES[category].subcategories.find(s => s.label === subcategory)?.titleHint || "e.g. Official Item"} 
                          className="w-full h-16 bg-white border border-slate-100 rounded-2xl px-6 text-[18px] font-bold text-navy outline-none focus:border-navy shadow-sm" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-semibold text-slate-300 ">Price (RM)</label>
                            {priceIntelligence && !analyzingPrice && (
                              <span className="text-[10px] font-medium text-slate-400">
                                Limit: RM {priceIntelligence.maxAllowed.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <input 
                              value={price} 
                              onChange={e => setPrice(e.target.value)} 
                              type="number" 
                              placeholder="45.00" 
                              className={`w-full h-16 bg-white border ${isOverpriced ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-navy'} rounded-2xl px-6 text-[20px] font-semibold text-navy outline-none shadow-sm transition-colors`} 
                            />
                            {analyzingPrice && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-slate-300">
                                <Loader2 size={16} className="animate-spin" />
                              </div>
                            )}
                          </div>
                          
                          <AnimatePresence>
                            {priceIntelligence && !analyzingPrice && isOverpriced && (
                              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3 shadow-sm mt-1">
                                  <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
                                    Your price is above the campus limit. We cap essential items at <strong className="text-slate-900">RM {priceIntelligence.maxAllowed.toFixed(2)}</strong> to ensure all students can afford them. Please lower your price to publish.
                                  </p>
                                  <button 
                                    type="button"
                                    onClick={() => setPrice(priceIntelligence.maxAllowed.toString())}
                                    className="w-full h-10 bg-slate-900 text-white rounded-xl text-[12px] font-bold active:scale-95 transition-all flex items-center justify-center shadow-md"
                                  >
                                    Auto-Adjust to RM {priceIntelligence.maxAllowed.toFixed(2)}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-slate-300  ml-1">Quantity</label>
                          <input value={stock} onChange={e => setStock(e.target.value)} type="number" placeholder="20" className="w-full h-16 bg-white border border-slate-100 rounded-2xl px-6 text-[20px] font-semibold text-navy outline-none focus:border-navy shadow-sm" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Step 3: Final Review */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-[32px] font-semibold tracking-tightest leading-none">Review</h1>
                <p className="text-[14px] text-slate-400 font-medium leading-relaxed">Check everything before posting.</p>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 translate-y-3 translate-x-2 rounded-[3rem] bg-slate-100" />
                <div className="relative bg-white border border-slate-50 rounded-[3rem] overflow-hidden shadow-sm">
                  <div className="h-64 relative bg-slate-50 flex items-center justify-center">
                    {preview ? <img src={preview} className="w-full h-full object-cover" /> : <Package size={48} className="text-slate-200" />}
                  </div>
                  <div className="p-8">
                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 bg-navy/5 text-navy text-[9px] font-semibold rounded-md">{subcategory}</span>
                    </div>
                    <h3 className="text-[24px] font-bold text-navy leading-tight">{title || 'Item Unnamed'}</h3>
                    <p className="text-[28px] font-semibold text-navy mt-4">RM {Number(price||0).toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tactical Footer */}
        <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto px-6 py-10 bg-[#FDFDFD]/90 backdrop-blur-xl">
          {step < 3 ? (
            <motion.button
              whileTap={{ scale: 0.98, y: 1 }}
              disabled={!canNext}
              onClick={() => setStep(s => s + 1)}
              className="w-full h-[72px] bg-navy text-white rounded-4xl font-bold text-[16px] flex items-center justify-center gap-3 disabled:opacity-30 shadow-md shadow-navy/20"
            >
              Continue <ChevronRight size={20} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98, y: 1 }}
              disabled={loading}
              onClick={handleDeploy}
              className="w-full h-[72px] bg-navy text-white rounded-4xl font-bold text-[16px] flex items-center justify-center gap-3 shadow-md shadow-navy/30"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Posting...</> : <>Post Item <ChevronRight size={20} /></>}
            </motion.button>
          )}
        </div>

      </div>
    </main>
  );
}
