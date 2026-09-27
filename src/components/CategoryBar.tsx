import React from 'react';
import { Category } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { LayoutGrid } from 'lucide-react';

interface CategoryBarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  productsCountByCategory: Record<string, number>;
  totalProductsCount: number;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  productsCountByCategory,
  totalProductsCount,
}) => {
  // Only display active categories
  const activeCategories = categories.filter((c) => c.is_active !== false);

  return (
    <div className="w-full bg-white border-b border-slate-200/70 py-3 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin no-scrollbar">
          {/* All categories button */}
          <button
            onClick={() => onSelectCategory(null)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryId === null
                ? 'text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
            style={
              selectedCategoryId === null
                ? { backgroundColor: 'var(--color-primary, #059669)' }
                : undefined
            }
          >
            <LayoutGrid className="w-4 h-4" />
            <span>جميع المنتجات</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                selectedCategoryId === null
                  ? 'bg-black/20 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {totalProductsCount}
            </span>
          </button>

          {/* Dynamic Active Categories */}
          {activeCategories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const count = productsCountByCategory[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
                style={
                  isSelected
                    ? { backgroundColor: 'var(--color-primary, #059669)' }
                    : undefined
                }
              >
                <DynamicIcon name={cat.icon_name || cat.icon} className="w-4 h-4" />
                <span>{cat.name}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-black/20 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
