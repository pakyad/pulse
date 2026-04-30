import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'
import type { Metadata } from "next"
import NavigationGate from '@/components/NavigationGate'

const pjs = Plus_Jakarta_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "CODEP PULSE | High-End University Ecosystem",
  description: "Perfectly beautiful university marketplace and runner ecosystem.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={pjs.className} suppressHydrationWarning>
      <body className={`${pjs.className} min-h-screen relative antialiased`}>
        {/* Breathing background layer */}
        <div className="aura-bg fixed inset-0 pointer-events-none animate-mesh-aura" />
        
        {/* Dynamic Aura Spots for depth */}
        <div className="aura-spot absolute pointer-events-none w-[600px] h-[600px] -top-40 -left-40 animate-mesh-aura" />
        <div className="aura-spot absolute pointer-events-none w-[400px] h-[400px] top-[20%] -right-20 animate-mesh-aura" />
        <div className="aura-spot absolute pointer-events-none w-[500px] h-[500px] -bottom-20 left-[20%] animate-mesh-aura" />


        <NavigationGate />

        {/* Main Content Area */}
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  )
}
