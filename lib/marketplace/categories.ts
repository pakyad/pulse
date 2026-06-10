/**
 * Pulse Marketplace: Category Registry (v6.0)
 * STUDENT ECONOMY MODEL
 *
 * Live SerpAPI comparison is ONLY for standardised NEW items students must buy.
 * Unique items use "Soft Warning" logic or "Free Market" bypasses.
 *
 * comparable: true   SerpAPI live search triggered
 * comparable: false  Fixed ceiling or Soft Warning
 */

export type CategoryID = 'ACADEMIC' | 'HOSTEL' | 'TECH' | 'APPAREL' | 'SERVICES';

export interface SubcategoryConfig {
  label: string;
  comparable: boolean;
  fixedCeiling?: number;
  titleHint: string;
  serpQuerySuffix?: string;
  studentMarket?: boolean;
  brandOptions?: string[];
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

  // ==========================================
  // ACADEMIC & STUDY
  // ==========================================
  ACADEMIC: {
    id: 'ACADEMIC',
    label: 'Academic & Study',
    subtext: 'Books, lab gear, stationery and notes',
    governance: 'REGULATED',
    subcategories: [
      {
        label: 'Textbooks & Reference Books',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 250.00,
        titleHint: 'e.g. Thomas Calculus 14th Ed, Intro to Java',
        serpQuerySuffix: 'textbook Malaysia',
      },
      {
        label: 'Handwritten Notes & Summaries',
        comparable: false,
        fixedCeiling: 20.00, // Acts as Soft Warning threshold
        titleHint: 'e.g. CSC3109 Data Structures Sem 1 Notes',
      },
      {
        label: 'Past Year Papers & Assignments',
        comparable: false,
        fixedCeiling: 10.00, // Acts as Soft Warning threshold
        titleHint: 'e.g. CSC3109 Final Exam 2022-2024',
      },
      {
        label: 'Scientific Calculators',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 120.00,
        titleHint: 'e.g. Casio fx-570ES PLUS',
        serpQuerySuffix: 'scientific calculator Malaysia buy',
      },
      {
        label: 'Lab Equipment & Safety Gear',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 80.00,
        titleHint: 'e.g. White Lab Coat Size M, Goggles',
        serpQuerySuffix: 'Malaysia buy',
      },
      {
        label: 'Architecture & Drafting Tools',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 150.00,
        titleHint: 'e.g. T-Square, Vernier Caliper, Drafting Tube',
        serpQuerySuffix: 'Malaysia buy',
      },
      {
        label: 'Art & Studio Supplies',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 100.00,
        titleHint: 'e.g. Acrylic Paints set, A3 Sketchpad',
        serpQuerySuffix: 'Malaysia',
      },
      {
        label: 'Stationery Bundles',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 60.00,
        titleHint: 'e.g. Stabilo Highlighter Set, Pilot G2 Pack',
        serpQuerySuffix: 'Malaysia',
      },
      {
        label: 'Files, Binders & Organizers',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 50.00,
        titleHint: 'e.g. 2-Ring Binder, Clear Folders pack',
        serpQuerySuffix: 'Malaysia',
      },
      {
        label: 'Clinical Scrubs & Uniforms',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 150.00,
        titleHint: 'e.g. Nursing Scrub Suit Size L',
        serpQuerySuffix: 'Malaysia',
      },
      {
        label: 'Flashcards & Study Guides',
        comparable: false,
        fixedCeiling: 30.00, // Acts as Soft Warning threshold
        titleHint: 'e.g. Medical Anatomy Flashcards',
      },
      {
        label: 'Presentation Remotes / Clickers',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 100.00,
        titleHint: 'e.g. Logitech R400 Presenter',
        serpQuerySuffix: 'Malaysia',
      },
      {
        label: 'Other',
        comparable: false,
        fixedCeiling: 500.00,
        titleHint: 'e.g. Academic item not listed above',
      },
    ],
    customFields: [
      {
        id: 'program',
        label: 'Program / Faculty',
        type: 'select',
        options: ['Software Engineering', 'Computer Science', 'Information Technology', 'Business Administration', 'Accounting', 'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Architecture', 'Law', 'Medicine & Nursing', 'Arts & Design', 'Other'],
        required: true,
        applicableSubcategories: ['Textbooks & Reference Books', 'Handwritten Notes & Summaries', 'Past Year Papers & Assignments', 'Flashcards & Study Guides', 'Clinical Scrubs & Uniforms'],
      },
      {
        id: 'year_semester',
        label: 'Academic Year/Sem',
        type: 'text',
        placeholder: 'e.g. Year 2 Sem 1',
        required: true,
        applicableSubcategories: ['Textbooks & Reference Books', 'Handwritten Notes & Summaries', 'Past Year Papers & Assignments', 'Flashcards & Study Guides'],
      },
      {
        id: 'subject_code',
        label: 'Subject Code',
        type: 'text',
        placeholder: 'e.g. CSC3109',
        applicableSubcategories: ['Textbooks & Reference Books', 'Handwritten Notes & Summaries', 'Past Year Papers & Assignments', 'Flashcards & Study Guides'],
      },
    ],
  },

