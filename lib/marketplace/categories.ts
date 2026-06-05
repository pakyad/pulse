/**
 * Pulse Marketplace: Category Registry (v5.0)
 * STUDENT ECONOMY MODEL
 *
 * Live SerpAPI comparison is ONLY for standardised NEW items students must buy:
 *   Textbooks, scientific calculators, lab coats, stationery, hostel appliances.
 *
 * Secondhand electronics (TECH category) are NOT benchmarked against Shopee
 * new retail prices — that comparison is unfair and inaccurate for used goods.
 * TECH uses fixed campus ceilings only.
 *
 * comparable: true  → SerpAPI live search triggered
 * comparable: false → Fixed ceiling, no API call
 */

export type CategoryID = 'HUNGER' | 'ACADEMIC' | 'HOSTEL' | 'TECH' | 'APPAREL';

export interface SubcategoryConfig {
  label: string;
  comparable: boolean;
  fixedCeiling?: number;
  titleHint: string;
  serpQuerySuffix?: string;
}

export interface CategoryConfig {
  id: CategoryID;
  label: string;
  subtext: string;
  governance: 'REGULATED' | 'OPEN';
  ceiling?: number;
  subcategories: SubcategoryConfig[];
  customFields: {
    id: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'timestamp' | 'toggle' | 'calendar';
    placeholder?: string;
    options?: string[];
    required?: boolean;
  }[];
}

