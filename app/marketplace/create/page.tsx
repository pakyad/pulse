'use client'
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Plus, Trash2, Loader2,
  UtensilsCrossed, BookOpen, Wrench, Home, Cpu,
  ShieldAlert, ShieldX
} from 'lucide-react';

import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MARKETPLACE_DOMAINS, DomainID } from '@/lib/marketplace/domains';
import SmartFormFields from '@/components/marketplace/SmartFormFields';

// ── DOMAIN ICONS (aligned with Marketplace page icon pattern) ──
const DOMAIN_ICONS: Record<DomainID, React.ElementType> = {
  HUNGER: UtensilsCrossed,
  ACADEMIC: BookOpen,
  SERVICES: Wrench,
  HOSTEL: Home,
  TECH: Cpu,
};

const DOMAIN_LABELS: Record<DomainID, string> = {
  HUNGER: 'Food',
  ACADEMIC: 'Books',
  SERVICES: 'Services',
  HOSTEL: 'Hostel',
  TECH: 'Tech',
};

export default function CreateListingPage() {
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState<DomainID | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});

  const [governanceStatus, setGovernanceStatus] = useState<'STABLE' | 'WARNING' | 'BLOCKED'>('STABLE');
  const [governanceMessage, setGovernanceMessage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isAppealOpen, setIsAppealOpen] = useState(false);
  const [appealText, setAppealText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── GOVERNANCE LOGIC ──
  useEffect(() => {
    if (!selectedDomain || !price) {
      setGovernanceStatus('STABLE');
      setGovernanceMessage(null);
      return;
    }
    const domain = MARKETPLACE_DOMAINS[selectedDomain as DomainID];
    const numericPrice = parseFloat(price);
    const subConfig = domain.subcategories.find(s => s.label === subcategory);
    const ceiling = subConfig?.ceiling || domain.ceiling;

    if (ceiling && numericPrice > ceiling) {
      if (domain.governance === 'REGULATED') {
        setGovernanceStatus('BLOCKED');
        setGovernanceMessage(`Price cap for this category is RM${ceiling.toFixed(2)}.`);
      } else {
        setGovernanceStatus('WARNING');
        setGovernanceMessage(`Recommended ceiling is RM${ceiling.toFixed(2)}.`);
      }
    } else {
      setGovernanceStatus('STABLE');
      setGovernanceMessage(null);
    }
  }, [selectedDomain, subcategory, price]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string].slice(0, 10));
      reader.readAsDataURL(file);
    });
  };

  const handlePost = async () => {
    if (!selectedDomain) return;
    setIsPosting(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'items'), {
        title,
        description,
        domain: selectedDomain,
        subcategory,
        price: parseFloat(price),
        metadata,
        images,
        seller_id: user?.uid || 'ANON',
        seller_name: user?.displayName || 'Pulse Student',
        status: governanceStatus === 'BLOCKED' ? 'PENDING_REVIEW' : 'active',
        governance_status: governanceStatus,
        is_exemption_request: governanceStatus === 'BLOCKED',
        appeal_note: appealText,
        created_at: serverTimestamp(),
      });
      router.push('/marketplace');
    } catch (e) {
      console.error(e);
      alert('Failed to post listing.');
    } finally {
      setIsPosting(false);
    }
  };

  const canPost = !!title && !!price && !!subcategory && images.length > 0 && !isPosting;

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-40">

      {/* ── NAV (matches Marketplace page nav exactly) ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <p className="text-[14px] font-bold tracking-tight">New Listing</p>
            <p className="text-[10px] font-medium text-[#94a3b8]">Institutional Registry</p>
          </div>
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-10">

        {/* ── SECTION: CLASSIFICATION (matches Marketplace filter pill pattern) ── */}
        <section className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">What are you listing?</h2>
            <p className="text-[11px] font-medium text-[#94a3b8]">Choose the category that fits your item.</p>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-6 px-6">
            {(Object.keys(DOMAIN_LABELS) as DomainID[]).map((id) => {
              const isActive = selectedDomain === id;
              const Icon = DOMAIN_ICONS[id];
              return (
                <button
                  key={id}
                  onClick={() => { setSelectedDomain(id); setSubcategory(''); }}
                  className={`h-[32px] px-4 rounded-full flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap border-[0.5px] ${
                    isActive
                      ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-sm'
                      : 'bg-slate-50/50 border-slate-900/10 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[12px] font-bold tracking-[-0.2px]">{DOMAIN_LABELS[id]}</span>
                </button>
              );
            })}
          </div>
        </section>

        {selectedDomain && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-10"
          >

            {/* ── SECTION: IMAGES ── */}
            <section className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Photos</h2>
                  <p className="text-[11px] font-medium text-[#94a3b8]">Add up to 10 images.</p>
                </div>
                <span className="text-[11px] font-bold text-[#94a3b8]">{images.length}/10</span>
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 w-24 h-24 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-100 transition-all"
                >
                  <Plus size={18} className="text-[#94a3b8]" />
                  <span className="text-[9px] font-bold text-[#94a3b8] uppercase tracking-widest">Add</span>
                </button>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                {images.map((img, i) => (
                  <div key={i} className="shrink-0 w-24 h-24 relative rounded-xl overflow-hidden border border-slate-100 group">
                    <img src={img} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-[#1e293b]/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* ── SECTION: NAME ── */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Name</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Keep it short and clear.</p>
              </div>
              <input
                placeholder="e.g. Calculus Textbook, Canon EOS..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-[#1e293b] placeholder:text-slate-200 focus:outline-none focus:border-[#1e293b] transition-colors"
              />
            </section>

            {/* ── SECTION: DETAILS ── */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Description</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Condition, reason for selling, any notes.</p>
              </div>
              <textarea
                placeholder="Tell the buyer what they need to know..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-[#1e293b] placeholder:text-slate-200 focus:outline-none focus:border-[#1e293b] transition-colors resize-none leading-relaxed"
              />
            </section>

            {/* ── SECTION: PRICE ── */}
            <section className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Price</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">Set your asking price in Ringgit.</p>
              </div>
              <div className="flex items-center gap-0 h-12 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:border-[#1e293b] transition-colors">
                <span className="px-4 text-[13px] font-bold text-[#94a3b8] border-r border-slate-100">RM</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="flex-1 h-full px-4 bg-transparent text-[14px] font-bold text-[#1e293b] placeholder:text-slate-200 focus:outline-none"
                />
              </div>

              {/* ── GOVERNANCE INLINE NOTICE ── */}
              {governanceMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 p-4 rounded-xl border ${
                    governanceStatus === 'BLOCKED'
                      ? 'bg-red-50 border-red-100 text-red-600'
                      : 'bg-amber-50 border-amber-100 text-amber-600'
                  }`}
                >
                  {governanceStatus === 'BLOCKED'
                    ? <ShieldX size={16} className="shrink-0 mt-0.5" />
                    : <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  }
                  <div className="space-y-0.5">
                    <p className="text-[12px] font-bold">
                      {governanceStatus === 'BLOCKED' ? 'Price Ceiling Hit' : 'Advisory'}
                    </p>
                    <p className="text-[11px] font-medium leading-relaxed opacity-80">{governanceMessage}</p>
                  </div>
                </motion.div>
              )}
            </section>

            {/* ── SECTION: SMART DOMAIN FIELDS ── */}
            <section className="pt-2 border-t border-slate-100">
              <div className="space-y-0.5 mb-6">
                <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">More Details</h2>
                <p className="text-[11px] font-medium text-[#94a3b8]">
                  Specific information about this type of listing.
                </p>
              </div>
              <SmartFormFields
                domainId={selectedDomain as DomainID}
                subcategory={subcategory}
                onSubcategoryChange={setSubcategory}
                metadata={metadata}
                onMetadataChange={(k, v) => setMetadata(prev => ({ ...prev, [k]: v }))}
              />
            </section>

            {/* ── POST BUTTON ── */}
            <div className="pt-4">
              <button
                disabled={!canPost}
                onClick={() => {
                  if (governanceStatus === 'BLOCKED' && !isAppealOpen) {
                    setIsAppealOpen(true);
                  } else {
                    handlePost();
                  }
                }}
                className={`w-full h-12 rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 transition-all ${
                  canPost
                    ? 'bg-[#1e293b] text-white active:scale-[0.98] shadow-sm'
                    : 'bg-slate-50 text-slate-200 border border-slate-100'
                }`}
              >
                {isPosting && <Loader2 size={16} className="animate-spin" />}
                {isPosting ? 'Publishing...' : governanceStatus === 'BLOCKED' ? 'Request Exemption' : 'Publish Listing'}
              </button>
            </div>

          </motion.div>
        )}
      </div>

      {/* ── APPEAL MODAL ── */}
      <AnimatePresence>
        {isAppealOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAppealOpen(false)}
              className="absolute inset-0 bg-[#1e293b]/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="relative w-full bg-white rounded-t-3xl p-8 space-y-6 shadow-2xl"
            >
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Admin Review</p>
                <h3 className="text-[16px] font-bold text-[#1e293b] tracking-tight">Request Exemption</h3>
                <p className="text-[12px] text-[#94a3b8] font-medium leading-relaxed">
                  This listing exceeds the price ceiling. Give a reason and it will go to admin review.
                </p>
              </div>
              <textarea
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                placeholder="Why should this be approved?"
                className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-[#1e293b] placeholder:text-slate-200 focus:outline-none resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsAppealOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-slate-100 text-[13px] font-bold text-[#94a3b8]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setIsAppealOpen(false); handlePost(); }}
                  className="flex-1 h-11 rounded-xl bg-[#1e293b] text-white text-[13px] font-bold"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </main>
  );
}
