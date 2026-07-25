import { Product, DuplicateMatch, CsvPreview } from '../types';
import { processCsvUpload } from './csv';

export function convertGoogleSheetLinkToCsvUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  if (trimmed.includes('/export?format=csv') || trimmed.includes('/pub?output=csv')) {
    return trimmed;
  }

  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  return trimmed;
}

function csvEscape(val: any): string {
  const str = String(val ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Converts the Apps Script { status, products: [...] } payload into CSV text
 * so it can be run through the existing processCsvUpload merge logic.
 */
function appsScriptProductsToCsv(products: any[]): string {
  const header = 'نام,برند,قیمت,بارکد,محل,موجودی,دسته';
  const rows = products.map((p) =>
    [
      csvEscape(p.name),
      csvEscape(p.brand),
      csvEscape(p.numericPrice),
      csvEscape(p.barcode || p.oemCode || ''),
      csvEscape(p.location),
      csvEscape(p.stock),
      csvEscape(p.category),
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

export async function fetchAndProcessGoogleSheet(
  sheetUrl: string,
  existingProducts: Product[]
): Promise<CsvPreview> {
  const trimmed = sheetUrl.trim();

  try {
    let csvText: string;

    if (trimmed.includes('script.google.com')) {
      const response = await fetch(trimmed);
      if (!response.ok) {
        throw new Error(`خطا در دریافت اطلاعات (کد خطا: ${response.status}).`);
      }
      const payload = await response.json();

      if (payload && payload.status === 'error') {
        throw new Error(payload.message || 'خطا در دریافت اطلاعات از اسکریپت.');
      }

      const products = Array.isArray(payload) ? payload : (payload.products || []);
      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('محتوای گوگل شیت خالی است.');
      }
      csvText = appsScriptProductsToCsv(products);
    } else {
      const directUrl = convertGoogleSheetLinkToCsvUrl(trimmed);
      const response = await fetch(directUrl, {
        method: 'GET',
        headers: { 'Accept': 'text/csv, text/plain, */*' }
      });

      if (!response.ok) {
        throw new Error(`خطا در دریافت اطلاعات گوگل شیت (کد خطا: ${response.status}). از عمومی بودن لایسنس یا لینک اشتراک کپی شده مطمئن شوید.`);
      }

      csvText = await response.text();
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('محتوای گوگل شیت خالی است.');
      }
    }

    return processCsvUpload(csvText, 'Google Sheet Sync', existingProducts);
  } catch (err: any) {
    throw new Error(err.message || 'خطا در برقراری ارتباط با گوگل شیت');
  }
}

/**
 * Uploads full product list to Google Sheet via Apps Script Web App.
 * This Apps Script responds with { status: "success", updated, added }.
 */
export async function uploadProductsToSheet(
  scriptUrl: string,
  products: Product[]
): Promise<number> {
  if (!scriptUrl) throw new Error('لینک اسکریپت گوگل (Apps Script) تنظیم نشده است.');

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ products }),
  });

  const result = await response.json();

  if (result.status !== 'success' && !result.success) {
    throw new Error(result.message || 'خطا در آپلود اطلاعات به گوگل شیت.');
  }

  const updated = result.updated ?? 0;
  const added = result.added ?? 0;
  return result.count ?? (updated + added);
}

/**
 * Checks the sheet's last-modified time (only works if the Apps Script
 * supports ?action=meta — otherwise resolves to null and the caller
 * should just skip the "remote changed" feature).
 */
export async function checkSheetLastModified(scriptUrl: string): Promise<string | null> {
  if (!scriptUrl) return null;
  try {
    const response = await fetch(`${scriptUrl}?action=meta`);
    if (!response.ok) return null;
    const result = await response.json();
    return result.lastModified || null;
  } catch {
    return null;
  }
}
