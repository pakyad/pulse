"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';

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
      setMerchant(snap.exists() ? { ...snap.data(), uid: user.uid } : { full_name: user.displayName || "Pulse Vendor", uid: user.uid });
      
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

  // Shared Logic
  const revenue = useMemo(() => orders.filter(o => ["DELIVERED", "COMPLETED", "READY_FOR_PICKUP"].includes(o.status)).reduce((s, o) => s + Number(o.price || 0), 0), [orders]);
  const activeOrdersList = orders.filter(o => ["PENDING", "PREPARING", "PACKED", "AWAITING_RUNNER", "ON_THE_WAY", "PENDING_VENDOR"].includes(o.status));
  const activeOrdersCount = activeOrdersList.length;
  const attentionCount = activeOrdersList.filter(o => o.status === 'PENDING' || o.status === 'PENDING_VENDOR').length;
  
  const urgentOrders = activeOrdersList.filter(o => o.status === 'PENDING' || o.status === 'PENDING_VENDOR').slice(0, 2);
  const recentOrders = orders.slice(0, 3);
  const topItems = items.slice(0, 2);

  const handleAcceptOrder = async (orderId: string) => {
    await updateDoc(doc(db, "orders", orderId), { status: "PREPARING" });
  };

  const toggleItemStatus = async (itemId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await updateDoc(doc(db, "items", itemId), { status: newStatus });
  };

  const handleViewProof = (order: any) => {
    setSelectedOrder(order);
    setIsProofOpen(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
      <div className="w-8 h-8 border-[1.5px] border-[#F2F2F7] border-t-[#1C1C1E] rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {isMobile ? (
        <MobileMerchant 
          merchant={merchant}
          revenue={revenue}
          activeOrdersCount={activeOrdersCount}
          urgentOrders={urgentOrders}
          topItems={topItems}
          recentOrders={recentOrders}
          handleAcceptOrder={handleAcceptOrder}
          toggleItemStatus={toggleItemStatus}
          onViewProof={handleViewProof}
        />
      ) : (
        <DesktopMerchant 
          merchant={merchant}
          revenue={revenue}
          activeOrdersCount={activeOrdersCount}
          attentionCount={attentionCount}
          recentOrders={recentOrders}
          onViewProof={handleViewProof}
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