  // ==========================================
  // HOSTEL LIVING & SPORTS
  // ==========================================
  HOSTEL: {
    id: 'HOSTEL',
    label: 'Hostel Living & Sports',
    subtext: 'Room essentials, appliances, and gym gear',
    governance: 'OPEN',
    subcategories: [
      {
        label: 'Cooling & Ventilation',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 200.00,
        titleHint: 'e.g. Stand Fan, Mini Air Cooler',
        serpQuerySuffix: 'fan Malaysia buy',
      },
      {
        label: 'Cooking Appliances',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 300.00,
        titleHint: 'e.g. Rice Cooker 1.0L, Kettle, Toaster',
        serpQuerySuffix: 'Malaysia buy',
      },
      {
        label: 'Laundry & Cleaning Supplies',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 200.00,
        titleHint: 'e.g. Steam Iron, Drying Rack',
        serpQuerySuffix: 'Malaysia buy',
      },
      {
        label: 'Furniture',
        comparable: false,
        studentMarket: true,
        fixedCeiling: 400.00, // Soft Warning threshold
        titleHint: 'e.g. Study Table, Ergonomic Chair',
      },
      {
        label: 'Storage & Organization',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 150.00,
        titleHint: 'e.g. Stackable Drawer, Wardrobe Organizer',
        serpQuerySuffix: 'Malaysia',
      },
      {
        label: 'Bedding & Comfort',
        comparable: false,
        studentMarket: true,
        fixedCeiling: 100.00, // Soft Warning threshold
        titleHint: 'e.g. Single Bed Mattress, Pillow Set',
      },
      {
        label: 'Room Decor & Lighting',
        comparable: false,
        studentMarket: true,
        titleHint: 'e.g. Study Lamp, Mirror, LED Strips',
      },
      {
        label: 'Snacks & Instant Food',
        comparable: false,
        studentMarket: true,
        titleHint: 'e.g. Maggi Bundle, 3-in-1 Coffee pack',
      },
      {
        label: 'Sports & Gym Gear',
        comparable: false,
        studentMarket: true,
        titleHint: 'e.g. Badminton Racket, 5kg Dumbbell, Yoga Mat',
      },
      {
        label: 'Other',
        comparable: false,
        fixedCeiling: 500.00,
        titleHint: 'e.g. Hostel or room item not listed above',
      },
    ],
    customFields: [
      {
        id: 'pickup_difficulty',
        label: 'Pickup Difficulty',
        type: 'toggle',
        options: ['Easy (Fits in Car)', 'Moderate (Needs 2 People)', 'Heavy (Needs Lorry/Van)'],
        required: true,
        applicableSubcategories: ['Cooling & Ventilation', 'Cooking Appliances', 'Laundry & Cleaning Supplies', 'Furniture', 'Storage & Organization'],
      },
    ],
  },

