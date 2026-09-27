import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        await loginWithEmail(email.trim(), password);
      } else {
        if (!name.trim()) {
          setError('يرجى إدخال اسمك الكريم');
          setLoading(false);
          return;
        }
        await registerWithEmail(email.trim(), password, name.trim(), phone.trim());
      }
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err?.message || 'حدث خطأ أثناء المصادقة. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err?.message || 'تعذر تسجيل الدخول عبر Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-right animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {tab === 'login' ? 'مرحباً بك مجدداً في متجر عرب' : 'إنشاء حساب جديد'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {tab === 'login'
              ? 'سجل دخولك لمتابعة مشترياتك وإدارة حسابك'
              : 'انضم إلينا للاستمتاع بأفضل عروض وتجربة تسوق فريدة'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            إنشاء حساب
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  الاسم الكامل *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="محمد عبدالله"
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-colors"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  رقم الجوال
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-colors text-left dir-ltr"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              البريد الإلكتروني *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              كلمة المرور *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 rounded-xl text-sm outline-none transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : tab === 'login' ? (
              <>
                <span>دخول</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            ) : (
              <span>تأكيد التسجيل</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-slate-400">أو المتابعة السريعة عبر</span>
          </div>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>المتابعة عبر حساب Google</span>
        </button>
      </div>
    </div>
  );
};
