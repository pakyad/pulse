'use client'
import { useRouter } from 'next/navigation'
import { LayoutGrid, Package, ClipboardList, BarChart3, Settings, LogOut } from 'lucide-react'
import { auth } from '@/lib/firebase'

interface MerchantSidebarProps {
  active: 'overview' | 'orders' | 'inventory' | 'log' | 'analytics' | 'settings'
  onSectionChange?: (section: any) => void
}

export default function MerchantSidebar({ active, onSectionChange }: MerchantSidebarProps) {
  const router = useRouter()

  const nav = [
    { key: 'overview', label: 'Overview', icon: LayoutGrid, action: () => onSectionChange ? onSectionChange('overview') : router.push('/merchant') },
    { key: 'inventory', label: 'Inventory', icon: Package, action: () => onSectionChange ? onSectionChange('products') : router.push('/merchant?section=products') },
    { key: 'log', label: 'Order Log', icon: ClipboardList, action: () => onSectionChange ? onSectionChange('log') : router.push('/merchant?section=log') },
    { key: 'analytics', label: 'Analytics', icon: BarChart3, action: () => router.push('/merchant/analytics') },
    { key: 'settings', label: 'Settings', icon: Settings, action: () => onSectionChange ? onSectionChange('settings') : router.push('/merchant?section=settings') },
  ]

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-100 fixed left-0 top-0 flex flex-col z-30">
      <div className="px-6 py-8 flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
          <span className="text-white font-semibold text-sm">P</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Pulse</h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {nav.map(({ key, label, icon: Icon, action }) => (
          <button
            key={key}
            onClick={action}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              active === key
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
      <div className="px-4 pb-6">
        <button
          onClick={() => { auth.signOut(); router.push('/auth'); }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}
