"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Megaphone, Pin, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type AnnouncementType = 'academic' | 'system' | 'marketplace' | 'campus';

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  pinned: boolean;
  link_url: string;
  link_label: string;
  expires_at: Timestamp | null;
  published_at: Timestamp | null;
}

const TYPE_STYLES: Record<AnnouncementType, { label: string; bg: string; text: string; badgeBg: string; badgeText: string }> = {
  academic:     { label: 'Academic',     bg: 'bg-blue-50',     text: 'text-blue-900',   badgeBg: 'bg-blue-100',  badgeText: 'text-blue-700' },
  system:       { label: 'System',       bg: 'bg-purple-50',   text: 'text-purple-900', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700' },
  marketplace:  { label: 'Marketplace',  bg: 'bg-emerald-50',  text: 'text-emerald-900', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700' },
  campus:       { label: 'Campus Notice', bg: 'bg-amber-50',   text: 'text-amber-900',  badgeBg: 'bg-amber-100',  badgeText: 'text-amber-700' },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'announcements'), where('status', '==', 'published'), orderBy('published_at', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const now = Date.now();
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Announcement))
        .filter(a => !a.expires_at || a.expires_at.toMillis() > now);
      list.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const pa = a.published_at?.toMillis() || 0;
        const pb = b.published_at?.toMillis() || 0;
        return pb - pa;
      });
      setAnnouncements(list);
    });
    return () => unsub();
  }, []);

  const visible = announcements.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Megaphone size={14} className="text-slate-400" />
        <h2 className="text-[14px] font-bold text-slate-900 tracking-tight">Happening This Week</h2>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {visible.map((item, i) => {
            const s = TYPE_STYLES[item.type];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className={`rounded-2xl border border-slate-100 p-5 ${s.bg}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center h-[20px] px-2 rounded-md text-[8px] font-bold uppercase tracking-wider ${s.badgeBg} ${s.badgeText}`}>
                        {s.label}
                      </span>
                      {item.pinned && <Pin size={10} className="text-slate-400" />}
                    </div>
                    <h3 className="text-[14px] font-bold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-[12px] font-medium text-slate-600 leading-relaxed">{item.body}</p>
                    {item.link_url && (
                      <a
                        href={item.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 h-[28px] px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95"
                      >
                        {item.link_label || 'Learn More'}
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => setDismissed(prev => new Set(prev).add(item.id))}
                    className="w-7 h-7 rounded-lg bg-white/50 hover:bg-white text-slate-400 hover:text-slate-700 transition-all flex items-center justify-center shrink-0"
                    title="Dismiss"
                  >
                    <X size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
