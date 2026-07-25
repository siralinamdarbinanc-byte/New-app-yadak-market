import React, { useState } from 'react';
import { X, Plus, Tag, DollarSign, Barcode, MapPin, Package, Layers, Camera } from 'lucide-react';
import { Product } from '../types';
import { inferCategoryFromName, inferVehiclesFromName, normalizeDigits } from '../utils/pricing';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newProduct: Product) => void;
  brands: string[];
  categories: string[];
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  brands,
  categories,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [oemCode, setOemCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('قفسه A-01');
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(3);
  const [vehicles, setVehicles] = useState('');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const rawDigits = normalizeDigits(price || '').replace(/[^0-9]/g, '');
    const numeric = parseInt(rawDigits, 10) || 0;
    const cleanPrice = numeric > 0 ? numeric.toLocaleString('en-US') : (price.trim() || '0');

    const inferredCat = category.trim() || inferCategoryFromName(name);
    const parsedVehicles = vehicles
      .split(/[,،]/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    const newProduct: Product = {
      id: Date.now(),
      name: name.trim(),
      brand: brand.trim() || 'شرکتی',
      price: cleanPrice,
      numericPrice: numeric,
      oemCode: oemCode.trim() || undefined,
      barcode: barcode.trim() || null,
      category: inferredCat,
      location: location.trim() || 'قفسه عمومی',
      stock: Number(stock),
      minStock: Number(minStock),
      vehicles: parsedVehicles.length > 0 ? parsedVehicles : inferVehiclesFromName(name),
      lastUpdate: new Date().toLocaleDateString('fa-IR'),
    };

    onAdd(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">افزودن قطعه یدکی جدید به انبار</h2>
              <p className="text-xs text-slate-400">ثبت دستی قطعه با تمام مشخصات انبارداری و قیمت خرید</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="py-4 space-y-3.5 overflow-y-auto flex-1 pr-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              عنوان / نام کامل قطعه: <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: تسمه تایم پژو ۴۰۵ پاورگریپ اصلی"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">برند / سازنده:</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="مثلاً: ایساکو / پاورگریپ"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">قیمت خرید خام (ریال):</label>
              <input
                type="text"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="مثلاً 3500000"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">کد فنی (OEM):</label>
              <input
                type="text"
                value={oemCode}
                onChange={(e) => setOemCode(e.target.value)}
                placeholder="مثلاً 8200123456"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">کد بارکد:</label>
                <button
                  type="button"
                  onClick={() => setIsScanModalOpen(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>اسکن دوربین</span>
                </button>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="مثلاً 6260123456789"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setIsScanModalOpen(true)}
                  className="px-2.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                  title="اسکن بارکد با دوربین"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">محل در انبار (قفسه):</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="مثلاً قفسه B-04"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">تعداد موجودی اولیه:</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">حد هشدار کسری:</label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">خودروهای سازگار (اختیاری با کاما):</label>
            <input
              type="text"
              value={vehicles}
              onChange={(e) => setVehicles(e.target.value)}
              placeholder="پژو ۴۰۵، سمند، پژو پارس"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              انصراف
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت کالا در انبار</span>
            </button>
          </div>
        </form>

      </div>

      <BarcodeScannerModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="اسکن و ثبت بارکد کالا"
        subtitle="بارکد روی جعبه یا قطعه را مقابل دوربین قرار دهید"
        onScanCode={(scannedCode) => {
          setBarcode(scannedCode);
          setIsScanModalOpen(false);
        }}
      />
    </div>
  );
};
