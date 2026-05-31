"use client";

import Link from 'next/link';
import { Search, Bell, ShoppingBag, User, LayoutGrid, Zap } from 'lucide-react';
import React from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/marketplace', icon: ShoppingBag, label: 'Market' },
    { href: '/missions', icon: Zap, label: 'Hustle' },
    { href: '/me', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center bg-pearl/70 backdrop-blur-xl border-b border-navy/5">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12">
            <span className="text-white font-black text-sm">P</span>
        </div>
        <h1 className="text-xl font-black text-navy  ">Codep Pulse</h1>
      </Link>
      
      <div className="flex items-center gap-2 md:gap-6">
        {/* Mobile quick icons */}
        <div className="flex items-center gap-4 text-navy/40">
           {navLinks.map((link) => {
             const Icon = link.icon;
             const isActive = pathname === link.href;
             return (
               <Link 
                 key={link.href}
                 href={link.href} 
                 className={`p-2 rounded-xl transition-all ${isActive ? 'bg-navy text-white shadow-md scale-110' : 'hover:text-navy hover:bg-navy/5'}`}
               >
                 <Icon size={20} />
               </Link>
             );
           })}
        </div>

        <div className="h-6 w-px bg-navy/10 mx-2 hidden md:block" />

        <div className="flex items-center gap-3">
          <Link href="/notifications" className="p-2 text-navy/40 hover:text-orange transition-colors relative">
             <Bell size={20} />
             <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange rounded-full border-2 border-pearl" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
