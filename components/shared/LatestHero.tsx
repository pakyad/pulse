"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "Join the Pulse Mission Team.",
    desc: "Deliver for UniKL. High-quality student courier protocol.",
    cta: "Apply Now",
    bg: "#0A0F1E",
    img: "https://images.unsplash.com/photo-1626228067612-959247e73235?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Pulse Rewards are Live.",
    desc: "Earn XP for every local purchase and mission completed.",
    cta: "View Rewards",
    bg: "#111827",
    img: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=1000&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "New Vendor: MIIT Snacks",
    desc: "Fresh deliveries from the 4th floor directly to your lab.",
    cta: "Order Now",
    bg: "#050A14",
    img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop"
  }
];

const LatestHero = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const dragX = useMotionValue(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const onDragEnd = () => {
    const x = dragX.get();
    if (x <= -50) setActiveSlide((prev) => (prev + 1) % slides.length);
    else if (x >= 50) setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
    dragX.set(0); 
  };

  return (
    <section className="px-4">
      <div className="flex justify-between items-center px-4 mb-6">
        <h2 className="text-xl font-bold text-navy tracking-tight">Latest</h2>
        <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <ChevronRight size={20} className="text-navy" />
        </button>
      </div>

      <div className="relative h-64 w-full rounded-[3rem] overflow-hidden bg-[#0A0F1E] shadow-md border border-white/5 isolate">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeSlide}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x: dragX }}
            onDragEnd={onDragEnd}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing rounded-[inherit] overflow-hidden"
          >
            <img 
              src={slides[activeSlide].img} 
              className="absolute inset-0 w-full h-full object-cover opacity-50 scale-110" 
              alt="Hero" 
            />
            <div className="absolute inset-0 p-10 flex flex-col justify-center">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.2 }} 
                className="text-[26px] font-bold text-white leading-tight mb-3 max-w-[220px]"
              >
                {slides[activeSlide].title}
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.3 }} 
                className="text-slate-200 text-[14px] mb-8 leading-snug max-w-[240px] font-medium opacity-80"
              >
                {slides[activeSlide].desc}
              </motion.p>
              <div>
                <motion.button 
                  initial={{ scale: 0.9, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }} 
                  transition={{ delay: 0.4 }} 
                  className="bg-white text-[#0A0F1E] px-8 py-3.5 rounded-2xl text-[14px] font-bold shadow-md active:scale-95 transition-transform"
                >
                  {slides[activeSlide].cta}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        <div className="absolute bottom-8 left-12 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setActiveSlide(i)} 
              className={`h-1.5 rounded-full transition-all duration-500 ${i === activeSlide ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestHero;
