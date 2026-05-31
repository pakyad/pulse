'use client';

import { ReactNode } from 'react';

export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in fade-in duration-500">
      {children}
    </div>
  );
}
