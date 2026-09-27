import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getOrders } from '../services/db';
import { Order, OrderStatus } from '../types';
import {
  X,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertOctagon,
  Calendar,
  MapPin,
  Loader2,
  ShoppingBag,
  FileText,
  Printer,
  ChevronDown,
} from 'lucide-react';

interface OrdersHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_MAP: Record<
  OrderStatus,
  { label: string; color: string; icon: React.FC<{ className?: string }> }
> = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock },
  processing: { label: 'قيد التجهيز', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Package },
  shipped: { label: 'تم الشحن مع المندوب', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Truck },
  delivered: { label: 'تم التوصيل بنجاح', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertOctagon },
};

export const OrdersHistoryModal: React.FC<OrdersHistoryModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, isSuperAdmin, isManager } = useAuth();
  const { settings } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen, currentUser]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const allOrders = await getOrders();
      const userOrders =
        currentUser && !isSuperAdmin && !isManager
          ? allOrders.filter(
              (o) =>
                o.userId === currentUser.uid ||
                o.customerEmail.toLowerCase() === currentUser.email?.toLowerCase()
            )
          : allOrders;
      setOrders(userOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-right animate-in fade-in">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in zoom-in-95 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'var(--color-card, #ffffff)' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">سجل الطلبات والفواتير</h2>
              <p className="text-xs text-slate-500">استعراض تفاصيل المشتريات وطباعة الفواتير الضريبية</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (selectedInvoice) {
                setSelectedInvoice(null);
              } else {
                onClose();
              }
            }}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Invoice View Modal */}
          {selectedInvoice ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{settings.store_name}</h3>
                  <p className="text-xs text-slate-500">فاتورة شراء ضريبية مبسطة</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الفاتورة</span>
                </button>
              </div>

              {/* Invoice details */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-normal">رقم الطلب والفاتورة</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    #{selectedInvoice.id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-normal">تاريخ الشراء</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedInvoice.createdAt).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-normal">العميل المستلم</span>
                  <span className="font-bold text-slate-800">{selectedInvoice.customerName}</span>
                  <span className="text-slate-500 block">{selectedInvoice.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-normal">عنوان التوصيل</span>
                  <span className="font-bold text-slate-800">
                    {selectedInvoice.city} - {selectedInvoice.shippingAddress}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="p-3">المنتج</th>
                      <th className="p-3">السعر</th>
                      <th className="p-3">الكمية</th>
                      <th className="p-3">المجموع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="p-3 text-slate-600">{item.price.toLocaleString('ar-SA')} ر.س</td>
                        <td className="p-3 font-bold text-slate-800">{item.quantity}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {(item.price * item.quantity).toLocaleString('ar-SA')} ر.س
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-xs">
                    <tr>
                      <td colSpan={3} className="p-3 text-slate-600">
                        طريقة الدفع:
                      </td>
                      <td className="p-3 text-slate-800">{selectedInvoice.paymentMethod}</td>
                    </tr>
                    <tr className="text-sm">
                      <td colSpan={3} className="p-3 font-bold text-slate-900">
                        الإجمالي النهائي:
                      </td>
                      <td className="p-3 font-black text-emerald-700">
                        {selectedInvoice.totalAmount.toLocaleString('ar-SA')} ر.س
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  العودة لقائمة الطلبات
                </button>
                <span className="text-[11px] text-slate-400">
                  شكراً لاختياركم {settings.store_name}
                </span>
              </div>
            </div>
          ) : loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
              <p className="text-xs">جاري تحميل سجل الطلبات...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700 text-base mb-1">لا توجد طلبات سابقة</h4>
              <p className="text-xs text-slate-500">لم تقم بإجراء أي طلبات حتى الآن في المتجر</p>
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-slate-100">
              {orders.map((order) => {
                const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending;
                const StatusIcon = statusInfo.icon;
                const dateStr = new Date(order.createdAt).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });

                return (
                  <div key={order.id} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span>{statusInfo.label}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <span className="text-[11px] text-slate-400 block font-normal">المجموع</span>
                          <span className="text-base font-black text-emerald-700">
                            {order.totalAmount.toLocaleString('ar-SA')} ر.س
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedInvoice(order)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>عرض الفاتورة</span>
                        </button>
                      </div>
                    </div>

                    {/* Items quick list */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-slate-800">
                            {item.name} × <span className="font-bold">{item.quantity}</span>
                          </span>
                          <span className="text-slate-500 font-medium">
                            {(item.price * item.quantity).toLocaleString('ar-SA')} ر.س
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
