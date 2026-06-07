export interface Item {
  id?: string;
  seller_id: string;
  seller_name: string;
  title: string;
  description?: string;
  price: number;
  category: string;
  subcategory: string;
  stock_count?: number;
  image_url?: string;
  images?: string[];
  metadata?: Record<string, any>;
  status?: string;
  price_tier?: string;
  governance_ceiling?: number | null;
  governance_status?: string;
  is_price_flagged?: boolean;
  price_flag_count?: number;
  flag_source?: string | null;
  price_appeal?: string;
  is_official?: boolean;
  is_community_flagged?: boolean;
  report_count?: number;
  pcs_certified?: boolean;
  pcs_result?: {
    isApproved: boolean;
    justification: string;
    marketPrice: number;
    maxAllowedPrice: number;
    checkedAt: string;
  };
  created_at?: any;
  updated_at?: any;
}

export type PriceControlledSubcategory = {
  label: string;
  is_price_controlled: boolean;
};
