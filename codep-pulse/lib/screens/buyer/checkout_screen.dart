import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cloud_functions/cloud_functions.dart';

class CheckoutScreen extends StatefulWidget {
  final Map<String, dynamic> orderData;

  const CheckoutScreen({super.key, required this.orderData});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  File? _receiptImage;
  bool _isLoading = false;
  String _fulfillmentChoice = 'SELF_COLLECT';

  Future<void> _pickReceipt() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() => _receiptImage = File(image.path));
    }
  }

  Future<void> _placeOrder() async {
    if (_receiptImage == null) return;

    setState(() => _isLoading = true);
    
    // ── SHOW PROCESSING MODAL ──
    _showProcessingDialog();

    try {
      // 1. Upload Receipt to Firebase Storage
      final storageRef = FirebaseStorage.instance
          .ref()
          .child('receipts/${DateTime.now().millisecondsSinceEpoch}.jpg');
      
      final uploadTask = await storageRef.putFile(_receiptImage!);
      final String receiptUrl = await uploadTask.ref.getDownloadURL();

      // 2. Call Cloud Function
      final HttpsCallable callable = FirebaseFunctions.instance.httpsCallable('placeOrder');
      
      final result = await callable.call(<String, dynamic>{
        'itemId': widget.orderData['itemId'],
        'title': widget.orderData['title'],
        'price': widget.orderData['basePrice'] * widget.orderData['quantity'],
        'imageUrl': widget.orderData['imageUrl'],
        'receiptUrl': receiptUrl,
        'sellerId': widget.orderData['sellerId'],
        'sellerName': widget.orderData['sellerName'],
        'deliveryType': _fulfillmentChoice,
        'dropOffLocation': _fulfillmentChoice == 'RUNNER' ? 'Block K - Main Lobby' : null,
        'buyerName': 'Verified Student', // Should come from Auth profile
        'notes': widget.orderData['notes'],
      });

      if (mounted) {
        Navigator.pop(context); // Close processing dialog
        if (result.data['success'] == true) {
          // Navigate to Success Screen
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const OrderSuccessScreen()),
          );
        }
      }
    } catch (e) {
      print('ERROR CAUGHT: $e');
      if (mounted) {
        Navigator.pop(context); // Close processing dialog
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Order failed: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showProcessingDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => WillPopScope(
        onWillPop: () async => false, // Prevent back button
        child: Dialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: const [
                CircularProgressIndicator(color: Color(0xFF1C1C1E)),
                SizedBox(height: 24),
                Text('Processing Order...', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                SizedBox(height: 8),
                Text('Verifying with PULSE Engine', style: TextStyle(color: Color(0xFF8E8E93), fontSize: 13)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final int qty = widget.orderData['quantity'];
    final double subtotal = widget.orderData['basePrice'] * qty;
    const double runnerFee = 1.50;
    final double total = subtotal + (_fulfillmentChoice == 'RUNNER' ? runnerFee : 0);

    return Scaffold(
      backgroundColor: const Color(0xFFF9F9FB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text('Checkout', style: TextStyle(color: Color(0xFF1C1C1E), fontSize: 18, fontWeight: FontWeight.w700)),
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back_ios_new, size: 20, color: Color(0xFF1C1C1E)),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── ORDER SUMMARY ──
            _SectionHeader(title: 'Order Summary'),
            const SizedBox(height: 12),
            _SummaryCard(
              title: '${qty}x ${widget.orderData['title']}',
              notes: widget.orderData['notes'],
              price: 'RM ${subtotal.toStringAsFixed(2)}',
            ),

            const SizedBox(height: 24),

            // ── FULFILLMENT ──
            _SectionHeader(title: 'Fulfillment'),
            const SizedBox(height: 12),
            _FulfillmentChoice(
              isActive: _fulfillmentChoice == 'SELF_COLLECT',
              title: 'Self-Collection',
              sub: 'Direct handover at vendor',
              onTap: () => setState(() => _fulfillmentChoice = 'SELF_COLLECT'),
            ),
            const SizedBox(height: 8),
            _FulfillmentChoice(
              isActive: _fulfillmentChoice == 'RUNNER',
              title: 'Institutional Runner',
              sub: 'Delivery to Hub (+RM 1.50)',
              onTap: () => setState(() => _fulfillmentChoice = 'RUNNER'),
            ),

            if (_fulfillmentChoice == 'RUNNER') ...[
              const SizedBox(height: 24),
              _SectionHeader(title: 'Select Hub'),
              const SizedBox(height: 12),
              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 2.5,
                children: [
                  _HubChip(label: 'Block K', sub: 'Main Lobby', isActive: true),
                  _HubChip(label: 'Block N', sub: 'Ground Floor', isActive: false),
                  _HubChip(label: 'Library', sub: 'Level 1', isActive: false),
                  _HubChip(label: 'Cafe', sub: 'Student Cafe', isActive: false),
                ],
              ),
            ],

            const SizedBox(height: 24),

            // ── PAYMENT ──
            _SectionHeader(title: 'Payment Method'),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF00C4B4), width: 1.5),
              ),
              child: Column(
                children: [
                  const Icon(Icons.qr_code_2, size: 120, color: Color(0xFFF2F2F7)),
                  const SizedBox(height: 16),
                  const Text('Upload DuitNow Receipt', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  const SizedBox(height: 16),
                  GestureDetector(
                    onTap: _pickReceipt,
                    child: _receiptImage == null
                        ? Container(
                            height: 80,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF9F9FB),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFF2F2F7), width: 1),
                            ),
                            child: const Icon(Icons.camera_alt_outlined, color: Color(0xFF8E8E93)),
                          )
                        : ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.file(_receiptImage!, height: 100, width: double.infinity, fit: BoxFit.cover),
                          ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── LEDGER ──
            _SectionHeader(title: 'Bill Details'),
            const SizedBox(height: 12),
            _BillRow(label: 'Subtotal', value: 'RM ${subtotal.toStringAsFixed(2)}'),
            if (_fulfillmentChoice == 'RUNNER') _BillRow(label: 'Runner Fee', value: 'RM ${runnerFee.toStringAsFixed(2)}'),
            const Divider(height: 32, color: Color(0xFFF2F2F7)),
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                const Text('Total Payment', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                Text('RM ${total.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF00C4B4))),
              ],
            ),
            const SizedBox(height: 120),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).padding.bottom + 16),
        decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Color(0xFFF2F2F7), width: 0.5))),
        child: ElevatedButton(
          onPressed: _receiptImage == null || _isLoading ? null : _placeOrder,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF00C4B4),
            disabledBackgroundColor: const Color(0xFFF2F2F7),
            minimumSize: const Size(double.infinity, 56),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Text('Place Order', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});
  @override
  Widget build(BuildContext context) => Text(title.toUpperCase(), style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.0));
}

