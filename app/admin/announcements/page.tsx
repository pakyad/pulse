"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Megaphone, Plus, X, Loader2, Pin, Archive, ExternalLink, Trash2, CheckCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type AnnouncementType = 'academic' | 'system' | 'marketplace' | 'campus';
type AnnouncementStatus = 'draft' | 'published';
type Priority = 'low' | 'normal' | 'high' | 'urgent';

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  priority: Priority;
  status: AnnouncementStatus;
  pinned: boolean;
  link_url: string;
  link_label: string;
  expires_at: Timestamp | null;
  published_at: Timestamp | null;
  created_at: Timestamp;
  created_by: string;
}

const TYPE_CONFIG: Record<AnnouncementType, { label: string; bg: string; text: string }> = {
  academic:     { label: 'Academic',     bg: 'bg-blue-50',    text: 'text-blue-700' },
  system:       { label: 'System',       bg: 'bg-purple-50',  text: 'text-purple-700' },
  marketplace:  { label: 'Marketplace',  bg: 'bg-emerald-50', text: 'text-emerald-700' },
  campus:       { label: 'Campus Notice', bg: 'bg-amber-50',  text: 'text-amber-700' },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string }> = {
  low:    { label: 'Low',    dot: 'bg-slate-300' },
  normal: { label: 'Normal', dot: 'bg-blue-400' },
  high:   { label: 'High',   dot: 'bg-orange-400' },
  urgent: { label: 'Urgent', dot: 'bg-red-500' },
};

