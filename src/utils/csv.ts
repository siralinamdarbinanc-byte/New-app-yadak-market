import { Product, DuplicateMatch, CsvPreview } from '../types';
import { normalizePersianText, normalizeDigits } from './pricing';

function detectDelimiter(content: string): string {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 10);
  if (lines.length === 0) return ',';
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };
  lines.forEach((line) => {
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (!inQuotes && char in counts) counts[char]++;
    }
  });
  let maxDelim = ',';
  let maxCount = -1;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > maxCount) { maxCount = count; maxDelim = delim; }
  }
  return maxCount > 0 ? maxDelim : ',';
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const tokens: string[] = [];
  let currentToken = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === delimiter && !inQuotes) { tokens.push(currentToken.trim()); currentToken = ''; }
    else currentToken += char;
  }
  tokens.push(currentToken.trim());
  return tokens;
}

export function processCsvUpload(
  csvContent: string,
  fileName: string,
  existingProducts: Product[]
): CsvPreview {
  const delimiter = detectDelimiter(csvContent);
  const lines = csvContent.split(/\r?\n/);
  const newProducts: Product[] = [];
  const duplicateMatches: DuplicateMatch[] = [];

  const byBarcode = new Map<string, Product>();
  const byOem = new Map<string, Product>();
  const byNameBrand = new Map<string, Product>();

  existingProducts.forEach((p) => {
    if (p.barcode) byBarcode.set(String(p.barcode).trim(), p);
    if (p.oemCode) byOem.set(normalizePersianText(p.oemCode).trim(), p);
    byNameBrand.set(`${normalizePersianText(p.name)}___${normalizePersianText(p.brand)}`, p);
  });

  let nextId = existingProducts.reduce((max, p) => Math.max(max, p.id || 0), 0) + 1;

  let nameColIdx = -1, brandColIdx = -1, priceColIdx = -1, oemColIdx = -1, stockColIdx = -1;
  let barcodeColIdx = -1, categoryColIdx = -1, locationColIdx = -1, descColIdx = -1;
  let startRowIdx = 0;

  if (lines.length > 0) {
    const firstLineTokens = parseCsvLine(lines[0].trim(), delimiter);
    firstLineTokens.forEach((tok, idx) => {
      const normTok = normalizePersianText(tok).toLowerCase();
      if (barcodeColIdx === -1 && ['بارکد', 'barcode'].some((k) => normTok.includes(k))) barcodeColIdx = idx;
      else if (nameColIdx === -1 && ['نام', 'نام کالا', 'عنوان', 'قطعه', 'شرح', 'name', 'title'].some((k) => normTok.includes(k))) nameColIdx = idx;
      else if (brandColIdx === -1 && ['برند', 'سازنده', 'مارک', 'شرکت', 'brand', 'make'].some((k) => normTok.includes(k))) brandColIdx = idx;
      else if (priceColIdx === -1 && ['قیمت', 'مبلغ', 'فی', 'ریال', 'تومان', 'price', 'cost'].some((k) => normTok.includes(k)) && !normTok.includes('numeric')) priceColIdx = idx;
      else if (oemColIdx === -1 && ['کد فنی', 'پارت نامبر', 'شناسه', 'oemcode', 'oem', 'کد'].some((k) => normTok.includes(k))) oemColIdx = idx;
      else if (stockColIdx === -1 && ['موجودی', 'تعداد', 'انبار', 'stock', 'qty'].some((k) => normTok.includes(k))) stockColIdx = idx;
      else if (categoryColIdx === -1 && ['دسته', 'category'].some((k) => normTok.includes(k))) categoryColIdx = idx;
      else if (locationColIdx === -1 && ['محل', 'قفسه', 'location'].some((k) => normTok.includes(k))) locationColIdx = idx;
      else if (descColIdx === -1 && ['توضیح', 'description'].some((k) => normTok.includes(k))) descColIdx = idx;
    });
    if (nameColIdx !== -1 || priceColIdx !== -1) startRowIdx = 1;
  }

  for (let i = startRowIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const tokens = parseCsvLine(line, delimiter);
    if (tokens.length < 2) continue;

    let name = '', brand = '', priceRaw = '', oemCode = '', barcode = '', category = '', location = '', description = '';
    let stockNum: number | undefined;

    if (nameColIdx !== -1 && nameColIdx < tokens.length) {
      name = normalizePersianText(tokens[nameColIdx]);
      if (brandColIdx !== -1 && brandColIdx < tokens.length) brand = normalizePersianText(tokens[brandColIdx]);
      if (priceColIdx !== -1 && priceColIdx < tokens.length) priceRaw = tokens[priceColIdx];
      if (oemColIdx !== -1 && oemColIdx < tokens.length) oemCode = tokens[oemColIdx].trim();
      if (barcodeColIdx !== -1 && barcodeColIdx < tokens.length) barcode = tokens[barcodeColIdx].trim();
      if (categoryColIdx !== -1 && categoryColIdx < tokens.length) category = normalizePersianText(tokens[categoryColIdx]);
      if (locationColIdx !== -1 && locationColIdx < tokens.length) location = tokens[locationColIdx].trim();
      if (descColIdx !== -1 && descColIdx < tokens.length) description = tokens[descColIdx].trim();
      if (stockColIdx !== -1 && stockColIdx < tokens.length) {
        const sStr = normalizeDigits(tokens[stockColIdx]).replace(/[^\d]/g, '');
        if (sStr) stockNum = parseInt(sStr, 10);
      }
    } else {
      if (tokens.length >= 4) { name = normalizePersianText(tokens[1]); brand = normalizePersianText(tokens[2]); priceRaw = tokens[3]; }
      else if (tokens.length === 3) { name = normalizePersianText(tokens[0]); brand = normalizePersianText(tokens[1]); priceRaw = tokens[2]; }
      else if (tokens.length === 2) { name = normalizePersianText(tokens[0]); priceRaw = tokens[1]; }
    }

    if (!name) continue;

    const priceDigitsOnly = normalizeDigits(priceRaw).replace(/[^\d]/g, '').trim();
    const numericPrice = parseInt(priceDigitsOnly, 10) || 0;

    let existing: Product | undefined;
    if (barcode && byBarcode.has(barcode)) existing = byBarcode.get(barcode);
    else if (oemCode && byOem.has(normalizePersianText(oemCode))) existing = byOem.get(normalizePersianText(oemCode));
    else existing = byNameBrand.get(`${name}___${brand}`);

    if (existing) {
      const merged: Product = {
        ...existing,
        name: name || existing.name,
        brand: brand || existing.brand,
        price: priceDigitsOnly || existing.price,
        numericPrice: priceDigitsOnly ? numericPrice : existing.numericPrice,
        oemCode: oemCode || existing.oemCode,
        barcode: barcode || existing.barcode,
        category: category || existing.category,
        location: location || existing.location,
        description: description || existing.description,
        stock: stockNum !== undefined ? stockNum : existing.stock,
        lastUpdate: new Date().toLocaleDateString('fa-IR'),
      };

      duplicateMatches.push({
        name: merged.name,
        brand: merged.brand,
        oldPrice: existing.price,
        newPrice: merged.price,
        oldPriceNumeric: existing.numericPrice,
        newPriceNumeric: merged.numericPrice,
        updatedProduct: merged,
      } as DuplicateMatch);
    } else {
      newProducts.push({
        id: nextId++,
        name,
        brand: brand || 'اصلی',
        price: priceDigitsOnly,
        numericPrice,
        oemCode: oemCode || undefined,
        barcode: barcode || undefined,
        category: category || undefined,
        location: location || undefined,
        description: description || undefined,
        stock: stockNum !== undefined ? stockNum : 0,
        lastUpdate: new Date().toLocaleDateString('fa-IR'),
        csvId: Date.now()
      });
    }
  }

  return { fileName, csvId: Date.now(), newProducts, duplicateMatches };
}
