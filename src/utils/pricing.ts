import { Product, PriceResult, BrandMarkupMap, CategoryMarkupMap, StoreAnalytics, CurrencyMode } from '../types';

/**
 * Calculates display selling price and profit according to Yadak Market rules:
 * - Items with numericPrice < 80,000 Rials get an initial multiplier of 1.4
 * - Priority for markup:
 *    1. Brand-specific markup (if explicitly defined)
 *    2. Category-specific markup (if explicitly defined)
 *    3. General default markup %
 * - Rounds the final selling price up to the nearest 1,000 Rials
 */
export function calculatePriceResult(
  buyPrice: number,
  brand: string,
  category: string | undefined,
  generalPercent: number,
  brandMarkupMap: BrandMarkupMap,
  categoryMarkupMap: CategoryMarkupMap = {}
): PriceResult {
  // Apply legacy multiplier for low-cost items (< 80,000 Rials)
  const adjustedBuyPrice = buyPrice < 80000 ? Math.round(buyPrice * 1.4) : buyPrice;
  
  // Determine markup percent with hierarchy: Brand -> Category -> General
  let markupPercent = generalPercent;
  
  if (brand && brandMarkupMap[brand] !== undefined) {
    markupPercent = brandMarkupMap[brand];
  } else if (category && categoryMarkupMap[category] !== undefined) {
    markupPercent = categoryMarkupMap[category];
  }
  
  // Calculate raw selling price
  const sellRaw = adjustedBuyPrice + Math.round((adjustedBuyPrice * markupPercent) / 100);
  
  // Round up to nearest 1,000 Rials
  const remainder = sellRaw % 1000;
  const sellPrice = remainder > 0 ? sellRaw + (1000 - remainder) : sellRaw;
  const profit = sellPrice - buyPrice;

  return {
    buyPrice,
    sellPrice,
    profit,
    markupPercent
  };
}

/**
 * Formats currency amount in Rials or Tomans with Persian digits
 */
export function formatCurrency(
  valInRials: number | string,
  currencyMode: CurrencyMode = 'RIAL'
): string {
  if (valInRials === undefined || valInRials === null || valInRials === '') return '۰';
  const rialNum = typeof valInRials === 'string' ? parseInt(valInRials, 10) || 0 : valInRials;
  
  const displayNum = currencyMode === 'TOMAN' ? Math.round(rialNum / 10) : rialNum;
  return formatPersianNumber(displayNum);
}

/**
 * Formats a number to Persian digit string with thousand separators (e.g. 17,100,500 -> ۱۷,۱۰۰,۵۰۰)
 */
export function formatPersianNumber(val: number | string): string {
  if (val === undefined || val === null || val === '') return '۰';
  const num = typeof val === 'string' ? parseInt(val, 10) || 0 : val;
  const formatted = num.toLocaleString('en-US');
  
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return formatted.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
}

const DIGIT_MAP: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/**
 * Converts Persian and Arabic digits in a string to English digits
 */
export function normalizeDigits(s: string): string {
  if (!s) return '';
  return s.replace(/[۰-۹٠-٩]/g, (ch) => DIGIT_MAP[ch] || ch);
}

/**
 * Normalizes Persian characters (ی / ک / e.g.)
 */
