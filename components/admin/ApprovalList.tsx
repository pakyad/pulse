"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Check, X, User, Store, Bike, Search, Filter, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApprovalItem {
  id: string;
  full_name?: string;
  email?: string;
  applied_at?: string;
  role?: string;
  merchant_status?: string;
  runner_status?: string;
  matric_no?: string;
}

interface ApprovalListProps {
  type: 'merchants' | 'students' | 'runners' | 'clubs';
}

export default function ApprovalList({ type }: ApprovalListProps) {
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [type]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      let q;

      if (type === 'merchants') {
        q = query(usersRef, where("merchant_status", "==", "pending"));
      } else if (type === 'runners') {
        q = query(usersRef, where("runner_status", "==", "pending"));
      } else if (type === 'students') {
        q = query(usersRef, where("role", "==", "STUDENT"), where("is_verified", "==", false));
      } else {
        q = query(usersRef, where("role", "==", "CLUB"), where("is_official", "==", true));
      }

      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApprovalItem));
      setItems(fetched);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const userRef = doc(db, "users", id);
      const updates: any = {};

      if (type === 'merchants') {
        updates.merchant_status = action === 'approve' ? 'active' : 'rejected';
        updates.is_verified_merchant = action === 'approve';
      } else if (type === 'runners') {
        updates.runner_status = action === 'approve' ? 'active' : 'rejected';
        updates.is_verified_runner = action === 'approve';
      } else if (type === 'students') {
        updates.is_verified = action === 'approve';
      }

      await updateDoc(userRef, updates);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Action Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 w-full bg-slate-50 border-[0.5px] border-[#F2F2F7] rounded-[22px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* List Header (Institutional) */}
      <div className="flex justify-between items-end mb-12">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-[16px] bg-slate-900/5 flex items-center justify-center text-slate-900/40">
            {type === 'merchants' ? <Store size={24} /> : 
             type === 'runners' ? <Bike size={24} /> : 
             <User size={24} />}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-900/20 mb-1">Authorization Hub</p>
            <h3 className="text-[20px] font-semibold text-slate-900 uppercase tracking-tighter leading-none">
              {type === 'merchants' ? 'Merchant Registry' : 
               type === 'runners' ? 'Runner Registry' : 
               type === 'students' ? 'Student Registry' : 'Official Clubs'}
            </h3>
          </div>
        </div>
        
        <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-[16px] border-[0.5px] border-[#F2F2F7]">
           <Search size={16} className="text-slate-900/10" />
           <input type="text" placeholder="Filter node..." className="bg-transparent border-none outline-none text-[11px] font-semibold text-slate-900/40 w-48 placeholder:text-slate-900/10" />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="h-64 w-full border-[0.5px] border-dashed border-black/10 rounded-[22px] flex flex-col items-center justify-center text-center p-12">
           <p className="text-slate-900/20 font-semibold text-[12px] uppercase tracking-[0.3em] mb-2">Registry Silent</p>
           <p className="text-slate-900/10 text-[10px] font-semibold italic">No pending {type} authorizations at this timestamp.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white border-[0.5px] border-[#F2F2F7] rounded-[22px] p-8 flex items-center justify-between group hover:border-black/10 transition-all shadow-sm"
              >
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 rounded-[16px] bg-slate-50 border-[0.5px] border-[#F2F2F7] flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.full_name || item.id}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-slate-900 font-semibold text-[16px] uppercase tracking-tight leading-none">{item.full_name || 'Anonymous Node'}</h4>
                    <div className="flex items-center gap-4">
                      <p className="text-slate-900/30 text-[11px] font-semibold italic">{item.email}</p>
                      {item.matric_no && (
                        <>
                          <div className="w-1 h-1 rounded-full bg-slate-900/10" />
                          <p className="text-slate-900 font-semibold text-[11px] tracking-widest uppercase opacity-40">{item.matric_no}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                  <button 
                    onClick={() => handleAction(item.id, 'approve')}
                    className="h-12 px-8 rounded-[16px] bg-[#00927C] text-white font-semibold text-[11px] hover:bg-[#007A68] transition-all active:scale-95 flex items-center gap-3 "
                  >
                    <Check size={16} strokeWidth={3} />
                    Authorize
                  </button>
                  <button 
                    onClick={() => handleAction(item.id, 'reject')}
                    className="h-12 w-12 rounded-[16px] bg-white border-[0.5px] border-[#F2F2F7] flex items-center justify-center text-slate-900/20 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
                  >
                    <X size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
