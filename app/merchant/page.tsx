"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import DesktopMerchant from '@/components/merchant/DesktopMerchant';
import MobileMerchant from '@/components/merchant/MobileMerchant';
import ProofInspector from '@/components/merchant/ProofInspector';

export default function MerchantDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [merchant, setMerchant] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isProofOpen, setIsProofOpen] = useState(false);
  
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

  const toggleItemStatus = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, "items", itemId), { status: newStatus });
  };

  // ── SHARED ANALYTICS LOGIC ──
  const revenue = useMemo(() => orders.filter(o => ["DELIVERED", "COMPLETED", "READY_FOR_PICKUP"].includes(o.status)).reduce((s, o) => s + Number(o.price || 0), 0), [orders]);
  const activeOrdersList = orders.filter(o => ["PENDING_VENDOR", "PREPARING", "AWAITING_RUNNER", "IN_TRANSIT", "ON_THE_WAY"].includes(o.status));
  
  const urgentOrders = activeOrdersList.filter(o => o.status === 'PENDING_VENDOR');
  const preparingOrders = activeOrdersList.filter(o => o.status === 'PREPARING' || o.status === 'AWAITING_RUNNER');

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" /></div>;

  return (
    <>
      {isMobile ? (
        <MobileMerchant 
          merchant={merchant}
          revenue={revenue}
          activeOrdersCount={activeOrdersList.length}
          urgentOrders={urgentOrders}
          preparingOrders={preparingOrders}
          topItems={items.slice(0, 5)}
          recentOrders={orders.slice(0, 10)}
          handleAcceptOrder={handleAcceptOrder}
          handleCallRunner={handleCallRunner}
          toggleItemStatus={toggleItemStatus}
          onViewProof={(o: any) => { setSelectedOrder(o); setIsProofOpen(true); }}
        />
      ) : (
        <DesktopMerchant 
          merchant={merchant}
          revenue={revenue}
          activeOrdersCount={activeOrdersList.length}
          recentOrders={orders}
          handleAcceptOrder={handleAcceptOrder}
          handleCallRunner={handleCallRunner}
          onViewProof={(o: any) => { setSelectedOrder(o); setIsProofOpen(true); }}
        />
      )}

      <ProofInspector 
        isOpen={isProofOpen}
        onClose={() => setIsProofOpen(false)}
        order={selectedOrder}
      />
    </>
  );
}
