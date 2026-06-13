import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from "next"
import NavigationGate from '@/components/NavigationGate'
import { Providers } from '@/components/Providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "PULSE | Campus Delivery & Market",
  description: "Easy campus delivery and marketplace.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "PULSE",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${inter.className} min-h-screen bg-white relative antialiased selection:bg-slate-100`}>
        <Providers>
          <NavigationGate />

          {/*  CAMPUS MAIN CONTAINER */}
          <main className="relative" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
