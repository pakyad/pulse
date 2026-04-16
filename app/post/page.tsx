'use client'
import { useState } from 'react';
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Plus, Loader2, ArrowLeft, Zap, Package, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostHustle() {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<any>) => {
    e.preventDefault();
    if (!auth.currentUser || !image) return alert("Strategic Error: Optical asset required.");
    setLoading(true);

    try {
      // 1. Tactical Asset Uplink (Firebase Storage)
      const fileName = `${Date.now()}_${image.name}`;
      const imageRef = ref(storage, `items/${auth.currentUser.uid}/${fileName}`);
      const uploadResult = await uploadBytes(imageRef, image);
      const url = await getDownloadURL(uploadResult.ref);

      // 2. Central Registry Deployment (Firestore)
      const formData = new FormData(e.currentTarget);
      await addDoc(collection(db, "items"), {
        title: formData.get('title'),
        price: Number(formData.get('price')),
        stock_count: Number(formData.get('stock')), // Aligned with the Pulse logic
        image_url: url,
        seller_id: auth.currentUser.uid,
        status: 'active',
        created_at: serverTimestamp(),
        is_official: false // Standard Student Deployment
      });

      router.push('/marketplace');
    } catch (err: any) {
      console.error(err);
      alert("Deployment Disrupted: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-pearl p-6 pb-32">
      <header className="mb-12 pt-12 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-3 bg-white border border-navy/5 rounded-2xl hover:bg-navy hover:text-white transition-all shadow-sm">
                <ArrowLeft size={20} />
            </button>
            <div>
                <p className="text-orange text-[10px] font-black uppercase tracking-[0.4em] mb-1 leading-none">Inventory Uplink</p>
                <h1 className="text-3xl font-black text-navy uppercase italic tracking-tighter leading-none">Post a Hustle</h1>
            </div>
        </div>
        <div className="w-12 h-12 bg-navy/5 rounded-2xl flex items-center justify-center border border-navy/5">
            <Zap className="text-orange w-6 h-6 animate-pulse" />
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
        {/* Tactical Image Picker */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative h-72 w-full bg-white rounded-[40px] border-2 border-dashed border-navy/10 flex flex-col items-center justify-center overflow-hidden shadow-inner group"
        >
          {preview ? (
            <img src={preview} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mb-4">
                <Camera size={32} className="text-navy/20" />
              </div>
              <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.3em]">Capture Handshake Visual</p>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            required
          />
          {preview && (
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-navy/60 to-transparent pointer-events-none">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Visual Asset Locked</p>
              </div>
          )}
        </motion.div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em] ml-4">Deployment Label</label>
            <input 
                name="title" 
                placeholder="e.g. Vintage UTM Hoodie" 
                className="w-full bg-white p-6 rounded-[28px] font-black text-navy placeholder:text-navy/20 border border-navy/5 shadow-xl shadow-navy/5 outline-none focus:ring-1 ring-orange/30 transition-all italic text-lg tracking-tight" 
                required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em] ml-4">Valuation (RM)</label>
                <input 
                    name="price" 
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    className="bg-white p-6 rounded-[28px] font-black text-navy border border-navy/5 shadow-xl shadow-navy/5 outline-none focus:ring-1 ring-orange/30 transition-all italic tabular-nums" 
                    required 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em] ml-4">Units</label>
                <input 
                    name="stock" 
                    type="number" 
                    placeholder="1" 
                    className="bg-white p-6 rounded-[28px] font-black text-navy border border-navy/5 shadow-xl shadow-navy/5 outline-none focus:ring-1 ring-orange/30 transition-all italic tabular-nums" 
                    required 
                />
            </div>
          </div>
        </div>

        <button 
          disabled={loading}
          className="w-full bg-navy text-white p-7 rounded-[32px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-orange hover:shadow-[0_20px_40px_rgba(255,133,27,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 mt-8 relative overflow-hidden group"
        >
          {loading ? (
              <>
                  <Loader2 className="animate-spin" size={20} />
                  Synchronizing Pulse...
              </>
          ) : (
              <>
                  <div className="relative">
                    <Package size={20} className="group-hover:rotate-12 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange rounded-full animate-ping" />
                  </div>
                  Execute Deployment
              </>
          )}
        </button>
      </form>
    </main>
  );
}
