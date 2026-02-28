import { cn } from '@/lib/utils';
import { SearchFilters } from '@/types/product.data-types';
import { useTranslations } from 'next-intl';

interface SearchSortBarProps {
  filters: SearchFilters;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
}

export function SearchSortBar({ filters, onFilterChange }: SearchSortBarProps) {
  const isSortActive = (key: string, order: string = 'desc') => {
    return filters.sortBy === key && filters.sortOrder === order;
  };
  const t = useTranslations('search_page.search_sort_bar');
  const handleSort = (
    key: 'createdAt' | 'price' | 'rating',
    order: 'asc' | 'desc'
  ) => {
    onFilterChange({ sortBy: key, sortOrder: order });
  };

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-border bg-background-secondary p-4 mb-4 rounded-lg">
      <span className="text-sm text-text mr-2">{t('t_sort_by')}:</span>

      {/* Popular / Newest Tabs */}
      <button
        onClick={() => handleSort('createdAt', 'desc')}
        className={cn(
          'px-4 py-2 text-sm rounded-full transition-colors cursor-pointer',
          isSortActive('createdAt', 'desc')
            ? 'bg-secondary/30 text-primary font-medium border border-primary/50'
            : 'text-text hover:bg-secondary/50'
        )}
      >
        {t('t_newest')}
      </button>

      <button
        onClick={() => handleSort('rating', 'desc')}
        className={cn(
          'px-4 py-2 text-sm rounded-full transition-colors cursor-pointer',
          isSortActive('rating', 'desc')
            ? 'bg-secondary/50 text-primary font-medium border border-primary/50'
            : 'text-text hover:bg-secondary/50'
        )}
      >
        {t('t_top_rate')}
      </button>

      <button
        onClick={() => handleSort('price', 'asc')}
        className={cn(
          'px-4 py-2 text-sm rounded-full transition-colors cursor-pointer',
          isSortActive('price', 'asc')
            ? 'bg-secondary/50 text-primary font-medium border border-primary/50'
            : 'text-text hover:bg-secondary/50'
        )}
      >
        {t('t_asc')}
      </button>

      <button
        onClick={() => handleSort('price', 'desc')}
        className={cn(
          'px-4 py-2 text-sm rounded-full transition-colors cursor-pointer',
          isSortActive('price', 'desc')
            ? 'bg-secondary/50 text-primary font-medium border border-primary/50'
            : 'text-text hover:bg-secondary/50'
        )}
      >
        {t('t_des')}
      </button>
    </div>
  );
}
