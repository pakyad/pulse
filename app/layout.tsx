import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from "next"
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "CODEP PULSE | High-End University Ecosystem",
  description: "Perfectly beautiful university marketplace and runner ecosystem.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen relative`}>
        {/* Breathing background layer */}
        <div className="aura-bg animate-mesh-aura" />
        
        {/* Dynamic Aura Spots for depth */}
        <div className="aura-spot w-[600px] h-[600px] -top-40 -left-40 animate-mesh-aura" />
        <div className="aura-spot w-[400px] h-[400px] top-[20%] -right-20 animate-mesh-aura" />
        <div className="aura-spot w-[500px] h-[500px] -bottom-20 left-[20%] animate-mesh-aura" />

        <Navbar />
        <BottomNav />

        {/* Main Content Area */}
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  )
}
