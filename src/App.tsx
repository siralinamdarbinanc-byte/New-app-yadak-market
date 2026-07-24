import React, { useState, useEffect, useMemo } from 'react';
import initialProductsData from './data/products.json';
import { Product, FilterState, BrandMarkupMap, CategoryMarkupMap, GoogleSheetsConfig, CurrencyMode } from './types';
import { normalizePersianText, inferCategoryFromName, inferVehiclesFromName, calculateStoreAnalytics } from './utils/pricing';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { CsvImportModal } from './components/CsvImportModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { PricingSettingsModal } from './components/PricingSettingsModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { AddProductModal } from './components/AddProductModal';
import { ChevronDown, Package, Layers, Sparkles, PhoneCall, RefreshCw, AlertTriangle, Cloud } from 'lucide-react';

const ITEMS_PER_PAGE = 36;

export default function App() {
  // Load products from localStorage or use pre-parsed 3,636 items
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('yadak_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved products', e);
      }
    }
    return initialProductsData as Product[];
  });

  // Profit markup settings
  const [generalMarkup, setGeneralMarkup] = useState<number>(() => {
    const saved = localStorage.getItem('yadak_general_markup');
    return saved ? parseInt(saved, 10) : 20; // Default 20%
  });

  const [brandMarkupMap, setBrandMarkupMap] = useState<BrandMarkupMap>(() => {
    const saved = localStorage.getItem('yadak_brand_markup');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  const [categoryMarkupMap, setCategoryMarkupMap] = useState<CategoryMarkupMap>(() => {
    const saved = localStorage.getItem('yadak_category_markup');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  });

  // Currency mode (Rial or Toman)
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>(() => {
    const saved = localStorage.getItem('yadak_currency_mode');
    return (saved as CurrencyMode) || 'RIAL';
  });

  // Google Sheets Config
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem('yadak_sheets_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { sheetUrl: '', autoSync: false, lastSync: null };
  });

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    query: '',
    selectedBrand: '',
    selectedCategory: '',
    selectedVehicle: '',
    onlyLowStock: false,
    sortOrder: 'NAME_ASC',
    minPrice: null,
    maxPrice: null,
  });

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('yadak_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('yadak_general_markup', String(generalMarkup));
  }, [generalMarkup]);

  useEffect(() => {
    localStorage.setItem('yadak_brand_markup', JSON.stringify(brandMarkupMap));
  }, [brandMarkupMap]);

  useEffect(() => {
    localStorage.setItem('yadak_category_markup', JSON.stringify(categoryMarkupMap));
  }, [categoryMarkupMap]);

  useEffect(() => {
    localStorage.setItem('yadak_currency_mode', currencyMode);
  }, [currencyMode]);

  useEffect(() => {
    localStorage.setItem('yadak_sheets_config', JSON.stringify(sheetsConfig));
  }, [sheetsConfig]);

  // Extract unique categories list
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = p.category || inferCategoryFromName(p.name);
      if (cat) set.add(cat);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [products]);

  // Extract unique brands list
  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand && p.brand.trim()) {
        set.add(p.brand.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [products]);

  // Extract unique vehicles list
  const uniqueVehicles = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const vehs = p.vehicles && p.vehicles.length > 0 ? p.vehicles : inferVehiclesFromName(p.name);
      vehs.forEach((v) => set.add(v));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fa'));
  }, [products]);

  // Store Analytics Summary
  const analytics = useMemo(() => {
    return calculateStoreAnalytics(products, generalMarkup, brandMarkupMap, categoryMarkupMap);
  }, [products, generalMarkup, brandMarkupMap, categoryMarkupMap]);

  // Filter & Sort products with high performance
  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizePersianText(filters.query);

    return products
      .filter((p) => {
        // Brand filter
        if (filters.selectedBrand && p.brand !== filters.selectedBrand) {
          return false;
        }

        // Category filter
        const category = p.category || inferCategoryFromName(p.name);
        if (filters.selectedCategory && category !== filters.selectedCategory) {
          return false;
        }

        // Low stock filter
        if (filters.onlyLowStock) {
          const stock = p.stock !== undefined ? p.stock : 10;
          const minStock = p.minStock !== undefined ? p.minStock : 3;
          if (stock > minStock) return false;
        }

        // Query search matching name, brand, oemCode, barcode, vehicle or id
        if (normalizedQuery) {
          const normName = normalizePersianText(p.name);
          const normBrand = normalizePersianText(p.brand);
          const normOem = normalizePersianText(p.oemCode || '');
          const normBarcode = normalizePersianText(p.barcode || '');
          const idStr = String(p.id || '');
          const vehiclesStr = normalizePersianText((p.vehicles || inferVehiclesFromName(p.name)).join(' '));

          const matches =
            normName.includes(normalizedQuery) ||
            normBrand.includes(normalizedQuery) ||
            normOem.includes(normalizedQuery) ||
            normBarcode.includes(normalizedQuery) ||
            vehiclesStr.includes(normalizedQuery) ||
            idStr === normalizedQuery;

          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortOrder === 'PRICE_ASC') {
          return a.numericPrice - b.numericPrice;
        }
        if (filters.sortOrder === 'PRICE_DESC') {
          return b.numericPrice - a.numericPrice;
        }
        if (filters.sortOrder === 'STOCK_ASC') {
          const stockA = a.stock !== undefined ? a.stock : 10;
          const stockB = b.stock !== undefined ? b.stock : 10;
          return stockA - stockB;
        }
        if (filters.sortOrder === 'STOCK_DESC') {
          const stockA = a.stock !== undefined ? a.stock : 10;
          const stockB = b.stock !== undefined ? b.stock : 10;
          return stockB - stockA;
        }
        // Default NAME_ASC
        return a.name.localeCompare(b.name, 'fa');
      });
  }, [products, filters]);

  // Products to render based on pagination limit
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Handlers for product edits/deletions/stock updates
  const handleSaveProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProduct(updated);
  };

  const handleUpdateStock = (id: number, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, stock: newStock, lastUpdate: new Date().toLocaleDateString('fa-IR') } : p
      )
    );
  };

  const handleDeleteProduct = (id: number) => {
    if (window.confirm('آیا از حذف این قطعه از انبار مطمئن هستید؟')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (selectedProduct?.id === id) {
        setSelectedProduct(null);
      }
    }
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleImportCsv = (newProducts: Product[], duplicatesToUpdate: any[]) => {
    let updatedList = [...products];

    // Update duplicates if requested
    if (duplicatesToUpdate && duplicatesToUpdate.length > 0) {
      const dupeMap = new Map();
      duplicatesToUpdate.forEach((d) => {
        dupeMap.set(`${d.name}_${d.brand}`, d.newPriceNumeric);
      });

      updatedList = updatedList.map((p) => {
        const key = `${p.name}_${p.brand}`;
        if (dupeMap.has(key)) {
          const newNumeric = dupeMap.get(key);
          return {
            ...p,
            numericPrice: newNumeric,
            price: String(newNumeric),
            lastUpdate: new Date().toLocaleDateString('fa-IR'),
          };
        }
        return p;
      });
    }

    // Append new products
    if (newProducts && newProducts.length > 0) {
      updatedList = [...newProducts, ...updatedList];
    }

    setProducts(updatedList);
  };

  const handleBarcodeDetected = (code: string) => {
    setFilters((prev) => ({ ...prev, query: code }));
    setIsScannerOpen(false);
  };

  const handleToggleCurrency = () => {
    setCurrencyMode((prev) => (prev === 'RIAL' ? 'TOMAN' : 'RIAL'));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white antialiased">
      
      {/* Header */}
      <Header
        totalCount={products.length}
        filteredCount={filteredProducts.length}
        lowStockCount={analytics.lowStockCount}
        currencyMode={currencyMode}
        onToggleCurrency={handleToggleCurrency}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenPricingModal={() => setIsPricingModalOpen(true)}
        onOpenAnalyticsModal={() => setIsAnalyticsModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        generalMarkup={generalMarkup}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Search & Filter Toolbar */}
        <SearchBar
          filters={filters}
          onChange={(newFilters) => {
            setFilters(newFilters);
            setVisibleCount(ITEMS_PER_PAGE); // Reset pagination on filter change
          }}
          brands={uniqueBrands}
          categories={uniqueCategories}
          vehicles={uniqueVehicles}
          totalResults={filteredProducts.length}
        />

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center my-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-1">هیچ قطعه‌ای با این مشخصات پیدا نشد</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              عبارت دیگری جستجو کنید یا فیلترهای اعمال‌شده بر اساس برند و دسته را بازنشانی کنید.
            </p>
            <button
              onClick={() => {
                setFilters({
                  query: '',
                  selectedBrand: '',
                  selectedCategory: '',
                  selectedVehicle: '',
                  onlyLowStock: false,
                  sortOrder: 'NAME_ASC',
                  minPrice: null,
                  maxPrice: null,
                });
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/20"
            >
              پاکسازی همه فیلترها
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  generalMarkup={generalMarkup}
                  brandMarkupMap={brandMarkupMap}
                  categoryMarkupMap={categoryMarkupMap}
                  currencyMode={currencyMode}
                  onSelect={(p) => setSelectedProduct(p)}
                  onEdit={(p) => setSelectedProduct(p)}
                  onDelete={handleDeleteProduct}
                  onUpdateStock={handleUpdateStock}
                />
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < filteredProducts.length && (
              <div className="text-center my-10">
                <button
                  onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                  className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2 shadow-lg"
                >
                  <ChevronDown className="w-4 h-4 text-purple-400" />
                  <span>
                    نمایش قطعات بیشتر ({(filteredProducts.length - visibleCount).toLocaleString('fa-IR')} مورد باقیمانده)
                  </span>
                </button>
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-400">سامانه استعلام قیمت و انبارداری فروشگاه قطعات خودرو Yadak Market (فروشگاه زینلی)</p>
          <p className="text-[11px] text-slate-600">پشتیبانی از بیش از ۵۰,۰۰۰ کالا، فرمول‌های پیشرفته درصد سود، اسکن بارکد، گوگل شیت و فایل CSV</p>
        </div>
      </footer>

      {/* Modals */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        generalMarkup={generalMarkup}
        brandMarkupMap={brandMarkupMap}
        categoryMarkupMap={categoryMarkupMap}
        currencyMode={currencyMode}
        onSave={handleSaveProduct}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleBarcodeDetected}
      />

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        existingProducts={products}
        onImport={handleImportCsv}
      />

      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        config={sheetsConfig}
        onSaveConfig={(cfg) => setSheetsConfig(cfg)}
        existingProducts={products}
        onApplySync={handleImportCsv}
      />

      <PricingSettingsModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        generalMarkup={generalMarkup}
        brandMarkupMap={brandMarkupMap}
        categoryMarkupMap={categoryMarkupMap}
        onSave={(newGeneral, newBrandMap, newCategoryMap) => {
          setGeneralMarkup(newGeneral);
          setBrandMarkupMap(newBrandMap);
          setCategoryMarkupMap(newCategoryMap);
        }}
        brands={uniqueBrands}
        categories={uniqueCategories}
      />

      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        analytics={analytics}
        products={products}
        currencyMode={currencyMode}
        onToggleCurrency={handleToggleCurrency}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddProduct}
        brands={uniqueBrands}
        categories={uniqueCategories}
      />

    </div>
  );
}
