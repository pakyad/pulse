import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'checkout_screen.dart';

class FulfillmentSelectionSheet extends StatefulWidget {
  final Map<String, dynamic> orderData;

  const FulfillmentSelectionSheet({super.key, required this.orderData});

  @override
  State<FulfillmentSelectionSheet> createState() => _FulfillmentSelectionSheetState();
}

class _FulfillmentSelectionSheetState extends State<FulfillmentSelectionSheet> {
  String _choice = 'SELF_COLLECT';
  String _selectedHub = 'Block K';

  final Map<String, List<Map<String, String>>> _campusHubs = {
    'MIIT': [
      {'id': 'k', 'label': 'Block K', 'sub': 'Main Lobby', 'zone': 'campus'},
      {'id': 'n', 'label': 'Block N', 'sub': 'Ground Floor', 'zone': 'campus'},
      {'id': 'lib', 'label': 'Library', 'sub': 'Level 1 entrance', 'zone': 'campus'},
      {'id': 'hostel_a', 'label': 'Kolej MARA', 'sub': 'Outside campus', 'zone': 'off_campus'},
    ],
    'UBIS': [
      {'id': 'ubis_l', 'label': 'UBIS Lobby', 'sub': 'Main Entrance', 'zone': 'campus'},
      {'id': 'ubis_c', 'label': 'UBIS Cafe', 'sub': 'Level 1', 'zone': 'campus'},
    ],
    'BMI': [
      {'id': 'bmi_m', 'label': 'BMI Main', 'sub': 'Security Post', 'zone': 'campus'},
      {'id': 'bmi_h', 'label': 'BMI Hostel', 'sub': 'Block B', 'zone': 'off_campus'},
    ],
  };

