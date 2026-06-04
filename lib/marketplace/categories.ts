/**
 * Pulse Marketplace: Category Registry (v3.0)
 * Logic: Student Life Cycle Model
 */

export type CategoryID = 'HUNGER' | 'ACADEMIC' | 'HOSTEL' | 'TECH' | 'APPAREL';

export interface CategoryConfig {
  id: CategoryID;
  label: string;
  subtext: string;
  governance: 'REGULATED' | 'OPEN';
  ceiling?: number; // Universal ceiling if applicable
  subcategories: {
    label: string;
    ceiling?: number; // Specific ceiling for subcategory
  }[];
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
  HUNGER: {
    id: 'HUNGER',
    label: 'Hunger Economy',
    subtext: 'Food and campus snacks',
    governance: 'REGULATED',
    ceiling: 25.00,
    subcategories: [
      { label: 'Campus Canteen' },
      { label: 'Snacks & Drinks' },
      { label: 'Home Cook' },
      { label: 'Preorder Catering' }
    ],
    customFields: [
      { 
        id: 'active_until', 
        label: 'Active Until', 
        type: 'timestamp', 
        required: true,
        placeholder: 'When is this food no longer available?'
      },
      {
        id: 'pickup_location',
        label: 'Pickup Point',
        type: 'text',
        placeholder: 'e.g. MIIT Canteen, Block A Lobby',
        required: true
      }
    ]
  },
  ACADEMIC: {
    id: 'ACADEMIC',
    label: 'Academic Legacy',
    subtext: 'Books, notes and lab gear',
    governance: 'REGULATED',
    subcategories: [
      { label: 'Textbooks', ceiling: 80.00 },
      { label: 'Lab Reports', ceiling: 15.00 },
      { label: 'Digital Scripts', ceiling: 25.00 },
      { label: 'Lab Equipment', ceiling: 60.00 },
      { label: 'Stationery Bundles', ceiling: 30.00 }
    ],
    customFields: [
      {
        id: 'department',
        label: 'Faculty / Department',
        type: 'select',
        options: ['MIIT', 'Business', 'Engineering', 'Architecture', 'Law', 'Foundation', 'Other'],
        required: true
      },
      {
        id: 'year_semester',
        label: 'Academic Year/Sem',
        type: 'text',
        placeholder: 'e.g. Year 2 Sem 1',
        required: true
      },
      {
        id: 'subject_code',
        label: 'Subject Code',
        type: 'text',
        placeholder: 'e.g. CSC3109'
      }
    ]
  },

  HOSTEL: {
    id: 'HOSTEL',
    label: 'Hostel Trade',
    subtext: 'Furniture and appliances',
    governance: 'OPEN',
    subcategories: [
      { label: 'Furniture' },
      { label: 'Appliances' },
      { label: 'Storage' },
      { label: 'Room Decor' },
      { label: 'Misc' }
    ],
    customFields: [
      {
        id: 'pickup_difficulty',
        label: 'Pickup Difficulty',
        type: 'toggle',
        options: ['Easy (Fits in Car)', 'Moderate (Needs 2 People)', 'Heavy (Needs Lorry/Van)'],
        required: true
      }
    ]
  },
  TECH: {
    id: 'TECH',
    label: 'Digital & Tech Gear',
    subtext: 'Devices, keys and components',
    governance: 'OPEN',
    subcategories: [
      { label: 'Devices' },
      { label: 'Peripherals' },
      { label: 'Access Keys' },
      { label: 'Components' },
      { label: 'Cables & Accessories' }
    ],
    customFields: [
      {
        id: 'specs',
        label: 'Technical Specs',
        type: 'text',
        placeholder: 'e.g. 16GB RAM, 512GB SSD',
        required: true
      },
      {
        id: 'warranty',
        label: 'Warranty Status',
        type: 'select',
        options: ['None', 'Manufacturer Warranty', 'Seller Warranty'],
        required: true
      },
      {
        id: 'validity_period',
        label: 'Validity (Digital Keys)',
        type: 'text',
        placeholder: 'e.g. 1 Year, Lifetime'
      }
    ]
  },
  APPAREL: {
    id: 'APPAREL',
    label: 'Campus Apparel',
    subtext: 'Merch, club shirts, and preloved',
    governance: 'OPEN',
    subcategories: [
      { label: 'Official Merch' },
      { label: 'Club/Faculty Shirts' },
      { label: 'Preloved Clothes' },
      { label: 'Accessories' }
    ],
    customFields: [
      {
        id: 'size',
        label: 'Size',
        type: 'select',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'],
        required: true
      },
      {
        id: 'condition',
        label: 'Condition',
        type: 'select',
        options: ['Brand New', 'Like New', 'Used - Good', 'Used - Fair'],
        required: true
      }
    ]
  }
};
