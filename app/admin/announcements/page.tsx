"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Megaphone, Plus, X, Loader2, Pin, Trash2, Image, ArrowUpRight, ImagePlus } from 'lucide-react';
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

interface Banner {
  id: string;
  imageUrl: string;
  headline: string;
  subline: string;
  destination: 'marketplace' | 'pulse';
  active: boolean;
  created_at: Timestamp;
  created_by: string;
}

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  academic:     { label: 'Academic',      bg: 'bg-emerald-50',  text: 'text-emerald-700' },
  system:       { label: 'System',        bg: 'bg-blue-50',     text: 'text-blue-700' },
  marketplace:  { label: 'Marketplace',   bg: 'bg-amber-50',    text: 'text-amber-700' },
  campus:       { label: 'Campus Notice', bg: 'bg-purple-50',   text: 'text-purple-700' },
  default:      { label: 'Announcement',  bg: 'bg-gray-100',    text: 'text-gray-600' },
};

const PRIORITY_CONFIG: Record<string, { label: string; dot: string }> = {
  low:    { label: 'Low',    dot: 'bg-slate-300' },
  normal: { label: 'Normal', dot: 'bg-blue-400' },
  high:   { label: 'High',   dot: 'bg-orange-400' },
  urgent: { label: 'Urgent', dot: 'bg-red-500' },
  default: { label: 'Normal', dot: 'bg-gray-400' },
};

const DESTINATION_CONFIG: Record<string, { label: string; path: string }> = {
  marketplace: { label: 'Marketplace', path: '/marketplace' },
  pulse:       { label: 'Pulse',       path: '/pulse' },
};

function TypeBadge({ type }: { type: string }) {
  const c = TYPE_CONFIG[type] ?? TYPE_CONFIG['default'];
  return (
    <span className={`inline-flex items-center h-[22px] px-2.5 rounded-md text-[9px] font-bold ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const c = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG['default'];
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot}`} title={c.label} />
  );
}

