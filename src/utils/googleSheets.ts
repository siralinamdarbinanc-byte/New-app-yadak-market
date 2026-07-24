import { Product, DuplicateMatch, CsvPreview } from '../types';
import { processCsvUpload } from './csv';

/**
 * Converts standard Google Sheet share link into a direct CSV download export URL
 */
export function convertGoogleSheetLinkToCsvUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If it's already a direct csv or export link
  if (trimmed.includes('/export?format=csv') || trimmed.includes('/pub?output=csv')) {
    return trimmed;
  }

  // Matches Google Spreadsheet ID e.g. /d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    
    // Check if there is a specific gid parameter
    const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';

    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  return trimmed;
}

/**
 * Fetches Google Sheet CSV content from converted URL and processes items
 */
export async function fetchAndProcessGoogleSheet(
  sheetUrl: string,
  existingProducts: Product[]
): Promise<CsvPreview> {
  const directUrl = convertGoogleSheetLinkToCsvUrl(sheetUrl);

  try {
    const response = await fetch(directUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv, text/plain, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`خطا در دریافت اطلاعات گوگل شیت (کد خطا: ${response.status}). از عمومی بودن لایسنس یا لینک اشتراک کپی شده مطمئن شوید.`);
    }

    const csvText = await response.text();
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('محتوای گوگل شیت خالی است.');
    }

    return processCsvUpload(csvText, 'Google Sheet Sync', existingProducts);
  } catch (err: any) {
    throw new Error(err.message || 'خطا در برقراری ارتباط با گوگل شیت');
  }
}
