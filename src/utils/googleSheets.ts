import { Product, DuplicateMatch, CsvPreview } from '../types';
import { processCsvUpload } from './csv';

/**
 * Converts standard Google Sheet share link into a direct CSV download export URL
 */
export function convertGoogleSheetLinkToCsvUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If it's a Google Apps Script Web App URL or direct export/pub link
  if (
    trimmed.includes('/export?format=csv') ||
    trimmed.includes('/pub?output=csv') ||
    trimmed.includes('script.google.com') ||
    trimmed.includes('/exec')
  ) {
    if (trimmed.includes('script.google.com') && !trimmed.includes('sheetId=')) {
      const separator = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${separator}sheetId=1uMsiEKnjJ5Vgvc5iDbCgWiU4_6ZSabfzws83qL8bgac`;
    }
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
 * Fetches Google Sheet CSV or Apps Script JSON content from converted URL and processes items
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
        'Accept': 'application/json, text/csv, text/plain, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`خطا در دریافت اطلاعات گوگل شیت (کد خطا: ${response.status}). از عمومی بودن لینک (Anyone with the link) مطمئن شوید.`);
    }

    const responseText = await response.text();
    const trimmedText = responseText.trim();

    if (!trimmedText) {
      throw new Error('محتوای دریافت شده از گوگل شیت خالی است.');
    }

    // Check if response is an HTML page (usually permission required or Google Login page)
    if (trimmedText.startsWith('<!DOCTYPE html') || trimmedText.startsWith('<html')) {
      throw new Error('دسترسی عمومی فعال نیست. در گوگل شیت روی Share کلیک کنید و دسترسی را روی "Anyone with the link" بگذارید.');
    }

    // Check if response is JSON (from Google Apps Script doGet returning JSON)
    if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
      try {
        const jsonData = JSON.parse(trimmedText);
        if (jsonData.status === 'error' || jsonData.error) {
          throw new Error(jsonData.message || jsonData.error || 'خطا در اجرای اسکریپت گوگل شیت');
        }
        const rawItems = Array.isArray(jsonData) ? jsonData : (jsonData.products || jsonData.items || jsonData.data || []);
        
        if (!Array.isArray(rawItems) || rawItems.length === 0) {
          throw new Error('داده‌های JSON دریافت شده از اسکریپت گوگل حاوی آرایه کالاها نبود.');
        }

        // Convert JSON items to CSV-like format or process them directly
        const formattedProducts: Product[] = rawItems.map((item: any, idx: number) => {
          const name = item.name || item.title || item['نام کالا'] || item['نام'] || 'کالای بدون نام';
          const brand = item.brand || item['برند'] || '';
          const numericPrice = Number(item.numericPrice || item.price || item['قیمت'] || 0) || 0;
          const oemCode = item.oemCode || item.code || item['کد فنی'] || item['کد'] || item['بارکد'] || '';
          const location = item.location || item['موقعیت'] || item['کشو'] || 'عمومی';
          const stock = Number(item.stock || item['موجودی'] || 0) || 0;

          return {
            id: `gs_${Date.now()}_${idx}`,
            name,
            brand,
            price: numericPrice.toLocaleString('fa-IR'),
            numericPrice,
            oemCode: oemCode ? String(oemCode) : undefined,
            location,
            stock,
            lastUpdate: new Date().toLocaleDateString('fa-IR'),
          };
        });

        // Separate duplicate matches vs new products
        const newProducts: Product[] = [];
        const duplicateMatches: DuplicateMatch[] = [];

        formattedProducts.forEach((p) => {
          const match = existingProducts.find(
            (ep) => ep.name.trim().toLowerCase() === p.name.trim().toLowerCase() &&
                    (ep.brand || '').trim().toLowerCase() === (p.brand || '').trim().toLowerCase()
          );

          if (match) {
            duplicateMatches.push({
              existingProduct: match,
              newProduct: p,
              name: p.name,
              brand: p.brand || '',
              oldPriceNumeric: match.numericPrice || 0,
              newPriceNumeric: p.numericPrice || 0,
            });
          } else {
            newProducts.push(p);
          }
        });

        return {
          newProducts,
          duplicateMatches,
          totalParsed: formattedProducts.length,
        };
      } catch (jsonErr: any) {
        if (jsonErr.message && jsonErr.message.includes('JSON')) {
          // Fallback to CSV parsing if JSON parse failed
        } else {
          throw jsonErr;
        }
      }
    }

    // Standard CSV text parsing
    return processCsvUpload(trimmedText, 'Google Sheet Sync', existingProducts);
  } catch (err: any) {
    throw new Error(err.message || 'خطا در برقراری ارتباط با گوگل شیت');
  }
}

/**
 * Sends current inventory products to Google Apps Script Web App endpoint to sync/update Google Sheet
 */
export async function pushProductsToGoogleSheet(
  scriptUrl: string,
  products: Product[]
): Promise<{ updated: number; added: number; message: string }> {
  let trimmedUrl = scriptUrl.trim();
  if (!trimmedUrl || !trimmedUrl.includes('script.google.com')) {
    throw new Error('برای ارسال اطلاعات به گوگل شیت، باید لینک Google Apps Script Web App (با پسوند /exec) را وارد کنید.');
  }

  // Auto-append sheetId if not already present
  if (!trimmedUrl.includes('sheetId=')) {
    const defaultSheetId = '1uMsiEKnjJ5Vgvc5iDbCgWiU4_6ZSabfzws83qL8bgac';
    const separator = trimmedUrl.includes('?') ? '&' : '?';
    trimmedUrl = `${trimmedUrl}${separator}sheetId=${defaultSheetId}`;
  }

  const payload = {
    products: products.map((p) => ({
      name: p.name,
      brand: p.brand || '',
      numericPrice: p.numericPrice || 0,
      oemCode: p.oemCode || '',
      location: p.location || '',
      stock: p.stock !== undefined ? p.stock : 0,
      category: p.category || 'عمومی'
    }))
  };

  try {
    const response = await fetch(trimmedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`خطا در ارسال اطلاعات به گوگل شیت (کد خطا: ${response.status})`);
    }

    const resText = await response.text();
    let resJson;
    try {
      resJson = JSON.parse(resText);
    } catch {
      return {
        updated: products.length,
        added: 0,
        message: 'اطلاعات با موفقیت به گوگل شیت ارسال گردید.'
      };
    }

    if (resJson.status === 'error') {
      throw new Error(resJson.message || 'خطا در ثبت اطلاعات در اسکریپت گوگل شیت');
    }

    return {
      updated: resJson.updated || 0,
      added: resJson.added || 0,
      message: resJson.message || 'اطلاعات انبار با موفقیت در گوگل شیت آنلاین ثبت شد.'
    };
  } catch (err: any) {
    throw new Error(err.message || 'خطا در ارسال داده به گوگل شیت');
  }
}


