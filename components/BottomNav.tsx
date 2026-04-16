"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ScanLine, User, PlusSquare, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Market', path: '/marketplace', icon: LayoutGrid },
    { name: 'Scan', path: '/scanner', icon: ScanLine },
    { name: 'Post', path: '/post', icon: PlusSquare },
    { name: 'Me', path: '/me', icon: User },
  ];

  // Hidden on Auth pages to maintain the high-fidelity gate
  if (pathname === '/auth') return null;

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="bg-navy/85 backdrop-blur-[24px] border border-white/10 rounded-[32px] p-2.5 flex justify-around items-center shadow-[0_30px_60px_rgba(0,31,63,0.4)] ring-1 ring-white/5"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
                key={item.path} 
                href={item.path} 
                className="relative group p-4 flex flex-col items-center gap-1 transition-all active:scale-95"
            >
              <item.icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2}
                className={`transition-all duration-300 ${isActive ? 'text-orange scale-110 drop-shadow-[0_0_8px_rgba(255,133,27,0.4)]' : 'text-white/40 group-hover:text-white/60'}`} 
              />
              
              {isActive && (
                <motion.div 
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white/5 rounded-2xl z-[-1]" 
                />
              )}
              
              {isActive && (
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange rounded-full shadow-[0_0_12px_#FF851B]" 
                />
              )}
            </Link>
          );
        })}
      </motion.div>
    </nav>
  );
}
