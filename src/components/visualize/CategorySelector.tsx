'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AppWindow, PanelLeft, DoorOpen, House } from 'lucide-react';
import type { ProductCategory } from '@/types';

interface CategorySelectorProps {
  selected?: ProductCategory;
  onSelect: (category: ProductCategory) => void;
}

const categories: { value: ProductCategory; label: string; description: string; icon: typeof AppWindow }[] = [
  { value: 'roofing', label: 'Roofing', description: 'Shingles, metal, tile, and roof finishes', icon: House },
  {
    value: 'window',
    label: 'Windows',
    description: 'Double-hung, casement, bay, picture, and more',
    icon: AppWindow,
  },
  {
    value: 'sliding_glass_door',
    label: 'Patio Doors',
    description: 'Sliding, French, and multi-panel doors',
    icon: PanelLeft,
  },
  {
    value: 'entry_door',
    label: 'Entry Doors',
    description: 'Front doors, sidelights, and transoms',
    icon: DoorOpen,
  },
];

export function CategorySelector({ selected, onSelect }: CategorySelectorProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-brand-brown/60">
        What type of product do you want to visualize?
      </p>
      <div className="grid grid-cols-2 gap-2">
        {categories.map(({ value, label, description, icon: Icon }) => (
          <button key={value} type="button" aria-pressed={selected === value} onClick={() => onSelect(value)}>
            <Card className={`h-full transition-colors hover:border-brand-orange cursor-pointer ${selected === value ? 'border-brand-orange bg-brand-peach-light ring-1 ring-brand-orange' : ''}`}>
              <CardContent className="flex flex-col items-center justify-center gap-2 p-3">
                <Icon className="h-6 w-6 text-brand-orange" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-brand-brown">{label}</p>
                  <p className="text-xs text-brand-brown/50">{description}</p>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
