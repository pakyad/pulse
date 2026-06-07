'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { 
  LayoutGrid, Bell, Package, ClipboardList, 
  BarChart3, Settings, LogOut 
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';

export default function MerchantAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    last7Days: [] as any[],
    topProducts: [] as any[],
    recentOrders: [] as any[]
  });

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/auth');
        return;
      }

      try {
        const ordersRef = collection(db, 'orders');
        const q = query(
          ordersRef, 
          where('seller_id', '==', user.uid), 
          where('status', '==', 'DELIVERED')
        );
        
        const querySnapshot = await getDocs(q);
        const allOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: (doc.data().created_at as any)?.toDate() || new Date()
        }));

        // Compute Metrics
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let totalRev = 0;
        let monthRev = 0;
        const productMap: Record<string, number> = {};

        allOrders.forEach((order: any) => {
          const amount = Number(order.total || order.price || 0);
          totalRev += amount;

          if (order.created_at.getMonth() === currentMonth && order.created_at.getFullYear() === currentYear) {
            monthRev += amount;
          }

          const title = order.title || 'Unknown Product';
          productMap[title] = (productMap[title] || 0) + amount;
        });

        const totalOrd = allOrders.length;
        const avgVal = totalOrd > 0 ? totalRev / totalOrd : 0;

        // Last 7 Days Revenue
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0,0,0,0);
          const dayName = days[d.getDay()];
          const dayRevenue = allOrders
            .filter((o: any) => {
              const od = new Date(o.created_at);
              od.setHours(0,0,0,0);
              return od.getTime() === d.getTime();
            })
            .reduce((sum, o: any) => sum + Number(o.total || o.price || 0), 0);
          
          last7.push({ day: dayName, revenue: dayRevenue });
        }

        // Top Products
        const topProd = Object.entries(productMap)
          .map(([name, revenue]) => ({ name, revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        // Recent Orders
        const recent = [...allOrders]
          .sort((a: any, b: any) => b.created_at.getTime() - a.created_at.getTime())
          .slice(0, 10);

        setStats({
          totalRevenue: totalRev,
          thisMonthRevenue: monthRev,
          totalOrders: totalOrd,
          avgOrderValue: avgVal,
          last7Days: last7,
          topProducts: topProd,
          recentOrders: recent
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-white border-r border-gray-100 fixed left-0 top-0 flex flex-col z-30">
        <div className="px-6 py-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-sm">P</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Pulse</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <button onClick={() => router.push('/merchant')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <LayoutGrid size={18} /> Overview
          </button>
          <button onClick={() => router.push('/orders')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Bell size={18} /> Live Orders
          </button>
          <button onClick={() => router.push('/marketplace')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Package size={18} /> Products
          </button>
          <button onClick={() => router.push('/merchant/disputes')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <ClipboardList size={18} /> Log
          </button>
          <button onClick={() => router.push('/merchant/analytics')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-gray-900 text-white">
            <BarChart3 size={18} /> Analytics
          </button>
          <button onClick={() => router.push('/me/edit')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Settings size={18} /> Settings
          </button>
        </nav>
        <div className="px-4 pb-6">
          <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 px-6 py-8">
        <p className="text-xs text-[#1D9E75] font-medium mb-1">Merchant Portal</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Analytics</h1>

        {/* SECTION 1 - Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-2">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">RM {stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-2">This Month</p>
            <p className="text-2xl font-bold text-gray-900">RM {stats.thisMonthRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-2">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-2">Avg Order Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.avgOrderValue > 0 ? `RM ${stats.avgOrderValue.toFixed(2)}` : ''}
            </p>
          </div>
        </div>

        {/* SECTION 2 - Revenue Line Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue  Last 7 Days</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94A3B8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`RM ${value.toFixed(2)}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }} 
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION 3 - Top Products Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 12, fill: '#64748B'}}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`RM ${value.toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION 4 - Recent Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Order Code</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentOrders.map((order, idx) => (
                  <tr key={order.id} className={idx % 2 === 1 ? 'bg-gray-50/30' : ''}>
                    <td className="px-4 py-4 font-mono font-bold text-gray-400">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900">{order.title}</td>
                    <td className="px-4 py-4 text-gray-900 font-semibold">
                      RM {Number(order.total || order.price || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {order.created_at.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
                {stats.recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                      No orders found.
                    </td>
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
