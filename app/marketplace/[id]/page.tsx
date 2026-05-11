'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  ChevronLeft, Share2, Heart, ShieldCheck, ShieldAlert,
  ArrowUpRight, Clock, MapPin, Layers, AlertTriangle
} from 'lucide-react';
import { MARKETPLACE_DOMAINS, DomainID } from '@/lib/marketplace/domains';

// ── DOMAIN REGISTRY RENDERER ──
// Renders all metadata fields collected during listing, per domain.
function DomainRegistry({ item }: { item: any }) {
  const domain = MARKETPLACE_DOMAINS[item.domain as DomainID];
  if (!domain || !item.metadata) return null;

  const rows: { label: string; value: React.ReactNode }[] = [];

  if (item.domain === 'HUNGER') {
    if (item.metadata.active_until) rows.push({
      label: 'Available Until',
      value: (
        <span className="flex items-center gap-1.5 text-red-500 font-bold text-[13px]">
          <Clock size={12} />
          {item.metadata.active_until}
        </span>
      )
    });
    if (item.metadata.pickup_location) rows.push({
      label: 'Pickup Point',
      value: (
        <span className="flex items-center gap-1.5 font-bold text-[13px] text-slate-900">
          <MapPin size={12} className="text-slate-400" />
          {item.metadata.pickup_location}
        </span>
      )
    });
  }

  if (item.domain === 'ACADEMIC') {
    if (item.metadata.department) rows.push({ label: 'Faculty', value: item.metadata.department });
    if (item.metadata.year_semester) rows.push({ label: 'Year / Sem', value: item.metadata.year_semester });
    if (item.metadata.subject_code) rows.push({ label: 'Subject Code', value: item.metadata.subject_code });
  }

  if (item.domain === 'SERVICES') {
    if (item.metadata.duration_type) rows.push({ label: 'Billing Basis', value: item.metadata.duration_type });
    if (item.metadata.available_slots) rows.push({
      label: 'Availability',
      value: (
        <span className="px-4 py-1.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest">
          {item.metadata.available_slots}
        </span>
      )
    });
  }

  if (item.domain === 'HOSTEL') {
    if (item.metadata.pickup_difficulty) {
      const isHeavy = item.metadata.pickup_difficulty.includes('Heavy');
      const isMod = item.metadata.pickup_difficulty.includes('Moderate');
      rows.push({
        label: 'Pickup',
        value: (
          <span className={`text-[12px] font-black uppercase tracking-widest ${isHeavy ? 'text-red-500' : isMod ? 'text-amber-500' : 'text-emerald-500'}`}>
            {item.metadata.pickup_difficulty}
          </span>
        )
      });
    }
  }

  if (item.domain === 'TECH') {
    if (item.metadata.specs) rows.push({ label: 'Specs', value: item.metadata.specs });
    if (item.metadata.warranty) rows.push({ label: 'Warranty', value: item.metadata.warranty });
    if (item.metadata.validity_period) rows.push({ label: 'Valid For', value: item.metadata.validity_period });
  }

  if (rows.length === 0) return null;

  return (
    <section className="pt-8 border-t border-slate-50 space-y-6">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
        {domain.label}
      </h3>
      <div className="space-y-5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-start justify-between gap-4">
            <span className="text-[13px] font-bold text-slate-400 shrink-0">{row.label}</span>
            {typeof row.value === 'string'
              ? <span className="text-[13px] font-bold text-slate-900 text-right">{row.value}</span>
              : row.value
            }
          </div>
        ))}
      </div>
    </section>
  );
}

// ── GOVERNANCE STATUS BADGE ──
function GovernanceTag({ status }: { status?: string }) {
  if (!status || status === 'STABLE') return (
    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
      <ShieldCheck size={12} /> Verified
    </span>
  );
  if (status === 'BLOCKED' || status === 'PENDING_REVIEW') return (
    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500">
      <ShieldAlert size={12} /> Under Review
    </span>
  );
  return null;
}