class _SummaryCard extends StatelessWidget {
  final String title;
  final String notes;
  final String price;
  const _SummaryCard({required this.title, required this.notes, required this.price});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5)),
    child: Row(
      children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          if (notes.isNotEmpty) Text(notes, style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 12)),
        ])),
        Text(price, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
      ],
    ),
  );
}

class _FulfillmentChoice extends StatelessWidget {
  final bool isActive;
  final String title;
  final String sub;
  final VoidCallback onTap;
  const _FulfillmentChoice({required this.isActive, required this.title, required this.sub, required this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFF00C4B4) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
      ),
      child: Row(children: [
        Icon(isActive ? Icons.check_circle : Icons.radio_button_off, color: isActive ? Colors.white : const Color(0xFF8E8E93)),
        const SizedBox(width: 16),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: TextStyle(color: isActive ? Colors.white : Colors.black, fontWeight: FontWeight.w700)),
          Text(sub, style: TextStyle(color: isActive ? Colors.white.withOpacity(0.6) : const Color(0xFF8E8E93), fontSize: 12)),
        ]),
      ]),
    ),
  );
}

class _BillRow extends StatelessWidget {
  final String label;
  final String value;
  const _BillRow({required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Padding(padding: const EdgeInsets.symmetric(vertical: 4), child: Row(mainAxisAlignment: MainAxisAlignment.between, children: [
    Text(label, style: const TextStyle(color: Color(0xFF8E8E93), fontSize: 14)),
    Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
  ]));
}

class _HubChip extends StatelessWidget {
  final String label;
  final String sub;
  final bool isActive;
  const _HubChip({required this.label, required this.sub, required this.isActive});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    decoration: BoxDecoration(
      color: isActive ? const Color(0xFF00C4B4) : Colors.white,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
    ),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: isActive ? Colors.white : const Color(0xFF1C1C1E), fontWeight: FontWeight.bold, fontSize: 13)),
        Text(sub, style: TextStyle(color: isActive ? Colors.white.withOpacity(0.6) : const Color(0xFF8E8E93), fontSize: 11)),
      ],
    ),
  );
}

class OrderSuccessScreen extends StatelessWidget {
  const OrderSuccessScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Colors.white,
    body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const Icon(Icons.check_circle_outline, color: Color(0xFF00C4B4), size: 100),
      const SizedBox(height: 24),
      const Text('Order Placed!', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
      const SizedBox(height: 32),
      TextButton(onPressed: () => Navigator.pop(context), child: const Text('Back to Home', style: TextStyle(color: Color(0xFF8E8E93), fontWeight: FontWeight.w700))),
    ])),
  );
}
