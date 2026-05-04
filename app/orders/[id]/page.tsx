"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function EdgeToEdgeOrderStatus() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (unsub) unsub();
        router.push('/auth');
        return;
      }
      
      const txRef = doc(db, 'orders', id as string);
      unsub = onSnapshot(txRef, (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      });
    });

    return () => {
      unsubAuth();
      if (unsub) unsub();
    };
  }, [id, router]);

  if (loading) return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
      <div className="w-8 h-8 border-[1.5px] border-[#F2F2F7] border-t-teal-500 rounded-full animate-spin" />
    </div>
  );

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans">
        <div className="bg-[#FFFFFF] sticky top-0 z-20 px-5 py-4 flex items-center justify-between border-b-[0.5px] border-[#E5E5EA]">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-[#1C1C1E] hover:bg-[#F2F2F7] rounded-full transition-colors active:scale-95">
            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.41px]">Order Status</h1>
          <button className="text-[15px] font-semibold text-teal-600 px-2 py-1 rounded-md active:opacity-70 transition-opacity">
            Help
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-[20px] font-bold text-[#1C1C1E] mb-2 tracking-tight">Order Not Found</h2>
          <p className="text-[15px] text-[#8E8E93] font-medium">We couldn't find this specific order.</p>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING': 
      case 'PENDING_VENDOR':
        return { phase: 1, title: 'Waiting for seller to accept', subtext: 'We have notified the seller about your order.' };
      case 'PREPARING': 
      case 'PACKED':
      case 'CONFIRMED':
        return { phase: 2, title: 'Seller is preparing your order', subtext: 'Your item is being packed and prepared.' };
      case 'AWAITING_RUNNER': 
        return { phase: 3, title: 'Waiting for runner to accept', subtext: 'Seller is preparing your order.' };
      case 'ON_THE_WAY': 
      case 'DELIVERING':
        return { phase: 4, title: 'Runner heading to seller', subtext: 'Runner is on the way to pick up the item.' };
      case 'READY_FOR_PICKUP': 
      case 'PICKED_UP':
        return { phase: 5, title: 'Order Picked Up', subtext: 'Runner is heading to your delivery location.' };
      case 'COMPLETED': 
      case 'ARRIVED':
        return { phase: 6, title: 'Delivered', subtext: 'Your order has been successfully delivered.' };
      default: 
        return { phase: 1, title: 'Processing...', subtext: 'Please wait.' };
    }
  };

  const { phase, title, subtext } = getStatusInfo(order.status);

  const formatTime = (dateObj: any) => {
    if (!dateObj) return '';
    try {
      const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch(e) { return ''; }
  };

  const orderTime = formatTime(order.created_at) || "10:00 AM";
  const acceptedTime = phase >= 2 ? (formatTime(order.updated_at) || "10:05 AM") : "";

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans pb-24 selection:bg-teal-100">
      {/* Top App Bar */}
      <div className="bg-[#FFFFFF] sticky top-0 z-20 px-5 py-4 flex items-center justify-between border-b-[0.5px] border-[#E5E5EA]">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-[#1C1C1E] hover:bg-[#F2F2F7] rounded-full transition-colors active:scale-95">
          <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-[17px] font-semibold text-[#1C1C1E] tracking-[-0.41px]">Order Status</h1>
        <button className="text-[15px] font-semibold text-teal-600 px-2 py-1 rounded-md active:opacity-70 transition-opacity">
          Help
        </button>
      </div>

      {/* Section 1: Live Status Hero */}
      <div className="px-5 py-8 border-b-[0.5px] border-[#E5E5EA]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>
          <span className="text-[13px] font-bold text-teal-600 tracking-[0.08em] uppercase">Live Tracking</span>
        </div>
        <h2 className="text-[28px] font-bold text-[#1C1C1E] tracking-tight leading-[1.1]">{title}</h2>
        <p className="text-[#8E8E93] mt-[6px] text-[15px] font-medium leading-relaxed">{subtext}</p>
      </div>

      {/* Section 2: Vertical Tracking Timeline */}
      <div className="px-5 py-8 border-b-[0.5px] border-[#E5E5EA]">
        <div className="relative">
          {/* Vertical Track Line */}
          <div className="absolute left-[11.5px] top-3 bottom-8 w-[1px] bg-[#E5E5EA]"></div>

          {/* Step 1: Order Placed */}
          <div className="relative flex items-start gap-4 mb-8">
            <div className="relative z-10 w-[24px] flex justify-center mt-[3px] bg-[#FFFFFF] py-1">
              <div className="w-[8px] h-[8px] rounded-full bg-[#C7C7CC]"></div>
            </div>
            <div className="flex-1 flex justify-between items-start">
              <p className={`text-[15px] ${phase === 1 ? 'font-bold text-[#1C1C1E]' : 'font-medium text-[#8E8E93]'}`}>Order Placed</p>
              <p className="text-[13px] text-[#AEAEB2] font-medium mt-[2px]">{orderTime}</p>
            </div>
          </div>

          {/* Step 2: Seller Accepted */}
          <div className="relative flex items-start gap-4 mb-8">
            <div className="relative z-10 w-[24px] flex justify-center mt-[3px] bg-[#FFFFFF] py-1">
              <div className={`w-[8px] h-[8px] rounded-full ${phase >= 2 ? 'bg-[#C7C7CC]' : 'border-[1.5px] border-[#E5E5EA] bg-[#FFFFFF]'}`}></div>
            </div>
            <div className="flex-1 flex justify-between items-start">
              <p className={`text-[15px] ${phase === 2 ? 'font-bold text-[#1C1C1E]' : 'font-medium text-[#8E8E93]'}`}>Seller Accepted</p>
              {phase >= 2 && <p className="text-[13px] text-[#AEAEB2] font-medium mt-[2px]">{acceptedTime}</p>}
            </div>
          </div>

          {/* Step 3: Waiting for Runner */}
          <div className="relative flex items-start gap-4 mb-8">
            <div className="relative z-10 w-[24px] flex justify-center mt-[1px] bg-[#FFFFFF] py-[2px]">
              {phase === 3 ? (
                <div className="w-[14px] h-[14px] rounded-full bg-[#FFFFFF] border-[3.5px] border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.3)]"></div>
              ) : phase > 3 ? (
                <div className="w-[8px] h-[8px] rounded-full bg-[#C7C7CC] mt-[2px]"></div>
              ) : (
                <div className="w-[8px] h-[8px] rounded-full border-[1.5px] border-[#E5E5EA] bg-[#FFFFFF] mt-[2px]"></div>
              )}
            </div>
            <div className="flex-1 flex justify-between items-start">
              <p className={phase === 3 ? 'text-[17px] font-bold text-[#1C1C1E] tracking-tight leading-none' : 'text-[15px] font-medium text-[#8E8E93] leading-none'}>Waiting for Runner</p>
            </div>
          </div>

          {/* Step 4: Runner Heading to Seller */}
          <div className="relative flex items-start gap-4 mb-8">
            <div className="relative z-10 w-[24px] flex justify-center mt-[1px] bg-[#FFFFFF] py-[2px]">
              {phase === 4 ? (
                <div className="w-[14px] h-[14px] rounded-full bg-[#FFFFFF] border-[3.5px] border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.3)]"></div>
              ) : phase > 4 ? (
                <div className="w-[8px] h-[8px] rounded-full bg-[#C7C7CC] mt-[2px]"></div>
              ) : (
                <div className="w-[8px] h-[8px] rounded-full border-[1.5px] border-[#E5E5EA] bg-[#FFFFFF] mt-[2px]"></div>
              )}
            </div>
            <div className="flex-1 flex justify-between items-start">
              <p className={phase === 4 ? 'text-[17px] font-bold text-[#1C1C1E] tracking-tight leading-none' : 'text-[15px] font-medium text-[#8E8E93] leading-none'}>Runner Heading to Seller</p>
            </div>
          </div>

          {/* Step 5: Order Picked Up */}
          <div className="relative flex items-start gap-4 mb-8">
            <div className="relative z-10 w-[24px] flex justify-center mt-[1px] bg-[#FFFFFF] py-[2px]">
              {phase === 5 ? (
                <div className="w-[14px] h-[14px] rounded-full bg-[#FFFFFF] border-[3.5px] border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.3)]"></div>
              ) : phase > 5 ? (
                <div className="w-[8px] h-[8px] rounded-full bg-[#C7C7CC] mt-[2px]"></div>
              ) : (
                <div className="w-[8px] h-[8px] rounded-full border-[1.5px] border-[#E5E5EA] bg-[#FFFFFF] mt-[2px]"></div>
              )}
            </div>
            <div className="flex-1 flex justify-between items-start">
              <p className={phase === 5 ? 'text-[17px] font-bold text-[#1C1C1E] tracking-tight leading-none' : 'text-[15px] font-medium text-[#8E8E93] leading-none'}>Order Picked Up</p>
            </div>
          </div>

          {/* Step 6: Delivered */}
          <div className="relative flex items-start gap-4">
            <div className="relative z-10 w-[24px] flex justify-center mt-[1px] bg-[#FFFFFF] py-[2px]">
              {phase === 6 ? (
                <div className="w-[14px] h-[14px] rounded-full bg-[#FFFFFF] border-[3.5px] border-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.3)]"></div>
              ) : (
                <div className="w-[8px] h-[8px] rounded-full border-[1.5px] border-[#E5E5EA] bg-[#FFFFFF] mt-[2px]"></div>
              )}
            </div>
            <div className="flex-1 flex justify-between items-start">
              <p className={phase === 6 ? 'text-[17px] font-bold text-[#1C1C1E] tracking-tight leading-none' : 'text-[15px] font-medium text-[#8E8E93] leading-none'}>Delivered</p>
            </div>
          </div>

        </div>
      </div>

      {/* Section 3: Item & Seller Details */}
      <div className="px-5 py-5 border-b-[0.5px] border-[#E5E5EA] flex items-center justify-between group active:bg-[#F2F2F7] transition-colors cursor-pointer">
        <div className="flex items-center gap-[14px]">
          <div className="w-[52px] h-[52px] bg-[#F2F2F7] rounded-[14px] border-[0.5px] border-[#E5E5EA] flex items-center justify-center overflow-hidden shrink-0">
             {order.image_url ? (
               <img src={order.image_url} alt={order.title} className="w-full h-full object-cover" />
             ) : (
               <svg className="w-6 h-6 text-[#C7C7CC]" fill="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#1C1C1E] text-[17px] tracking-[-0.41px] truncate">{order.title || 'MIDI Canvas Tote Bag'}</h3>
            <p className="text-[14px] font-medium text-[#8E8E93] mt-[2px] truncate">{order.seller_name || 'Pulse Official'}</p>
          </div>
        </div>
        <svg className="w-[20px] h-[20px] text-[#C7C7CC] ml-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
      </div>

      {/* Section 4: Delivery Details */}
      <div className="px-5 py-6 border-b-[0.5px] border-[#E5E5EA] flex items-start gap-4">
         <div className="shrink-0 mt-[2px]">
            <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center">
                <svg className="w-[18px] h-[18px] text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
         </div>
         <div className="flex-1">
             <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-[0.08em] mb-[4px]">Delivery to</p>
             <p className="text-[15px] font-semibold text-[#1C1C1E] leading-snug pr-4">{order.drop_off_location || 'Bus Stop A — Near main road'}</p>
         </div>
      </div>

      {/* Section 5: Order Summary */}
      <div className="px-5 py-6 flex justify-between items-center bg-[#FDFDFD]">
          <span className="text-[15px] font-medium text-[#8E8E93]">Order ID</span>
          <div className="flex items-center gap-2">
              <span className="font-semibold text-[#1C1C1E] text-[15px] uppercase tracking-wide">#{order.order_code || order.id.substring(0, 6)}</span>
              <button className="text-[#8E8E93] hover:text-[#1C1C1E] transition-colors p-[6px] -mr-2 rounded-full active:bg-[#F2F2F7]" onClick={() => navigator.clipboard.writeText(order.order_code || order.id)}>
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
          </div>
      </div>

    </div>
  );
}
