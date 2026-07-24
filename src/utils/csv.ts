import { Product, DuplicateMatch, CsvPreview } from '../types';
import { normalizePersianText, normalizeDigits } from './pricing';

/**
 * Detects the best delimiter (comma, semicolon, tab, pipe) used in the CSV string
 */
function detectDelimiter(content: string): string {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 10);
  if (lines.length === 0) return ',';

  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };
  
  lines.forEach((line) => {
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (!inQuotes && char in counts) {
        counts[char]++;
      }
    }
  });

  let maxDelim = ',';
  let maxCount = -1;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxDelim = delim;
    }
  }
  return maxCount > 0 ? maxDelim : ',';
}

/**
 * Splits a CSV line by delimiter handling quotes
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const tokens: string[] = [];
  let currentToken = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      tokens.push(currentToken.trim());
      currentToken = '';
    } else {
      currentToken += char;
    }
  }
  tokens.push(currentToken.trim());
  return tokens;
}

/**
 * Parses a CSV string and detects duplicate products with existing list
 */
export function processCsvUpload(
  csvContent: string,
  fileName: string,
  existingProducts: Product[]
): CsvPreview {
  const delimiter = detectDelimiter(csvContent);
  const lines = csvContent.split(/\r?\n/);
  const newProducts: Product[] = [];
  const duplicateMatches: DuplicateMatch[] = [];

  const existingMap = new Map<string, Product>();
  existingProducts.forEach((p) => {
    const key = `${normalizePersianText(p.name)}___${normalizePersianText(p.brand)}`;
    existingMap.set(key, p);
  });

  let nextId = Math.max(0, ...existingProducts.map((p) => p.id || 0)) + 1;

  let nameColIdx = -1;
  let brandColIdx = -1;
  let priceColIdx = -1;
  let oemColIdx = -1;
  let stockColIdx = -1;
  let startRowIdx = 0;

  // Header detection
  if (lines.length > 0) {
    const firstLineTokens = parseCsvLine(lines[0].trim(), delimiter);
    firstLineTokens.forEach((tok, idx) => {
      const normTok = normalizePersianText(tok).toLowerCase();
      if (['نام', 'نام کالا', 'عنوان', 'قطعه', 'شرح', 'name', 'title'].some((k) => normTok.includes(k))) {
        nameColIdx = idx;
      } else if (['برند', 'سازنده', 'مارک', 'شرکت', 'brand', 'make'].some((k) => normTok.includes(k))) {
        brandColIdx = idx;
      } else if (['قیمت', 'مبلغ', 'فی', 'ریال', 'تومان', 'price', 'cost'].some((k) => normTok.includes(k))) {
        priceColIdx = idx;
      } else if (['کد', 'پارت نامبر', 'کد فنی', 'شناسه', 'oem', 'code'].some((k) => normTok.includes(k))) {
        oemColIdx = idx;
      } else if (['موجودی', 'تعداد', 'انبار', 'stock', 'qty'].some((k) => normTok.includes(k))) {
        stockColIdx = idx;
      }
    });

    if (nameColIdx !== -1 || priceColIdx !== -1) {
      startRowIdx = 1; // Skip header row
    }
  }

  for (let i = startRowIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const tokens = parseCsvLine(line, delimiter);
    if (tokens.length < 2) continue;

    let name = '';
    let brand = '';
    let priceRaw = '';
    let oemCode = '';
    let stockNum: number | undefined;

    // Use detected column indices if headers were found
    if (nameColIdx !== -1 && nameColIdx < tokens.length) {
      name = normalizePersianText(tokens[nameColIdx]);
      if (brandColIdx !== -1 && brandColIdx < tokens.length) {
        brand = normalizePersianText(tokens[brandColIdx]);
      }
      if (priceColIdx !== -1 && priceColIdx < tokens.length) {
        priceRaw = tokens[priceColIdx];
      }
      if (oemColIdx !== -1 && oemColIdx < tokens.length) {
        oemCode = tokens[oemColIdx];
      }
      if (stockColIdx !== -1 && stockColIdx < tokens.length) {
        const sStr = normalizeDigits(tokens[stockColIdx]).replace(/[^\d]/g, '');
        if (sStr) stockNum = parseInt(sStr, 10);
      }
    } else {
      // Fallback positional indexing
      if (tokens.length >= 4) {
        // [row/id, name, brand, price]
        name = normalizePersianText(tokens[1]);
        brand = normalizePersianText(tokens[2]);
        priceRaw = tokens[3];
      } else if (tokens.length === 3) {
        // [name, brand, price]
        name = normalizePersianText(tokens[0]);
        brand = normalizePersianText(tokens[1]);
        priceRaw = tokens[2];
      } else if (tokens.length === 2) {
        // [name, price]
        name = normalizePersianText(tokens[0]);
        priceRaw = tokens[1];
      }
    }

    if (!name) continue;

    // Clean and normalize price digits
    const priceDigitsOnly = normalizeDigits(priceRaw).replace(/[^\d]/g, '').trim();
    const numericPrice = parseInt(priceDigitsOnly, 10) || 0;

    const key = `${name}___${brand}`;
    if (existingMap.has(key)) {
      const oldProduct = existingMap.get(key)!;
      duplicateMatches.push({
        name,
        brand,
        oldPrice: oldProduct.price,
        newPrice: priceDigitsOnly,
        oldPriceNumeric: oldProduct.numericPrice,
        newPriceNumeric: numericPrice
      });
    } else {
      newProducts.push({
        id: nextId++,
        name,
        brand: brand || 'اصلی',
        price: priceDigitsOnly,
        numericPrice,
        oemCode: oemCode || undefined,
        stock: stockNum !== undefined ? stockNum : 0,
        lastUpdate: new Date().toLocaleDateString('fa-IR'),
        csvId: Date.now()
      });
    }
  }

  return {
    fileName,
    csvId: Date.now(),
    newProducts,
    duplicateMatches
  };
}