// ── Announcement Modal ───────────────────────────────────────────

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

        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400">Type</p>
          <div className="flex gap-2">
            {(Object.keys(TYPE_CONFIG) as AnnouncementType[]).filter(k => k !== 'default').map(t => {
              const c = TYPE_CONFIG[t]!;
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

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Title</p>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Final Exam Schedule Released"
            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors" />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Body</p>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder="Write the announcement content..."
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-medium text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors resize-none leading-relaxed" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-slate-400">Priority</p>
            <div className="flex gap-1.5">
              {(Object.keys(PRIORITY_CONFIG).filter(k => k !== 'default') as Priority[]).map(p => {
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

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Expires (optional)</p>
          <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
            className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-colors" />
        </div>

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

// ── Banner Modal ────────────────────────────────────────────────

function BannerModal({
  editing, onClose, onSave
}: {
  editing: Banner | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [headline, setHeadline] = useState(editing?.headline || '');
  const [subline, setSubline] = useState(editing?.subline || '');
  const [destination, setDestination] = useState<'marketplace' | 'pulse'>(editing?.destination || 'marketplace');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(editing?.imageUrl || '');
  const [saving, setSaving] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!headline.trim() || (!imageFile && !editing?.imageUrl)) return;
    setSaving(true);
    try {
      let imageUrl = editing?.imageUrl || '';
      if (imageFile) {
        const imgRef = ref(storage, `banners/${Date.now()}_${imageFile.name}`);
        const snap = await uploadBytes(imgRef, imageFile);
        imageUrl = await getDownloadURL(snap.ref);
      }
      await onSave({
        imageUrl,
        headline: headline.trim(),
        subline: subline.trim(),
        destination,
      });
      setSaving(false);
      onClose();
    } catch (e: any) {
      alert(e.message || 'Upload failed.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-white/70 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
        className="relative w-full max-w-[520px] bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-slate-100 p-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">{editing ? 'Edit' : 'New'} Home Banner</h2>
            <p className="text-[11px] font-medium text-[#94a3b8] mt-0.5">Featured image banner on the home screen</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Banner Image</p>
          <label className="block w-full h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-slate-400 transition-colors">
            {imagePreview ? (
              <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
                <ImagePlus size={24} />
                <span className="text-[11px] font-bold">Click to upload image</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </label>
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Headline</p>
          <input value={headline} onChange={e => setHeadline(e.target.value)}
            placeholder="e.g. Mid-Semester Sale is Here!"
            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors" />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Subline</p>
          <input value={subline} onChange={e => setSubline(e.target.value)}
            placeholder="e.g. Up to 50% off from campus vendors"
            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none focus:border-slate-900 transition-colors" />
        </div>

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-slate-400">Destination</p>
          <div className="flex gap-2">
            {(Object.keys(DESTINATION_CONFIG) as ('marketplace' | 'pulse')[]).map(d => {
              const active = destination === d;
              return (
                <button key={d} onClick={() => setDestination(d)}
                  className={`h-[30px] px-3.5 rounded-full text-[10px] font-bold transition-all active:scale-95 border-[0.5px] ${
                    active ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                  {DESTINATION_CONFIG[d].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose}
            className="flex-1 h-11 rounded-xl text-[13px] font-bold text-slate-400 border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!headline.trim() || (!imageFile && !editing?.imageUrl) || saving}
            className={`flex-1 h-11 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
              headline.trim() && (imageFile || editing?.imageUrl)
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-200 border border-slate-100'
            }`}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Uploading...' : (editing ? 'Update' : 'Save Banner')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingAnn, setDeletingAnn] = useState<string | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const unsubAnn = onSnapshot(collection(db, 'announcements'),
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

    const unsubBanners = onSnapshot(collection(db, 'banners'),
      snap => {
        try {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Banner));
          list.sort((a, b) => {
            const ta = a.created_at?.toMillis?.() || 0;
            const tb = b.created_at?.toMillis?.() || 0;
            return tb - ta;
          });
          setBanners(list);
        } catch (err) { console.error('[Banners] parse error:', err); }
      },
      err => { console.error('[Banners] listener failed:', err); }
    );

    return () => { unsubAnn(); unsubBanners(); };
  }, []);

  const handleSaveAnnouncement = async (data: any) => {
    const user = auth.currentUser;
    if (!user) return;
    if (editingAnn) {
      await updateDoc(doc(db, 'announcements', editingAnn.id), {
        ...data,
        updated_at: serverTimestamp(),
      });
      showToast('Announcement updated.');
    } else {
      await addDoc(collection(db, 'announcements'), {
        ...data,
        status: 'draft',
        published: false,
        created_by: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        published_at: null,
      });
      showToast('Announcement created.');
    }
  };

  const toggleStatus = async (item: Announcement) => {
    const isPublishing = item.status === 'draft';
    await updateDoc(doc(db, 'announcements', item.id), {
      status: isPublishing ? 'published' : 'draft',
      published: isPublishing ? true : false,
      published_at: isPublishing ? serverTimestamp() : null,
      updated_at: serverTimestamp(),
    });
    showToast(isPublishing ? 'Announcement published.' : 'Announcement unpublished.');
  };

  const togglePin = async (item: Announcement) => {
    await updateDoc(doc(db, 'announcements', item.id), {
      pinned: !item.pinned,
      updated_at: serverTimestamp(),
    });
  };

  const handleDeleteAnn = async (id: string) => {
    await deleteDoc(doc(db, 'announcements', id));
    setDeletingAnn(null);
    showToast('Announcement deleted.');
  };

  const handleSaveBanner = async (data: any) => {
    const user = auth.currentUser;
    if (!user) return;
    if (editingBanner) {
      await updateDoc(doc(db, 'banners', editingBanner.id), {
        ...data,
        updated_at: serverTimestamp(),
      });
      showToast('Banner updated.');
    } else {
      await addDoc(collection(db, 'banners'), {
        ...data,
        active: true,
        created_by: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      showToast('Banner created.');
    }
  };

  const toggleBannerActive = async (item: Banner) => {
    await updateDoc(doc(db, 'banners', item.id), {
      active: !item.active,
      updated_at: serverTimestamp(),
    });
  };

  const handleDeleteBanner = async (id: string) => {
    await deleteDoc(doc(db, 'banners', id));
    setDeletingBanner(null);
    showToast('Banner deleted.');
  };

  function safeToMillis(ts: any): number | null {
    return ts?.toMillis?.() ?? null;
  }

  function renderAnnCard(item: Announcement) {
    try {
      const publishedAt = safeToMillis(item.published_at);
      const isPublished = item.status === 'published';

      return (
        <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          className="rounded-xl border border-[#E5E7EB] bg-white p-4 transition-all hover:bg-[#F9FAFB]">

          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TypeBadge type={item.type} />
                <h3 className="text-[16px] font-bold text-slate-900 truncate">{item.title}</h3>
              </div>
              <p className="text-[13px] text-[#6B7280] leading-relaxed line-clamp-2">{item.body}</p>
              <span className="text-[11px] font-medium text-[#9CA3AF] mt-2 block">
                {publishedAt !== null ? new Date(publishedAt).toLocaleDateString() : ''}
              </span>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {isPublished ? (
                <span className="text-[11px] font-semibold text-emerald-600">Published</span>
              ) : (
                <span className="text-[11px] font-semibold text-[#6B7280]">Draft</span>
              )}
              <div className="flex items-center gap-1.5">
                <button onClick={() => toggleStatus(item)}
                  className="h-7 px-3 rounded-lg border border-[#E5E7EB] text-[10px] font-bold text-[#6B7280] hover:bg-slate-50 transition-all active:scale-95">
                  {isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => { setEditingAnn(item); setShowAnnModal(true); }}
                  className="h-7 px-3 rounded-lg border border-[#E5E7EB] text-[10px] font-bold text-[#6B7280] hover:bg-slate-50 transition-all active:scale-95">
                  Edit
                </button>
                <button onClick={() => setDeletingAnn(item.id)}
                  className="h-7 px-3 rounded-lg border border-[#E5E7EB] text-[10px] font-bold text-red-400 hover:bg-red-50 transition-all active:scale-95">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    } catch {
      return (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <p className="text-[12px] font-medium text-[#6B7280]">Could not render this announcement.</p>
        </div>
      );
    }
  }

  function renderBannerCard(item: Banner) {
    return (
      <motion.div key={item.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        className="rounded-xl border border-[#E5E7EB] bg-white p-4 transition-all hover:bg-[#F9FAFB]">
        <div className="flex items-start gap-4">
          <div className="w-24 h-16 shrink-0 rounded-lg bg-slate-50 overflow-hidden border border-slate-100">
            {item.imageUrl ? (
              <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.headline} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Image size={18} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-bold text-slate-900 truncate">{item.headline}</h3>
            {item.subline && <p className="text-[12px] text-[#6B7280] truncate mt-0.5">{item.subline}</p>}
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.destination === 'marketplace' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
                {DESTINATION_CONFIG[item.destination]?.label || item.destination}
              </span>
              <ArrowUpRight size={10} className="text-slate-400" />
              <span className="text-[10px] text-slate-400 ml-auto">
                {item.created_at?.toMillis ? new Date(item.created_at.toMillis()).toLocaleDateString() : ''}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button onClick={() => toggleBannerActive(item)}
              className={`h-6 px-3 rounded-lg text-[9px] font-bold border transition-all active:scale-95 ${
                item.active ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}>
              {item.active ? 'Active' : 'Inactive'}
            </button>
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setEditingBanner(item); setShowBannerModal(true); }}
                className="h-7 px-3 rounded-lg border border-[#E5E7EB] text-[10px] font-bold text-[#6B7280] hover:bg-slate-50 transition-all active:scale-95">
                Edit
              </button>
              <button onClick={() => setDeletingBanner(item.id)}
                className="h-7 px-3 rounded-lg border border-[#E5E7EB] text-[10px] font-bold text-red-400 hover:bg-red-50 transition-all active:scale-95">
                Delete
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] w-full">

      {toast && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg bg-slate-900 text-white text-[13px] font-bold">
          {toast}
        </motion.div>
      )}

      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 mb-1">System</p>
        <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">Announcements</h1>
        <p className="text-[13px] font-medium text-slate-400 mt-1">Manage Pulse announcements and home screen banners</p>
      </div>

      {/* ── SECTION 1: Pulse Announcements ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Pulse Announcements</h2>
            <p className="text-[12px] text-slate-400 mt-1">
              Text announcements shown on the Pulse campus feed page.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500">
              {announcements.length} Total
            </span>
            <button onClick={() => { setEditingAnn(null); setShowAnnModal(true); }}
              className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-2 shadow-sm">
              <Plus size={14} />
              New Announcement
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {announcements.length === 0 && (
            <div className="py-12 text-center">
              <Megaphone size={32} className="mx-auto mb-3 text-[#D1D5DB]" />
              <p className="text-[13px] font-bold text-[#6B7280]">No announcements yet</p>
            </div>
          )}
          <AnimatePresence>
            {announcements.map(item => renderAnnCard(item))}
          </AnimatePresence>
        </div>
      </div>

      {/* ── SECTION 2: Home Screen Banners ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">Home Screen Banners</h2>
            <p className="text-[12px] text-slate-400 mt-1">
              Image banners featured on the home screen carousel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-500">
              {banners.length} Total
            </span>
            <button onClick={() => { setEditingBanner(null); setShowBannerModal(true); }}
              className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-2 shadow-sm">
              <Plus size={14} />
              New Banner
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {banners.length === 0 && (
            <div className="py-12 text-center">
              <Image size={32} className="mx-auto mb-3 text-[#D1D5DB]" />
              <p className="text-[13px] font-bold text-[#6B7280]">No banners yet</p>
            </div>
          )}
          <AnimatePresence>
            {banners.map(item => renderBannerCard(item))}
          </AnimatePresence>
        </div>
      </div>

      {/* Ann modal */}
      <AnimatePresence>
        {showAnnModal && (
          <AnnouncementModal
            editing={editingAnn}
            onClose={() => { setShowAnnModal(false); setEditingAnn(null); }}
            onSave={handleSaveAnnouncement}
          />
        )}
      </AnimatePresence>

      {/* Banner modal */}
      <AnimatePresence>
        {showBannerModal && (
          <BannerModal
            editing={editingBanner}
            onClose={() => { setShowBannerModal(false); setEditingBanner(null); }}
            onSave={handleSaveBanner}
          />
        )}
      </AnimatePresence>

      {/* Delete announcement confirmation */}
      <AnimatePresence>
        {deletingAnn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingAnn(null)} className="absolute inset-0 bg-white/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
              className="relative w-full max-w-[360px] bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-slate-100 p-8 space-y-4 text-center">
              <Trash2 size={28} className="mx-auto text-red-400" />
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">Delete announcement?</h2>
                <p className="text-[12px] font-medium text-[#94a3b8] mt-1">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeletingAnn(null)}
                  className="flex-1 h-10 rounded-xl text-[12px] font-bold text-slate-400 border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95">
                  Cancel
                </button>
                <button onClick={() => handleDeleteAnn(deletingAnn)}
                  className="flex-1 h-10 rounded-xl text-[12px] font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-all active:scale-95">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete banner confirmation */}
      <AnimatePresence>
        {deletingBanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingBanner(null)} className="absolute inset-0 bg-white/70 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
              className="relative w-full max-w-[360px] bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] border border-slate-100 p-8 space-y-4 text-center">
              <Trash2 size={28} className="mx-auto text-red-400" />
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">Delete banner?</h2>
                <p className="text-[12px] font-medium text-[#94a3b8] mt-1">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setDeletingBanner(null)}
                  className="flex-1 h-10 rounded-xl text-[12px] font-bold text-slate-400 border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95">
                  Cancel
                </button>
                <button onClick={() => handleDeleteBanner(deletingBanner)}
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
