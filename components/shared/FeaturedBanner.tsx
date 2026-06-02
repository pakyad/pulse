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
  imageUrl?: string;
}

interface FeaturedBannerProps {
  slides: BannerSlide[];
  autoAdvanceMs?: number;
  height?: string;
}

export default function FeaturedBanner({ slides, autoAdvanceMs = 6000, height = 'h-[240px]' }: FeaturedBannerProps) {
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
      <div className={`relative ${height} rounded-[2.5rem] overflow-hidden shadow-md shadow-black/10 group`}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col justify-end p-9"
          >
            {/* Background Layer (Image or Neutral Template) */}
            <div className="absolute inset-0 z-0 overflow-hidden">
               {slide.imageUrl ? (
                 <>
                   <img 
                     src={slide.imageUrl} 
                     className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-[2s] ease-out" 
                     alt="" 
                     onError={(e) => {
                       e.currentTarget.style.display = 'none';
                       const parent = e.currentTarget.parentElement;
                       if (parent) parent.classList.add('is-fallback');
                     }}
                   />
                   {/* Deep Gradient Overlay for text readability */}
                   <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />
                 </>
               ) : null}

               {/* Neutral Mesh Template (Always present as fallback or background) */}
               <div className="absolute inset-0 z-[-1] bg-blue-600 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#334155_0%,transparent_50%),radial-gradient(circle_at_70%_70%,#111111_0%,transparent_50%)] opacity-60" />
                  
                  {/* Subtle Geometric Watermark for the Neutral Template */}
                  <div className="absolute right-[-100px] top-[-50px] opacity-[0.03] rotate-12 pointer-events-none">
                     <div className="w-[400px] h-[400px] border-40 border-white rounded-[80px]" />
                  </div>
                  <div className="absolute left-[-50px] bottom-[-100px] opacity-[0.02] -rotate-12 pointer-events-none">
                     <div className="w-[300px] h-[300px] border-30 border-white rounded-[60px]" />
                  </div>
               </div>
            </div>


            {/* Content Area */}
            <div className="relative z-10 flex items-end justify-between w-full">
               <div className="flex-1 pr-6">
                 {slide.tag && (
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest mb-3 border border-white/20 shadow-sm">
                      {slide.tag}
                    </span>
                 )}
                 <h2 className="text-white text-[28px] font-black leading-[1.1] tracking-tighter mb-2 drop-shadow-md">{slide.headline}</h2>
                 {slide.subline && <p className="text-white/80 text-[11px] font-bold leading-relaxed uppercase tracking-wide max-w-[85%] drop-shadow-sm">{slide.subline}</p>}
               </div>
               
               {/* Square CTA Button */}
               <button
                 onClick={() => router.push(slide.ctaPath)}
                 className="shrink-0 w-16 h-16 bg-white rounded-[22px] shadow-md shadow-black/20 flex items-center justify-center active:scale-95 transition-all hover:bg-slate-50 border border-white/40"
               >
                 <ArrowUpRight size={28} className="text-black" strokeWidth={3} />
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
