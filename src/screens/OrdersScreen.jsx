import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, Clock3, Download, MapPin, Package, Phone, RefreshCw, ShoppingBag, Truck } from 'lucide-react';
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

const shipmentStatusLabels = {
  pending: 'بانتظار إجراء الإدارة',
  label_created: 'تم إنشاء بوليصة',
  ready: 'تم تجهيز الطرد من الإدارة',
  picked_up: 'استلمتها شركة الشحن',
  in_transit: 'في الطريق',
  delivered: 'تم التسليم',
  failed: 'تعذر التسليم',
  returned: 'مرتجع',
};

const paymentStatusLabels = {
  pending: 'الدفع عند الاستلام / غير محصل',
  paid: 'مدفوع',
  authorized: 'تم اعتماد الدفع',
  failed: 'فشل الدفع',
  refunded: 'مسترد',
  partially_refunded: 'مسترد جزئيًا',
};

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function createOrderPdfHtml(order, vendorName) {
  const address = [
    order.country,
    order.governorate,
    order.city,
    order.district,
    order.street,
    order.building && `مبنى ${order.building}`,
    order.apartment && `شقة ${order.apartment}`,
    order.postal_code && `الرمز البريدي ${order.postal_code}`,
  ].filter(Boolean).join('، ') || '—';
  const items = (order.items || []).map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.sku || '—')}</td>
      <td>${escapeHtml(formatNumber(item.quantity))}</td>
      <td>${escapeHtml(formatEGP(item.unitPrice))}</td>
      <td>${escapeHtml(formatEGP(item.totalPrice))}</td>
    </tr>`).join('');
  const payment = order.payment_method === 'cash_on_delivery' ? 'الدفع عند الاستلام' : (order.payment_method || '—');
  const status = statusLabels[order.status] || order.status || '—';
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>طلب ${escapeHtml(order.order_number)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #172033; font: 14px/1.7 Arial, Tahoma, sans-serif; direction: rtl; }
    main { max-width: 900px; margin: 0 auto; }
    header { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; padding-bottom:16px; border-bottom:2px solid #0f766e; }
    h1 { margin:0; font-size:23px; } h2 { margin:0 0 8px; font-size:16px; color:#0f766e; }
    p { margin:3px 0; } .muted { color:#64748b; font-size:12px; }
    section { margin-top:18px; padding:14px; border:1px solid #dbe3e8; border-radius:8px; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    table { width:100%; border-collapse:collapse; margin-top:10px; }
    th,td { border:1px solid #dbe3e8; padding:8px; text-align:right; }
    th { background:#f0fdfa; }
    .totals { width:min(360px,100%); margin-right:auto; }
    .total { font-weight:bold; font-size:16px; color:#0f766e; }
    @media print { body { print-color-adjust:exact; -webkit-print-color-adjust:exact; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div><h1>تفاصيل طلب شراء</h1><p>رقم الطلب: <strong dir="ltr">${escapeHtml(order.order_number)}</strong></p><p class="muted">تاريخ الطلب: ${escapeHtml(formatDate(order.placed_at || order.created_at))}</p></div>
      <div><strong>${escapeHtml(vendorName || 'المتجر')}</strong><p>حالة الطلب: ${escapeHtml(status)}</p><p>طريقة الدفع: ${escapeHtml(payment)}</p><p>حالة الدفع: ${escapeHtml(paymentStatusLabels[order.payment_status] || order.payment_status || '—')}</p></div>
    </header>
    <section class="grid">
      <div><h2>بيانات العميل</h2><p>${escapeHtml(order.customer_name || order.recipient_name || '—')}</p><p dir="ltr">${escapeHtml(order.customer_phone || '—')}</p><p dir="ltr">${escapeHtml(order.customer_email || '—')}</p></div>
      <div><h2>عنوان التوصيل</h2><p>${escapeHtml(address)}</p><p>ملاحظات العنوان: ${escapeHtml(order.address_notes || '—')}</p></div>
    </section>
    <section><h2>المنتجات</h2><table><thead><tr><th>المنتج</th><th>SKU</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead><tbody>${items || '<tr><td colspan="5">لا توجد منتجات مسجلة</td></tr>'}</tbody></table></section>
    <section class="totals">
      <p>قيمة المنتجات: <strong>${escapeHtml(formatEGP(order.subtotal))}</strong></p>
      <p>الشحن: <strong>${escapeHtml(formatEGP(order.shipping_total))}</strong></p>
      <p>الضريبة: <strong>${escapeHtml(formatEGP(order.tax_total))}</strong></p>
      <p class="total">الإجمالي الكلي: ${escapeHtml(formatEGP(order.grand_total))}</p>
    </section>
    ${order.customer_note ? `<section><h2>ملاحظة العميل</h2><p>${escapeHtml(order.customer_note)}</p></section>` : ''}
  </main>
</body>
</html>`;
}

