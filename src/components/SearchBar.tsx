import React, { useEffect, useRef } from 'react';
import { Tag, ArrowUpDown, RotateCcw, Car, Layers, AlertTriangle, Sparkles, X } from 'lucide-react';
import { FilterState, SortOrder } from '../types';

interface SearchBarProps {
  isFilterOpen: boolean;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  brands: string[];
  categories: string[];
  vehicles: string[];
  totalResults: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  isFilterOpen,
  filters,
  onChange,
  brands,
  categories,
  vehicles,
  totalResults,
}) => {
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // USB/Hardware Barcode Scanner Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 3 && timeDiff < 80) {
          e.preventDefault();
          const scannedCode = barcodeBufferRef.current.trim();
          if (scannedCode) {
            onChange({ ...filters, query: scannedCode });
          }
        }
        barcodeBufferRef.current = '';
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (timeDiff > 100) {
          barcodeBufferRef.current = e.key;
        } else {
          barcodeBufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filters, onChange]);

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, selectedBrand: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, selectedCategory: e.target.value });
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, selectedVehicle: e.target.value });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, sortOrder: e.target.value as SortOrder });
  };

  const handleToggleLowStock = () => {
    onChange({ ...filters, onlyLowStock: !filters.onlyLowStock });
  };

  const handleResetFilters = () => {
    onChange({
      query: '',
      selectedBrand: '',
      selectedCategory: '',
      selectedVehicle: '',
      onlyLowStock: false,
      sortOrder: 'NAME_ASC',
      minPrice: null,
      maxPrice: null,
    });
  };

  const removeQueryToken = (tokenToRemove: string) => {
    const tokens = filters.query.trim().split(/\s+/).filter((t) => t !== tokenToRemove);
    onChange({ ...filters, query: tokens.join(' ') });
  };

  const queryTokens = filters.query.trim().split(/\s+/).filter(Boolean);

  const hasActiveFilters =
    filters.query !== '' ||
    filters.selectedBrand !== '' ||
    filters.selectedCategory !== '' ||
    filters.selectedVehicle !== '' ||
    filters.onlyLowStock ||
    filters.sortOrder !== 'NAME_ASC';

  const quickVehiclePills = ['پژو ۴۰۵', 'پژو ۲۰۶', 'سمند', 'پراید', 'تندر ۹۰'];

  return (
    <div className="space-y-2">
      
      {/* Collapsible Filter Panel */}
      {isFilterOpen && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 shadow-xl space-y-2.5 animate-fade-in mt-2">
          
          {/* Dropdowns Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            
            {/* Vehicle Dropdown */}
            <div className="relative">
              <select
                value={filters.selectedVehicle || ''}
                onChange={handleVehicleChange}
                className="w-full pl-6 pr-7 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
              >
                <option value="">همه خودروها ({vehicles.length})</option>
                {vehicles.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <Car className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={filters.selectedCategory}
                onChange={handleCategoryChange}
                className="w-full pl-6 pr-7 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
              >
                <option value="">همه دسته‌ها ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Layers className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Brand Dropdown */}
            <div className="relative">
              <select
                value={filters.selectedBrand}
                onChange={handleBrandChange}
                className="w-full pl-6 pr-7 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
              >
                <option value="">همه برندها ({brands.length})</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={filters.sortOrder}
                onChange={handleSortChange}
                className="w-full pl-6 pr-7 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none cursor-pointer"
              >
                <option value="NAME_ASC">چیدمان: مرتبط‌ترین / الفبا</option>
                <option value="PRICE_ASC">قیمت: کم به زیاد</option>
                <option value="PRICE_DESC">قیمت: زیاد به کم</option>
                <option value="STOCK_ASC">موجودی: کم به زیاد</option>
                <option value="STOCK_DESC">موجودی: زیاد به کم</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Low Stock Filter Button */}
            <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
              <button
                type="button"
                onClick={handleToggleLowStock}
                className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  filters.onlyLowStock
                    ? 'bg-amber-950/80 border-amber-600 text-amber-300 shadow-md'
                    : 'bg-slate-950 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className={`w-3.5 h-3.5 ${filters.onlyLowStock ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>کسری انبار</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium transition-colors shrink-0"
                  title="پاکسازی فیلترها"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

          {/* Quick Vehicle Shortcuts Row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80 text-xs">
            <span className="text-slate-500 text-[11px] font-medium ml-1 flex items-center gap-1">
              <Car className="w-3 h-3 text-purple-400" />
              خودروها:
            </span>
            {quickVehiclePills.map((v) => {
              const isActive = filters.selectedVehicle === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    onChange({ ...filters, selectedVehicle: isActive ? '' : v });
                  }}
                  className={`px-2 py-0.5 rounded-lg border text-[11px] transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white border-purple-500 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-purple-500/40 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>

        </div>
      )}

      {/* Query Token Badges & Active Filter Badges (Minimal strip shown if active) */}
      {(queryTokens.length > 1 || filters.selectedVehicle || filters.selectedCategory || filters.selectedBrand || filters.onlyLowStock) && (
        <div className="flex flex-wrap items-center gap-1.5 py-1 text-xs text-slate-300">
          
          {queryTokens.length > 1 && (
            <span className="flex items-center gap-1 text-purple-400 text-[11px] font-medium">
              <Sparkles className="w-3 h-3" />
              کلمات:
            </span>
          )}
          {queryTokens.length > 1 &&
            queryTokens.map((token, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-950/80 border border-purple-700/70 text-purple-200 rounded-lg text-[10px]"
              >
                <span>+ {token}</span>
                <button
                  type="button"
                  onClick={() => removeQueryToken(token)}
                  className="hover:text-rose-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

          {filters.selectedVehicle && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-950/60 border border-amber-800/60 text-amber-300 rounded-lg text-[10px]">
              <span>خودرو: {filters.selectedVehicle}</span>
              <button
                type="button"
                onClick={() => onChange({ ...filters, selectedVehicle: '' })}
                className="text-amber-400 hover:text-amber-200"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.selectedCategory && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-950/60 border border-purple-800/60 text-purple-300 rounded-lg text-[10px]">
              <span>دسته: {filters.selectedCategory}</span>
              <button
                type="button"
                onClick={() => onChange({ ...filters, selectedCategory: '' })}
                className="text-purple-400 hover:text-purple-200"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.selectedBrand && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 rounded-lg text-[10px]">
              <span>برند: {filters.selectedBrand}</span>
              <button
                type="button"
                onClick={() => onChange({ ...filters, selectedBrand: '' })}
                className="text-indigo-400 hover:text-indigo-200"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.onlyLowStock && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-950/80 border border-amber-700 text-amber-300 rounded-lg text-[10px]">
              <span>کسری انبار</span>
              <button
                type="button"
                onClick={() => onChange({ ...filters, onlyLowStock: false })}
                className="text-amber-400 hover:text-amber-200"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

        </div>
      )}

    </div>
  );
};
