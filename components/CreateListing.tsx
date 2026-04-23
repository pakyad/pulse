"use client";

import { useState } from 'react';
import { createItemListing } from '@/lib/marketplace-utils';
import { X, Upload, Package, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateListingProps {
  userId: string;
  role: string;
  onClose: () => void;
}

export default function CreateListing({ userId, role, onClose }: CreateListingProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', price: '', stock: '1' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return alert("Hustle failed: Visual asset required.");
    if (!form.title || !form.price) return alert("Fill all mission parameters.");

    setLoading(true);
    try {
      await createItemListing(userId, role, form, file);
      onClose(); // Mission accomplished
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-navy/60 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="hologram-card w-full max-w-lg p-10 bg-pearl shadow-[0_40px_80px_rgba(0,0,0,0.3)] relative overflow-hidden"
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 text-navy/20 hover:text-navy transition-colors hover:bg-navy/5 rounded-full"
        >
          <X size={24} />
        </button>

        <header className="mb-8">
            <p className="text-[10px] text-orange font-black  tracking-[0.3em] mb-1">New Deployment</p>
            <h2 className="text-3xl font-black text-navy   leading-none">Activate Listing</h2>
        </header>

        <div className="space-y-6">
          {/* Visual Asset Dropzone */}
          <label 
            className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-[32px] cursor-pointer transition-all duration-300 overflow-hidden ${
                preview ? 'border-orange/30' : 'border-navy/10 hover:border-orange/20 hover:bg-navy/5 shadow-inner'
            }`}
          >
            {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="w-12 h-12 bg-navy/5 rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-6 h-6 text-navy/40" />
                    </div>
                    <p className="text-[10px] font-black text-navy/40  tracking-widest">
                        Handshake visual asset
                    </p>
                    <p className="text-[8px] text-navy/20  font-black  mt-1">
                        PNG / JPG (MAX 5MB)
                    </p>
                </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>

          <div className="space-y-4">
              <div className="space-y-1">
                  <label className="text-[9px] font-black  tracking-widest text-navy/40 ml-4">Deployment Label</label>
                  <input 
                    placeholder="e.g. Vintage UTM Varsity Pack" 
                    className="soft-lens w-full px-6 py-4 rounded-2xl text-sm font-bold text-navy focus:ring-1 ring-orange/30 transition-all border-none outline-none placeholder:text-navy/20"
                    onChange={(e) => setForm({...form, title: e.target.value})}
                  />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-black  tracking-widest text-navy/40 ml-4">Valuation (MYR)</label>
                    <input 
                        type="number" 
                        placeholder="0.00" 
                        className="soft-lens w-full px-6 py-4 rounded-2xl text-sm font-bold text-navy focus:ring-1 ring-orange/30 outline-none border-none"
                        onChange={(e) => setForm({...form, price: e.target.value})}
                    />
                </div>
                <div className="w-32 space-y-1">
                    <label className="text-[9px] font-black  tracking-widest text-navy/40 ml-4">Units</label>
                    <input 
                        type="number" 
                        placeholder="1" 
                        className="soft-lens w-full px-6 py-4 rounded-2xl text-sm font-bold text-navy focus:ring-1 ring-orange/30 outline-none border-none"
                        onChange={(e) => setForm({...form, stock: e.target.value})}
                    />
                </div>
              </div>
          </div>

          <button 
            disabled={loading}
            onClick={handleUpload}
            className="w-full bg-navy text-white py-5 rounded-[24px] font-black  tracking-[0.3em] text-[11px] shadow-2xl hover:bg-orange transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
          >
            {loading ? 'Synchronizing Pipeline...' : 'Activate Marketplace Pulse'}
            {loading ? <Zap size={16} className="animate-spin" /> : <Zap size={16} />}
          </button>
        </div>

        {/* Tactical Footer Overlay */}
        <div className="mt-8 pt-6 border-t border-navy/5 flex justify-between items-center opacity-40">
            <div className="flex items-center gap-2">
                <Package size={14} className="text-navy" />
                <span className="text-[8px] font-black  tracking-widest leading-none">Student Capacity: 5 Slots</span>
            </div>
            <ChevronRight size={14} />
        </div>
      </motion.div>
    </div>
  );
}
