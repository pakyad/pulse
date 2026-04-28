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
  onClick?: () => void;
}

interface FeaturedBannerProps {
  slides: BannerSlide[];
  autoAdvanceMs?: number;
  height?: string;
}

export default function FeaturedBanner({ slides, autoAdvanceMs = 6000, height = 'h-[144px]' }: FeaturedBannerProps) {
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
      <div className={`relative ${height} rounded-3xl overflow-hidden shadow-sm`}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex flex-col justify-end p-6"
            style={{ backgroundColor: slide.bgColor || '#4A5D23' }}
          >
            {/* Minimalist Organic Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent opacity-40 pointer-events-none" />


            {/* Content Area */}
            <div className="relative z-10 flex items-end justify-between w-full">
               <div className="flex-1 pr-6">
                 <h2 className="text-white text-[20px] font-bold leading-tight tracking-tight mb-1">{slide.headline}</h2>
                 {slide.subline && <p className="text-white/80 text-[13px] font-medium leading-snug">{slide.subline}</p>}
               </div>
               
               {/* Square CTA Button */}
               <button
                 onClick={() => slide.onClick ? slide.onClick() : router.push(slide.ctaPath)}
                 className="shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center active:scale-90 transition-all hover:bg-slate-50"
               >
                 <ArrowUpRight size={20} className="text-black" strokeWidth={2} />
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
