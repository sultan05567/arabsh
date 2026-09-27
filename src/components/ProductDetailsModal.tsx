import React, { useState, useEffect } from 'react';
import { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { subscribeReviews, addReview, deleteReview } from '../services/db';
import {
  X,
  ShoppingBag,
  Check,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  AlertCircle,
  Heart,
  Tag,
  Star,
  MessageSquare,
  User,
  Trash2,
  Send,
  Loader2,
  LogIn,
} from 'lucide-react';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onOpenAuth,
}) => {
  const { addToCart, setIsCartOpen } = useCart();
  const { currentUser, userProfile, isSuperAdmin, isManager, isWishlisted, toggleWishlist } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Subscribe to reviews for this product
  useEffect(() => {
    if (product) {
      setLoadingReviews(true);
      const unsubscribe = subscribeReviews(product.id, (revs) => {
        setReviews(revs);
        setLoadingReviews(false);
      });
      return () => unsubscribe();
    }
  }, [product?.id]);

  if (!product) return null;

  const isOutOfStock = product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const hasDiscount = Boolean(product.sale_price && product.sale_price < product.price);
  const discountPercent = hasDiscount
    ? Math.round(((product.price - (product.sale_price || product.price)) / product.price) * 100)
    : 0;
  const currentPrice = hasDiscount ? (product.sale_price as number) : product.price;

  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];

  const wishlisted = isWishlisted(product.id);

  // Calculate live average rating
  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : (product.rating || 5).toFixed(1);

  const handleAddToCart = () => {
    const success = addToCart(product, quantity);
    if (success) {
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        onClose();
        setIsCartOpen(true);
      }, 700);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newComment.trim()) {
      setReviewError('يرجى كتابة نص التقييم أو الرأي');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      await addReview({
        productId: product.id,
        userId: currentUser.uid,
        userName: userProfile?.name || currentUser.displayName || 'عميل موثق',
        rating: newRating,
        comment: newComment.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewComment('');
      setNewRating(5);
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to post review:', err);
      setReviewError('حدث خطأ أثناء حفظ التقييم');
    } finally {
      setSubmittingReview(false);
    }
  };

  const ratingDescriptions: Record<number, string> = {
    5: 'ممتاز جداً (5/5)',
    4: 'جيد جداً (4/5)',
    3: 'جيد (3/5)',
    2: 'مقبول (2/5)',
    1: 'ضعيف (1/5)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[92vh] flex flex-col md:flex-row text-right"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'var(--color-card, #ffffff)' }}
      >
        {/* Top Controls: Close & Wishlist */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            onClick={() => toggleWishlist(product.id)}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-red-500 backdrop-blur-md shadow-md transition-all cursor-pointer"
            title="حفظ في المفضلة"
          >
            <Heart
              className={`w-5 h-5 ${wishlisted ? 'text-red-500 fill-red-500' : ''}`}
            />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-slate-800 backdrop-blur-md shadow-md transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Images Column */}
        <div className="md:w-5/12 bg-slate-100 flex flex-col justify-between p-4 relative min-h-[260px] md:min-h-full">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white shadow-xs">
            <img
              src={allImages[activeImageIndex] || allImages[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {hasDiscount && (
              <span
                className="absolute top-3 right-3 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm"
                style={{ backgroundColor: 'var(--color-secondary, #d97706)' }}
              >
                خصم {discountPercent}%
              </span>
            )}
          </div>

          {/* Multiple images gallery */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pt-3 pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-emerald-600 scale-105 shadow-xs'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="صورة إضافية" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Quick trust guarantee */}
          <div className="hidden md:grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-3">
            <div className="flex items-center gap-1.5 p-2 bg-white/80 rounded-xl border border-slate-200">
              <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>شحن سريع ومجاني</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 bg-white/80 rounded-xl border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>ضمان استرجاع 14 يوم</span>
            </div>
          </div>
        </div>

        {/* Product Details & Reviews Column */}
        <div className="p-6 md:p-8 md:w-7/12 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header badges */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {isOutOfStock ? (
                  <span className="text-red-600 bg-red-50 text-xs font-bold px-2.5 py-0.5 rounded-md border border-red-200">
                    نفد من المخزن
                  </span>
                ) : isLowStock ? (
                  <span className="text-amber-700 bg-amber-50 text-xs font-bold px-2.5 py-0.5 rounded-md border border-amber-200">
                    متبقي {product.stockQuantity} فقط!
                  </span>
                ) : (
                  <span className="text-emerald-700 bg-emerald-50 text-xs font-bold px-2.5 py-0.5 rounded-md border border-emerald-200">
                    متوفر في المخزن ({product.stockQuantity})
                  </span>
                )}

                {product.categoryName && (
                  <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                    {product.categoryName}
                  </span>
                )}
              </div>

              {/* Star rating summary trigger */}
              <button
                onClick={() => setActiveTab('reviews')}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <span className="font-black text-slate-900">{averageRating}</span>
                <span className="text-slate-400 font-normal">({reviews.length} تقييم)</span>
              </button>
            </div>

            {/* Product Title */}
            <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug">
              {product.name}
            </h2>

            {/* Price display */}
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="text-3xl font-black"
                style={{ color: 'var(--color-primary, #059669)' }}
              >
                {currentPrice.toLocaleString('ar-SA')}
              </span>
              <span className="text-sm font-bold text-slate-600">ريال سعودي</span>
              {hasDiscount && (
                <span className="text-sm text-slate-400 line-through mr-2">
                  {product.price.toLocaleString('ar-SA')} ر.س
                </span>
              )}
            </div>

            {/* Tabs Selector: Details vs Reviews */}
            <div className="flex border-b border-slate-200 mt-5 text-xs font-bold">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'details'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                التفاصيل والمواصفات
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'reviews'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>تقييمات العملاء ({reviews.length})</span>
              </button>
            </div>

            {/* TAB CONTENT 1: DETAILS */}
            {activeTab === 'details' && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 pt-2">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">التصنيف المرتبط:</span>
                    <span className="font-bold text-slate-800">
                      {product.categoryName || 'عام'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">حالة المخزون:</span>
                    <span className="font-bold text-slate-800">
                      {product.stockQuantity > 0
                        ? `متوفر (${product.stockQuantity} قطعة)`
                        : 'غير متوفر حالياً'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="mt-4 space-y-5">
                {/* Rating Overview Box */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="text-center sm:text-right">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900">{averageRating}</span>
                      <span className="text-xs text-slate-400">/ 5.0</span>
                    </div>
                    <div className="flex items-center text-amber-400 gap-0.5 my-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(Number(averageRating))
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      بناءً على {reviews.length} تقييم حقيقي
                    </span>
                  </div>

                  <div className="text-left text-xs">
                    <span className="text-[11px] text-slate-400 block">رضا العملاء</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {reviews.length > 0
                        ? `${Math.round(
                            (reviews.filter((r) => r.rating >= 4).length / reviews.length) * 100
                          )}% راضون`
                        : '100% موثوق'}
                    </span>
                  </div>
                </div>

                {/* Submit New Review Form */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>أضف تقييمك ورأيك في المنتج</span>
                  </h4>

                  {!currentUser ? (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <span>يتطلب ترك تقييم تسجيل الدخول بحسابك في المتجر</span>
                      <button
                        onClick={() => {
                          onClose();
                          if (onOpenAuth) onOpenAuth();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>تسجيل الدخول الآن</span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleAddReview} className="space-y-3">
                      {reviewError && (
                        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{reviewError}</span>
                        </div>
                      )}

                      {reviewSuccess && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>تم إرسال ونشر تقييمك بنجاح! شكراً لمشاركتنا رأيك.</span>
                        </div>
                      )}

                      {/* Interactive Stars Picker */}
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">اختر عدد النجوم:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setNewRating(star)}
                              className="p-1 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= (hoverRating || newRating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-slate-700 mr-2">
                            {ratingDescriptions[hoverRating || newRating]}
                          </span>
                        </div>
                      </div>

                      {/* Comment text area */}
                      <div>
                        <textarea
                          rows={2}
                          required
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="اكتب تجربتك مع المنتج (الجودة، الرائحة، التوصيل، التغليف...)"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-emerald-600 transition-colors"
                        />
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <span className="text-[11px] text-slate-400">
                          نشر باسم: {userProfile?.name || currentUser.displayName || 'عميل المتجر'}
                        </span>
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {submittingReview ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري النشر...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5 rotate-180" />
                              <span>إرسال التقييم</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Reviews List */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-700">
                    آراء وتجارب العملاء السابقة ({reviews.length})
                  </h4>

                  {loadingReviews ? (
                    <div className="py-6 flex items-center justify-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    </div>
                  ) : reviews.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">
                      لا توجد تقييمات لهذا المنتج بعد. كن أول من يشاركنا رأيه!
                    </p>
                  ) : (
                    reviews.map((rev) => {
                      const isAuthor = currentUser?.uid === rev.userId;
                      const canDelete = isAuthor || isSuperAdmin || isManager;
                      return (
                        <div
                          key={rev.id}
                          className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                                {rev.userName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">
                                  {rev.userName}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(rev.createdAt).toLocaleDateString('ar-SA', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Stars */}
                              <div className="flex items-center text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${
                                      s <= rev.rating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>

                              {/* Delete button */}
                              {canDelete && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm('هل تريد حذف هذا التقييم؟')) {
                                      await deleteReview(rev.id, product.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                  title="حذف التقييم"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed pr-9">
                            {rev.comment}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action section (Add to cart & quantity) */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            {!isOutOfStock && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700">الكمية المطلوبة:</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1.5 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-bold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                    className="p-1.5 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 active:scale-98 cursor-pointer'
              }`}
              style={
                !isOutOfStock && !added
                  ? { backgroundColor: 'var(--color-primary, #059669)' }
                  : undefined
              }
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تمت الإضافة للسلة!</span>
                </>
              ) : isOutOfStock ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>المنتج غير متوفر حالياً</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>أضف إلى السلة ({(currentPrice * quantity).toLocaleString('ar-SA')} ر.س)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
