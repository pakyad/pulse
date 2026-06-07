"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { onSnapshot, doc, collection, query, where, getDoc } from 'firebase/firestore';
import { ChevronLeft, Star, MessageSquare } from 'lucide-react';

const Heading = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[17px] font-bold text-slate-900 tracking-tight ${className}`}>
    {children}
  </h2>
);

const Subtext = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[11px] font-medium text-[#94a3b8] leading-relaxed ${className}`}>
    {children}
  </p>
);

export default function ReviewsPage() {
  const router = useRouter();
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, 'users', id as string));
      if (snap.exists()) {
        setProfile(snap.data());
      }
    };

    fetchProfile();

    const q = query(
      collection(db, 'Reviews'),
      where('sellerId', '==', id)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      let fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort locally by createdAt desc
      fetchedReviews.sort((a: any, b: any) => new Date(b.createdAt?.toMillis?.() || b.createdAt).getTime() - new Date(a.createdAt?.toMillis?.() || a.createdAt).getTime());
      
      // Fetch reviewer details for each review
      const reviewsWithUsers = await Promise.all(fetchedReviews.map(async (review: any) => {
        if (review.buyerId) {
          const uSnap = await getDoc(doc(db, 'users', review.buyerId));
          if (uSnap.exists()) {
             review.reviewer = uSnap.data();
          }
        }
        return review;
      }));
      
      setReviews(reviewsWithUsers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-slate-100 border-t-[slate-900] rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-slate-900 antialiased pb-40 font-sans">
      {/*  GLOBAL NAVIGATION  */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b-[0.5px] border-slate-50">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-[#94a3b8] border border-slate-50 active:scale-90 transition-all">
               <ChevronLeft size={20} />
            </button>
            <p className="text-[14px] font-bold tracking-tight">Community Reviews</p>
         </div>
      </nav>

      <div className="pt-28 px-8 space-y-8">
         {/*  SUMMARY HEADER  */}
         <section className="flex flex-col items-center justify-center py-6 border-b border-slate-100">
            <div className="flex items-end gap-2 mb-2">
               <p className="text-[48px] font-semibold tracking-tighter leading-none text-slate-900">
                 {profile?.trustRating ? Number(profile.trustRating).toFixed(1) : '5.0'}
               </p>
               <div className="pb-2">
                 <Star size={24} fill="currentColor" className="text-amber-500" />
               </div>
            </div>
            <p className="text-[12px] font-bold text-[#94a3b8] ">
               {profile?.totalReviews || reviews.length} Ratings
            </p>
         </section>

         {/*  REVIEWS LIST  */}
         <section className="space-y-6">
            {reviews.length === 0 ? (
               <div className="w-full py-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-slate-200">
                  <MessageSquare size={32} className="text-slate-300 mb-4" />
                  <p className="text-[11px] font-bold text-[#94a3b8] tracking-widest uppercase">No Reviews Yet</p>
               </div>
            ) : (
               <div className="space-y-6">
                  {reviews.map((review) => (
                     <div key={review.id} className="pb-6 border-b border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                                 <img 
                                   src={review.reviewer?.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${review.reviewer?.full_name || 'A'}`} 
                                   alt="Reviewer" 
                                   className="w-full h-full object-cover" 
                                 />
                              </div>
                              <div>
                                 <p className="text-[13px] font-bold text-slate-900">{review.reviewer?.full_name || 'Pulse Member'}</p>
                                 <p className="text-[10px] font-medium text-[#94a3b8]">
                                   {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                              <Star size={12} fill="currentColor" className="text-amber-500" />
                              <p className="text-[11px] font-bold text-amber-700">{Number(review.rating).toFixed(1)}</p>
                           </div>
                        </div>
                        {review.comment && (
                           <p className="text-[13px] text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl rounded-tl-none">
                              "{review.comment}"
                           </p>
                        )}
                     </div>
                  ))}
               </div>
            )}
         </section>
      </div>
    </main>
  );
}
