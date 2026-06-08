"use client";
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import DesktopMerchant from '@/components/merchant/DesktopMerchant';
import ProofInspector from '@/components/merchant/ProofInspector';

function MerchantDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [merchant, setMerchant] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isProofOpen, setIsProofOpen] = useState(false);
  
  const [activeSection, setActiveSection] = useState<'overview' | 'products' | 'settings' | 'log'>('overview');

  useEffect(() => {
    const section = searchParams.get('section');
    if (section && ['overview', 'products', 'settings', 'log'].includes(section)) {
      setActiveSection(section as any);
    }
  }, [searchParams]);

  useEffect(() => {
    let unsubItems: (() => void) | null = null;
    let unsubOrders: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (unsubItems) unsubItems();
      if (unsubOrders) unsubOrders();

      if (!user) { router.push("/auth"); return; }
      
      const snap = await getDoc(doc(db, "users", user.uid));
      const userData = snap.data();
      if (userData?.role !== 'CLUB' && !userData?.is_verified_merchant) {
        router.push('/home');
        return;
      }
      setMerchant(snap.exists() ? { ...userData, uid: user.uid } : { full_name: user.displayName || "Pulse Vendor", uid: user.uid });
      
      unsubItems = onSnapshot(query(collection(db, "items"), where("seller_id", "==", user.uid)), 
        (s) => setItems(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
          const timeA = a.created_at?.seconds || Date.now();
          const timeB = b.created_at?.seconds || Date.now();
          return timeB - timeA;
        })));

      unsubOrders = onSnapshot(query(collection(db, "orders"), where("seller_id", "==", user.uid)), (s) => {
        setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsubItems) unsubItems();
      if (unsubOrders) unsubOrders();
    };
  }, [router]);

  const handleAcceptOrder = async (orderId: string) => {
    await updateDoc(doc(db, "orders", orderId), { 
      status: "PREPARING",
      accepted_at: serverTimestamp() 
    });
  };

  const handleCallRunner = async (orderId: string) => {
    await updateDoc(doc(db, "orders", orderId), { 
      status: "PENDING_RUNNER",
      delivery_type: "RUNNER",
      ready_at: serverTimestamp() 
    });
  };

  const handleConfirmDelivery = async (orderId: string) => {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (!orderSnap.exists()) return;

        const orderData = orderSnap.data();
        const handshake = orderData.handshake || {};

        handshake.seller_confirmed = true;
        handshake.seller_coords = coords;

        let newStatus = orderData.status;

        if (handshake.buyer_confirmed && handshake.buyer_coords) {
          const R = 6371e3;
          const phi1 = coords.lat * Math.PI/180;
          const phi2 = handshake.buyer_coords.lat * Math.PI/180;
          const deltaPhi = (handshake.buyer_coords.lat - coords.lat) * Math.PI/180;
          const deltaLambda = (handshake.buyer_coords.lng - coords.lng) * Math.PI/180;
          const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const dist = R * c;
          handshake.distance = dist;
          const isSafe = dist <= 50;
          handshake.verification_type = isSafe ? 'IN_PERSON_SAFE' : 'REMOTE';
          newStatus = isSafe ? 'COMPLETED' : 'DELIVERED';
        }

        await updateDoc(orderRef, { 
          handshake,
          ...(newStatus !== orderData.status ? { status: newStatus, completed_at: serverTimestamp(), auto_adjudicated: newStatus === 'COMPLETED' } : {})
        });
      } catch (e) {
        console.error("[Merchant] Confirm delivery error:", e);
      }
    });
  };

  const toggleItemStatus = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'PAUSED' : 'ACTIVE';
    await updateDoc(doc(db, "items", itemId), { status: newStatus });
  };

  const revenue = useMemo(() => orders.filter(o => ["DELIVERED", "COMPLETED", "READY_FOR_PICKUP", "READY"].includes(o.status)).reduce((s, o) => s + Number(o.total || o.price || 0), 0), [orders]);
  
  const pipelineOrders = useMemo(() => orders.filter(o => 
    o.seller_id === merchant?.uid && 
    !["DELIVERED", "CANCELLED", "COMPLETED"].includes(o.status)
  ), [orders, merchant?.uid]);

  const completedOrders = useMemo(() => orders.filter(o => 
    ["DELIVERED", "COMPLETED"].includes(o.status)
  ).slice(0, 50), [orders]);

  const handlePrepareOrder = async (orderId: string, items: any[]) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { 
        status: "PREPARING",
        prepared_at: serverTimestamp() 
      });
    } catch (e) {
      console.error("Prepare order error:", e);
      alert("Failed to prepare order.");
    }
  };

  const handleMarkReady = async (orderId: string) => {
    await updateDoc(doc(db, "orders", orderId), { 
      status: "READY",
      ready_at: serverTimestamp() 
    });
  };

  const handleMessageUser = async (orderId: string, targetId: string, targetName: string, type: 'BUYER' | 'RUNNER', itemName?: string, handoverNode?: string) => {
    if (!merchant?.uid) return;
    
    const chatId = `post_${merchant.uid}_${targetId}_${orderId}`;
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      const message = type === 'BUYER' 
        ? `Hi! Thank you for your order of ${itemName} (Order #${orderId.slice(0,8).toUpperCase()}).`
        : `Hi ${targetName}, your pickup for Order #${orderId.slice(0,8).toUpperCase()} is ready at ${handoverNode || 'the handover point'}.`;

      const { setDoc, collection, addDoc } = await import('firebase/firestore');
      await setDoc(chatRef, {
        members: [merchant.uid, targetId],
        participant_names: {
          [merchant.uid]: merchant.full_name,
          [targetId]: targetName,
        },
        type: "MARKETPLACE",
        orderId: orderId,
        lastMessage: message,
        last_message_sender_id: merchant.uid,
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(chatRef, "messages"), {
        senderId: merchant.uid,
        text: message,
        createdAt: serverTimestamp(),
      });
    }

    router.push(`/messages?chatId=${chatId}`);
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" /></div>;

  return (
    <>
      <DesktopMerchant 
        merchant={merchant}
        revenue={revenue}
        activeOrdersCount={pipelineOrders.length}
        pipelineOrders={pipelineOrders}
        completedOrders={completedOrders}
        items={items}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleAcceptOrder={handleAcceptOrder}
        handlePrepareOrder={handlePrepareOrder}
        handleMarkReady={handleMarkReady}
        handleMessageUser={handleMessageUser}
        handleCallRunner={handleCallRunner}
        handleConfirmDelivery={handleConfirmDelivery}
        toggleItemStatus={toggleItemStatus}
        onViewProof={(o: any) => { setSelectedOrder(o); setIsProofOpen(true); }}
      />

      <ProofInspector 
        isOpen={isProofOpen}
        onClose={() => setIsProofOpen(false)}
        order={selectedOrder}
      />
    </>
  );
}

export default function MerchantDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" /></div>}>
      <MerchantDashboardContent />
    </Suspense>
  );
}