// ── MAIN PAGE ──
export default function ItemDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "items", id as string), (snap) => {
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      setLoading(false);
    }, (err) => console.error(err));
    return () => unsub();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );

  if (!item) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[11px] font-black uppercase tracking-widest text-slate-300">Not Found</p>
    </div>
  );

  const domain = MARKETPLACE_DOMAINS[item.domain as DomainID];
  const images: string[] = item.images?.length ? item.images : item.image_url ? [item.image_url] : [];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 pt-10 pb-4 flex items-center justify-between pointer-events-none">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-white/90 backdrop-blur-xl border border-slate-100 flex items-center justify-center shadow-lg active:scale-90 transition-all pointer-events-auto"
        >
          <ChevronLeft size={18} />
        </button>
        <button className="w-10 h-10 bg-white/90 backdrop-blur-xl border border-slate-100 flex items-center justify-center shadow-lg active:scale-90 transition-all pointer-events-auto">
          <Share2 size={16} />
        </button>
      </nav>

      {/* ── SECTION 1: GALLERY ── */}
      <section className="w-full aspect-square bg-slate-50 overflow-hidden relative">
        {images.length > 0 ? (
          <img
            src={images[activeImage]}
            className="w-full h-full object-cover"
            alt={item.title}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <Layers size={48} strokeWidth={1} />
          </div>
        )}

        {/* Image Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
            {images.map((_: string, i: number) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`w-1.5 h-1.5 transition-all ${i === activeImage ? 'bg-slate-900 w-4' : 'bg-slate-300'}`}
              />
            ))}
          </div>
        )}

        {/* Domain Label */}
        {domain && (
          <div className="absolute top-20 left-6">
            <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-100">
              {domain.label}
            </span>
          </div>
        )}
      </section>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="pb-40">
        <div className="px-6 mt-8 space-y-10">

          {/* ── SECTION 2: IDENTITY ── */}
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-[24px] font-bold text-slate-900 leading-tight tracking-tight flex-1">
                {item.title}
              </h1>
              <GovernanceTag status={item.governance_status} />
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-[28px] font-bold text-slate-900 tracking-tighter">
                RM{Number(item.price).toFixed(2)}
              </span>
              {item.subcategory && (
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  {item.subcategory}
                </span>
              )}
            </div>
          </section>

          {/* ── SECTION 3: DOMAIN REGISTRY ── */}
          {/* Renders all metadata fields collected during listing */}
          <DomainRegistry item={item} />

          {/* ── SELLER ROW ── */}
          <section className="pt-8 border-t border-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-slate-400">Listed by</span>
              <span className="text-[13px] font-bold text-slate-900">{item.seller_name || 'Pulse Student'}</span>
            </div>
          </section>

          {/* ── SECTION 4: DESCRIPTION ── */}
          {item.description && (
            <section className="pt-8 border-t border-slate-50 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Description</h3>
              <p className="text-[14px] font-medium text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </section>
          )}

          {/* ── HANDSHAKE PROTOCOL NOTE (Services) ── */}
          {item.domain === 'SERVICES' && (
            <section className="pt-8 border-t border-slate-50">
              <div className="p-5 bg-slate-50 border border-slate-100 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Handshake Protocol</p>
                <p className="text-[12px] font-bold text-slate-600 leading-relaxed">
                  Payment is held until you confirm the service is complete. Only you can close this transaction.
                </p>
              </div>
            </section>
          )}

          {/* ── ACTIONS (inline, above footer) ── */}
          <section className="pt-8 space-y-3 border-t border-slate-50">
            <button
              onClick={() => router.push(`/marketplace/${id}/checkout`)}
              className="w-full h-14 bg-slate-900 text-white font-bold text-[13px] uppercase tracking-widest active:scale-[0.98] transition-all"
            >
              {item.domain === 'SERVICES' ? 'Book Now' : 'Buy Now'}
            </button>
            <button className="w-full h-14 border border-slate-100 text-slate-600 font-bold text-[13px] uppercase tracking-widest active:scale-[0.98] transition-all">
              Message Seller
            </button>
          </section>

        </div>
      </div>

      {/* ── STICKY FOOTER ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-50">
        <div className="flex items-center gap-3">
          <button className="w-12 h-12 border border-slate-100 flex items-center justify-center text-slate-300 active:scale-90 transition-all shrink-0">
            <Heart size={18} />
          </button>
          <button
            onClick={() => router.push(`/marketplace/${id}/checkout`)}
            className="flex-1 h-12 bg-slate-900 text-white font-bold text-[12px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
          >
            {item.domain === 'SERVICES' ? 'Book Now' : 'Buy Now'}
            <ArrowUpRight size={16} />
          </button>
        </div>
      </footer>

    </div>
  );
}
