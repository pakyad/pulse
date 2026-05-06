import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class MerchantShell extends StatefulWidget {
  const MerchantShell({super.key});

  @override
  State<MerchantShell> createState() => _MerchantShellState();
}

class _MerchantShellState extends State<MerchantShell> {
  int _selectedIndex = 0;
  bool _isStoreOpen = true;

  final List<String> _navItems = ['Overview', 'Order Desk', 'Inventory', 'Ledger'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9FB),
      body: Row(
        children: [
          // ── PERSISTENT SIDEBAR (WEB/TABLET) ──
          Container(
            width: 280,
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(right: BorderSide(color: Color(0xFFF2F2F7), width: 0.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 64),
                // Vendor Profile Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Kelab Bola UniKL',
                        style: TextStyle(
                          color: Color(0xFF1C1C1E),
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(color: Color(0xFF00C4B4), shape: BoxShape.circle),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Institutional Verified',
                            style: TextStyle(color: Color(0xFF8E8E93), fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 48),
                // Navigation Links
                Expanded(
                  child: ListView.builder(
                    itemCount: _navItems.length,
                    itemBuilder: (context, index) {
                      final isActive = _selectedIndex == index;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedIndex = index),
                        child: Container(
                          height: 56,
                          margin: const EdgeInsets.only(bottom: 4),
                          decoration: BoxDecoration(
                            border: Border(
                              left: BorderSide(
                                color: isActive ? const Color(0xFF00C4B4) : Colors.transparent,
                                width: 3,
                              ),
                            ),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              _navItems[index],
                              style: TextStyle(
                                color: isActive ? const Color(0xFF1C1C1E) : const Color(0xFF8E8E93),
                                fontSize: 15,
                                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                // Store Open Toggle at Bottom
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: const BoxDecoration(
                    border: Border(top: BorderSide(color: Color(0xFFF2F2F7), width: 0.5)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Store Open',
                        style: TextStyle(color: Color(0xFF1C1C1E), fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                      CupertinoSwitch(
                        value: _isStoreOpen,
                        activeTrackColor: const Color(0xFF00C4B4),
                        onChanged: (val) => setState(() => _isStoreOpen = val),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── WORKSPACE AREA ──
          Expanded(
            child: IndexedStack(
              index: _selectedIndex,
              children: [
                _OverviewWorkspace(onActionClick: () => setState(() => _selectedIndex = 1)),
                const _OrderDeskWorkspace(),
                const _InventoryWorkspace(),
                const _LedgerWorkspace(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── WORKSPACE 1: OVERVIEW ──
class _OverviewWorkspace extends StatelessWidget {
  final VoidCallback onActionClick;
  const _OverviewWorkspace({required this.onActionClick});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(48),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Dashboard Overview', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Color(0xFF1C1C1E))),
          const SizedBox(height: 32),
          Row(
            children: [
              _OverviewMetric(label: 'Pending Acceptance', value: '3', color: Colors.red, onTap: onActionClick),
              const SizedBox(width: 16),
              _OverviewMetric(label: 'Awaiting Runner', value: '2', color: Colors.orange, onTap: onActionClick),
              const SizedBox(width: 16),
              _OverviewMetric(label: 'Out of Stock', value: '1', color: Colors.grey, onTap: () {}),
            ],
          ),
          const SizedBox(height: 32),
          Row(
            children: const [
              Expanded(child: _PerformanceCard(label: "TODAY'S REVENUE", value: "RM 345.00")),
              SizedBox(width: 16),
              Expanded(child: _PerformanceCard(label: "ITEMS SOLD", value: "18")),
            ],
          ),
          const SizedBox(height: 32),
          const _RevenueTrendChart(),
        ],
      ),
    );
  }
}

// ── WORKSPACE 2: ORDER DESK ──
class _OrderDeskWorkspace extends StatelessWidget {
  const _OrderDeskWorkspace();

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Order Desk', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Color(0xFF1C1C1E))),
                TextButton(
                  onPressed: () {},
                  child: const Text('Bulk Accept', style: TextStyle(color: Color(0xFF00C4B4), fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 32),
            const TabBar(
              isScrollable: true,
              labelColor: Color(0xFF1C1C1E),
              unselectedLabelColor: Color(0xFF8E8E93),
              indicatorColor: Color(0xFF00C4B4),
              labelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              tabs: [
                Tab(text: 'Pending (3)'),
                Tab(text: 'Preparing (0)'),
                Tab(text: 'In Transit (2)'),
                Tab(text: 'Completed'),
              ],
            ),
            const SizedBox(height: 24),
            Expanded(
              child: TabBarView(
                children: [
                  ListView(
                    children: const [
                      _OrderItem(id: 'TX8829', item: 'Nasi Lemak Ayam', buyer: 'Muhaimin', price: 'RM 8.50'),
                      _OrderItem(id: 'TX8830', item: 'Iced Milo', buyer: 'Iyad', price: 'RM 3.00'),
                      _OrderItem(id: 'TX8831', item: 'Curry Puff x3', buyer: 'Sarah', price: 'RM 2.50'),
                    ],
                  ),
                  const Center(child: Text('No orders in preparation')),
                  const Center(child: Text('Orders in transit')),
                  const Center(child: Text('Order history')),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── WORKSPACE 3: INVENTORY ──
class _InventoryWorkspace extends StatelessWidget {
  const _InventoryWorkspace();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(48),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Inventory Registry', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Color(0xFF1C1C1E))),
          const SizedBox(height: 32),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: DataTable(
                  headingRowColor: WidgetStateProperty.all(const Color(0xFFF9F9FB)),
                  columns: const [
                    DataColumn(label: Text('Product Name', style: TextStyle(fontWeight: FontWeight.w700))),
                    DataColumn(label: Text('Category', style: TextStyle(fontWeight: FontWeight.w700))),
                    DataColumn(label: Text('Price', style: TextStyle(fontWeight: FontWeight.w700))),
                    DataColumn(label: Text('Stock', style: TextStyle(fontWeight: FontWeight.w700))),
                    DataColumn(label: Text('Status', style: TextStyle(fontWeight: FontWeight.w700))),
                  ],
                  rows: [
                    _inventoryRow('Nasi Lemak Ayam', 'Food', 'RM 8.50', '24', true),
                    _inventoryRow('Iced Milo', 'Drinks', 'RM 3.00', '99+', true),
                    _inventoryRow('Curry Puff', 'Snacks', 'RM 1.00', '0', false),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  DataRow _inventoryRow(String name, String cat, String price, String stock, bool isActive) {
    return DataRow(cells: [
      DataCell(Text(name)),
      DataCell(Text(cat)),
      DataCell(Text(price)),
      DataCell(Text(stock)),
      DataCell(CupertinoSwitch(value: isActive, activeTrackColor: const Color(0xFF00C4B4), onChanged: (v) {})),
    ]);
  }
}

// ── WORKSPACE 4: LEDGER ──
class _LedgerWorkspace extends StatelessWidget {
  const _LedgerWorkspace();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(48),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Financial Ledger', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Color(0xFF1C1C1E))),
          const SizedBox(height: 32),
          Row(
            children: const [
              Expanded(child: _PerformanceCard(label: "AVAILABLE BALANCE", value: "RM 1,240.50")),
              SizedBox(width: 16),
              Expanded(child: _PerformanceCard(label: "PENDING CLEARING", value: "RM 185.00")),
            ],
          ),
        ],
      ),
    );
  }
}

// ── SHARED COMPONENTS ──

class _OverviewMetric extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final VoidCallback onTap;
  const _OverviewMetric({required this.label, required this.value, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: TextStyle(color: color, fontSize: 32, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(label, style: const TextStyle(color: Color(0xFF1C1C1E), fontSize: 13, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}

class _PerformanceCard extends StatelessWidget {
  final String label;
  final String value;
  const _PerformanceCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
          const SizedBox(height: 12),
          Text(value, style: const TextStyle(color: Color(0xFF1C1C1E), fontSize: 28, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _OrderItem extends StatelessWidget {
  final String id;
  final String item;
  final String buyer;
  final String price;
  const _OrderItem({required this.id, required this.item, required this.buyer, required this.price});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(item, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 4),
              Text('$id • $buyer', style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 13)),
            ],
          ),
          Row(
            children: [
              Text(price, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(width: 24),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1C1C1E),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Accept', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RevenueTrendChart extends StatelessWidget {
  const _RevenueTrendChart();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 300,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('7-Day Revenue Trend', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 32),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: [
                      const FlSpot(0, 3),
                      const FlSpot(1, 1),
                      const FlSpot(2, 4),
                      const FlSpot(3, 2),
                      const FlSpot(4, 5),
                      const FlSpot(5, 3),
                      const FlSpot(6, 4)
                    ],
                    isCurved: true,
                    color: const Color(0xFF00C4B4),
                    barWidth: 3,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(show: true, color: const Color(0xFF00C4B4).withValues(alpha: 0.05)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
