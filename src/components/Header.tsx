import React, { useState, useEffect } from 'react';
import {
  Wrench,
  ScanBarcode,
  Plus,
  SlidersHorizontal,
  Settings,
  Coins,
  Search,
  X,
  ArrowLeft
} from 'lucide-react';
import { CurrencyMode } from '../types';

interface HeaderProps {
  totalCount: number;
  filteredCount: number;
  currencyMode: CurrencyMode;
  onOpenScanner: () => void;
  onOpenAddModal: () => void;
  onOpenSettingsToolsModal: () => void;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  activeFilterCount: number;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  filteredCount,
  currencyMode,
  onOpenScanner,
  onOpenAddModal,
  onOpenSettingsToolsModal,
  isFilterOpen,
  onToggleFilter,
  activeFilterCount,
  searchQuery,
  onSearchQueryChange,
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);

  // Sync internal state if searchQuery is reset from external filter bar
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleApplySearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearchQueryChange(localQuery.trim());
  };

  const handleClearSearch = () => {
    setLocalQuery('');
    onSearchQueryChange('');
  };

  return (
    <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 shadow-md transition-all">
      {/* Animated Top Store Brand Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-purple-950/50 to-slate-950 border-b border-purple-900/30 py-1.5 px-4 flex items-center justify-center gap-2 overflow-hidden">
          <div className="flex items-center gap-2 animate-pulse-glow">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wider animate-shimmer-text">
                یدک مارکت
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-purple-300/90 tracking-normal">
                (زینلی)
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold mr-1">
              <Wrench className="w-3 h-3 text-purple-400" />
              انبار و سیستم استعلام قیمت
            </span>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-2 sm:gap-4">

          
          {/* Center Expandable Search Input Form */}
          <form
            onSubmit={handleApplySearch}
            className={`relative flex-1 transition-all duration-300 ease-out mx-1 sm:mx-2 ${
              isFocused ? 'max-w-3xl ring-2 ring-purple-500/60 rounded-2xl scale-[1.01]' : 'max-w-2xl'
            }`}
          >
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search className={`w-4 h-4 transition-colors ${isFocused ? 'text-purple-300' : 'text-purple-400'}`} />
            </div>

            <input
              type="text"
              value={localQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Slight delay to allow clicking search button
                setTimeout(() => setIsFocused(false), 200);
              }}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="نام کالا، بارکد یا کد فنی (مثلاً 206 ایساکو)..."
              className={`w-full pr-9 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none transition-all shadow-inner ${
                localQuery ? 'pl-36 sm:pl-44' : 'pl-24 sm:pl-32'
              }`}
            />

            {/* Action buttons inside search bar */}
            <div className="absolute inset-y-0 left-0 pl-1.5 flex items-center gap-1">
              
              {localQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                  title="پاک کردن"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Explicit Search Action Button */}
              <button
                type="submit"
                className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm shrink-0"
                title="اعمال جستجو"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">جستجو</span>
              </button>

              {/* Camera Scanner Button */}
              <button
                type="button"
                onClick={onOpenScanner}
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 rounded-lg text-[11px] font-bold transition-all shadow-sm shrink-0"
                title="اسکن بارکد با دوربین"
              >
                <ScanBarcode className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">دوربین</span>
              </button>

            </div>
          </form>

          {/* Right Action Buttons */}
          <div className={`items-center gap-1.5 sm:gap-2 shrink-0 transition-all ${isFocused ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={onToggleFilter}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isFilterOpen || activeFilterCount > 0
                  ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="فیلترها و مرتب‌سازی"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">فیلترها</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[10px] font-extrabold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Add New Product Button */}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02] shrink-0"
              title="افزودن کالا"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">افزودن</span>
            </button>

            {/* Settings & Tools Modal Button */}
            <button
              type="button"
              onClick={onOpenSettingsToolsModal}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1"
              title="تنظیمات، سود، گوگل شیت و CSV"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline text-xs font-bold">تنظیمات</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
