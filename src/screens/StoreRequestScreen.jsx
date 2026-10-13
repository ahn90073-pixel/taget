import { useState } from 'react';
import { CheckCircle2, Clock3, LoaderCircle, RefreshCw, Send, Store, XCircle } from 'lucide-react';
import { egyptGovernorates } from '@/data/egyptGovernorates';

const ADMIN_WHATSAPP = '201014984314';

function whatsappUrl(request, user) {
  const message = [
    'طلب إنشاء متجر حقيقي - تطبيق التاجر',
    `اسم التاجر: ${request.fullName || user?.full_name || user?.fullName || ''}`,
    `رقم الهاتف: ${request.phone || user?.phone || ''}`,
    `البريد الإلكتروني: ${request.email || user?.email || ''}`,
    `اسم المتجر: ${request.storeName || ''}`,
    `المحافظة: ${request.governorate || ''}`,
    `حالة طلب التطبيق: ${request.status === 'pending' ? 'قيد مراجعة الإدارة' : 'تم تقديم الطلب'}`,
    'المنتجات التجريبية محفوظة على الجهاز ولن تنتقل إلى المتجر الحقيقي.',
  ].join('\n');
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export default function StoreRequestScreen({ user, request, loading, error: remoteError, onSubmit, onRefresh }) {
  const [fullName, setFullName] = useState(request?.fullName || user?.full_name || user?.fullName || '');
  const [phone, setPhone] = useState(request?.phone || user?.phone || '');
  const [storeName, setStoreName] = useState(request?.storeName || '');
  const [governorate, setGovernorate] = useState(request?.governorate || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pending = request?.status === 'pending';
  const rejected = request?.status === 'rejected';
  const approved = request?.status === 'approved';
  const messageRequest = request || { fullName, phone, storeName, governorate, email: user?.email, status: 'pending' };

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

  const openWhatsApp = () => {
    window.open(whatsappUrl(messageRequest, user), '_blank', 'noopener,noreferrer');
  };
  const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100';

  return (
    <main dir="rtl" className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-2xl bg-gradient-to-l from-[#102a43] via-[#0f766e] to-[#0f3d56] p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Store size={24} /></span>
          <div>
            <p className="text-sm text-teal-100">الملف الشخصي · طلب إنشاء متجر حقيقي</p>
            <h1 className="mt-1 text-2xl font-bold">التقديم للمتجر الحقيقي</h1>
            <p className="mt-2 text-sm leading-6 text-teal-50">أرسل بياناتك للإدارة من التطبيق. لن تُنشأ الشركة أو قاعدة بياناتها المنفصلة إلا بعد اعتماد الطلب.</p>
          </div>
        </div>
      </section>

      <div role="status" className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-900">
        المنتجات التي تضيفها الآن تجريبية ومحفوظة محليًا على هذا الجهاز فقط. ستبقى منفصلة، ويبدأ المتجر الحقيقي فارغًا بعد الموافقة.
      </div>

      {pending && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <Clock3 className="mb-3 text-amber-700" size={25} />
          <h2 className="font-bold text-amber-950">طلبك قيد مراجعة الإدارة</h2>
          <p className="mt-2 text-sm leading-7 text-amber-900">استلمنا طلب إنشاء متجر «{request.storeName}». عند الموافقة ستُنشأ الشركة والـschema، ثم ينتقل التطبيق إلى المتجر الحقيقي. المنتجات التجريبية لن تُنقل.</p>
          <p className="mt-2 text-xs text-amber-800">البريد: {request.email || user?.email || '—'} · المحافظة: {request.governorate || '—'}</p>
          <button type="button" onClick={openWhatsApp} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"><Send size={16} />إرسال نسخة إلى WhatsApp الإدارة</button>
          <p className="mt-2 text-xs leading-5 text-amber-800">سيفتح WhatsApp برسالة جاهزة إلى رقم الإدارة؛ راجعها واضغط إرسال من داخل WhatsApp.</p>
        </section>
      )}

      {approved && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <CheckCircle2 className="mb-3 text-emerald-700" size={25} />
          <h2 className="font-bold text-emerald-950">تمت الموافقة على طلبك</h2>
          <p className="mt-2 text-sm leading-7 text-emerald-900">اضغط «تحديث الحالة» ليتحقق التطبيق من إنشاء المتجر الحقيقي والـschema.</p>
        </section>
      )}

      {!pending && !approved && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {rejected && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-7 text-rose-900"><XCircle className="mb-2" size={22} /><p className="font-bold">لم تتم الموافقة على الطلب السابق.</p>{request.adminNote && <p className="mt-1">ملاحظة الإدارة: {request.adminNote}</p>}<p className="mt-1">يمكنك تعديل البيانات وإرسال طلب جديد.</p></div>}
          <h2 className="mb-1 text-lg font-bold text-slate-900">بيانات طلب إنشاء المتجر</h2>
          <p className="mb-5 text-sm leading-6 text-slate-500">بعد الإرسال سيظهر الطلب في تطبيق الإدارة. لا تنشأ قاعدة بيانات المتجر قبل الموافقة.</p>
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">الاسم الكامل</span><input className={fieldClass} required minLength={2} maxLength={160} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
            <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">رقم الهاتف</span><input className={fieldClass} required minLength={5} maxLength={30} autoComplete="tel" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
            <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">اسم الشركة أو المتجر</span><input className={fieldClass} required minLength={2} maxLength={120} value={storeName} onChange={(event) => setStoreName(event.target.value)} /></label>
            <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">محافظة المتجر</span><select className={fieldClass} required value={governorate} onChange={(event) => setGovernorate(event.target.value)}><option value="">اختر المحافظة</option>{egyptGovernorates.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">البريد الإلكتروني المرتبط بالحساب: <span dir="ltr" className="inline-block font-semibold">{user?.email || '—'}</span></p>
            {(error || remoteError) && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error || remoteError}</p>}
            <button type="submit" disabled={saving} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 font-bold text-white transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60">{saving ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={17} />}{saving ? 'جارٍ إرسال الطلب...' : 'إرسال طلب إنشاء المتجر'}</button>
          </form>
        </section>
      )}

      {remoteError && (pending || approved) && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{remoteError}</p>}
      <button type="button" disabled={loading} onClick={onRefresh} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">{loading ? <LoaderCircle className="animate-spin" size={17} /> : <RefreshCw size={16} />}تحديث حالة طلب المتجر</button>
    </main>
  );
}
