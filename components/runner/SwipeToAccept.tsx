"use client";

import React, { useState, useRef, useEffect } from 'react';

interface SwipeToAcceptProps {
  onSuccess: () => void;
  loading?: boolean;
  defaultText?: string;
  successText?: string;
}

export default function SwipeToAccept({ 
  onSuccess, 
  loading = false,
  defaultText = "SWIPE TO ACCEPT",
  successText = "ACCEPTED ✓"
}: SwipeToAcceptProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSuccess || loading) return;
    setIsDragging(true);
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !trackRef.current || !thumbRef.current) return;
      
      const trackRect = trackRef.current.getBoundingClientRect();
      const thumbWidth = thumbRef.current.offsetWidth;
      const maxDrag = trackRect.width - thumbWidth - 8; // 4px padding on both sides (left-1)
      
      let newX = e.clientX - trackRect.left - (thumbWidth / 2);
      newX = Math.max(0, Math.min(newX, maxDrag));
      
      setDragX(newX);
    };

    const handlePointerUp = () => {
      if (!isDragging || !trackRef.current || !thumbRef.current) return;
      
      setIsDragging(false);
      
      const trackRect = trackRef.current.getBoundingClientRect();
      const thumbWidth = thumbRef.current.offsetWidth;
      const maxDrag = trackRect.width - thumbWidth - 8;

      if (dragX > maxDrag * 0.8) {
        setDragX(maxDrag);
        setIsSuccess(true);
        onSuccess();
      } else {
        setDragX(0); // Snap back
      }
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, dragX, onSuccess]);

  return (
    <div 
      ref={trackRef}
      className={`relative w-full h-14 rounded-full flex items-center justify-center overflow-hidden shadow-lg transition-colors duration-300 mt-4 ${isSuccess ? 'bg-emerald-500' : 'bg-neutral-900'}`}
      style={{ touchAction: 'none' }}
    >
      <div 
        className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none"
        style={{ opacity: isSuccess ? 1 : Math.max(0, 1 - (dragX / 100)) }}
      >
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isSuccess ? 'text-white' : 'text-neutral-400'}`}>
          {loading ? (
             <div className="w-5 h-5 border-[2px] border-white border-t-transparent rounded-full animate-spin"></div>
          ) : isSuccess ? successText : defaultText}
        </span>
      </div>

      {!isSuccess && !loading && (
         <div 
           ref={thumbRef}
           onPointerDown={handlePointerDown}
           className="absolute left-1 top-1 bottom-1 w-12 bg-white rounded-full flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing z-10 transition-transform"
           style={{ 
             transform: `translateX(${dragX}px)`,
             transition: isDragging ? 'none' : 'transform 0.3s ease-out'
           }}
         >
           <svg className="w-6 h-6 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
           </svg>
         </div>
      )}
    </div>
  );
}
