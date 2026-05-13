"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import DesktopMerchant from '@/components/merchant/DesktopMerchant';
import MobileMerchant from '@/components/merchant/MobileMerchant';
import ProofInspector from '@/components/merchant/ProofInspector';
import PriceAppealModal from '@/components/merchant/PriceAppealModal';

export default function MerchantDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [merchant, setMerchant] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isProofOpen, setIsProofOpen] = useState(false);
  const [selectedFlaggedItem, setSelectedFlaggedItem] = useState<any>(null);
  
  // Smart Window Hook
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let unsubItems: (() => void) | null = null;
    let unsubOrders: (() => void) | null = null;

    // Check Auth & Fetch Data
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      // Cleanup previous
      if (unsubItems) unsubItems();
      if (unsubOrders) unsubOrders();

      if (!user) { router.push("/auth"); return; }
      
      const snap = await getDoc(doc(db, "users", user.uid));
      const userData = snap.data();
      setMerchant(snap.exists() ? { ...userData, uid: user.uid } : { full_name: user.displayName || "Pulse Vendor", uid: user.uid });
      
      // 🏛️ Pulse Institutional Repair: Force-align orphan assets
      if (userData?.role === 'CLUB' || userData?.is_verified_merchant) {
        console.log("🏛️ Registry Repair Initiated for Merchant:", user.uid);
        const { seedKelabBolaItems } = await import('@/lib/utils/seed-kelab-bola');
        const { seedSEClubItems } = await import('@/lib/utils/seed-se-club');
        
        if (user.email?.includes('kelabbola') || user.email?.includes('kelab-bola')) {
          await seedKelabBolaItems(user.uid);
        } else if (user.email?.includes('se-club')) {
          await seedSEClubItems(user.uid);
        }
      }
      
      unsubItems = onSnapshot(query(collection(db, "items"), where("seller_id", "==", user.uid)), 
        (s) => setItems(s.docs.map(d => ({ id: d.id, ...d.data() }))));

      unsubOrders = onSnapshot(query(collection(db, "orders"), where("seller_id", "==", user.uid)), (s) => {
        setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setLoading(false);
      });
    });

    // Handle Resize
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      unsubAuth();
      if (unsubItems) unsubItems();
      if (unsubOrders) unsubOrders();
      window.removeEventListener('resize', handleResize);
    };
  }, [router]);

  // 🏛️ REQ_L101: THE LOGISTICS BRIDGE
  // Transitions order from Merchant Prep to Runner Radar
  const handleAcceptOrder = async (orderId: string) => {
    await updateDoc(doc(db, "orders", orderId), { 
      status: "PREPARING",
      accepted_at: serverTimestamp() 
    });
  };

  const handleCallRunner = async (orderId: string) => {
    // Exact status match for @/app/run/terminal/page.tsx radar query
    await updateDoc(doc(db, "orders", orderId), { 
      status: "AWAITING_RUNNER",
      delivery_type: "RUNNER", // Force-align with logistics schema
      ready_at: serverTimestamp() 
    });
    alert("Institutional Logistics: Order is now visible to the Runner Radar.");
  };

  const handleConfirmDelivery = async (orderId: string) => {
    if (!navigator.geolocation) {
      alert("Institutional Location Services Required.");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        
        // Option B: Direct Firestore Write (Bypassing Undeployed Cloud Function)
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        
        if (!orderSnap.exists()) {
          alert("Order not found.");
          return;
        }

        const orderData = orderSnap.data();
        const handshake = orderData.handshake || {};

        handshake.seller_confirmed = true;
        handshake.seller_coords = coords;

        let newStatus = orderData.status;

        // If buyer already confirmed, we run the proximity check
        if (handshake.buyer_confirmed && handshake.buyer_coords) {
          const R = 6371e3; // metres
          const φ1 = coords.lat * Math.PI/180;
          const φ2 = handshake.buyer_coords.lat * Math.PI/180;
          const Δφ = (handshake.buyer_coords.lat - coords.lat) * Math.PI/180;
          const Δλ = (handshake.buyer_coords.lng - coords.lng) * Math.PI/180;

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
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

        alert("Institutional Confirmation Sent. Waiting for buyer receipt.");
      } catch (e) {
        console.error(e);
        alert("Handshake Transmission Failed.");
      }
    }, (err) => {
      alert("Location Access Denied. Handshake cannot be institutionalized.");
    });
  };

  const toggleItemStatus = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, "items", itemId), { status: newStatus });
  };

  // ── SHARED ANALYTICS LOGIC ──
  const revenue = useMemo(() => orders.filter(o => ["DELIVERED", "COMPLETED", "READY_FOR_PICKUP"].includes(o.status)).reduce((s, o) => s + Number(o.price || 0), 0), [orders]);
  const activeOrdersList = orders.filter(o => ["PENDING_VENDOR", "PREPARING", "AWAITING_RUNNER", "READY_FOR_PICKUP"].includes(o.status));
  
  const incomingOrders = activeOrdersList.filter(o => o.status === 'PENDING_VENDOR' && !o.runner_id);
  const urgentOrders = activeOrdersList.filter(o => o.status === 'PENDING_VENDOR');
  const preparingOrders = activeOrdersList.filter(o => ['PREPARING', 'READY_FOR_PICKUP'].includes(o.status));
  const historyOrders = orders.filter(o => ['PICKED_UP', 'IN_TRANSIT', 'ON_THE_WAY', 'DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.status)).slice(0, 20);

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" /></div>;

  return (
    <>
      {isMobile ? (
        <MobileMerchant 
          merchant={merchant}
          revenue={revenue}
          activeOrdersCount={activeOrdersList.length}
          incomingOrders={incomingOrders}
          urgentOrders={urgentOrders}
          preparingOrders={preparingOrders}
          historyOrders={historyOrders}
          topItems={items.slice(0, 5)}
          recentOrders={orders.slice(0, 10)}
          handleAcceptOrder={handleAcceptOrder}
          handleCallRunner={handleCallRunner}
          handleConfirmDelivery={handleConfirmDelivery}
          toggleItemStatus={toggleItemStatus}
          onViewProof={(o: any) => { setSelectedOrder(o); setIsProofOpen(true); }}
        />
      ) : (
        <DesktopMerchant 
          merchant={merchant}
          revenue={revenue}
          activeOrdersCount={activeOrdersList.length}
          recentOrders={orders}
          items={items}
          handleAcceptOrder={handleAcceptOrder}
          handleCallRunner={handleCallRunner}
          handleConfirmDelivery={handleConfirmDelivery}
          toggleItemStatus={toggleItemStatus}
          onViewProof={(o: any) => { setSelectedOrder(o); setIsProofOpen(true); }}
        />
      )}

      <ProofInspector 
        isOpen={isProofOpen}
        onClose={() => setIsProofOpen(false)}
        order={selectedOrder}
      />

      <PriceAppealModal 
        isOpen={!!selectedFlaggedItem}
        onClose={() => setSelectedFlaggedItem(null)}
        item={selectedFlaggedItem}
      />
    </>
  );
}
