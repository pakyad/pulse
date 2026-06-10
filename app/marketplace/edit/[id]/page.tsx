'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ChevronLeft, Camera, X, Check, Loader2, AlertCircle, 
  Tag, Package, FileText, LayoutGrid, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EditListingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<any>(null);
  const [priceError, setPriceError] = useState('');
  
  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isPcsItem, setIsPcsItem] = useState(false);
  const [originalPrice, setOriginalPrice] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      const snap = await getDoc(doc(db, "items", id as string));
      if (snap.exists()) {
        const data = snap.data();
        if (data.seller_id !== auth.currentUser?.uid) {
           router.push('/marketplace');
           return;
        }
        setItem(data);
        setTitle(data.title);
        setPrice(data.price.toString());
        setOriginalPrice(data.price);
        setStock((data.stock_count || 1).toString());
        setDescription(data.description || '');
        setImages(data.images || (data.image_url ? [data.image_url] : []));
        const pcsApproved = data.pcs_certified === true || data.pcs_status === 'APPROVED';
        setIsPcsItem(pcsApproved);
      }
      setLoading(false);
    };
    fetchItem();
  }, [id]);

  const handleSave = async () => {
    if (!id || saving) return;
    const newPrice = parseFloat(price);
    if (isPcsItem && newPrice !== originalPrice) {
      setPriceError('Price is verified by Price Control System. Edit disabled.');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "items", id as string), {
        title,
        price: newPrice,
        stock_count: parseInt(stock),
        description,
        images,
        updated_at: serverTimestamp()
      });
      router.push(`/marketplace/${id}`);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-900" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-slate-900 pb-32">
      {/* Header */}
      <nav className="sticky top-0 z-50 px-6 py-5 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-[14px] font-bold tracking-tight">Edit Listing</h1>
        <div className="w-10" />
      </nav>

      <div className="p-6 space-y-10">
        
        {/* Image Management */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider">Gallery</h2>
            <span className="text-[11px] font-medium text-slate-400">{images.length}/5 Photos</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden group">
                <img src={img} className="w-full h-full object-cover" />
                <button 
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button className="aspect-square rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-2 text-slate-300 hover:bg-slate-50 transition-colors">
                <Camera size={20} />
                <span className="text-[9px] font-bold uppercase">Add</span>
              </button>
            )}
          </div>
        </section>

        {/* Basic Info */}
        <section className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-400">
              <Tag size={16} />
              <label className="text-[11px] font-bold uppercase tracking-widest">Pricing & Stock</label>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <p className="text-[10px] font-bold text-slate-400 px-1">PRICE (RM)</p>
                     {isPcsItem && <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">PCS Verified</span>}
                   </div>
                   <input 
                     type="number"
                     value={price}
                     onChange={(e) => setPrice(e.target.value)}
                     disabled={isPcsItem}
                     className={`w-full h-14 bg-slate-50 border border-slate-100 rounded-[20px] px-6 text-[15px] font-bold outline-none transition-all ${
                       isPcsItem ? 'opacity-50 cursor-not-allowed' : 'focus:border-slate-900'
                     }`}
                   />
                   {isPcsItem && (
                     <p className="text-[11px] text-slate-400 px-1 flex items-center gap-1">
                       <ShieldCheck size={12} className="text-emerald-500" />
                       Price locked — PCS-verified at RM{originalPrice.toFixed(2)}. Edit stock, title, or photos instead.
                     </p>
                   )}
                   {priceError && (
                     <p className="text-[11px] text-red-500 px-1">{priceError}</p>
                   )}
                </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 px-1">STOCK QTY</p>
                  <input 
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[20px] px-6 text-[15px] font-bold outline-none focus:border-slate-900 transition-all"
                  />
               </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-50">
            <div className="flex items-center gap-3 text-slate-400">
              <FileText size={16} />
              <label className="text-[11px] font-bold uppercase tracking-widest">Details</label>
            </div>
            <div className="space-y-4">
               <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 px-1">LISTING TITLE</p>
                  <input 
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-[20px] px-6 text-[14px] font-bold outline-none focus:border-slate-900 transition-all"
                  />
               </div>
               <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 px-1">DESCRIPTION</p>
                  <textarea 
                    value={description}
                    rows={4}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-6 text-[14px] font-medium leading-relaxed outline-none focus:border-slate-900 transition-all resize-none"
                    placeholder="Describe your item's condition..."
                  />
               </div>
            </div>
          </div>
        </section>

      </div>

      {/*  STICKY FOOTER  */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-100">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full h-14 bg-slate-900 text-white font-bold text-[13px] rounded-full flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-md disabled:opacity-20"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
        </button>
      </footer>
    </main>
  );
}
