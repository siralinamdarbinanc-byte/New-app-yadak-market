import React from 'react';
import {
  X,
  Coins,
  BarChart3,
  Cloud,
  Percent,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  Sliders,
  AlertTriangle,
  Type,
  Check
} from 'lucide-react';
import { CurrencyMode, FontSizeSettings } from '../types';

interface SettingsToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencyMode: CurrencyMode;
  onToggleCurrency: () => void;
  fontSizeSettings: FontSizeSettings;
  onUpdateFontSizeSettings: (newSettings: FontSizeSettings) => void;
  onOpenCsvModal: () => void;
  onOpenSheetsModal: () => void;
  onOpenPricingModal: () => void;
  onOpenAnalyticsModal: () => void;
  generalMarkup: number;
  lowStockCount: number;
  totalProductsCount: number;
}

export const SettingsToolsModal: React.FC<SettingsToolsModalProps> = ({
  isOpen,
  onClose,
  currencyMode,
  onToggleCurrency,
  fontSizeSettings,
  onUpdateFontSizeSettings,
  onOpenCsvModal,
  onOpenSheetsModal,
  onOpenPricingModal,
  onOpenAnalyticsModal,
  generalMarkup,
  lowStockCount,
  totalProductsCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-slate-100 flex flex-col space-y-5 my-auto max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                تنظیمات و ابزارهای انبار
              </h2>
              <p className="text-xs text-slate-400">سود، سایز فونت، همگام‌سازی و واحدهای پولی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Font Size Customization Box */}
        <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-4 space-y-3.5 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-white">تنظیم اندازه قلم (فونت کارت کالا)</span>
            </div>
            <span className="text-[11px] text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800/50">
              سفارشی‌سازی نمایش
            </span>
          </div>

          {/* 1. Product Title Size */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">۱. اندازه نام کالا:</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: 'sm', label: 'کوچک' },
                { key: 'md', label: 'درشت (پیش‌فرض)' },
                { key: 'lg', label: 'بزرگ' },
                { key: 'xl', label: 'خیلی بزرگ' },
              ].map((opt) => {
                const isActive = fontSizeSettings.titleSize === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() =>
                      onUpdateFontSizeSettings({
                        ...fontSizeSettings,
                        titleSize: opt.key as any,
                      })
                    }
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all text-center ${
                      isActive
                        ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Selling Price Size */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">۲. اندازه قیمت فروش:</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { key: 'md', label: 'متوسط' },
                { key: 'lg', label: 'درشت' },
                { key: 'xl', label: 'بزرگ' },
                { key: '2xl', label: 'خیلی بزرگ' },
              ].map((opt) => {
                const isActive = fontSizeSettings.priceSize === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() =>
                      onUpdateFontSizeSettings({
                        ...fontSizeSettings,
                        priceSize: opt.key as any,
                      })
                    }
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all text-center ${
                      isActive
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Details & Badges Size */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">۳. اندازه برچسب‌ها و متون فرعی:</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'xs', label: 'ریز (۱۰px)' },
                { key: 'sm', label: 'استاندارد (۱۲px)' },
                { key: 'md', label: 'درشت (۱۴px)' },
              ].map((opt) => {
                const isActive = fontSizeSettings.detailsSize === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() =>
                      onUpdateFontSizeSettings({
                        ...fontSizeSettings,
                        detailsSize: opt.key as any,
                      })
                    }
                    className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold transition-all text-center ${
                      isActive
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Quick Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Currency Toggle Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between hover:border-indigo-500/40 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">واحد نمایش قیمت</span>
                <span className="text-[11px] text-slate-400">
                  {currencyMode === 'RIAL' ? 'نمایش بر اساس ریال' : 'نمایش بر اساس تومان'}
                </span>
              </div>
            </div>
            <button
              onClick={onToggleCurrency}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all"
            >
              {currencyMode === 'RIAL' ? 'ریال' : 'تومان'}
            </button>
          </div>

          {/* Pricing Markup Card */}
          <button
            onClick={() => {
              onClose();
              onOpenPricingModal();
            }}
            className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-right hover:border-amber-500/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">تنظیم درصد سود</span>
                <span className="text-[11px] text-amber-400 font-semibold">
                  سود عمومی: {generalMarkup}٪
                </span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>

          {/* Analytics Dashboard Card */}
          <button
            onClick={() => {
              onClose();
              onOpenAnalyticsModal();
            }}
            className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-right hover:border-purple-500/40 transition-all group relative"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">داشبورد و گزارش انبار</span>
                <span className="text-[11px] text-slate-400">
                  {totalProductsCount.toLocaleString('fa-IR')} کالا در لیست
                </span>
              </div>
            </div>
            {lowStockCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                {lowStockCount} کسری
              </span>
            )}
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>

          {/* Google Sheets Sync Card */}
          <button
            onClick={() => {
              onClose();
              onOpenSheetsModal();
            }}
            className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-right hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">اتصال به گوگل شیت</span>
                <span className="text-[11px] text-slate-400">همگام‌سازی مستقیم لینک شیت</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>

          {/* CSV Import Card */}
          <button
            onClick={() => {
              onClose();
              onOpenCsvModal();
            }}
            className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-right hover:border-blue-500/40 transition-all group sm:col-span-2"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">ورود و آپلود فایل CSV</span>
                <span className="text-[11px] text-slate-400">وارد کردن لیست قیمت اکسل یا CSV جدید</span>
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>

        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span>یدک مارکت - پیشخوان فروش قطعات</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};

