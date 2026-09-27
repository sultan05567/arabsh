import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Check, Eye, AlertCircle, Heart, Tag, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails }) => {
  const { addToCart } = useCart();
  const { currentUser, isWishlisted, toggleWishlist } = useAuth();
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = addToCart(product, 1);
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleWishlist(product.id);
  };

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const hasDiscount = Boolean(product.sale_price && product.sale_price < product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.price - (product.sale_price || product.price)) / product.price) * 100)
    : 0;

  const currentPrice = hasDiscount ? (product.sale_price as number) : product.price;
  const wishlisted = isWishlisted(product.id);

  return (
    <div
      onClick={() => onViewDetails(product)}
      className="group bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-300 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative"
      style={{ backgroundColor: 'var(--color-card, #ffffff)' }}
    >
      {/* Product Image Container */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        <img
          src={
            product.imageUrl ||
            (product.images && product.images[0]) ||
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
          }
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Top Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end z-10">
          {isOutOfStock ? (
            <span className="bg-red-500/95 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
              نفد من المخزن
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-500/95 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm animate-pulse">
              متبقي {product.stockQuantity} فقط!
            </span>
          ) : null}

          {hasDiscount && (
            <span
              className="text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1"
              style={{ backgroundColor: 'var(--color-secondary, #d97706)' }}
            >
              <Tag className="w-3 h-3" />
              <span>خصم {discountPercent}%</span>
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 left-3 z-10 p-2 rounded-xl bg-white/80 hover:bg-white text-slate-400 hover:text-red-500 backdrop-blur-md shadow-sm transition-all"
          title={wishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              wishlisted ? 'text-red-500 fill-red-500' : ''
            }`}
          />
        </button>

        {/* Category tag */}
        {product.categoryName && (
          <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
            {product.categoryName}
          </span>
        )}

        {/* Hover preview */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/95 text-slate-800 font-semibold text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-xs transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            معاينة التفاصيل
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-bold text-slate-900 group-hover:opacity-80 transition-opacity line-clamp-2 text-base leading-snug">
            {product.name}
          </h3>

          {/* Star Rating Badge */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {product.reviewsCount && product.reviewsCount > 0 ? (
              <>
                <div className="flex items-center text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {(product.rating || 5).toFixed(1)}
                </span>
                <span className="text-[11px] text-slate-400">
                  ({product.reviewsCount} {product.reviewsCount === 1 ? 'تقييم' : 'تقييمات'})
                </span>
              </>
            ) : (
              <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Star className="w-3 h-3 text-slate-300" />
                <span>كن أول من يقيّم</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Price with sale_price */}
          <div>
            <span className="text-[11px] text-slate-400 block font-normal">السعر</span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span
                className="text-xl font-black tracking-tight"
                style={{ color: 'var(--color-primary, #059669)' }}
              >
                {currentPrice.toLocaleString('ar-SA')}
              </span>
              <span className="text-xs font-bold text-slate-600">ر.س</span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">
                  {product.price.toLocaleString('ar-SA')} ر.س
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : added
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 active:scale-95'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>تمت الإضافة</span>
              </>
            ) : isOutOfStock ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>غير متوفر</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>أضف للسلة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
