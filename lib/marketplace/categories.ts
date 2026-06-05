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
  studentMarket?: boolean;
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
    applicableSubcategories?: string[];
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
        label: 'IT & Computing Books',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 200.00,
        titleHint: 'e.g. Data Structures in C++, Intro to Java',
        serpQuerySuffix: 'computer science IT textbook Malaysia',
      },
      {
        label: 'Engineering Textbooks',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 250.00,
        titleHint: 'e.g. Thomas Calculus 14th Ed, Thermodynamics',
        serpQuerySuffix: 'engineering textbook Malaysia',
      },
      {
        label: 'Business & Law Books',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 180.00,
        titleHint: 'e.g. Principles of Marketing, Business Law',
        serpQuerySuffix: 'business law textbook Malaysia',
      },
      {
        label: 'Casio Calculators',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 120.00,
        titleHint: 'e.g. Casio fx-570ES PLUS',
        serpQuerySuffix: 'Casio scientific calculator Malaysia buy',
      },
      {
        label: 'Other Calculators',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 100.00,
        titleHint: 'e.g. Texas Instruments, Canon, Sharp',
        serpQuerySuffix: 'scientific calculator Malaysia buy',
      },
      {
        label: 'Lab Coats & Goggles',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 80.00,
        titleHint: 'e.g. White Lab Coat Size M',
        serpQuerySuffix: 'Malaysia buy',
      },
      {
        label: 'Drawing & Architecture Tools',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 150.00,
        titleHint: 'e.g. T-Square, Vernier Caliper, Drafting Tube',
        serpQuerySuffix: 'Malaysia buy',
      },
      {
        label: 'Stationery Bundles',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 60.00,
        titleHint: 'e.g. Stabilo Boss Highlighter Set 6pc, Pilot G2 Pack',
        serpQuerySuffix: 'Malaysia',
      },
      {
        label: 'Handwritten Notes (IT & CS)',
        comparable: false,
        fixedCeiling: 20.00,
        titleHint: 'e.g. CSC3109 Data Structures Sem 1 Notes',
      },
      {
        label: 'Handwritten Notes (Engineering)',
        comparable: false,
        fixedCeiling: 20.00,
        titleHint: 'e.g. Thermodynamics Chapter 1-5 Summary',
      },
      {
        label: 'Handwritten Notes (Business)',
        comparable: false,
        fixedCeiling: 20.00,
        titleHint: 'e.g. BUS2201 Macroeconomics Full Sem Notes',
      },
      {
        label: 'Past Year Papers',
        comparable: false,
        fixedCeiling: 10.00,
        titleHint: 'e.g. CSC3109 Final Exam 2022–2024',
      },
    ],
    customFields: [
      {
        id: 'department',
        label: 'Faculty / Department',
        type: 'select',
        options: ['MIIT', 'Business', 'Engineering', 'Architecture', 'Law', 'Foundation', 'Other'],
        required: true,
        applicableSubcategories: ['IT & Computing Books', 'Engineering Textbooks', 'Business & Law Books', 'Handwritten Notes (IT & CS)', 'Handwritten Notes (Engineering)', 'Handwritten Notes (Business)', 'Past Year Papers'],
      },
      {
        id: 'year_semester',
        label: 'Academic Year/Sem',
        type: 'text',
        placeholder: 'e.g. Year 2 Sem 1',
        required: true,
        applicableSubcategories: ['IT & Computing Books', 'Engineering Textbooks', 'Business & Law Books', 'Handwritten Notes (IT & CS)', 'Handwritten Notes (Engineering)', 'Handwritten Notes (Business)', 'Past Year Papers'],
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
        label: 'Stand & Table Fans',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 200.00,
        titleHint: 'e.g. Pensonic 16" Stand Fan PF-1601',
        serpQuerySuffix: 'fan Malaysia buy',
      },
      {
        label: 'Rice Cookers & Kettles',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 300.00,
        titleHint: 'e.g. Khind Rice Cooker 1.0L, Pensonic Kettle 1.7L',
        serpQuerySuffix: 'Malaysia buy',
      },
      {
        label: 'Irons & Laundry',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 200.00,
        titleHint: 'e.g. Panasonic Dry Iron, Philips Steam Iron',
        serpQuerySuffix: 'Malaysia buy',
      },
      {
        label: 'Study Tables & Chairs',
        comparable: false,
        studentMarket: true,
        fixedCeiling: 400.00,
        titleHint: 'e.g. IKEA MICKE Study Table, Ergonomic Chair',
      },
      {
        label: 'Racks & Storage Boxes',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 150.00,
        titleHint: 'e.g. IKEA SAMLA Box 22L, 3-Tier Stackable Drawer',
        serpQuerySuffix: 'Malaysia',
      },
      {
        label: 'Bedding & Linen',
        comparable: false,
        studentMarket: true,
        fixedCeiling: 100.00,
        titleHint: 'e.g. Single Bed Pillow Set, Bolster, Bedsheet Set',
      },
      {
        label: 'Room Decor & Lighting',
        comparable: false,
        studentMarket: true,
        fixedCeiling: 80.00,
        titleHint: 'e.g. RGB LED Strip 5m, Study Lamp, Mirror',
      },
    ],
    customFields: [
      {
        id: 'brand',
        label: 'Appliance Brand',
        type: 'select',
        options: ['Khind', 'Pensonic', 'Panasonic', 'KDK', 'Midea', 'Philips', 'Other'],
        required: true,
        applicableSubcategories: ['Stand & Table Fans', 'Rice Cookers & Kettles', 'Irons & Laundry'],
      },
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
        label: 'Apple MacBooks',
        comparable: false,
        fixedCeiling: 3500.00,
        titleHint: 'e.g. MacBook Air M2 2022 Space Grey 256GB',
      },
      {
        label: 'Windows Laptops',
        comparable: false,
        fixedCeiling: 3500.00,
        titleHint: 'e.g. Dell XPS 13, Lenovo ThinkPad T14 i7 16GB',
      },
      {
        label: 'Apple iPhones',
        comparable: false,
        fixedCeiling: 2500.00,
        titleHint: 'e.g. iPhone 13 Pro Max 256GB Graphite',
      },
      {
        label: 'Android Smartphones',
        comparable: false,
        fixedCeiling: 2500.00,
        titleHint: 'e.g. Samsung Galaxy S23 Ultra, Google Pixel 7',
      },
      {
        label: 'Tablets & iPads',
        comparable: false,
        fixedCeiling: 2000.00,
        titleHint: 'e.g. iPad Air 5th Gen 64GB, Samsung Tab S8',
      },
      {
        label: 'Keyboards & Mice',
        comparable: false,
        fixedCeiling: 500.00,
        titleHint: 'e.g. Logitech MX Master 3, Keychron K2 Wireless',
      },
      {
        label: 'Headphones & Audio',
        comparable: false,
        fixedCeiling: 800.00,
        titleHint: 'e.g. Sony WH-1000XM5, Apple AirPods Pro 2nd Gen',
      },
      {
        label: 'Cables, Hubs & Chargers',
        comparable: false,
        fixedCeiling: 150.00,
        titleHint: 'e.g. Anker 65W GaN Charger, Baseus USB-C Hub',
      },
      {
        label: 'Gaming Consoles & Games',
        comparable: false,
        fixedCeiling: 1500.00,
        titleHint: 'e.g. Nintendo Switch OLED, PS5 Controller',
      },
      {
        label: 'Software Licences',
        comparable: false,
        fixedCeiling: 150.00,
        titleHint: 'e.g. Microsoft Office 365 1-Year Key',
      },
    ],
    customFields: [
      {
        id: 'brand',
        label: 'Brand / Manufacturer',
        type: 'select',
        options: ['Sony', 'Logitech', 'Asus', 'Razer', 'Baseus', 'Anker', 'Other'],
        required: true,
        applicableSubcategories: ['Keyboards & Mice', 'Headphones & Audio', 'Cables, Hubs & Chargers', 'Gaming Consoles & Games'],
      },
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
        label: 'Club & Society Jerseys',
        comparable: false,
        studentMarket: true,
        fixedCeiling: 60.00,
        titleHint: 'e.g. UniKL Football Club Jersey 2024 Size M',
      },
      {
        label: 'Campus Event Tees',
        comparable: false,
        studentMarket: true,
        fixedCeiling: 60.00,
        titleHint: 'e.g. Pulse Hackathon 2024 Event Tee XL',
      },
      {
        label: 'Preloved Menswear',
        comparable: false,
        fixedCeiling: 120.00,
        titleHint: 'e.g. Nike Dri-FIT Tee Size L, Uniqlo Jacket M',
      },
      {
        label: 'Preloved Womenswear',
        comparable: false,
        fixedCeiling: 120.00,
        titleHint: 'e.g. Cotton On Dress Size S, Zara Blouse',
      },
      {
        label: 'Shoes & Sneakers',
        comparable: false,
        fixedCeiling: 250.00,
        titleHint: 'e.g. Nike Air Force 1 White Size UK8',
      },
      {
        label: 'Bags & Backpacks',
        comparable: true,
        fixedCeiling: 200.00,
        titleHint: 'e.g. Herschel Little America, Laptop Backpack',
        serpQuerySuffix: 'backpack Malaysia',
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
