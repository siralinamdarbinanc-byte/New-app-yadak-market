import React from 'react';
import {
  Wrench,
  ScanBarcode,
  FileSpreadsheet,
  Percent,
  Package,
  Plus,
  BarChart3,
  Cloud,
  Coins,
  AlertTriangle
} from 'lucide-react';
import { CurrencyMode } from '../types';

interface HeaderProps {
  totalCount: number;
  filteredCount: number;
  lowStockCount: number;
  currencyMode: CurrencyMode;
  onToggleCurrency: () => void;
  onOpenScanner: () => void;
  onOpenCsvModal: () => void;
  onOpenSheetsModal: () => void;
  onOpenPricingModal: () => void;
  onOpenAnalyticsModal: () => void;
  onOpenAddModal: () => void;
  generalMarkup: number;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  filteredCount,
  lowStockCount,
  currencyMode,
  onToggleCurrency,
  onOpenScanner,
  onOpenCsvModal,
  onOpenSheetsModal,
  onOpenPricingModal,
  onOpenAnalyticsModal,
  onOpenAddModal,
  generalMarkup,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Logo, Title & Mobile Badges */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 p-0.5 shadow-lg shadow-purple-500/20 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-black bg-gradient-to-r from-white via-slate-100 to-purple-200 bg-clip-text text-transparent flex items-center gap-2">
                  یدک مارکت <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium">پیشخوان فروش</span>
                </h1>
                <p className="text-[11px] text-slate-400">سامانه هوشمند استعلام قیمت، انبار و سود قطعات خودرو (زینلی)</p>
              </div>
            </div>

            {/* Currency Switcher for Mobile */}
            <button
              onClick={onToggleCurrency}
              className="lg:hidden px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-bold flex items-center gap-1"
              title="تغییر واحد پول"
            >
              <Coins className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currencyMode === 'RIAL' ? 'ریال' : 'تومان'}</span>
            </button>
          </div>

          {/* Quick Toolbar Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
            
            {/* Currency Mode Switcher */}
            <button
              onClick={onToggleCurrency}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-indigo-300 transition-all hover:border-indigo-500/50"
              title="تغییر واحد نمایش قیمت بین ریال و تومان"
            >
              <Coins className="w-4 h-4 text-indigo-400" />
              <span>واحد: <strong className="text-white">{currencyMode === 'RIAL' ? 'ریال' : 'تومان'}</strong></span>
            </button>

            {/* Store Analytics Dashboard Button */}
            <button
              onClick={onOpenAnalyticsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all hover:border-purple-500/50 group relative"
              title="داشبورد و گزارش مالی انبار"
            >
              <BarChart3 className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>گزارش انبار</span>
              {lowStockCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1 right-1" />
              )}
            </button>

            {/* Google Sheets Sync Button */}
            <button
              onClick={onOpenSheetsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all hover:border-emerald-500/50 group"
              title="اتصال و همگام‌سازی با گوگل شیت"
            >
              <Cloud className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>گوگل شیت</span>
            </button>

            {/* Price Markup Settings Button */}
            <button
              onClick={onOpenPricingModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all hover:border-amber-500/50 group"
              title="تنظیم درصد سود عمومی، برند و دسته‌بندی"
            >
              <Percent className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>سود: <strong className="text-amber-300">{generalMarkup}٪</strong></span>
            </button>

            {/* Barcode Scanner Button */}
            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.02]"
            >
              <ScanBarcode className="w-4 h-4" />
              <span>اسکن بارکد</span>
            </button>

            {/* CSV Import Button */}
            <button
              onClick={onOpenCsvModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-all hover:border-blue-500/50 group"
              title="ورود فایل CSV جدید"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            {/* Add Item Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.02]"
              title="افزودن دستی کالا"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">افزودن</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
