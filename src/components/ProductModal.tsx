import React, { useState, useEffect } from 'react';
import { Product, BrandMarkupMap, CategoryMarkupMap, CurrencyMode } from '../types';
import { calculatePriceResult, formatCurrency, inferCategoryFromName, inferVehiclesFromName, normalizeDigits, cleanProductName } from '../utils/pricing';
import { X, Tag, DollarSign, TrendingUp, Printer, Copy, Check, Barcode, Save, MapPin, Package, AlertTriangle, Layers, Car, Calendar, Plus, Minus, Camera } from 'lucide-react';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  generalMarkup: number;
  brandMarkupMap: BrandMarkupMap;
  categoryMarkupMap: CategoryMarkupMap;
  currencyMode: CurrencyMode;
  onSave?: (updatedProduct: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  generalMarkup,
  brandMarkupMap,
  categoryMarkupMap,
  currencyMode,
  onSave,
}) => {
  if (!product) return null;

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Form edit states
  const [editName, setEditName] = useState(product.name);
  const [editBrand, setEditBrand] = useState(product.brand);
  const [editPrice, setEditPrice] = useState(
    product.numericPrice !== undefined && product.numericPrice !== null && product.numericPrice > 0
      ? String(product.numericPrice)
      : product.price || ''
  );
  const [editOemCode, setEditOemCode] = useState(product.oemCode || '');
  const [editBarcode, setEditBarcode] = useState(product.barcode || '');
  const [editCategory, setEditCategory] = useState(product.category || inferCategoryFromName(product.name));
  const [editLocation, setEditLocation] = useState(product.location || 'قفسه عمومی');
  const [editStock, setEditStock] = useState(product.stock !== undefined ? product.stock : 0);
  const [editMinStock, setEditMinStock] = useState(product.minStock !== undefined ? product.minStock : 3);
  const [editVehicles, setEditVehicles] = useState(
    (product.vehicles && product.vehicles.length > 0 ? product.vehicles : inferVehiclesFromName(product.name)).join('، ')
  );

  // Sync form edit state whenever product or edit mode changes
  useEffect(() => {
    if (product) {
      setEditName(product.name);
      setEditBrand(product.brand);
      setEditPrice(
        product.numericPrice !== undefined && product.numericPrice !== null && product.numericPrice > 0
          ? String(product.numericPrice)
          : product.price || ''
      );
      setEditOemCode(product.oemCode || '');
      setEditBarcode(product.barcode || '');
      setEditCategory(product.category || inferCategoryFromName(product.name));
      setEditLocation(product.location || 'قفسه عمومی');
      setEditStock(product.stock !== undefined ? product.stock : 0);
      setEditMinStock(product.minStock !== undefined ? product.minStock : 3);
      setEditVehicles(
        (product.vehicles && product.vehicles.length > 0
          ? product.vehicles
          : inferVehiclesFromName(product.name)
        ).join('، ')
      );
    }
  }, [product, isEditing]);

  const category = product.category || inferCategoryFromName(product.name);
  const vehicles = product.vehicles && product.vehicles.length > 0
    ? product.vehicles
    : inferVehiclesFromName(product.name);

  const priceResult = calculatePriceResult(
    product.numericPrice,
    product.brand,
    category,
    generalMarkup,
    brandMarkupMap,
    categoryMarkupMap
  );

  const currencyUnit = currencyMode === 'RIAL' ? 'ریال' : 'تومان';

  const handleCopy = () => {
    const info = `نام قطعه: ${product.name}\nبرند: ${product.brand}\nکد OEM: ${product.oemCode || 'ثبت نشده'}\nمحل در انبار: ${product.location || 'قفسه عمومی'}\nقیمت فروش: ${formatCurrency(priceResult.sellPrice, currencyMode)} ${currencyUnit}`;
    navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    if (!onSave) return;

    // Fail-safe price extraction: convert Persian/Arabic numbers to English, strip commas & symbols
    const rawDigits = normalizeDigits(editPrice || '').replace(/[^0-9]/g, '');
    let numeric = parseInt(rawDigits, 10);

    // If parsing fails or input was empty/invalid, keep the existing product.numericPrice!
    if (isNaN(numeric) || (numeric === 0 && product.numericPrice > 0 && !rawDigits)) {
      numeric = product.numericPrice || 0;
    }

    const cleanPriceStr = numeric > 0 ? numeric.toLocaleString('en-US') : (editPrice.trim() || '0');

    const parsedVehicles = editVehicles
      .split(/[,،]/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    onSave({
      ...product,
      name: cleanProductName(editName) || product.name,
      brand: cleanProductName(editBrand) || product.brand,
      price: cleanPriceStr,
      numericPrice: numeric,
      oemCode: editOemCode.trim() || undefined,
      barcode: editBarcode.trim() || null,
      category: editCategory.trim() || category,
      location: editLocation.trim() || 'قفسه عمومی',
      stock: isNaN(Number(editStock)) ? (product.stock ?? 0) : Number(editStock),
      minStock: isNaN(Number(editMinStock)) ? (product.minStock ?? 3) : Number(editMinStock),
      vehicles: parsedVehicles.length > 0 ? parsedVehicles : vehicles,
      lastUpdate: new Date().toLocaleDateString('fa-IR'),
    });
    setIsEditing(false);
  };

  const handleQuickStockAdjust = (delta: number) => {
    const nextStock = Math.max(0, (product.stock !== undefined ? product.stock : 10) + delta);
    if (onSave) {
      onSave({
        ...product,
        stock: nextStock,
        lastUpdate: new Date().toLocaleDateString('fa-IR'),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in print:p-0 print:bg-white print:text-black">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 max-h-[92vh] flex flex-col print:shadow-none print:border-none print:bg-white print:text-black">
        
        {/* Header background accent */}
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 print:hidden" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-800 print:border-black shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-purple-300 print:bg-slate-200 print:text-black">
                کد کالا #{product.id}
              </span>

              {product.brand && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 flex items-center gap-1 print:bg-slate-200 print:text-black">
                  <Tag className="w-3 h-3" />
                  {product.brand}
                </span>
              )}

              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1 print:hidden">
                <Layers className="w-3 h-3 text-purple-400" />
                {category}
              </span>
            </div>

            <h2
              dir="rtl"
              style={{ direction: 'rtl', unicodeBidi: 'plaintext', textAlign: 'right' }}
              className="text-lg font-black text-slate-100 print:text-black leading-snug text-right"
            >
              {cleanProductName(product.name)}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          
          {isEditing ? (
            <div className="space-y-4 py-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نام کامل قطعه:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">برند سازنده:</label>
                  <input
                    type="text"
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">قیمت خرید خام (ریال):</label>
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">کد فنی (OEM Code):</label>
                  <input
                    type="text"
                    value={editOemCode}
                    onChange={(e) => setEditOemCode(e.target.value)}
                    placeholder="مثلاً 8200123456"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-300">کد بارکد:</label>
                    <button
                      type="button"
                      onClick={() => setIsScanModalOpen(true)}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 hover:underline transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>اسکن با دوربین</span>
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={editBarcode}
                      onChange={(e) => setEditBarcode(e.target.value)}
                      placeholder="مثلاً 6260123456789"
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsScanModalOpen(true)}
                      className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                      title="اسکن بارکد با دوربین"
                    >
                      <Camera className="w-4 h-4 text-purple-400" />
                      <span className="hidden sm:inline">اسکن</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">دسته‌بندی قطعه:</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">محل قرارگیری در انبار:</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="مثلاً قفسه A-05"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">تعداد موجودی فعلی:</label>
                  <input
                    type="number"
                    value={editStock}
                    onChange={(e) => setEditStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">حد هشدار کسری انبار:</label>
                  <input
                    type="number"
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">خودروهای سازگار (با کاما جدا کنید):</label>
                <input
                  type="text"
                  value={editVehicles}
                  onChange={(e) => setEditVehicles(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Store Pricing Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Buy Price */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>قیمت خرید اولیه:</span>
                    <span className="text-[10px] text-slate-500">قیمت خام تأمین‌کننده</span>
                  </div>
                  <div className="text-xl font-bold text-slate-200 font-mono">
                    {formatCurrency(priceResult.buyPrice, currencyMode)}{' '}
                    <span className="text-xs font-normal text-slate-400">{currencyUnit}</span>
                  </div>
                </div>

                {/* Selling Price */}
                <div className="bg-gradient-to-br from-emerald-950/80 to-slate-950 border border-emerald-800/80 rounded-2xl p-4 shadow-lg shadow-emerald-950/20">
                  <div className="text-xs text-emerald-400 mb-1 flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      قیمت فروش نهایی (پیشخوان):
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                      +{priceResult.markupPercent}٪ سود
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {formatCurrency(priceResult.sellPrice, currencyMode)}{' '}
                    <span className="text-xs font-normal text-emerald-500">{currencyUnit}</span>
                  </div>
                </div>
              </div>

              {/* Profit & Stock Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Stock Counter and Quick Controls */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">موجودی انبار:</div>
                      <div className="text-base font-bold text-slate-100 font-mono">
                        {(product.stock !== undefined ? product.stock : 10).toLocaleString('fa-IR')} عدد
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 print:hidden">
                    <button
                      onClick={() => handleQuickStockAdjust(-1)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                      title="-1 کاهش موجودی"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleQuickStockAdjust(+1)}
                      className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                      title="+1 افزایش موجودی"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Profit Margin */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">سود هر واحد کالا:</div>
                      <div className="text-base font-bold text-emerald-300 font-mono">
                        +{formatCurrency(priceResult.profit, currencyMode)} {currencyUnit}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Warehouse Location & Technical OEM Info */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block">محل در انبار (قفسه / ردیف):</span>
                      <strong className="text-slate-200 text-sm">{product.location || 'قفسه عمومی'}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Barcode className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 block">کد فنی OEM / بارکد:</span>
                        <strong className="text-slate-200 text-sm font-mono">{product.oemCode || product.barcode || 'ثبت نشده'}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsScanModalOpen(true)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-purple-400 border border-slate-700 rounded-lg text-xs flex items-center gap-1 transition-colors print:hidden"
                      title="ثبت یا اسکن بارکد با دوربین"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Compatible Vehicles list */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mb-1.5">
                    <Car className="w-3.5 h-3.5 text-purple-400" />
                    خودروهای سازگار:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {vehicles.map((v, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-purple-200 font-medium">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </>
          )}

        </div>

        {/* Modal Action Footer */}
        <div className="pt-4 mt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
              <span>{copied ? 'کپی شد!' : 'کپی مشخصات'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>چاپ لیبل قفسه</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
              >
                ویرایش اطلاعات
              </button>
            )}
          </div>
        </div>

      </div>

      <BarcodeScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="اسکن و ثبت بارکد قطعه"
        subtitle={`اسکن بارکد با دوربین جهت ثبت برای قطعه "${product.name}"`}
        onScanCode={(scannedCode) => {
          setEditBarcode(scannedCode);
          setIsScanModalOpen(false);
          if (!isEditing) {
            setIsEditing(true);
          }
        }}
      />
    </div>
  );
};
