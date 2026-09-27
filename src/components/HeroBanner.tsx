import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Truck, ShieldCheck, Clock, Award, ArrowLeft } from 'lucide-react';

interface HeroBannerProps {
  onExploreProducts: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExploreProducts }) => {
  const { settings } = useTheme();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-6 border border-slate-800 shadow-2xl">
      {/* Background radial aura using primary color */}
      <div
        className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-25"
        style={{ backgroundColor: 'var(--color-primary, #059669)' }}
      />
      <div
        className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: 'var(--color-secondary, #d97706)' }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-2xl text-right space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>منتجات عربية فاخرة مختارة بعناية لأجلك</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            أهلاً بكم في <br />
            <span
              className="bg-clip-text text-transparent bg-gradient-to-l from-emerald-400 via-teal-200 to-amber-300"
            >
              «{settings.store_name || 'متجر عرب'}»
            </span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
            {settings.description ||
              'اكتشف تشكيلة مختارة بعناية من العطور الملكية، القهوة السعودية الأصيلة، البخور الطبيعي، والأزياء والإلكترونيات العصرية بأسعار استثنائية مع شحن سريع وتوصيل لباب منزلك.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onExploreProducts}
              className="px-6 py-3 rounded-2xl font-black text-sm text-slate-950 shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: 'var(--color-secondary, #d97706)', color: '#ffffff' }}
            >
              <span>تسوق المجموعة الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature highlight cards */}
        <div className="w-full md:w-auto shrink-0 grid grid-cols-2 gap-3 sm:gap-4 text-right">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <Truck className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="font-bold text-sm text-white">توصيل سريع</h4>
            <p className="text-xs text-slate-400 mt-1">شحن مجاني للطلبات فوق 250 ر.س</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="font-bold text-sm text-white">ضمان أصلي 100%</h4>
            <p className="text-xs text-slate-400 mt-1">منتجات طبيعية ومعتمدة ومضمونة</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <Clock className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="font-bold text-sm text-white">دعم متواصل</h4>
            <p className="text-xs text-slate-400 mt-1">خدمة عملاء على مدار الساعة</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <Award className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="font-bold text-sm text-white">دفع آمن ومرن</h4>
            <p className="text-xs text-slate-400 mt-1">دفع عند الاستلام أو بمدى وفيزا</p>
          </div>
        </div>
      </div>
    </div>
  );
};
