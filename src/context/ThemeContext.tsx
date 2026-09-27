import React, { createContext, useContext, useEffect, useState } from 'react';
import { StoreSettings } from '../types';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: 'متجر عرب',
  logo_url: '',
  favicon_url: '',
  description: 'المنصة العربية الرائدة للتسوق الفاخر وتجربة التجارة الإلكترونية المتكاملة مع شحن فوري ودفع آمن.',
  announcement_text: 'أهلاً بكم في متجر عرب — شحن مجاني لكافة الطلبات فوق 250 ر.س | دفع آمن عند الاستلام',
  announcement_enabled: true,
  primary_color: '#059669', // Emerald
  secondary_color: '#d97706', // Amber gold
  bg_color: '#f8fafc',
  card_bg_color: '#ffffff',
  text_color: '#0f172a',
  headings_color: '#022c22',
  contact_email: 'support@matjar-arab.com',
  contact_phone: '+966 50 123 4567',
  footer_text: 'جميع الحقوق محفوظة لمتجر عرب. منصة التسوق العربية المتكاملة المصممة لتوفير أفضل تجربة تسوق إلكتروني.',
  social_links: {
    twitter: 'https://twitter.com',
    instagram: 'https://instagram.com',
    whatsapp: 'https://wa.me/966501234567',
    snapchat: '',
    facebook: '',
    tiktok: '',
  },
};

interface ThemeContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Subscribe to settings doc in Firestore
  useEffect(() => {
    const docRef = doc(db, 'settings', 'store_settings');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as StoreSettings;
          setSettings({
            ...DEFAULT_SETTINGS,
            ...data,
            social_links: {
              ...DEFAULT_SETTINGS.social_links,
              ...(data.social_links || {}),
            },
          });
        } else {
          // Initialize default settings in Firestore
          setDoc(docRef, DEFAULT_SETTINGS).catch((err) =>
            console.warn('Could not initialize default settings:', err)
          );
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Error loading store settings:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Apply CSS Variables and title/favicon whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', settings.primary_color || '#059669');
    root.style.setProperty('--color-secondary', settings.secondary_color || '#d97706');
    root.style.setProperty('--color-bg', settings.bg_color || '#f8fafc');
    root.style.setProperty('--color-card', settings.card_bg_color || '#ffffff');
    root.style.setProperty('--color-text', settings.text_color || '#0f172a');
    root.style.setProperty('--color-headings', settings.headings_color || '#022c22');

    // Sync title
    if (settings.store_name) {
      document.title = `${settings.store_name} | المتجر الإلكتروني`;
    }

    // Sync favicon if provided
    if (settings.favicon_url) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.favicon_url;
    }
  }, [settings]);

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const docRef = doc(db, 'settings', 'store_settings');
    const updated = {
      ...settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, updated, { merge: true });
    setSettings(updated);
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
