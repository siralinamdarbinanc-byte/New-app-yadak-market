import React, { useState, useEffect, useMemo } from 'react';
import initialProductsData from './data/products.json';
import { Product, FilterState, BrandMarkupMap, CategoryMarkupMap, GoogleSheetsConfig, CurrencyMode, FontSizeSettings } from './types';
import { normalizePersianText, inferCategoryFromName, inferVehiclesFromName, calculateStoreAnalytics, formatPersianNumber } from './utils/pricing';
import { pushProductsToGoogleSheet, fetchAndProcessGoogleSheet } from './utils/googleSheets';
import { cleanSearchText, evaluateProductSearch } from './utils/search';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { ChevronDown, Package, Layers, Sparkles, PhoneCall, RefreshCw, AlertTriangle, Cloud } from 'lucide-react';

const BarcodeScannerModal = React.lazy(() => import('./components/BarcodeScannerModal').then((m) => ({ default: m.BarcodeScannerModal })));
const CsvImportModal = React.lazy(() => import('./components/CsvImportModal').then((m) => ({ default: m.CsvImportModal })));
const GoogleSheetsModal = React.lazy(() => import('./components/GoogleSheetsModal').then((m) => ({ default: m.GoogleSheetsModal })));
const PricingSettingsModal = React.lazy(() => import('./components/PricingSettingsModal').then((m) => ({ default: m.PricingSettingsModal })));
const AnalyticsModal = React.lazy(() => import('./components/AnalyticsModal').then((m) => ({ default: m.AnalyticsModal })));
const AddProductModal = React.lazy(() => import('./components/AddProductModal').then((m) => ({ default: m.AddProductModal })));
const SettingsToolsModal = React.lazy(() => import('./components/SettingsToolsModal').then((m) => ({ default: m.SettingsToolsModal })));
const LocationModal = React.lazy(() => import('./components/LocationModal').then((m) => ({ default: m.LocationModal })));


const ITEMS_PER_PAGE = 36;

