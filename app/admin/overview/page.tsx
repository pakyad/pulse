"use client";

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, limit as fLimit, orderBy } from 'firebase/firestore';
import { Users, ShoppingBag, ShieldAlert, TrendingUp, Package, Star, Lock, CheckCircle, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMIC: '#3B82F6',
  HOSTEL: '#10B981',
  TECH: '#F59E0B',
  APPAREL: '#8B5CF6',
  SERVICES: '#EC4899',
};

const CATEGORY_LABELS: Record<string, string> = {
  ACADEMIC: 'Academic',
  HOSTEL: 'Hostel',
  TECH: 'Tech',
  APPAREL: 'Apparel',
  SERVICES: 'Services',
};

const PIE_COLORS = { approved: '#10B981', rejected: '#EF4444', freeMarket: '#9CA3AF' };

const VALID_NODES = new Set([
  'Ground Floor Lobby',
  'Level 4 Teater Perdana',
  'Level 8 Database Labs',
  'Level 12 UI/UX Mac Labs',
  'Level 14 Student Cafe',
  'Level 20 Library',
  'Main Guardhouse Gate (RAH)',
]);

function statCard(label: string, value: string | number, loading: boolean) {
  return (
    <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      {loading ? (
        <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
      ) : (
        <p className="text-[18px] font-bold text-slate-900 leading-none">{value}</p>
      )}
    </div>
  );
}

