'use client';

interface Variant {
  id: string;
  name: string;
  price: string;
  image: string;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedId: string;
  onSelect: (variant: Variant) => void;
}

export function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: VariantSelectorProps) {
  return (
    <div className="mt-2 w-full">
      <p className="font-semibold text-text mb-2">Phân loại hàng</p>
      <div className="flex flex-row flex-wrap gap-2">
        {variants.map((v) => (
          <button
            key={v.id}
            className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-all duration-200 ${
              selectedId === v.id
                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                : 'border-input hover:border-primary/50 hover:bg-muted/50'
            }`}
            onClick={() => onSelect(v)}
          >
            {v.name}
          </button>
        ))}
      </div>
    </div>
  );
}
