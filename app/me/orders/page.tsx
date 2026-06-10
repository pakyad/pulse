"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MessageSquare, Bike, Package, Loader2 } from 'lucide-react';
import BackButton from '@/components/shared/BackButton';

type HistoryFilter = 'All' | 'Completed' | 'Cancelled';

const FINAL = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'ARRIVED'];

function SellingStatusBadge({ status }: { status: string }) {
  const s = (status || '').toUpperCase();
  if (s === 'CANCELLED')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-500">Cancelled</span>;
  if (s === 'DELIVERED' || s === 'COMPLETED')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[11px] font-bold text-emerald-600">Delivered</span>;
  if (s === 'PICKED_UP' || s === 'IN_TRANSIT' || s === 'ON_THE_WAY')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">On The Way</span>;
  if (s === 'READY_FOR_PICKUP' || s === 'AWAITING_RUNNER' || s === 'RUNNER_ASSIGNED')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-[11px] font-bold text-blue-600">Runner Assigned</span>;
  if (s === 'PENDING_VENDOR' || s === 'PAID')
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[11px] font-bold text-amber-700">Awaiting Runner</span>;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-[11px] font-bold text-amber-700">Awaiting Runner</span>
  );
}

function BuyingRow({ order, onClick, reviewedOrders }: { order: any; onClick: () => void; reviewedOrders: Set<string> }) {
  const dateStr = order.created_at?.toDate
    ? order.created_at.toDate().toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
    : '';
  const code = `#${(order.order_code || order.id.slice(0, 6)).toUpperCase()}`;

  const s = (order.status || '').toUpperCase();
  let statusBadge = <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />{s.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>;
  if (s === 'CANCELLED') statusBadge = <span className="flex items-center gap-1 text-[11px] font-bold text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-300" />Cancelled</span>;
  if (FINAL.includes(s) && s !== 'CANCELLED') statusBadge = <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Completed</span>;

  const isCompleted = FINAL.includes(s) && s !== 'CANCELLED';
  const isReviewed = reviewedOrders.has(order.id);

  return (
    <div className="py-3">
      <button onClick={onClick} className="w-full flex items-center justify-between py-4 px-2 -mx-2 rounded-xl text-left group hover:bg-slate-50 active:scale-95 transition-all">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-[14px] font-bold text-slate-900 truncate leading-snug">{order.title}</p>
          <p className="text-[11px] font-medium text-[#94a3b8] mt-0.5">{dateStr}  {code}</p>
        </div>
        <div className="shrink-0 text-right space-y-1">
          <p className="text-[14px] font-bold text-slate-900">RM {Number(order.price).toFixed(2)}</p>
          {statusBadge}
        </div>
      </button>
      {isCompleted && (
        <div className="px-2">
          {isReviewed ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500">
              Reviewed 
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-500 hover:text-blue-600 active:scale-95 transition-all"
            >
              Leave Review
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SellingCard({ order, userId, router }: { order: any; userId: string; router: any }) {
  const itemName = order.title || order.items?.[0]?.title || 'Item';
  const amount = Number(order.total || order.price || 0);
  const handoverNode = order.drop_off_location || 'Main Campus';
  const orderCode = `#${(order.order_code || order.id.slice(0, 6)).toUpperCase()}`;
  const thumbnail = order.image_url || order.items?.[0]?.image_url || '';
  const dateStr = order.created_at?.toDate
    ? order.created_at.toDate().toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
    : '';

  const hasRunner = !!order.runner_id;
  const [messaging, setMessaging] = useState(false);
  const [buyerName, setBuyerName] = useState(order.customer_name || order.buyer_name || '');

  useEffect(() => {
    if (buyerName) return;
    const fetchName = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', order.buyer_id));
        if (snap.exists()) {
          const d = snap.data();
          setBuyerName(d.fullName || d.full_name || d.name || 'Buyer');
        }
      } catch { setBuyerName('Buyer'); }
    };
    fetchName();
  }, [order.buyer_id, buyerName]);

  const handleMessageBuyer = async () => {
    setMessaging(true);
    try {
      if (order.conversationId) {
        router.push(`/messages/${order.conversationId}`);
        return;
      }

      const q = query(
        collection(db, 'chats'),
        where('orderId', '==', order.id),
        where('members', 'array-contains', userId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        router.push(`/messages/${snap.docs[0].id}`);
        return;
      }

      const sellerName = order.seller_name || 'Seller';
      const itemId = order.items?.[0]?.productId || order.order_id || '';
      const chatRef = doc(collection(db, 'chats'));
      const firstMessage = `Hi! I purchased your ${itemName}. Looking forward to receiving it! `;

      await setDoc(chatRef, {
        members: [order.seller_id, order.buyer_id],
        participant_names: {
          [order.seller_id]: sellerName,
          [order.buyer_id]: buyerName || 'Buyer',
        },
        type: 'MARKETPLACE',
        context_title: itemName,
        context_id: itemId,
        orderId: order.id,
        context: 'POST_PURCHASE',
        lastMessage: firstMessage,
        last_message_sender_id: order.buyer_id,
        updatedAt: serverTimestamp(),
        unread_count: 1,
      });

      await addDoc(collection(db, 'chats', chatRef.id, 'messages'), {
        senderId: order.buyer_id,
        text: firstMessage,
        createdAt: serverTimestamp(),
        isSystemMessage: true,
      });

      router.push(`/messages/${chatRef.id}`);
    } catch (e) {
      console.error('[MessageBuyer]', e);
    } finally {
      setMessaging(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
          {thumbnail ? (
            <img src={thumbnail} className="w-full h-full object-cover" alt={itemName} />
          ) : (
            <Package size={20} className="text-slate-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-slate-900 truncate leading-snug">{itemName}</p>
          <p className="text-[11px] font-medium text-[#94a3b8] mt-0.5">{dateStr}  {orderCode}</p>
          <p className="text-[12px] font-semibold text-[#94a3b8] mt-1">Buyer: {buyerName || 'Loading...'}</p>
        </div>
        <div className="shrink-0 text-right space-y-1.5">
          <p className="text-[14px] font-bold text-slate-900">RM {amount.toFixed(2)}</p>
          <SellingStatusBadge status={order.status} />
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
        <span className="text-[12px]"></span>
        <p className="text-[11px] font-bold text-amber-800">Drop at {handoverNode}</p>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleMessageBuyer}
          disabled={messaging}
          className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-900 flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-slate-100 disabled:opacity-50"
        >
          {messaging ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
          {messaging ? 'Opening...' : 'Message Buyer'}
        </button>
        {hasRunner && (
          <button
            onClick={() => router.push(`/messages/post_${order.seller_id}_${order.runner_id}_${order.id}`)}
            className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-900 flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-slate-100"
          >
            <Bike size={14} />
            Message Runner
          </button>
        )}
      </div>
    </div>
  );
}

export default function MyOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roleTab, setRoleTab] = useState<'Buying' | 'Selling'>('Buying');
  const [activeTab, setActiveTab] = useState<'Active' | 'History'>('Active');
  const [histFilter, setHistFilter] = useState<HistoryFilter>('All');
  const [buyingOrders, setBuyingOrders] = useState<any[]>([]);
  const [sellingOrders, setSellingOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unsubs: (() => void)[] = [];

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) { router.push('/auth'); return; }
      setUserId(user.uid);

      // Load reviewed order IDs so BuyingRow can show Leave Review / Reviewed 
      getDocs(query(collection(db, 'Reviews'), where('buyerId', '==', user.uid))).then((snap) => {
        setReviewedOrders(new Set(snap.docs.map(d => d.data().orderId)));
      }).catch(() => {});

      unsubs.push(onSnapshot(doc(db, 'users', user.uid), (snap) => {
        setProfile({ ...snap.data(), uid: user.uid });
      }));

      unsubs.push(onSnapshot(
        query(collection(db, 'orders'), where('buyer_id', '==', user.uid)),
        (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          docs.sort((a: any, b: any) => {
            const ta = a.created_at?.toMillis?.() ?? new Date(a.created_at).getTime();
            const tb = b.created_at?.toMillis?.() ?? new Date(b.created_at).getTime();
            return (tb || 0) - (ta || 0);
          });
          setBuyingOrders(docs);
          setLoading(false);
        },
        (err) => { console.error('[Buying]', err); setLoading(false); }
      ));

      unsubs.push(onSnapshot(
        query(collection(db, 'orders'), where('seller_id', '==', user.uid)),
        (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          docs.sort((a: any, b: any) => {
            const ta = a.created_at?.toMillis?.() ?? new Date(a.created_at).getTime();
            const tb = b.created_at?.toMillis?.() ?? new Date(b.created_at).getTime();
            return (tb || 0) - (ta || 0);
          });
          setSellingOrders(docs);
          setLoading(false);
        },
        (err) => { console.error('[Selling]', err); setLoading(false); }
      ));
    });

    return () => {
      unsubAuth();
      unsubs.forEach(u => u());
    };
  }, [router]);

  const activeBuying = buyingOrders.filter(o => !FINAL.includes((o.status || '').toUpperCase()));
  const historyBuying = buyingOrders.filter(o => {
    const s = (o.status || '').toUpperCase();
    if (!FINAL.includes(s)) return false;
    if (histFilter === 'Completed') return ['DELIVERED', 'COMPLETED', 'ARRIVED'].includes(s);
    if (histFilter === 'Cancelled') return s === 'CANCELLED';
    return true;
  });

  const activeSelling = sellingOrders.filter(o => !FINAL.includes((o.status || '').toUpperCase()));
  const historySelling = sellingOrders.filter(o => {
    const s = (o.status || '').toUpperCase();
    if (!FINAL.includes(s)) return false;
    if (histFilter === 'Completed') return ['DELIVERED', 'COMPLETED', 'ARRIVED'].includes(s);
    if (histFilter === 'Cancelled') return s === 'CANCELLED';
    return true;
  });

  const displayedBuying = activeTab === 'Active' ? activeBuying : historyBuying;
  const displayedSelling = activeTab === 'Active' ? activeSelling : historySelling;

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40">

      {/*  NAV  */}
      <nav className="fixed top-0 left-0 right-0 z-60 px-6 py-5 flex items-center gap-3 bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-100">
        <BackButton fallback="/marketplace" />
        <div>
          <p className="text-[14px] font-bold tracking-tight">
            {profile?.role === 'CLUB' ? 'Sales Registry' : 'My Orders'}
          </p>
          <p className="text-[11px] font-medium text-[#94a3b8]">
            {displayedBuying.length + displayedSelling.length} {activeTab.toLowerCase()}
          </p>
        </div>
      </nav>

      {/*  TABS & FILTERS CONTAINER  */}
      <div className="fixed top-[68px] left-0 right-0 z-50 bg-white border-b border-slate-100 pb-0">
        
        {/* Role Segmented Control */}
        <div className="px-6 pt-3 pb-2">
          <div className="flex p-1 bg-slate-100/80 rounded-xl">
            {(['Buying', 'Selling'] as const).map(role => (
              <button
                key={role}
                onClick={() => setRoleTab(role)}
                className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${
                  roleTab === role ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Active | History Tabs */}
        <div className="px-6 flex gap-6">
          {(['Active', 'History'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`relative py-3.5 text-[13px] font-bold transition-colors ${activeTab === t ? 'text-slate-900' : 'text-[#94a3b8]'}`}
            >
              {t}
              {activeTab === t && (
                <motion.div layoutId="orders-tab-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-900 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6" style={{ paddingTop: '174px' }}>
        {/* History sub-filters */}
        <AnimatePresence>
          {activeTab === 'History' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pb-4 pt-5">
                {(['All', 'Completed', 'Cancelled'] as HistoryFilter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setHistFilter(f)}
                    className={`h-[30px] px-3.5 rounded-full text-[12px] font-bold border-[0.5px] transition-all active:scale-95 ${
                      histFilter === f
                        ? 'bg-slate-50 border-slate-400 text-slate-900'
                        : 'bg-slate-50/50 border-slate-900/10 text-[#94a3b8]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic List Render based on roleTab */}
        <section className="py-2 pb-10">
          <AnimatePresence mode="wait">
            {roleTab === 'Buying' ? (
              <motion.div
                key="buying"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {displayedBuying.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-4 text-[#94a3b8]">
                    <ShoppingBag size={40} strokeWidth={1} className="text-slate-300" />
                    <p className="text-[12px] font-bold opacity-40">
                      {activeTab === 'Active' ? 'No active orders' : 'No history yet'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {displayedBuying.map(order => (
                      <BuyingRow
                        key={order.id}
                        order={order}
                        onClick={() => router.push(`/orders/${order.id}`)}
                        reviewedOrders={reviewedOrders}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="selling"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                {displayedSelling.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-4 text-[#94a3b8]">
                    <ShoppingBag size={40} strokeWidth={1} className="text-slate-300" />
                    <p className="text-[12px] font-bold opacity-40">
                      {activeTab === 'Active' ? 'No active sales' : 'No sales history'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedSelling.map(order => (
                      <SellingCard
                        key={order.id}
                        order={order}
                        userId={userId}
                        router={router}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </div>
    </main>
  );
}