  @override
  Widget build(BuildContext context) {
    final String campus = widget.orderData['campusId'] ?? 'MIIT';
    final int qty = widget.orderData['quantity'];
    final double subtotal = widget.orderData['basePrice'] * qty;
    
    final List<Map<String, String>> hubs = _campusHubs[campus] ?? _campusHubs['MIIT']!;
    final Map<String, String> selectedHubData = hubs.firstWhere((h) => h['label'] == _selectedHub, orElse: () => hubs.first);
    
    final double runnerFee = selectedHubData['zone'] == 'campus' ? 3.50 : 5.00;
    final double total = subtotal + (_choice == 'RUNNER' ? runnerFee : 0);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'How to receive your item',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF1C1C1E)),
              ),
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(color: Color(0xFFF9F9FB), shape: BoxShape.circle),
                  child: const Icon(Icons.arrow_back_ios_new, size: 14, color: Color(0xFF8E8E93)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),

          // Choice Cards
          _FulfillmentCard(
            title: 'Self-Collection',
            sub: widget.orderData['meetupLocation'] ?? 'UniKL MIIT Main Lobby',
            icon: LucideIcons.shoppingBag,
            isActive: _choice == 'SELF_COLLECT',
            onTap: () => setState(() => _choice = 'SELF_COLLECT'),
          ),
          const SizedBox(height: 12),
          _FulfillmentCard(
            title: 'Institutional Runner',
            sub: 'Delivery via verified peer network',
            icon: LucideIcons.truck,
            isActive: _choice == 'RUNNER',
            onTap: () => setState(() => _choice = 'RUNNER'),
          ),

          // Hub Selection
          if (_choice == 'RUNNER') ...[
            const SizedBox(height: 32),
            const Text(
              'SELECT HUB',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFFD1D1D6), letterSpacing: 1.2),
            ),
            const SizedBox(height: 12),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 2.5,
              ),
              itemCount: hubs.length,
              itemBuilder: (context, index) {
                final hub = hubs[index];
                final bool isSelected = _selectedHub == hub['label'];
                return GestureDetector(
                  onTap: () => setState(() => _selectedHub = hub['label']!),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF00C4B4) : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(hub['label']!, style: TextStyle(color: isSelected ? Colors.white : const Color(0xFF1C1C1E), fontWeight: FontWeight.bold, fontSize: 13)),
                        Text('${hub['sub']!} (RM ${hub['zone'] == 'campus' ? '3.50' : '5.00'})', 
                          style: TextStyle(color: isSelected ? Colors.white.withOpacity(0.6) : const Color(0xFF8E8E93), fontSize: 9)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],

          const SizedBox(height: 32),

          // ── SELECTION TAGS ──
          Row(
            children: [
              _TagChip(icon: LucideIcons.history, label: 'Qty: $qty'),
              if (widget.orderData['notes'].toString().isNotEmpty) ...[
                const SizedBox(width: 8),
                _TagChip(icon: LucideIcons.edit3, label: widget.orderData['notes']),
              ],
            ],
          ),

          const SizedBox(height: 24),

          // ── PRICE BREAKDOWN ──
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(color: Color(0xFFF2F2F7), width: 0.5),
                bottom: BorderSide(color: Color(0xFFF2F2F7), width: 0.5),
              ),
            ),
            child: Column(
              children: [
                _PriceRow(label: 'Item Subtotal', value: 'RM ${subtotal.toStringAsFixed(2)}'),
                if (_choice == 'RUNNER') ...[
                  const SizedBox(height: 8),
                  _PriceRow(label: 'Runner Fee', value: 'RM ${runnerFee.toStringAsFixed(2)}'),
                ],
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    const Text('Est. Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    Text(
                      'RM ${total.toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF00C4B4)),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // ── CONFIRM BUTTON ──
          SizedBox(
            width: double.infinity,
            height: 60,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CheckoutScreen(
                      orderData: {
                        ...widget.orderData,
                        'fulfillmentChoice': _choice,
                        'dropOffLocation': _choice == 'RUNNER' ? _selectedHub : null,
                        'totalPrice': total,
                        'runnerFee': _choice == 'RUNNER' ? runnerFee : 0,
                      },
                    ),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00C4B4),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                'Confirm & Pay — RM ${total.toStringAsFixed(2)}',
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800),
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _FulfillmentCard extends StatelessWidget {
  final String title;
  final String sub;
  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;

  const _FulfillmentCard({
    required this.title,
    required this.sub,
    required this.icon,
    required this.isActive,
    required this.onTap,
  });

  void _showPaymentVerification(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _PaymentVerificationSheet(
        orderData: widget.orderData,
        total: (widget.orderData['subtotal'] as double) + 3.50, // Mock total with fee
        accountNumber: '64685896263645',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF00C4B4) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isActive ? Colors.white.withOpacity(0.2) : const Color(0xFFF9F9FB),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: isActive ? Colors.white : const Color(0xFF1C1C1E), size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(color: isActive ? Colors.white : const Color(0xFF1C1C1E), fontWeight: FontWeight.w800, fontSize: 15)),
                  RichText(
                    text: TextSpan(
                      style: TextStyle(color: isActive ? Colors.white.withOpacity(0.7) : const Color(0xFF8E8E93), fontSize: 12),
                      children: [
                        const TextSpan(text: 'Handover at '),
                        TextSpan(
                          text: sub,
                          style: TextStyle(
                            fontWeight: FontWeight.w900,
                            color: isActive ? Colors.white : const Color(0xFF1C1C1E),
                            decoration: TextDecoration.underline,
                            decorationColor: isActive ? Colors.white.withOpacity(0.3) : const Color(0xFF1C1C1E).withOpacity(0.1),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final String label;
  final String value;
  const _PriceRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.between,
      children: [
        Text(label, style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 14, fontWeight: FontWeight.w500)),
        Text(value, style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 14, fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _TagChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _TagChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: const Color(0xFFF9F9FB), borderRadius: BorderRadius.circular(8)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: const Color(0xFF8E8E93)),
          const SizedBox(width: 6),
          Text(
            label.length > 20 ? '${label.substring(0, 17)}...' : label,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF8E8E93)),
          ),
        ],
      ),
    );
  }
}
