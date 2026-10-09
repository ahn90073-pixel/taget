import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Clock3, MapPin, Package, Phone, RefreshCw, ShoppingBag } from 'lucide-react';
import { formatEGP, formatNumber } from '@/utils/format';
import { ordersApi } from '@/api/client';

const statusLabels = {
  pending: 'طلب جديد',
  confirmed: 'تم التأكيد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  returned: 'مرتجع',
  refunded: 'مسترد',
};

const statusStyles = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-violet-100 text-violet-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
  refunded: 'bg-slate-100 text-slate-700',
};

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function OrdersScreen({ vendor, token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [newOrder, setNewOrder] = useState(null);
  const firstLoad = useRef(true);
  const ordersRef = useRef([]);

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const result = await ordersApi.list(vendor.apiCompanyId);
      const nextOrders = (result.items || []).filter((order) => order.company_id === vendor.apiCompanyId);
      if (!firstLoad.current && nextOrders[0]?.id && nextOrders[0].id !== ordersRef.current[0]?.id) {
        setNewOrder(nextOrders[0]);
      }
      firstLoad.current = false;
      ordersRef.current = nextOrders;
      setOrders(nextOrders);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vendor.apiCompanyId]);

  useEffect(() => {
    loadOrders();
    const timer = window.setInterval(() => loadOrders(true), 30000);
    return () => window.clearInterval(timer);
  }, [loadOrders]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">طلبات الشحن</h1>
          <p className="mt-1 text-sm text-slate-500">الطلبات الجديدة التي تصل إلى متجرك من واجهة الجمهور.</p>
        </div>
        <button type="button" onClick={() => loadOrders()} disabled={refreshing} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> تحديث الطلبات
        </button>
      </div>

      {newOrder && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-brand-900 shadow-sm">
        <Bell className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
        <div className="flex-1"><p className="font-bold">وصل طلب شراء جديد</p><p className="mt-1 text-sm">الطلب {newOrder.order_number} من {newOrder.customer_name || 'عميل جديد'} بقيمة {formatEGP(newOrder.grand_total)}.</p></div>
        <button type="button" onClick={() => setNewOrder(null)} className="text-xs font-bold text-brand-700">إغلاق</button>
      </div>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-700"><RefreshCw className="h-4 w-4 animate-spin" />جارٍ تحميل الطلبات...</div>}
      {!loading && !error && orders.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center"><ShoppingBag className="mx-auto mb-3 h-12 w-12 text-slate-300" /><p className="text-sm text-slate-500">لا توجد طلبات لهذا المتجر حتى الآن.</p></div>}

      <div className="space-y-4">
        {orders.map((order) => <article key={order.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:px-5">
            <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{order.order_number}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[order.status] || 'bg-slate-100 text-slate-700'}`}>{statusLabels[order.status] || order.status}</span></div><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />{formatDate(order.placed_at || order.created_at)}</p></div>
            <div className="text-right"><p className="text-lg font-extrabold text-brand-700">{formatEGP(order.grand_total)}</p><p className="text-xs text-slate-500">{order.payment_method === 'cash_on_delivery' ? 'الدفع عند الاستلام' : order.payment_method}</p></div>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
            <div className="rounded-xl border border-slate-100 p-4"><h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"><Phone className="h-4 w-4 text-brand-600" />بيانات العميل</h3><p className="text-sm font-semibold text-slate-700">{order.customer_name || '—'}</p><p className="mt-1 text-sm text-slate-600">{order.customer_phone || '—'}</p>{order.customer_email && <p className="mt-1 break-all text-xs text-slate-500">{order.customer_email}</p>}</div>
            <div className="rounded-xl border border-slate-100 p-4"><h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"><MapPin className="h-4 w-4 text-brand-600" />عنوان التوصيل</h3><p className="text-sm leading-6 text-slate-600">{[order.governorate, order.city, order.district, order.street, order.building && `مبنى ${order.building}`, order.apartment && `شقة ${order.apartment}`].filter(Boolean).join('، ') || '—'}</p></div>
          </div>
          <div className="border-t border-slate-100 px-4 py-3 sm:px-5"><h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"><Package className="h-4 w-4 text-brand-600" />المنتجات</h3><div className="space-y-2">{(order.items || []).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate text-slate-700">{item.name} <span className="text-xs text-slate-400">× {formatNumber(item.quantity)}</span></span><span className="flex-shrink-0 font-bold text-slate-800">{formatEGP(item.totalPrice)}</span></div>)}</div></div>
          {order.customer_note && <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600"><strong>ملاحظة العميل:</strong> {order.customer_note}</p>}
        </article>)}
      </div>
    </div>
  );
}
