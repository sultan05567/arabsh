import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Category, Product, Order, UserProfile, OrderStatus, UserRole, StoreSettings, Review, UserPermissions } from '../types';

/* ======================================================
   CATEGORIES SERVICES
   ====================================================== */

export async function getCategories(): Promise<Category[]> {
  const colPath = 'categories';
  try {
    const snap = await getDocs(collection(db, colPath));
    const categories: Category[] = [];
    snap.forEach((d) => {
      const data = d.data();
      categories.push({
        id: d.id,
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        description: data.description || '',
        icon_name: data.icon_name || data.icon || 'ShoppingBag',
        icon: data.icon_name || data.icon || 'ShoppingBag',
        is_active: data.is_active !== false,
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });
    return categories;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, colPath);
  }
}

export function subscribeCategories(callback: (categories: Category[]) => void) {
  const colPath = 'categories';
  return onSnapshot(
    collection(db, colPath),
    (snap) => {
      const items: Category[] = [];
      snap.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          name: data.name,
          slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
          description: data.description || '',
          icon_name: data.icon_name || data.icon || 'ShoppingBag',
          icon: data.icon_name || data.icon || 'ShoppingBag',
          is_active: data.is_active !== false,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export async function addCategory(category: Omit<Category, 'id'>): Promise<string> {
  const colPath = 'categories';
  try {
    const docRef = await addDoc(collection(db, colPath), {
      ...category,
      slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
      icon_name: category.icon_name || category.icon || 'ShoppingBag',
      is_active: category.is_active !== false,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const docPath = `categories/${id}`;
  try {
    const ref = doc(db, 'categories', id);
    await updateDoc(ref, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const docPath = `categories/${id}`;
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/* ======================================================
   PRODUCTS SERVICES
   ====================================================== */

export async function getProducts(): Promise<Product[]> {
  const colPath = 'products';
  try {
    const snap = await getDocs(collection(db, colPath));
    const products: Product[] = [];
    snap.forEach((d) => {
      const data = d.data();
      products.push({
        id: d.id,
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        price: Number(data.price),
        sale_price: data.sale_price ? Number(data.sale_price) : null,
        description: data.description || '',
        imageUrl: data.imageUrl || (data.images && data.images[0]) || '',
        images: data.images || (data.imageUrl ? [data.imageUrl] : []),
        categoryId: data.categoryId || '',
        category_ids: data.category_ids || (data.categoryId ? [data.categoryId] : []),
        categoryName: data.categoryName || '',
        stockQuantity: Number(data.stockQuantity ?? data.stock ?? 0),
        is_active: data.is_active !== false,
        featured: Boolean(data.featured),
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });
    return products;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, colPath);
  }
}

export function subscribeProducts(callback: (products: Product[]) => void) {
  const colPath = 'products';
  return onSnapshot(
    collection(db, colPath),
    (snap) => {
      const items: Product[] = [];
      snap.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          name: data.name,
          slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
          price: Number(data.price),
          sale_price: data.sale_price ? Number(data.sale_price) : null,
          description: data.description || '',
          imageUrl: data.imageUrl || (data.images && data.images[0]) || '',
          images: data.images || (data.imageUrl ? [data.imageUrl] : []),
          categoryId: data.categoryId || '',
          category_ids: data.category_ids || (data.categoryId ? [data.categoryId] : []),
          categoryName: data.categoryName || '',
          stockQuantity: Number(data.stockQuantity ?? data.stock ?? 0),
          is_active: data.is_active !== false,
          featured: Boolean(data.featured),
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<string> {
  const colPath = 'products';
  try {
    const docRef = await addDoc(collection(db, colPath), {
      ...product,
      slug: product.slug || product.name.toLowerCase().replace(/\s+/g, '-'),
      images: product.images || (product.imageUrl ? [product.imageUrl] : []),
      is_active: product.is_active !== false,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const docPath = `products/${id}`;
  try {
    const ref = doc(db, 'products', id);
    await updateDoc(ref, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const docPath = `products/${id}`;
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/* ======================================================
   ORDERS SERVICES
   ====================================================== */

export async function getOrders(): Promise<Order[]> {
  const colPath = 'orders';
  try {
    const snap = await getDocs(collection(db, colPath));
    const orders: Order[] = [];
    snap.forEach((d) => {
      const data = d.data();
      orders.push({
        id: d.id,
        userId: data.userId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || '',
        shippingAddress: data.shippingAddress || '',
        city: data.city || '',
        items: data.items || [],
        totalAmount: Number(data.totalAmount),
        status: data.status || 'pending',
        paymentMethod: data.paymentMethod || 'الدفع عند الاستلام',
        createdAt: data.createdAt || new Date().toISOString(),
      });
    });
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return orders;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, colPath);
  }
}

export function subscribeOrders(callback: (orders: Order[]) => void) {
  const colPath = 'orders';
  return onSnapshot(
    collection(db, colPath),
    (snap) => {
      const orders: Order[] = [];
      snap.forEach((d) => {
        const data = d.data();
        orders.push({
          id: d.id,
          userId: data.userId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone || '',
          shippingAddress: data.shippingAddress || '',
          city: data.city || '',
          items: data.items || [],
          totalAmount: Number(data.totalAmount),
          status: data.status || 'pending',
          paymentMethod: data.paymentMethod || 'الدفع عند الاستلام',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(orders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export async function createOrder(orderData: Omit<Order, 'id'>): Promise<string> {
  const colPath = 'orders';
  try {
    const docRef = await addDoc(collection(db, colPath), {
      ...orderData,
      createdAt: new Date().toISOString(),
    });

    // Reduce inventory in real-time
    for (const item of orderData.items) {
      if (item.productId) {
        try {
          const productRef = doc(db, 'products', item.productId);
          await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (productDoc.exists()) {
              const currentStock = Number(productDoc.data().stockQuantity ?? productDoc.data().stock ?? 0);
              const newStock = Math.max(0, currentStock - item.quantity);
              transaction.update(productRef, { stockQuantity: newStock, stock: newStock });
            }
          });
        } catch (stockErr) {
          console.warn('Failed to decrement stock for product:', item.productId, stockErr);
        }
      }
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const docPath = `orders/${orderId}`;
  try {
    const ref = doc(db, 'orders', orderId);
    await updateDoc(ref, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

/* ======================================================
   REVIEWS & RATINGS SERVICES
   ====================================================== */

export async function getReviews(productId?: string): Promise<Review[]> {
  const colPath = 'reviews';
  try {
    let q = collection(db, colPath);
    const snap = await getDocs(q);
    const reviews: Review[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (!productId || data.productId === productId) {
        reviews.push({
          id: d.id,
          productId: data.productId,
          userId: data.userId,
          userName: data.userName || 'عميل المتجر',
          rating: Number(data.rating) || 5,
          comment: data.comment || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      }
    });
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reviews;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, colPath);
  }
}

export function subscribeReviews(productId: string, callback: (reviews: Review[]) => void) {
  const colPath = 'reviews';
  return onSnapshot(
    collection(db, colPath),
    (snap) => {
      const reviews: Review[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.productId === productId) {
          reviews.push({
            id: d.id,
            productId: data.productId,
            userId: data.userId,
            userName: data.userName || 'عميل المتجر',
            rating: Number(data.rating) || 5,
            comment: data.comment || '',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        }
      });
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(reviews);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export function subscribeAllReviews(callback: (reviews: Review[]) => void) {
  const colPath = 'reviews';
  return onSnapshot(
    collection(db, colPath),
    (snap) => {
      const reviews: Review[] = [];
      snap.forEach((d) => {
        const data = d.data();
        reviews.push({
          id: d.id,
          productId: data.productId,
          userId: data.userId,
          userName: data.userName || 'عميل المتجر',
          rating: Number(data.rating) || 5,
          comment: data.comment || '',
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(reviews);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export async function addReview(reviewData: Omit<Review, 'id'>): Promise<string> {
  const colPath = 'reviews';
  try {
    const docRef = await addDoc(collection(db, colPath), {
      ...reviewData,
      createdAt: new Date().toISOString(),
    });

    // Update product rating and reviewsCount in the product document
    try {
      const allProductReviews = await getReviews(reviewData.productId);
      const total = allProductReviews.reduce((sum, r) => sum + r.rating, 0);
      const count = allProductReviews.length;
      const avg = count > 0 ? Number((total / count).toFixed(1)) : 5;
      await updateDoc(doc(db, 'products', reviewData.productId), {
        rating: avg,
        reviewsCount: count,
      });
    } catch (e) {
      console.warn('Could not update aggregated product rating:', e);
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function deleteReview(reviewId: string, productId?: string): Promise<void> {
  const docPath = `reviews/${reviewId}`;
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));

    if (productId) {
      try {
        const allProductReviews = await getReviews(productId);
        const total = allProductReviews.reduce((sum, r) => sum + r.rating, 0);
        const count = allProductReviews.length;
        const avg = count > 0 ? Number((total / count).toFixed(1)) : 0;
        await updateDoc(doc(db, 'products', productId), {
          rating: avg,
          reviewsCount: count,
        });
      } catch (e) {
        console.warn('Could not update aggregated product rating on delete:', e);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/* ======================================================
   USERS & RBAC SERVICES
   ====================================================== */

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docPath = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const docPath = `users/${profile.uid}`;
  try {
    const ref = doc(db, 'users', profile.uid);
    await setDoc(ref, profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function getUsers(): Promise<UserProfile[]> {
  const colPath = 'users';
  try {
    const snap = await getDocs(collection(db, colPath));
    const users: UserProfile[] = [];
    snap.forEach((d) => {
      users.push(d.data() as UserProfile);
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, colPath);
  }
}

export function subscribeUsers(callback: (users: UserProfile[]) => void) {
  const colPath = 'users';
  return onSnapshot(
    collection(db, colPath),
    (snap) => {
      const users: UserProfile[] = [];
      snap.forEach((d) => {
        users.push(d.data() as UserProfile);
      });
      callback(users);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const docPath = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, { role });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function toggleUserBlock(uid: string, is_blocked: boolean): Promise<void> {
  const docPath = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, { is_blocked });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function toggleWishlistItem(uid: string, productId: string): Promise<string[]> {
  const docPath = `users/${uid}`;
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    let wishlist: string[] = snap.exists() ? (snap.data().wishlist || []) : [];
    if (wishlist.includes(productId)) {
      wishlist = wishlist.filter((id) => id !== productId);
    } else {
      wishlist.push(productId);
    }
    await updateDoc(ref, { wishlist });
    return wishlist;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

/* ======================================================
   USER PERMISSIONS SERVICES (user_permissions collection)
   ====================================================== */

export function getDefaultUserPermissions(role?: UserRole): Omit<UserPermissions, 'userId'> {
  if (role === 'super_admin' || role === 'admin') {
    return {
      branding: true,
      products: true,
      categories: true,
      orders: true,
      users: true,
    };
  }
  if (role === 'manager') {
    return {
      branding: false,
      products: true,
      categories: true,
      orders: true,
      users: false,
    };
  }
  return {
    branding: false,
    products: false,
    categories: false,
    orders: false,
    users: false,
  };
}

export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  const docPath = `user_permissions/${userId}`;
  try {
    const ref = doc(db, 'user_permissions', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as UserPermissions;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    return null;
  }
}

export async function saveUserPermissions(permissions: UserPermissions): Promise<void> {
  const docPath = `user_permissions/${permissions.userId}`;
  try {
    const ref = doc(db, 'user_permissions', permissions.userId);
    await setDoc(
      ref,
      {
        ...permissions,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export function subscribeUserPermissions(
  userId: string,
  callback: (permissions: UserPermissions | null) => void
) {
  const docPath = `user_permissions/${userId}`;
  return onSnapshot(
    doc(db, 'user_permissions', userId),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as UserPermissions);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  );
}

export function subscribeAllUserPermissions(
  callback: (permissionsMap: Record<string, UserPermissions>) => void
) {
  const colPath = 'user_permissions';
  return onSnapshot(
    collection(db, colPath),
    (snap) => {
      const map: Record<string, UserPermissions> = {};
      snap.forEach((d) => {
        map[d.id] = d.data() as UserPermissions;
      });
      callback(map);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

/* ======================================================
   SEED CATALOG DATA (DIRECTLY TO FIRESTORE)
   ====================================================== */

export async function seedInitialStoreData(): Promise<{ categoriesCount: number; productsCount: number }> {
  const sampleCategories: Omit<Category, 'id'>[] = [
    {
      name: 'عطور وبخور عربية',
      slug: 'arabian-perfumes',
      description: 'أرقى نفحات العود والمسك والعنبر والبخور الفاخر المستوحى من التراث العربي الأصيل',
      icon_name: 'Sparkles',
      is_active: true,
    },
    {
      name: 'قهوة ومشروبات تراثية',
      slug: 'traditional-coffee',
      description: 'محاصيل البن الخولاني الفاخر مع أطقم دلال القهوة النحاسية المذهبة',
      icon_name: 'Coffee',
      is_active: true,
    },
    {
      name: 'أجهزة وإلكترونيات ذكية',
      slug: 'smart-electronics',
      description: 'أحدث الهواتف الذكية، السماعات اللاسلكية والإكسسوارات التقنية العصرية',
      icon_name: 'Smartphone',
      is_active: true,
    },
    {
      name: 'ساعات وإكسسوارات ملكية',
      slug: 'luxury-watches',
      description: 'ساعات فاخرة كلاسيكية وعصرية بتصاميم استثنائية مع كبكات وأساور أنيقة',
      icon_name: 'Watch',
      is_active: true,
    },
    {
      name: 'أزياء وعبايات تراثية',
      slug: 'traditional-fashion',
      description: 'أشمغة وثياب فاخرة وعبايات مميزة مطرزة بأيدي حرفيين مهرة',
      icon_name: 'Shirt',
      is_active: true,
    },
  ];

  const categoryIdMap: Record<string, string> = {};
  for (const cat of sampleCategories) {
    const id = await addCategory(cat);
    categoryIdMap[cat.name] = id;
  }

  const sampleProducts: Omit<Product, 'id'>[] = [
    {
      name: 'عطر خشب العود الملكي (Royal Oud 100ml)',
      slug: 'royal-oud-100ml',
      price: 420,
      sale_price: 345,
      description: 'عطر فاخر يمزج خشب العود المعتق مع لمسات الباتشولي والورد الدمشقي لنفحات تدوم طوال اليوم وتترك بصمة لا تُنسى.',
      imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: categoryIdMap['عطور وبخور عربية'] || '',
      category_ids: [categoryIdMap['عطور وبخور عربية'] || ''],
      categoryName: 'عطور وبخور عربية',
      stockQuantity: 24,
      is_active: true,
      featured: true,
    },
    {
      name: 'بخور مروكي سوبر طبيعي (أوقية فاخرة)',
      slug: 'moroki-super-oud',
      price: 220,
      sale_price: 180,
      description: 'أعواد بخور مروكي سوبر طبيعي نقي 100%، فوحان قوي وثبات عالي مناسب للمناسبات والمجالس العربية الأصيلة.',
      imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: categoryIdMap['عطور وبخور عربية'] || '',
      category_ids: [categoryIdMap['عطور وبخور عربية'] || ''],
      categoryName: 'عطور وبخور عربية',
      stockQuantity: 40,
      is_active: true,
      featured: true,
    },
    {
      name: 'بن خولاني سعودي فاخر محمص ومطحون (500 جم)',
      slug: 'khawlani-saudi-coffee',
      price: 110,
      sale_price: 95,
      description: 'قهوة سعودية أصيلة من مزارع جازان الخولانية المحمصة بعناية مع توليفة الزعفران والهيل الطبيعي الفاخر.',
      imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: categoryIdMap['قهوة ومشروبات تراثية'] || '',
      category_ids: [categoryIdMap['قهوة ومشروبات تراثية'] || ''],
      categoryName: 'قهوة ومشروبات تراثية',
      stockQuantity: 35,
      is_active: true,
      featured: true,
    },
    {
      name: 'طقم دلة القهوة العربية النحاسية المنقوشة مع 6 فناجين',
      slug: 'brass-arabic-dallah-set',
      price: 350,
      sale_price: 290,
      description: 'دلة عربية مذهبة ومصنوعة من النحاس الخالص المقاوم للحرارة مع 6 فناجين فخمة بزخارف إسلامية ملكية.',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: categoryIdMap['قهوة ومشروبات تراثية'] || '',
      category_ids: [categoryIdMap['قهوة ومشروبات تراثية'] || ''],
      categoryName: 'قهوة ومشروبات تراثية',
      stockQuantity: 15,
      is_active: true,
      featured: false,
    },
    {
      name: 'سماعات إلغاء الضوضاء اللاسلكية برو مع صوت محيطي',
      slug: 'noise-cancelling-headphones-pro',
      price: 599,
      sale_price: 520,
      description: 'سماعات رأس مريحة بتقنية عزل الصوت المتقدم وصوت محيطي نقي وعمر بطارية يدوم حتى 40 ساعة متواصلة.',
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: categoryIdMap['أجهزة وإلكترونيات ذكية'] || '',
      category_ids: [categoryIdMap['أجهزة وإلكترونيات ذكية'] || ''],
      categoryName: 'أجهزة وإلكترونيات ذكية',
      stockQuantity: 18,
      is_active: true,
      featured: true,
    },
    {
      name: 'ساعة يد أوتوماتيكية كلاسيكية بإطار ذهبي وسوار جلدي',
      slug: 'classic-gold-watch',
      price: 890,
      sale_price: 780,
      description: 'ساعة فخمة بميناء أنيق من الياقوت المقاوم للخدش وسوار جلدي طبيعي فاخر مقاوم للماء حتى عمق 50 متراً.',
      imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
      ],
      categoryId: categoryIdMap['ساعات وإكسسوارات ملكية'] || '',
      category_ids: [categoryIdMap['ساعات وإكسسوارات ملكية'] || ''],
      categoryName: 'ساعات وإكسسوارات ملكية',
      stockQuantity: 10,
      is_active: true,
      featured: true,
    },
  ];

  const createdProductIds: string[] = [];
  for (const prod of sampleProducts) {
    const pId = await addProduct(prod);
    createdProductIds.push(pId);
  }

  // Seed sample verified customer reviews
  if (createdProductIds[0]) {
    await addReview({
      productId: createdProductIds[0],
      userId: 'customer_sample_1',
      userName: 'عبدالرحمن الشمري',
      rating: 5,
      comment: 'عطر خيالي وثباته عالي جداً لأكثر من 24 ساعة، رائحة العود الملكي أصلية ومميزة وأنصح به بشدة!',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    });
    await addReview({
      productId: createdProductIds[0],
      userId: 'customer_sample_2',
      userName: 'سارة القحطاني',
      rating: 5,
      comment: 'تغليف فاخر وفوحان استثنائي. وصل في أقل من يومين، شكراً متجر عرب على المصداقية.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    });
  }

  if (createdProductIds[2]) {
    await addReview({
      productId: createdProductIds[2],
      userId: 'customer_sample_3',
      userName: 'فهد الدوسري',
      rating: 5,
      comment: 'بن خولاني حقيقي أصيل طعمه ونكهته بالرأس مع الهيل والزعفران، جودة لا يعلى عليها.',
      createdAt: new Date().toISOString(),
    });
  }

  return {
    categoriesCount: sampleCategories.length,
    productsCount: sampleProducts.length,
  };
}
