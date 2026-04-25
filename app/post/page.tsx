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

const CATEGORIES = ['Food & Drinks', 'Books', 'Tech', 'Apparel', 'Stationery', 'Services', 'Other'];

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
  const [category, setCategory] = useState('Food & Drinks');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) { router.push('/auth'); return; }
      onSnapshot(doc(db, 'users', u.uid), (s) => setProfile(s.data()));
    });
    return () => unsub();
  }, [router]);

  const handleDeploy = async () => {
    if (!auth.currentUser || !image) return;
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

  const canNext = step === 1 ? !!preview : step === 2 ? title.trim() && price && Number(price) > 0 : true;

  return (
    <main className="min-h-screen bg-[#FDFDFD] font-sans text-navy antialiased pb-32">
      
      {/* ── Compact 45% Container ── */}
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
                <h1 className="text-[32px] font-black tracking-tightest leading-none">Capture <br/>Asset</h1>
                <p className="text-[14px] text-slate-400 font-medium leading-relaxed">Optical clarity drives higher handshake frequency.</p>
              </div>

              <div className="relative aspect-square w-full bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner group">
                {preview ? (
                  <>
                    <img src={preview} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setPreview(null); setImage(null); }} className="absolute top-6 right-6 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-navy shadow-lg">
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-black/5 text-slate-200">
                      <ImageIcon size={32} />
                    </div>
                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Select Visual Asset</p>
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
                <h1 className="text-[32px] font-black tracking-tightest leading-none">Registry <br/>Data</h1>
                <p className="text-[14px] text-slate-400 font-medium leading-relaxed">Define the market value and domain.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Asset Identity</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Official Badminton Club Jersey" className="w-full h-16 bg-white border border-slate-100 rounded-2xl px-6 text-[18px] font-bold text-navy outline-none focus:border-navy shadow-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Yield (RM)</label>
                    <input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="45.00" className="w-full h-16 bg-white border border-slate-100 rounded-2xl px-6 text-[20px] font-black text-navy outline-none focus:border-navy shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Volume</label>
                    <input value={stock} onChange={e => setStock(e.target.value)} type="number" placeholder="20" className="w-full h-16 bg-white border border-slate-100 rounded-2xl px-6 text-[20px] font-black text-navy outline-none focus:border-navy shadow-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Domain</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} type="button" onClick={() => setCategory(c)} className={`px-4 py-2.5 rounded-xl text-[11px] font-bold border-2 transition-all ${category === c ? 'bg-navy text-white border-navy shadow-lg' : 'bg-white text-slate-400 border-slate-50'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Final Review */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-[32px] font-black tracking-tightest leading-none">Deploy <br/>Sequence</h1>
                <p className="text-[14px] text-slate-400 font-medium leading-relaxed">Final validation before global broadcast.</p>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 translate-y-3 translate-x-2 rounded-[3rem] bg-slate-100" />
                <div className="relative bg-white border border-slate-50 rounded-[3rem] overflow-hidden shadow-sm">
                  <div className="h-64 relative bg-slate-50 flex items-center justify-center">
                    {preview ? <img src={preview} className="w-full h-full object-cover" /> : <Package size={48} className="text-slate-200" />}
                  </div>
                  <div className="p-8">
                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 bg-navy/5 text-navy text-[9px] font-black uppercase tracking-widest rounded-md">{category}</span>
                    </div>
                    <h3 className="text-[24px] font-bold text-navy leading-tight">{title || 'Asset Unnamed'}</h3>
                    <p className="text-[28px] font-black text-navy mt-4">RM {Number(price||0).toFixed(0)}</p>
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
              className="w-full h-[72px] bg-navy text-white rounded-4xl font-bold text-[16px] flex items-center justify-center gap-3 disabled:opacity-30 shadow-2xl shadow-navy/20"
            >
              Next Phase <ChevronRight size={20} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98, y: 1 }}
              disabled={loading}
              onClick={handleDeploy}
              className="w-full h-[72px] bg-navy text-white rounded-4xl font-bold text-[16px] flex items-center justify-center gap-3 shadow-2xl shadow-navy/30"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Finalizing...</> : <><Rocket size={20} /> Finalize Launch</>}
            </motion.button>
          )}
        </div>

      </div>
    </main>
  );
}