  // ==========================================
  // TECH ESSENTIALS
  // ==========================================
  TECH: {
    id: 'TECH',
    label: 'Tech Essentials',
    subtext: 'Laptops, phones, accessories and chargers',
    governance: 'OPEN',
    subcategories: [
      {
        label: 'Laptops & Computers',
        comparable: false,
        titleHint: 'e.g. MacBook Air M2, Lenovo ThinkPad',
      },
      {
        label: 'Smartphones & Tablets',
        comparable: false,
        titleHint: 'e.g. iPhone 13, iPad Air, Samsung S23',
      },
      {
        label: 'Computer Accessories',
        comparable: false,
        titleHint: 'e.g. Wireless Mouse, Mechanical Keyboard',
      },
      {
        label: 'Audio & Wearables',
        comparable: false,
        titleHint: 'e.g. AirPods Pro, Sony Headphones, Apple Watch',
      },
      {
        label: 'Power Banks & Chargers',
        comparable: false,
        titleHint: 'e.g. 10000mAh Powerbank, 65W GaN Charger',
      },
      {
        label: 'Thumb Drives & Storage',
        comparable: false,
        titleHint: 'e.g. 1TB External HDD, 64GB Pendrive',
      },
      {
        label: 'Gaming & Entertainment',
        comparable: false,
        titleHint: 'e.g. PS5 Controller, Nintendo Switch',
      },
      {
        label: 'Software & Subscriptions',
        comparable: false,
        titleHint: 'e.g. Office 365 1-Year Key',
      },
      {
        label: 'Other',
        comparable: false,
        titleHint: 'e.g. Tech item not listed above',
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
    ],
  },

  // ==========================================
  // CAMPUS LIFESTYLE & APPAREL
  // ==========================================
  APPAREL: {
    id: 'APPAREL',
    label: 'Campus Lifestyle & Apparel',
    subtext: 'Shirts, bags, shoes and daily carry',
    governance: 'OPEN',
    subcategories: [
      {
        label: 'Faculty & Event Shirts',
        comparable: false,
        studentMarket: true,
        titleHint: 'e.g. UniKL Engineering Shirt XL, Hackathon Tee',
      },
      {
        label: "Men's Fashion",
        comparable: false,
        titleHint: 'e.g. Uniqlo Jacket M, Zara Jeans',
      },
      {
        label: "Women's Fashion",
        comparable: false,
        titleHint: 'e.g. Cotton On Dress, Blouse',
      },
      {
        label: 'Footwear',
        comparable: false,
        titleHint: 'e.g. Nike Air Force 1 UK8, Formal Shoes',
      },
      {
        label: 'Bags & Backpacks',
        comparable: false,
        studentMarket: true,
        titleHint: 'e.g. Herschel Backpack, Laptop Bag',
      },
      {
        label: 'Lanyards & ID Holders',
        comparable: false,
        studentMarket: true,
        titleHint: 'e.g. Campus Lanyard, Card Holder',
      },
      {
        label: 'Umbrellas & Raincoats',
        comparable: true,
        studentMarket: true,
        fixedCeiling: 60.00,
        titleHint: 'e.g. Compact Umbrella, Raincoat',
        serpQuerySuffix: 'Malaysia',
      },
      {
        label: 'Other',
        comparable: false,
        titleHint: 'e.g. Apparel item not listed above',
      },
    ],
    customFields: [
      {
        id: 'size',
        label: 'Size',
        type: 'select',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'Not Applicable'],
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

  // ==========================================
  // STUDENT SERVICES
  // ==========================================
  SERVICES: {
    id: 'SERVICES',
    label: 'Student Services',
    subtext: 'Tutoring, printing, repairs and gigs',
    governance: 'OPEN',
    subcategories: [
      { label: 'Tutoring & Assignment Help', comparable: false, titleHint: 'e.g. Calculus Tutor for Sem 2' },
      { label: 'Printing & Binding Services', comparable: false, titleHint: 'e.g. A4 colour printing & binding' },
      { label: 'IT & Laptop Repair', comparable: false, titleHint: 'e.g. Laptop Formatting, Virus Removal' },
      { label: 'Design & Photography', comparable: false, titleHint: 'e.g. Graduation Photoshoot, Poster Design' },
      { label: 'Freelance Gigs', comparable: false, titleHint: 'e.g. Data Entry, Translation, Coding' },
      { label: 'Other', comparable: false, titleHint: 'Describe your service' },
    ],
    customFields: [],
  },
};
