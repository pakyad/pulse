import 'package:flutter/material.dart';
import 'fulfillment_selection_sheet.dart';

class CustomizationSheet extends StatefulWidget {
  final String itemId;
  final String title;
  final double basePrice;
  final String? imageUrl;
  final String sellerId;
  final String sellerName;
  final String campusId;
  final String meetupLocation;

  const CustomizationSheet({
    super.key,
    required this.itemId,
    required this.title,
    required this.basePrice,
    this.imageUrl,
    required this.sellerId,
    required this.sellerName,
    required this.campusId,
    required this.meetupLocation,
  });

  @override
  State<CustomizationSheet> createState() => _CustomizationSheetState();
}

class _CustomizationSheetState extends State<CustomizationSheet> {
  int _quantity = 1;
  final TextEditingController _notesController = TextEditingController();

  @override
  Widget build(BuildContext context) {
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
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: const Color(0xFFF2F2F7), borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            widget.title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF1C1C1E)),
          ),
          Text(
            'RM ${widget.basePrice.toStringAsFixed(2)} per unit',
            style: const TextStyle(fontSize: 14, color: Color(0xFF8E8E93), fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 32),
          
          // ── QUANTITY STEPPER ──
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Quantity', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF9F9FB),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
                ),
                child: Row(
                  children: [
                    _StepperButton(
                      icon: Icons.remove,
                      onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                    ),
                    SizedBox(
                      width: 40,
                      child: Center(
                        child: Text(
                          '$_quantity',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                    _StepperButton(
                      icon: Icons.add,
                      onPressed: () => setState(() => _quantity++),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 32),
          
          // ── SPECIAL INSTRUCTIONS ──
          const Text('Special Instructions', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF8E8E93))),
          const SizedBox(height: 12),
          TextField(
            controller: _notesController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'e.g. No onions, extra spicy...',
              hintStyle: const TextStyle(color: Color(0xFFC7C7CC), fontSize: 14),
              filled: true,
              fillColor: const Color(0xFFF9F9FB),
              contentPadding: const EdgeInsets.all(16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Color(0xFFF2F2F7), width: 0.5),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: Color(0xFFF2F2F7), width: 0.5),
              ),
            ),
          ),
          
          const SizedBox(height: 32),
          
          // ── CONTINUE BUTTON ──
          SizedBox(
            width: double.infinity,
            height: 60,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (context) => FulfillmentSelectionSheet(
                    orderData: {
                      'itemId': widget.itemId,
                      'title': widget.title,
                      'quantity': _quantity,
                      'basePrice': widget.basePrice,
                      'notes': _notesController.text,
                      'imageUrl': widget.imageUrl,
                      'sellerId': widget.sellerId,
                      'sellerName': widget.sellerName,
                      'campusId': widget.campusId,
                      'meetupLocation': widget.meetupLocation,
                    },
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1C1C1E),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text(
                'Continue to Fulfillment',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _StepperButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  const _StepperButton({required this.icon, this.onPressed});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onPressed,
      icon: Icon(icon, size: 18, color: onPressed == null ? Colors.grey[300] : Colors.black),
    );
  }
}
