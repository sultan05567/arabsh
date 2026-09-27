import React, { useState, useEffect } from 'react';
import {
  Category,
  Product,
  Order,
  UserProfile,
  UserRole,
  OrderStatus,
  StoreSettings,
  UserPermissions,
} from '../../types';
import {
  addProduct,
  updateProduct,
  deleteProduct,
  addCategory,
  updateCategory,
  deleteCategory,
  updateOrderStatus,
  updateUserRole,
  toggleUserBlock,
  subscribeProducts,
  subscribeCategories,
  subscribeOrders,
  subscribeUsers,
  subscribeAllUserPermissions,
  saveUserPermissions,
  getDefaultUserPermissions,
  seedInitialStoreData,
} from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { DynamicIcon, AVAILABLE_ICONS } from '../DynamicIcon';
import {
  LayoutDashboard,
  Palette,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  Truck,
  Sparkles,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Shield,
  ShieldAlert,
  Ban,
  Tag,
  Eye,
  EyeOff,
  Link,
  Globe,
  Phone,
  Mail,
  Sliders,
  KeyRound,
  Lock,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToStore }) => {
  const { userProfile, isSuperAdmin, isManager, canEditTheme, hasTabPermission, effectivePermissions } = useAuth();
  const { settings, updateSettings } = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'branding' | 'products' | 'categories' | 'orders' | 'users'>(
    'overview'
  );

  // Live Firestore collections
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [permissionsMap, setPermissionsMap] = useState<Record<string, UserPermissions>>({});
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<UserProfile | null>(null);

  const [seedingLoading, setSeedingLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & filters in tabs
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState('');

  // Branding Form local state
  const [brandForm, setBrandForm] = useState<StoreSettings>(settings);
  const [brandingSaving, setBrandingSaving] = useState(false);

  useEffect(() => {
    setBrandForm(settings);
  }, [settings]);

  // Subscriptions to live database
  useEffect(() => {
    const unsubProd = subscribeProducts((data) => setProducts(data));
    const unsubCat = subscribeCategories((data) => setCategories(data));
    const unsubOrd = subscribeOrders((data) => setOrders(data));
    const unsubUsr = subscribeUsers((data) => setUsers(data));
    const unsubPerms = subscribeAllUserPermissions((data) => setPermissionsMap(data));

    setLoading(false);

    return () => {
      unsubProd();
      unsubCat();
      unsubOrd();
      unsubUsr();
      unsubPerms();
    };
  }, []);

  // Automatic access control: Hide & redirect from any tab the user lacks permission for
  useEffect(() => {
    if (activeTab !== 'overview' && !hasTabPermission(activeTab)) {
      setActiveTab('overview');
    }
  }, [activeTab, effectivePermissions, hasTabPermission]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Seed sample store data
  const handleSeedData = async () => {
    if (!window.confirm('هل تريد تهيئة بيانات المتجر بإضافة تصنيفات ومنتجات تجريبية أصيلة إلى Firestore؟')) {
      return;
    }
    setSeedingLoading(true);
    try {
      const res = await seedInitialStoreData();
      showToast(`تمت إضافة ${res.categoriesCount} تصنيفات و ${res.productsCount} منتجات لقاعدة البيانات بنجاح!`);
    } catch (err: any) {
      console.error('Seeding error:', err);
      showToast('حدث خطأ أثناء تهيئة البيانات: ' + (err?.message || 'تحقق من الاتصال'));
    } finally {
      setSeedingLoading(false);
    }
  };

  // Save branding settings
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditTheme) {
      showToast('عذراً، تعديل هوية المتجر مخصص للمدير العام (Super Admin) فقط.');
      return;
    }
    setBrandingSaving(true);
    try {
      await updateSettings(brandForm);
      showToast('تم حفظ وتطبيق هوية المتجر والألوان بنجاح في قاعدة البيانات!');
    } catch (err) {
      console.error('Failed to save branding:', err);
      showToast('حدث خطأ أثناء حفظ الإعدادات.');
    } finally {
      setBrandingSaving(false);
    }
  };

  // Helper for file upload conversion to Base64
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (base64Url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Metrics
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const lowStockProducts = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5);
  const outOfStockProducts = products.filter((p) => p.stockQuantity <= 0);

  return (
    <div className="min-h-screen bg-slate-50 text-right pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm animate-in fade-in slide-in-from-bottom-3 border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onBackToStore}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-colors border border-slate-200 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة للمتجر</span>
              </button>
              <div className="h-5 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-lg font-black text-slate-900">
                  لوحة تحكم إدارة «{settings.store_name}»
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden md:inline-block text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-700 border border-slate-200">
                صلاحيتك:{' '}
                {isSuperAdmin
                  ? 'مدير عام (Super Admin)'
                  : isManager
                  ? 'مشرف (Manager)'
                  : 'عميل'}
              </span>
              <button
                onClick={handleSeedData}
                disabled={seedingLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                title="إضافة منتجات وتصنيفات تجريبية حقيقية إلى Firestore"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{seedingLoading ? 'جاري التهيئة...' : 'تهيئة بيانات المتجر'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>نظرة عامة وإحصائيات</span>
            </button>

            {/* Theme & Branding Tab */}
            {hasTabPermission('branding') && (
              <button
                onClick={() => setActiveTab('branding')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'branding'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Palette className="w-4 h-4 text-amber-500" />
                <span>الهوية البصرية والألوان (Theme Engine)</span>
              </button>
            )}

            {/* Products Tab */}
            {hasTabPermission('products') && (
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>إدارة المنتجات ({products.length})</span>
              </button>
            )}

            {/* Categories Tab */}
            {hasTabPermission('categories') && (
              <button
                onClick={() => setActiveTab('categories')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'categories'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                <span>إدارة التصنيفات ({categories.length})</span>
              </button>
            )}

            {/* Orders Tab */}
            {hasTabPermission('orders') && (
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>إدارة الطلبات ({orders.length})</span>
              </button>
            )}

            {/* Users & Roles Tab */}
            {hasTabPermission('users') && (
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>المستخدمون والأدوار ({users.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* ========================================================
            TAB 1: OVERVIEW
            ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold">إجمالي المبيعات</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">
                    {totalRevenue.toLocaleString('ar-SA')}
                  </span>
                  <span className="text-xs font-bold text-slate-500">ر.س</span>
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  من {orders.length} طلبات مسجلة
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold">عدد المنتجات</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-2xl font-black text-slate-900">{products.length}</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  موزعة عبر {categories.length} تصنيفات نشطة
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold">المستخدمون المسجلون</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <span className="text-2xl font-black text-slate-900">{users.length}</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {users.filter((u) => u.role === 'super_admin' || u.role === 'admin').length} مدراء عامين
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold">تنبيهات المخزون</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-600">
                    {lowStockProducts.length + outOfStockProducts.length}
                  </span>
                  <span className="text-xs text-slate-500">منتجات بحاجة لتوريد</span>
                </div>
                <p className="text-[11px] text-red-500 font-semibold mt-1">
                  {outOfStockProducts.length} منتجات نفدت
                </p>
              </div>
            </div>

            {/* Quick Actions and Latest Orders Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-slate-900">أحدث الطلبات المستلمة</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    عرض كل الطلبات ({orders.length})
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">لا توجد طلبات مسجلة بعد</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders.slice(0, 5).map((ord) => (
                      <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">
                              #{ord.id.slice(0, 7)}
                            </span>
                            <span className="font-semibold text-slate-900">{ord.customerName}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">{ord.city}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-emerald-700">
                            {ord.totalAmount.toLocaleString('ar-SA')} ر.س
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3">
                <h3 className="font-bold text-base text-slate-900 mb-2">إجراءات سريعة</h3>

                {hasTabPermission('branding') && (
                  <button
                    onClick={() => setActiveTab('branding')}
                    className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-amber-600" />
                      <span>تخصيص الهوية ومحرر الألوان</span>
                    </div>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </button>
                )}

                {hasTabPermission('products') && (
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>إضافة منتج جديد للمتجر</span>
                    </div>
                    <Package className="w-4 h-4 text-slate-400" />
                  </button>
                )}

                {hasTabPermission('categories') && (
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setIsCategoryModalOpen(true);
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-800 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>إضافة تصنيف جديد</span>
                    </div>
                    <FolderTree className="w-4 h-4 text-slate-400" />
                  </button>
                )}

                {hasTabPermission('users') && (
                  <button
                    onClick={() => setActiveTab('users')}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-800 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>إدارة الأدوار والمستخدمين</span>
                    </div>
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded-full">
                      {users.length}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: STORE BRANDING & THEME ENGINE
            ======================================================== */}
        {activeTab === 'branding' && hasTabPermission('branding') && (
          <div className="space-y-6">
            {!canEditTheme && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  أنت مسجل حالياً بصلاحية مشرف (Manager). تخصيص الهوية ومحرر الألوان متاح حصرياً للمدير العام (Super Admin).
                  يمكنك التبديل إلى دور المدير العام من قائمة الحساب العلوية للمعاينة والتجربة.
                </span>
              </div>
            )}

            <form onSubmit={handleSaveBranding} className="space-y-6">
              {/* Brand Settings Section */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-emerald-600" />
                    <span>إعدادات الهوية العامة للمتجر (Store Settings)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    تغيير اسم المتجر، الشعار (Logo)، الأيقونة المصغرة (Favicon)، والوصف
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">اسم المتجر *</label>
                    <input
                      type="text"
                      required
                      disabled={!canEditTheme}
                      value={brandForm.store_name}
                      onChange={(e) => setBrandForm({ ...brandForm, store_name: e.target.value })}
                      placeholder="متجر عرب"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      وصف المتجر (يظهر في الهيدر والفوتر والـ SEO)
                    </label>
                    <input
                      type="text"
                      disabled={!canEditTheme}
                      value={brandForm.description}
                      onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                      placeholder="منصة التسوق العربية المتكاملة..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Logo & Favicon Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Logo */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                    <label className="block font-bold text-slate-800">
                      شعار المتجر الرسمي (Store Logo)
                    </label>
                    <div className="flex items-center gap-4">
                      {brandForm.logo_url ? (
                        <img
                          src={brandForm.logo_url}
                          alt="الشعار"
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-white shadow-xs"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200">
                          افتراضي
                        </div>
                      )}
                      <div className="space-y-1.5 flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-semibold cursor-pointer text-slate-700">
                          <Upload className="w-3.5 h-3.5" />
                          <span>رفع ملف شعار حقيقي</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!canEditTheme}
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, (url) =>
                                setBrandForm({ ...brandForm, logo_url: url })
                              )
                            }
                          />
                        </label>
                        <input
                          type="url"
                          disabled={!canEditTheme}
                          placeholder="أو أدخل رابط صورة مباشر..."
                          value={brandForm.logo_url}
                          onChange={(e) =>
                            setBrandForm({ ...brandForm, logo_url: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-left dir-ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                    <label className="block font-bold text-slate-800">
                      الأيقونة المصغرة (Favicon)
                    </label>
                    <div className="flex items-center gap-4">
                      {brandForm.favicon_url ? (
                        <img
                          src={brandForm.favicon_url}
                          alt="Favicon"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                          أيقونة
                        </div>
                      )}
                      <div className="space-y-1.5 flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-semibold cursor-pointer text-slate-700">
                          <Upload className="w-3.5 h-3.5" />
                          <span>رفع أيقونة المتصفح</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!canEditTheme}
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, (url) =>
                                setBrandForm({ ...brandForm, favicon_url: url })
                              )
                            }
                          />
                        </label>
                        <input
                          type="url"
                          disabled={!canEditTheme}
                          placeholder="أو رابط الأيقونة..."
                          value={brandForm.favicon_url}
                          onChange={(e) =>
                            setBrandForm({ ...brandForm, favicon_url: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-left dir-ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Announcement Bar text & toggle */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-bold text-slate-800 text-xs">
                      شريط الإعلانات الترويجي العلوي (Announcement Bar)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={brandForm.announcement_enabled}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, announcement_enabled: e.target.checked })
                        }
                        className="accent-emerald-600 w-4 h-4 rounded"
                      />
                      <span>تفعيل ظهور الشريط</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!canEditTheme || !brandForm.announcement_enabled}
                    value={brandForm.announcement_text}
                    onChange={(e) =>
                      setBrandForm({ ...brandForm, announcement_text: e.target.value })
                    }
                    placeholder="نص الإعلان العلوي..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Theme Engine: Live Color Picker Section */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-emerald-600" />
                      <span>محرر الألوان الحي (Theme Engine)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      التحكم الكامل بألوان المتجر وتطبيقها فوراً عبر متغيرات CSS (CSS Variables)
                    </p>
                  </div>

                  {/* Preset palettes */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-medium">نماذج سريعة:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setBrandForm({
                          ...brandForm,
                          primary_color: '#059669',
                          secondary_color: '#d97706',
                          bg_color: '#f8fafc',
                          card_bg_color: '#ffffff',
                          text_color: '#0f172a',
                        })
                      }
                      className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-xs"
                      title="الزمرد والذهب (Emerald & Gold)"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setBrandForm({
                          ...brandForm,
                          primary_color: '#2563eb',
                          secondary_color: '#06b6d4',
                          bg_color: '#f0f9ff',
                          card_bg_color: '#ffffff',
                          text_color: '#0f172a',
                        })
                      }
                      className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-xs"
                      title="الأزرق الملكي (Sapphire Blue)"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setBrandForm({
                          ...brandForm,
                          primary_color: '#7c3aed',
                          secondary_color: '#ec4899',
                          bg_color: '#faf5ff',
                          card_bg_color: '#ffffff',
                          text_color: '#0f172a',
                        })
                      }
                      className="w-6 h-6 rounded-full bg-purple-600 border-2 border-white shadow-xs"
                      title="البنفسجي الإمبراطوري (Violet & Magenta)"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setBrandForm({
                          ...brandForm,
                          primary_color: '#b91c1c',
                          secondary_color: '#f59e0b',
                          bg_color: '#fef2f2',
                          card_bg_color: '#ffffff',
                          text_color: '#0f172a',
                        })
                      }
                      className="w-6 h-6 rounded-full bg-red-700 border-2 border-white shadow-xs"
                      title="العنابي العربي (Crimson Red)"
                    />
                  </div>
                </div>

                {/* Color Pickers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                  {/* Primary Color */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">اللون الأساسي (Primary Color)</label>
                      <span className="text-[11px] font-mono text-slate-500">
                        {brandForm.primary_color}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">للأزرار الرئيسية، الروابط، وأشرطة المتجر</p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="color"
                        disabled={!canEditTheme}
                        value={brandForm.primary_color}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, primary_color: e.target.value })
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        disabled={!canEditTheme}
                        value={brandForm.primary_color}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, primary_color: e.target.value })
                        }
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-left dir-ltr"
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">
                        اللون الثانوي (Secondary Color)
                      </label>
                      <span className="text-[11px] font-mono text-slate-500">
                        {brandForm.secondary_color}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">للشارات، التخفيضات، وتأكيدات المنتجات</p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="color"
                        disabled={!canEditTheme}
                        value={brandForm.secondary_color}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, secondary_color: e.target.value })
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        disabled={!canEditTheme}
                        value={brandForm.secondary_color}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, secondary_color: e.target.value })
                        }
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-left dir-ltr"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">
                        لون الخلفية (Background Color)
                      </label>
                      <span className="text-[11px] font-mono text-slate-500">
                        {brandForm.bg_color}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">خلفية صفحات المتجر العامة</p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="color"
                        disabled={!canEditTheme}
                        value={brandForm.bg_color}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, bg_color: e.target.value })
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        disabled={!canEditTheme}
                        value={brandForm.bg_color}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, bg_color: e.target.value })
                        }
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-left dir-ltr"
                      />
                    </div>
                  </div>

                  {/* Card Background Color */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">
                        لون البطاقات (Card Background)
                      </label>
                      <span className="text-[11px] font-mono text-slate-500">
                        {brandForm.card_bg_color}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">خلفية بطاقات المنتجات والنوافذ</p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="color"
                        disabled={!canEditTheme}
                        value={brandForm.card_bg_color}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, card_bg_color: e.target.value })
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        disabled={!canEditTheme}
                        value={brandForm.card_bg_color}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, card_bg_color: e.target.value })
                        }
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-left dir-ltr"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">لون النصوص (Text Color)</label>
                      <span className="text-[11px] font-mono text-slate-500">
                        {brandForm.text_color}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">لون الخطوط الأساسية والفقرات</p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="color"
                        disabled={!canEditTheme}
                        value={brandForm.text_color}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, text_color: e.target.value })
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                      />
                      <input
                        type="text"
                        disabled={!canEditTheme}
                        value={brandForm.text_color}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, text_color: e.target.value })
                        }
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-left dir-ltr"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="p-5 rounded-3xl border border-slate-200 space-y-3 bg-slate-50">
                  <span className="text-xs font-bold text-slate-500 block">
                    معاينة حية فورية للثيم والألوان:
                  </span>
                  <div
                    className="p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
                    style={{
                      backgroundColor: brandForm.card_bg_color,
                      color: brandForm.text_color,
                      borderColor: 'rgba(0,0,0,0.1)',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: brandForm.secondary_color }}
                        >
                          تخفيض 25%
                        </span>
                        <h4 className="font-black text-base">عطر العود الفاخر (تجربة الثيم)</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        هكذا تظهر البطاقات والأزرار والشارات للمتسوقين
                      </p>
                    </div>

                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md cursor-default"
                      style={{ backgroundColor: brandForm.primary_color }}
                    >
                      زر الشراء الأساسي (290 ر.س)
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer & Social Links Section */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-600" />
                    <span>نصوص الفوتر (Footer) وروابط التواصل الاجتماعي</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      البريد الإلكتروني للتواصل
                    </label>
                    <input
                      type="email"
                      disabled={!canEditTheme}
                      value={brandForm.contact_email}
                      onChange={(e) =>
                        setBrandForm({ ...brandForm, contact_email: e.target.value })
                      }
                      placeholder="support@domain.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 text-left dir-ltr"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">رقم هاتف الدعم</label>
                    <input
                      type="text"
                      disabled={!canEditTheme}
                      value={brandForm.contact_phone}
                      onChange={(e) =>
                        setBrandForm({ ...brandForm, contact_phone: e.target.value })
                      }
                      placeholder="+966 50 123 4567"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 text-left dir-ltr"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      نص حقوق الملكية في الفوتر
                    </label>
                    <textarea
                      rows={2}
                      disabled={!canEditTheme}
                      value={brandForm.footer_text}
                      onChange={(e) =>
                        setBrandForm({ ...brandForm, footer_text: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Social Links */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      رابط تويتر / منصة إكس (Twitter/X)
                    </label>
                    <input
                      type="url"
                      disabled={!canEditTheme}
                      value={brandForm.social_links?.twitter || ''}
                      onChange={(e) =>
                        setBrandForm({
                          ...brandForm,
                          social_links: { ...brandForm.social_links, twitter: e.target.value },
                        })
                      }
                      placeholder="https://x.com/..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-left dir-ltr"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      رابط انستقرام (Instagram)
                    </label>
                    <input
                      type="url"
                      disabled={!canEditTheme}
                      value={brandForm.social_links?.instagram || ''}
                      onChange={(e) =>
                        setBrandForm({
                          ...brandForm,
                          social_links: { ...brandForm.social_links, instagram: e.target.value },
                        })
                      }
                      placeholder="https://instagram.com/..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-left dir-ltr"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      رابط واتساب (WhatsApp)
                    </label>
                    <input
                      type="text"
                      disabled={!canEditTheme}
                      value={brandForm.social_links?.whatsapp || ''}
                      onChange={(e) =>
                        setBrandForm({
                          ...brandForm,
                          social_links: { ...brandForm.social_links, whatsapp: e.target.value },
                        })
                      }
                      placeholder="https://wa.me/966XXXXXXXX"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-left dir-ltr"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      رابط تيك توك (TikTok)
                    </label>
                    <input
                      type="url"
                      disabled={!canEditTheme}
                      value={brandForm.social_links?.tiktok || ''}
                      onChange={(e) =>
                        setBrandForm({
                          ...brandForm,
                          social_links: { ...brandForm.social_links, tiktok: e.target.value },
                        })
                      }
                      placeholder="https://tiktok.com/@..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-left dir-ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="submit"
                  disabled={!canEditTheme || brandingSaving}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {brandingSaving
                      ? 'جاري حفظ وتطبيق الهوية...'
                      : 'حفظ وتطبيق الهوية البصرية والألوان فوراً'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            TAB 3: PRODUCTS MANAGEMENT
            ======================================================== */}
        {activeTab === 'products' && hasTabPermission('products') && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">إدارة المنتجات</h2>
                <p className="text-xs text-slate-500">
                  إضافة وتعديل المنتجات، الأسعار، سعر العرض، الصور المتعددة، وتفعيل/تعطيل الظهور
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث عن منتج..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                </div>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsProductModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منتج جديد</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3.5">المنتج</th>
                    <th className="p-3.5">التصنيف</th>
                    <th className="p-3.5">السعر الأساسي</th>
                    <th className="p-3.5">سعر العرض</th>
                    <th className="p-3.5">المخزون</th>
                    <th className="p-3.5">حالة الظهور</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products
                    .filter((p) =>
                      productSearch
                        ? p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.categoryName?.toLowerCase().includes(productSearch.toLowerCase())
                        : true
                    )
                    .map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.imageUrl || (product.images && product.images[0]) || 'https://via.placeholder.com/60'}
                              alt={product.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{product.name}</span>
                              <span className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                                {product.description}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {product.categoryName || 'غير مصنف'}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-800 text-xs">
                          {product.price.toLocaleString('ar-SA')} ر.س
                        </td>
                        <td className="p-3.5">
                          {product.sale_price ? (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {product.sale_price.toLocaleString('ar-SA')} ر.س
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                              product.stockQuantity <= 0
                                ? 'bg-red-100 text-red-700'
                                : product.stockQuantity <= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {product.stockQuantity} قطعة
                          </span>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={async () => {
                              const newActive = !(product.is_active !== false);
                              await updateProduct(product.id, { is_active: newActive });
                              showToast(`تم ${newActive ? 'تفعيل' : 'تعطيل'} ظهور المنتج في المتجر`);
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                              product.is_active !== false
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {product.is_active !== false ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>نشط</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                <span>معطل</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="تعديل المنتج"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`هل أنت متأكد من حذف المنتج: "${product.name}"؟`)) {
                                  await deleteProduct(product.id);
                                  showToast('تم حذف المنتج بنجاح');
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                              title="حذف المنتج"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: CATEGORIES MANAGEMENT
            ======================================================== */}
        {activeTab === 'categories' && hasTabPermission('categories') && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">إدارة التصنيفات</h2>
                <p className="text-xs text-slate-500">
                  إنشاء وتعديل تصنيفات المتجر واختيار أيقونة من مكتبة Lucide
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة تصنيف جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const prodCount = products.filter((p) => p.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <DynamicIcon name={cat.icon_name || cat.icon} className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {prodCount} منتجات
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{cat.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {cat.description || 'لا يوجد وصف مضاف'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          الأيقونة: {cat.icon_name || cat.icon || 'ShoppingBag'}
                        </span>
                        {cat.slug && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded-sm">
                            /{cat.slug}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-200/80 flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setIsCategoryModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`هل أنت متأكد من حذف تصنيف: "${cat.name}"؟`)) {
                            await deleteCategory(cat.id);
                            showToast('تم حذف التصنيف');
                          }
                        }}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: ORDERS MANAGEMENT
            ======================================================== */}
        {activeTab === 'orders' && hasTabPermission('orders') && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">إدارة الطلبات والمبيعات</h2>
                <p className="text-xs text-slate-500">
                  متابعة طلبات العملاء وتحديث حالات الشحن وتأكيد المعاملات
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">تصفية حسب الحالة:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="pending">قيد الانتظار</option>
                  <option value="processing">قيد التجهيز</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {orders
                .filter((o) => (orderStatusFilter === 'all' ? true : o.status === orderStatusFilter))
                .map((order) => (
                  <div
                    key={order.id}
                    className="p-5 rounded-3xl border border-slate-200 bg-slate-50/40 hover:bg-white transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">
                            {order.customerName}
                          </span>
                          <span className="text-xs text-slate-400">({order.customerPhone})</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {order.city} - {order.shippingAddress} | {order.customerEmail}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">حالة الطلب:</span>
                        <select
                          value={order.status}
                          onChange={async (e) => {
                            await updateOrderStatus(order.id, e.target.value as OrderStatus);
                            showToast(`تم تحديث حالة الطلب إلى "${e.target.value}"`);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none ${
                            order.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : order.status === 'shipped'
                              ? 'bg-purple-50 text-purple-800 border-purple-300'
                              : order.status === 'processing'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : order.status === 'cancelled'
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="processing">قيد التجهيز</option>
                          <option value="shipped">تم الشحن مع المندوب</option>
                          <option value="delivered">تم التوصيل للعميل</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-200/80 text-xs">
                      <div className="font-semibold text-slate-700 mb-1 flex justify-between">
                        <span>المنتجات المطلوبة ({order.items?.length || 0}):</span>
                        <span className="text-emerald-700 font-bold">
                          المجموع: {order.totalAmount.toLocaleString('ar-SA')} ر.س (
                          {order.paymentMethod})
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg">
                            <span className="text-slate-800 font-medium truncate">{item.name}</span>
                            <span className="text-slate-400 shrink-0">× {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: USERS & ROLES MANAGEMENT
            ======================================================== */}
        {activeTab === 'users' && hasTabPermission('users') && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">إدارة المستخدمين والصلاحيات</h2>
                <p className="text-xs text-slate-500">
                  استعراض المستخدمين المسجلين، تعيين أدوار (مدير عام، مشرف، عميل)، أو حظر الحسابات
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="بحث عن مستخدم بالاسم أو الإيميل..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3.5">المستخدم</th>
                    <th className="p-3.5">البريد الإلكتروني</th>
                    <th className="p-3.5">تاريخ التسجيل</th>
                    <th className="p-3.5">الحالة</th>
                    <th className="p-3.5">الدور الحالي</th>
                    <th className="p-3.5 text-center">تغيير الصلاحية / الحظر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users
                    .filter((u) =>
                      userSearch
                        ? u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email?.toLowerCase().includes(userSearch.toLowerCase())
                        : true
                    )
                    .map((user) => (
                      <tr key={user.uid} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                              {user.name?.charAt(0) || user.email?.charAt(0) || 'م'}
                            </div>
                            <span className="font-bold text-slate-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600 font-mono">{user.email}</td>
                        <td className="p-3.5 text-slate-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : '—'}
                        </td>
                        <td className="p-3.5">
                          {user.is_blocked ? (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-red-100 text-red-800 border border-red-200">
                              محظور
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                              نشط
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                                user.role === 'super_admin' || user.role === 'admin'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : user.role === 'manager'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {user.role === 'super_admin' || user.role === 'admin'
                                ? 'مدير عام (Super Admin)'
                                : user.role === 'manager'
                                ? 'مشرف (Manager)'
                                : 'عميل (Customer)'}
                            </span>

                            {/* Indicators for customized tab permissions */}
                            {permissionsMap[user.uid] && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {permissionsMap[user.uid].branding && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                                    الهوية
                                  </span>
                                )}
                                {permissionsMap[user.uid].products && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                    المنتجات
                                  </span>
                                )}
                                {permissionsMap[user.uid].categories && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                    التصنيفات
                                  </span>
                                )}
                                {permissionsMap[user.uid].orders && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                                    الطلبات
                                  </span>
                                )}
                                {permissionsMap[user.uid].users && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                                    المستخدمين
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <select
                              value={user.role}
                              onChange={async (e) => {
                                const newRole = e.target.value as UserRole;
                                await updateUserRole(user.uid, newRole);
                                showToast(`تم تعيين صلاحية ${user.name} إلى: ${newRole}`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white cursor-pointer hover:border-emerald-500 shadow-2xs"
                            >
                              <option value="customer">عميل (Customer)</option>
                              <option value="manager">مشرف (Manager)</option>
                              <option value="super_admin">مدير عام (Super Admin)</option>
                            </select>

                            {/* زر «تخصيص الصلاحيات» */}
                            <button
                              onClick={() => {
                                setSelectedUserForPermissions(user);
                                setIsPermissionsModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs whitespace-nowrap"
                              title="تخصيص صلاحيات التبويبات والأقسام لهذا المستخدم"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                              <span>تخصيص الصلاحيات</span>
                            </button>

                            <button
                              onClick={async () => {
                                const newBlocked = !user.is_blocked;
                                await toggleUserBlock(user.uid, newBlocked);
                                showToast(
                                  newBlocked ? `تم حظر المستخدم ${user.name}` : `تم إلغاء حظر المستخدم ${user.name}`
                                );
                              }}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                user.is_blocked
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              }`}
                              title={user.is_blocked ? 'إلغاء الحظر' : 'حظر هذا المستخدم'}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {isProductModalOpen && (
        <ProductFormModal
          isOpen={isProductModalOpen}
          initialProduct={editingProduct}
          categories={categories}
          onClose={() => setIsProductModalOpen(false)}
          onSaved={() => {
            setIsProductModalOpen(false);
            showToast('تم حفظ المنتج بنجاح');
          }}
        />
      )}

      {/* Category Form Modal with Lucide Icon Picker */}
      {isCategoryModalOpen && (
        <CategoryFormModal
          isOpen={isCategoryModalOpen}
          initialCategory={editingCategory}
          onClose={() => setIsCategoryModalOpen(false)}
          onSaved={() => {
            setIsCategoryModalOpen(false);
            showToast('تم حفظ التصنيف بنجاح');
          }}
        />
      )}

      {/* User Permissions Customization Modal */}
      {isPermissionsModalOpen && selectedUserForPermissions && (
        <UserPermissionsModal
          isOpen={isPermissionsModalOpen}
          user={selectedUserForPermissions}
          currentPermissions={permissionsMap[selectedUserForPermissions.uid]}
          onClose={() => {
            setIsPermissionsModalOpen(false);
            setSelectedUserForPermissions(null);
          }}
          onSaved={(msg) => {
            setIsPermissionsModalOpen(false);
            setSelectedUserForPermissions(null);
            showToast(msg);
          }}
        />
      )}
    </div>
  );
};

/* ========================================================
   SUB-COMPONENT: PRODUCT FORM MODAL (With Multiple Images & Sale Price)
   ======================================================== */
interface ProductFormModalProps {
  isOpen: boolean;
  initialProduct: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  initialProduct,
  categories,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(initialProduct?.name || '');
  const [price, setPrice] = useState(initialProduct ? String(initialProduct.price) : '');
  const [salePrice, setSalePrice] = useState(
    initialProduct?.sale_price ? String(initialProduct.sale_price) : ''
  );
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [images, setImages] = useState<string[]>(
    initialProduct?.images && initialProduct.images.length > 0
      ? initialProduct.images
      : initialProduct?.imageUrl
      ? [initialProduct.imageUrl]
      : []
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState(
    initialProduct?.categoryId || categories[0]?.id || ''
  );
  const [stockQuantity, setStockQuantity] = useState(
    initialProduct ? String(initialProduct.stockQuantity) : '15'
  );
  const [isActive, setIsActive] = useState(initialProduct?.is_active !== false);
  const [featured, setFeatured] = useState(initialProduct?.featured || false);
  const [loading, setLoading] = useState(false);

  const handleAddImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setImages((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !stockQuantity) return;

    setLoading(true);
    const selectedCategory = categories.find((c) => c.id === categoryId);

    try {
      const productPayload = {
        name: name.trim(),
        price: parseFloat(price),
        sale_price: salePrice.trim() ? parseFloat(salePrice) : null,
        description: description.trim(),
        imageUrl: images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
        images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
        categoryId,
        category_ids: [categoryId],
        categoryName: selectedCategory?.name || '',
        stockQuantity: parseInt(stockQuantity, 10),
        is_active: isActive,
        featured,
      };

      if (initialProduct) {
        await updateProduct(initialProduct.id, productPayload);
      } else {
        await addProduct(productPayload);
      }
      onSaved();
    } catch (err) {
      console.error('Save product error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-right animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-4">
          {initialProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">اسم المنتج *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: عطر خشب العود الملكي"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">السعر الأساسي (ر.س) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="250"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                سعر العرض / التخفيض (اختياري)
              </label>
              <input
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="199"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">الكمية بالمخزن *</label>
              <input
                type="number"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                placeholder="15"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">التصنيف *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Multiple Images Upload & Gallery */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="block font-bold text-slate-800">
              صور المنتج المتعددة (Multiple Images)
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-semibold cursor-pointer text-slate-700">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>رفع صور من الجهاز</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleAddImageFile}
                />
              </label>

              <div className="flex-1 flex gap-2 min-w-[200px]">
                <input
                  type="url"
                  placeholder="أو أضف رابط صورة (URL)..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] text-left dir-ltr"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-semibold text-xs"
                >
                  إضافة
                </button>
              </div>
            </div>

            {/* Images Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-white shadow-2xs">
                    <img src={img} alt="صورة منتج" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-red-600/70 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      title="حذف الصورة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[9px] px-1 rounded-sm font-bold">
                        رئيسية
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">الوصف الكامل للمنتج</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب وصفاً جذاباً يشرح مكونات ومميزات المنتج..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-emerald-600 w-4 h-4 rounded"
              />
              <span>تفعيل ظهور المنتج في المتجر (Active)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="accent-emerald-600 w-4 h-4 rounded"
              />
              <span>تمييز المنتج في الواجهة (Featured)</span>
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ المنتج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ========================================================
   SUB-COMPONENT: CATEGORY FORM MODAL (With Dynamic Lucide Icon Picker)
   ======================================================== */
interface CategoryFormModalProps {
  isOpen: boolean;
  initialCategory: Category | null;
  onClose: () => void;
  onSaved: () => void;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  initialCategory,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(initialCategory?.name || '');
  const [slug, setSlug] = useState(initialCategory?.slug || '');
  const [description, setDescription] = useState(initialCategory?.description || '');
  const [iconName, setIconName] = useState(initialCategory?.icon_name || initialCategory?.icon || 'ShoppingBag');
  const [iconSearch, setIconSearch] = useState('');
  const [isActive, setIsActive] = useState(initialCategory?.is_active !== false);
  const [loading, setLoading] = useState(false);

  const filteredIcons = AVAILABLE_ICONS.filter((ic) =>
    ic.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: description.trim(),
        icon_name: iconName,
        icon: iconName,
        is_active: isActive,
      };

      if (initialCategory) {
        await updateCategory(initialCategory.id, payload);
      } else {
        await addCategory(payload);
      }
      onSaved();
    } catch (err) {
      console.error('Save category error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-right animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-slate-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 mb-4">
          {initialCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">اسم التصنيف *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!initialCategory) {
                  setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }
              }}
              placeholder="مثال: عطور وبخور عربية"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">الرابط المخصص (Slug)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="arabian-perfumes"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600 text-left dir-ltr"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">وصف التصنيف</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر لمحتوى التصنيف..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
            />
          </div>

          {/* Lucide Icon Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700">
                منتقي أيقونة التصنيف (Lucide Icon Picker)
              </label>
              <input
                type="text"
                placeholder="بحث عن أيقونة..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] text-left dir-ltr"
              />
            </div>

            <div className="grid grid-cols-6 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
              {filteredIcons.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIconName(ic)}
                  className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                    iconName === ic
                      ? 'bg-emerald-600 text-white shadow-xs scale-105'
                      : 'hover:bg-slate-200 text-slate-700'
                  }`}
                  title={ic}
                >
                  <DynamicIcon name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-slate-400">الأيقونة المختارة:</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <DynamicIcon name={iconName} className="w-4 h-4" />
              </div>
              <span className="font-mono font-bold text-slate-700">{iconName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="catActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-emerald-600 w-4 h-4 rounded"
            />
            <label htmlFor="catActive" className="text-slate-700 font-semibold cursor-pointer">
              تفعيل ظهور هذا التصنيف في شريط المتجر
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ التصنيف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ========================================================
   SUB-COMPONENT: USER PERMISSIONS CUSTOMIZATION MODAL
   ======================================================== */
interface UserPermissionsModalProps {
  isOpen: boolean;
  user: UserProfile;
  currentPermissions?: UserPermissions;
  onClose: () => void;
  onSaved: (msg: string) => void;
}

const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  user,
  currentPermissions,
  onClose,
  onSaved,
}) => {
  const defaults = getDefaultUserPermissions(user.role);

  const [permissions, setPermissions] = useState({
    branding: currentPermissions?.branding ?? defaults.branding,
    products: currentPermissions?.products ?? defaults.products,
    categories: currentPermissions?.categories ?? defaults.categories,
    orders: currentPermissions?.orders ?? defaults.orders,
    users: currentPermissions?.users ?? defaults.users,
  });

  const [saving, setSaving] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    const roleDefaults = getDefaultUserPermissions(user.role);
    setPermissions({
      branding: currentPermissions?.branding ?? roleDefaults.branding,
      products: currentPermissions?.products ?? roleDefaults.products,
      categories: currentPermissions?.categories ?? roleDefaults.categories,
      orders: currentPermissions?.orders ?? roleDefaults.orders,
      users: currentPermissions?.users ?? roleDefaults.users,
    });
  }, [user, currentPermissions]);

  const handleToggle = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = () => {
    setPermissions({
      branding: true,
      products: true,
      categories: true,
      orders: true,
      users: true,
    });
  };

  const handleDeselectAll = () => {
    setPermissions({
      branding: false,
      products: false,
      categories: false,
      orders: false,
      users: false,
    });
  };

  const handleResetToRoleDefaults = () => {
    const roleDefaults = getDefaultUserPermissions(user.role);
    setPermissions({
      branding: roleDefaults.branding,
      products: roleDefaults.products,
      categories: roleDefaults.categories,
      orders: roleDefaults.orders,
      users: roleDefaults.users,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveUserPermissions({
        userId: user.uid,
        branding: permissions.branding,
        products: permissions.products,
        categories: permissions.categories,
        orders: permissions.orders,
        users: permissions.users,
      });
      onSaved(`تم حفظ وتطبيق صلاحيات «${user.name}» في جدول user_permissions بنجاح!`);
    } catch (err: any) {
      console.error('Failed to save user permissions:', err);
      alert('حدث خطأ أثناء حفظ الصلاحيات في قاعدة البيانات.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const sections = [
    {
      key: 'branding' as const,
      title: 'الهوية البصرية والألوان (Theme Engine)',
      description: 'التحكم في ألوان المتجر، الشعار، الأيقونة المصغرة، البانر، وإعدادات المظهر العام.',
      icon: Palette,
      color: 'amber',
    },
    {
      key: 'products' as const,
      title: 'إدارة المنتجات',
      description: 'إضافة وتعديل وحذف المنتجات، الأسعار، سعر التخفيض، الصور، والمخزون.',
      icon: Package,
      color: 'emerald',
    },
    {
      key: 'categories' as const,
      title: 'إدارة التصنيفات',
      description: 'إنشاء وتعديل تصنيفات وأقسام المتجر واختيار الأيقونات المعبرة عنها.',
      icon: FolderTree,
      color: 'blue',
    },
    {
      key: 'orders' as const,
      title: 'إدارة الطلبات',
      description: 'استعراض ومتابعة طلبات الشراء، وتحديث حالات التوصيل والشحن والإلغاء.',
      icon: ShoppingBag,
      color: 'purple',
    },
    {
      key: 'users' as const,
      title: 'إدارة المستخدمين',
      description: 'استعراض حسابات العملاء، تعديل الأدوار، تخصيص الصلاحيات، وحظر الحسابات.',
      icon: Users,
      color: 'indigo',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-right animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 mb-5 border-b border-slate-100 pb-4">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">تخصيص صلاحيات المستخدم</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="font-bold text-slate-800">{user.name}</span>
              <span>•</span>
              <span className="font-mono text-slate-600">{user.email}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {user.role === 'super_admin'
                  ? 'مدير عام'
                  : user.role === 'manager'
                  ? 'مشرف'
                  : 'عميل'}
              </span>
            </div>
          </div>
        </div>

        {/* Informative Banner */}
        <div className="p-3.5 mb-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>التحكم المباشر في التبويبات والأقسام الظاهرة باللوحة</span>
          </p>
          <p className="text-[11px] leading-relaxed text-slate-500">
            حدد الأقسام التي يُسمح لهذا المستخدم برؤيتها وإدارتها. سيتم حفظ التعديلات فوراً في جدول{' '}
            <code className="text-emerald-700 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              user_permissions
            </code>{' '}
            بقاعدة البيانات، وستُخفى التبويبات غير المحددة تلقائياً عند دخوله للوحة.
          </p>
        </div>

        {/* Quick Bulk Actions */}
        <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700">أقسام اللوحة المتاحة (5)</span>
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition-colors cursor-pointer border border-emerald-200"
            >
              تحديد الكل
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer border border-slate-200"
            >
              إلغاء التحديد
            </button>
            <button
              type="button"
              onClick={handleResetToRoleDefaults}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] transition-colors cursor-pointer border border-slate-200"
              title="استعادة الصلاحيات المقترنة بدور المستخدم تلقائياً"
            >
              افتراضي الدور
            </button>
          </div>
        </div>

        {/* Checkboxes List */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1 pl-1">
            {sections.map((section) => {
              const isChecked = permissions[section.key];
              const IconComp = section.icon;
              return (
                <div
                  key={section.key}
                  onClick={() => handleToggle(section.key)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/30 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  {/* Custom Checkbox */}
                  <div className="mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      id={`perm-${section.key}`}
                      checked={isChecked}
                      onChange={() => handleToggle(section.key)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-white border-slate-300 text-transparent hover:border-emerald-500'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>

                  {/* Icon */}
                  <div
                    className={`p-2 rounded-xl shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>

                  {/* Title and Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isChecked ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {section.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isChecked
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {isChecked ? 'مُفعّل' : 'مُعطّل'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                      {section.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form Actions */}
          <div className="pt-4 mt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الحفظ في user_permissions...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>حفظ الصلاحيات في قاعدة البيانات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
