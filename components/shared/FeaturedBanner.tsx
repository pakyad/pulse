'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

export interface BannerSlide {
  id: string | number;
  tag?: string;
  headline: string;
  subline?: string;
  ctaText?: string;
  ctaPath: string;
  bgColor?: string;
}

interface FeaturedBannerProps {
  slides: BannerSlide[];
  autoAdvanceMs?: number;
  height?: string;
}

export default function FeaturedBanner({ slides, autoAdvanceMs = 6000, height = 'h-[220px]' }: FeaturedBannerProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const router = useRouter();

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex(prev => (prev + 1) % slides.length);
    }, autoAdvanceMs);
    return () => clearInterval(timer);
  }, [slides.length, autoAdvanceMs]);

  const goTo = (i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  if (!slides.length) return null;
  const slide = slides[index];

  return (
    <div className="relative">
      <div className={`relative ${height} rounded-[2.5rem] overflow-hidden shadow-xl shadow-black/5`}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col justify-end p-8"
            style={{ backgroundColor: slide.bgColor || '#4A5D23' }}
          >
            {/* Abstract Graphic Background (Overlapping Squares) */}
            <div className="absolute right-[-20px] top-[10%] pointer-events-none opacity-80 mix-blend-overlay">
               <motion.div 
                 animate={{ rotate: 15 }}
                 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                 className="absolute right-12 top-4 w-40 h-40 rounded-[2.5rem] bg-white/20 border border-white/30 backdrop-blur-sm"
               />
               <motion.div 
                 animate={{ rotate: -10 }}
                 transition={{ duration: 15, repeat: Infinity, ease: "linear", repeatType: "reverse" }}
                 className="absolute right-4 top-8 w-40 h-40 rounded-[2.5rem] bg-white/20 border border-white/30 backdrop-blur-md"
               />
               <motion.div 
                 animate={{ rotate: 5 }}
                 className="relative right-0 top-12 w-40 h-40 rounded-[2.5rem] bg-white/30 border border-white/40 backdrop-blur-lg flex items-center justify-center shadow-2xl"
               >
                  <div className="w-16 h-16 rounded-2xl border-2 border-white/40" />
               </motion.div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 flex items-end justify-between w-full">
               <div className="flex-1 pr-6">
                 <h2 className="text-white text-[24px] font-bold leading-tight tracking-tight mb-2">{slide.headline}</h2>
                 {slide.subline && <p className="text-white/70 text-[14px] font-medium leading-snug">{slide.subline}</p>}
               </div>
               
               {/* Square CTA Button */}
               <button
                 onClick={() => router.push(slide.ctaPath)}
                 className="shrink-0 w-16 h-16 bg-white rounded-2xl shadow-xl shadow-black/10 flex items-center justify-center active:scale-90 transition-all hover:bg-slate-50"
               >
                 <ArrowUpRight size={28} className="text-black" strokeWidth={2.5} />
               </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === index ? 'w-6 h-1.5 bg-black' : 'w-1.5 h-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
