import { Product } from '../types';
import { normalizePersianText, inferCategoryFromName, inferVehiclesFromName } from './pricing';

/**
 * Pre-processes text for indexing/searching:
 * - Normalizes Persian & Arabic letters (ي->ی, ك->ک, ة->ه)
 * - Converts all numbers (Persian, Arabic) to English digits
 * - Lowercases English characters
 * - Cleans punctuation & special characters into spaces
 */
export function cleanSearchText(text: string): string {
  if (!text) return '';
  const normalized = normalizePersianText(text).toLowerCase();
  return normalized
    .replace(/[\\/_\-.,()[\]{}|:;!?"'«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SearchMatchResult {
  matches: boolean;
  score: number;
}

/**
 * Evaluates whether a product matches ALL query tokens (AND search)
 * and calculates a relevance score for smart sorting.
 */
export function evaluateProductSearch(product: Product, queryTokens: string[]): SearchMatchResult {
  if (!queryTokens || queryTokens.length === 0) {
    return { matches: true, score: 0 };
  }

  const normName = cleanSearchText(product.name);
  const normBrand = cleanSearchText(product.brand);
  const normOem = cleanSearchText(product.oemCode || '');
  const normBarcode = cleanSearchText(product.barcode || '');
  const idStr = String(product.id || '');
  const categoryStr = cleanSearchText(product.category || inferCategoryFromName(product.name));
  const vehiclesStr = cleanSearchText((product.vehicles || inferVehiclesFromName(product.name)).join(' '));
  const descStr = cleanSearchText(product.description || '');

  const fullCombinedText = `${normName} ${normBrand} ${normOem} ${normBarcode} ${idStr} ${categoryStr} ${vehiclesStr} ${descStr}`;

  let totalScore = 0;

  for (const token of queryTokens) {
    if (!token) continue;

    let tokenMatched = false;
    let tokenScore = 0;

    // 1. Exact or partial OEM code / Barcode / ID match (Highest Priority)
    if (normOem) {
      if (normOem === token) {
        tokenMatched = true;
        tokenScore += 400;
      } else if (normOem.includes(token)) {
        tokenMatched = true;
        tokenScore += 200;
      }
    }

    if (normBarcode) {
      if (normBarcode === token) {
        tokenMatched = true;
        tokenScore += 400;
      } else if (normBarcode.includes(token)) {
        tokenMatched = true;
        tokenScore += 200;
      }
    }

    if (idStr === token) {
      tokenMatched = true;
      tokenScore += 500;
    }

    // 2. Product Name match
    if (normName.includes(token)) {
      tokenMatched = true;
      if (normName.startsWith(token)) {
        tokenScore += 120;
      } else {
        tokenScore += 70;
      }
    }

    // 3. Brand match
    if (normBrand.includes(token)) {
      tokenMatched = true;
      tokenScore += normBrand === token ? 90 : 45;
    }

    // 4. Vehicles match
    if (vehiclesStr.includes(token)) {
      tokenMatched = true;
      tokenScore += 35;
    }

    // 5. Category match
    if (categoryStr.includes(token)) {
      tokenMatched = true;
      tokenScore += 25;
    }

    // 6. Description match
    if (descStr.includes(token)) {
      tokenMatched = true;
      tokenScore += 15;
    }

    // Fallback: match anywhere in combined text
    if (!tokenMatched && fullCombinedText.includes(token)) {
      tokenMatched = true;
      tokenScore += 20;
    }

    if (!tokenMatched) {
      // All tokens must match. If any token is missing, product is filtered out.
      return { matches: false, score: 0 };
    }

    totalScore += tokenScore;
  }

  // Extra bonus if the complete raw query phrase appears intact in name or OEM
  const rawQuery = queryTokens.join(' ');
  if (normName.includes(rawQuery)) totalScore += 150;
  if (normOem.includes(rawQuery)) totalScore += 250;

  return { matches: true, score: totalScore };
}
