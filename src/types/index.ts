export type UserRole = 'super_admin' | 'admin' | 'manager' | 'customer';

export interface UserPermissions {
  userId: string;
  branding: boolean; // الهوية البصرية والألوان (Theme Engine)
  products: boolean; // إدارة المنتجات
  categories: boolean; // إدارة التصنيفات
  orders: boolean; // إدارة الطلبات
  users: boolean; // إدارة المستخدمين
  updatedAt?: string;
  updatedBy?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  is_blocked?: boolean;
  phone?: string;
  wishlist?: string[];
  createdAt: string;
}

export interface StoreSettings {
  id?: string;
  store_name: string;
  logo_url: string;
  favicon_url: string;
  description: string;
  announcement_text: string;
  announcement_enabled: boolean;
  primary_color: string;
  secondary_color: string;
  bg_color: string;
  card_bg_color: string;
  text_color: string;
  headings_color?: string;
  contact_email: string;
  contact_phone: string;
  footer_text: string;
  social_links: {
    twitter?: string;
    instagram?: string;
    whatsapp?: string;
    snapchat?: string;
    facebook?: string;
    tiktok?: string;
  };
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  icon_name?: string; // Lucide icon name
  icon?: string; // backward compat
  is_active?: boolean;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  price: number;
  sale_price?: number | null;
  description: string;
  imageUrl: string;
  images?: string[];
  categoryId: string;
  category_ids?: string[];
  categoryName?: string;
  stockQuantity: number;
  is_active?: boolean;
  featured?: boolean;
  rating?: number;
  reviewsCount?: number;
  createdAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  createdAt: string;
}
