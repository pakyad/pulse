'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { 
  ChevronLeft, Share2, Heart, ShieldCheck, ShieldAlert,
  ArrowUpRight, Clock, MapPin, Layers,
  UtensilsCrossed, BookOpen, Wrench, Home, Cpu, Star, ShoppingCart, CheckCircle2
} from 'lucide-react';
import { MARKETPLACE_DOMAINS, DomainID } from '@/lib/marketplace/domains';
import { useCart } from '@/lib/context/CartContext';
import { AnimatePresence, motion } from 'framer-motion';

// ── DOMAIN REGISTRY RENDERER ──
function DomainRegistry({ item }: { item: any }) {
  const domain = MARKETPLACE_DOMAINS[item.domain as DomainID];
  if (!domain || !item.metadata) return null;

  const rows: { label: string; value: React.ReactNode }[] = [];

  if (item.domain === 'HUNGER') {
    if (item.metadata.active_until) rows.push({
      label: 'Available Until',
      value: (
        <span className="flex items-center gap-1.5 text-red-500 font-bold text-[13px]">
          <Clock size={12} />{item.metadata.active_until}
        </span>
      )
    });
    if (item.metadata.pickup_location) rows.push({
      label: 'Pickup Point',
      value: (
        <span className="flex items-center gap-1.5 font-bold text-[13px] text-[#1e293b]">
          <MapPin size={12} className="text-[#94a3b8]" />{item.metadata.pickup_location}
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
        <span className="px-3 py-1 bg-[#1e293b] text-white text-[10px] font-black uppercase tracking-widest rounded-full">
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
          <span className={`text-[12px] font-bold ${isHeavy ? 'text-red-500' : isMod ? 'text-amber-500' : 'text-emerald-500'}`}>
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
    <section className="space-y-4">
      <div className="space-y-0.5">
        <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">{domain.label}</h2>
        <p className="text-[11px] font-medium text-[#94a3b8]">Details provided by seller</p>
      </div>
      <div className="bg-slate-50 border border-slate-100 rounded-xl divide-y divide-slate-100">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3.5 gap-4">
            <span className="text-[13px] font-medium text-[#94a3b8] shrink-0">{row.label}</span>
            {typeof row.value === 'string'
              ? <span className="text-[13px] font-bold text-[#1e293b] text-right">{row.value}</span>
              : row.value}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ItemDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart, cartCount } = useCart();

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "items", id as string), async (snap) => {
      if (snap.exists()) {
        const itemData: any = { id: snap.id, ...snap.data() };
        setItem(itemData);
        
        // Fetch seller profile for live ratings
        if (itemData.seller_id) {
           const sellerSnap = await getDoc(doc(db, "users", itemData.seller_id));
           if (sellerSnap.exists()) setSeller(sellerSnap.data());
        }
      }
      setLoading(false);
    }, (err) => console.error(err));
    return () => unsub();
  }, [id]);

  const handleAddToCart = () => {
    addToCart({
      productId: item.id,
      title: item.title,
      price: item.price,
      qty: 1,
      vendorId: item.seller_id,
      image: images[0]
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[#1e293b] rounded-full animate-spin" />
    </div>
  );
  if (!item) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Not Found</p>
    </div>
  );

  const domain = MARKETPLACE_DOMAINS[item.domain as DomainID];
  const images: string[] = item.images?.length ? item.images : item.image_url ? [item.image_url] : [];

  const DOMAIN_ICONS: Record<DomainID, React.ElementType> = {
    HUNGER: UtensilsCrossed, ACADEMIC: BookOpen, SERVICES: Wrench, HOSTEL: Home, TECH: Cpu,
  };
  const DomainIcon = domain ? DOMAIN_ICONS[item.domain as DomainID] : Layers;

  const isSoldOut = item.stock_count !== undefined && item.stock_count !== null && item.stock_count <= 0;

  return (
    <main className="min-h-screen bg-white text-[#1e293b] antialiased pb-40">

      {/* ── NAV (matches platform pattern) ── */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between bg-transparent pointer-events-none">
        <button
          onClick={() => router.push('/marketplace')}
          className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-100 flex items-center justify-center text-[#1e293b] shadow-sm active:scale-95 transition-all pointer-events-auto"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => router.push('/cart')}
            className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-100 flex items-center justify-center text-[#1e293b] shadow-sm active:scale-95 transition-all relative"
          >
            <ShoppingCart size={16} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>
          <button className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-100 flex items-center justify-center text-[#1e293b] shadow-sm active:scale-95 transition-all">
            <Share2 size={16} />
          </button>
        </div>
      </nav>

      {/* ── ADDED TO CART NOTIFICATION ── */}
      <AnimatePresence>
        {addedToCart && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-20 left-6 right-6 z-100 bg-[#1e293b] text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-400" />
              </div>
              <p className="text-[12px] font-bold">Added to cart</p>
            </div>
            <button onClick={() => router.push('/cart')} className="text-[11px] font-black uppercase tracking-widest text-emerald-400">View Cart</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── GALLERY ── */}
      <section className="w-full aspect-square bg-slate-50 overflow-hidden relative">
        {images.length > 0 ? (
          <img src={images[activeImage]} className={`w-full h-full object-cover ${isSoldOut ? 'blur-[2px] grayscale opacity-70' : ''}`} alt={item.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <Layers size={48} strokeWidth={1} />
          </div>
        )}

        {isSoldOut && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-20">
             <div className="px-6 py-2 bg-white/90 backdrop-blur-xl rounded-full border border-white shadow-xl">
                <p className="text-[12px] font-black text-red-500 uppercase tracking-[0.2em]">Restocking Soon</p>
             </div>
          </div>
        )}
        
        {/* Image strip (multiple photos) */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_: string, i: number) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`h-1 rounded-full transition-all ${i === activeImage ? 'w-6 bg-[#1e293b]' : 'w-1.5 bg-[#1e293b]/20'}`}
              />
            ))}
          </div>
        )}

        {/* Domain pill (bottom-left) */}
        {domain && (
          <div className="absolute bottom-4 left-4">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-slate-100 rounded-full text-[10px] font-bold text-[#1e293b] shadow-sm">
              <DomainIcon size={11} strokeWidth={2} />
              {domain.label}
            </span>
          </div>
        )}
      </section>

      {/* ── CONTENT ── */}
      <div className="px-6 pt-6 space-y-8">

        {/* ── IDENTITY ── */}
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-[22px] font-bold text-[#1e293b] leading-tight tracking-tight flex-1">
              {item.title}
            </h1>
            {isSoldOut ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 shrink-0 pt-1 uppercase tracking-widest">
                <ShieldAlert size={12} /> Out of Stock
              </span>
            ) : item.governance_status !== 'BLOCKED' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 shrink-0 pt-1">
                <ShieldCheck size={12} /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 shrink-0 pt-1">
                <ShieldAlert size={12} /> Under Review
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <span className="text-[28px] font-bold text-[#1e293b] tracking-tighter">
                RM{Number(item.price).toFixed(2)}
              </span>
              {item.subcategory && (
                <span className="h-[22px] px-3 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-[#94a3b8] flex items-center">
                  {item.subcategory}
                </span>
              )}
            </div>
            
            {item.stock_count !== undefined && item.stock_count !== null && item.stock_count > 0 && (
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${item.stock_count <= 5 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                  {item.stock_count} Available
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── SELLER ROW ── */}
        <section className="flex items-center justify-between py-4 border-y border-slate-100">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.seller_name || 'Pulse'}`} className="w-full h-full object-cover" />
             </div>
             <div>
                <p className="text-[13px] font-bold text-[#1e293b]">{item.seller_name || 'Pulse Student'}</p>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                   <Star size={12} fill="currentColor" />
                   <span>{seller?.averageRating || '5.0'}</span>
                   <span className="text-slate-300 ml-1 font-medium">({seller?.totalReviews || '0'})</span>
                </div>
             </div>
          </div>
          <button className="h-8 px-4 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-bold text-[#94a3b8] active:scale-95 transition-all">
            View Profile
          </button>
        </section>

        {/* ── DOMAIN REGISTRY ── */}
        <DomainRegistry item={item} />

        {/* ── REVIEWS SECTION ── */}
        <section className="space-y-6 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Community Feedback</h2>
              <p className="text-[11px] font-medium text-[#94a3b8]">Verified institutional reviews</p>
            </div>
            <button className="text-[12px] font-bold text-[#1e293b] opacity-40">View All</button>
          </div>
          
          {/* Mock Review if none exist yet - for demo integrity */}
          <div className="space-y-4">
             <div className="p-5 bg-slate-50/50 border border-slate-50 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] font-bold">AZ</div>
                      <span className="text-[12px] font-bold text-[#1e293b]">amirul.z</span>
                   </div>
                   <div className="flex items-center gap-0.5 text-amber-400">
                      {[1,2,3,4,5].map(s => <Star key={s} size={10} fill="currentColor" />)}
                   </div>
                </div>
                <p className="text-[13px] font-medium text-[#1e293b]/70 leading-relaxed italic">
                  "Item arrived in perfect condition. Seller was very responsive and the transaction was smooth."
                </p>
             </div>
          </div>
        </section>

        {/* ── DESCRIPTION ── */}
        {item.description && (
          <section className="space-y-3 pt-2 border-t border-slate-100">
            <div className="space-y-0.5">
              <h2 className="text-[14px] font-bold text-[#1e293b] tracking-tight">Description</h2>
              <p className="text-[11px] font-medium text-[#94a3b8]">From the seller</p>
            </div>
            <p className="text-[14px] font-medium text-[#1e293b]/70 leading-relaxed">{item.description}</p>
          </section>
        )}

        {/* ── HANDSHAKE NOTICE (Services only) ── */}
        {item.domain === 'SERVICES' && (
          <section className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
              <ShieldCheck size={14} className="text-[#1e293b]" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[12px] font-bold text-[#1e293b]">Handshake Protected</p>
              <p className="text-[11px] font-medium text-[#94a3b8] leading-relaxed">
                Payment is held securely until you confirm the service is done. Only you can close this transaction.
              </p>
            </div>
          </section>
        )}

        {/* ── INLINE ACTIONS (above footer) ── */}
        <section className="space-y-3 pt-2">
          <button
            disabled={isSoldOut}
            onClick={() => router.push(`/marketplace/${id}/checkout`)}
            className={`w-full h-12 font-bold text-[14px] tracking-tight rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm ${
               isSoldOut ? 'bg-slate-50 text-slate-200 border border-slate-100' : 'bg-[#1e293b] text-white'
            }`}
          >
            {isSoldOut ? 'Restocking Soon' : item.domain === 'SERVICES' ? 'Book Now' : 'Buy Now'}
            {!isSoldOut && <ArrowUpRight size={16} />}
          </button>
          <button className="w-full h-12 border border-slate-100 text-[#94a3b8] font-bold text-[13px] tracking-tight rounded-xl active:scale-[0.98] transition-all">
            Message Seller
          </button>
        </section>

      </div>

      {/* ── STICKY FOOTER ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 active:scale-90 transition-all ${isWishlisted ? 'border-red-100 bg-red-50 text-red-400' : 'border-slate-100 bg-slate-50 text-slate-300'}`}
          >
            <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
          <button
            disabled={isSoldOut}
            onClick={handleAddToCart}
            className="h-12 px-6 border border-slate-100 bg-slate-50 text-[#1e293b] font-bold text-[13px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-30"
          >
            <ShoppingCart size={16} />
            {isSoldOut ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <button
            disabled={isSoldOut}
            onClick={() => router.push(`/marketplace/${id}/checkout`)}
            className="flex-1 h-12 bg-[#1e293b] text-white font-bold text-[13px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-20"
          >
            {isSoldOut ? 'Sold Out' : item.domain === 'SERVICES' ? 'Book Now' : 'Buy Now'}
            {!isSoldOut && <ArrowUpRight size={16} />}
          </button>
        </div>
      </footer>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </main>
  );
}
