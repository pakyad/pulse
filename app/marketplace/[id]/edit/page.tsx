'use client'
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import CreateListing from '@/components/CreateListing';

export default function EditListingPage() {
  const { id } = useParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('STUDENT');

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/auth');
        return;
      }

      // Load Role
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        setUserRole(userSnap.data().role || 'STUDENT');
      }

      // Load Item
      const itemSnap = await getDoc(doc(db, 'items', id as string));
      if (itemSnap.exists()) {
        const data = itemSnap.data();
        // Permission check
        if (data.seller_id !== user.uid) {
           alert("Institutional Guard: You do not have permission to edit this asset.");
           router.push('/merchant');
           return;
        }
        setItem({ id: itemSnap.id, ...data });
      }
      setLoading(false);
    };
    load();
  }, [id, router]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );

  if (!item) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Asset not found</p>
    </div>
  );

  return (
    <CreateListing 
      userId={auth.currentUser?.uid || ''}
      role={userRole}
      onClose={() => router.push('/merchant')}
      existingItem={item}
    />
  );
}
