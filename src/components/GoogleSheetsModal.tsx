import React, { useState } from 'react';
import { X, Cloud, RefreshCw, CheckCircle2, AlertCircle, Link, UploadCloud, ShieldCheck } from 'lucide-react';
import { Product, GoogleSheetsConfig, CsvPreview } from '../types';
import { fetchAndProcessGoogleSheet, uploadProductsToSheet } from '../utils/googleSheets';
import { formatPersianNumber } from '../utils/pricing';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (newConfig: GoogleSheetsConfig) => void;
  existingProducts: Product[];
  onApplySync: (newProducts: Product[], duplicatesToUpdate: any[]) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  existingProducts,
  onApplySync,
}) => {
  if (!isOpen) return null;

  const [sheetUrlInput, setSheetUrlInput] = useState(config.sheetUrl || '');
  const [scriptUrlInput, setScriptUrlInput] = useState(config.scriptUrl || '');
  const [autoSync, setAutoSync] = useState(config.autoSync || false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [preview, setPreview] = useState<CsvPreview | null>(null);

  const saveConfig = (extra: Partial<GoogleSheetsConfig> = {}) => {
    onSaveConfig({
      sheetUrl: sheetUrlInput,
      scriptUrl: scriptUrlInput,
      autoSync,
      lastSync: config.lastSync || null,
      ...extra,
    });
  };

  const handleTestAndSync = async () => {
    if (!sheetUrlInput.trim()) {
      setErrorMsg('لطفا لینک کپی شده از گوگل شیت (Google Sheet URL) را وارد کنید.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setPreview(null);

    try {
      const result = await fetchAndProcessGoogleSheet(sheetUrlInput, existingProducts);
      setPreview(result);
      saveConfig({ lastSync: new Date().toLocaleTimeString('fa-IR') + ' - ' + new Date().toLocaleDateString('fa-IR') });
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارتباط با گوگل شیت.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!scriptUrlInput.trim()) {
      setErrorMsg('لطفا لینک Apps Script (exec) را وارد کنید.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const count = await uploadProductsToSheet(scriptUrlInput, existingProducts);
      setSuccessMsg(`${formatPersianNumber(count)} کالا با موفقیت روی گوگل شیت آپلود شد.`);
      saveConfig({ lastSync: new Date().toLocaleTimeString('fa-IR') + ' - ' + new Date().toLocaleDateString('fa-IR') });
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در آپلود اطلاعات.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmSync = () => {
    if (!preview) return;
    onApplySync(preview.newProducts, preview.duplicateMatches);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">همگام‌سازی با گوگل شیت (Google Sheets)</h2>
              <p className="text-xs text-slate-400">دانلود و آپلود دوطرفه لیست قطعات و قیمت‌ها بین پرسنل</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 overflow-y-auto space-y-4 flex-1">

          {/* Download section */}
          <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <label className="block text-xs font-bold text-slate-200">
              لینک عمومی فایل Google Sheet (برای دانلود):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1ABC.../edit"
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={handleTestAndSync}
                disabled={loading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'در حال دریافت...' : 'دانلود و بررسی'}</span>
              </button>
            </div>
          </div>

          {/* Upload section */}
          <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <label className="block text-xs font-bold text-slate-200">
              لینک Apps Script (برای آپلود تغییرات):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={scriptUrlInput}
                onChange={(e) => setScriptUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-600/20 shrink-0"
              >
                <UploadCloud className={`w-4 h-4 ${uploading ? 'animate-pulse' : ''}`} />
                <span>{uploading ? 'در حال آپلود...' : 'آپلود به گوگل شیت'}</span>
              </button>
            </div>

            {config.lastSync && (
              <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>آخرین همگام‌سازی: {config.lastSync}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
              <Link className="w-4 h-4 text-purple-400" />
              راهنما:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
              <li>«دانلود» آخرین اطلاعات گوگل شیت رو میاره داخل اپ.</li>
              <li>«آپلود» کل لیست فعلی محصولات اپ (شامل بارکدها و قیمت‌های تازه) رو میفرسته روی گوگل شیت.</li>
              <li>برای دیدن تغییرات یک نفر روی گوشی نفر دیگه، اول آپلود کن، بعد اون یکی دانلود بزنه.</li>
            </ol>
          </div>

          {preview && (
            <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                نتیجه بررسی فایل گوگل شیت:
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 block mb-1">اقلام جدید شناسایی شده:</span>
                  <strong className="text-emerald-300 font-mono text-base">{formatPersianNumber(preview.newProducts.length)} کالا</strong>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 block mb-1">اقلام دارای تغییر قیمت:</span>
                  <strong className="text-amber-300 font-mono text-base">{formatPersianNumber(preview.duplicateMatches.length)} کالا</strong>
                </div>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium">
            بستن
          </button>

          {preview && (
            <button onClick={handleConfirmSync} className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20">
              اعمال اطلاعات گوگل شیت به انبار
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
