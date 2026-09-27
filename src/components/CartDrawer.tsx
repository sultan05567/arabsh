import React from 'react';
import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    shippingFee,
    totalPrice,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 md:pl-10 text-right">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-r border-slate-200 animate-in slide-in-from-left duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">سلة المشتريات</h2>
                <span className="text-xs text-slate-500">
                  {cart.length > 0 ? `${cart.length} منتجات في السلة` : 'سلتك فارغة حالياً'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-base text-slate-700 mb-1">سلتك فارغة</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
                  تصفح المنتجات وأضف ما يعجبك لتجربة تسوق ممتعة وسريعة
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-600/20"
                >
                  تصفح المنتجات الآن
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  <img
                    src={
                      item.product.imageUrl ||
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80'
                    }
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-slate-800 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                          title="حذف المنتج"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 mt-1 block">
                        {item.product.price.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="p-1 hover:bg-slate-200 text-slate-600 disabled:opacity-40 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Total for this item */}
                      <span className="text-xs font-bold text-slate-900">
                        {(item.product.price * item.quantity).toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-4">
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span className="font-semibold text-slate-900">
                    {subtotal.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>الشحن والتوصيل:</span>
                  <span className="font-semibold text-slate-900">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-700 font-bold">مجاني</span>
                    ) : (
                      `${shippingFee.toLocaleString('ar-SA')} ر.س`
                    )}
                  </span>
                </div>
                {subtotal < 250 && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    أضف منتجات بقيمة {(250 - subtotal).toLocaleString('ar-SA')} ر.س إضافية للحصول على شحن مجاني!
                  </p>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                  <span>الإجمالي النهائي:</span>
                  <span className="text-lg text-emerald-700">
                    {totalPrice.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearCart}
                  className="py-3 px-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-200/60 text-xs font-semibold transition-colors"
                  title="تفريغ السلة بالكامل"
                >
                  تفريغ
                </button>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onProceedToCheckout();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
                >
                  <span>متابعة الشراء وإتمام الطلب</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>دفع آمن وبيانات مشفرة 100%</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
