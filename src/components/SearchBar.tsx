import React from 'react';
import { Search, X, Tag, ArrowUpDown, RotateCcw, Car, Layers, AlertTriangle } from 'lucide-react';
import { FilterState, SortOrder } from '../types';

interface SearchBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  brands: string[];
  categories: string[];
  vehicles: string[];
  totalResults: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  onChange,
  brands,
  categories,
  vehicles,
  totalResults,
}) => {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, query: e.target.value });
  };

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

  const hasActiveFilters =
    filters.query !== '' ||
    filters.selectedBrand !== '' ||
    filters.selectedCategory !== '' ||
    filters.selectedVehicle !== '' ||
    filters.onlyLowStock ||
    filters.sortOrder !== 'NAME_ASC';

  const quickVehiclePills = ['پژو ۴۰۵', 'پژو ۲۰۶', 'سمند', 'پراید', 'تندر ۹۰'];

  return (
    <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 shadow-lg mb-6 space-y-3">
      
      {/* Search Input Row */}
      <div className="flex flex-col lg:flex-row items-center gap-3">
        
        {/* Main Search Bar */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5 text-purple-400" />
          </div>
          <input
            type="text"
            value={filters.query}
            onChange={handleQueryChange}
            placeholder="جستجوی سریع نام قطعه، کد OEM، بارکد، برند یا خودرو..."
            className="w-full pl-10 pr-11 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all shadow-inner"
          />
          {filters.query && (
            <button
              onClick={() => onChange({ ...filters, query: '' })}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Selects Row */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
          
          {/* Category Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[140px]">
            <select
              value={filters.selectedCategory}
              onChange={handleCategoryChange}
              className="w-full pl-7 pr-8 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="">همه دسته‌ها ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Layers className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Brand Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[130px]">
            <select
              value={filters.selectedBrand}
              onChange={handleBrandChange}
              className="w-full pl-7 pr-8 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="">همه برندها ({brands.length})</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <Tag className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[140px]">
            <select
              value={filters.sortOrder}
              onChange={handleSortChange}
              className="w-full pl-7 pr-8 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="NAME_ASC">الفبا: الف تا ی</option>
              <option value="PRICE_ASC">قیمت: کم به زیاد</option>
              <option value="PRICE_DESC">قیمت: زیاد به کم</option>
              <option value="STOCK_ASC">موجودی: کم به زیاد</option>
              <option value="STOCK_DESC">موجودی: زیاد به کم</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>

          {/* Low Stock Warning Filter Toggle */}
          <button
            onClick={handleToggleLowStock}
            className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
              filters.onlyLowStock
                ? 'bg-amber-950/80 border-amber-600 text-amber-300 shadow-md'
                : 'bg-slate-950/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
            title="فقط کالاهای رو به اتمام (کسری انبار)"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${filters.onlyLowStock ? 'text-amber-400' : 'text-slate-500'}`} />
            <span>کسری انبار</span>
          </button>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
              title="پاکسازی فیلترها"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی</span>
            </button>
          )}

        </div>

      </div>

      {/* Quick Vehicle Search Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-400">
        <span className="flex items-center gap-1 text-slate-500 text-[11px] font-medium ml-1">
          <Car className="w-3.5 h-3.5 text-purple-400" />
          میانبر خودرو:
        </span>
        {quickVehiclePills.map((v) => {
          const isActive = filters.query === v;
          return (
            <button
              key={v}
              onClick={() => onChange({ ...filters, query: isActive ? '' : v })}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                isActive
                  ? 'bg-purple-600 text-white border-purple-500 font-bold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-purple-500/50 hover:text-white'
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>

      {/* Results summary bar */}
      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>نتایج یافته شده:</span>
          <span className="font-bold text-purple-300 text-sm">{totalResults.toLocaleString('fa-IR')} کالا</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.selectedCategory && (
            <div className="flex items-center gap-1 bg-purple-950/50 border border-purple-800/50 text-purple-300 px-2 py-0.5 rounded-lg text-[11px]">
              <span>دسته: {filters.selectedCategory}</span>
              <button
                onClick={() => onChange({ ...filters, selectedCategory: '' })}
                className="text-purple-400 hover:text-purple-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {filters.selectedBrand && (
            <div className="flex items-center gap-1 bg-indigo-950/50 border border-indigo-800/50 text-indigo-300 px-2 py-0.5 rounded-lg text-[11px]">
              <span>برند: {filters.selectedBrand}</span>
              <button
                onClick={() => onChange({ ...filters, selectedBrand: '' })}
                className="text-indigo-400 hover:text-indigo-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
