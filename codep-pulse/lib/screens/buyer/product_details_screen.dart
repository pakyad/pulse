import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'customization_sheet.dart';

class ProductDetailScreen extends StatefulWidget {
  final Map<String, dynamic> item;

  const ProductDetailScreen({super.key, required this.item});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final price = item['price']?.toDouble() ?? 0.0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              // ── 1. THE HERO STAGE (Elite Canvas) ──
              SliverToBoxAdapter(
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      height: MediaQuery.of(context).size.height * 0.42,
                      width: double.infinity,
                      color: const Color(0xFFF9F9FB),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Positioned(
                            bottom: 0,
                            child: Container(
                              width: MediaQuery.of(context).size.width * 0.95,
                              height: 320,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.vertical(top: Radius.circular(200)),
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.only(bottom: 20),
                            child: Hero(
                              tag: 'item-${item['id']}',
                              child: Container(
                                width: 280,
                                height: 280,
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.12),
                                      blurRadius: 40,
                                      offset: const Offset(0, 20),
                                      spreadRadius: -5,
                                    )
                                  ],
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(24),
                                  child: item['image_url'] != null
                                      ? Image.network(item['image_url'], fit: BoxFit.cover)
                                      : const Icon(LucideIcons.package, size: 56, color: Color(0xFFE5E5EA)),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    Positioned(
                      bottom: -32,
                      left: 20,
                      right: 20,
                      child: Row(
                        children: [
                          _buildCircleAction(LucideIcons.share2),
                          const SizedBox(width: 12),
                          Expanded(child: _buildTealAction(price)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // ── 2. ELITE CONTENT ARCHITECTURE ──
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(24, 88, 24, 120),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Identity & Typography Scale
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          (item['category'] ?? 'General Marketplace').toUpperCase(),
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                            color: Color(0xFFD1D1D6),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            _buildLabelChip(LucideIcons.star, '4.9 Rating', Colors.amber),
                          ],
                        ),
                        const SizedBox(height: 32),
                        Text(
                          item['title'] ?? 'Item Name',
                          style: const TextStyle(
                            fontSize: 30,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF1C1C1E),
                            letterSpacing: -1.0,
                            height: 1.1,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'RM ${price.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF00C4B4),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 56),

                    // Boutique Shipping Module
                    Container(
                      padding: const EdgeInsets.all(28),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9F9FB),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
                      ),
                      child: Column(
                        children: [
                          _buildShippingRow(LucideIcons.truck, 'Shipping to', 'UniKL MIIT (Level 2)'),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 20),
                            child: Divider(color: Color(0xFFF2F2F7), height: 1),
                          ),
                          _buildShippingRow(LucideIcons.clock, 'Fulfillment', 'Within 24 Hours'),
                        ],
                      ),
                    ),

                    const SizedBox(height: 56),

                    // Institutional Tabs
                    TabBar(
                      controller: _tabController,
                      labelColor: const Color(0xFF1C1C1E),
                      unselectedLabelColor: const Color(0xFFD1D1D6),
                      labelStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                      indicator: const UnderlineTabIndicator(
                        borderSide: BorderSide(width: 3, color: Color(0xFF00C4B4)),
                        insets: EdgeInsets.only(right: 64, bottom: 4),
                      ),
                      tabs: const [
                        Tab(text: 'Description'),
                        Tab(text: 'Details'),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Editorial Body
                    Text(
                      item['description'] ?? 'No description provided by the vendor. This listing is verified under institutional standards.',
                      style: const TextStyle(
                        fontSize: 15,
                        color: Color(0xFF48484A),
                        height: 1.7,
                        fontWeight: FontWeight.w500,
                      ),
                    ),

                    const SizedBox(height: 48),

                    // Details Grid
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 2.2,
                      children: [
                        _buildDetailBox('Condition', item['condition'] ?? 'Brand New'),
                        _buildDetailBox('Category', item['category'] ?? 'General'),
                        _buildDetailBox('Authenticity', 'Original'),
                        _buildDetailBox('Stock', '${item['stock_count'] ?? 15} Units'),
                      ],
                    ),

                    const SizedBox(height: 80),

                    // Premium Store Profile
                    const Divider(color: Color(0xFFF2F2F7), height: 1),
                    const SizedBox(height: 48),
                    Row(
                      children: [
                        Stack(
                          children: [
                            Container(
                              width: 72,
                              height: 72,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF9F9FB),
                                shape: BoxShape.circle,
                                border: Border.all(color: const Color(0xFFF2F2F7), width: 1.5),
                              ),
                              child: const Icon(LucideIcons.user, color: Color(0xFFD1D1D6), size: 28),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 2,
                              child: Container(
                                width: 18,
                                height: 18,
                                decoration: BoxDecoration(
                                  color: Colors.emerald,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2.5),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 20),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['seller_name'] ?? 'Verified Vendor',
                                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1C1C1E)),
                              ),
                              const Row(
                                children: [
                                  Text('Active 5m ago', style: TextStyle(fontSize: 13, color: Color(0xFF8E8E93), fontWeight: FontWeight.bold)),
                                  SizedBox(width: 8),
                                  Text('•', style: TextStyle(color: Color(0xFFD1D1D6))),
                                  SizedBox(width: 8),
                                  Text('View Shop', style: TextStyle(fontSize: 13, color: Color(0xFF00C4B4), fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ],
                          ),
                        ),
                        OutlinedButton(
                          onPressed: () {},
                          style: OutlinedButton.styleFrom(
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                            side: const BorderSide(color: Color(0xFFF2F2F7), width: 1.5),
                            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                          ),
                          child: const Text('Chat', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF1C1C1E))),
                        ),
                      ],
                    ),
                  ]),
                ),
              ),
            ],
          ),

          // Institutional App Bar
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 12,
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new, size: 22, color: Color(0xFF1C1C1E)),
              onPressed: () => Navigator.pop(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCircleAction(IconData icon) {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFF2F2F7), width: 0.5),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 20, offset: const Offset(0, 8))
        ],
      ),
      child: Icon(icon, size: 26, color: const Color(0xFF1C1C1E)),
    );
  }
  Widget _buildTealAction(double price) {
    final item = widget.item;
    return GestureDetector(
      onTap: () {
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => CustomizationSheet(
            itemId: item['id']?.toString() ?? '',
            title: item['title'] ?? 'Item',
            basePrice: price,
            imageUrl: item['image_url'],
            sellerId: item['seller_id']?.toString() ?? '',
            sellerName: item['seller_name'] ?? 'Vendor',
            campusId: item['campus_id'] ?? 'MIIT',
            meetupLocation: item['meetup_location'] ?? 'Main Lobby',
          ),
        );
      },
      child: Container(
        height: 64,
        decoration: BoxDecoration(
          color: const Color(0xFF00C4B4),
          borderRadius: BorderRadius.circular(100),
          boxShadow: [
            BoxShadow(color: const Color(0xFF00C4B4).withOpacity(0.3), blurRadius: 30, offset: const Offset(0, 12))
          ],
        ),
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.shieldCheck, size: 20, color: Colors.white),
              const SizedBox(width: 12),
              Text(
                'Buy Now — RM ${price.toStringAsFixed(2)}',
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabelChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.06),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: color.withOpacity(0.15), width: 0.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 8),
          Text(
            label.toUpperCase(),
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, letterSpacing: 1.2, color: color.withOpacity(0.9)),
          ),
        ],
      ),
    );
  }

  Widget _buildShippingRow(IconData icon, String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, size: 20, color: const Color(0xFF48484A)),
            const SizedBox(width: 16),
            Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1C1C1E))),
          ],
        ),
        Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF8E8E93))),
      ],
    );
  }

  Widget _buildDetailBox(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF2F2F7), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFFD1D1D6), letterSpacing: 1.5)),
          const SizedBox(height: 6),
          Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF1C1C1E))),
        ],
      ),
    );
  }
}
