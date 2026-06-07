'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, orderBy, limit } from 'firebase/firestore';
import { 
  TrendingUp, ArrowLeft, Package, DollarSign, ListOrdered, 
  HardDrive, ShoppingBag, Info, Shirt, ChevronRight,
  LayoutGrid, Bell, BarChart3, Settings, LogOut, ClipboardList,
  Search
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import AvatarDropdown from '@/components/shared/AvatarDropdown';

const StatCard = ({ title, value, subtext }: { title: string, value: string | number, subtext?: string }) => (
  <div className="p-6 bg-gray-50 rounded-xl flex-1">
    <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-2">{title}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {subtext && <p className="text-[11px] text-gray-400 mt-1 font-medium">{subtext}</p>}
  </div>
);

export default function MerchantInsightsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      unsubs.forEach(u => u());
      unsubs = [];

      if (user) {
        // User Profile
        unsubs.push(onSnapshot(doc(db, 'users', user.uid), (snap) => {
           setProfile({ ...snap.data(), uid: user.uid });
        }));

        // FIX 9: Queries use seller_id == currentMerchant.uid AND status == "DELIVERED"
        const q = query(
          collection(db, "orders"), 
          where("seller_id", "==", user.uid),
          where("status", "==", "DELIVERED")
        );
        
        unsubs.push(onSnapshot(q, (s) => {
           setOrders(s.docs.map(d => ({ id: d.id, ...d.data() })));
           setLoading(false);
        }));
      } else {
        router.push('/auth');
      }
    });
    return () => {
      unsubAuth();
      unsubs.forEach(u => u());
    };
  }, [router]);

  // ── SECTION 1: Stat Cards ──
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalRevenue = orders.reduce((s, o) => s + Number(o.total || o.price || 0), 0);
    const thisMonthRevenue = orders.filter(o => {
      const d = o.created_at?.toDate ? o.created_at.toDate() : new Date(o.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((s, o) => s + Number(o.total || o.price || 0), 0);
    
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "—";

    return { totalRevenue, thisMonthRevenue, totalOrders, avgOrderValue };
  }, [orders]);

  // ── SECTION 2: Sales Over Time (Last 7 Days) ──
  const lineChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const dayName = days[d.getDay()];
      
      const dayRevenue = orders.filter(o => {
        const od = o.created_at?.toDate ? o.created_at.toDate() : new Date(o.created_at);
        od.setHours(0, 0, 0, 0);
        return od.getTime() === d.getTime();
      }).reduce((s, o) => s + Number(o.total || o.price || 0), 0);

      data.push({ name: dayName, revenue: dayRevenue });
    }
    return data;
  }, [orders]);

  // ── SECTION 3: Top Products (Horizontal Bar Chart) ──
  const barChartData = useMemo(() => {
    const products: Record<string, number> = {};
    orders.forEach(o => {
      const title = o.title || (o.items?.[0]?.title) || 'Unknown Item';
      products[title] = (products[title] || 0) + Number(o.total || o.price || 0);
    });

    return Object.entries(products)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  // ── SECTION 4: Recent Orders Table ──
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const da = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at);
        const db = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at);
        return db.getTime() - da.getTime();
      })
      .slice(0, 10);
  }, [orders]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
    </div>
  );

  const isClub = profile?.role === 'CLUB' || profile?.is_verified_merchant;

  return (
    <div className="min-h-screen bg-[#F9F9FB] selection:bg-gray-100 hidden md:flex">
      
      {/* ── Fixed Sidebar ── */}
      <aside className="w-64 h-screen bg-[#FFFFFF] border-r-[0.5px] border-[#E5E5EA] fixed left-0 top-0 flex flex-col z-30">
        <div className="px-6 py-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
             <span className="text-white font-semibold text-[14px]">P</span>
          </div>
          <h1 className="text-[24px] font-bold text-[#1C1C1E] tracking-tight">Pulse</h1>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5">
          <button onClick={() => router.push('/merchant')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <LayoutGrid size={20} />
            <span className="text-sm">Overview</span>
          </button>
          <button onClick={() => router.push('/orders')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Bell size={20} />
            <span className="text-sm">Live Orders</span>
          </button>
          <button onClick={() => router.push('/marketplace')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Package size={20} />
            <span className="text-sm">Products</span>
          </button>
          {isClub && (
            <>
              <button onClick={() => router.push('/merchant/disputes')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <ClipboardList size={20} />
                <span className="text-sm">Log</span>
              </button>
              <button onClick={() => router.push('/me/insights')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white">
                <BarChart3 size={20} />
                <span className="text-sm font-medium">Analytics</span>
              </button>
            </>
          )}
          <button onClick={() => router.push('/me/edit')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Settings size={20} />
            <span className="text-sm">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t-[0.5px] border-[#E5E5EA]">
          <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen bg-white text-slate-900">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-10 py-6 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Merchant Insights</h1>
            <p className="text-xs text-[#1D9E75] font-medium mt-1">Market analytics and performance overview</p>
          </div>
          <div className="flex items-center gap-6">
            <AvatarDropdown photoUrl={profile?.photo_url} userName={profile?.full_name || 'Merchant'} />
          </div>
        </header>

        <div className="p-10 space-y-12">
          
          {/* SECTION 1: Stat Cards */}
          <div className="grid grid-cols-4 gap-6">
            <StatCard title="Total Revenue" value={`RM ${stats.totalRevenue.toFixed(2)}`} subtext="Life-to-date earnings" />
            <StatCard title="This Month" value={`RM ${stats.thisMonthRevenue.toFixed(2)}`} subtext="Current calendar month" />
            <StatCard title="Total Orders" value={stats.totalOrders} subtext="Successful deliveries" />
            <StatCard title="Avg Order Value" value={stats.avgOrderValue === "—" ? "—" : `RM ${stats.avgOrderValue}`} subtext="Revenue per order" />
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* SECTION 2: Sales Over Time */}
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[20px] space-y-8">
              <div>
                <h3 className="text-base font-semibold text-gray-900 uppercase tracking-tight">Sales Over Time</h3>
                <p className="text-[13px] text-[#6B7280] mt-1">Revenue performance for the last 7 days</p>
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: any) => [`RM ${val.toFixed(2)}`, 'Revenue']}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SECTION 3: Top Products */}
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[20px] space-y-8">
              <div>
                <h3 className="text-base font-semibold text-gray-900 uppercase tracking-tight">Top Products</h3>
                <p className="text-[13px] text-[#6B7280] mt-1">Highest revenue generating assets</p>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} width={100} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(val: any) => [`RM ${val.toFixed(2)}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* SECTION 4: Recent Orders Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[20px] overflow-hidden">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 uppercase tracking-tight">Recent Deliveries</h3>
              <p className="text-[13px] text-[#6B7280] mt-1">Last 10 successful fulfillment cycles</p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Order Code</th>
                  <th className="px-8 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Buyer Name</th>
                  <th className="px-8 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Item</th>
                  <th className="px-8 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Amount (RM)</th>
                  <th className="px-8 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentOrders.map((o, idx) => (
                  <tr key={o.id} className={idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}>
                    <td className="px-8 py-5 text-[13px] font-mono font-bold text-slate-400">#{o.id.slice(-6).toUpperCase()}</td>
                    <td className="px-8 py-5 text-[13px] font-bold text-[#111827]">{o.customer_name || 'Student'}</td>
                    <td className="px-8 py-5 text-[13px] font-medium text-[#374151]">{o.title}</td>
                    <td className="px-8 py-5 text-[13px] font-bold text-[#111827]">RM {Number(o.total || o.price || 0).toFixed(2)}</td>
                    <td className="px-8 py-5 text-[11px] font-bold text-[#6B7280]">
                      {o.created_at?.toDate ? o.created_at.toDate().toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-12 text-center text-slate-300 text-[13px] font-medium">No delivered orders found in registry.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </main>
    </div>
  );
}