export const MARKETPLACE_CATEGORIES: Record<CategoryID, CategoryConfig> = {

  // ─────────────────────────────────────────────────────────────
  // HUNGER — Food is hyper-local. No Shopee equivalent. All fixed.
  // ─────────────────────────────────────────────────────────────
  HUNGER: {
    id: 'HUNGER',
    label: 'Food & Drinks',
    subtext: 'Campus food, snacks and preorders',
    governance: 'REGULATED',
    ceiling: 25.00,
    subcategories: [
      {
        label: 'Campus Meal',
        comparable: false,
        fixedCeiling: 12.00,
        titleHint: 'e.g. Nasi Lemak Ayam, Mee Goreng Special',
      },
      {
        label: 'Snacks & Drinks',
        comparable: false,
        fixedCeiling: 15.00,
        titleHint: 'e.g. Kuih Baulu Pack, Teh Tarik Bundle x5',
      },
      {
        label: 'Home Cook',
        comparable: false,
        fixedCeiling: 20.00,
        titleHint: 'e.g. Homemade Rendang Rice Box',
      },
      {
        label: 'Group Catering',
        comparable: false,
        fixedCeiling: 25.00,
        titleHint: 'e.g. Group Meal Preorder — 5 Pax',
      },
    ],
    customFields: [
      {
        id: 'active_until',
        label: 'Active Until',
        type: 'timestamp',
        required: true,
        placeholder: 'When is this food no longer available?',
      },
      {
        id: 'pickup_location',
        label: 'Pickup Point',
        type: 'text',
        placeholder: 'e.g. MIIT Canteen, Block A Lobby',
        required: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ACADEMIC — Only branded/published items are comparable.
  //            Custom notes/papers are unique — fixed ceiling only.
  // ─────────────────────────────────────────────────────────────
  ACADEMIC: {
    id: 'ACADEMIC',
    label: 'Academic',
    subtext: 'Books, lab gear, stationery and notes',
    governance: 'REGULATED',
    subcategories: [
      {
        label: 'Textbooks',
        comparable: true,
        fixedCeiling: 200.00,
        titleHint: 'e.g. Thomas Calculus 14th Edition, Sadiku Fundamentals',
        serpQuerySuffix: 'textbook Malaysia',
      },
      {
        label: 'Scientific Calculator',
        comparable: true,
        fixedCeiling: 120.00,
        titleHint: 'e.g. Casio fx-570ES PLUS, Casio fx-991EX ClassWiz',
        serpQuerySuffix: 'calculator Malaysia buy',
      },
      {
        label: 'Lab Coat & Safety',
        comparable: true,
        fixedCeiling: 80.00,
        titleHint: 'e.g. Lab Coat White Size M, Safety Goggles Clear Lens',
        serpQuerySuffix: 'Malaysia buy',
      },
      {
        label: 'Drawing & Art Tools',
        comparable: true,
        fixedCeiling: 150.00,
        titleHint: 'e.g. Casio fx-570ES Scientific Calculator, Vernier Caliper',
        serpQuerySuffix: 'Malaysia buy',
      },
      {
        label: 'Stationery Bundles',
        comparable: true,
        fixedCeiling: 60.00,
        titleHint: 'e.g. Stabilo Boss Highlighter Set 6pc, Pilot G2 Pen Pack',
        serpQuerySuffix: 'Malaysia',
      },
      {
        label: 'Handwritten Notes',
        comparable: false,
        fixedCeiling: 20.00,
        titleHint: 'e.g. CSC3109 Data Structures Notes — Year 2 Sem 1',
      },
      {
        label: 'Past Year Papers',
        comparable: false,
        fixedCeiling: 10.00,
        titleHint: 'e.g. CSC3109 Final Exam Past Year 2022–2024',
      },
      {
        label: 'Study Guides',
        comparable: false,
        fixedCeiling: 25.00,
        titleHint: 'e.g. BUS2201 Chapter Summary Notes, Assignment Template Pack',
      },
    ],
    customFields: [
      {
        id: 'department',
        label: 'Faculty / Department',
        type: 'select',
        options: ['MIIT', 'Business', 'Engineering', 'Architecture', 'Law', 'Foundation', 'Other'],
        required: true,
      },
      {
        id: 'year_semester',
        label: 'Academic Year/Sem',
        type: 'text',
        placeholder: 'e.g. Year 2 Sem 1',
        required: true,
      },
      {
        id: 'subject_code',
        label: 'Subject Code',
        type: 'text',
        placeholder: 'e.g. CSC3109',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // HOSTEL — Branded appliances/storage are comparable.
  //          Used furniture is hyper-local, no benchmark.
  // ─────────────────────────────────────────────────────────────
  HOSTEL: {
    id: 'HOSTEL',
    label: 'Hostel & Room',
    subtext: 'Appliances, storage and room essentials',
    governance: 'OPEN',
    subcategories: [
      {
        label: 'Fan & Cooling',
        comparable: true,
        fixedCeiling: 200.00,
        titleHint: 'e.g. Pensonic 16" Stand Fan PF-1601, KDK Table Fan M30KS',
        serpQuerySuffix: 'Malaysia buy',
      },
      {
        label: 'Kitchen Appliance',
        comparable: true,
        fixedCeiling: 300.00,
        titleHint: 'e.g. Khind Rice Cooker 1.0L RC108M, Pensonic Kettle 1.7L',
        serpQuerySuffix: 'Malaysia buy',
      },
      {
        label: 'Furniture',
        comparable: false,
        fixedCeiling: 400.00,
        titleHint: 'e.g. Study Table with Drawer, Foldable Bed Frame Single',
      },
      {
        label: 'Storage',
        comparable: true,
        fixedCeiling: 150.00,
        titleHint: 'e.g. IKEA SAMLA Box 22L, 3-Tier Stackable Drawer Cabinet',
        serpQuerySuffix: 'Malaysia',
      },
      {
        label: 'Room Misc',
        comparable: false,
        fixedCeiling: 80.00,
        titleHint: 'e.g. RGB LED Strip 5m, Laundry Basket, Shoe Rack 3-Tier',
      },
      {
        label: 'Bedding & Linen',
        comparable: false,
        fixedCeiling: 100.00,
        titleHint: 'e.g. Single Bed Pillow Set, Bolster with Cotton Cover',
      },
    ],
    customFields: [
      {
        id: 'pickup_difficulty',
        label: 'Pickup Difficulty',
        type: 'toggle',
        options: ['Easy (Fits in Car)', 'Moderate (Needs 2 People)', 'Heavy (Needs Lorry/Van)'],
        required: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // TECH — All hardware subcategories are market-comparable.
  //        Digital access keys are fixed (no Shopee equivalent).
  // ─────────────────────────────────────────────────────────────
  TECH: {
    id: 'TECH',
    label: 'Tech & Devices',
    subtext: 'Secondhand gadgets, peripherals and software',
    governance: 'OPEN',
    subcategories: [
      {
        label: 'Laptop & Tablet',
        comparable: false,
        fixedCeiling: 3500.00,
        titleHint: 'e.g. MacBook Air M2 2022 Space Grey, Dell XPS 13 i7 16GB',
      },
      {
        label: 'Smartphone',
        comparable: false,
        fixedCeiling: 2500.00,
        titleHint: 'e.g. iPhone 13 Pro Max 256GB Graphite, Samsung Galaxy S23',
      },
      {
        label: 'Mouse & Keyboard',
        comparable: false,
        fixedCeiling: 500.00,
        titleHint: 'e.g. Logitech MX Master 3, Keychron K2 Wireless Keyboard',
      },
      {
        label: 'Headphones & Audio',
        comparable: false,
        fixedCeiling: 800.00,
        titleHint: 'e.g. Sony WH-1000XM5, Apple AirPods Pro 2nd Gen',
      },
      {
        label: 'Cables & Chargers',
        comparable: false,
        fixedCeiling: 150.00,
        titleHint: 'e.g. Anker 65W GaN Charger, Baseus USB-C Hub 7-in-1',
      },
      {
        label: 'Software & Licences',
        comparable: false,
        fixedCeiling: 150.00,
        titleHint: 'e.g. Microsoft Office 365 1-Year Key, AutoCAD Student Licence',
      },
      {
        label: 'Other Gadgets',
        comparable: false,
        fixedCeiling: 800.00,
        titleHint: 'e.g. Nintendo Switch OLED White, GoPro Hero 11 Black',
      },
    ],
    customFields: [
      {
        id: 'condition',
        label: 'Condition',
        type: 'select',
        options: ['Brand New (Sealed)', 'Like New (< 3 months)', 'Good (Normal Use)', 'Fair (Visible Wear)', 'For Parts Only'],
        required: true,
      },
      {
        id: 'specs',
        label: 'Key Specs',
        type: 'text',
        placeholder: 'e.g. 16GB RAM, 512GB SSD, M2 Chip, Space Grey',
        required: true,
      },
      {
        id: 'warranty',
        label: 'Warranty',
        type: 'select',
        options: ['No Warranty', 'Manufacturer Warranty Active', 'Seller 1-Month Guarantee'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // APPAREL — Branded preloved CAN be benchmarked on Shopee.
  //           Custom/club/campus merch is unique — fixed ceiling.
  // ─────────────────────────────────────────────────────────────
  APPAREL: {
    id: 'APPAREL',
    label: 'Apparel',
    subtext: 'Preloved, lab coats, club shirts and campus merch',
    governance: 'OPEN',
    subcategories: [
      {
        label: 'Lab Coat',
        comparable: true,
        fixedCeiling: 80.00,
        titleHint: 'e.g. Lab Coat White Size M, Disposable Lab Coat Large',
        serpQuerySuffix: 'lab coat Malaysia buy',
      },
      {
        label: 'Club / Faculty Shirt',
        comparable: false,
        fixedCeiling: 60.00,
        titleHint: 'e.g. UniKL Football Club Jersey 2024, CS Society Shirt M',
      },
      {
        label: 'Campus Merch',
        comparable: false,
        fixedCeiling: 100.00,
        titleHint: 'e.g. UniKL MIIT Hoodie 2024, Pulse Campus Tee XL',
      },
      {
        label: 'Preloved Clothes',
        comparable: false,
        fixedCeiling: 120.00,
        titleHint: 'e.g. Nike Dri-FIT Tee Size L, Uniqlo Fleece Jacket Navy M',
      },
      {
        label: 'Bags & Accessories',
        comparable: true,
        fixedCeiling: 200.00,
        titleHint: 'e.g. Herschel Little America Backpack, New Era 9Forty Cap',
        serpQuerySuffix: 'Malaysia',
      },
    ],
    customFields: [
      {
        id: 'size',
        label: 'Size',
        type: 'select',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'],
        required: true,
      },
      {
        id: 'condition',
        label: 'Condition',
        type: 'select',
        options: ['Brand New', 'Like New', 'Used - Good', 'Used - Fair'],
        required: true,
      },
    ],
  },
};
