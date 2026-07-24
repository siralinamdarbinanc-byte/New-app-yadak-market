import React, { useState } from 'react';
import { Product, BrandMarkupMap, CategoryMarkupMap, CurrencyMode } from '../types';
import { calculatePriceResult, formatCurrency, inferCategoryFromName, inferVehiclesFromName } from '../utils/pricing';
import { Tag, DollarSign, TrendingUp, Copy, Check, Edit2, Trash2, MapPin, Package, AlertTriangle, Plus, Minus, Barcode } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  generalMarkup: number;
  brandMarkupMap: BrandMarkupMap;
  categoryMarkupMap: CategoryMarkupMap;
  currencyMode: CurrencyMode;
  onSelect: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number) => void;
  onUpdateStock?: (id: number, newStock: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  generalMarkup,
  brandMarkupMap,
  categoryMarkupMap,
  currencyMode,
  onSelect,
  onEdit,
  onDelete,
  onUpdateStock,
}) => {
  const [copied, setCopied] = useState(false);

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

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-purple-950/20 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Top accent glow */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-500/0 via-purple-500/50 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Header: ID, Stock & Brand */}
        <div className="flex items-center justify-between gap-1.5 mb-2.5">
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400">
            کد #{product.id}
          </span>

          <div className="flex items-center gap-1">
            {/* Warehouse location */}
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
              <MapPin className="w-3 h-3 text-purple-400" />
              {location}
            </span>

            {/* Brand badge */}
            {product.brand && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950/90 border border-indigo-800/50 text-indigo-300">
                <Tag className="w-3 h-3" />
                {product.brand}
              </span>
            )}
          </div>
        </div>

        {/* Product Title */}
        <h3 className="text-sm font-bold text-slate-100 line-clamp-2 mb-2 group-hover:text-purple-200 transition-colors leading-relaxed">
          {product.name}
        </h3>

        {/* Compatible Vehicles list */}
        <div className="flex flex-wrap gap-1 mb-3">
          {vehicles.slice(0, 2).map((v, idx) => (
            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950/70 border border-slate-800 text-slate-400">
              {v}
            </span>
          ))}
          {vehicles.length > 2 && (
            <span className="text-[10px] px-1 py-0.5 text-slate-500">+{(vehicles.length - 2).toLocaleString('fa-IR')}</span>
          )}
        </div>
      </div>

      {/* Stock Bar & Counter */}
      <div className="mb-3 bg-slate-950/90 border border-slate-800/80 rounded-xl p-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Package className={`w-3.5 h-3.5 ${stock === 0 ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-slate-400'}`} />
          <span className="text-slate-400 text-[11px]">موجودی:</span>
          
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
              className={`font-mono font-bold px-1.5 py-0.5 rounded border transition-colors ${
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
        
        {/* Selling Price (Primary Countertop Price) */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            قیمت فروش:
          </span>
          <span className="text-base font-black text-emerald-400 font-mono">
            {formatCurrency(priceResult.sellPrice, currencyMode)}{' '}
            <span className="text-[10px] font-normal text-emerald-500">
              {currencyMode === 'RIAL' ? 'ریال' : 'تومان'}
            </span>
          </span>
        </div>

        {/* Buy Price (Secondary Countertop Price) */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
          <span className="text-slate-500 text-[11px]">قیمت خرید:</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {formatCurrency(priceResult.buyPrice, currencyMode)}{' '}
            <span className="text-[9px] text-slate-500">{currencyMode === 'RIAL' ? 'ریال' : 'تومان'}</span>
          </span>
        </div>

        {/* Profit */}
        <div className="flex items-center justify-between text-[10px] pt-0.5">
          <span className="text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-purple-400" />
            سود فروشگاه:
          </span>
          <span className="font-bold font-mono text-purple-300">
            +{formatCurrency(priceResult.profit, currencyMode)} ({priceResult.markupPercent}٪)
          </span>
        </div>

      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/50">
        <span className="text-[11px] text-purple-400 group-hover:underline flex items-center gap-1">
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
