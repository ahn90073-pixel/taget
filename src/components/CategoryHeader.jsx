import { Camera, Dumbbell, Filter, Home, Laptop, Package, Shirt, Smartphone, Sparkles, Watch } from 'lucide-react';

const categoryIcons = [Smartphone, Shirt, Home, Laptop, Sparkles, Dumbbell, Camera, Watch];

export default function CategoryHeader({ categories = [], selectedCategory = 'all', onSelect }) {
  return (
    <section aria-label="تصنيفات المنتجات" className="sticky top-[73px] z-10 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
        <Filter className="h-4 w-4 text-brand-600" />
        <span>تصفح حسب التصنيف</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin" role="tablist" aria-label="تصنيفات المنتجات">
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === 'all'}
          onClick={() => onSelect('all')}
          className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${selectedCategory === 'all' ? 'bg-brand-600 text-white shadow-md shadow-brand-200' : 'bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-700'}`}
        >
          <Package className="h-4 w-4" />
          كل التصنيفات
        </button>
        {categories.map((category, index) => {
          const Icon = categoryIcons[index % categoryIcons.length];
          const active = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(category)}
              className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${active ? 'bg-brand-600 text-white shadow-md shadow-brand-200' : 'bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-700'}`}
            >
              <Icon className="h-4 w-4" />
              {category}
            </button>
          );
        })}
      </div>
    </section>
  );
}