function section(title: string, subtitle: string, children: React.ReactNode, id?: string) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
      <div>
        <h2 className="text-[16px] font-bold text-slate-900">{title}</h2>
        <p className="text-[12px] text-slate-400 mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export default function OverviewPage() {
  const [stats, setStats] = useState({
    totalUsers: 0, totalItems: 0, activeDisputes: 0,
    flaggedItems: 0, totalMerchants: 0, totalRunners: 0, totalLocked: 0,
  });
  const [loading, setLoading] = useState(true);

  // Section 1
  const [economy, setEconomy] = useState({ gmv: 0, orderCount: 0, sellerIds: new Set<string>() });
  const [activeListings, setActiveListings] = useState(0);

  // Section 2
  const [pcsSavings, setPcsSavings] = useState({ totalSavings: 0, count: 0 });
  const [pcsLoading, setPcsLoading] = useState(true);

  // Section 3
  const [catOrders, setCatOrders] = useState<Record<string, number>>({});
  const [catLoading, setCatLoading] = useState(true);

  // Section 4
  const [pcsDecisions, setPcsDecisions] = useState({ approved: 0, rejected: 0, freeMarket: 0 });
  const [pcsDecLoading, setPcsDecLoading] = useState(true);

  // Section 5
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [sellerLoading, setSellerLoading] = useState(true);

  // Section 6
  const [runnerStats, setRunnerStats] = useState({ deliveries: 0, earnings: 0, nodeCounts: {} as Record<string, number>, activeRunners: 0 });
  const [runnerLoading, setRunnerLoading] = useState(true);

  // Section 7
  const [pcsAudit, setPcsAudit] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  const [navShadow, setNavShadow] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavShadow(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Existing listeners ──────────────────────────────────────────────
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const users = snap.docs.map(d => d.data());
      setStats(prev => ({
        ...prev, totalUsers: users.length,
        totalMerchants: users.filter(u => u.is_seller).length,
        totalRunners: users.filter(u => u.is_verified_runner || u.role === 'RUNNER').length,
      }));
      setLoading(false);
    });
    const unsubItems = onSnapshot(collection(db, 'items'), (snap) => {
      setStats(prev => ({ ...prev, totalItems: snap.size }));
    });
    const unsubFlagged = onSnapshot(
      query(collection(db, 'items'), where('is_price_flagged', '==', true)),
      (snap) => setStats(prev => ({ ...prev, flaggedItems: snap.size }))
    );
    const unsubDisputes = onSnapshot(
      query(collection(db, 'disputes'), where('status', '==', 'AWAITING_ADMIN')),
      (snap) => setStats(prev => ({ ...prev, activeDisputes: snap.size }))
    );
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), where('status', 'in', ['DELIVERED', 'COMPLETED'])),
      (snap) => {
        let locked = 0;
        snap.forEach(d => {
          const o = d.data();
          if (o.status === 'DELIVERED' && o.escrow_status !== 'RELEASED') {
            const mTotal = Number(o.item_total || o.items_total || 0);
            const rFee = Number(o.runner_fee || o.delivery_fee || 0);
            const orderTotal = Number(o.grand_total || o.total || o.price || 0);
            const sum = mTotal + rFee;
            locked += sum > 0 ? sum : orderTotal;
          }
        });
        setStats(prev => ({ ...prev, totalLocked: locked }));
      }
    );
    return () => { unsubUsers(); unsubItems(); unsubFlagged(); unsubDisputes(); unsubOrders(); };
  }, []);

  // ── Section 1: Economy (active listings, delivered orders) ──────────
  useEffect(() => {
    const unsubActive = onSnapshot(
      query(collection(db, 'items'), where('status', '==', 'ACTIVE')),
      (snap) => setActiveListings(snap.size)
    );
    const unsubDelivered = onSnapshot(
      query(collection(db, 'orders'), where('status', '==', 'DELIVERED')),
      (snap) => {
        let gmv = 0;
        const ids = new Set<string>();
        snap.forEach(d => {
          const o = d.data();
          gmv += Number(o.total || o.grand_total || o.item_total || 0);
          if (o.seller_id) ids.add(o.seller_id);
        });
        setEconomy({ gmv, orderCount: snap.size, sellerIds: ids });
      }
    );
    return () => { unsubActive(); unsubDelivered(); };
  }, []);

  // ── Section 2: PCS Savings ─────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'items'), where('pcs_certified', '==', true)),
      (snap) => {
        let total = 0;
        let count = 0;
        snap.forEach(d => {
          const item = d.data();
          const result = item.pcs_result;
          if (result?.marketPrice) {
            const saving = Number(result.marketPrice) - Number(item.price || 0);
            if (saving > 0) { total += saving; count++; }
          }
        });
        setPcsSavings({ totalSavings: total, count });
        setPcsLoading(false);
      },
      () => setPcsLoading(false)
    );
    return () => unsub();
  }, []);

  // ── Section 3: Sales by Category ───────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'orders'), where('status', '==', 'DELIVERED')),
      (snap) => {
        const counts: Record<string, number> = {};
        snap.forEach(d => {
          const o = d.data();
          const cat = o.category || o.item_category || 'OTHER';
          counts[cat] = (counts[cat] || 0) + 1;
        });
        setCatOrders(counts);
        setCatLoading(false);
      },
      () => setCatLoading(false)
    );
    return () => unsub();
  }, []);

  // ── Section 4: PCS Decisions ───────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'items'), (snap) => {
      let approved = 0, rejected = 0, freeMarket = 0;
      snap.forEach(d => {
        const item = d.data();
        if (item.pcs_certified === true) approved++;
        else if (item.status === 'FLAGGED_FOR_REVIEW') rejected++;
        else freeMarket++;
      });
      setPcsDecisions({ approved, rejected, freeMarket });
      setPcsDecLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Section 5: Top Sellers ─────────────────────────────────────────
  useEffect(() => {
    const unsubOrders = onSnapshot(
      query(collection(db, 'orders'), where('status', '==', 'DELIVERED')),
      (snap) => {
        const sellerMap = new Map<string, { count: number; total: number }>();
        snap.forEach(d => {
          const o = d.data();
          const sid = o.seller_id;
          if (!sid) return;
          const cur = sellerMap.get(sid) || { count: 0, total: 0 };
          cur.count++;
          cur.total += Number(o.total || o.grand_total || o.item_total || 0);
          sellerMap.set(sid, cur);
        });

        const sorted = [...sellerMap.entries()]
          .map(([id, data]) => ({ sellerId: id, ...data }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);

        if (sorted.length === 0) { setTopSellers([]); setSellerLoading(false); return; }

        Promise.all(sorted.map(async (s) => {
          try {
            const { doc, getDoc } = await import('firebase/firestore');
            const snap = await getDoc(doc(db, 'users', s.sellerId));
            const profile = snap.data();
            return { ...s, fullName: profile?.fullName || profile?.displayName || 'Unknown', programme: profile?.programme || '', trustRating: profile?.trustRating || 0 };
          } catch { return { ...s, fullName: 'Unknown', programme: '', trustRating: 0 }; }
        })).then(setTopSellers);
        setSellerLoading(false);
      },
      () => setSellerLoading(false)
    );
    return () => unsubOrders();
  }, []);

  // ── Section 6: Runner Network ──────────────────────────────────────
  useEffect(() => {
    const unsubDeliveries = onSnapshot(
      query(collection(db, 'orders'), where('status', '==', 'DELIVERED')),
      (snap) => {
        let deliveries = 0, earnings = 0;
        const nodeCounts: Record<string, number> = {};
        snap.forEach(d => {
          const o = d.data();
          if (o.delivery_type === 'RUNNER') {
            deliveries++;
            earnings += Number(o.runner_fee || 3.50);
          }
          const loc = o.drop_off_location || o.handover_node || null;
          if (loc && VALID_NODES.has(loc)) nodeCounts[loc] = (nodeCounts[loc] || 0) + 1;
        });
        setRunnerStats(prev => ({ ...prev, deliveries, earnings, nodeCounts }));
      }
    );
    const unsubRunners = onSnapshot(collection(db, 'users'), (snap) => {
      const count = snap.docs.filter(d => {
        const u = d.data();
        return u.is_verified_runner || u.role === 'RUNNER' || u.runner_status === 'approved';
      }).length;
      setRunnerStats(prev => ({ ...prev, activeRunners: count }));
      setRunnerLoading(false);
    });
    return () => { unsubDeliveries(); unsubRunners(); };
  }, []);

  // ── Section 7: PCS Audit Log ───────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'items'), where('pcs_result', '!=', null), fLimit(10)),
      (snap) => {
        const list: any[] = [];
        snap.forEach(d => {
          const item = d.data();
          if (item.pcs_result) list.push({ id: d.id, ...item });
        });
        list.sort((a, b) => {
          const ta = a.pcs_result?.checkedAt || a.createdAt || '';
          const tb = b.pcs_result?.checkedAt || b.createdAt || '';
          return tb > ta ? 1 : -1;
        });
        setPcsAudit(list.slice(0, 10));
        setAuditLoading(false);
      },
      () => setAuditLoading(false)
    );
    return () => unsub();
  }, []);

  const gmv = economy.gmv;
  const orderCount = economy.orderCount;
  const avgOrder = orderCount > 0 ? gmv / orderCount : 0;
  const totalSavings = pcsSavings.totalSavings;
  const pcsCount = pcsSavings.count;
  const avgSaving = pcsCount > 0 ? totalSavings / pcsCount : 0;

  const catChartData = ['ACADEMIC', 'HOSTEL', 'TECH', 'APPAREL', 'SERVICES'].map(c => ({
    name: CATEGORY_LABELS[c] || c,
    orders: catOrders[c] || 0,
    fill: CATEGORY_COLORS[c] || '#9CA3AF',
  }));

  const pieData = [
    { name: 'Approved', value: pcsDecisions.approved, color: PIE_COLORS.approved },
    { name: 'Rejected', value: pcsDecisions.rejected, color: PIE_COLORS.rejected },
    { name: 'Free Market', value: pcsDecisions.freeMarket, color: PIE_COLORS.freeMarket },
  ];
  const totalEval = pcsDecisions.approved + pcsDecisions.rejected + pcsDecisions.freeMarket;

  const rankColors = ['bg-yellow-400', 'bg-gray-300', 'bg-amber-600', 'bg-slate-200', 'bg-slate-200'];
  const rankTextColors = ['text-yellow-900', 'text-gray-700', 'text-amber-900', 'text-slate-500', 'text-slate-500'];

  const sortedNodes = Object.entries(runnerStats.nodeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const mostUsedNode = sortedNodes[0]?.[0] || '—';

  const cards = [
    { label: 'System Liquidity', value: `RM ${stats.totalLocked.toFixed(2)}`, icon: Lock },
    { label: 'Active Listings', value: stats.totalItems, icon: ShoppingBag },
    { label: 'Pending Reviews', value: stats.flaggedItems, icon: ShieldAlert },
    { label: 'Open Disputes', value: stats.activeDisputes, icon: TrendingUp },
    { label: 'Active Merchants', value: stats.totalMerchants, icon: Package },
    { label: 'Verified Runners', value: stats.totalRunners, icon: Star },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] w-full">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 mb-1">Pulse Platform</p>
        <h1 className="text-[24px] font-semibold text-slate-900 tracking-tight">System Overview</h1>
      </div>

      {/* Jump To Nav */}
      <div className={`sticky top-0 z-[50] bg-white border-b border-[#E5E7EB] -mx-6 px-6 py-3 transition-shadow ${navShadow ? 'shadow-[0_2px_8px_rgba(0,0,0,0.06)]' : 'shadow-none'}`}>
        <div className="flex flex-wrap gap-2">
          {[
            ['#economy', 'Economy'], ['#savings', 'Savings'], ['#categories', 'Categories'],
            ['#pcs-analytics', 'PCS Analytics'], ['#leaderboard', 'Leaderboard'],
            ['#runners', 'Runners'], ['#audit-log', 'Audit Log'],
          ].map(([href, label]) => (
            <a key={label} href={href}
              className="px-4 h-8 rounded-full bg-white border border-slate-100 text-[11px] font-semibold text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all flex items-center shadow-sm">
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Health Status */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Health Status</h2>
          <p className="text-[12px] text-slate-400 mt-1">Real-time operational snapshot.</p>
        </div>
        <div className={`p-5 rounded-xl border flex items-center justify-between ${
          stats.activeDisputes > 0 || stats.flaggedItems > 0
            ? 'bg-red-50 border-red-100 text-red-900'
            : 'bg-emerald-50 border-emerald-100 text-emerald-900'
        }`}>
          <div>
            <p className="text-[13px] font-bold">
              {stats.activeDisputes > 0 || stats.flaggedItems > 0 ? 'Attention Needed' : 'All Systems Normal'}
            </p>
            <p className="text-[11px] font-medium mt-0.5 opacity-80">
              {stats.activeDisputes > 0 || stats.flaggedItems > 0
                ? `${stats.activeDisputes} disputes and ${stats.flaggedItems} flagged listings require action.`
                : 'Marketplace operations are running smoothly.'
              }
            </p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
             {stats.activeDisputes > 0 || stats.flaggedItems > 0
               ? <ShieldAlert size={20} className="text-red-500" />
               : <CheckCircle size={20} className="text-emerald-500" />
             }
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">Key Metrics</h2>
          <p className="text-[12px] text-slate-400 mt-1">Platform adoption and financial liquidity.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400">{card.label}</p>
                <card.icon size={14} className="text-slate-300" />
              </div>
              {loading ? (
                <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
              ) : (
                <p className="text-[18px] font-bold text-slate-900 leading-none">{card.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 1: UniKL Student Economy ──────────────────────────── */}
      {section('UniKL Student Economy', 'Real-time marketplace intelligence across all student transactions', (
        <>
          <div className="grid grid-cols-3 gap-4">
            {statCard('Total GMV', `RM ${gmv.toFixed(2)}`, loading)}
            {statCard('Total Orders', orderCount, loading)}
            {statCard('Avg Order Value', `RM ${avgOrder.toFixed(2)}`, loading)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {statCard('Registered Students', stats.totalUsers, loading)}
            {statCard('Student Sellers', economy.sellerIds.size, loading)}
            {statCard('Campus Listings', activeListings, loading)}
          </div>
        </>
      ), 'economy')}

      {/* ── SECTION 2: Student Savings ────────────────────────────────── */}
      <div id="savings" className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-8 space-y-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#166534]">💰 Student Savings vs Open Market</h2>
          <p className="text-[13px] text-[#15803D] mt-1">Total money saved by UniKL students compared to Shopee &amp; Lazada prices — powered by Claude AI.</p>
        </div>
        {pcsLoading ? (
          <div className="h-16 w-48 bg-green-200 rounded animate-pulse" />
        ) : (
          <>
            <div className="text-[48px] font-semibold text-[#16A34A] leading-none">
              RM {totalSavings.toFixed(2)}
            </div>
            <p className="text-[14px] font-medium text-[#15803D]">saved by UniKL students vs open market prices</p>
            <div className="flex gap-3">
              <span className="px-3 py-1.5 bg-[#DCFCE7] rounded-full text-[11px] font-semibold text-[#15803D]">
                Across {pcsCount} verified listings
              </span>
              <span className="px-3 py-1.5 bg-[#DCFCE7] rounded-full text-[11px] font-semibold text-[#15803D]">
                Avg saving: RM {avgSaving.toFixed(2)} per item
              </span>
            </div>
            <p className="text-[11px] text-[#86EFAC] font-medium">Prices verified by Claude AI against live Shopee &amp; Lazada data</p>
          </>
        )}
      </div>

      {/* ── SECTION 3: Sales by Category ──────────────────────────────── */}
      {section('Sales by Category', 'Transaction volume breakdown across marketplace categories', (
        catLoading ? (
          <div className="h-[280px] bg-slate-50 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={catChartData} layout="vertical" margin={{ left: 20, right: 40 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                formatter={(val: number) => [val, 'Orders']}
              />
              <Bar dataKey="orders" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 11, fill: '#6B7280', fontWeight: 600 }}>
                {catChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )
      ), 'categories')}

      {/* ── SECTION 4: PCS Decision Analytics ─────────────────────────── */}
      {section('AI Price Governance', 'Claude API decision breakdown across all listing attempts', (
        pcsDecLoading ? (
          <div className="h-[260px] bg-slate-50 rounded-xl animate-pulse" />
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="relative">
              <ResponsiveContainer width={260} height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={2}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-[18px] font-bold text-slate-900">{totalEval}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[11px] font-bold">✓</span>
                <span className="text-[13px] font-medium text-slate-700">{pcsDecisions.approved} Approved — Live on marketplace</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-red-50 rounded-xl border border-red-100">
                <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-[11px] font-bold">✗</span>
                <span className="text-[13px] font-medium text-slate-700">{pcsDecisions.rejected} Rejected — Price too high</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-6 h-6 rounded-full bg-slate-400 flex items-center justify-center text-white text-[11px] font-bold">○</span>
                <span className="text-[13px] font-medium text-slate-700">{pcsDecisions.freeMarket} Free Market — No PCS required</span>
              </div>
            </div>
          </div>
        )
      ), 'pcs-analytics')}

      {/* ── SECTION 5: Top Student Sellers ────────────────────────────── */}
      {section('Top Student Entrepreneurs', 'Most active sellers ranked by completed sales', (
        sellerLoading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : topSellers.length === 0 ? (
          <p className="text-[13px] font-medium text-slate-400 text-center py-8">No completed sales data yet.</p>
        ) : (
          <div className="space-y-3">
            {topSellers.map((s, i) => (
              <div key={s.sellerId} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full ${rankColors[i]} ${rankTextColors[i]} flex items-center justify-center text-[12px] font-bold shrink-0`}>
                    {i + 1}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-[13px] font-bold shrink-0">
                    {(s.fullName || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900 leading-tight">{s.fullName}</p>
                    <p className="text-[11px] font-medium text-slate-400 truncate max-w-[160px]">{s.programme || '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-emerald-600">RM {s.total.toFixed(2)}</p>
                  <p className="text-[11px] font-medium text-slate-400">{s.count} items sold</p>
                  {s.trustRating > 0 && <p className="text-[11px] text-amber-500">⭐ {s.trustRating}</p>}
                </div>
              </div>
            ))}
          </div>
        )
      ), 'leaderboard')}

      {/* ── SECTION 6: Runner Network ─────────────────────────────────── */}
      {section('Pulse Runner Network', 'Campus delivery infrastructure performance', (
        runnerLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {statCard('Total Deliveries', runnerStats.deliveries, false)}
              {statCard('Runner Earnings', `RM ${runnerStats.earnings.toFixed(2)}`, false)}
              {statCard('Active Runners', runnerStats.activeRunners, false)}
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <p className="text-[10px] font-bold text-slate-400">Most Used Node</p>
                <p className="text-[18px] font-bold text-slate-900 leading-none flex items-center gap-2">
                  <MapPin size={16} className="text-slate-400" /> {mostUsedNode}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-400 mb-3">Handover Node Usage</p>
              {sortedNodes.length === 0 ? (
                <p className="text-[12px] font-medium text-slate-400 text-center py-6">No delivery data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sortedNodes.map(([name, count]) => ({ name, count }))} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={160} />
                    <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} label={{ position: 'right', fontSize: 11, fill: '#6B7280' }} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )
      ), 'runners')}

      {/* ── SECTION 7: PCS Audit Log ──────────────────────────────────── */}
      {section('Recent AI Price Decisions', 'Latest Claude API evaluations — full governance trail', (
        auditLoading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-50 rounded-lg animate-pulse" />)}
          </div>
        ) : pcsAudit.length === 0 ? (
          <p className="text-[13px] font-medium text-slate-400 text-center py-8">No PCS evaluations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-400">Item</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-400">Category</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-400">Listed</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-400">Market</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-400">Saving</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-400">Decision</th>
                  <th className="px-4 py-3 text-[10px] font-semibold text-slate-400">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pcsAudit.map((item, i) => {
                  const title = (item.title || item.name || 'Unknown').slice(0, 25);
                  const listed = Number(item.price || 0);
                  const market = item.pcs_result?.marketPrice || 0;
                  const saving = market > 0 ? market - listed : 0;
                  const approved = item.pcs_certified === true;
                  const justification = item.pcs_result?.justification || '';
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/30 transition-colors ${i % 2 === 1 ? 'bg-slate-50/20' : ''}`}>
                      <td className="px-4 py-3 text-[12px] font-medium text-slate-900">{title}{(item.title || '').length > 25 ? '…' : ''}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">{item.subcategory || '—'}</td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-slate-700">RM {listed.toFixed(2)}</td>
                      <td className="px-4 py-3 text-[12px] text-slate-500">{market > 0 ? `RM ${Number(market).toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-emerald-600">{saving > 0 ? `RM ${saving.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${approved ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {approved ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-400 max-w-[160px]" title={justification}>
                        {justification ? justification.slice(0, 50) + (justification.length > 50 ? '…' : '') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ), 'audit-log')}
    </div>
  );
}
