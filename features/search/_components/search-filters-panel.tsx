import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SearchFilters } from '@/types/product.data-types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
  categories?: Array<{ id: string; name: string; slug: string }>;
}

export function SearchFiltersPanel({
  filters,
  onFilterChange,
  categories = [],
}: SearchFiltersProps) {
  // Local state for price inputs to avoid triggering fetch on every keystroke
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || '',
    max: filters.maxPrice || '',
  });
  const t = useTranslations('search_page.search_filter_panel');
  const c = useTranslations('home_layout.app_sidebar');

  const handlePriceApply = () => {
    onFilterChange({
      minPrice: priceRange.min || undefined,
      maxPrice: priceRange.max || undefined,
    });
  };

  const handleClearFilters = () => {
    setPriceRange({ min: '', max: '' });
    onFilterChange({
      category: undefined,
      shopId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    });
  };

  return (
    <div className="space-y-6 bg-background-secondary p-4 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm uppercase text-text">
          {t('t_filter')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-8 text-xs text-primary/70 hover:text-primary hover:bg-primary/10"
        >
          {t('t_reset')}
        </Button>
      </div>

      <Separator />

      <div className="space-y-3">
        {/* Title only search toggle */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-text">
              {t('t_title_only_label_name')}
            </h4>
            <p className="text-xs text-text-secondary">
              {t('t_title_only_desc_name')}
            </p>
          </div>
          <input
            type="checkbox"
            className="w-4 h-4 accent-primary cursor-pointer"
            checked={!!filters.titleOnly}
            onChange={(e) => onFilterChange({ titleOnly: e.target.checked })}
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-text">{c('category')}</h4>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => onFilterChange({ category: undefined })}
              className={`text-sm text-left px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                !filters.category
                  ? 'bg-secondary font-medium text-primary'
                  : 'text-text hover:bg-secondary/50'
              }`}
            >
              {t('t_all_cate')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ category: cat.slug })}
                className={`text-sm text-left px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                  filters.category === cat.slug
                    ? 'bg-secondary font-medium text-primary'
                    : 'text-text hover:bg-secondary/50'
                }`}
              >
                {c(cat.slug)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-text">{t('t_price')}</h4>
        <div className="text-xs text-text-secondary mb-2">
          {t('t_price_range')}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="0"
            value={priceRange.min}
            onChange={(e) =>
              setPriceRange((prev) => ({ ...prev, min: e.target.value }))
            }
            className="h-8 text-sm bg-primary/10 hover:bg-primary/30"
          />
          <span className="text-primary">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) =>
              setPriceRange((prev) => ({ ...prev, max: e.target.value }))
            }
            className="h-8 text-sm bg-primary/10 hover:bg-primary/30"
          />
        </div>
        <Button
          variant="outline"
          className="w-full mt-2 h-8 text-xs border-primary text-text/60 cursor-pointer hover:bg-secondary hover:text-primary"
          onClick={handlePriceApply}
        >
          {t('t_apply')}
        </Button>
      </div>

      <Separator />

      <div className="space-y-3 opacity-60 pointer-events-none">
        <h4 className="text-sm font-semibold text-text">{t('t_supplier')}</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <div className="w-4 h-4 border rounded bg-secondary/20"></div>
            2T3H Trading
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <div className="w-4 h-4 border rounded bg-secondary/20"></div>{' '}
            Global Store
          </div>
        </div>
      </div>
    </div>
  );
}
