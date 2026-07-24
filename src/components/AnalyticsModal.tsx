import React, { useState, useMemo } from 'react';
import { X, BarChart3, TrendingUp, Package, AlertTriangle, Layers, DollarSign, Tag, CheckCircle2, Coins, Search, ScanBarcode } from 'lucide-react';
import { Product, StoreAnalytics, CurrencyMode } from '../types';
import { formatCurrency, formatPersianNumber } from '../utils/pricing';
import { cleanSearchText, evaluateProductSearch } from '../utils/search';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: StoreAnalytics;
  products: Product[];
  currencyMode: CurrencyMode;
  onToggleCurrency: () => void;
  onSelectProduct: (product: Product) => void;
  onResetAllStock?: () => void;
}

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  analytics,
  products,
  currencyMode,
  onToggleCurrency,
  onSelectProduct,
  onResetAllStock,
}) => {
  if (!isOpen) return null;

  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'LOW_STOCK' | 'ALL'>('LOW_STOCK');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const currencyUnit = currencyMode === 'RIAL' ? 'ریال' : 'تومان';

  // Find low stock items
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = p.stock !== undefined ? p.stock : 0;
      const minStock = p.minStock !== undefined ? p.minStock : 3;
      return stock <= minStock;
    });
  }, [products]);

  // Filter products for dashboard list based on mode and search query
  const displayedReportProducts = useMemo(() => {
    const targetList = filterMode === 'LOW_STOCK' ? lowStockProducts : products;
    const cleanedQuery = cleanSearchText(modalSearchQuery);
    if (!cleanedQuery) return targetList.slice(0, 100); // limit for fast render

    const tokens = cleanedQuery.split(/\s+/).filter(Boolean);
    return targetList
      .filter((p) => evaluateProductSearch(p, tokens).matches)
      .slice(0, 100);
  }, [filterMode, lowStockProducts, products, modalSearchQuery]);

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

          {/* Search & Detailed Inventory Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            
            {/* List Controls Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-1">
              
              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setFilterMode('LOW_STOCK')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    filterMode === 'LOW_STOCK'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  اقلام رو به اتمام ({formatPersianNumber(lowStockProducts.length)})
                </button>
                <button
                  onClick={() => setFilterMode('ALL')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    filterMode === 'ALL'
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  کل انبار ({formatPersianNumber(products.length)})
                </button>
              </div>

              {/* Status Badge */}
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                نمایش: {formatPersianNumber(displayedReportProducts.length)} مورد
              </span>
            </div>

            {/* Dashboard Search Input with Barcode Scanner */}
            <div className="relative flex items-center">
              <input
                type="text"
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                placeholder="جستجوی سریع در گزارش انبار (نام کالا، بارکد خوان، کد فنی، برند، محل قفسه...)"
                className="w-full pl-28 pr-9 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
              
              <div className="absolute left-2 flex items-center gap-1.5">
                {modalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setModalSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-white transition-colors"
                    title="پاک کردن"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsScanModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 rounded-lg text-purple-200 text-[11px] font-bold transition-all hover:scale-105 active:scale-95 shrink-0"
                  title="اسکن بارکد با دوربین"
                >
                  <ScanBarcode className="w-3.5 h-3.5 text-purple-400" />
                  <span>اسکن بارکد</span>
                </button>
              </div>
            </div>

            {/* Inventory Items List */}
            {displayedReportProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
                <Package className="w-6 h-6 text-slate-600 mb-1" />
                <span>هیچ کالایی با مشخصات جستجو شده یافت نشد.</span>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {displayedReportProducts.map((p) => {
                  const stock = p.stock !== undefined ? p.stock : 0;
                  const isZero = stock === 0;
                  const isLow = stock <= (p.minStock !== undefined ? p.minStock : 3);

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProduct(p);
                        onClose();
                      }}
                      className="p-3 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all hover:bg-slate-850"
                    >
                      <div className="flex-1 min-w-0 ml-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-slate-100 truncate block">{p.name}</span>
                          {p.oemCode && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800 shrink-0">
                              {p.oemCode}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          برند: <strong className="text-slate-300">{p.brand}</strong> | محل: {p.location || 'قفسه عمومی'}
                        </span>
                      </div>

                      <div className="text-left shrink-0">
                        <span
                          className={`font-bold font-mono text-xs px-2 py-0.5 rounded border inline-block mb-0.5 ${
                            isZero
                              ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                              : isLow
                              ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                              : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                          }`}
                        >
                          موجودی: {stock.toLocaleString('fa-IR')} عدد
                        </span>
                        <span className="text-[10px] text-purple-300 block">مشاهده و ویرایش &larr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          {onResetAllStock && (
            <button
              onClick={() => {
                if (window.confirm('آیا مطمئن هستید که می‌خواهید موجودی تمام قطعات را ۰ (صفر) کنید؟')) {
                  onResetAllStock();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-800/80 hover:bg-rose-900 text-rose-300 text-xs font-semibold transition-colors"
            >
              صفر کردن موجودی تمام قطعات (0)
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20"
          >
            تایید و متوجه شدم
          </button>
        </div>

      </div>

      <BarcodeScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        products={products}
        onDetected={(code) => {
          setModalSearchQuery(code);
          setIsScanModalOpen(false);
        }}
      />
    </div>
  );
};
