import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload, AlertTriangle, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Product, CsvPreview } from '../types';
import { processCsvUpload } from '../utils/csv';
import { formatPersianNumber } from '../utils/pricing';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProducts: Product[];
  onImportComplete: (newProducts: Product[], duplicatesToUpdate: any[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  existingProducts,
  onImportComplete,
}) => {
  if (!isOpen) return null;

  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateDuplicates, setUpdateDuplicates] = useState(true);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = processCsvUpload(text, file.name, existingProducts);
        setPreview(result);
      } catch (err) {
        setError('خطا در خواندن فایل CSV. لطفاً ساختار فایل را بررسی کنید.');
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleApplyImport = () => {
    if (!preview) return;
    onImportComplete(
      preview.newProducts,
      updateDuplicates ? preview.duplicateMatches : []
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">آپلود و به‌روزرسانی لیست CSV</h2>
              <p className="text-xs text-slate-400">بررسی تکراری‌ها و به‌روزرسانی قیمت قطعات</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 overflow-y-auto space-y-4 flex-1">
          
          {!preview ? (
            <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-950/60 rounded-2xl p-8 text-center transition-colors">
              <Upload className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-bounce" />
              <h3 className="text-sm font-bold text-slate-200 mb-1">فایل CSV لیست قطعات را انتخاب کنید</h3>
              <p className="text-xs text-slate-400 mb-4">
                فرمت ستون‌ها: [ردیف/شناسه، نام قطعه، برند، قیمت به ریال]
              </p>
              
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer transition-colors shadow-lg shadow-blue-600/20">
                <FileSpreadsheet className="w-4 h-4" />
                <span>انتخاب فایل CSV</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-2xl p-4">
                  <div className="text-xs text-emerald-400 font-medium mb-1">اقلام جدید (بدون تکرار):</div>
                  <div className="text-xl font-bold text-emerald-300 font-mono">
                    {formatPersianNumber(preview.newProducts.length)} کالا
                  </div>
                </div>

                <div className="bg-amber-950/40 border border-amber-800/50 rounded-2xl p-4">
                  <div className="text-xs text-amber-400 font-medium mb-1">اقلام تکراری (هم‌نام و هم‌برند):</div>
                  <div className="text-xl font-bold text-amber-300 font-mono">
                    {formatPersianNumber(preview.duplicateMatches.length)} کالا
                  </div>
                </div>
              </div>

              {/* Duplicate option toggle */}
              {preview.duplicateMatches.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateDuplicates}
                      onChange={(e) => setUpdateDuplicates(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        قیمت کالاهای تکراری با قیمت‌های جدید این فایل به‌روزرسانی شود
                      </div>
                      <div className="text-[11px] text-slate-400">
                        در صورت عدم انتخاب، کالاهای تکراری نادیده گرفته می‌شوند.
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {/* Duplicate Preview List */}
              {preview.duplicateMatches.length > 0 && (
                <div className="border border-slate-800 rounded-2xl p-3 bg-slate-950/80">
                  <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    پیش‌نمایش تغییر قیمت کالاهای تکراری:
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                    {preview.duplicateMatches.slice(0, 15).map((match, idx) => (
                      <div key={idx} className="text-xs p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-200">{match.name}</span>
                          <span className="text-slate-400 mr-2">({match.brand})</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="line-through text-slate-500">{formatPersianNumber(match.oldPriceNumeric)}</span>
                          <ArrowLeft className="w-3 h-3 text-purple-400" />
                          <span className="text-emerald-400 font-bold">{formatPersianNumber(match.newPriceNumeric)} ریال</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        {preview && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
            <button
              onClick={() => setPreview(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              انتخاب فایل دیگر
            </button>

            <button
              onClick={handleApplyImport}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20"
            >
              تأیید و افزودن به لیست
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
