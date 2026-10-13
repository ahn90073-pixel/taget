import { useState } from 'react';
import { CheckCircle2, Clock3, LoaderCircle, LogOut, RefreshCw, Send, Store, XCircle } from 'lucide-react';
import { egyptGovernorates } from '@/data/egyptGovernorates';

export default function StoreRequestScreen({ user, request, draft, loading, error: remoteError, onSubmit, onRefresh, onLogout }) {
  const [fullName, setFullName] = useState(request?.fullName || draft?.fullName || user?.full_name || user?.fullName || '');
  const [phone, setPhone] = useState(request?.phone || draft?.phone || user?.phone || '');
  const [storeName, setStoreName] = useState(request?.storeName || draft?.storeName || '');
  const [governorate, setGovernorate] = useState(request?.governorate || draft?.governorate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pending = request?.status === 'pending';
  const rejected = request?.status === 'rejected';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({ fullName: fullName.trim(), phone: phone.trim(), storeName: storeName.trim(), governorate });
    } catch (submitError) {
      setError(submitError.message || 'تعذر إرسال الطلب. حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100';

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-gradient-to-bl from-brand-50 via-slate-50 to-white px-4 py-8">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-9">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><Store size={23} /></span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-brand-700">حساب التاجر مسجل الدخول</p>
            <h1 className="mt-1 text-xl font-bold text-slate-950">طلب إنشاء متجر</h1>
          </div>
        </div>

        {pending ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <Clock3 className="mb-3 text-amber-700" size={25} />
            <h2 className="font-bold text-amber-950">طلبك قيد المراجعة</h2>
            <p className="mt-2 text-sm leading-7 text-amber-900">استلمنا بياناتك وطلب إنشاء متجر «{request.storeName}». لن يتم إنشاء المتجر أو مساحته الخاصة قبل موافقة الإدارة.</p>
            <p className="mt-2 text-xs text-amber-800">البريد: {request.email || user?.email || '—'} · المحافظة: {request.governorate}</p>
          </div>
        ) : request?.status === 'approved' ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <CheckCircle2 className="mb-3 text-emerald-700" size={25} />
            <h2 className="font-bold text-emerald-950">تمت الموافقة على الطلب</h2>
            <p className="mt-2 text-sm leading-7 text-emerald-900">اضغط «تحديث الحالة» لفتح المتجر بعد اكتمال تهيئته.</p>
          </div>
        ) : (
          <>
            {rejected && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-900"><XCircle className="mb-2" size={22} /><p className="font-bold">لم تتم الموافقة على الطلب السابق.</p>{request.adminNote && <p className="mt-1">ملاحظة الإدارة: {request.adminNote}</p>}<p className="mt-1">يمكنك تعديل بياناتك وإرسال طلب جديد.</p></div>}
            <p className="mb-5 text-sm leading-7 text-slate-600">أكمل بياناتك الشخصية وبيانات المتجر لإرسالها إلى الإدارة. تسجيل الدخول يعمل الآن، لكن لن يتم إنشاء المتجر أو قاعدة بياناته المنفصلة إلا بعد الموافقة.</p>
            <form onSubmit={submit} className="space-y-4">
              <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">الاسم الكامل</span><input className={fieldClass} required minLength={2} maxLength={160} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
              <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">رقم الهاتف</span><input className={fieldClass} required minLength={5} maxLength={30} autoComplete="tel" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
              <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">اسم الشركة أو المتجر</span><input className={fieldClass} required minLength={2} maxLength={120} value={storeName} onChange={(event) => setStoreName(event.target.value)} /></label>
              <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">المحافظة</span><select className={fieldClass} required value={governorate} onChange={(event) => setGovernorate(event.target.value)}><option value="">اختر المحافظة</option>{egyptGovernorates.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              <button type="submit" disabled={saving} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60">{saving ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={17} />}{saving ? 'جارٍ إرسال الطلب...' : 'إرسال طلب إنشاء متجر'}</button>
            </form>
          </>
        )}

        {remoteError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{remoteError}</p>}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" disabled={loading} onClick={onRefresh} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{loading ? <LoaderCircle className="animate-spin" size={17} /> : <RefreshCw size={16} />}تحديث الحالة</button>
          <button type="button" onClick={onLogout} className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"><LogOut size={16} />تسجيل الخروج</button>
        </div>
      </section>
    </main>
  );
}
