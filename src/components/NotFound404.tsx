import React from 'react';
import { FileQuestion, ArrowRight, Home, ShoppingBag } from 'lucide-react';

interface NotFound404Props {
  onGoHome?: () => void;
}

export const NotFound404: React.FC<NotFound404Props> = ({ onGoHome }) => {
  const handleHomeClick = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-800 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-slate-100 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-6 shadow-inner">
            <FileQuestion className="w-10 h-10 text-slate-400" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-mono text-xs font-bold mb-3 border border-slate-200">
            HTTP 404 NOT FOUND
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
            الصفحة غير موجودة
          </h1>

          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            عذراً، الرابط أو الصفحة التي تحاول الوصول إليها غير متوفرة، قد تكون أُزيلت أو تم نقلها إلى عنوان آخر.
          </p>

          <button
            onClick={handleHomeClick}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>العودة إلى الصفحة الرئيسية للمتجر</span>
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
        <ShoppingBag className="w-3.5 h-3.5" />
        <span>جميع الحقوق محفوظة &copy; متجر عرب</span>
      </div>
    </div>
  );
};
