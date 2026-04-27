"use client";

import { useState } from 'react';
import { createItemListing } from '@/lib/marketplace-utils';
import { X, Upload, MapPin, Zap, ChevronRight, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateListingProps {
  userId: string;
  role: string;
  onClose: () => void;
}

const MIIT_HOTSPOTS = [
  "Level 2 Lobby",
  "MIIT Library (Level 4)",
  "South Wing Lounge",
  "Level 3 Cafeteria",
  "South Wing Entrance"
];

export default function CreateListing({ userId, role, onClose }: CreateListingProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', price: '', stock: '1', meetup_location: MIIT_HOTSPOTS[0] });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Visual asset required.");
    if (!form.title || !form.price) return alert("Details missing.");

    setLoading(true);
    try {
      await createItemListing(userId, role, form, file);
      onClose(); 
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-navy/40 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative bg-white w-full rounded-t-[3.5rem] p-8 pb-12 shadow-[0_-20px_60px_rgba(0,0,0,0.1)] max-h-[95vh] overflow-y-auto no-scrollbar"
      >
        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
        
        <header className="mb-10 text-center">
            <p className="text-[11px] font-black text-slate-300 tracking-[0.3em] uppercase mb-2">New Listing</p>
            <h2 className="text-[28px] font-bold text-navy leading-tight">What are you passing on?</h2>
        </header>

        <div className="space-y-8 max-w-md mx-auto">
          {/* Visual Asset Dropzone */}
          <label 
            className={`relative flex flex-col items-center justify-center w-full h-56 rounded-[3rem] cursor-pointer transition-all duration-300 overflow-hidden border-2 border-dashed ${
                preview ? 'border-transparent' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
                <div className="flex flex-col items-center text-center px-10">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                        <Upload className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-[12px] font-bold text-slate-400">
                        Drop a product shot
                    </p>
                    <p className="text-[10px] text-slate-300 font-medium mt-1">
                        Ensure high contrast for the registry
                    </p>
                </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>

          <div className="space-y-5">
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Item Name</label>
                  <input 
                    placeholder="e.g. Mechanical Keyboard" 
                    className="w-full px-6 h-14 bg-slate-50/50 border border-slate-100 rounded-2xl text-[14px] font-bold text-navy focus:bg-white transition-all outline-none"
                    onChange={(e) => setForm({...form, title: e.target.value})}
                  />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Price (RM)</label>
                    <input 
                        type="number" 
                        placeholder="0" 
                        className="w-full px-6 h-14 bg-slate-50/50 border border-slate-100 rounded-2xl text-[14px] font-bold text-navy focus:bg-white transition-all outline-none"
                        onChange={(e) => setForm({...form, price: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Hotspot</label>
                    <div className="relative">
                      <select 
                          className="w-full px-6 h-14 bg-slate-50/50 border border-slate-100 rounded-2xl text-[12px] font-bold text-navy focus:bg-white transition-all outline-none appearance-none"
                          onChange={(e) => setForm({...form, meetup_location: e.target.value})}
                      >
                          {MIIT_HOTSPOTS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </select>
                      <MapPin size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                </div>
              </div>
          </div>

          <button 
            disabled={loading}
            onClick={handleUpload}
            className="w-full bg-navy text-white h-16 rounded-[2rem] font-bold text-[15px] shadow-xl hover:bg-navy/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
          >
            {loading ? 'Posting...' : 'Post to Gallery'}
            {!loading && <ChevronRight size={18} />}
          </button>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-6 text-[12px] font-bold text-slate-300 hover:text-navy transition-colors"
        >
          Cancel Listing
        </button>
      </motion.div>
    </div>
  );
}
