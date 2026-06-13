'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { 
  ChevronLeft, ChevronRight, Share2, Heart, ShieldCheck, ShieldAlert,
  ArrowUpRight, Clock, MapPin, Layers, Shirt, Trash2,
  BookOpen, Wrench, Home, Cpu, Star, ShoppingCart, CheckCircle2, MessageCircle, Edit3, Briefcase
} from 'lucide-react';
import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';
import { useCart } from '@/lib/context/CartContext';
import { AnimatePresence, motion } from 'framer-motion';
import ReportPriceButton from '@/components/shared/ReportPriceButton';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { replyToReview } from '@/app/actions/reviewActions';

//  CATEGORY REGISTRY RENDERER 
function DomainRegistry({ item }: { item: any }) {
  const category = MARKETPLACE_CATEGORIES[item.category as CategoryID];
  if (!category || !item.metadata) return null;

  const rows: { label: string; value: React.ReactNode }[] = [];

  if (item.category === 'ACADEMIC') {
    const program = item.metadata.program || item.metadata.department;
    if (program) rows.push({ label: 'Program', value: program });
    if (item.metadata.year_semester) rows.push({ label: 'Year / Sem', value: item.metadata.year_semester });
    if (item.metadata.subject_code) rows.push({ label: 'Subject Code', value: item.metadata.subject_code });
  }

  if (item.category === 'HOSTEL') {
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
  if (item.category === 'TECH') {
    if (item.metadata.specs) rows.push({ label: 'Specs', value: item.metadata.specs });
    if (item.metadata.warranty) rows.push({ label: 'Warranty', value: item.metadata.warranty });
    if (item.metadata.validity_period) rows.push({ label: 'Valid For', value: item.metadata.validity_period });
  }

  if (item.fulfillment_mode === 'MEETUP_ONLY') {
    rows.push({
      label: 'Fulfillment',
      value: (
        <span className="flex items-center gap-1.5 font-bold text-[13px] text-slate-900">
          Strictly Meetup
        </span>
      )
    });
  } else if (item.fulfillment_mode === 'DELIVERY') {
    rows.push({
      label: 'Fulfillment',
      value: (
        <span className="flex items-center gap-1.5 font-bold text-[13px] text-slate-900">
          Runner Delivery Available
        </span>
      )
    });
  }

  if (rows.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="space-y-0.5">
        <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">{category.label}</h2>
        <p className="text-[11px] font-medium text-[#94a3b8]">Details provided by seller</p>
      </div>
      <div className="bg-slate-50 border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between px-6 py-4 gap-4">
            <span className="text-[13px] font-medium text-[#94a3b8] shrink-0">{row.label}</span>
            {typeof row.value === 'string'
              ? <span className="text-[13px] font-bold text-slate-900 text-right">{row.value}</span>
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
  const [isCopied, setIsCopied] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const { addToCart, cartCount } = useCart();

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim() || !auth.currentUser) return;
    setReplying(true);
    try {
      await replyToReview(reviewId, auth.currentUser.uid, replyText);
      setReplyingTo(null);
      setReplyText('');
    } catch (e) {
      console.error(e);
    } finally {
      setReplying(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "items", id as string), async (snap) => {
      if (snap.exists()) {
        const itemData: any = { id: snap.id, ...snap.data() };
        setItem(itemData);
      }
      setLoading(false);
    }, (err) => console.error(err));
    return () => unsub();
  }, [id]);

  // Live seller profile for trustRating updates
  useEffect(() => {
    if (!item?.seller_id) return;
    const unsub = onSnapshot(doc(db, "users", item.seller_id), (snap) => {
      if (snap.exists()) setSeller(snap.data());
    });
    return () => unsub();
  }, [item?.seller_id]);

  // Fetch reviews  for student items: by item_id; for club items: by seller_id
  useEffect(() => {
    if (!item || !seller) return;
    const isOfficial = seller?.is_official === true;
    
    //  Simplified query to avoid composite index crash
    const reviewsQuery = isOfficial
      ? query(collection(db, "Reviews"), where("sellerId", "==", item.seller_id), limit(20))
      : query(collection(db, "Reviews"), where("itemId", "==", item.id), limit(20));

    const unsub = onSnapshot(reviewsQuery, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      // Sort in memory to avoid requiring a composite index in Firestore
      list.sort((a, b) => {
        const ta = a.created_at?.toMillis ? a.created_at.toMillis() : new Date(a.created_at || 0).getTime();
        const tb = b.created_at?.toMillis ? b.created_at.toMillis() : new Date(b.created_at || 0).getTime();
        return tb - ta;
      });
      setReviews(list);
    }, (err) => {
      console.error("[Reviews] Firestore Fetch Error:", err);
      // Fail gracefully  don't crash the whole page if reviews fail
      setReviews([]);
    });
    return () => unsub();
  }, [item, seller]);

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

  const handleMessageSeller = async () => {
    if (!auth.currentUser) {
      router.push('/auth');
      return;
    }
    if (!item?.seller_id) return;

    // Use a deterministic ID so the same buyer and seller for the same item always resume the same chat
    const chatId = `chat_${auth.currentUser.uid}_${item.seller_id}_${item.id}`;
    
    try {
      const chatRef = doc(db, 'chats', chatId);
      const snap = await getDoc(chatRef);
      if (!snap.exists()) {
        const buyerSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const buyerProfile = buyerSnap.data();
        const buyerName = buyerProfile?.full_name || buyerProfile?.fullName || auth.currentUser.displayName || "Pulse Student";
        await setDoc(chatRef, {
           members: [auth.currentUser.uid, item.seller_id],
           participant_names: {
              [auth.currentUser.uid]: buyerName,
              [item.seller_id]: item.seller_name || "Club / Seller"
           },
           type: 'MARKETPLACE',
           context_title: item.title,
           context_id: item.id,
           lastMessage: "Conversation started",
           updatedAt: serverTimestamp(),
           unread_count: 0
        });
      }
      router.push(`/messages/${chatId}`);
    } catch (e) {
      console.error('[Chat] Failed to create chat session:', e);
      // Do not redirect to a demo fallback  surface the error in the UI
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[slate-900] rounded-full animate-spin" />
    </div>
  );
  if (!item) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[11px] font-bold  text-[#94a3b8]">Not Found</p>
    </div>
  );

  const category = MARKETPLACE_CATEGORIES[item.category as CategoryID];
  const images: string[] = item.images?.length ? item.images : item.image_url ? [item.image_url] : [];

  const CATEGORY_ICONS: Record<CategoryID, React.ElementType> = {
    ACADEMIC: BookOpen, HOSTEL: Home, TECH: Cpu, APPAREL: Shirt, SERVICES: Briefcase
  };
  const CategoryIcon = category ? CATEGORY_ICONS[item.category as CategoryID] : Layers;

  const isSoldOut = item.stock_count !== undefined && item.stock_count !== null && item.stock_count <= 0;

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">

      {/*  NAV (Dynamic Scroll-Adaptive)  */}
      <nav className={`fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center justify-between transition-all duration-700 ease-out pointer-events-none ${isScrolled ? 'bg-white/95 backdrop-blur-xl border-b-[0.5px] border-slate-100' : 'bg-transparent'}`}>
        <div className="pointer-events-auto">
          <button 
            onClick={() => {
              if (window.history.length > 2) {
                router.back();
              } else {
                router.push('/marketplace');
              }
            }} 
            className={`w-10 h-10 flex items-center justify-center transition-all duration-700 ease-out active:scale-90 ${isScrolled ? 'rounded-2xl bg-slate-50 text-[#94a3b8] border border-slate-50 hover:bg-slate-100' : 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]'}`}
          >
            <ChevronLeft size={isScrolled ? 20 : 28} strokeWidth={isScrolled ? 2 : 2.5} className="transition-all duration-700 ease-out" />
          </button>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => router.push('/cart')}
            className={`w-10 h-10 flex items-center justify-center transition-all duration-700 ease-out active:scale-95 relative ${isScrolled ? 'rounded-2xl bg-slate-50 text-[#94a3b8] border border-slate-50 hover:bg-slate-100' : 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]'}`}
          >
            <ShoppingCart size={isScrolled ? 18 : 22} strokeWidth={isScrolled ? 2 : 2.5} className="transition-all duration-700 ease-out" />
            {cartCount > 0 && (
              <span className={`absolute -top-1 -right-1 w-4 h-4 text-white text-[9px] font-semibold rounded-full flex items-center justify-center border-2 transition-all duration-700 ease-out ${isScrolled ? 'bg-red-500 border-white' : 'bg-red-500 border-transparent shadow-[0_1px_4px_rgba(0,0,0,0.6)]'}`}>
                {cartCount}
              </span>
            )}
          </button>
          <button 
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
      } catch (e) {
      console.error('[Share] Clipboard write failed:', e);
    }
            }}
            className={`w-10 h-10 flex items-center justify-center transition-all duration-700 ease-out active:scale-95 ${isScrolled ? 'rounded-2xl bg-slate-50 text-[#94a3b8] border border-slate-50 hover:bg-slate-100' : 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]'}`}>
            <Share2 size={isScrolled ? 18 : 22} strokeWidth={isScrolled ? 2 : 2.5} className="transition-all duration-700 ease-out" />
          </button>
        </div>
      </nav>

      {/*  ADDED TO CART NOTIFICATION  */}
      <AnimatePresence>
        {addedToCart && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-20 left-6 right-6 z-100 bg-slate-900 text-white px-4 py-3 rounded-full flex items-center justify-between shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-400" />
              </div>
              <p className="text-[12px] font-bold">Added to cart</p>
            </div>
            <button onClick={() => router.push('/cart')} className="text-[11px] font-semibold text-emerald-400 mr-2">View Cart</button>
          </motion.div>
        )}
        {isCopied && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-20 left-6 right-6 z-100 bg-slate-900 text-white px-4 py-3 rounded-full flex items-center justify-center shadow-md"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-white" />
              <p className="text-[12px] font-bold">Link copied to clipboard</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  GALLERY  */}
      <section className="w-full aspect-square bg-slate-50 overflow-hidden relative">
        {images.length > 0 ? (
          <img src={images[activeImage]} className="w-full h-full object-cover" alt={item.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <Layers size={48} strokeWidth={1} />
          </div>
        )}

        {isSoldOut && (
          <div className="absolute inset-x-0 bottom-0 bg-slate-900/90 py-3 px-3 flex items-center justify-center z-20 backdrop-blur-sm">
            <p className="text-[13px] font-bold text-white uppercase tracking-tight">
              SOLD
            </p>
          </div>
        )}
        
        {/* Image strip (multiple photos) */}
        {images.length > 1 && (
          <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_: string, i: number) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`h-1 rounded-full transition-all ${i === activeImage ? 'w-6 bg-slate-900' : 'w-1.5 bg-slate-900/20'}`}
              />
            ))}
          </div>
        )}
      </section>

      {/*  CONTENT  */}
      <div className="px-6 pt-6 space-y-8">

        {/*  IDENTITY  */}
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-[22px] font-bold text-slate-900 leading-tight tracking-tight flex-1">
              {item.title}
            </h1>
            {isSoldOut ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 shrink-0 pt-1 ">
                <ShieldAlert size={12} /> SOLD
              </span>
            ) : item.status === 'HELD_FOR_REVISION' || item.status === 'FLAGGED_FOR_REVIEW' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 shrink-0 pt-1 ">
                <ShieldAlert size={12} /> Action Required
              </span>
            ) : item.status === 'REJECTED_FRAUDULENT' ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 shrink-0 pt-1 ">
                <ShieldAlert size={12} /> Suspended
              </span>
            ) : null}
          </div>

          {/*  GOVERNANCE BANNER  */}
          {(item.status === 'HELD_FOR_REVISION' || item.status === 'REJECTED_FRAUDULENT') && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 mt-4">
              <ShieldAlert size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-[13px] font-bold text-amber-900 tracking-tight">
                  {item.status === 'HELD_FOR_REVISION' ? 'Listing Held for Revision' : 'Listing Suspended'}
                </h3>
                <p className="text-[12px] font-medium text-amber-800/80 leading-relaxed">
                  {item.governance_message || 'This listing has been suspended due to a pricing violation.'}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-baseline justify-between gap-3 mt-6">
            <div className="flex items-baseline gap-3">
              <span className="text-[28px] font-bold text-slate-900 tracking-tighter">
                RM{Number(item.price).toFixed(2)}
              </span>
              {item.subcategory && (
                <span className="h-[22px] px-3 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold text-[#94a3b8] flex items-center">
                  {item.subcategory}
                </span>
              )}
            </div>
            
            {item.is_official && item.stock_count !== undefined && item.stock_count !== null && item.stock_count > 0 && (
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${item.stock_count <= 5 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                  {item.stock_count} Available
                </p>
              </div>
            )}
          </div>
        </section>

        {/*  PCS CERTIFIED BADGE  */}
        {item.pcs_certified === true && item.pcs_status === 'APPROVED' && (
          <div className="flex items-center gap-2 -mt-2 mb-1">
              <span className="text-[10px] text-[#94a3b8] font-medium">Matched against Shopee & Lazada</span>
          </div>
        )}

        {/*  SELLER ROW  */}
        <section className="py-4 border-y border-slate-100 space-y-3">
          <button 
             onClick={() => router.push(`/user/${item.seller_id}`)}
             className="w-full flex items-center justify-between group active:scale-95 transition-all text-left"
          >
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.seller_name || 'Pulse'}`} className="w-full h-full object-cover" />
               </div>
               <div>
                  <p className="text-[13px] font-bold text-slate-900 group-hover:text-slate-900 transition-colors">{item.seller_name || 'Pulse Student'}</p>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                     <Star size={12} fill="currentColor" />
                      <span>{seller?.trustRating ? Number(seller.trustRating).toFixed(1) : '5.0'}</span>
                     <span className="text-slate-300 ml-1 font-medium">({seller?.totalReviews || '0'})</span>
                  </div>
               </div>
            </div>
            <ChevronRight size={18} className="text-slate-200 group-hover:text-slate-900 transition-colors" />
          </button>
        </section>

        {/*  CATEGORY REGISTRY  */}
        <DomainRegistry item={item} />

        {/*  REVIEWS SECTION  */}
        <section className="space-y-6 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">
                {seller?.is_official ? 'Reviews' : 'Buyer Feedback'}
              </h2>
              <p className="text-[11px] font-medium text-[#94a3b8]">
                {seller?.is_official ? 'From verified purchases' : 'From the buyer of this item'}
              </p>
            </div>
          </div>
          
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="p-5 bg-slate-50/50 border border-slate-50 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[9px] font-bold">
                          {(review.buyerId || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[12px] font-bold text-slate-900">{review.buyerId?.slice(0, 8)}</span>
                     </div>
                     <div className="flex items-center gap-0.5 text-amber-400">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={10} fill={s <= review.rating ? "currentColor" : "none"} stroke={s <= review.rating ? "currentColor" : "#e2e8f0"} />
                        ))}
                     </div>
                  </div>
                  <p className="text-[13px] font-medium text-slate-900/70 leading-relaxed">{review.comment}</p>
                  {review.reply ? (
                    <div className="ml-6 pl-4 border-l-2 border-slate-200 space-y-1">
                      <p className="text-[11px] font-bold text-slate-500">Seller reply</p>
                      <p className="text-[12px] font-medium text-slate-600 leading-relaxed">{review.reply.text}</p>
                    </div>
                  ) : seller?.is_official && auth.currentUser?.uid === item.seller_id && (
                    <div className="ml-6 pl-4 border-l-2 border-slate-200">
                      {replyingTo === review.id ? (
                        <div className="space-y-2 mt-2">
                          <input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="w-full text-[12px] font-medium text-slate-900 bg-white border border-slate-100 rounded-xl px-3 py-2 outline-none focus:border-slate-300 placeholder:text-slate-300"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleReply(review.id)} disabled={replying || !replyText.trim()}
                              className="text-[11px] font-bold text-white bg-slate-900 rounded-lg px-3 py-1.5 disabled:opacity-30 active:scale-95 transition-all">
                              {replying ? 'Posting...' : 'Reply'}
                            </button>
                            <button onClick={() => { setReplyingTo(null); setReplyText(''); }}
                              className="text-[11px] font-medium text-slate-400 hover:text-slate-600 px-2">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setReplyingTo(review.id)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-slate-900 transition-colors mt-1 flex items-center gap-1">
                          <MessageCircle size={12} /> Reply
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 bg-slate-50/50 border border-slate-50 rounded-2xl">
              <p className="text-[13px] font-medium text-slate-400 text-center italic">
                {seller?.is_official 
                  ? 'No reviews yet. Be the first to order!' 
                  : 'This item has not been purchased yet.'}
              </p>
            </div>
          )}
        </section>

        {/*  DESCRIPTION  */}
        {item.description && (
          <section className="space-y-3 pt-2 border-t border-slate-100">
            <div className="space-y-0.5">
              <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Description</h2>
              <p className="text-[11px] font-medium text-[#94a3b8]">From the seller</p>
            </div>
            <p className="text-[14px] font-medium text-slate-900/70 leading-relaxed">{item.description}</p>
          </section>
        )}



        {/*  SELLER CONTACT ACTION  */}
        {auth.currentUser?.uid !== item.seller_id && (
          <section className="space-y-3 pt-4">
            <button 
               onClick={handleMessageSeller}
               className="w-full h-14 border border-slate-100 bg-white text-slate-900 hover:bg-slate-50 font-bold text-[13px] tracking-tight rounded-full active:scale-95 transition-all shadow-sm">
              Message Seller
            </button>
          </section>
        )}

        {/*  REPORT ACTION  */}
        {auth.currentUser?.uid !== item.seller_id && (
          <section className="flex justify-center pt-8 pb-4">
            <ReportPriceButton itemId={item.id} sellerId={item.seller_id} />
          </section>
        )}

      </div>

      {/*  STICKY FOOTER  */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4 pb-8 bg-white/95 backdrop-blur-xl border-t border-slate-100">
        <div className="flex items-center gap-3">
          {auth.currentUser?.uid === item.seller_id ? (
            <div className="flex-1 flex gap-3">
              <button
                onClick={() => router.push(`/marketplace/edit/${id}`)}
                className="flex-1 bg-gray-900 text-white text-sm font-medium rounded-full py-3 flex items-center justify-center gap-2"
              >
                <Edit3 size={16} />
                Edit Listing
              </button>
              <button
                onClick={async () => {
                  if (window.confirm('Delete this listing? This cannot be undone.')) {
                    try {
                      await deleteDoc(doc(db, 'items', id as string));
                      router.push('/marketplace');
                    } catch (e) {
                      console.error('[Delete] Failed to delete listing:', e);
                      alert('Failed to delete listing.');
                    }
                  }
                }}
                className="w-20 border border-red-100 text-red-500 text-sm font-medium rounded-full py-3 flex items-center justify-center hover:bg-red-50 active:scale-95 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-[52px] h-[52px] rounded-full border flex items-center justify-center shrink-0 active:scale-90 transition-all ${isWishlisted ? 'border-red-100 bg-red-50 text-red-400' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
              >
                <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button
                disabled={isSoldOut}
                onClick={handleAddToCart}
                className="h-[52px] px-6 border border-slate-100 bg-slate-50 text-slate-900 font-bold text-[13px] rounded-full flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-30"
              >
                <ShoppingCart size={16} />
                {isSoldOut ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                disabled={isSoldOut}
                onClick={() => router.push(`/marketplace/${id}/checkout`)}
                className="flex-1 h-[52px] bg-slate-900 text-white font-bold text-[13px] rounded-full flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-20 shadow-md shadow-slate-900/10"
              >
                {isSoldOut ? 'Sold Out' : 'Buy Now'}
                {!isSoldOut && <ArrowUpRight size={16} />}
              </button>
            </>
          )}
        </div>
      </footer>

      
    </main>
  );
}
/* ITEM DETAIL PAGE
   What: Shows full details of a single listing
   Shows: Item images, price, seller info, buyer reviews, buy button
   Data: items collection, Reviews collection
   Related: app/marketplace/[id]/edit/page.tsx, app/checkout/page.tsx
*/
