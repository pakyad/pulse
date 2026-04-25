"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Check, X, User, Store, Bike, Search, Filter } from 'lucide-react';
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
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 w-full bg-slate-50 animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* List Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
            {type === 'merchants' ? <Store className="text-[#007AFF]" size={20} /> : 
             type === 'runners' ? <Bike className="text-[#007AFF]" size={20} /> : 
             <User className="text-[#007AFF]" size={20} />}
          </div>
          <div>
            <h3 className="text-[#0A0F1E] font-bold text-lg leading-none mb-1">
              {type === 'merchants' ? 'Merchant Queue' : 
               type === 'runners' ? 'Runner Queue' : 
               type === 'students' ? 'Student Verification' : 'Official Clubs'}
            </h3>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">
              {items.length} Pending Review
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
           <Search size={14} className="text-slate-300" />
           <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-[12px] font-medium text-slate-500 w-40" />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="h-64 w-full border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center p-12">
           <p className="text-slate-300 font-bold text-sm mb-1 uppercase tracking-widest">All Clear</p>
           <p className="text-slate-200 text-xs font-medium uppercase tracking-widest">No pending {type} at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-100 rounded-4xl p-8 flex items-center justify-between group hover:border-blue-100 transition-colors shadow-sm"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.full_name || item.id}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-[#0A0F1E] font-bold text-[16px] leading-tight mb-1">{item.full_name || 'Anonymous User'}</h4>
                    <div className="flex items-center gap-4">
                      <p className="text-slate-400 text-[12px] font-medium">{item.email}</p>
                      {item.matric_no && (
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                      )}
                      <p className="text-slate-400 text-[12px] font-medium font-mono uppercase">{item.matric_no}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleAction(item.id, 'approve')}
                    className="h-11 px-6 rounded-2xl bg-[#007AFF] text-white font-bold text-[12px] hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-500/10"
                  >
                    <Check size={16} />
                    Approve
                  </button>
                  <button 
                    onClick={() => handleAction(item.id, 'reject')}
                    className="h-11 w-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-red-500 hover:border-red-100 transition-all active:scale-95"
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
