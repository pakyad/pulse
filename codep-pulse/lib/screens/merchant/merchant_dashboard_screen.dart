import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class MerchantDashboardScreen extends StatefulWidget {
  const MerchantDashboardScreen({super.key});

  @override
  State<MerchantDashboardScreen> createState() => _MerchantDashboardScreenState();
}

class _MerchantDashboardScreenState extends State<MerchantDashboardScreen> {
  bool _isStoreOpen = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9FB), // Faint off-white background
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(80),
        child: Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(
              bottom: BorderSide(color: Color(0xFFF2F2F7), width: 0.5),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(24, 48, 24, 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.between,
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
              Row(
                children: [
                  Text(
                    'Store Open',
                    style: TextStyle(
                      color: const Color(0xFF8E8E93),
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 8),
                  CupertinoSwitch(
                    value: _isStoreOpen,
                    activeColor: const Color(0xFF00C4B4), // PULSE Teal
                    onChanged: (val) => setState(() => _isStoreOpen = val),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── ACTION REQUIRED BOARD ──
            const _SectionTitle(title: 'Action Required'),
            const SizedBox(height: 16),
            SizedBox(
              height: 110,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: const [
                  _ActionCard(
                    count: '3',
                    label: 'Pending\nAcceptance',
                    countColor: Colors.red,
                  ),
                  SizedBox(width: 12),
                  _ActionCard(
                    count: '2',
                    label: 'Awaiting\nRunner',
                    countColor: Colors.orange,
                  ),
                  SizedBox(width: 12),
                  _ActionCard(
                    count: '1',
                    label: 'Out of\nStock',
                    countColor: Colors.grey,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // ── TODAY'S PERFORMANCE ──
            const _SectionTitle(title: "Today's Performance"),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _PerformanceCard(
                    label: "TODAY'S REVENUE",
                    value: "RM 345.00",
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _PerformanceCard(
                    label: "ITEMS SOLD",
                    value: "18",
                  ),
                ),
              ],
            ),

            const SizedBox(height: 32),

            // ── BUSINESS INTELLIGENCE CHART ──
            const _SectionTitle(title: '7-Day Revenue Trend'),
            const SizedBox(height: 16),
            Container(
              height: 240,
              padding: const EdgeInsets.fromLTRB(16, 32, 16, 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
              ),
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(show: false),
                  titlesData: FlTitlesData(
                    show: true,
                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (val, meta) {
                          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                          if (val.toInt() >= 0 && val.toInt() < days.length) {
                            return Padding(
                              padding: const EdgeInsets.only(top: 8.0),
                              child: Text(
                                days[val.toInt()],
                                style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 10, fontWeight: FontWeight.w600),
                              ),
                            );
                          }
                          return const SizedBox();
                        },
                      ),
                    ),
                  ),
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
                        const FlSpot(6, 4),
                      ],
                      isCurved: true,
                      color: const Color(0xFF00C4B4),
                      barWidth: 3,
                      isStrokeCapRound: true,
                      dotData: FlDotData(show: false),
                      belowBarData: BarAreaData(
                        show: true,
                        color: const Color(0xFF00C4B4).withOpacity(0.05),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 100), // Bottom padding for navigation
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
      style: const TextStyle(
        color: Color(0xFF1C1C1E),
        fontSize: 16,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.3,
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final String count;
  final String label;
  final Color countColor;

  const _ActionCard({
    required this.count,
    required this.label,
    required this.countColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 120,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            count,
            style: TextStyle(
              color: countColor,
              fontSize: 24,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF1C1C1E),
              fontSize: 11,
              fontWeight: FontWeight.w500,
              height: 1.2,
            ),
          ),
        ],
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
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF8E8E93),
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Color(0xFF1C1C1E),
              fontSize: 24,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }
}
