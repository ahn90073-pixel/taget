import { useState } from 'react';
import { CheckCircle2, Loader2, MapPin, Trash2 } from 'lucide-react';
import { notificationsApi } from '@/api/client';
import { getStoreLocation } from '@/utils/storeLocation';

function readSavedLocation(userId) {
  if (!userId) return null;
  try {
    const saved = window.localStorage.getItem(`taget_saved_store_location_${userId}`)
      || window.localStorage.getItem(`taget_pending_store_location_${userId}`);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function ShippingLocationCard({ vendor }) {
  const [location, setLocation] = useState(() => readSavedLocation(vendor.userId));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const canManageLocation = vendor.isDemo || ['owner', 'admin'].includes(vendor.companyRole);

  const saveLocation = async () => {
    setBusy(true);
    setMessage('');
    try {
      const current = await getStoreLocation();
      setLocation(current);
      try {
        window.localStorage.setItem(`taget_pending_store_location_${vendor.userId}`, JSON.stringify(current));
        window.localStorage.setItem(`taget_saved_store_location_${vendor.userId}`, JSON.stringify(current));
      } catch { /* Server storage is authoritative once the company is active. */ }

      if (vendor.apiCompanyId) {
        await notificationsApi.saveLocation(vendor.apiCompanyId, current);
        try { window.localStorage.removeItem(`taget_pending_store_location_${vendor.userId}`); } catch { /* non-critical */ }
        setMessage('تم حفظ موقع المتجر بموافقتك. يمكن لفريق الإدارة استخدامه لتنسيق الشحن.');
      } else {
        setMessage('تم حفظ الموقع على هذا الجهاز مؤقتًا بموافقتك. لا تحتاج إلى حساب جديد؛ سيُرسل للخادم عند ربط حسابك بمتجر فعلي.');
      }
    } catch (error) {
      setMessage(error.message || 'تعذر حفظ الموقع الآن. تحقق من الاتصال أو إعدادات الموقع ثم حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  const removeLocation = async () => {
    setBusy(true);
    setMessage('');
    try {
      if (vendor.apiCompanyId) await notificationsApi.removeLocation(vendor.apiCompanyId);
      try {
        window.localStorage.removeItem(`taget_pending_store_location_${vendor.userId}`);
        window.localStorage.removeItem(`taget_saved_store_location_${vendor.userId}`);
      } catch { /* non-critical */ }
      setLocation(null);
      setMessage('تم حذف الموقع وإيقاف مشاركته.');
    } catch (error) {
      setMessage(error.message || 'تعذر حذف الموقع الآن. حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="موقع المتجر للشحن" className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><MapPin className="h-5 w-5" /></div>
          <div>
            <h2 className="font-bold text-slate-900">موقع المتجر لتسهيل الشحن</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">السماح اختياري؛ يساعد فريق الإدارة ومندوب الشحن على الوصول للمتجر وتسريع الاستجابة للطلبات. اضغط لتحديد الموقع وطلب إذن الجهاز. لن يُرسل تلقائيًا إلى شركة الشحن أو المندوب.</p>
            {location && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-financial-700"><CheckCircle2 className="h-4 w-4" />{vendor.apiCompanyId ? 'يوجد موقع محفوظ للمتجر' : 'الموقع محفوظ مؤقتًا على هذا الجهاز'}</p>}
            {message && <p role="status" className="mt-2 text-xs leading-5 text-slate-600">{message}</p>}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {!canManageLocation && <p className="max-w-40 text-xs leading-5 text-slate-500">يمكن لصاحب الشركة أو المدير المخوّل حفظ موقع الشحن.</p>}
          {canManageLocation && <>
          <button type="button" onClick={saveLocation} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60"><MapPin className="h-4 w-4" />{busy ? <><Loader2 className="h-4 w-4 animate-spin" />جارٍ التجهيز...</> : location ? 'تحديث الموقع' : 'السماح بموقع المتجر'}</button>
          {location && <button type="button" onClick={removeLocation} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"><Trash2 className="h-4 w-4" />حذف الموقع</button>}
          </>}
        </div>
      </div>
    </section>
  );
}
