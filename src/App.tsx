import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Category, Product } from './types';
import {
  subscribeCategories,
  subscribeProducts,
  subscribeAllReviews,
  seedInitialStoreData,
} from './services/db';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrdersHistoryModal } from './components/OrdersHistoryModal';
import { WishlistModal } from './components/WishlistModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { STSAdminLogin } from './components/admin/STSAdminLogin';
import { NotFound404 } from './components/NotFound404';
import {
  SlidersHorizontal,
  Sparkles,
  ShoppingBag,
  Loader2,
  PackageX,
  PhoneCall,
  Mail,
  Heart,
  Globe,
  Share2,
} from 'lucide-react';

function Storefront() {
  const { settings } = useTheme();

  // Navigation & Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  // Data from Firestore
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviewsByProductId, setReviewsByProductId] = useState<Record<string, { rating: number; count: number }>>({});
  const [loading, setLoading] = useState(true);
  const [seedingLoading, setSeedingLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'name'>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

  const productsSectionRef = useRef<HTMLDivElement>(null);

  // Real-time Firestore subscriptions
  useEffect(() => {
    const unsubCat = subscribeCategories((cats) => {
      setCategories(cats);
    });

    const unsubProd = subscribeProducts((prods) => {
      setProducts(prods);
      setLoading(false);
    });

    const unsubRev = subscribeAllReviews((revs) => {
      const stats: Record<string, { totalRating: number; count: number }> = {};
      revs.forEach((r) => {
        if (!stats[r.productId]) {
          stats[r.productId] = { totalRating: 0, count: 0 };
        }
        stats[r.productId].totalRating += r.rating;
        stats[r.productId].count += 1;
      });
      const computed: Record<string, { rating: number; count: number }> = {};
      Object.keys(stats).forEach((pId) => {
        computed[pId] = {
          rating: Number((stats[pId].totalRating / stats[pId].count).toFixed(1)),
          count: stats[pId].count,
        };
      });
      setReviewsByProductId(computed);
    });

    return () => {
      unsubCat();
      unsubProd();
      unsubRev();
    };
  }, []);

  // Products enriched with live review statistics
  const enrichedProducts = useMemo(() => {
    return products.map((p) => {
      const reviewStat = reviewsByProductId[p.id];
      if (reviewStat) {
        return {
          ...p,
          rating: reviewStat.rating,
          reviewsCount: reviewStat.count,
        };
      }
      return p;
    });
  }, [products, reviewsByProductId]);

  // Seed store data into Firestore if catalog is empty
  const handleSeedCatalog = async () => {
    setSeedingLoading(true);
    try {
      await seedInitialStoreData();
    } catch (err) {
      console.error('Seeding error:', err);
    } finally {
      setSeedingLoading(false);
    }
  };

  // Products count by category (for active products only)
  const productsCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    enrichedProducts
      .filter((p) => p.is_active !== false)
      .forEach((p) => {
        if (p.categoryId) {
          counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
        }
      });
    return counts;
  }, [enrichedProducts]);

  // Filtered & Sorted products for customer storefront
  const filteredProducts = useMemo(() => {
    // Only active products on storefront
    let result = enrichedProducts.filter((p) => p.is_active !== false);

    // Filter by category
    if (selectedCategoryId) {
      result = result.filter(
        (p) =>
          p.categoryId === selectedCategoryId ||
          (p.category_ids && p.category_ids.includes(selectedCategoryId))
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q)
      );
    }

    // Filter in-stock only
    if (inStockOnly) {
      result = result.filter((p) => p.stockQuantity > 0);
    }

    // Sort
    if (sortBy === 'price_asc') {
      result.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    } else {
      result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    return result;
  }, [products, selectedCategoryId, searchQuery, inStockOnly, sortBy]);

  const scrollToProducts = () => {
    productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="min-h-screen flex flex-col text-slate-900 selection:bg-emerald-500 selection:text-white transition-colors"
      style={{ backgroundColor: 'var(--color-bg, #f8fafc)' }}
    >
      {/* Dynamic Header - Pure Customer Storefront */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenOrders={() => setIsOrdersModalOpen(true)}
        onOpenWishlist={() => setIsWishlistModalOpen(true)}
      />

      {/* Hero Banner */}
      <HeroBanner onExploreProducts={scrollToProducts} />

      {/* Dynamic Categories Bar */}
      <CategoryBar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(id) => {
          setSelectedCategoryId(id);
          scrollToProducts();
        }}
        productsCountByCategory={productsCountByCategory}
        totalProductsCount={enrichedProducts.filter((p) => p.is_active !== false).length}
      />

      {/* Main Products Section */}
      <main ref={productsSectionRef} className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Filters and Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {selectedCategoryId
                  ? categories.find((c) => c.id === selectedCategoryId)?.name || 'المنتجات'
                  : 'تصفح تشكيلة المنتجات'}
              </h2>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: 'var(--color-primary, #059669)' }}
              >
                {filteredProducts.length} منتج
              </span>
            </div>
            {searchQuery && (
              <p className="text-xs text-slate-500 mt-1">
                نتائج البحث عن: <span className="font-bold text-slate-800">"{searchQuery}"</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* In stock only toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="accent-emerald-600 rounded cursor-pointer"
              />
              <span>المتوفر بالمخزن فقط</span>
            </label>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">الترتيب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="featured">المميزة أولاً</option>
                <option value="price_asc">الأقل سعراً</option>
                <option value="price_desc">الأعلى سعراً</option>
                <option value="name">الأبجدية</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm font-semibold text-slate-600">
              جاري تحميل منتجات «{settings.store_name}»...
            </p>
          </div>
        ) : products.length === 0 ? (
          /* Empty Catalog Call-to-Action to Seed directly into Firestore */
          <div className="py-16 px-6 text-center max-w-lg mx-auto bg-white rounded-3xl border border-dashed border-slate-300 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              قاعدة بيانات المتجر جاهزة للتهيئة
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              تم ربط المتجر بنجاح بقاعدة البيانات. انقر الزر أدناه لإضافة منتجات وتصنيفات عربية
              فاخرة حقيقية (عطور، قهوة، إلكترونيات، ساعات) والبدء بالتسوق وإدارة المتجر فوراً!
            </p>
            <button
              onClick={handleSeedCatalog}
              disabled={seedingLoading}
              className="w-full py-3.5 px-6 rounded-2xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary, #059669)' }}
            >
              {seedingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري إضافة المنتجات إلى Firestore...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>تهيئة المتجر وإضافة المنتجات التجريبية الحقيقية</span>
                </>
              )}
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* No search or filter matches */
          <div className="py-16 text-center text-slate-400">
            <PackageX className="w-14 h-14 mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">لا توجد منتجات مطابقة</h3>
            <p className="text-xs text-slate-500 mb-4">جرب تغيير معايير البحث أو تصفية تصنيف آخر</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryId(null);
                setInStockOnly(false);
              }}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              إلغاء جميع عوامل التصفية
            </button>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={(prod) => setSelectedProductDetails(prod)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 mt-16 text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt={settings.store_name}
                    className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: 'var(--color-primary, #059669)' }}
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                )}
                <span className="text-xl font-black">{settings.store_name}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {settings.description ||
                  'منصة التجارة الإلكترونية العربية المتكاملة المصممة لتوفير تجربة تسوق سلسة وفاخرة مع إدارة فورية للمخزون ودعم كامل للغة العربية.'}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3">التصنيفات الرئيسية</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {categories.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        setSelectedCategoryId(c.id);
                        scrollToProducts();
                      }}
                      className="hover:text-emerald-400 transition-colors"
                    >
                      {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer service */}
            <div>
              <h4 className="text-sm font-bold text-white mb-3">خدمات العملاء</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>ضمان استرجاع مجاني خلال 14 يوماً</li>
                <li>شحن مجاني للطلبات فوق 250 ر.س</li>
                <li>دفع آمن بالبطاقات والدفع عند الاستلام</li>
                <li>خدمة عملاء ودعم استشارات التسوق</li>
              </ul>
            </div>

            {/* Contact & Social Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white mb-3">التواصل وخدمة العملاء</h4>
              <div className="space-y-2 text-xs text-slate-400">
                {settings.contact_phone && (
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{settings.contact_phone}</span>
                  </div>
                )}
                {settings.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{settings.contact_email}</span>
                  </div>
                )}
              </div>

              {/* Social icons if provided */}
              <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
                {settings.social_links?.twitter && (
                  <a
                    href={settings.social_links.twitter}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Twitter"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {settings.social_links?.instagram && (
                  <a
                    href={settings.social_links.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Instagram"
                  >
                    <Share2 className="w-4 h-4" />
                  </a>
                )}
                {settings.social_links?.whatsapp && (
                  <a
                    href={settings.social_links.whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="WhatsApp"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <p>
              {settings.footer_text ||
                `© ${new Date().getFullYear()} ${settings.store_name}. جميع الحقوق محفوظة.`}
            </p>
            <div className="flex items-center gap-1 text-slate-400">
              <span>صنع بكل فخر لدعم التجارة الإلكترونية العربية</span>
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
            </div>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ProductDetailsModal
        product={
          selectedProductDetails
            ? enrichedProducts.find((p) => p.id === selectedProductDetails.id) || selectedProductDetails
            : null
        }
        onClose={() => setSelectedProductDetails(null)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <CartDrawer onProceedToCheckout={() => setIsCheckoutModalOpen(true)} />

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        onOrderSuccess={() => {
          setTimeout(() => {
            setIsOrdersModalOpen(true);
          }, 400);
        }}
      />

      <OrdersHistoryModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
      />

      <WishlistModal
        isOpen={isWishlistModalOpen}
        onClose={() => setIsWishlistModalOpen(false)}
        products={enrichedProducts}
        onViewProduct={(p) => setSelectedProductDetails(p)}
      />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}

/**
 * Detects whether the current access is via the STS administrative subdomain or secret path.
 * 1. Subdomain: sts.domain.com or sts-*
 * 2. Secret Path: /sts, /sts-admin, /admin
 * 3. Hash / Search parameter: #sts, ?route=sts
 */
function checkIsStsRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  // Subdomain match (e.g. sts.arabstore.com or sts-...)
  const isSubdomain =
    hostname.startsWith('sts.') ||
    (hostname.includes('.') && hostname.split('.')[0] === 'sts') ||
    hostname.includes('sts-');

  // Secret route match
  const isPath =
    pathname === '/sts' ||
    pathname === '/sts/' ||
    pathname.startsWith('/sts/') ||
    pathname === '/sts-admin' ||
    pathname.startsWith('/sts-admin/') ||
    pathname === '/admin' ||
    pathname === '/admin/' ||
    pathname.startsWith('/admin/');

  // Query or Hash fallback for test / preview environments
  const isHashOrQuery =
    hash.startsWith('#sts') ||
    hash.startsWith('#/sts') ||
    hash.startsWith('#admin') ||
    search.includes('route=sts') ||
    search.includes('mode=sts');

  return Boolean(isSubdomain || isPath || isHashOrQuery);
}

function AppRouter() {
  const { currentUser, canManageStore, loading: authLoading } = useAuth();
  const [isStsRoute, setIsStsRoute] = useState<boolean>(checkIsStsRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      setIsStsRoute(checkIsStsRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Secret administrative keyboard shortcut: Ctrl+Alt+S or Ctrl+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.altKey && (e.key === 's' || e.key === 'س')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'ش'))
      ) {
        e.preventDefault();
        window.history.pushState(null, '', '/sts');
        setIsStsRoute(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navigateToStore = () => {
    window.history.pushState(null, '', '/');
    setIsStsRoute(false);
  };

  // 1. If currently in STS Administrative Gateway or Secret Route
  if (isStsRoute) {
    // Awaiting auth check
    if (authLoading) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 selection:bg-emerald-500 selection:text-white">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-400">
            جارٍ التحقق من الهوية وبوابة STS الإدارية...
          </p>
        </div>
      );
    }

    // If logged in:
    if (currentUser) {
      // If user has administrative permissions (Super Admin, Manager, or staff with permissions)
      if (canManageStore) {
        return <AdminDashboard onBackToStore={navigateToStore} />;
      }
      // If a regular customer attempts to access the admin portal:
      // Return 404 Not Found immediately as required by Prompt Requirement 3!
      return <NotFound404 onGoHome={navigateToStore} />;
    }

    // If unauthenticated: Show the dedicated STS Admin Login Gateway
    return (
      <STSAdminLogin
        onLoginSuccess={() => {
          setIsStsRoute(true);
        }}
        onGoToStore={navigateToStore}
      />
    );
  }

  // 2. Pure Customer Storefront (Zero admin hints or UI)
  return <Storefront />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
