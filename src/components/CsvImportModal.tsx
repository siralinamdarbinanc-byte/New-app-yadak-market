import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload, AlertTriangle, CheckCircle, ArrowLeft, Download, Database, Copy, Check } from 'lucide-react';
import { Product, CsvPreview } from '../types';
import { processCsvUpload, downloadCsvFile, downloadJsonBackup } from '../utils/csv';
import { formatPersianNumber } from '../utils/pricing';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProducts: Product[];
  onImport?: (newProducts: Product[], duplicatesToUpdate: any[]) => void;
  onImportComplete?: (newProducts: Product[], duplicatesToUpdate: any[]) => void;
  onRestoreBackup?: (backupProducts: Product[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  existingProducts,
  onImport,
  onImportComplete,
  onRestoreBackup,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updateDuplicates, setUpdateDuplicates] = useState(true);
  const [importedSuccess, setImportedSuccess] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImportedSuccess(false);

    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const jsonText = event.target?.result as string;
          const parsed = JSON.parse(jsonText);
          const rawProducts = Array.isArray(parsed) ? parsed : (parsed.products || []);
          if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
            setError('فایل بَک‌آپ JSON خالی یا نامعتبر است.');
            return;
          }
          if (onRestoreBackup) {
            onRestoreBackup(rawProducts);
          } else {
            const importFn = onImportComplete || onImport;
            if (importFn) importFn(rawProducts, []);
          }
          setImportedSuccess(true);
          setTimeout(() => {
            onClose();
            setImportedSuccess(false);
          }, 1200);
        } catch (err) {
          setError('خطا در خواندن فایل بَک‌آپ JSON.');
        }
      };
      reader.readAsText(file, 'UTF-8');
      return;
    }

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = processCsvUpload(text, file.name, existingProducts);
        setPreview(result);
        if (result.newProducts.length === 0 && result.duplicateMatches.length === 0) {
          setError('هیچ کالای معتبری در فایل شناسایی نشد. لطفاً ساختار فایل را بررسی کنید.');
        }
      } catch (err) {
        setError('خطا در خواندن فایل CSV. لطفاً ساختار فایل را بررسی کنید.');
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleApplyImport = () => {
    if (!preview) return;
    const importFn = onImportComplete || onImport;
    if (importFn) {
      importFn(
        preview.newProducts,
        updateDuplicates ? preview.duplicateMatches : []
      );
    }
    setImportedSuccess(true);
    setTimeout(() => {
      onClose();
      setPreview(null);
      setImportedSuccess(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">مدیریت فایل و همگام‌سازی اکسل / دیتابیس</h2>
              <p className="text-xs text-slate-400">ورود و خروجی اکسل، بارکدها، موقعیت کشوها و پشتیبان‌گیری</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'import'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>ورود و آپلود فایل (روش ۲ و ۳)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'export'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>خروجی اکسل و فایل پشتیبان</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 overflow-y-auto space-y-4 flex-1">
          
          {activeTab === 'import' && (
            <>
              {!preview ? (
                <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-950/60 rounded-2xl p-8 text-center transition-colors">
                  <Upload className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-bounce" />
                  <h3 className="text-sm font-bold text-slate-200 mb-1">فایل اکسل/CSV یا بَک‌آپ JSON را انتخاب کنید</h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    پشتیبانی کامل از فایل‌های CSV اکسل و فایل بَک‌آپ دیتابیس همکاران با شناسه، بارکد، شماره کشو و موجودی
                  </p>
                  
                  <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-blue-600/20">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>انتخاب فایل (.csv یا .json)</span>
                    <input
                      type="file"
                      accept=".csv,text/csv,.json,application/json"
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
                            قیمت و اطلاعات کالاهای تکراری با فایل جدید به‌روزرسانی شود
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
            </>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">دانلود خروجی اکسل و CSV کامل انبار (روش ۲)</h3>
                    <p className="text-[11px] text-slate-400">
                      دانلود فایل استاندارد Excel با پشتیبانی از حروف فارسی، کد فنی، شماره کشو و موجودی
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-emerald-400 font-bold">
                    تعداد کل قطعات آماده خروجی: {formatPersianNumber(existingProducts.length)} کالا
                  </span>
                  <button
                    onClick={() => downloadCsvFile(existingProducts)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>دانلود فایل CSV / Excel</span>
                  </button>
                </div>
              </div>

              {/* JSON Cloud Database Backup Option */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100">پشتیبان‌گیری ابری و دیتابیس آنلاین کامل (روش ۳)</h3>
                    <p className="text-[11px] text-slate-400">
                      ذخیره و دانلود دیتابیس کامل جهت اشتراک‌گذاری با سایر پرسنل و دستگاه‌ها
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-purple-400 font-bold">
                    فرمت بَک‌آپ: JSON (شامل سودها، کشوها و قطعات)
                  </span>
                  <button
                    onClick={() => downloadJsonBackup(existingProducts)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>دانلود فایل دیتابیس (JSON)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          {importedSuccess && (
            <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>فایل با موفقیت اعمال گردید و اطلاعات انبار بروزرسانی شد.</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        {preview && activeTab === 'import' && !importedSuccess && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                setPreview(null);
                setError(null);
              }}
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

