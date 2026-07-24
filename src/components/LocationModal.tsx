import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { MapPin, X, Save, Edit3, Package, Tag, Barcode, CheckCircle2, ChevronDown, ChevronUp, Info, Layers, Inbox } from 'lucide-react';
import { getBrandColorStyle } from '../utils/brandColors';

interface LocationModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveLocation: (productId: number, newLocation: string) => void;
}

const ROWS_A_Z = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)); // A to Z
const SHELF_NUMBERS = Array.from({ length: 20 }, (_, i) => String(i + 1).padStart(2, '0')); // 01 to 20
const DRAWER_NUMBERS = Array.from({ length: 20 }, (_, i) => `کشو ${String(i + 1).padStart(2, '0')}`); // کشو 01 تا کشو 20

const EXTRA_NOTES_PRESETS = [
  'طبقه بالا',
  'طبقه پایین',
  'قسمت جلو',
  'قسمت عقب',
  'اقلام ریز و حساس',
  'انبار اصلی',
  'انبار ثانویه',
  'ویترین فروشگاه',
  'بسته‌بندی کارتنی',
  'موقعیت موقت',
];

export const LocationModal: React.FC<LocationModalProps> = ({
  product,
  isOpen,
  onClose,
  onSaveLocation,
}) => {
  const [locationType, setLocationType] = useState<'shelf' | 'drawer'>('shelf');
  const [selectedRow, setSelectedRow] = useState<string>('A');
  const [selectedShelf, setSelectedShelf] = useState<string>('01');
  const [selectedDrawer, setSelectedDrawer] = useState<string>('کشو 01');
  const [extraNote, setExtraNote] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('');
  const [isExtraOpen, setIsExtraOpen] = useState<boolean>(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      const loc = product.location || 'قفسه A-01';
      setLocationInput(loc);
      setIsSavedSuccess(false);

      // Check if location is a standalone Drawer vs a Shelf location
      const hasDrawerMatch = loc.match(/کشو\s+(\d{1,2})/i);
      const hasShelfMatch = loc.match(/قفسه\s+([A-Z])[-_]?(\d{1,2})/i);

      if (hasDrawerMatch && !hasShelfMatch) {
        setLocationType('drawer');
        setSelectedDrawer(`کشو ${hasDrawerMatch[1].padStart(2, '0')}`);
      } else {
        setLocationType('shelf');
        if (hasShelfMatch) {
          if (hasShelfMatch[1]) setSelectedRow(hasShelfMatch[1].toUpperCase());
          if (hasShelfMatch[2]) setSelectedShelf(hasShelfMatch[2].padStart(2, '0'));
        }
        if (hasDrawerMatch) {
          setSelectedDrawer(`کشو ${hasDrawerMatch[1].padStart(2, '0')}`);
        }
      }

      const matchNote = loc.match(/\((.*?)\)/);
      if (matchNote && matchNote[1]) {
        setExtraNote(matchNote[1]);
        setIsExtraOpen(true);
      } else {
        setExtraNote('');
      }
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const brandStyle = getBrandColorStyle(product.brand);

  // Helper to compose complete location string based on active mode
  const updateComposedLocation = (
    type: 'shelf' | 'drawer',
    row: string,
    shelf: string,
    drawer: string,
    note: string
  ) => {
    let composed = '';
    if (type === 'drawer') {
      composed = drawer;
    } else {
      composed = `قفسه ${row}-${shelf}`;
    }
    if (note.trim()) {
      composed += ` (${note.trim()})`;
    }
    setLocationInput(composed);
  };

  const handleTypeChange = (type: 'shelf' | 'drawer') => {
    setLocationType(type);
    const activeDrawer = selectedDrawer === 'بدون کشو' ? 'کشو 01' : selectedDrawer;
    if (type === 'drawer') {
      setSelectedDrawer(activeDrawer);
    }
    updateComposedLocation(type, selectedRow, selectedShelf, activeDrawer, extraNote);
  };

  const handleRowSelect = (row: string) => {
    setSelectedRow(row);
    updateComposedLocation('shelf', row, selectedShelf, selectedDrawer, extraNote);
  };

  const handleShelfSelect = (shelf: string) => {
    setSelectedShelf(shelf);
    updateComposedLocation('shelf', selectedRow, shelf, selectedDrawer, extraNote);
  };

  const handleDrawerSelect = (drawer: string) => {
    setSelectedDrawer(drawer);
    updateComposedLocation('drawer', selectedRow, selectedShelf, drawer, extraNote);
  };

  const handleExtraNoteChange = (note: string) => {
    setExtraNote(note);
    updateComposedLocation(locationType, selectedRow, selectedShelf, selectedDrawer, note);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    onSaveLocation(product.id, locationInput.trim());
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-6 text-slate-100 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-snug">اطلاعات و ویرایش موقعیت انبار</h2>
              <p className="text-xs text-slate-400">انتخاب ردیف (A-Z)، شماره قفسه و جزئیات تکمیلی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Details Overview */}
        <div className="my-3 p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-1.5 shrink-0">
          <h3 className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed">{product.name}</h3>
          
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {product.brand && (
              <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md border ${brandStyle.bg} ${brandStyle.border} ${brandStyle.text}`}>
                <Tag className="w-3 h-3" />
                {product.brand}
              </span>
            )}
            
            {product.code && (
              <span className="inline-flex items-center gap-1 font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                <Barcode className="w-3 h-3" />
                کد: {product.code}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-slate-300 mr-auto">
              <Package className="w-3.5 h-3.5 text-purple-400" />
              موجودی: <strong className="text-purple-300 font-mono">{product.stock || 0}</strong> عدد
            </span>
          </div>
        </div>

        {/* Main Interactive Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
          
          {/* Result Location Output / Manual Editable Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-purple-400" />
              عنوان موقعیت نهایی در انبار (قابل ویرایش دستی):
            </label>
            <div className="relative">
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="مثلاً: قفسه A-05 (طبقه بالا)"
                className="w-full pr-10 pl-3 py-2.5 bg-slate-950 border border-purple-500/50 rounded-xl text-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold shadow-inner"
                required
              />
              <MapPin className="absolute right-3 top-3 w-4 h-4 text-purple-400" />
            </div>
          </div>

          {/* Mode Selector Tabs: Shelf Location vs Independent Drawer Location */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('shelf')}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                locationType === 'shelf'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>قفسه و ردیف (انبار اصلی)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('drawer')}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                locationType === 'drawer'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>کشو اقلام ریز (مستقل)</span>
            </button>
          </div>

          {/* SECTION 1: Shelf & Row (Displayed ONLY when locationType === 'shelf') */}
          {locationType === 'shelf' && (
            <div className="space-y-3 animate-fadeIn">
              {/* Row Selection A to Z */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    انتخاب ردیف / راهرو (A تا Z):
                  </span>
                  <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    ردیف {selectedRow}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-900 rounded-lg border border-slate-800">
                  {ROWS_A_Z.map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => handleRowSelect(letter)}
                      className={`w-7 h-7 text-xs font-black rounded-md transition-all flex items-center justify-center shrink-0 ${
                        selectedRow === letter
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50 scale-105'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shelf Number Selection 1 to 20 */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-indigo-400" />
                    شماره قفسه (01 تا 20):
                  </span>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    قفسه {selectedShelf}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-900 rounded-lg border border-slate-800">
                  {SHELF_NUMBERS.map((shelfNum) => (
                    <button
                      key={shelfNum}
                      type="button"
                      onClick={() => handleShelfSelect(shelfNum)}
                      className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md transition-all shrink-0 ${
                        selectedShelf === shelfNum
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50 scale-105'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {shelfNum}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Standalone Drawer Selection (Displayed ONLY when locationType === 'drawer') */}
          {locationType === 'drawer' && (
            <div className="bg-amber-950/20 p-3.5 rounded-xl border border-amber-800/40 shadow-inner animate-fadeIn space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <Inbox className="w-4 h-4 text-amber-400" />
                  شماره کشو مستقل (مخصوص قطعات ریز):
                </span>
                <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                  {selectedDrawer}
                </span>
              </div>

              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                موقعیت این قطعه به صورت کشوی مستقل ذخیره می‌شود (قفسه و ردیف پنهان است).
              </p>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-950/80 rounded-lg border border-amber-900/40">
                {DRAWER_NUMBERS.map((drawerItem) => (
                  <button
                    key={drawerItem}
                    type="button"
                    onClick={() => handleDrawerSelect(drawerItem)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                      selectedDrawer === drawerItem
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-900/60 scale-105 ring-2 ring-amber-400/50'
                        : 'bg-slate-900 hover:bg-slate-800 text-amber-200 font-mono border border-amber-900/30'
                    }`}
                  >
                    {drawerItem}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Collapsible Extra Details / Notes (حالت کشویی) */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setIsExtraOpen(!isExtraOpen)}
              className="w-full flex items-center justify-between p-3 bg-slate-900/90 hover:bg-slate-800/80 transition-colors text-right"
            >
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-purple-400" />
                توضیحات و جزئیات اختیاری (کشویی)
                {extraNote && (
                  <span className="mr-2 px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 rounded-full font-normal border border-purple-500/30">
                    {extraNote}
                  </span>
                )}
              </span>
              {isExtraOpen ? (
                <ChevronUp className="w-4 h-4 text-purple-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isExtraOpen && (
              <div className="p-3 border-t border-slate-800/80 space-y-3 bg-slate-900/40 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                    توضیحات تکمیلی سفارشی:
                  </label>
                  <input
                    type="text"
                    value={extraNote}
                    onChange={(e) => handleExtraNoteChange(e.target.value)}
                    placeholder="مثلاً: طبقه بالا، انبار دوم، جعبه چوبی..."
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">انتخاب از گزینه‌های سریع:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {EXTRA_NOTES_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleExtraNoteChange(preset)}
                        className={`px-2 py-1 text-[11px] rounded-lg border transition-all ${
                          extraNote === preset
                            ? 'bg-purple-600 border-purple-500 text-white font-bold'
                            : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                    {extraNote && (
                      <button
                        type="button"
                        onClick={() => handleExtraNoteChange('')}
                        className="px-2 py-1 text-[11px] rounded-lg border border-red-900/50 bg-red-950/40 text-red-300 hover:bg-red-900/40 transition-all"
                      >
                        حذف توضیحات
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-lg ${
                isSavedSuccess
                  ? 'bg-emerald-600 shadow-emerald-900/40'
                  : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/40'
              }`}
            >
              {isSavedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200 animate-bounce" />
                  بروزرسانی شد!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  ذخیره موقعیت
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

