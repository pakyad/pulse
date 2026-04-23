'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export interface BannerSlide {
  id: string | number;
  tag: string;
  headline: string;
  subline?: string;
  ctaText: string;
  ctaPath: string;
  img: string;
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
      <div className={`relative ${height} rounded-[2.5rem] overflow-hidden shadow-xl shadow-navy/10`}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ x: direction * 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -50, opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <img src={slide.img} className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1E]/90 via-[#0A0F1E]/30 to-transparent" />
            <div className="absolute inset-0 p-7 flex flex-col justify-between">
              <span className="self-start px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-[0.2em] border border-white/10">
                {slide.tag}
              </span>
              <div className="space-y-3">
                <div>
                  <h2 className="text-white text-[21px] font-bold leading-tight tracking-tight">{slide.headline}</h2>
                  {slide.subline && <p className="text-white/50 text-[12px] font-medium mt-1 leading-snug">{slide.subline}</p>}
                </div>
                <button
                  onClick={() => router.push(slide.ctaPath)}
                  className="self-start px-6 py-2.5 bg-white text-navy text-[12px] font-bold rounded-full shadow-xl shadow-black/20 active:scale-95 transition-all"
                >
                  {slide.ctaText}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === index ? 'w-5 h-1.5 bg-navy' : 'w-1.5 h-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