function openOrderPdf(order, vendorName) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;
  printWindow.document.open();
  printWindow.document.write(createOrderPdfHtml(order, vendorName));
  printWindow.document.close();
  printWindow.focus();
  window.setTimeout(() => printWindow.print(), 350);
  return true;
}

export default function OrdersScreen({ vendor }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [newOrder, setNewOrder] = useState(null);
  const [requestingOrderId, setRequestingOrderId] = useState('');
  const firstLoad = useRef(true);
  const ordersRef = useRef([]);

  const loadOrders = useCallback(async (silent = false) => {
    if (vendor.isDemo) {
      setOrders([]);
      setError('');
      setLoading(false);
      setRefreshing(false);
      return;
    }
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
  }, [vendor.apiCompanyId, vendor.isDemo]);

  useEffect(() => {
    if (vendor.isDemo) {
      setLoading(false);
      return undefined;
    }
    loadOrders();
    const timer = window.setInterval(() => loadOrders(true), 30000);
    return () => window.clearInterval(timer);
  }, [loadOrders, vendor.isDemo]);

  const handleRequestShipping = async (order) => {
    setRequestingOrderId(order.id);
    setError('');
    setActionMessage('');
    try {
      const result = await ordersApi.requestShipping(vendor.apiCompanyId, order.id);
      setOrders((current) => current.map((item) => item.id === order.id ? {
        ...item,
        shipping_request_status: result.status || 'pending',
        shipping_requested_at: result.requestedAt || item.shipping_requested_at,
      } : item));
      setActionMessage(result.alreadyRequested
        ? `طلب تفعيل الشحن للطلب ${order.order_number} موجود بالفعل لدى الإدارة.`
        : `تم إرسال طلب تفعيل الشحن للطلب ${order.order_number} إلى الإدارة.`);
    } catch (requestError) {
      setError(requestError.message || 'تعذر إرسال طلب تفعيل الشحن.');
    } finally {
      setRequestingOrderId('');
    }
  };

  const handlePdfDownload = (order) => {
    const opened = openOrderPdf(order, vendor.vendorName);
    if (!opened) setError('تعذر فتح نافذة PDF. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.');
    else setActionMessage(`افتح نافذة الطباعة واختر «حفظ بصيغة PDF» لتنزيل الطلب ${order.order_number}.`);
  };

  if (vendor.isDemo) {
    return <section dir="rtl" className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-brand-900"><ShoppingBag className="mb-3 h-8 w-8 text-brand-700" /><h1 className="text-lg font-bold">طلبات الشراء</h1><p className="mt-2 text-sm leading-7">المتجر التجريبي محلي فقط ولا يستقبل طلبات عملاء. ستظهر الطلبات الحقيقية بعد موافقة الإدارة وإنشاء المتجر والـschema.</p></section>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">طلبات الشراء</h1>
          <p className="mt-1 text-sm text-slate-500">اعرض تفاصيل الطلب كاملة. لا يبدأ الشحن تلقائيًا؛ يمكنك إرسال طلب تفعيله إلى الإدارة عند الاستعداد.</p>
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
      {actionMessage && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{actionMessage}</div>}
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-6 text-sky-900">استلام الطلب لا ينشئ عملية شحن. عند الضغط على «تفعيل الشحن» يصل طلب التفعيل إلى إشعارات الإدارة؛ الإدارة تتولى تجهيز الطرد وإشعار العميل.</div>
      {loading && <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-700"><RefreshCw className="h-4 w-4 animate-spin" />جارٍ تحميل الطلبات...</div>}
      {!loading && !error && orders.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center"><ShoppingBag className="mx-auto mb-3 h-12 w-12 text-slate-300" /><p className="text-sm text-slate-500">لا توجد طلبات لهذا المتجر حتى الآن.</p></div>}

      <div className="space-y-4">
        {orders.map((order) => {
          const requestPending = order.shipping_request_status === 'pending';
          const requestProcessed = order.shipping_request_status === 'processed';
          const shipmentIsActive = ['ready', 'picked_up', 'in_transit', 'delivered'].includes(order.shipment_status);
          const orderIsClosed = ['cancelled', 'delivered', 'shipped', 'returned', 'refunded'].includes(order.status);
          const requestDisabled = requestPending || requestProcessed || shipmentIsActive || orderIsClosed || requestingOrderId === order.id;
          const requestLabel = requestPending
            ? 'تم إرسال الطلب للإدارة'
            : (requestProcessed || shipmentIsActive ? 'تم تفعيل الشحن من الإدارة' : 'تفعيل الشحن');
          return <article key={order.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:px-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-900">{order.order_number}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[order.status] || 'bg-slate-100 text-slate-700'}`}>{statusLabels[order.status] || order.status}</span>
                  {order.shipment_status && <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">{shipmentStatusLabels[order.shipment_status] || order.shipment_status}</span>}
                  {requestPending && <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-800">بانتظار الإدارة</span>}
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />{formatDate(order.placed_at || order.created_at)}</p>
              </div>
              <div className="text-right"><p className="text-lg font-extrabold text-brand-700">{formatEGP(order.grand_total)}</p><p className="text-xs text-slate-500">{order.payment_method === 'cash_on_delivery' ? 'الدفع عند الاستلام' : order.payment_method}</p></div>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              <div className="rounded-xl border border-slate-100 p-4"><h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"><Phone className="h-4 w-4 text-brand-600" />بيانات العميل</h3><p className="text-sm font-semibold text-slate-700">{order.customer_name || '—'}</p><p className="mt-1 text-sm text-slate-600" dir="ltr">{order.customer_phone || '—'}</p>{order.customer_email && <p className="mt-1 break-all text-xs text-slate-500" dir="ltr">{order.customer_email}</p>}</div>
              <div className="rounded-xl border border-slate-100 p-4"><h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"><MapPin className="h-4 w-4 text-brand-600" />عنوان التوصيل</h3><p className="text-sm leading-6 text-slate-600">{[order.country, order.governorate, order.city, order.district, order.street, order.building && `مبنى ${order.building}`, order.apartment && `شقة ${order.apartment}`, order.postal_code && `الرمز ${order.postal_code}`].filter(Boolean).join('، ') || '—'}</p>{order.address_notes && <p className="mt-2 text-xs text-slate-500"><strong>ملاحظات العنوان:</strong> {order.address_notes}</p>}</div>
            </div>

            <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"><Package className="h-4 w-4 text-brand-600" />المنتجات</h3>
              <div className="space-y-2">{(order.items || []).map((item) => <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <span className="min-w-0 truncate font-semibold text-slate-700">{item.name}{item.sku && <small className="mr-2 text-xs font-normal text-slate-400">SKU: {item.sku}</small>}</span>
                <span className="text-xs text-slate-500">{formatNumber(item.quantity)} × {formatEGP(item.unitPrice)}</span>
                <span className="text-left font-bold text-slate-800">{formatEGP(item.totalPrice)}</span>
              </div>)}</div>
            </div>

            {order.customer_note && <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-600"><strong>ملاحظة العميل:</strong> {order.customer_note}</p>}

            <div className="grid gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-sm sm:grid-cols-2 sm:px-5">
              <p>قيمة المنتجات: <strong>{formatEGP(order.subtotal)}</strong></p>
              <p>الشحن: <strong>{formatEGP(order.shipping_total)}</strong></p>
              <p>الضريبة: <strong>{formatEGP(order.tax_total)}</strong></p>
              <p>حالة الدفع: <strong>{paymentStatusLabels[order.payment_status] || order.payment_status || '—'}</strong></p>
              <p className="text-base font-extrabold text-brand-700 sm:col-span-2">الإجمالي الكلي: {formatEGP(order.grand_total)}</p>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 p-4 sm:flex-row sm:justify-end sm:px-5">
              <button type="button" onClick={() => handlePdfDownload(order)} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><Download className="h-4 w-4" />تحميل الطلب PDF</button>
              <button type="button" onClick={() => handleRequestShipping(order)} disabled={requestDisabled} className="flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                {requestPending || requestProcessed || shipmentIsActive ? <CheckCircle2 className="h-4 w-4" /> : (requestingOrderId === order.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />)}
                {requestingOrderId === order.id ? 'جارٍ الإرسال...' : requestLabel}
              </button>
            </div>
          </article>;
        })}
      </div>
    </div>
  );
}