export default function App() {
  // Load products from localStorage or use pre-parsed 3,636 items
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('yadak_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((p: Product) => ({
          ...p,
          stock: p.stock !== undefined ? p.stock : 0,
        }));
      } catch (e) {
        console.error('Failed to parse saved products', e);
      }
    }
    return (initialProductsData as Product[]).map((p) => ({
      ...p,
      stock: p.stock !== undefined ? p.stock : 0,
    }));
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
        const parsed = JSON.parse(saved);
        if (parsed.sheetUrl) return parsed;
      } catch (e) {}
    }
    return {
      sheetUrl: 'https://script.google.com/macros/s/AKfycbyVX6Ag_ed6kb0kyo5r9TJaSWKUTGXY4EExh0iNW85okhG_RMr2Xu7LYVXDIWyT8wKE/exec',
      autoSync: false,
      lastSync: null,
    };
  });

  // Font Size Customization State
  const [fontSizeSettings, setFontSizeSettings] = useState<FontSizeSettings>(() => {
    const saved = localStorage.getItem('yadak_font_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { titleSize: 'md', priceSize: 'lg', detailsSize: 'sm' };
  });

  useEffect(() => {
    localStorage.setItem('yadak_font_settings', JSON.stringify(fontSizeSettings));
  }, [fontSizeSettings]);

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

  // Modals & UI Layout State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [locationProduct, setLocationProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsToolsModalOpen, setIsSettingsToolsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Active filter badge count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.selectedBrand) count++;
    if (filters.selectedCategory) count++;
    if (filters.selectedVehicle) count++;
    if (filters.onlyLowStock) count++;
    if (filters.sortOrder !== 'NAME_ASC') count++;
    return count;
  }, [filters]);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Reset pagination when filter criteria change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters]);

  // Sync state changes to localStorage with debouncing & quota handling
  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        localStorage.setItem('yadak_products', JSON.stringify(products));
      } catch (e) {
        console.warn('localStorage storage limit reached for products', e);
      }
    }, 500);
    return () => clearTimeout(handler);
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

  // Pending changes queue for Google Sheets sync
  const [pendingChanges, setPendingChanges] = useState<Product[]>(() => {
    const saved = localStorage.getItem('yadak_pending_sheet_changes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('yadak_pending_sheet_changes', JSON.stringify(pendingChanges));
    } catch (e) {
      console.warn('localStorage storage limit reached for pending changes', e);
    }
  }, [pendingChanges]);

  const trackPendingChanges = (modifiedItems: Product[]) => {
    if (!modifiedItems || modifiedItems.length === 0) return;
    setPendingChanges((prev) => {
      const map = new Map<string | number, Product>();
      // Preserve existing pending items
      prev.forEach((p) => map.set(p.id, p));
      // Overwrite/add newly updated items
      modifiedItems.forEach((p) => map.set(p.id, p));
      return Array.from(map.values());
    });
  };

  const handleClearPendingChanges = () => {
    setPendingChanges([]);
    localStorage.removeItem('yadak_pending_sheet_changes');
  };

  // Toast message for background auto sync actions
  const [autoSyncToast, setAutoSyncToast] = useState<string | null>(null);

  // Auto-Push pending changes to Google Sheets when autoSync is enabled
  useEffect(() => {
    if (!sheetsConfig.autoSync || !sheetsConfig.sheetUrl || pendingChanges.length === 0) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await pushProductsToGoogleSheet(sheetsConfig.sheetUrl, pendingChanges);
        if (res) {
          handleClearPendingChanges();
          const syncTime = new Date().toLocaleTimeString('fa-IR') + ' - ' + new Date().toLocaleDateString('fa-IR');
          setSheetsConfig((prev) => ({
            ...prev,
            lastSync: syncTime,
          }));
          setAutoSyncToast(`ارسال خودکار: ${formatPersianNumber(pendingChanges.length)} تغییر جدید به گوگل شیت منتقل شد.`);
          setTimeout(() => setAutoSyncToast(null), 4000);
        }
      } catch (err) {
        console.warn('ارسال خودکار به گوگل شیت با خطا مواجه شد:', err);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [pendingChanges, sheetsConfig.autoSync, sheetsConfig.sheetUrl]);

  // Auto-Pull changes from Google Sheets every 60 seconds (1 minute)
  useEffect(() => {
    if (!sheetsConfig.autoSync || !sheetsConfig.sheetUrl) {
      return;
    }

    const performAutoPull = async () => {
      try {
        const preview = await fetchAndProcessGoogleSheet(sheetsConfig.sheetUrl, products);
        const modifiedDuplicates = preview.duplicateMatches.filter((m) => m.hasChanges && !m.isStale);

        if (preview.newProducts.length > 0 || modifiedDuplicates.length > 0) {
          handleImportCsv(preview.newProducts, modifiedDuplicates, true);
          const syncTime = new Date().toLocaleTimeString('fa-IR') + ' - ' + new Date().toLocaleDateString('fa-IR');
          setSheetsConfig((prev) => ({
            ...prev,
            lastSync: syncTime,
          }));

          const count = preview.newProducts.length + modifiedDuplicates.length;
          setAutoSyncToast(`دریافت خودکار: ${formatPersianNumber(count)} به‌روزرسانی جدید از گوگل شیت اعمال شد.`);
          setTimeout(() => setAutoSyncToast(null), 4000);
        } else {
          const syncTime = new Date().toLocaleTimeString('fa-IR') + ' - ' + new Date().toLocaleDateString('fa-IR');
          setSheetsConfig((prev) => ({
            ...prev,
            lastSync: syncTime,
          }));
        }
      } catch (err) {
        console.warn('دریافت خودکار از گوگل شیت با خطا مواجه شد:', err);
      }
    };

    // Run interval every 60 seconds (60,000 ms)
    const interval = setInterval(performAutoPull, 60000);

    return () => clearInterval(interval);
  }, [sheetsConfig.autoSync, sheetsConfig.sheetUrl, products]);

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

  // Filter & Sort products with high performance & smart multi-token search
  const filteredProducts = useMemo(() => {
    const rawQuery = cleanSearchText(filters.query);
    const queryTokens = rawQuery ? rawQuery.split(/\s+/).filter(Boolean) : [];

    const matchesList: { product: Product; searchScore: number }[] = [];

    for (const p of products) {
      // Vehicle filter
      if (filters.selectedVehicle) {
        const vehs = p.vehicles && p.vehicles.length > 0 ? p.vehicles : inferVehiclesFromName(p.name);
        if (!vehs.includes(filters.selectedVehicle)) {
          continue;
        }
      }

      // Brand filter
      if (filters.selectedBrand && p.brand !== filters.selectedBrand) {
        continue;
      }

      // Category filter
      const category = p.category || inferCategoryFromName(p.name);
      if (filters.selectedCategory && category !== filters.selectedCategory) {
        continue;
      }

      // Low stock filter
      if (filters.onlyLowStock) {
        const stock = p.stock !== undefined ? p.stock : 10;
        const minStock = p.minStock !== undefined ? p.minStock : 3;
        if (stock > minStock) continue;
      }

      // Smart Query search matching
      if (queryTokens.length > 0) {
        const { matches, score } = evaluateProductSearch(p, queryTokens);
        if (!matches) continue;
        matchesList.push({ product: p, searchScore: score });
      } else {
        matchesList.push({ product: p, searchScore: 0 });
      }
    }

    // Sort matching products
    matchesList.sort((a, b) => {
      // If user searched with a query and default sort order is active, sort by relevance score
      if (queryTokens.length > 0 && filters.sortOrder === 'NAME_ASC') {
        if (b.searchScore !== a.searchScore) {
          return b.searchScore - a.searchScore; // Highest relevance score first
        }
      }

      if (filters.sortOrder === 'PRICE_ASC') {
        return a.product.numericPrice - b.product.numericPrice;
      }
      if (filters.sortOrder === 'PRICE_DESC') {
        return b.product.numericPrice - a.product.numericPrice;
      }
      if (filters.sortOrder === 'STOCK_ASC') {
        const stockA = a.product.stock !== undefined ? a.product.stock : 10;
        const stockB = b.product.stock !== undefined ? b.product.stock : 10;
        return stockA - stockB;
      }
      if (filters.sortOrder === 'STOCK_DESC') {
        const stockA = a.product.stock !== undefined ? a.product.stock : 10;
        const stockB = b.product.stock !== undefined ? b.product.stock : 10;
        return stockB - stockA;
      }

      // Default NAME_ASC
      return a.product.name.localeCompare(b.product.name, 'fa');
    });

    return matchesList.map((m) => m.product);
  }, [products, filters]);

  // Products to render based on pagination limit
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Handlers for product edits/deletions/stock updates
  const handleSaveProduct = (updated: Product) => {
    const withTimestamp = { ...updated, updatedAt: Date.now(), lastUpdate: new Date().toLocaleDateString('fa-IR') };
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? withTimestamp : p)));
    setSelectedProduct(withTimestamp);
    trackPendingChanges([withTimestamp]);
  };

  const handleUpdateStock = (id: number, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, stock: newStock, updatedAt: Date.now(), lastUpdate: new Date().toLocaleDateString('fa-IR') };
          trackPendingChanges([updated]);
          return updated;
        }
        return p;
      })
    );
  };

  const handleUpdateLocation = (id: number, newLocation: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, location: newLocation, updatedAt: Date.now(), lastUpdate: new Date().toLocaleDateString('fa-IR') };
          trackPendingChanges([updated]);
          return updated;
        }
        return p;
      })
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
    const withTimestamp = { ...newProduct, updatedAt: Date.now(), lastUpdate: new Date().toLocaleDateString('fa-IR') };
    setProducts((prev) => [withTimestamp, ...prev]);
    trackPendingChanges([withTimestamp]);
  };

  const handleImportCsv = (newProducts: Product[], duplicatesToUpdate: any[], isFromAutoPull: boolean = false) => {
    let updatedList = [...products];
    const modifiedForTracking: Product[] = [];

    // Update duplicates if requested
    if (duplicatesToUpdate && duplicatesToUpdate.length > 0) {
      const dupeMap = new Map<string, any>();
      duplicatesToUpdate.forEach((d) => {
        dupeMap.set(`${d.name}_${d.brand}`, d);
      });

      updatedList = updatedList.map((p) => {
        const key = `${p.name}_${p.brand}`;
        if (dupeMap.has(key)) {
          const d = dupeMap.get(key);
          const newNumeric = d.newPriceNumeric !== undefined ? d.newPriceNumeric : (typeof d === 'number' ? d : p.numericPrice);
          const newLoc = d.newProduct?.location || p.location;
          const newStock = d.newProduct?.stock !== undefined ? d.newProduct.stock : p.stock;
          const newOem = d.newProduct?.oemCode || p.oemCode;
          const newBarcode = d.newProduct?.barcode || d.newProduct?.oemCode || p.barcode;
          const incomingTs = d.newProduct?.updatedAt || Date.now();
          const updatedProd = {
            ...p,
            numericPrice: newNumeric,
            price: String(newNumeric),
            location: newLoc,
            stock: newStock,
            oemCode: newOem,
            barcode: newBarcode,
            updatedAt: incomingTs,
            lastUpdate: d.newProduct?.lastUpdate || new Date().toLocaleDateString('fa-IR'),
          };
          modifiedForTracking.push(updatedProd);
          return updatedProd;
        }
        return p;
      });
    }

    // Append new products
    if (newProducts && newProducts.length > 0) {
      const newProductsWithTs = newProducts.map((np) => ({
        ...np,
        updatedAt: np.updatedAt || Date.now(),
        lastUpdate: np.lastUpdate || new Date().toLocaleDateString('fa-IR'),
      }));
      updatedList = [...newProductsWithTs, ...updatedList];
      modifiedForTracking.push(...newProductsWithTs);
    }

    setProducts(updatedList);
    if (!isFromAutoPull) {
      trackPendingChanges(modifiedForTracking);
    }
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
      
      {/* Ultra-Compact Sticky Header & Filter Bar */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 shadow-2xl">
        <Header
          totalCount={products.length}
          filteredCount={filteredProducts.length}
          currencyMode={currencyMode}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onOpenSettingsToolsModal={() => setIsSettingsToolsModalOpen(true)}
          isFilterOpen={isFilterOpen}
          onToggleFilter={() => setIsFilterOpen((prev) => !prev)}
          activeFilterCount={activeFilterCount}
          searchQuery={filters.query}
          onSearchQueryChange={(query) => {
            setFilters((prev) => ({ ...prev, query }));
            setVisibleCount(ITEMS_PER_PAGE);
          }}
        />

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <SearchBar
            isFilterOpen={isFilterOpen}
            filters={filters}
            onChange={(newFilters) => {
              setFilters(newFilters);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
            brands={uniqueBrands}
            categories={uniqueCategories}
            vehicles={uniqueVehicles}
            totalResults={filteredProducts.length}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

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
                  fontSizeSettings={fontSizeSettings}
                  onSelect={(p) => setSelectedProduct(p)}
                  onEdit={(p) => setSelectedProduct(p)}
                  onDelete={handleDeleteProduct}
                  onUpdateStock={handleUpdateStock}
                  onOpenLocationModal={(p) => setLocationProduct(p)}
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

      <React.Suspense fallback={null}>
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
          onRestoreBackup={(backupProducts) => setProducts(backupProducts)}
        />

        <GoogleSheetsModal
          isOpen={isSheetsModalOpen}
          onClose={() => setIsSheetsModalOpen(false)}
          config={sheetsConfig}
          onSaveConfig={(cfg) => setSheetsConfig(cfg)}
          existingProducts={products}
          pendingChanges={pendingChanges}
          onClearPendingChanges={handleClearPendingChanges}
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
          onResetAllStock={() => {
            setProducts((prev) => prev.map((p) => ({ ...p, stock: 0 })));
          }}
        />

        <AddProductModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddProduct}
          brands={uniqueBrands}
          categories={uniqueCategories}
        />

        <SettingsToolsModal
          isOpen={isSettingsToolsModalOpen}
          onClose={() => setIsSettingsToolsModalOpen(false)}
          currencyMode={currencyMode}
          onToggleCurrency={handleToggleCurrency}
          fontSizeSettings={fontSizeSettings}
          onUpdateFontSizeSettings={setFontSizeSettings}
          onOpenCsvModal={() => setIsCsvModalOpen(true)}
          onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
          onOpenPricingModal={() => setIsPricingModalOpen(true)}
          onOpenAnalyticsModal={() => setIsAnalyticsModalOpen(true)}
          generalMarkup={generalMarkup}
          lowStockCount={analytics.lowStockCount}
          totalProductsCount={products.length}
        />

        <LocationModal
          product={locationProduct}
          isOpen={!!locationProduct}
          onClose={() => setLocationProduct(null)}
          onSaveLocation={handleUpdateLocation}
        />
      </React.Suspense>

      {/* Floating Auto-Sync Toast Notification */}
      {autoSyncToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl shadow-emerald-950/60 flex items-center gap-3 text-xs animate-fade-in">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-bold">{autoSyncToast}</span>
        </div>
      )}

    </div>
  );
}

