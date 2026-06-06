import { MARKETPLACE_CATEGORIES, CategoryID } from '@/lib/marketplace/categories';

interface Props {
  price: number;
  category: string;
  subcategory: string;
}

export default function PriceHealthIndicator({ price, category, subcategory }: Props) {
  const catConfig = MARKETPLACE_CATEGORIES[category as CategoryID];
  if (!catConfig) return null;

  const subConfig = catConfig.subcategories.find(s => s.label === subcategory);
  const ceiling = subConfig?.fixedCeiling ?? catConfig.ceiling;
  if (!ceiling || !price) return null;

  const ratio = price / ceiling;

  if (ratio <= 1.0) {
    return (
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[9px] font-bold text-emerald-500">Competitive</span>
      </span>
    );
  }
  if (ratio <= 1.5) {
    return (
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span className="text-[9px] font-bold text-amber-500">Above Range</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      <span className="text-[9px] font-bold text-red-500">Overpriced</span>
    </span>
  );
}
