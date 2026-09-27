import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import {
  getUserProfile,
  saveUserProfile,
  toggleWishlistItem,
  subscribeUserPermissions,
  getDefaultUserPermissions,
} from '../services/db';
import { UserProfile, UserRole, UserPermissions } from '../types';

export type DashboardTabKey = 'branding' | 'products' | 'categories' | 'orders' | 'users';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  userPermissions: UserPermissions | null;
  effectivePermissions: UserPermissions;
  hasTabPermission: (tab: DashboardTabKey) => boolean;
  isSuperAdmin: boolean;
  isManager: boolean;
  canManageStore: boolean;
  canEditTheme: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setProfileRole: (role: UserRole) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin bootstrapped emails from environment/runtime
export const BOOTSTRAP_ADMIN_EMAIL = 'dd0229662@gmail.com';
export const SUPER_ADMIN_USERNAME = '1007363904';
export const SUPER_ADMIN_EMAIL = '1007363904@arabstore.com';

export const isSuperAdminEmailOrUser = (email?: string | null, name?: string | null) => {
  if (!email && !name) return false;
  const emailLower = email?.toLowerCase() || '';
  return (
    emailLower === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
    emailLower === SUPER_ADMIN_EMAIL.toLowerCase() ||
    emailLower.startsWith('1007363904@') ||
    name === SUPER_ADMIN_USERNAME ||
    name?.includes('1007363904')
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to live user permissions whenever user changes
  useEffect(() => {
    if (!currentUser) {
      setUserPermissions(null);
      return;
    }
    const unsubscribe = subscribeUserPermissions(currentUser.uid, (perm) => {
      setUserPermissions(perm);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          let profile = await getUserProfile(user.uid);
          const isSuperUser = isSuperAdminEmailOrUser(user.email, user.displayName);

          if (!profile) {
            profile = {
              uid: user.uid,
              name: isSuperUser
                ? 'السوبر أدمن (1007363904)'
                : user.displayName || user.email?.split('@')[0] || 'مستخدم جديد',
              email: user.email || '',
              role: isSuperUser ? 'super_admin' : 'customer',
              is_blocked: false,
              wishlist: [],
              createdAt: new Date().toISOString(),
            };
            await saveUserProfile(profile);
          } else if (isSuperUser && profile.role !== 'super_admin' && profile.role !== 'admin') {
            profile.role = 'super_admin';
            await saveUserProfile(profile);
          }
          setUserProfile(profile);
        } catch (err) {
          console.error('Error fetching or creating user profile:', err);
          const isSuperUser = isSuperAdminEmailOrUser(user.email, user.displayName);
          setUserProfile({
            uid: user.uid,
            name: isSuperUser
              ? 'السوبر أدمن (1007363904)'
              : user.displayName || user.email?.split('@')[0] || 'مستخدم',
            email: user.email || '',
            role: isSuperUser ? 'super_admin' : 'customer',
            is_blocked: false,
            wishlist: [],
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const profile = await getUserProfile(res.user.uid);
      if (profile?.is_blocked) {
        await signOut(auth);
        throw new Error('تم حظر هذا الحساب من قبل إدارة المتجر. يرجى مراجعة الدعم الفني.');
      }
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed') {
        throw new Error('تسجيل الدخول بالبريد الإلكتروني بحاجة لتفعيل من لوحة Firebase Auth، يمكنك المتابعة عبر Google.');
      } else if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (error?.code === 'auth/invalid-email') {
        throw new Error('صيغة البريد الإلكتروني غير صالحة.');
      }
      throw error;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, phone?: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        await updateProfile(res.user, { displayName: name });
        const isBootstrapEmail = email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
        const profile: UserProfile = {
          uid: res.user.uid,
          name: name || 'مستخدم جديد',
          email: res.user.email || email,
          role: isBootstrapEmail ? 'super_admin' : 'customer',
          is_blocked: false,
          phone: phone || '',
          wishlist: [],
          createdAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
        setUserProfile(profile);
      }
    } catch (error: any) {
      if (error?.code === 'auth/email-already-in-use') {
        throw new Error('البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.');
      } else if (error?.code === 'auth/weak-password') {
        throw new Error('كلمة المرور ضعيفة جداً، يرجى إدخال 6 أحرف على الأقل.');
      }
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const profile = await getUserProfile(res.user.uid);
    if (profile?.is_blocked) {
      await signOut(auth);
      throw new Error('تم حظر هذا الحساب من قبل إدارة المتجر.');
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const setProfileRole = async (newRole: UserRole) => {
    if (userProfile && currentUser) {
      const updated = { ...userProfile, role: newRole };
      await saveUserProfile(updated);
      setUserProfile(updated);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!currentUser || !userProfile) return;
    const newWishlist = await toggleWishlistItem(currentUser.uid, productId);
    setUserProfile({
      ...userProfile,
      wishlist: newWishlist,
    });
  };

  const isWishlisted = (productId: string) => {
    return Boolean(userProfile?.wishlist?.includes(productId));
  };

  const isSuperAdmin = Boolean(
    userProfile?.role === 'super_admin' ||
    userProfile?.role === 'admin' ||
    isSuperAdminEmailOrUser(currentUser?.email, userProfile?.name)
  );
  const isManager = userProfile?.role === 'manager';

  // Check permission for a specific dashboard tab
  const hasTabPermission = (tab: DashboardTabKey): boolean => {
    // If user has a custom record in user_permissions, respect its boolean flag
    if (userPermissions && typeof userPermissions[tab] === 'boolean') {
      return userPermissions[tab];
    }
    // Default fallback based on role
    if (isSuperAdmin) {
      return true;
    }
    if (isManager) {
      return tab === 'products' || tab === 'categories' || tab === 'orders';
    }
    return false;
  };

  const effectivePermissions: UserPermissions = {
    userId: currentUser?.uid || '',
    branding: hasTabPermission('branding'),
    products: hasTabPermission('products'),
    categories: hasTabPermission('categories'),
    orders: hasTabPermission('orders'),
    users: hasTabPermission('users'),
  };

  // User can access admin dashboard if they are super admin, manager, or have at least one allowed tab
  const canManageStore =
    isSuperAdmin ||
    isManager ||
    Boolean(
      effectivePermissions.branding ||
        effectivePermissions.products ||
        effectivePermissions.categories ||
        effectivePermissions.orders ||
        effectivePermissions.users
    );

  const canEditTheme = hasTabPermission('branding');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        userPermissions,
        effectivePermissions,
        hasTabPermission,
        isSuperAdmin,
        isManager,
        canManageStore,
        canEditTheme,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        setProfileRole,
        toggleWishlist,
        isWishlisted,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
