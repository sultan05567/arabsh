import React from 'react';
import { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { X, Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onViewProduct: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  products,
  onViewProduct,
}) => {
  const { userProfile, toggleWishlist } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();

  if (!isOpen) return null;

  const wishlistedIds = userProfile?.wishlist || [];
  const wishlistedProducts = products.filter((p) => wishlistedIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-right animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'var(--color-card, #ffffff)' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">قائمة المفضلة</h2>
              <p className="text-xs text-slate-500">المنتجات التي قمت بحفظها لشرائها لاحقاً</p>
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
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100">
          {wishlistedProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-base mb-1">قائمة المفضلة فارغة</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                يمكنك الضغط على أيقونة القلب على أي منتج لحفظه في قائمتك المفضلة
              </p>
            </div>
          ) : (
            wishlistedProducts.map((product) => {
              const currentPrice = product.sale_price || product.price;
              return (
                <div key={product.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div
                    onClick={() => {
                      onClose();
                      onViewProduct(product);
                    }}
                    className="flex items-center gap-3 cursor-pointer group flex-1"
                  >
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/80'}
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {product.name}
                      </h4>
                      <span className="text-xs text-slate-400 block mt-0.5">{product.categoryName}</span>
                      <span className="text-xs font-bold text-emerald-700 mt-1 block">
                        {currentPrice.toLocaleString('ar-SA')} ر.س
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        addToCart(product, 1);
                        setIsCartOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>إضافة للسلة</span>
                    </button>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="إزالة من المفضلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
