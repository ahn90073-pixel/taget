import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, Clock3, MapPin, Package, Phone, RefreshCw, Share2, ShoppingBag, Truck } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
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
  ready: 'تم تجهيز الشحنة من الإدارة',
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
    .pdf-order, .pdf-order * { box-sizing: border-box; }
    .pdf-order { width: 794px; margin: 0; padding: 0; color: #172033; background: #fff; font: 14px/1.7 Arial, Tahoma, sans-serif; direction: rtl; }
    .pdf-order main { max-width: 100%; margin: 0 auto; }
    .pdf-order header { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; padding-bottom:16px; border-bottom:2px solid #0f766e; }
    .pdf-order h1 { margin:0; font-size:23px; } .pdf-order h2 { margin:0 0 8px; font-size:16px; color:#0f766e; }
    .pdf-order p { margin:3px 0; } .pdf-order .muted { color:#64748b; font-size:12px; }
    .pdf-order section { margin-top:18px; padding:14px; border:1px solid #dbe3e8; border-radius:8px; break-inside:avoid; }
    .pdf-order .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .pdf-order table { width:100%; border-collapse:collapse; margin-top:10px; }
    .pdf-order th, .pdf-order td { border:1px solid #dbe3e8; padding:8px; text-align:right; }
    .pdf-order th { background:#f0fdfa; }
    .pdf-order .totals { width:min(360px,100%); margin-right:auto; }
    .pdf-order .total { font-weight:bold; font-size:16px; color:#0f766e; }
    .pdf-order tr { break-inside: avoid; }
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

function createOrderPdfElement(order, vendorName) {
  const source = new DOMParser().parseFromString(createOrderPdfHtml(order, vendorName), 'text/html');
  const main = source.querySelector('main');
  if (!main) throw new Error('تعذر تجهيز محتوى الطلب.');
  const element = document.createElement('div');
  element.className = 'pdf-order pdf-order-export';
  // Keep the source in the WebView viewport. Android WebView may otherwise
  // rasterize an off-canvas html2canvas clone as a completely white page.
  element.style.cssText = 'position:fixed;left:0;top:0;width:794px;background:#fff;z-index:40;pointer-events:none;';
  const style = document.createElement('style');
  style.textContent = source.querySelector('style')?.textContent || '';
  element.append(style, main.cloneNode(true));
  document.body.appendChild(element);
  return element;
}

async function createOrderPdfBlob(order, vendorName) {
  const element = createOrderPdfElement(order, vendorName);
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
    const scale = 1.5;
    const canvas = await html2canvas(element, {
      scale,
      backgroundColor: '#ffffff',
      useCORS: true,
      windowWidth: 794,
      windowHeight: Math.max(element.scrollHeight, window.innerHeight || 1024),
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDocument) => {
        const clonedElement = clonedDocument.querySelector('.pdf-order-export');
        if (clonedElement) {
          clonedElement.style.position = 'static';
          clonedElement.style.left = '0';
          clonedElement.style.top = '0';
          clonedElement.style.zIndex = 'auto';
          clonedElement.style.display = 'block';
          clonedElement.style.visibility = 'visible';
          clonedElement.style.opacity = '1';
          clonedElement.style.transform = 'none';
          clonedElement.style.width = '794px';
          clonedElement.style.backgroundColor = '#ffffff';
        }
      },
    });
    if (!canvas.width || !canvas.height) throw new Error('تعذر التقاط محتوى الطلب لإنشاء PDF.');
    const pixels = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data;
    let visiblePixelSamples = 0;
    for (let y = 0; y < canvas.height; y += 8) {
      for (let x = 0; x < canvas.width; x += 8) {
        const index = (y * canvas.width + x) * 4;
        if (pixels[index] < 245 || pixels[index + 1] < 245 || pixels[index + 2] < 245) visiblePixelSamples += 1;
      }
    }
    if (visiblePixelSamples < 20) throw new Error('لم يظهر محتوى الطلب في معاينة PDF. أعد المحاولة بعد تحديث التطبيق.');

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    const margin = 12;
    const printableWidth = 210 - (margin * 2);
    const printableHeight = 297 - (margin * 2);
    const maximumSliceHeight = Math.floor(canvas.width * printableHeight / printableWidth);
    const safeBreaks = Array.from(element.querySelectorAll('section, tr'))
      .map((node) => Math.round((node.getBoundingClientRect().bottom - element.getBoundingClientRect().top) * scale))
      .filter((point) => point > 0)
      .sort((a, b) => a - b);
    let startY = 0;
    let pageIndex = 0;
    while (startY < canvas.height) {
      const targetY = Math.min(startY + maximumSliceHeight, canvas.height);
      let endY = targetY;
      if (targetY < canvas.height) {
        const candidate = safeBreaks.filter((point) => point > startY + maximumSliceHeight * 0.65 && point <= targetY).pop();
        if (candidate) endY = candidate;
      }
      const sliceHeight = Math.max(1, endY - startY);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      pageCanvas.getContext('2d').drawImage(canvas, 0, startY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
      if (pageIndex > 0) pdf.addPage();
      const image = pageCanvas.toDataURL('image/jpeg', 0.96);
      const imageHeight = sliceHeight * printableWidth / canvas.width;
      pdf.addImage(image, 'JPEG', margin, margin, printableWidth, imageHeight, undefined, 'FAST');
      startY = endY;
      pageIndex += 1;
    }
    const blob = pdf.output('blob');
    if (!(blob instanceof Blob) || blob.size === 0) throw new Error('تعذر إنشاء ملف PDF.');
    const signature = await blob.slice(0, 5).text();
    if (signature !== '%PDF-') throw new Error('ملف PDF الناتج غير صالح. أعد المحاولة.');
    return blob;
  } finally {
    element.remove();
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('تعذر قراءة ملف PDF.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const separator = dataUrl.indexOf(',');
      if (separator < 0) reject(new Error('تعذر تجهيز ملف PDF للمشاركة.'));
      else resolve(dataUrl.slice(separator + 1));
    };
    reader.readAsDataURL(blob);
  });
}

function downloadPdfInBrowser(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function shareOrDownloadOrderPdf(blob, filename, orderNumber) {
  const title = `طلب ${orderNumber}`;
  if (Capacitor.isNativePlatform()) {
    const capability = await Share.canShare();
    if (!capability.value) throw new Error('مشاركة الملفات غير متاحة في هذا الإصدار من التطبيق.');
    const savedFile = await Filesystem.writeFile({
      path: `order-pdfs/${filename}`,
      data: await blobToBase64(blob),
      directory: Directory.Cache,
      recursive: true,
    });
    const savedContent = await Filesystem.readFile({ path: `order-pdfs/${filename}`, directory: Directory.Cache });
    const encodedContent = String(savedContent.data || '').replace(/^data:[^,]+,/, '');
    const savedSignature = atob(encodedContent.slice(0, 24));
    if (!savedSignature.startsWith('%PDF-')) throw new Error('تعذر التحقق من ملف PDF المحفوظ على الهاتف. أعد المحاولة.');
    await Share.share({
      title,
      text: `ملف PDF للطلب ${orderNumber}`,
      files: [savedFile.uri],
      dialogTitle: `مشاركة ${title}`,
    });
    return 'shared';
  }

  const file = new File([blob], filename, { type: 'application/pdf' });
  if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    await navigator.share({ title, files: [file] });
    return 'shared';
  }
  downloadPdfInBrowser(blob, filename);
  return 'downloaded';
}

export default function OrdersScreen({ vendor }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [newOrder, setNewOrder] = useState(null);
  const [requestingOrderId, setRequestingOrderId] = useState('');
  const [creatingPdfOrderId, setCreatingPdfOrderId] = useState('');
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
    return undefined;
  }, [loadOrders, vendor.isDemo]);

  const handleMarkPrepared = async (order) => {
    setRequestingOrderId(order.id);
    setError('');
    setActionMessage('');
    try {
      const result = await ordersApi.reportPrepared(vendor.apiCompanyId, order.id);
      setOrders((current) => current.map((item) => item.id === order.id ? {
        ...item,
        shipping_request_status: result.status || 'pending',
        shipping_requested_at: result.requestedAt || item.shipping_requested_at,
      } : item));
      setActionMessage(result.alreadyRequested
        ? `الطلب ${order.order_number} مسجل كمجهز لدى الإدارة بالفعل.`
        : `تم إبلاغ الإدارة بأن الطلب ${order.order_number} تم تجهيزه. ستتولى الإدارة إرسال الإشعار وفتح WhatsApp للمراجعة.`);
    } catch (requestError) {
      setError(requestError.message || 'تعذر تسجيل تجهيز الطلب لدى الإدارة.');
    } finally {
      setRequestingOrderId('');
    }
  };

  const handlePdfDownload = async (order) => {
    setCreatingPdfOrderId(order.id);
    setError('');
    setActionMessage('');
    try {
      await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
      const blob = await createOrderPdfBlob(order, vendor.vendorName);
      const safeOrderNumber = String(order.order_number || order.id || 'order').replace(/[^a-zA-Z0-9._-]/g, '-');
      const filename = `order-${safeOrderNumber}.pdf`;
      const result = await shareOrDownloadOrderPdf(blob, filename, order.order_number);
      setActionMessage(result === 'shared'
        ? `تم تجهيز PDF للطلب ${order.order_number}. اختر تطبيقًا لمشاركته أو حفظه.`
        : `تم تنزيل PDF للطلب ${order.order_number}.`);
    } catch (requestError) {
      if (requestError.name === 'AbortError') setActionMessage('تم إلغاء مشاركة ملف PDF.');
      else if (Capacitor.isNativePlatform() && /not implemented|plugin|unavailable/i.test(requestError.message || '')) {
        setError('مشاركة PDF تحتاج تحديث تطبيق التاجر إلى إصدار يدعم مشاركة الملفات.');
      } else setError(requestError.message || 'تعذر إنشاء ملف PDF أو مشاركته. أعد المحاولة.');
    } finally {
      setCreatingPdfOrderId('');
    }
  };

  if (vendor.isDemo) {
    return <section dir="rtl" className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-brand-900"><ShoppingBag className="mb-3 h-8 w-8 text-brand-700" /><h1 className="text-lg font-bold">طلبات الشراء</h1><p className="mt-2 text-sm leading-7">المتجر التجريبي محلي فقط ولا يستقبل طلبات عملاء. ستظهر الطلبات الحقيقية بعد موافقة الإدارة وإنشاء المتجر والـschema.</p></section>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">طلبات الشراء</h1>
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
            ? 'تم إبلاغ الإدارة بالتجهيز'
            : (requestProcessed || shipmentIsActive ? 'تم إشعار العميل من الإدارة' : 'تم التجهيز');
          return <article key={order.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:px-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-900">{order.order_number}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[order.status] || 'bg-slate-100 text-slate-700'}`}>{statusLabels[order.status] || order.status}</span>
                  {order.shipment_status && <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">{shipmentStatusLabels[order.shipment_status] || order.shipment_status}</span>}
                  {requestPending && <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-800">مجهز من التاجر — بانتظار الإشعار</span>}
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
              <button type="button" onClick={() => handlePdfDownload(order)} disabled={creatingPdfOrderId === order.id} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"><Share2 className="h-4 w-4" />{creatingPdfOrderId === order.id ? 'جارٍ تجهيز PDF...' : 'مشاركة / تحميل PDF'}</button>
              <button type="button" onClick={() => handleMarkPrepared(order)} disabled={requestDisabled} className="flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300">
                {requestPending || requestProcessed || shipmentIsActive ? <CheckCircle2 className="h-4 w-4" /> : (requestingOrderId === order.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />)}
                {requestingOrderId === order.id ? 'جارٍ الإرسال...' : requestLabel}
              </button>
            </div>
          </article>;
        })}
      </div>
      {creatingPdfOrderId && <div role="status" aria-live="polite" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 p-4 text-center text-white backdrop-blur-sm">
        <div className="rounded-2xl bg-slate-900/90 px-6 py-5 shadow-xl"><RefreshCw className="mx-auto h-8 w-8 animate-spin text-teal-300" /><p className="mt-3 font-bold">جارٍ تجهيز ملف PDF للطلب</p><p className="mt-1 text-xs text-slate-300">قد يستغرق ذلك لحظات، لا تغلق التطبيق.</p></div>
      </div>}
    </div>
  );
}
