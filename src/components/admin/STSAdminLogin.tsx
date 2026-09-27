import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getUserProfile,
  getUserPermissions,
  saveUserProfile,
  saveUserPermissions,
} from '../../services/db';

interface STSAdminLoginProps {
  onLoginSuccess: () => void;
  onGoToStore: () => void;
}

export const STSAdminLogin: React.FC<STSAdminLoginProps> = ({
  onLoginSuccess,
  onGoToStore,
}) => {
  const { loginWithEmail, logout } = useAuth();

  const [identifier, setIdentifier] = useState('1007363904');
  const [password, setPassword] = useState('139213');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      setErrorMessage('يرجى ملء جميع الحقول للمتابعة.');
      return;
    }

    setLoading(true);

    try {
      // 1. Designated Super Admin account handling (1007363904 / 139213)
      const isDesignatedSuperAdmin =
        trimmedIdentifier === '1007363904' ||
        trimmedIdentifier.toLowerCase() === '1007363904@arabstore.com';

      if (isDesignatedSuperAdmin) {
        const adminEmail = '1007363904@arabstore.com';
        const { auth } = await import('../../firebase');
        const { signInWithEmailAndPassword, createUserWithEmailAndPassword } =
          await import('firebase/auth');

        try {
          await signInWithEmailAndPassword(auth, adminEmail, password);
        } catch (signInErr: any) {
          // If the account does not exist in Firebase Auth yet, auto-provision it
          if (
            signInErr?.code === 'auth/user-not-found' ||
            signInErr?.code === 'auth/invalid-credential' ||
            signInErr?.code === 'auth/wrong-password'
          ) {
            try {
              await createUserWithEmailAndPassword(auth, adminEmail, password);
            } catch (createErr: any) {
              if (createErr?.code === 'auth/email-already-in-use') {
                await signInWithEmailAndPassword(auth, adminEmail, password);
              } else {
                throw signInErr;
              }
            }
          } else {
            throw signInErr;
          }
        }

        const currentUser = auth.currentUser;
        if (currentUser) {
          await saveUserProfile({
            uid: currentUser.uid,
            name: 'السوبر أدمن (1007363904)',
            email: adminEmail,
            role: 'super_admin',
            is_blocked: false,
            wishlist: [],
            createdAt: new Date().toISOString(),
          });

          await saveUserPermissions({
            userId: currentUser.uid,
            branding: true,
            products: true,
            categories: true,
            orders: true,
            users: true,
          });
        }

        onLoginSuccess();
        return;
      }

      // 2. Generic staff and admin usernames/emails
      let emailToUse = trimmedIdentifier;
      if (!trimmedIdentifier.includes('@')) {
        if (
          trimmedIdentifier.toLowerCase() === 'dd0229662' ||
          trimmedIdentifier.toLowerCase() === 'admin'
        ) {
          emailToUse = 'dd0229662@gmail.com';
        } else {
          emailToUse = `${trimmedIdentifier.toLowerCase()}@arabstore.com`;
        }
      }

      // Authenticate with Firebase Auth
      await loginWithEmail(emailToUse, password);

      // Strict Role & Authorization Verification
      const { auth } = await import('../../firebase');
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('تعذر إتمام المصادقة، يرجى المحاولة لاحقاً.');
      }

      const profile = await getUserProfile(currentUser.uid);
      const permissions = await getUserPermissions(currentUser.uid);

      const isSuper =
        profile?.role === 'super_admin' ||
        profile?.role === 'admin' ||
        currentUser.email?.toLowerCase() === 'dd0229662@gmail.com' ||
        currentUser.email?.toLowerCase() === '1007363904@arabstore.com';
      const isMgr = profile?.role === 'manager';
      const hasAnyCustomPermission = Boolean(
        permissions &&
          (permissions.branding ||
            permissions.products ||
            permissions.categories ||
            permissions.orders ||
            permissions.users)
      );

      const isAuthorized = isSuper || isMgr || hasAnyCustomPermission;

      if (!isAuthorized) {
        await logout();
        setErrorMessage(
          'وصول مرفوض (403): هذا الحساب لا يملك تصريحاً إدارياً لدخول بوابة STS.'
        );
        setLoading(false);
        return;
      }

      onLoginSuccess();
    } catch (err: any) {
      console.error('STS Login error:', err);
      const msg =
        err?.message || 'فشل تسجيل الدخول. تحقق من اسم المستخدم وكلمة المرور.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white relative overflow-hidden text-right">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Return to store minimal button */}
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={onGoToStore}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-all cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لمتجر العملاء</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Portal Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/20 mb-4 border border-emerald-400/30">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-widest bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
              STS GATEWAY v2.4
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            بوابة الإدارة والتحكم
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            منظومة إدارة وتشغيل «متجر عرب» الموحدة للمسؤولين
          </p>
        </div>

        {/* Super Admin Quick Credentials Badge */}
        <div className="mb-4 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>حساب السوبر أدمن المعتمد:</span>
          </div>
          <div className="font-mono font-bold text-emerald-200">
            1007363904 / 139213
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username or Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم المستخدم أو البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="مثال: 1007363904 أو admin"
                  className="w-full pl-4 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
                  autoComplete="username"
                  dir="auto"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                كلمة المرور الإدارية
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  autoComplete="current-password"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Security Tip */}
            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>اتصال إداري مشفر بتقنية 256-bit SSL</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ التحقق والمصادقة الإدارية...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>تسجيل الدخول إلى لوحة STS</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer Notice */}
        <div className="mt-8 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Terminal className="w-3 h-3 text-slate-600" />
          <span>
            نظام حماية STS | مسار محمي ومراقب أمنياً على مدار الساعة
          </span>
        </div>
      </div>
    </div>
  );
};
