"use client";

import React from 'react';
import { ShoppingBag, Star, Zap } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: string;
  category: string;
  image?: string;
}

const SAMPLE_PRODUCTS: Product[] = [
  { id: '1', title: 'Tech Minimalist Hoodie', price: 'MYR 89.00', category: 'Clubs' },
  { id: '2', title: 'UTM Signature Cap', price: 'MYR 25.00', category: 'Official' },
  { id: '3', title: 'Smart Runner Delivery', price: 'MYR 5.00', category: 'Services' },
  { id: '4', title: 'Handmade Campus Sticker Pack', price: 'MYR 12.00', category: 'Student' },
];

export default function HypeGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 md:gap-6 lg:gap-8 max-w-7xl mx-auto">
      {SAMPLE_PRODUCTS.map((product) => (
        <div 
          key={product.id}
          className="hologram-card rounded-2xl p-4 flex flex-col group relative overflow-hidden"
        >
          {/* Tag Overlay */}
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-[10px]  font-bold  bg-navy/5 text-navy px-2 py-1 rounded-md border-[0.5px] border-navy/10 backdrop-blur-md">
              {product.category}
            </span>
            <button className="text-navy/40 group-hover:text-orange transition-colors">
              <Zap className="w-4 h-4" />
            </button>
          </div>

          {/* Product Image Placeholder */}
          <div className="aspect-square rounded-xl bg-gradient-to-br from-navy/5 to-transparent border-[0.5px] border-navy/5 mb-4 flex items-center justify-center relative z-10">
             <ShoppingBag className="w-12 h-12 text-navy opacity-5" />
          </div>

          <div className="space-y-1 relative z-10">
            <h3 className="font-bold text-navy text-sm md:text-base truncate">{product.title}</h3>
            <div className="flex justify-between items-center">
              <p className="text-orange font-bold text-sm tracking-tight">{product.price}</p>
              <div className="flex items-center gap-1 opacity-40">
                <Star className="w-3 h-3 fill-navy text-navy" />
                <span className="text-[10px] font-bold">4.9</span>
              </div>
            </div>
          </div>

          {/* Hover Lens Effect */}
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-orange/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );
}