function TypeBadge({ type }: { type: AnnouncementType }) {
  const c = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center h-[22px] px-2.5 rounded-md text-[9px] font-bold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: Priority }) {
  const c = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot}`} title={c.label} />
  );
}

function AnnouncementModal({
  editing, onClose, onSave
}: {
  editing: Announcement | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [title, setTitle] = useState(editing?.title || '');
  const [body, setBody] = useState(editing?.body || '');
  const [type, setType] = useState<AnnouncementType>(editing?.type || 'campus');
  const [priority, setPriority] = useState<Priority>(editing?.priority || 'normal');
  const [linkUrl, setLinkUrl] = useState(editing?.link_url || '');
  const [linkLabel, setLinkLabel] = useState(editing?.link_label || '');
  const [expiryDate, setExpiryDate] = useState(
    editing?.expires_at ? new Date(editing.expires_at.toMillis()).toISOString().slice(0, 10) : ''
  );
  const [pinned, setPinned] = useState(editing?.pinned || false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    const payload: any = {
      title: title.trim(),
      body: body.trim(),
      type,
      priority,
      pinned,
      link_url: linkUrl.trim(),
      link_label: linkLabel.trim(),
      expires_at: expiryDate ? Timestamp.fromDate(new Date(expiryDate + 'T23:59:59')) : null,
    };
    await onSave(payload);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-white/70 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
        className="relative w-full max-w-[520px] bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-slate-100 p-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">{editing ? 'Edit' : 'New'} Announcement</h2>
            <p className="text-[11px] font-medium text-[#94a3b8] mt-0.5">Write a campus announcement</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Type selector */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400">Type</p>
          <div className="flex gap-2">
            {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).map(t => {
              const c = TYPE_CONFIG[t];
              const active = type === t;
              return (
                <button key={t} onClick={() => setType(t)}
                  className={`h-[30px] px-3.5 rounded-full text-[10px] font-bold transition-all active:scale-95 border-[0.5px] ${
                    active ? `${c.bg} ${c.text} border-transparent` : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'
                  }`}>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Title</p>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Final Exam Schedule Released"
            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors" />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Body</p>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder="Write the announcement content..."
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-medium text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors resize-none leading-relaxed" />
        </div>

        {/* Priority + Pinned row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-400">Priority</p>
            <div className="flex gap-1.5">
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => {
                const active = priority === p;
                return (
                  <button key={p} onClick={() => setPriority(p)}
                    className={`h-[30px] px-3 rounded-lg text-[10px] font-bold transition-all active:scale-95 border-[0.5px] ${
                      active ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                    {PRIORITY_CONFIG[p].label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-400">Pin</p>
            <button onClick={() => setPinned(!pinned)}
              className={`h-[30px] px-3.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 border-[0.5px] flex items-center gap-1.5 ${
                pinned ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100'
              }`}>
              <Pin size={12} />
              {pinned ? 'Pinned' : 'Not Pinned'}
            </button>
          </div>
        </div>

        {/* Link */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Optional Link</p>
          <div className="flex gap-2">
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-medium text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors" />
            <input value={linkLabel} onChange={e => setLinkLabel(e.target.value)}
              placeholder="Button label"
              className="w-[140px] h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-medium text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors" />
          </div>
        </div>

        {/* Expiry date */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Expires (optional)</p>
          <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
            className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-colors" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 h-11 rounded-xl text-[13px] font-bold text-slate-400 border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!title.trim() || !body.trim() || saving}
            className={`flex-1 h-11 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
              title.trim() && body.trim()
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-200 border border-slate-100'
            }`}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving...' : (editing ? 'Update' : 'Save')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'announcements'),
      snap => {
        try {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
          list.sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            const pa = a.published_at?.toMillis?.() || 0;
            const pb = b.published_at?.toMillis?.() || 0;
            return pb - pa;
          });
          setAnnouncements(list);
        } catch (err) { console.error('[Announcements] parse error:', err); }
      },
      err => { console.error('[Announcements] listener failed:', err); }
    );
    return () => unsub();
  }, []);

  const handleSave = async (data: any) => {
    const user = auth.currentUser;
    if (!user) return;

    if (editing) {
      await updateDoc(doc(db, 'announcements', editing.id), {
        ...data,
        updated_at: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, 'announcements'), {
        ...data,
        status: 'draft',
        created_by: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        published_at: null,
      });
    }
  };

  const toggleStatus = async (item: Announcement) => {
    const isPublishing = item.status === 'draft';
    await updateDoc(doc(db, 'announcements', item.id), {
      status: isPublishing ? 'published' : 'draft',
      published_at: isPublishing ? serverTimestamp() : null,
      updated_at: serverTimestamp(),
    });
  };

  const togglePin = async (item: Announcement) => {
    await updateDoc(doc(db, 'announcements', item.id), {
      pinned: !item.pinned,
      updated_at: serverTimestamp(),
    });
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'announcements', id));
    setDeleting(null);
  };

  const now = Date.now();

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased pb-40">
      <div className="max-w-[760px] mx-auto px-6 pt-20">

        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <button onClick={() => router.push('/admin')}
              className="text-[11px] font-bold text-[#94a3b8] hover:text-slate-900 transition-colors mb-3 block">
              ← Back to Admin
            </button>
            <h1 className="text-[20px] font-bold tracking-tight">Announcements</h1>
            <p className="text-[12px] font-medium text-[#94a3b8] mt-1">Create and manage campus announcements & events</p>
          </div>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[12px] font-bold transition-all active:scale-95 flex items-center gap-2 shadow-sm">
            <Plus size={15} />
            New Announcement
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {announcements.length === 0 && (
            <div className="text-center py-20">
              <Megaphone size={32} className="mx-auto text-slate-200 mb-4" />
              <p className="text-[14px] font-bold text-slate-400">No announcements yet</p>
              <p className="text-[11px] font-medium text-[#94a3b8] mt-1">Create your first campus announcement above.</p>
            </div>
          )}

          <AnimatePresence>
            {announcements.map(item => (
              <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className={`rounded-2xl border p-5 transition-all hover:shadow-sm ${
                  item.status === 'draft' ? 'border-slate-100 bg-slate-50/50' : 'border-slate-100 bg-white'
                } ${item.pinned ? 'ring-1 ring-slate-900/5' : ''}`}>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <TypeBadge type={item.type} />
                      <PriorityDot priority={item.priority} />
                      {item.pinned && <Pin size={11} className="text-slate-400" />}
                      {item.status === 'draft' && (
                        <span className="text-[9px] font-bold text-slate-300 bg-slate-100 px-2 py-0.5 rounded">Draft</span>
                      )}
                      {item.expires_at && item.expires_at.toMillis() < now && (
                        <span className="text-[9px] font-bold text-red-400">Expired</span>
                      )}
                    </div>
                    <h3 className="text-[14px] font-bold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-[12px] font-medium text-slate-500 leading-relaxed line-clamp-2">{item.body}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[10px] font-semibold text-[#94a3b8]">
                        {item.status === 'published' ? 'Published' : 'Draft'}
                        {item.published_at && ` · ${new Date(item.published_at.toMillis()).toLocaleDateString()}`}
                      </span>
                      {item.expires_at && (
                        <span className="text-[10px] font-semibold text-[#94a3b8]">
                          Expires {new Date(item.expires_at.toMillis()).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => togglePin(item)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        item.pinned ? 'bg-slate-100 text-slate-900' : 'bg-slate-50 text-slate-300 hover:text-slate-500'
                      }`}
                      title={item.pinned ? 'Unpin' : 'Pin'}>
                      <Pin size={13} />
                    </button>
                    <button onClick={() => toggleStatus(item)}
                      className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center"
                      title={item.status === 'draft' ? 'Publish' : 'Unpublish'}>
                      {item.status === 'draft' ? <CheckCircle size={13} /> : <Archive size={13} />}
                    </button>
                    <button onClick={() => { setEditing(item); setShowModal(true); }}
                      className="h-8 px-3 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-900 transition-all text-[10px] font-bold">
                      Edit
                    </button>
                    <button onClick={() => setDeleting(item.id)}
                      className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 hover:text-red-500 transition-all flex items-center justify-center"
                      title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <AnnouncementModal
            editing={editing}
            onClose={() => { setShowModal(false); setEditing(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleting(null)} className="absolute inset-0 bg-white/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
              className="relative w-full max-w-[360px] bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-slate-100 p-8 space-y-4 text-center">
              <Trash2 size={28} className="mx-auto text-red-400" />
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">Delete announcement?</h2>
                <p className="text-[12px] font-medium text-[#94a3b8] mt-1">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeleting(null)}
                  className="flex-1 h-10 rounded-xl text-[12px] font-bold text-slate-400 border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleting)}
                  className="flex-1 h-10 rounded-xl text-[12px] font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-all active:scale-95">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
