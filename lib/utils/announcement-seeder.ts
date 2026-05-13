import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const seedAnnouncements = async () => {
  const announcements = [
    {
      tag: 'MARKETPLACE',
      headline: 'Trending: Tech Gear',
      subline: 'Fresh listings for student tech and accessories now live in the hub.',
      color: '#0f172a', // Slate 900
      ctaPath: '/marketplace',
      created_at: serverTimestamp(),
    },
    {
      tag: 'INSTITUTIONAL',
      headline: 'SE Club Hackathon',
      subline: 'Registration is now open for the annual campus-wide innovation sprint.',
      color: '#1e293b', // Slate 800
      ctaPath: '/pulse',
      created_at: serverTimestamp(),
    },
    {
      tag: 'GOVERNANCE',
      headline: 'Listing Audit Policy',
      subline: 'All new marketplace listings now require 1-click verification.',
      color: '#334155', // Slate 700
      ctaPath: '/me/listings',
      created_at: serverTimestamp(),
    }
  ];

  try {
    for (const ann of announcements) {
      await addDoc(collection(db, 'announcements'), ann);
    }
    console.log('✅ Announcements seeded successfully');
  } catch (e) {
    console.error('❌ Seeding error:', e);
  }
};
