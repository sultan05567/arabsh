import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/db';
import {
  X,
  CheckCircle,
  Truck,
  CreditCard,
  Banknote,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { currentUser, userProfile } = useAuth();
  const { cart, subtotal, shippingFee, totalPrice, clearCart } = useCart();

  const [customerName, setCustomerName] = useState(userProfile?.name || currentUser?.displayName || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || '');
  const [city, setCity] = useState('الرياض');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'card'>('cash_on_delivery');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      setError('يرجى ملء جميع الحقول المطلوبة لإتمام توصيل الطلب.');
      return;
    }

    if (cart.length === 0) {
      setError('سلة الشراء فارغة!');
      return;
    }

    setLoading(true);

    try {
      const orderItems = cart.map((item) => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl || '',
      }));

      const newOrderId = await createOrder({
        userId: currentUser?.uid || 'guest_' + Date.now(),
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        city: city.trim(),
        items: orderItems,
        totalAmount: totalPrice,
        status: 'pending',
        paymentMethod: paymentMethod === 'cash_on_delivery' ? 'الدفع عند الاستلام' : 'بطاقة مدى / ائتمانية',
        createdAt: new Date().toISOString(),
      });

      clearCart();
      setCompletedOrderId(newOrderId);
      onOrderSuccess(newOrderId);
    } catch (err: any) {
      console.error('Failed to create order:', err);
      setError('حدث خطأ أثناء حفظ الطلب في قاعدة البيانات. يرجى المحاولة مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-right animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">إتمام الشراء والدفع</h2>
              <p className="text-xs text-slate-500">أدخل بيانات التوصيل واختر وسيلة الدفع المناسبة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {completedOrderId ? (
            <div className="text-center py-8 px-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">تم تأكيد طلبك بنجاح!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto mb-4">
                شكراً لثقتكم بمتجر عرب. تم حفظ طلبك برقم مرجعي وتحديث المخزون بنجاح في قاعدة البيانات.
              </p>
              <div className="bg-slate-100 p-3 rounded-xl inline-block text-xs font-mono font-bold text-slate-700 mb-6">
                رقم الطلب: {completedOrderId}
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  العودة للمتجر ومواصلة التسوق
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Customer Contact & Address */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>بيانات المستلم وعنوان التوصيل</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      الاسم الكامل *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: محمد بن عبدالله"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="example@domain.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      رقم الجوال *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="05XXXXXXXX"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-colors text-left dir-ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      المدينة *
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-colors"
                    >
                      <option value="الرياض">الرياض</option>
                      <option value="جدة">جدة</option>
                      <option value="الدمام">الدمام</option>
                      <option value="مكة المكرمة">مكة المكرمة</option>
                      <option value="المدينة المنورة">المدينة المنورة</option>
                      <option value="الخبر">الخبر</option>
                      <option value="أبها">أبها</option>
                      <option value="تبوك">تبوك</option>
                      <option value="دبي">دبي</option>
                      <option value="أبوظبي">أبوظبي</option>
                      <option value="الدوحة">الدوحة</option>
                      <option value="الكويت">الكويت</option>
                      <option value="مسقط">مسقط</option>
                      <option value="المنامة">المنامة</option>
                      <option value="القاهرة">القاهرة</option>
                      <option value="عمان">عمان</option>
                      <option value="أخرى">مدينة أخرى</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    العنوان بالتفصيل (الحي، الشارع، رقم المبنى) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="مثال: حي النرجس، شارع عثمان بن عفان، مبنى رقم 12"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>طريقة الدفع</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'cash_on_delivery'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={() => setPaymentMethod('cash_on_delivery')}
                      className="accent-emerald-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-slate-900">الدفع عند الاستلام</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">ادفع نقداً أو عبر الشبكة عند وصول المندوب</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="accent-emerald-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-slate-900">مدى / بطاقة ائتمانية</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">دفع إلكتروني فوري وآمن 100%</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex justify-between items-center pb-2 border-b border-slate-200">
                  <span>المنتجات في الطلب ({cart.length})</span>
                  <span>الإجمالي: {totalPrice.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1.5 text-xs text-slate-600 divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.product.id} className="pt-1 flex justify-between">
                      <span className="line-clamp-1">
                        {item.product.name} × {item.quantity}
                      </span>
                      <span className="font-semibold text-slate-800 shrink-0">
                        {(item.product.price * item.quantity).toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري تأكيد وتسجيل الطلب...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>تأكيد الطلب الآن ({totalPrice.toLocaleString('ar-SA')} ر.س)</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
