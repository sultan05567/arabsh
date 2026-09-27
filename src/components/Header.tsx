import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  User,
  LogOut,
  PackageCheck,
  ChevronDown,
  Sparkles,
  Heart,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAuth: () => void;
  onOpenOrders: () => void;
  onOpenWishlist: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenAuth,
  onOpenOrders,
  onOpenWishlist,
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const { settings } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const wishlistCount = userProfile?.wishlist?.length || 0;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Announcement Bar */}
      {settings.announcement_enabled && settings.announcement_text && (
        <div
          className="text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 transition-colors"
          style={{ backgroundColor: 'var(--color-primary, #059669)' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>{settings.announcement_text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-3 text-right group cursor-pointer"
            >
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.store_name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-md group-hover:scale-105 transition-transform"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: 'var(--color-primary, #059669)' }}
                >
                  <ShoppingBag className="w-6 h-6" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 group-hover:opacity-85 transition-opacity">
                    {settings.store_name || 'متجر عرب'}
                  </h1>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm border uppercase"
                    style={{
                      backgroundColor: 'rgba(5, 150, 105, 0.1)',
                      color: 'var(--color-primary, #059669)',
                      borderColor: 'rgba(5, 150, 105, 0.2)',
                    }}
                  >
                    ARAB STORE
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-normal line-clamp-1 max-w-xs">
                  {settings.description || 'منصة التسوق العربية المتكاملة'}
                </p>
              </div>
            </button>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="ابحث عن منتج، عطر، قهوة، أجهزة، إلكترونيات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-full text-sm outline-none transition-all placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200/60"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Actions & Navigation - Pure Customer Storefront */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Wishlist Button */}
            <button
              onClick={onOpenWishlist}
              className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-300 text-slate-700 hover:text-red-600 transition-all cursor-pointer"
              title="قائمة المفضلة"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-bold text-xs min-w-5 h-5 rounded-full flex items-center justify-center px-1 border-2 border-white shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 transition-all cursor-pointer"
              title="سلة التسوق"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 text-white font-bold text-xs min-w-5 h-5 rounded-full flex items-center justify-center px-1 border-2 border-white shadow-xs"
                  style={{ backgroundColor: 'var(--color-primary, #059669)' }}
                >
                  {totalItems}
                </span>
              )}
            </button>

            {/* Customer Account Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 transition-all cursor-pointer"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: 'var(--color-primary, #059669)' }}
                  >
                    {userProfile?.name?.charAt(0) || currentUser.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold max-w-[100px] truncate">
                    {userProfile?.name?.split(' ')[0] || 'حسابي'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-xs text-slate-500 font-medium">مرحباً بك</p>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {userProfile?.name || 'عميل متجر عرب'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                    </div>

                    <div className="p-1">
                      <button
                        onClick={onOpenOrders}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg text-right transition-colors cursor-pointer"
                      >
                        <PackageCheck className="w-4 h-4 text-emerald-600" />
                        <span>طلباتي وفواتيري</span>
                      </button>

                      <button
                        onClick={onOpenWishlist}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg text-right transition-colors cursor-pointer"
                      >
                        <Heart className="w-4 h-4 text-red-500" />
                        <span>قائمة المفضلة ({wishlistCount})</span>
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-right transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-600" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
                style={{ backgroundColor: 'var(--color-primary, #059669)' }}
              >
                <User className="w-4 h-4" />
                <span>دخول / تسجيل</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="flex md:hidden pb-3">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="ابحث عن المنتجات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2 bg-slate-100 border border-slate-200 rounded-full text-sm outline-none placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
