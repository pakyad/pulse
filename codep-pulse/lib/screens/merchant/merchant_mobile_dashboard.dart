import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class MerchantMobileDashboard extends StatefulWidget {
  const MerchantMobileDashboard({super.key});

  @override
  State<MerchantMobileDashboard> createState() => _MerchantMobileDashboardState();
}

class _MerchantMobileDashboardState extends State<MerchantMobileDashboard> {
  int _bottomNavIndex = 0;
  bool _isStoreOpen = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9FB),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(80),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(bottom: BorderSide(color: Color(0xFFF2F2F7), width: 0.5)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 48, 20, 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Text(
                    'Kelab Bola UniKL',
                    style: TextStyle(color: Color(0xFF1C1C1E), fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: -0.5),
                  ),
                  Text(
                    'Institutional Vendor',
                    style: TextStyle(color: Color(0xFF8E8E93), fontSize: 10, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
              CupertinoSwitch(
                value: _isStoreOpen,
                activeTrackColor: const Color(0xFF00C4B4),
                onChanged: (val) => setState(() => _isStoreOpen = val),
              ),
            ],
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 24),

            // ── A. ACTION REQUIRED (HORIZONTAL SCROLL) ──
            const _SectionTitle(title: 'Action Required'),
            const SizedBox(height: 16),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              clipBehavior: Clip.none,
              child: Row(
                children: const [
                  _ActionCard(count: '3', label: 'Pending', color: Colors.red),
                  SizedBox(width: 12),
                  _ActionCard(count: '2', label: 'Awaiting Runner', color: Colors.orange),
                  SizedBox(width: 12),
                  _ActionCard(count: '1', label: 'Out of Stock', color: Color(0xFF8E8E93)),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── B. TODAY'S PERFORMANCE (2-COLUMN GRID) ──
            Row(
              children: const [
                Expanded(child: _MetricCard(label: 'REVENUE', value: 'RM 0.00')),
                SizedBox(width: 12),
                Expanded(child: _MetricCard(label: 'ITEMS SOLD', value: '0')),
              ],
            ),

            const SizedBox(height: 24),

            // ── C. QUICK ACTION FEED ──
            const _SectionTitle(title: 'Incoming Orders'),
            const SizedBox(height: 16),
            const _QuickOrderCard(id: '102', item: 'Club Jersey', time: 'Just now', price: 'RM 45.00'),
            const SizedBox(height: 12),
            const _QuickOrderCard(id: '101', item: 'Tracksuit XL', time: '5m ago', price: 'RM 35.00'),
            
            const SizedBox(height: 100), // Bottom padding
          ],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFF2F2F7), width: 0.5)),
        ),
        child: BottomNavigationBar(
          currentIndex: _bottomNavIndex,
          onTap: (i) => setState(() => _bottomNavIndex = i),
          backgroundColor: Colors.white,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedFontSize: 10,
          unselectedFontSize: 10,
          selectedItemColor: const Color(0xFF1C1C1E),
          unselectedItemColor: const Color(0xFF8E8E93),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.shopping_bag_outlined), label: 'Orders'),
            BottomNavigationBarItem(icon: Icon(Icons.inventory_2_outlined), label: 'Inventory'),
            BottomNavigationBarItem(icon: Icon(Icons.settings_outlined), label: 'Settings'),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(color: Color(0xFF1C1C1E), fontSize: 16, fontWeight: FontWeight.w700),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final String count;
  final String label;
  final Color color;

  const _ActionCard({required this.count, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(count, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Color(0xFF1C1C1E), fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;

  const _MetricCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(color: Color(0xFF1C1C1E), fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
        ],
      ),
    );
  }
}

class _QuickOrderCard extends StatelessWidget {
  final String id;
  final String item;
  final String time;
  final String price;

  const _QuickOrderCard({required this.id, required this.item, required this.time, required this.price});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Order #$id', style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 11, fontWeight: FontWeight.w600)),
              Text(time, style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 11)),
            ],
          ),
          const SizedBox(height: 8),
          Text('1x $item', style: const TextStyle(color: Color(0xFF1C1C1E), fontSize: 14, fontWeight: FontWeight.w700)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(price, style: const TextStyle(color: Color(0xFF1C1C1E), fontSize: 15, fontWeight: FontWeight.w700)),
              GestureDetector(
                onTap: () {},
                child: const Text(
                  'ACCEPT',
                  style: TextStyle(color: Color(0xFF00C4B4), fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
