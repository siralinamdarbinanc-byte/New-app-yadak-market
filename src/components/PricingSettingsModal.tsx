import React, { useState } from 'react';
import { X, Percent, Save, Plus, Trash2, Tag, Layers } from 'lucide-react';
import { BrandMarkupMap, CategoryMarkupMap } from '../types';

interface PricingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  generalMarkup: number;
  brandMarkupMap: BrandMarkupMap;
  categoryMarkupMap: CategoryMarkupMap;
  onSave: (newGeneral: number, newBrandMap: BrandMarkupMap, newCategoryMap: CategoryMarkupMap) => void;
  brands: string[];
  categories: string[];
}

export const PricingSettingsModal: React.FC<PricingSettingsModalProps> = ({
  isOpen,
  onClose,
  generalMarkup,
  brandMarkupMap,
  categoryMarkupMap,
  onSave,
  brands,
  categories,
}) => {
  if (!isOpen) return null;

  const [tempGeneral, setTempGeneral] = useState(generalMarkup);
  const [tempBrandMap, setTempBrandMap] = useState<BrandMarkupMap>({ ...brandMarkupMap });
  const [tempCategoryMap, setTempCategoryMap] = useState<CategoryMarkupMap>({ ...categoryMarkupMap });

  const [selectedBrandToAdd, setSelectedBrandToAdd] = useState('');
  const [newBrandPercent, setNewBrandPercent] = useState(20);

  const [selectedCategoryToAdd, setSelectedCategoryToAdd] = useState('');
  const [newCategoryPercent, setNewCategoryPercent] = useState(18);

  const handleAddBrandOverride = () => {
    if (!selectedBrandToAdd) return;
    setTempBrandMap({
      ...tempBrandMap,
      [selectedBrandToAdd]: newBrandPercent,
    });
    setSelectedBrandToAdd('');
  };

  const handleRemoveBrandOverride = (brand: string) => {
    const nextMap = { ...tempBrandMap };
    delete nextMap[brand];
    setTempBrandMap(nextMap);
  };

  const handleAddCategoryOverride = () => {
    if (!selectedCategoryToAdd) return;
    setTempCategoryMap({
      ...tempCategoryMap,
      [selectedCategoryToAdd]: newCategoryPercent,
    });
    setSelectedCategoryToAdd('');
  };

  const handleRemoveCategoryOverride = (category: string) => {
    const nextMap = { ...tempCategoryMap };
    delete nextMap[category];
    setTempCategoryMap(nextMap);
  };

  const handleSave = () => {
    onSave(tempGeneral, tempBrandMap, tempCategoryMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">تنظیمات درصد سود و ضریب قیمت</h2>
              <p className="text-xs text-slate-400">تنظیم درصد سود عمومی، اختصاصی هر برند یا دسته محصولات</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 overflow-y-auto space-y-5 flex-1 pr-1">
          
          {/* General Percent Setting */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-bold text-slate-200">
              درصد سود عمومی (پیش‌فرض کلی):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="300"
                value={tempGeneral}
                onChange={(e) => setTempGeneral(parseInt(e.target.value, 10) || 0)}
                className="w-24 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold font-mono text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-sm font-bold text-emerald-400">درصد (٪)</span>
              <p className="text-xs text-slate-400 mr-auto">
                فرمول: قیمت خرید + {tempGeneral}٪ سود (گرد شده به بالا)
              </p>
            </div>
          </div>

          {/* Category Specific Overrides */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              درصد سود اختصاصی دسته‌بندی کالاها:
            </h3>

            <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
              <select
                value={selectedCategoryToAdd}
                onChange={(e) => setSelectedCategoryToAdd(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">انتخاب دسته‌بندی...</option>
                {categories
                  .filter((c) => c && tempCategoryMap[c] === undefined)
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={newCategoryPercent}
                  onChange={(e) => setNewCategoryPercent(parseInt(e.target.value, 10) || 0)}
                  className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-center"
                />
                <span className="text-xs text-slate-400">٪</span>
              </div>

              <button
                onClick={handleAddCategoryOverride}
                disabled={!selectedCategoryToAdd}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {Object.keys(tempCategoryMap).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2">درصد اختصاصی برای هیچ دسته‌ای تنظیم نشده است.</p>
              ) : (
                Object.entries(tempCategoryMap).map(([categoryName, percent]) => (
                  <div
                    key={categoryName}
                    className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                  >
                    <span className="font-medium text-slate-200">{categoryName}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-purple-300 font-mono">{percent}٪ سود</span>
                      <button
                        onClick={() => handleRemoveCategoryOverride(categoryName)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Brand Specific Overrides */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-400" />
              درصد سود اختصاصی برندها:
            </h3>

            <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
              <select
                value={selectedBrandToAdd}
                onChange={(e) => setSelectedBrandToAdd(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">انتخاب برند...</option>
                {brands
                  .filter((b) => b && tempBrandMap[b] === undefined)
                  .map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
              </select>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={newBrandPercent}
                  onChange={(e) => setNewBrandPercent(parseInt(e.target.value, 10) || 0)}
                  className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-center"
                />
                <span className="text-xs text-slate-400">٪</span>
              </div>

              <button
                onClick={handleAddBrandOverride}
                disabled={!selectedBrandToAdd}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {Object.keys(tempBrandMap).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2">درصد اختصاصی برای هیچ برندی تنظیم نشده است.</p>
              ) : (
                Object.entries(tempBrandMap).map(([brandName, percent]) => (
                  <div
                    key={brandName}
                    className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs"
                  >
                    <span className="font-medium text-slate-200">{brandName}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-indigo-300 font-mono">{percent}٪ سود</span>
                      <button
                        onClick={() => handleRemoveBrandOverride(brandName)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            انصراف
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره فرمول‌های سود</span>
          </button>
        </div>

      </div>
    </div>
  );
};
