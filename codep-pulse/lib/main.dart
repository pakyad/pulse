import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:codep_pulse/screens/buyer/checkout_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const CodepPulseApp());
}

class CodepPulseApp extends StatelessWidget {
  const CodepPulseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CODEP Pulse',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF00C4B4)),
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      // For demonstration purposes, landing on a mock order data checkout
      home: const CheckoutScreen(orderData: {
        'itemId': 'demo_123',
        'title': 'UniKL Lab Kit v2',
        'basePrice': 45.00,
        'quantity': 1,
        'imageUrl': 'https://placehold.co/600x400',
        'sellerId': 'seller_99',
        'sellerName': 'Tech Hub Store',
        'notes': 'Urgent requirement for Lab 4',
      }),
    );
  }
}
