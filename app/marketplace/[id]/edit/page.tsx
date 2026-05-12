'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Plus, Trash2, Loader2, Save,
  UtensilsCrossed, BookOpen, Wrench, Home, Cpu,
} from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { MARKETPLACE_DOMAINS, DomainID } from '@/lib/marketplace/domains';
import SmartFormFields from '@/components/marketplace/SmartFormFields';

const DOMAIN_ICONS: Record<DomainID, React.ElementType> = {
  HUNGER: UtensilsCrossed, ACADEMIC: BookOpen, SERVICES: Wrench, HOSTEL: Home, TECH: Cpu,
};
const DOMAIN_LABELS: Record<DomainID, string> = {
  HUNGER: 'Food', ACADEMIC: 'Books', SERVICES: 'Services', HOSTEL: 'Hostel', TECH: 'Tech',
};

export default function EditListingPage() {
  const router = useRouter();
  const { id } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  // Form state
  const [selectedDomain, setSelectedDomain] = useState<DomainID | ''>('');
  const [subcategory, setSubcategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});

  // Price governance
  const [governanceStatus, setGovernanceStatus] = useState<'STABLE' | 'WARNING' | 'BLOCKED'>('STABLE');
  const [governanceCeiling, setGovernanceCeiling] = useState<number | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/auth'); return; }

      const snap = await getDoc(doc(db, 'items', id as string));
      if (!snap.exists()) { router.push('/marketplace'); return; }

      const data = snap.data();
      if (data.seller_id !== user.uid) {
        router.push('/marketplace'); // Unauthorized
        return;
      }

      setAuthorized(true);
      setTitle(data.title || '');
      setDescription(data.description || '');
      setPrice(String(data.price || ''));
      setStock(String(data.stock_count ?? ''));
      setImages(data.images || (data.image_url ? [data.image_url] : []));
      setSelectedDomain((data.domain as DomainID) || '');
      setSubcategory(data.subcategory || '');
      setMetadata(data.metadata || {});
      setLoading(false);
    });
    return () => unsubAuth();
  }, [id, router]);

  // Governance
  useEffect(() => {
    if (!selectedDomain || !price) { setGovernanceStatus('STABLE'); setGovernanceCeiling(null); return; }
    const domain = MARKETPLACE_DOMAINS[selectedDomain as DomainID];
    const numericPrice = parseFloat(price);
    const subConfig = domain.subcategories.find((s: any) => s.label === subcategory);
    const ceiling = subConfig?.ceiling || domain.ceiling;
    setGovernanceCeiling(ceiling || null);
    if (ceiling && numericPrice > ceiling) {
      setGovernanceStatus(domain.governance === 'REGULATED' ? 'BLOCKED' : 'WARNING');
    } else if (ceiling && numericPrice >= ceiling * 0.8) {
      setGovernanceStatus('WARNING');
    } else {
      setGovernanceStatus('STABLE');
    }
  }, [selectedDomain, subcategory, price]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string].slice(0, 10));
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    if (!title || !price) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'items', id as string), {
        title,
        description,
        price: parseFloat(price),
        stock_count: stock !== '' ? parseInt(stock, 10) : null,
        images,
        subcategory,
        metadata,
        governance_status: governanceStatus,
        governance_ceiling: governanceCeiling,
        updated_at: serverTimestamp(),
        // If stock becomes 0, auto-mark as sold out
        status: stock !== '' && parseInt(stock, 10) === 0 ? 'sold_out' : 'active',
      });
      router.push('/merchant');
    } catch (e) {
      console.error('[EditListing]', e);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[#1e293b] rounded-full animate-spin" />
    </div>
  );

  if (!authorized) return null;

  const canSave = !!title && !!price && !isSaving && governanceStatus !== 'BLOCKED';

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-40">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 active:scale-95 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <p className="text-[14px] font-bold tracking-tight">Edit Listing</p>
            <p className="text-[10px] font-medium text-[#94a3b8]">Changes save to your shop</p>
          </div>
        </div>
      </nav>

      <div className="pt-28 px-6 space-y-10">

        {/* ── DOMAIN (read-only, can't change after posting) ── */}
        <section className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Category</h2>
            <p className="text-[11px] font-medium text-[#94a3b8]">Category is locked after publishing.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 -mx-6 px-6">
            {(Object.keys(DOMAIN_LABELS) as DomainID[]).map((did) => {
              const isActive = selectedDomain === did;
              const Icon = DOMAIN_ICONS[did];
              return (
                <div
                  key={did}
                  className={`h-[32px] px-4 rounded-full flex items-center gap-2 whitespace-nowrap border-[0.5px] ${
                    isActive
                      ? 'bg-[#1e293b] border-[#1e293b] text-white'
                      : 'bg-slate-50/50 border-slate-200 text-slate-300 opacity-50'
                  }`}
                >
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[12px] font-bold tracking-[-0.2px]">{DOMAIN_LABELS[did]}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── IMAGES ── */}
        <section className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Photos</h2>
              <p className="text-[11px] font-medium text-[#94a3b8]">Add or remove photos.</p>
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

        {/* ── NAME ── */}
        <section className="space-y-3 pt-2 border-t border-slate-100">
          <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Name</h2>
          <input
            placeholder="Item name..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-[#1e293b] placeholder:text-slate-200 focus:outline-none focus:border-[#1e293b] transition-colors"
          />
        </section>

        {/* ── DESCRIPTION ── */}
        <section className="space-y-3 pt-2 border-t border-slate-100">
          <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Description</h2>
          <textarea
            placeholder="Condition, notes..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-[#1e293b] placeholder:text-slate-200 focus:outline-none focus:border-[#1e293b] transition-colors resize-none leading-relaxed"
          />
        </section>

        {/* ── PRICE ── */}
        <section className="space-y-3 pt-2 border-t border-slate-100">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Price</h2>
          </div>
          <div className={`flex items-center gap-0 h-12 bg-slate-50 border rounded-xl overflow-hidden focus-within:border-[#1e293b] transition-colors ${
            governanceStatus === 'BLOCKED' ? 'border-red-200' :
            governanceStatus === 'WARNING' ? 'border-amber-200' : 'border-slate-100'
          }`}>
            <span className="px-4 text-[13px] font-bold text-[#94a3b8] border-r border-slate-100">RM</span>
            <input
              type="number"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="flex-1 h-full px-4 bg-transparent text-[14px] font-bold text-[#1e293b] placeholder:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Price gauge */}
          {governanceCeiling && price && (
            <div className="space-y-1.5">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    governanceStatus === 'BLOCKED' ? 'bg-red-400' :
                    governanceStatus === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  animate={{ width: `${Math.min(100, (parseFloat(price) / governanceCeiling) * 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between">
                <p className={`text-[11px] font-bold ${
                  governanceStatus === 'BLOCKED' ? 'text-red-500' :
                  governanceStatus === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {governanceStatus === 'BLOCKED' ? `RM ${(parseFloat(price) - governanceCeiling).toFixed(2)} over ceiling` :
                   governanceStatus === 'WARNING' ? 'Approaching ceiling' : 'Within ceiling'}
                </p>
                <p className="text-[11px] font-medium text-[#94a3b8]">Ceiling: RM {governanceCeiling.toFixed(2)}</p>
              </div>
            </div>
          )}
        </section>

        {/* ── STOCK ── */}
        <section className="space-y-3 pt-2 border-t border-slate-100">
          <div className="space-y-0.5">
            <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Stock</h2>
            <p className="text-[11px] font-medium text-[#94a3b8]">Set to 0 to mark as sold out.</p>
          </div>
          <div className="flex items-center gap-0 h-12 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden focus-within:border-[#1e293b] transition-colors">
            <span className="px-4 text-[13px] font-bold text-[#94a3b8] border-r border-slate-100">Qty</span>
            <input
              type="number"
              placeholder="e.g. 5"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="flex-1 h-full px-4 bg-transparent text-[14px] font-bold text-[#1e293b] placeholder:text-slate-200 focus:outline-none"
            />
          </div>
          {stock !== '' && parseInt(stock, 10) === 0 && (
            <p className="text-[11px] font-bold text-red-400">This listing will be marked as Sold Out.</p>
          )}
        </section>

        {/* ── SMART DOMAIN FIELDS ── */}
        {selectedDomain && (
          <section className="pt-2 border-t border-slate-100">
            <div className="space-y-0.5 mb-6">
              <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">More Details</h2>
            </div>
            <SmartFormFields
              domainId={selectedDomain as DomainID}
              subcategory={subcategory}
              onSubcategoryChange={setSubcategory}
              metadata={metadata}
              onMetadataChange={(k, v) => setMetadata(prev => ({ ...prev, [k]: v }))}
            />
          </section>
        )}

        {/* ── SAVE BUTTON ── */}
        <div className="pt-4">
          <button
            disabled={!canSave}
            onClick={handleSave}
            className={`w-full h-12 rounded-xl font-bold text-[14px] tracking-tight flex items-center justify-center gap-2 transition-all ${
              canSave
                ? 'bg-[#1e293b] text-white active:scale-[0.98] shadow-sm'
                : 'bg-slate-50 text-slate-200 border border-slate-100'
            }`}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          {governanceStatus === 'BLOCKED' && (
            <p className="text-[11px] font-medium text-red-400 text-center mt-2">
              Price exceeds the ceiling. Lower it to save.
            </p>
          )}
        </div>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </main>
  );
}
