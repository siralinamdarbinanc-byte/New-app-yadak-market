import React, { useState } from 'react';
import { X, Cloud, RefreshCw, CheckCircle2, AlertCircle, Link, ArrowLeft, ArrowRight, ShieldCheck, Code2, Copy, Check, AlertTriangle, Sparkles, Plus, Layers, FileText, Upload, Download } from 'lucide-react';
import { Product, GoogleSheetsConfig, CsvPreview } from '../types';
import { fetchAndProcessGoogleSheet, pushProductsToGoogleSheet } from '../utils/googleSheets';
import { formatPersianNumber } from '../utils/pricing';

const GOOGLE_APPS_SCRIPT_CODE = `/**
 * کد هوشمند دوطرفه Google Apps Script برای انبار یدک مارکت
 * 
 * روش صحیح نصب:
 * ۱. فایل گوگل شیت خود را در مرورگر باز کنید.
 * ۲. از منوی بالا به مسیر Extensions -> Apps Script (یا افزونه‌ها -> Apps Script) بروید.
 * ۳. تمامی کدهای قبلی را پاک کرده و این کد را پیست کنید.
 * ۴. دکمه Deploy -> New deployment را بزنید.
 * ۵. Select type را روی Web app قرار دهید.
 * ۶. قسمت "Who has access" را حتماً روی "Anyone" (هرکس) بگذارید و Deploy را بزنید.
 * 
 * نکته: اگر اسکریپت را به طور مستقل از script.google.com ساخته‌اید، آیدی گوگل شیت را در متغیر زیر وارد کنید:
 */

var SPREADSHEET_ID = "1uMsiEKnjJ5Vgvc5iDbCgWiU4_6ZSabfzws83qL8bgac"; // آیدی گوگل شیت شما جهت اتصال اتوماتیک

function getTargetSheet(e) {
  var ss = null;
  
  // ۱. بررسی متغیر SPREADSHEET_ID
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } catch(err) {}
  }
  
  // ۲. بررسی پارامتر ارسال شده در آدرس
  if (!ss && e && e.parameter && e.parameter.sheetId) {
    try {
      ss = SpreadsheetApp.openById(e.parameter.sheetId);
    } catch(err) {}
  }
  
  // ۳. تلاش برای دریافت شیت متصل به پروژه (Container-bound)
  if (!ss) {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.getActive();
    } catch(err) {}
  }

  if (!ss) {
    throw new Error("فایل گوگل شیت یافت نشد! لطفاً یا اسکریپت را مستقیماً از داخل فایل گوگل شیت (منوی Extensions -> Apps Script) باز کنید، و یا آیدی گوگل شیت خود را در خط ۱۴ کد اسکریپت در SPREADSHEET_ID قرار دهید.");
  }
  
  return ss.getActiveSheet();
}

function doGet(e) {
  try {
    var sheet = getTargetSheet(e);
    var data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", products: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var products = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0] && !row[1]) continue;
      
      products.push({
        name: String(row[1] || row[0] || ''),
        brand: String(row[2] || ''),
        numericPrice: Number(row[3] || 0),
        oemCode: String(row[4] || ''),
        location: String(row[5] || ''),
        stock: Number(row[6] || 0),
        category: String(row[7] || 'عمومی'),
        lastUpdate: String(row[8] || ''),
        updatedAt: Number(row[9] || 0)
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      total: products.length,
      products: products
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var sheet = getTargetSheet(e);
    var contents = JSON.parse(e.postData.contents);
    var items = Array.isArray(contents) ? contents : (contents.products || [contents]);
    
    var data = sheet.getDataRange().getValues();
    if (data.length === 0) {
      sheet.appendRow(['ردیف', 'نام کالا', 'برند', 'قیمت پایه (ریال)', 'کد فنی / بارکد', 'موقعیت انبار / کشو', 'موجودی (عدد)', 'دسته بندی', 'آخرین تغییرات', 'برچسب زمان']);
      data = sheet.getDataRange().getValues();
    }
    
    var updatedCount = 0;
    var addedCount = 0;
    
    items.forEach(function(item) {
      var foundRow = -1;
      for (var i = 1; i < data.length; i++) {
        var rowName = String(data[i][1] || '').trim().toLowerCase();
        var rowBrand = String(data[i][2] || '').trim().toLowerCase();
        var itemName = String(item.name || '').trim().toLowerCase();
        var itemBrand = String(item.brand || '').trim().toLowerCase();
        
        if (rowName === itemName && rowBrand === itemBrand) {
          foundRow = i + 1;
          break;
        }
      }
      
      var nowStr = item.lastUpdate || new Date().toLocaleDateString('fa-IR');
      var timestamp = item.updatedAt || Date.now();
      
      if (foundRow > 0) {
        sheet.getRange(foundRow, 4).setValue(item.numericPrice || item.price || 0);
        if (item.oemCode) sheet.getRange(foundRow, 5).setValue(item.oemCode);
        if (item.location) sheet.getRange(foundRow, 6).setValue(item.location);
        if (item.stock !== undefined) sheet.getRange(foundRow, 7).setValue(item.stock);
        sheet.getRange(foundRow, 9).setValue(nowStr);
        sheet.getRange(foundRow, 10).setValue(timestamp);
        updatedCount++;
      } else {
        sheet.appendRow([
          data.length,
          item.name || '',
          item.brand || '',
          item.numericPrice || item.price || 0,
          item.oemCode || '',
          item.location || 'عمومی',
          item.stock || 0,
          item.category || 'عمومی',
          nowStr,
          timestamp
        ]);
        addedCount++;
      }
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "اطلاعات با موفقیت در گوگل شیت به‌روزرسانی شد",
      updated: updatedCount,
      added: addedCount
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyVX6Ag_ed6kb0kyo5r9TJaSWKUTGXY4EExh0iNW85okhG_RMr2Xu7LYVXDIWyT8wKE/exec';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (newConfig: GoogleSheetsConfig) => void;
  existingProducts: Product[];
  pendingChanges: Product[];
  onClearPendingChanges: () => void;
  onApplySync: (newProducts: Product[], duplicatesToUpdate: any[]) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  existingProducts,
  pendingChanges,
  onClearPendingChanges,
  onApplySync,
}) => {
  if (!isOpen) return null;

  const [sheetUrlInput, setSheetUrlInput] = useState(config.sheetUrl || DEFAULT_SCRIPT_URL);
  const [autoSync, setAutoSync] = useState(config.autoSync || false);
  const [loading, setLoading] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [pushResult, setPushResult] = useState<{ updated: number; added: number; message: string } | null>(null);
  const [showScriptCode, setShowScriptCode] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [syncedSuccess, setSyncedSuccess] = useState(false);
  const [updateDuplicates, setUpdateDuplicates] = useState(true);
  const [pushScope, setPushScope] = useState<'PENDING' | 'ALL'>('PENDING');

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleTestAndSync = async () => {
    if (!sheetUrlInput.trim()) {
      setErrorMsg('لطفا لینک کپی شده از گوگل شیت (Google Sheet URL) را وارد کنید.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setPreview(null);
    setPushResult(null);
    setSyncedSuccess(false);

    try {
      const result = await fetchAndProcessGoogleSheet(sheetUrlInput, existingProducts);
      setPreview(result);
      
      // Save sheet url config
      onSaveConfig({
        sheetUrl: sheetUrlInput,
        autoSync,
        lastSync: new Date().toLocaleTimeString('fa-IR') + ' - ' + new Date().toLocaleDateString('fa-IR'),
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارتباط با گوگل شیت.');
    } finally {
      setLoading(false);
    }
  };

  const handlePushToGoogleSheet = async () => {
    if (!sheetUrlInput.trim()) {
      setErrorMsg('لطفا ابتدا لینک اسکریپت گوگل شیت (Google Apps Script Web App URL) را وارد کنید.');
      return;
    }

    const isSendingPending = pushScope === 'PENDING' && pendingChanges.length > 0;
    const targetProducts = isSendingPending ? pendingChanges : existingProducts;

    if (targetProducts.length === 0) {
      setErrorMsg('هیچ کالایی برای ارسال وجود ندارد.');
      return;
    }

    setPushLoading(true);
    setErrorMsg('');
    setPreview(null);
    setPushResult(null);

    try {
      const res = await pushProductsToGoogleSheet(sheetUrlInput, targetProducts);
      
      if (isSendingPending) {
        onClearPendingChanges();
      }

      setPushResult({
        ...res,
        message: isSendingPending
          ? `تعداد ${formatPersianNumber(targetProducts.length)} کالا/تغییر به گوگل شیت ارسال و حافظه موقت پاک شد.`
          : res.message,
      });

      onSaveConfig({
        sheetUrl: sheetUrlInput,
        autoSync,
        lastSync: new Date().toLocaleTimeString('fa-IR') + ' - ' + new Date().toLocaleDateString('fa-IR'),
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارسال داده‌ها به گوگل شیت.');
    } finally {
      setPushLoading(false);
    }
  };

  const modifiedDuplicates = preview ? preview.duplicateMatches.filter((m) => m.hasChanges && !m.isStale) : [];
  const staleDuplicatesCount = preview ? preview.duplicateMatches.filter((m) => m.isStale).length : 0;
  const unchangedDuplicatesCount = preview ? preview.duplicateMatches.filter((m) => !m.hasChanges && !m.isStale).length : 0;

  const handleConfirmSync = () => {
    if (!preview) return;
    const dupesToPass = updateDuplicates ? modifiedDuplicates : [];
    onApplySync(preview.newProducts, dupesToPass);
    setSyncedSuccess(true);
    setTimeout(() => {
      onClose();
      setSyncedSuccess(false);
    }, 1500);
  };

  const hasUpdates = preview ? (preview.newProducts.length > 0 || (updateDuplicates && modifiedDuplicates.length > 0)) : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">همگام‌سازی با گوگل شیت (Google Sheets)</h2>
              <p className="text-xs text-slate-400">بررسی به‌روزرسانی‌های جدید آنلاین و تایید تغییرات انبار</p>
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
          
          {/* Auto Sync Toggle Box */}
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-4 h-4 text-emerald-400 ${autoSync ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                <span className="text-xs font-bold text-emerald-200">همگام‌سازی ۲ طرفه خودکار (ارسال تغییرات + دریافت هر ۱ دقیقه)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                با فعال بودن این گزینه، هرگونه تغییر جدید محلی بلافاصله به گوگل شیت ارسال شده و تغییرات سایر دستگاه‌ها نیز هر ۶۰ ثانیه به صورت خودکار چک و دریافت می‌شود.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => {
                  const val = e.target.checked;
                  setAutoSync(val);
                  onSaveConfig({
                    sheetUrl: sheetUrlInput,
                    autoSync: val,
                    lastSync: config.lastSync,
                  });
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Pending Changes Memory Queue Banner */}

          <div className="bg-slate-950 border border-purple-900/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-xs font-bold text-purple-200">حافظه موقت تغییرات اخیر انبار:</span>
              </div>
              {pendingChanges.length > 0 && (
                <button
                  type="button"
                  onClick={onClearPendingChanges}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors underline"
                >
                  پاک‌سازی حافظه موقت
                </button>
              )}
            </div>

            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-300">
                {pendingChanges.length > 0 ? (
                  <>تعداد <strong className="text-purple-300 font-bold font-mono text-sm px-1">{formatPersianNumber(pendingChanges.length)}</strong> کالا ویرایش/افزوده شده در انتظار ارسال</>
                ) : (
                  <span className="text-slate-400">هیچ تغییر جدیدی در حافظه موقت ثبت نشده است (تمام تغییرات قبلی ارسال شده‌اند).</span>
                )}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 border border-purple-800/60 text-purple-300">
                {pendingChanges.length > 0 ? 'حالت سبک & سریع' : 'انبار به‌روز'}
              </span>
            </div>

            {/* Scope Selection Controls */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <button
                type="button"
                onClick={() => setPushScope('PENDING')}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                  pushScope === 'PENDING'
                    ? 'bg-purple-950/60 border-purple-500/80 text-purple-200 ring-1 ring-purple-500/30'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <span className={`w-2 h-2 rounded-full ${pushScope === 'PENDING' ? 'bg-purple-400' : 'bg-slate-600'}`} />
                  <span>فقط ارسال تغییرات جدید</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({pendingChanges.length > 0 ? formatPersianNumber(pendingChanges.length) : formatPersianNumber(existingProducts.length)} کالا - سریع)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPushScope('ALL')}
                className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                  pushScope === 'ALL'
                    ? 'bg-blue-950/60 border-blue-500/80 text-blue-200 ring-1 ring-blue-500/30'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <span className={`w-2 h-2 rounded-full ${pushScope === 'ALL' ? 'bg-blue-400' : 'bg-slate-600'}`} />
                  <span>ارسال کامل کل انبار</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({formatPersianNumber(existingProducts.length)} کالا - تمام کل کالاها)
                </span>
              </button>
            </div>
          </div>

          {/* Input box & Dual Actions (Download vs Upload) */}
          <div className="space-y-3.5 bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <label className="block text-xs font-bold text-slate-200">
              لینک فایل Google Sheet یا Google Apps Script آنلاین:
            </label>
            <input
              type="text"
              value={sheetUrlInput}
              onChange={(e) => setSheetUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec  یا لینک مستقیم گوگل شیت"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Action buttons: Download vs Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleTestAndSync}
                disabled={loading || pushLoading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Download className={`w-4 h-4 ${loading ? 'animate-bounce' : ''}`} />
                <span>{loading ? 'در حال دریافت...' : 'دریافت به‌روزرسانی از گوگل شیت'}</span>
              </button>

              <button
                onClick={handlePushToGoogleSheet}
                disabled={loading || pushLoading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
              >
                <Upload className={`w-4 h-4 ${pushLoading ? 'animate-bounce' : ''}`} />
                <span>
                  {pushLoading
                    ? 'در حال ارسال...'
                    : pushScope === 'PENDING' && pendingChanges.length > 0
                      ? `ارسال ${formatPersianNumber(pendingChanges.length)} تغییر جدید به شیت`
                      : `ارسال کل انبار (${formatPersianNumber(existingProducts.length)} کالا)`}
                </span>
              </button>
            </div>

            {config.lastSync && (
              <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>آخرین همگام‌سازی موفق: {config.lastSync}</span>
              </div>
            )}
          </div>

          {/* Guide Note */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-300 flex items-center gap-1.5">
                <Link className="w-4 h-4 text-purple-400" />
                راهنمای ۲ روش آماده‌سازی لینک گوگل شیت:
              </h4>
              <button
                type="button"
                onClick={() => setShowScriptCode(!showScriptCode)}
                className="px-2.5 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>{showScriptCode ? 'بستن کد اسکریپت' : 'نمایش کد Google Apps Script'}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
              <li>
                <strong>روش اول (لینک مستقیم شیت):</strong> روی دکمه Share کلیک کرده و دسترسی را روی <strong>Anyone with the link</strong> بگذارید، سپس لینک مرورگر را کپی و اینجا پیست کنید.
              </li>
              <li>
                <strong>روش دوم (گوگل اپس اسکریپت Web App):</strong> اگر اسکریپت Google Apps Script (تابع doGet) نوشه‌اید، آدرس خروجی (با پسوند <code className="text-emerald-400 font-mono">/exec</code>) را مستقیماً وارد کنید.
              </li>
            </ol>

            {/* Collapsible Script Code Box */}
            {showScriptCode && (
              <div className="mt-3 bg-slate-950 border border-purple-900/50 rounded-xl p-3 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5" />
                    کد کامل اسکریپت گوگل شیت (Apps Script):
                  </span>
                  <button
                    onClick={handleCopyScript}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? 'کپی شد!' : 'کپی کدهای اسکریپت'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-mono text-purple-200 overflow-x-auto max-h-48 leading-relaxed">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>
            )}
          </div>

          {/* Sync Result & Confirmation Prompt */}
          {preview && (
            <div className="space-y-4">
              {hasUpdates ? (
                <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-2xl p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>به‌روزرسانی‌های جدید در گوگل شیت یافت شد!</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    سیستم به‌صورت هوشمند تفاوت‌های گوگل شیت با انبار فعلی را محاسبه نمود. تنها موارد دارای تغییر یا کالاهای جدید به‌روزرسانی خواهند شد:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                      <span className="text-slate-400 block mb-1">اقلام جدید آماده افزودن:</span>
                      <strong className="text-emerald-300 font-mono text-base">
                        {formatPersianNumber(preview.newProducts.length)} کالا
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                      <span className="text-slate-400 block mb-1">اقلام دارای تغییر اطلاعات:</span>
                      <strong className="text-amber-300 font-mono text-base">
                        {formatPersianNumber(modifiedDuplicates.length)} کالا
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                      <span className="text-slate-400 block mb-1">بدون تغییر (رد شد):</span>
                      <strong className="text-slate-400 font-mono text-base">
                        {formatPersianNumber(unchangedDuplicatesCount)} کالا
                      </strong>
                    </div>
                  </div>

                  {/* Stale items timestamp protection alert */}
                  {staleDuplicatesCount > 0 && (
                    <div className="bg-sky-950/60 border border-sky-800/60 p-3 rounded-xl flex items-center gap-2.5 text-xs text-sky-200">
                      <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
                      <span>
                        سیستم به صورت خودکار از جایگزینی <strong className="font-mono text-sky-300 px-1 font-bold">{formatPersianNumber(staleDuplicatesCount)}</strong> کالا که ویرایش محلی آن‌ها جدیدتر از شیت بوده جلوگیری کرد تا اطلاعات انبار شما خراب نشود.
                      </span>
                    </div>
                  )}

                  {/* Option to include/exclude updating existing items */}
                  {modifiedDuplicates.length > 0 && (
                    <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={updateDuplicates}
                          onChange={(e) => setUpdateDuplicates(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500 rounded"
                        />
                        <span className="text-slate-200 font-semibold">
                          قیمت، شماره کشو و موجودی کالاهای تغییریافته با فایل گوگل شیت به‌روز شود
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Preview breakdown list */}
                  {modifiedDuplicates.length > 0 && updateDuplicates && (
                    <div className="border border-slate-800 rounded-xl p-3 bg-slate-900/60 max-h-36 overflow-y-auto space-y-2">
                      <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>نمونه کالاهای دارای تغییر قیمت/اطلاعات ({formatPersianNumber(modifiedDuplicates.length)} مورد):</span>
                      </div>
                      {modifiedDuplicates.slice(0, 10).map((match, idx) => (
                        <div key={idx} className="text-[11px] p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <span className="font-medium text-slate-200">{match.name} ({match.brand})</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="line-through text-slate-500">{formatPersianNumber(match.oldPriceNumeric)}</span>
                            <ArrowLeft className="w-3 h-3 text-purple-400" />
                            <span className="text-emerald-400 font-bold">{formatPersianNumber(match.newPriceNumeric)} ریال</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Confirmation Button inside prompt box */}
                  <div className="pt-2 flex items-center justify-between border-t border-emerald-900/40">
                    <span className="text-[11px] text-emerald-400 font-bold">
                      آماده به‌روزرسانی هوشمند انبار ({formatPersianNumber(preview.newProducts.length + (updateDuplicates ? modifiedDuplicates.length : 0))} تغییر)
                    </span>
                    <button
                      onClick={handleConfirmSync}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تایید و به‌روزرسانی انبار</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl text-emerald-200 text-xs font-bold space-y-1">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>انبار شما کاملاً به‌روز است!</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-normal pt-1">
                    تعداد {formatPersianNumber(preview.duplicateMatches.length)} کالا در شیت با انبار سنجیده شد و هیچ تغییر قیمت، موجودی یا موقعیتی یافت نشد.
                  </p>
                </div>
              )}
            </div>
          )}

          {pushResult && (
            <div className="p-4 bg-blue-950/60 border border-blue-800/80 rounded-2xl text-blue-100 text-xs space-y-2 animate-fade-in shadow-xl">
              <div className="flex items-center gap-2 font-bold text-blue-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                <span>ارسال اطلاعات انبار به گوگل شیت با موفقیت انجام شد!</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {pushResult.message}
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">کالاهای به‌روزرسانی شده:</span>
                  <strong className="text-blue-300 font-mono text-sm">{formatPersianNumber(pushResult.updated)} کالا</strong>
                </div>
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">کالاهای جدید اضافه شده:</span>
                  <strong className="text-emerald-300 font-mono text-sm">{formatPersianNumber(pushResult.added)} کالا</strong>
                </div>
              </div>
            </div>
          )}

          {syncedSuccess && (
            <div className="p-4 bg-emerald-950/70 border border-emerald-800 rounded-2xl text-emerald-200 text-xs font-bold flex items-center gap-2.5 animate-fade-in shadow-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
              <span>به‌روزرسانی با موفقیت تایید و تمام اطلاعات جدید در انبار ثبت گردید!</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-200 text-xs space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>خطا در ارتباط با گوگل شیت:</span>
              </div>
              <p className="text-rose-200 leading-relaxed font-mono text-[11px] bg-rose-950/80 p-2.5 rounded-lg border border-rose-900/50">
                {errorMsg}
              </p>

              {(errorMsg.includes('فایل گوگل شیت یافت نشد') || errorMsg.includes('getActiveSheet') || errorMsg.includes('null')) && (
                <div className="p-3.5 bg-slate-900 border border-amber-500/40 rounded-xl space-y-2 text-slate-200 text-[11px]">
                  <strong className="text-amber-400 font-bold block flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    راهنمای رفع سریع این خطا (کمتر از ۱ دقیقه):
                  </strong>
                  <p className="text-slate-300 leading-relaxed">
                    علت خطا این است که اسکریپت را به طور مستقیم در <code className="text-purple-300">script.google.com</code> ساخته‌اید و به هیچ فایل شیت مشخصی متصل نیست.
                  </p>
                  <div className="space-y-1.5 text-slate-300 border-t border-slate-800 pt-2">
                    <p className="font-bold text-emerald-400">راه حل اول (پیشنهادی و خیلی آسان):</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 pr-1">
                      <li>فایل گوگل شیت خود را در مرورگر باز کنید.</li>
                      <li>از منوی بالای شیت روی <strong>Extensions &rarr; Apps Script</strong> (یا افزونه‌ها) کلیک کنید.</li>
                      <li>کد زیر را جایگزین کد قبلی کرده و دکمه <strong>Deploy &rarr; New deployment</strong> را بزنید (Access را روی <strong>Anyone</strong> بگذارید).</li>
                    </ol>
                  </div>
                  <div className="space-y-1 text-slate-300 border-t border-slate-800 pt-2">
                    <p className="font-bold text-purple-300">راه حل دوم (اگر اسکریپت مستقل می‌خواهید):</p>
                    <p className="pr-1 text-slate-300">
                      آیدی فایل گوگل شیت خود (عبارت موجود در آدرس لینک شیت بین <code className="text-amber-300">/d/</code> و <code className="text-amber-300">/edit</code>) را کپی کرده و در <strong>خط ۲۱ کد اسکریپت بالا</strong> در متغیر <code className="text-emerald-400 font-mono">var SPREADSHEET_ID = "..."</code> قرار دهید، سپس ذخیره و مجدداً Deploy کنید.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            انصراف و بستن
          </button>

          {preview && hasUpdates && !syncedSuccess && (
            <button
              onClick={handleConfirmSync}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تایید و به‌روزرسانی انبار</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

