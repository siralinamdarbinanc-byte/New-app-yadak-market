export interface Product {
  id: number;
  row?: number;
  name: string;
  brand: string;
  price: string;
  numericPrice: number; // Purchase price in Rials
  oemCode?: string;
  barcode?: string | null;
  category?: string;
  vehicles?: string[]; // Compatible vehicles e.g. ["پژو ۴۰۵", "سمند"]
  stock?: number;
  minStock?: number;
  location?: string; // Shelf/Aisle in warehouse e.g. "قفسه B-04"
  lastUpdate?: string; // e.g. "۱۴۰۳/۰۵/۰۲"
  description?: string;
  csvId?: number;
}

export interface PriceResult {
  buyPrice: number; // in Rials
  sellPrice: number; // in Rials
  profit: number; // in Rials
  markupPercent: number;
}

export type SortOrder = 'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_ASC' | 'STOCK_DESC';

export interface FilterState {
  query: string;
  selectedBrand: string;
  selectedCategory: string;
  selectedVehicle: string;
  onlyLowStock: boolean;
  sortOrder: SortOrder;
  minPrice: number | null;
  maxPrice: number | null;
}

export interface DuplicateMatch {
  name: string;
  brand: string;
  oldPrice: string;
  newPrice: string;
  oldPriceNumeric: number;
  newPriceNumeric: number;
}

export interface CsvPreview {
  fileName: string;
  csvId: number;
  newProducts: Product[];
  duplicateMatches: DuplicateMatch[];
}

export interface CsvFileRecord {
  id: number;
  fileName: string;
  importedAt: number;
  productCount: number;
}

export interface BrandMarkupMap {
  [brandName: string]: number;
}

export interface CategoryMarkupMap {
  [categoryName: string]: number;
}

export interface GoogleSheetsConfig {
  sheetUrl: string;
  autoSync: boolean;
  lastSync: string | null;
  sheetName?: string;
}

export interface StoreAnalytics {
  totalProductsCount: number;
  totalStockCount: number;
  totalPurchaseValuation: number; // in Rials
  totalSalesValuation: number; // in Rials
  totalPotentialProfit: number; // in Rials
  lowStockCount: number;
  categoriesCount: number;
  brandsCount: number;
}

export type CurrencyMode = 'RIAL' | 'TOMAN';

