import React, { useState } from 'react';
import { Product, BrandMarkupMap, CategoryMarkupMap, CurrencyMode, FontSizeSettings } from '../types';
import { calculatePriceResult, formatCurrency, inferCategoryFromName, inferVehiclesFromName } from '../utils/pricing';
import { getBrandColorStyle } from '../utils/brandColors';
import { Tag, DollarSign, TrendingUp, Copy, Check, Edit2, Trash2, MapPin, Package, AlertTriangle, Plus, Minus, Barcode, Inbox } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  generalMarkup: number;
  brandMarkupMap: BrandMarkupMap;
  categoryMarkupMap: CategoryMarkupMap;
  currencyMode: CurrencyMode;
  fontSizeSettings?: FontSizeSettings;
  onSelect: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number) => void;
  onUpdateStock?: (id: number, newStock: number) => void;
  onOpenLocationModal?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  generalMarkup,
  brandMarkupMap,
  categoryMarkupMap,
  currencyMode,
  fontSizeSettings,
  onSelect,
  onEdit,
  onDelete,
  onUpdateStock,
  onOpenLocationModal,
}) => {
  const [copied, setCopied] = useState(false);

  const brandStyle = getBrandColorStyle(product.brand);

  const titleSizeClass = {
    sm: 'text-sm font-bold',
    md: 'text-base font-bold',
    lg: 'text-lg font-extrabold',
    xl: 'text-xl font-black',
  }[fontSizeSettings?.titleSize || 'md'];

  const priceSizeClass = {
    md: 'text-base font-black',
    lg: 'text-lg font-black',
    xl: 'text-xl font-black',
    '2xl': 'text-2xl font-black',
  }[fontSizeSettings?.priceSize || 'lg'];

  const detailsSizeClass = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
  }[fontSizeSettings?.detailsSize || 'sm'];

  const category = product.category || inferCategoryFromName(product.name);
  const vehicles = product.vehicles && product.vehicles.length > 0
    ? product.vehicles
    : inferVehiclesFromName(product.name);

  const stock = product.stock !== undefined ? product.stock : 0;
  const minStock = product.minStock !== undefined ? product.minStock : 3;
  const isLowStock = stock <= minStock;
  const location = product.location || 'قفسه عمومی';

  const [isEditingStock, setIsEditingStock] = useState(false);
  const [stockInputVal, setStockInputVal] = useState(String(stock));

  const handleStockInputSubmit = (e: React.FormEvent | React.FocusEvent) => {
    e.preventDefault();
    setIsEditingStock(false);
    if (!onUpdateStock) return;
    const num = parseInt(stockInputVal, 10);
    if (!isNaN(num) && num >= 0) {
      onUpdateStock(product.id, num);
    } else {
      setStockInputVal(String(stock));
    }
  };

  const priceResult = calculatePriceResult(
    product.numericPrice,
    product.brand,
    category,
    generalMarkup,
    brandMarkupMap,
    categoryMarkupMap
  );

  const handleCopyDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currencyUnit = currencyMode === 'RIAL' ? 'ریال' : 'تومان';
    const text = `${product.name}\nبرند: ${product.brand}\nقیمت فروش: ${formatCurrency(priceResult.sellPrice, currencyMode)} ${currencyUnit}\nانبار: ${location}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleStockChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    if (!onUpdateStock) return;
    const nextStock = Math.max(0, stock + delta);
    onUpdateStock(product.id, nextStock);
  };

  const hasDrawer = location.includes('کشو');

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-purple-950/20 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Top accent glow */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Header: Location & Brand */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          {/* Dynamic Single Location / Drawer Badge */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenLocationModal?.(product);
            }}
            title="برای مشاهده و ویرایش موقعیت یا کشو کلیک کنید"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs sm:text-sm shadow-sm hover:scale-105 active:scale-95 transition-all ${
              hasDrawer
                ? 'bg-amber-950/90 hover:bg-amber-900/90 border border-amber-600/70 text-amber-200 shadow-amber-500/10 hover:border-amber-500'
                : 'bg-slate-950/90 hover:bg-purple-950/80 border border-slate-800 hover:border-purple-500/70 text-slate-200 hover:text-purple-200 shadow-purple-500/10'
            }`}
          >
            {hasDrawer ? (
              <Inbox className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-purple-400 animate-pulse shrink-0" />
            )}
            <span className="truncate max-w-[170px] sm:max-w-[200px]">{location}</span>
          </button>

          {/* Dynamic Brand badge */}
          {product.brand && (
            <span className={`inline-flex items-center gap-1.5 font-extrabold px-2.5 py-1 rounded-lg border text-xs sm:text-sm shadow-sm transition-all ${brandStyle.bg} ${brandStyle.border} ${brandStyle.text} ${brandStyle.glow}`}>
              <Tag className={`w-3.5 h-3.5 ${brandStyle.icon}`} />
              {product.brand}
            </span>
          )}
        </div>

        {/* Product Title - Dynamically Sized */}
        <h3 className={`${titleSizeClass} text-slate-100 line-clamp-2 mb-3 group-hover:text-purple-200 transition-colors leading-relaxed`}>
          {product.name}
        </h3>
      </div>

      {/* Stock Bar & Counter */}
      <div className="mb-3 bg-slate-950/90 border border-slate-800/80 rounded-xl p-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Package className={`w-3.5 h-3.5 ${stock === 0 ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className={`text-slate-400 ${detailsSizeClass}`}>موجودی:</span>
          
          {isEditingStock ? (
            <form onSubmit={handleStockInputSubmit} className="inline-flex items-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                min="0"
                autoFocus
                value={stockInputVal}
                onChange={(e) => setStockInputVal(e.target.value)}
                onBlur={handleStockInputSubmit}
                className="w-14 px-1 py-0.5 bg-slate-900 border border-purple-500 rounded text-center text-xs font-mono font-bold text-white focus:outline-none"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setStockInputVal(String(stock));
                setIsEditingStock(true);
              }}
              className={`font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${detailsSizeClass} ${
                stock === 0
                  ? 'bg-rose-950/60 border-rose-800/60 text-rose-300 hover:border-rose-500'
                  : isLowStock
                  ? 'bg-amber-950/60 border-amber-800/60 text-amber-300 hover:border-amber-500'
                  : 'bg-slate-900/80 border-slate-700/60 text-slate-200 hover:border-purple-500'
              }`}
              title="برای تغییر عدد موجودی کلیک کنید"
            >
              {stock === 0 ? 'ناموجود (۰)' : `${stock.toLocaleString('fa-IR')} عدد`}
            </button>
          )}
        </div>

        {/* Quick stock adjustment buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => handleStockChange(e, -1)}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="کاهش موجودی (-1)"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => handleStockChange(e, +1)}
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
            title="افزایش موجودی (+1)"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Prices Box */}
      <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
        
        {/* Selling Price (Primary Countertop Price - Dynamically Sized) */}
        <div className="flex items-center justify-between">
          <span className={`text-slate-400 flex items-center gap-1 ${detailsSizeClass}`}>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            قیمت فروش:
          </span>
          <span className={`${priceSizeClass} text-emerald-400 font-mono`}>
            {formatCurrency(priceResult.sellPrice, currencyMode)}{' '}
            <span className="text-[10px] font-normal text-emerald-500">
              {currencyMode === 'RIAL' ? 'ریال' : 'تومان'}
            </span>
          </span>
        </div>

        {/* Buy Price (Secondary Countertop Price) */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
          <span className={`text-slate-500 ${detailsSizeClass}`}>قیمت خرید:</span>
          <span className={`text-slate-400 font-mono ${detailsSizeClass}`}>
            {formatCurrency(priceResult.buyPrice, currencyMode)}{' '}
            <span className="text-[9px] text-slate-500">{currencyMode === 'RIAL' ? 'ریال' : 'تومان'}</span>
          </span>
        </div>

        {/* Profit */}
        <div className="flex items-center justify-between text-[10px] pt-0.5">
          <span className={`text-slate-500 flex items-center gap-1 ${detailsSizeClass}`}>
            <TrendingUp className="w-3 h-3 text-purple-400" />
            سود فروشگاه:
          </span>
          <span className={`font-bold font-mono text-purple-300 ${detailsSizeClass}`}>
            +{formatCurrency(priceResult.profit, currencyMode)} ({priceResult.markupPercent}٪)
          </span>
        </div>

      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/50">
        <span className={`text-purple-400 group-hover:underline flex items-center gap-1 ${detailsSizeClass}`}>
          مشاهده / چاپ فاکتور
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyDetails}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="کپی مشخصات"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-purple-300 transition-colors"
              title="ویرایش قطعه"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product.id);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors"
              title="حذف"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

