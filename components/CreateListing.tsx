"use client";

import { useState, useEffect } from 'react';
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
  const [step, setStep] = useState<'PHOTO' | 'INFO' | 'SUMMARY'>('PHOTO');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', price: '', stock: '1', meetup_location: MIIT_HOTSPOTS[0], category: 'General', condition: 'Used' });
  const [isPredicting, setIsPredicting] = useState(false);
  const [showDraftToast, setShowDraftToast] = useState(false);
  const [isHotspotDrawerOpen, setIsHotspotDrawerOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [shakeField, setShakeField] = useState<string | null>(null);

  // Logic Pillar C: Mature Animation Physics (Ease-Out Quintic)
  const EASE_OUT_QUINT = [0.22, 1, 0.36, 1];

  useEffect(() => {
    // Logic Pillar B: The "Quiet Draft" (Recovery Check)
    const savedDraft = localStorage.getItem('pulse_listing_draft');
    if (savedDraft) {
      setShowDraftToast(true);
    }

    // Logic Pillar A: Background Data Fetch (Wait-Free UX pre-fetch)
    console.log("[Pulse Registry] Pre-fetching campus intelligence...");
  }, []);

  const handleResumeDraft = () => {
    const savedDraft = localStorage.getItem('pulse_listing_draft');
    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      setForm(parsed.form);
      setPreview(parsed.preview);
      setStep('INFO');
      setShowDraftToast(false);
    }
  };

  const handleDiscard = () => {
    // Logic Pillar B: Resilience (Save to Quiet Draft before closing)
    if (form.title || preview) {
      localStorage.setItem('pulse_listing_draft', JSON.stringify({ form, preview, date: new Date().toISOString() }));
    }
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setStep('INFO');
    }
  };

  const handleTitleChange = (val: string) => {
    setForm({ ...form, title: val });
    if (val.length > 5 && !isPredicting) {
      setIsPredicting(true);
      // Simulate "Nonchalant" AI prediction
      setTimeout(() => {
        setForm(prev => ({ 
          ...prev, 
          category: val.toLowerCase().includes('lab') || val.toLowerCase().includes('guide') ? 'Academic' : 'Student Life',
          meetup_location: MIIT_HOTSPOTS[1] // Predictive hotspot logic
        }));
      }, 800);
    }
  };

  const handleUpload = async () => {
    if (!preview || !form.title || !form.price) {
      // Logic Pillar B: The "Nudge"
      if (!preview) setShakeField('media');
      else if (!form.title) setShakeField('title');
      else if (!form.price) setShakeField('price');
      
      setTimeout(() => setShakeField(null), 500);
      return;
    }

    setLoading(true);
    try {
      await createItemListing(userId, role, form, file);
      localStorage.removeItem('pulse_listing_draft');
      onClose(); 
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-end overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT_QUINT }}
        onClick={handleDiscard}
        className="absolute inset-0 bg-white" 
      />
      
      <motion.div 
        layoutId="create-listing-canvas"
        transition={{ duration: 0.6, ease: EASE_OUT_QUINT }}
        className="relative bg-white w-full h-full overflow-y-auto no-scrollbar"
      >
        {/* Top Header */}
        <div className="flex justify-between items-center px-8 pt-12 pb-8">
          <p className="text-[10px] font-black text-slate-300 tracking-[0.4em] uppercase">Pulse Registry</p>
          <button onClick={handleDiscard} className="p-2 text-slate-300 hover:text-navy transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="px-8 space-y-4 max-w-md mx-auto pb-32">
          
          {/* Module A: Media Square */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, ease: EASE_OUT_QUINT }}
            className={`w-full aspect-square rounded-2xl bg-[#F9F9F9] relative group overflow-hidden transition-all duration-300 ${shakeField === 'media' ? 'ring-1 ring-amber-200' : ''}`}
            style={{ x: shakeField === 'media' ? [0, -2, 2, -2, 2, 0] : 0 }}
          >
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" />
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-200 group-hover:text-navy transition-colors shadow-sm">
                  <Package size={24} strokeWidth={1} />
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            )}
          </motion.div>

          {/* Module B: Identity Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, ease: EASE_OUT_QUINT }}
            className={`rounded-2xl bg-[#F9F9F9] p-6 transition-all duration-300 ${shakeField === 'title' || shakeField === 'price' ? 'ring-1 ring-amber-200' : ''}`}
            style={{ x: shakeField === 'title' || shakeField === 'price' ? [0, -2, 2, -2, 2, 0] : 0 }}
          >
            <div className="space-y-4">
              <input 
                placeholder="Product Name"
                className="w-full bg-transparent text-[18px] font-bold text-navy placeholder:text-slate-300 focus:outline-none"
                onChange={(e) => handleTitleChange(e.target.value)}
              />
              <div className="h-[0.5px] w-full bg-[#EEEEEE]" />
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-slate-300">RM</span>
                <input 
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-transparent text-[18px] font-black text-navy placeholder:text-slate-300 focus:outline-none"
                  onChange={(e) => setForm({...form, price: e.target.value})}
                />
              </div>
            </div>
          </motion.div>

          {/* Module C: Condition Segment */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ease: EASE_OUT_QUINT }}
            className="rounded-2xl bg-[#F9F9F9] p-2 relative flex items-center"
          >
            {['New', 'Used', 'Rough'].map((c) => (
              <button 
                key={c}
                onClick={() => setForm({...form, condition: c})}
                className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest relative z-10 transition-colors ${form.condition === c ? 'text-navy' : 'text-slate-300'}`}
              >
                {c}
              </button>
            ))}
            <motion.div 
              className="absolute h-[calc(100%-16px)] w-[calc(33.33%-10.6px)] bg-white rounded-xl shadow-sm left-2"
              animate={{ x: form.condition === 'New' ? 0 : form.condition === 'Used' ? '100%' : '200%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            />
          </motion.div>

          {/* Module D: Meetup Anchor */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, ease: EASE_OUT_QUINT }}
            onClick={() => setIsHotspotDrawerOpen(true)}
            className="rounded-2xl bg-[#F9F9F9] p-6 flex items-center justify-between cursor-pointer group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <MapPin size={18} className="text-slate-300 group-hover:text-navy transition-colors" />
              <div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Meetup Anchor</p>
                <p className="text-[14px] font-bold text-navy">{form.meetup_location}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-200" />
          </motion.div>

          {/* Action Button: Soft Fail Strategy */}
          <button 
            onClick={handleUpload}
            className={`w-full h-16 rounded-2xl font-black text-[12px] uppercase tracking-widest transition-all duration-500 mt-8 ${
              !preview || !form.title || !form.price ? 'bg-[#F9F9F9] text-slate-200' : 'bg-navy text-white shadow-xl shadow-navy/10 active:scale-[0.98]'
            }`}
          >
            {loading ? 'Committing...' : 'Post to Campus'}
          </button>
        </div>

        {/* Hotspot Drawer */}
        <AnimatePresence>
          {isHotspotDrawerOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsHotspotDrawerOpen(false)}
                className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-[400]"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[500] p-10 max-h-[60vh] overflow-y-auto no-scrollbar"
              >
                <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-10" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6 text-center">Select Anchor Point</p>
                <div className="space-y-2">
                  {MIIT_HOTSPOTS.map((loc) => (
                    <button 
                      key={loc}
                      onClick={() => {
                        setForm({...form, meetup_location: loc});
                        setIsHotspotDrawerOpen(false);
                      }}
                      className="w-full py-6 text-left text-[16px] font-bold text-navy border-b border-slate-50 last:border-0 hover:bg-slate-50 px-4 rounded-xl transition-all"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Resume Draft Toast (Modular) */}
        <AnimatePresence>
          {showDraftToast && step === 'PHOTO' && !preview && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed bottom-10 left-8 right-8 z-[600]"
            >
              <button
                onClick={handleResumeDraft}
                className="w-full p-5 bg-white border border-[#EAEAEA] rounded-2xl flex items-center justify-between shadow-2xl shadow-navy/5 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  <Package size={20} className="text-slate-400" />
                  <div className="text-left">
                    <p className="text-[12px] font-bold text-navy">Resume unfinished listing?</p>
                    <p className="text-[10px] text-slate-300 font-medium">Continue where you left off</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
