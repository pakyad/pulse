'use client'
import { useState, useEffect } from 'react';
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Plus, Loader2, ArrowLeft, Zap, Package, XCircle, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostHustle() {
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
            // 🛰️ Role-Based Synchronization
            const userRef = doc(db, "users", user.uid);
            const unsubProfile = onSnapshot(userRef, (snap) => {
                if (snap.exists()) {
                    setUserRole(snap.data().role);
                }
                setAuthLoading(false);
            });
            return () => unsubProfile();
        } else {
            router.push('/auth');
        }
    });
    return unsubAuth;
  }, [router]);

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
      const fileName = `${Date.now()}_${image.name}`;
      const imageRef = ref(storage, `items/${auth.currentUser.uid}/${fileName}`);
      const uploadResult = await uploadBytes(imageRef, image);
      const url = await getDownloadURL(uploadResult.ref);

      const formData = new FormData(e.currentTarget);
      await addDoc(collection(db, "items"), {
        title: formData.get('title'),
        price: Number(formData.get('price')),
        stock_count: Number(formData.get('stock')),
        image_url: url,
        seller_id: auth.currentUser.uid,
        status: 'active',
        created_at: serverTimestamp(),
        is_official: true // CLUB deployments are official
      });

      router.push('/marketplace');
    } catch (err: any) {
      console.error(err);
      alert("Deployment Disrupted: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-pearl">
    <div className="w-12 h-12 bg-navy animate-pulse rounded-xl mb-4" />
    <p className="text-[10px] text-navy/20 font-black uppercase tracking-[0.5em] text-center italic">AUDITING IDENTITY...</p>
  </div>;

  // 🛡️ ROLE-BASED ACCESS CONTROL (RBAC) Fallback
  if (userRole !== 'CLUB') {
      return (
        <main className="min-h-screen bg-pearl flex items-center justify-center p-8">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="hologram-card p-12 max-w-md w-full bg-white text-center shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                    <ShieldAlert size={120} className="text-navy" />
                </div>
                
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-100">
                    <XCircle size={40} className="text-red-500" />
                </div>

                <h1 className="text-2xl font-black text-navy uppercase tracking-tighter mb-2 italic">Access Denied</h1>
                <p className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em] mb-6">Unauthorized Security Layer</p>
                
                <p className="text-xs text-navy/40 font-medium leading-relaxed mb-10">
                    Inventory Uplink is strictly reserved for authenticated **CLUB** stakeholders. Standard student status does not possess deployment clearance.
                </p>

                <button 
                  onClick={() => router.push('/marketplace')}
                  className="w-full bg-navy text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-orange transition-all active:scale-95"
                >
                  Return to Nexus
                </button>
            </motion.div>
        </main>
      );
  }

  return (
    <main className="min-h-screen bg-pearl p-6 pb-32">
      <header className="mb-12 pt-12 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-3 bg-white border border-navy/5 rounded-2xl hover:bg-navy hover:text-white transition-all shadow-sm">
                <ArrowLeft size={20} />
            </button>
            <div>
                <p className="text-orange text-[10px] font-black uppercase tracking-[0.4em] mb-1 leading-none italic">Institutional Portal</p>
                <h1 className="text-3xl font-black text-navy uppercase italic tracking-tighter leading-none">CLUB DEPLOYMENT</h1>
            </div>
        </div>
        <div className="w-12 h-12 bg-orange/5 border border-orange/10 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="text-orange w-6 h-6" />
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
              <p className="text-[10px] font-black text-navy/40 uppercase tracking-[0.3em]">Capture Club Asset</p>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange}
            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            required
          />
        </motion.div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em] ml-4">Official Item Name</label>
            <input 
                name="title" 
                placeholder="e.g. Club Membership Tee" 
                className="w-full bg-white p-6 rounded-[28px] font-black text-navy placeholder:text-navy/20 border border-navy/5 shadow-xl shadow-navy/5 outline-none focus:ring-1 ring-orange/30 transition-all italic text-lg tracking-tight" 
                required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em] ml-4">Pricing (RM)</label>
                <input 
                    name="price" 
                    type="number" 
                    step="0.01"
                    placeholder="25.00" 
                    className="bg-white p-6 rounded-[28px] font-black text-navy border border-navy/5 shadow-xl shadow-navy/5 outline-none focus:ring-1 ring-orange/30 transition-all italic tabular-nums" 
                    required 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-navy/30 uppercase tracking-[0.2em] ml-4">Available Units</label>
                <input 
                    name="stock" 
                    type="number" 
                    placeholder="50" 
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
                    <Zap size={20} className="group-hover:rotate-12 transition-transform text-orange" />
                  </div>
                  Execute Official Deployment
              </>
          )}
        </button>
      </form>
    </main>
  );
}
