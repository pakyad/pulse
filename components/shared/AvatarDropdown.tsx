'use client'

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  User, Bell, HelpCircle, MessageSquare, Settings,
  ChevronDown, LogOut 
} from 'lucide-react';
import { auth } from '@/lib/firebase';

interface AvatarDropdownProps {
  photoUrl: string;
  userName: string;
  className?: string;
}

export default function AvatarDropdown({ photoUrl, userName, className = "" }: AvatarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { group: 'Account', items: [
      { label: 'Profile', icon: User, path: '/me' },
      { label: 'Notifications', icon: Bell, path: '/activity' },
      { label: 'Settings', icon: Settings, path: '/me/edit' },
    ]},
    { group: 'Support', items: [
      { label: 'Help Center', icon: HelpCircle, path: '/me' },
      { label: 'Contact Us', icon: MessageSquare, path: '/me' },
    ]}
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group active:scale-95 transition-all -m-2 p-2 rounded-2xl"
      >
        <div className="relative shrink-0">
          <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-sm group-hover:border-slate-300 transition-colors">
            <img 
              src={photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} 
              className="w-full h-full object-cover" 
              alt="Avatar"
            />
          </div>
        </div>
        <ChevronDown size={14} className={`text-slate-300 group-hover:text-slate-900 transition-all ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-md shadow-slate-200 border border-slate-100 overflow-hidden z-200"
          >
            <div className="p-3">
              {menuItems.map((section, idx) => (
                <div key={section.group} className={idx > 0 ? 'mt-4 pt-3 border-t border-slate-50' : ''}>
                  <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {section.group}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          router.push(item.path);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 transition-colors group text-left"
                      >
                        <item.icon size={18} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                        <span className="text-[14px] font-bold text-slate-900/80 group-hover:text-slate-900 tracking-tight">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="mt-4 pt-3 border-t border-slate-50">
                <button
                  onClick={() => {
                    auth.signOut().then(() => router.push('/auth'));
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-rose-50 transition-colors group text-left"
                >
                  <LogOut size={18} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                  <span className="text-[14px] font-bold text-slate-900/80 group-hover:text-rose-600 tracking-tight">Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
