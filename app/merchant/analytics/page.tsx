"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { 
  LayoutGrid, Bell, Package, ClipboardList, 
  BarChart3, Settings, LogOut, Trophy, ChevronRight, Search
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';

export default function MerchantAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7D' | '30D'>('7D');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    trendData: [] as any[],
    topProducts: [] as any[],
    breakdown: [] as any[],
    bestSeller: null as any,
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
          where('seller_id', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const allOrders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: (doc.data().created_at as any)?.toDate() || new Date()
        }));

        const deliveredOrders = allOrders.filter((o: any) => o.status === 'DELIVERED' || o.status === 'COMPLETED');

        // Compute Metrics
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let totalRev = 0;
        let monthRev = 0;
        const productMap: Record<string, { name: string, revenue: number, units: number }> = {};

        deliveredOrders.forEach((order: any) => {
          const amount = Number(order.total || order.price || 0);
          totalRev += amount;

          if (order.created_at >= startOfMonth) {
            monthRev += amount;
          }

          const title = order.title || 'Unknown Item';
          if (!productMap[title]) productMap[title] = { name: title, revenue: 0, units: 0 };
          productMap[title].revenue += amount;
          productMap[title].units += 1;
        });

        const totalOrd = deliveredOrders.length;
        const avgVal = totalOrd > 0 ? totalRev / totalOrd : 0;

        // Trend Data
        const daysToFetch = timeRange === '7D' ? 7 : 30;
        const trend = [];
        for (let i = daysToFetch - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0,0,0,0);
          const label = d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
          const dayRevenue = deliveredOrders
            .filter((o: any) => {
              const od = new Date(o.created_at);
              od.setHours(0,0,0,0);
              return od.getTime() === d.getTime();
            })
            .reduce((sum, o: any) => sum + Number(o.total || o.price || 0), 0);
          
          trend.push({ name: label, revenue: dayRevenue });
        }

        // Breakdown
        const pendingCount = allOrders.filter((o: any) => !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.status)).length;
        const cancelledCount = allOrders.filter((o: any) => o.status === 'CANCELLED').length;
        const breakdown = [
          { name: 'Delivered', value: totalOrd, fill: '#111827' },
          { name: 'Pending', value: pendingCount, fill: '#d1d5db' },
          { name: 'Cancelled', value: cancelledCount, fill: '#f3f4f6' }
        ];

        // Top Products
        const topProd = Object.values(productMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        // Best Seller
        const best = Object.values(productMap)
          .sort((a, b) => b.units - a.units)[0] || null;

        // Recent Orders
        const recent = [...allOrders]
          .sort((a: any, b: any) => b.created_at.getTime() - a.created_at.getTime())
          .slice(0, 10);

        setStats({
          totalRevenue: totalRev,
          thisMonthRevenue: monthRev,
          totalOrders: totalOrd,
          avgOrderValue: avgVal,
          trendData: trend,
          topProducts: topProd,
          breakdown,
          bestSeller: best,
          recentOrders: recent
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9FB]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex font-sans antialiased">
      
      {/* Sidebar */}
      <aside className="w-64 h-screen bg-white border-r-[0.5px] border-[#E5E5EA] fixed left-0 top-0 flex flex-col z-30">
        <div className="px-6 py-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-[14px]">P</span>
          </div>
          <h1 className="text-[24px] font-bold text-[#1C1C1E] tracking-tight">Pulse</h1>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1.5">
          <button onClick={() => router.push('/merchant')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
            <LayoutGrid size={18} />
            <span>Overview</span>
          </button>
          <button onClick={() => router.push('/orders')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
            <Bell size={18} />
            <span>Live Orders</span>
          </button>
          <button onClick={() => router.push('/merchant')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
            <Package size={18} />
            <span>Inventory</span>
          </button>
          <button onClick={() => router.push('/merchant')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
            <ClipboardList size={18} />
            <span>Order Log</span>
          </button>
          <button onClick={() => router.push('/merchant/analytics')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-gray-900 text-white font-medium shadow-sm transition-all">
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>
          <button onClick={() => router.push('/merchant')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium">
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>
        <div className="p-4 border-t-[0.5px] border-[#E5E5EA]">
          <button onClick={() => { auth.signOut(); router.push('/auth'); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 px-6 py-8">
        <div className="mb-8">
          <p className="text-xs text-[#1D9E75] font-medium mb-1">Merchant Portal</p>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-xs text-gray-500 mt-1">Your store performance at a glance</p>
        </div>

        {/* SECTION 1 - Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-5 border border-transparent hover:border-gray-200 transition-all">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-2">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">RM {stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5 border border-transparent hover:border-gray-200 transition-all">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-2">This Month</p>
            <p className="text-2xl font-bold text-gray-900">RM {stats.thisMonthRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5 border border-transparent hover:border-gray-200 transition-all">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-2">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5 border border-transparent hover:border-gray-200 transition-all">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium mb-2">Avg Order Value</p>
            <p className="text-2xl font-bold text-gray-900">RM {stats.avgOrderValue.toFixed(2)}</p>
          </div>
        </div>

        {/* SECTION 2 - Two Column Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-900">Revenue Trend</h3>
              <div className="flex bg-gray-50 p-1 rounded-full">
                <button 
                  onClick={() => setTimeRange('7D')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${timeRange === '7D' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >7D</button>
                <button 
                  onClick={() => setTimeRange('30D')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${timeRange === '30D' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >30D</button>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(v: any) => [`RM ${v.toFixed(2)}`, 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 0, fill: '#111827' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-6">Orders</h3>
            <div className="h-[180px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.breakdown} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {stats.breakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} cornerRadius={4} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-lg font-bold text-gray-900 leading-none">{stats.totalOrders}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">Orders</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {stats.breakdown.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.fill }} />
                    <span className="text-gray-500 font-medium">{s.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3 - Two Column Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-6">Top Products</h3>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={130} axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#4b5563', fontWeight: 500}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(v: any) => [`RM ${v.toFixed(2)}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#111827" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 mb-4">
              <Trophy size={32} className="text-amber-400" />
            </div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Best Seller</h3>
            {stats.bestSeller ? (
              <>
                <p className="text-xl font-bold text-gray-900 tracking-tight px-4">{stats.bestSeller.name}</p>
                <p className="text-sm text-gray-500 font-medium mt-1">{stats.bestSeller.units} units sold</p>
                <p className="text-2xl font-bold text-[#1D9E75] mt-4">RM {stats.bestSeller.revenue.toFixed(2)}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400 italic">No sales yet</p>
            )}
          </div>
        </div>

        {/* SECTION 4 - Recent Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-6">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-6 py-4 font-bold">Order Code</th>
                  <th className="px-6 py-4 font-bold">Item</th>
                  <th className="px-6 py-4 font-bold">Buyer</th>
                  <th className="px-6 py-4 font-bold">Amount</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentOrders.map((order: any, idx: number) => (
                  <tr key={order.id} className={idx % 2 === 1 ? 'bg-gray-50/20' : 'bg-white hover:bg-gray-50/50 transition-colors'}>
                    <td className="px-6 py-4 font-mono font-bold text-gray-400 uppercase">
                      #{order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">{order.title}</td>
                    <td className="px-6 py-4 font-medium text-gray-600">{order.customer_name || 'Student'}</td>
                    <td className="px-6 py-4 text-gray-900 font-bold">
                      RM {Number(order.total || order.price || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      {order.created_at.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'DELIVERED' || order.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
