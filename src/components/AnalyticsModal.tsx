import React from 'react';
import { X, BarChart3, TrendingUp, Package, AlertTriangle, Layers, DollarSign, Tag, CheckCircle2, Coins } from 'lucide-react';
import { Product, StoreAnalytics, CurrencyMode } from '../types';
import { formatCurrency, formatPersianNumber } from '../utils/pricing';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: StoreAnalytics;
  products: Product[];
  currencyMode: CurrencyMode;
  onToggleCurrency: () => void;
  onSelectProduct: (product: Product) => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  analytics,
  products,
  currencyMode,
  onToggleCurrency,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const currencyUnit = currencyMode === 'RIAL' ? 'ریال' : 'تومان';

  // Find low stock items
  const lowStockProducts = products.filter((p) => {
    const stock = p.stock !== undefined ? p.stock : 10;
    const minStock = p.minStock !== undefined ? p.minStock : 3;
    return stock <= minStock;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">داشبورد گزارش ارزش انبار و تحلیل سود فروشگاه</h2>
              <p className="text-xs text-slate-400">بررسی ارزش ریالی انبار، سود پیش‌بینی شده و هشدار کسری موجودی</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleCurrency}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-indigo-300 flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>واحد: {currencyUnit}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="py-5 overflow-y-auto space-y-5 flex-1 pr-1">
          
          {/* Main Financial Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Purchase Valuation */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 block mb-1">ارزش کل سرمایه‌گذاری خرید:</span>
              <div className="text-lg font-black text-slate-100 font-mono">
                {formatCurrency(analytics.totalPurchaseValuation, currencyMode)}{' '}
                <span className="text-xs font-normal text-slate-400">{currencyUnit}</span>
              </div>
            </div>

            {/* Sales Valuation */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs text-slate-400 block mb-1">ارزش کل فروش متناظر پیشخوان:</span>
              <div className="text-lg font-black text-emerald-400 font-mono">
                {formatCurrency(analytics.totalSalesValuation, currencyMode)}{' '}
                <span className="text-xs font-normal text-emerald-500">{currencyUnit}</span>
              </div>
            </div>

            {/* Potential Gross Profit */}
            <div className="bg-gradient-to-br from-purple-950/80 to-slate-950 border border-purple-800/80 rounded-2xl p-4">
              <span className="text-xs text-purple-300 block mb-1 font-bold">سود ناخالص ناظر انبار:</span>
              <div className="text-lg font-black text-purple-300 font-mono">
                +{formatCurrency(analytics.totalPotentialProfit, currencyMode)}{' '}
                <span className="text-xs font-normal text-purple-400">{currencyUnit}</span>
              </div>
            </div>

          </div>

          {/* Quantity & Categorization Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block">تنوع اقلام kALA</span>
              <strong className="text-lg font-bold text-slate-100 font-mono">
                {formatPersianNumber(analytics.totalProductsCount)} کالا
              </strong>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block">مجموع کل قطعات</span>
              <strong className="text-lg font-bold text-slate-100 font-mono">
                {formatPersianNumber(analytics.totalStockCount)} عدد
              </strong>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block">تعداد دسته‌بندی‌ها</span>
              <strong className="text-lg font-bold text-purple-300 font-mono">
                {formatPersianNumber(analytics.categoriesCount)} دسته
              </strong>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="text-xs text-slate-400 block">برندهای فعال</span>
              <strong className="text-lg font-bold text-indigo-300 font-mono">
                {formatPersianNumber(analytics.brandsCount)} برند
              </strong>
            </div>
          </div>

          {/* Low Stock Warning Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                لیست اقلام رو به اتمام (کسری موجودی):
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                {formatPersianNumber(lowStockProducts.length)} مورد نیاز سفارش
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-emerald-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>تمام قطعات موجودی کافی دارند و هیچ کسری در انبار ثبت نشده است.</span>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProduct(p);
                      onClose();
                    }}
                    className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block">{p.name}</span>
                      <span className="text-[11px] text-slate-400">برند: {p.brand} | محل: {p.location || 'قفسه عمومی'}</span>
                    </div>

                    <div className="text-left">
                      <span className="text-amber-400 font-bold font-mono text-sm block">
                        {(p.stock !== undefined ? p.stock : 10).toLocaleString('fa-IR')} عدد
                      </span>
                      <span className="text-[10px] text-purple-300">مشاهده / شارژ +</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20"
          >
            تایید و متوجه شدم
          </button>
        </div>

      </div>
    </div>
  );
};
