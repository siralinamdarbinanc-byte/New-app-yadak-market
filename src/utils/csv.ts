import { Product, DuplicateMatch, CsvPreview } from '../types';
import { normalizePersianText } from './pricing';

/**
 * Parses a CSV string and detects duplicate products with existing list
 */
export function processCsvUpload(
  csvContent: string,
  fileName: string,
  existingProducts: Product[]
): CsvPreview {
  const lines = csvContent.split(/\r?\n/);
  const newProducts: Product[] = [];
  const duplicateMatches: DuplicateMatch[] = [];

  const existingMap = new Map<string, Product>();
  existingProducts.forEach((p) => {
    const key = `${normalizePersianText(p.name)}___${normalizePersianText(p.brand)}`;
    existingMap.set(key, p);
  });

  let nextId = Math.max(0, ...existingProducts.map((p) => p.id || 0)) + 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip header row if present
    if (i === 0 && (line.includes('نام') || line.includes('Name') || line.includes('قیمت'))) {
      continue;
    }

    const tokens = parseCsvLine(line);
    if (tokens.length >= 3) {
      let name = '';
      let brand = '';
      let priceRaw = '';

      if (tokens.length >= 4) {
        // [id/row, name, brand, price]
        name = normalizePersianText(tokens[1]);
        brand = normalizePersianText(tokens[2]);
        priceRaw = tokens[3];
      } else {
        // [name, brand, price]
        name = normalizePersianText(tokens[0]);
        brand = normalizePersianText(tokens[1]);
        priceRaw = tokens[2];
      }

      if (!name) continue;

      const cleanPriceStr = priceRaw.replace(/["',]/g, '').trim();
      const numericPrice = parseInt(cleanPriceStr, 10) || 0;

      const key = `${name}___${brand}`;
      if (existingMap.has(key)) {
        const oldProduct = existingMap.get(key)!;
        duplicateMatches.push({
          name,
          brand,
          oldPrice: oldProduct.price,
          newPrice: cleanPriceStr,
          oldPriceNumeric: oldProduct.numericPrice,
          newPriceNumeric: numericPrice
        });
      } else {
        newProducts.push({
          id: nextId++,
          name,
          brand,
          price: cleanPriceStr,
          numericPrice,
          csvId: Date.now()
        });
      }
    }
  }

  return {
    fileName,
    csvId: Date.now(),
    newProducts,
    duplicateMatches
  };
}

function parseCsvLine(line: string): string[] {
  const tokens: string[] = [];
  let currentToken = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      tokens.push(currentToken.trim());
      currentToken = '';
    } else {
      currentToken += char;
    }
  }
  tokens.push(currentToken.trim());
  return tokens;
}