export function normalizePersianText(s: string): string {
  if (!s) return '';
  let str = normalizeDigits(s);
  return str
    .replace(/[\u200B-\u200D\u200E\u200F\u202A-\u202E\uFEFF\u00A0]/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cleans product names from Google Sheets, CSV or user input:
 * - Strips invisible Unicode directional control characters (LRM, RLM, BOM, ZERO-WIDTH space, NBSP)
 * - Normalizes Arabic letters (ك -> ک, ي -> ی, ة -> ه)
 * - Cleans up multiple spaces and trims
 */
export function cleanProductName(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/[\u200B-\u200D\u200E\u200F\u202A-\u202E\uFEFF\u00A0]/g, ' ')
    .replace(/ك/g, 'ک')
    .replace(/[يى]/g, 'ی')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Automatically infers product Category from title keywords if not set
 */
export function inferCategoryFromName(name: string): string {
  const norm = normalizePersianText(name);
  if (norm.includes('بلبرینگ') || norm.includes('رولبرینگ') || norm.includes('توپی')) return 'بلبرینگ و توپی';
  if (norm.includes('تسمه') || norm.includes('پولی')) return 'تسمه و پولی';
  if (norm.includes('شمع') || norm.includes('وایور') || norm.includes('کوئل') || norm.includes('باتری') || norm.includes('دینام') || norm.includes('استارت')) return 'قطعات برقی و الکترونیک';
  if (norm.includes('لنت') || norm.includes('دیسک چرخ') || norm.includes('کاسه چرخ') || norm.includes('ترمز')) return 'سیستم ترمز';
  if (norm.includes('کمک فنر') || norm.includes('سیبک') || norm.includes('بوش') || norm.includes('طبق') || norm.includes('موجگیر') || norm.includes('ژامبون')) return 'جلوبندی و تعلیق';
  if (norm.includes('پیستون') || norm.includes('رینگ') || norm.includes('یاتاقان') || norm.includes('سوپاپ') || norm.includes('واشر') || norm.includes('سرسیلندر')) return 'موتوری و گیربکس';
  if (norm.includes('رادیاتور') || norm.includes('ترموستات') || norm.includes('واتر پمپ') || norm.includes('فن')) return 'خنک‌کننده و خنک‌کاری';
  if (norm.includes('فیلتر') || norm.includes('صافی') || norm.includes('روغن') || norm.includes('پمپ بنزین')) return 'فیلترها و سوخت‌رسانی';
  if (norm.includes('چراغ') || norm.includes('سپر') || norm.includes('آینه') || norm.includes('درب') || norm.includes('گلگیر')) return 'بدنه و تزئینات';
  return 'قطعات عمومی و مصرفی';
}

/**
 * Automatically infers compatible vehicles from title keywords
 */
export function inferVehiclesFromName(name: string): string[] {
  const norm = normalizePersianText(name);
  const vehicles: string[] = [];

  if (norm.includes('405') || norm.includes('۴۰۵') || norm.includes('پژو')) vehicles.push('پژو ۴۰۵');
  if (norm.includes('206') || norm.includes('۲۰۶')) vehicles.push('پژو ۲۰۶');
  if (norm.includes('207') || norm.includes('۲۰۷')) vehicles.push('پژو ۲۰۷');
  if (norm.includes('سمند') || norm.includes('دنا') || norm.includes('سورن')) vehicles.push('سمند / دنا');
  if (norm.includes('پرشیا') || norm.includes('پارس')) vehicles.push('پژو پارس');
  if (norm.includes('پراید') || norm.includes('131') || norm.includes('۱۳۱') || norm.includes('111')) vehicles.push('پراید');
  if (norm.includes('تیبا') || norm.includes('ساینا') || norm.includes('کوییک')) vehicles.push('تیبا / ساینا / کوییک');
  if (norm.includes('L90') || norm.includes('ال90') || norm.includes('تندر')) vehicles.push('تندر ۹۰ (ال ۹۰)');
  if (norm.includes('زانتیا')) vehicles.push('زانتیا');
  if (norm.includes('شاهین') || norm.includes('تارا')) vehicles.push('شاهین / تارا');

  return vehicles.length > 0 ? vehicles : ['همه‌منظوره / مشترک'];
}

/**
 * Calculates store summary analytics
 */
export function calculateStoreAnalytics(
  products: Product[],
  generalMarkup: number,
  brandMarkupMap: BrandMarkupMap,
  categoryMarkupMap: CategoryMarkupMap
): StoreAnalytics {
  let totalStock = 0;
  let totalPurchaseValuation = 0;
  let totalSalesValuation = 0;
  let lowStockCount = 0;

  const categoriesSet = new Set<string>();
  const brandsSet = new Set<string>();

  products.forEach((p) => {
    const stock = p.stock !== undefined ? p.stock : 0;
    const minStock = p.minStock !== undefined ? p.minStock : 3;

    if (stock <= minStock) {
      lowStockCount++;
    }

    const priceRes = calculatePriceResult(
      p.numericPrice,
      p.brand,
      p.category || inferCategoryFromName(p.name),
      generalMarkup,
      brandMarkupMap,
      categoryMarkupMap
    );

    totalStock += stock;
    totalPurchaseValuation += priceRes.buyPrice * stock;
    totalSalesValuation += priceRes.sellPrice * stock;

    if (p.category) categoriesSet.add(p.category);
    if (p.brand) brandsSet.add(p.brand);
  });

  return {
    totalProductsCount: products.length,
    totalStockCount: totalStock,
    totalPurchaseValuation,
    totalSalesValuation,
    totalPotentialProfit: totalSalesValuation - totalPurchaseValuation,
    lowStockCount,
    categoriesCount: categoriesSet.size || 10,
    brandsCount: brandsSet.size || 15,
  };
}

