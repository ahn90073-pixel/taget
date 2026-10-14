import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Clock3, CreditCard, FileCheck2, FileText, Home, LoaderCircle, MapPin, MessageCircle, RefreshCw, Send, ShieldCheck, Store, Upload, Wallet, XCircle } from 'lucide-react';
import { egyptGovernorates } from '@/data/egyptGovernorates';

const ADMIN_WHATSAPP = '201014984314';
const payoutMethods = [
  { value: 'vodafone_cash', label: 'فودافون كاش' },
  { value: 'instapay', label: 'InstaPay' },
  { value: 'bank', label: 'حساب بنكي' },
];
const documentTypes = [
  { key: 'nationalId', label: 'البطاقة الشخصية لصاحب الحساب' },
  { key: 'commercialRegister', label: 'مستند السجل التجاري' },
  { key: 'propertyContract', label: 'عقد أو بوليصة إثبات عنوان المستودع' },
];
const acceptedFiles = '.pdf,.jpg,.jpeg,.png';
const maxFileBytes = 10 * 1024 * 1024;
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 sm:text-sm';

function initialProfile(request, user) {
  const profile = request?.profileData || {};
  const address = profile.warehouseAddress || {};
  return {
    legalName: profile.legalName || '',
    displayName: profile.displayName || request?.storeName || '',
    email: profile.email || user?.email || '',
    commercialRegisterNumber: profile.commercialRegisterNumber || '',
    taxId: profile.taxId || '',
    warehouseAddress: {
      governorate: address.governorate || request?.governorate || '',
      city: address.city || '',
      street: address.street || '',
    },
    payoutMethod: profile.payoutMethod || '',
    payoutNumber: profile.payoutNumber || '',
  };
}

function whatsappUrl(request, user) {
  const profile = request?.profileData || {};
  const statusLabel = { draft: 'مسودة', pending: 'قيد المراجعة', approved: 'مقبول', rejected: 'بحاجة إلى تعديل' }[request?.status];
  const message = [
    'السلام عليكم، أحتاج مساعدة بخصوص التقديم لفتح متجر حقيقي من تطبيق التاجر.',
    `اسم صاحب الحساب: ${request?.fullName || user?.full_name || user?.fullName || ''}`,
    `رقم التواصل: ${request?.phone || user?.phone || ''}`,
    profile.displayName || request?.storeName ? `اسم المتجر: ${profile.displayName || request?.storeName}` : '',
    statusLabel ? `حالة الطلب: ${statusLabel}` : '',
    'أرجو إرشادي إلى خطوات فتح المتجر واستكمال الطلب.',
  ].filter(Boolean).join('\n');
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

function Field({ label, value, onChange, type = 'text', required = false, maxLength, placeholder = '', dir = 'auto' }) {
  return <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">{label}</span><input className={inputClass} type={type} dir={dir} value={value} onChange={(event) => onChange(event.target.value)} required={required} maxLength={maxLength} placeholder={placeholder} /></label>;
}

const sectionThemes = {
  sky: { card: 'border-sky-200 bg-gradient-to-br from-white via-white to-sky-50/80', icon: 'bg-sky-100 text-sky-700', accent: 'bg-sky-500' },
  violet: { card: 'border-violet-200 bg-gradient-to-br from-white via-white to-violet-50/80', icon: 'bg-violet-100 text-violet-700', accent: 'bg-violet-500' },
  amber: { card: 'border-amber-200 bg-gradient-to-br from-white via-white to-amber-50/80', icon: 'bg-amber-100 text-amber-700', accent: 'bg-amber-500' },
  teal: { card: 'border-teal-200 bg-gradient-to-br from-white via-white to-teal-50/80', icon: 'bg-teal-100 text-teal-700', accent: 'bg-teal-500' },
  rose: { card: 'border-rose-200 bg-gradient-to-br from-white via-white to-rose-50/80', icon: 'bg-rose-100 text-rose-700', accent: 'bg-rose-500' },
  emerald: { card: 'border-emerald-200 bg-gradient-to-br from-white via-white to-emerald-50/80', icon: 'bg-emerald-100 text-emerald-700', accent: 'bg-emerald-500' },
};

function Section({ title, icon, children, tone = 'sky' }) {
  const theme = sectionThemes[tone] || sectionThemes.sky;
  return <section className={`overflow-hidden rounded-3xl border ${theme.card} p-4 shadow-sm sm:p-6`}><div className="mb-5 flex items-center gap-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${theme.icon}`}>{icon}</span><div className="min-w-0 flex-1"><h2 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h2><div className={`mt-2 h-1 w-12 rounded-full ${theme.accent}`} /></div></div>{children}</section>;
}

export default function StoreRequestScreen({ user, request, loading, error: remoteError, onSubmit, onRefresh }) {
  const [fullName, setFullName] = useState(request?.fullName || user?.full_name || user?.fullName || '');
  const [phone, setPhone] = useState(request?.phone || user?.phone || '');
  const [profile, setProfile] = useState(() => initialProfile(request, user));
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!request || request.status === 'none') return;
    setFullName(request.fullName || user?.full_name || user?.fullName || '');
    setPhone(request.phone || user?.phone || '');
    setProfile(initialProfile(request, user));
  }, [request, user]);
  const pending = request?.status === 'pending';
  const draft = request?.status === 'draft';
  const rejected = request?.status === 'rejected';
  const approved = request?.status === 'approved';
  const existingDocuments = new Set((request?.documents || []).map((item) => item.documentType));
  const canReuseExistingDocuments = !rejected;
  const updateProfile = (field, value) => setProfile((current) => ({ ...current, [field]: value }));
  const updateAddress = (field, value) => setProfile((current) => ({
    ...current,
    warehouseAddress: { ...current.warehouseAddress, [field]: value },
  }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const missingDocuments = documentTypes.filter(({ key }) => !files[key] && !(canReuseExistingDocuments && existingDocuments.has(key)));
    if (missingDocuments.length) {
      setError('ارفع البطاقة الشخصية ومستند السجل التجاري وإثبات عنوان المستودع قبل إرسال الطلب.');
      return;
    }
    for (const [type, file] of Object.entries(files)) {
      if (!file) continue;
      if (file.size <= 0 || file.size > maxFileBytes) {
        setError(`حجم الملف «${file.name}» يجب ألا يتجاوز 10 ميجابايت.`);
        return;
      }
    }
    setSaving(true);
    try {
      await onSubmit({
        fullName: fullName.trim(),
        phone: phone.trim(),
        profileData: {
          ...profile,
          legalName: profile.legalName.trim(),
          displayName: profile.displayName.trim(),
          email: profile.email.trim(),
          commercialRegisterNumber: profile.commercialRegisterNumber.trim(),
          taxId: profile.taxId.trim(),
          warehouseAddress: {
            governorate: profile.warehouseAddress.governorate,
            city: profile.warehouseAddress.city.trim(),
            street: profile.warehouseAddress.street.trim(),
          },
          payoutNumber: profile.payoutNumber.trim(),
        },
        documents: files,
      });
    } catch (submitError) {
      setError(submitError.message || 'تعذر حفظ الملف أو إرسال الطلب. حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const currentRequest = request || {
    fullName, phone, email: user?.email, storeName: profile.displayName,
    profileData: profile,
    documents: documentTypes.filter(({ key }) => files[key]).map(({ key }) => ({ documentType: key })),
  };

  return (
    <main dir="rtl" className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-[#102a43] via-[#0f766e] to-[#0f3d56] p-5 text-white shadow-lg sm:p-8">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Store size={24} /></span>
          <div className="min-w-0">
            <p className="text-sm text-teal-100">الملف الشخصي · طلب إنشاء متجر حقيقي</p>
            <h1 className="mt-1 text-2xl font-bold">ملف المنشأة والتقديم</h1>
            <p className="mt-2 text-sm leading-6 text-teal-50">املأ بيانات السجل والضريبة والمستودع والتحويل وارفع مستنداتك. تُعرض للإدارة للمراجعة، ولا يُنشأ المتجر أو الـschema قبل الموافقة.</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-l from-emerald-50 via-white to-teal-50 p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm"><MessageCircle size={23} /></span>
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">دعم مباشر</span>
              <h2 className="mt-2 text-lg font-extrabold text-slate-900 sm:text-xl">تواصل مع الإدارة لفتح متجرك</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">يسعدنا مساعدتك في تجهيز الطلب ومعرفة خطوات إنشاء متجرك الحقيقي.</p>
              <p dir="ltr" className="mt-2 w-fit rounded-lg bg-white px-3 py-1.5 text-base font-extrabold tracking-wide text-emerald-800 shadow-sm">+20 10 1498 4314</p>
            </div>
          </div>
          <button type="button" onClick={() => window.open(whatsappUrl(currentRequest, user), '_blank', 'noopener,noreferrer')} className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 sm:w-auto"><MessageCircle size={18} />تواصل مع الإدارة عبر WhatsApp</button>
        </div>
        <p className="mt-3 border-t border-emerald-100 pt-3 text-xs leading-5 text-slate-500">تُفتح محادثة برسالة جاهزة، ولن تُرسل إلا بعد ضغطك على الإرسال في WhatsApp. لا تتضمن الرسالة أرقام البطاقة الضريبية أو الحسابات البنكية، والمستندات لا تُرفق تلقائيًا.</p>
      </section>

      <div role="status" className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-900">المنتجات التجريبية وصورها محفوظة محليًا على هذا الجهاز فقط. تبقى منفصلة تمامًا، ويبدأ المتجر الحقيقي فارغًا بعد الموافقة.</div>

      {draft && <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900"><p className="font-bold">ملف التقديم محفوظ كمسودة خاصة.</p><p className="mt-1">لا يظهر للإدارة ولا ينشئ متجرًا حتى ترفع المستندات المطلوبة وترسل الطلب.</p></section>}
      {pending && <section className="rounded-3xl border border-amber-200 bg-gradient-to-l from-amber-50 to-white p-4 shadow-sm sm:p-6"><Clock3 className="mb-3 text-amber-700" size={25} /><h2 className="font-bold text-amber-950">طلبك قيد مراجعة الإدارة</h2><p className="mt-2 text-sm leading-7 text-amber-900">يمكنك استكمال أو تحديث الملف والمستندات أثناء المراجعة. لن تعتمد الإدارة الطلب قبل اكتمال الملف.</p><p className="mt-2 text-xs leading-5 text-amber-800">تظهر تفاصيل الطلب والمستندات للمراجعين المخولين في تطبيق الإدارة. للتواصل، استخدم بطاقة WhatsApp الموجودة أعلى الصفحة.</p></section>}
      {approved && <section className="rounded-3xl border border-emerald-200 bg-gradient-to-l from-emerald-50 to-white p-5 shadow-sm"><CheckCircle2 className="mb-3 text-emerald-700" size={25} /><h2 className="font-bold text-emerald-950">تمت الموافقة على الطلب</h2><p className="mt-2 text-sm leading-7 text-emerald-900">حدّث حالة الطلب ليتحقق التطبيق من إنشاء المتجر الحقيقي والـschema.</p></section>}
      {rejected && <section className="rounded-3xl border border-rose-200 bg-gradient-to-l from-rose-50 to-white p-5 text-sm leading-7 text-rose-900 shadow-sm"><XCircle className="mb-2" size={22} /><p className="font-bold">لم تتم الموافقة على الطلب السابق.</p>{request.adminNote && <p className="mt-1">ملاحظة الإدارة: {request.adminNote}</p>}<p className="mt-1">عدّل الملف وأعد إرسال المستندات المطلوبة.</p></section>}

      {!approved && <form onSubmit={submit} className="space-y-5">
        <Section title="بيانات مقدم الطلب" icon={<ShieldCheck size={20} />} tone="sky">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الاسم الكامل لصاحب الحساب" value={fullName} onChange={setFullName} required maxLength={160} />
            <Field label="رقم الهاتف" value={phone} onChange={setPhone} type="tel" required maxLength={30} dir="ltr" />
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:col-span-2">البريد المرتبط بحساب الدخول: <span dir="ltr" className="font-semibold">{user?.email || '—'}</span></div>
          </div>
        </Section>

        <Section title="بيانات الشركة الأساسية" icon={<Building2 size={20} />} tone="violet">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الاسم القانوني للشركة" value={profile.legalName} onChange={(value) => updateProfile('legalName', value)} required maxLength={160} />
            <Field label="اسم المتجر الظاهر للعملاء" value={profile.displayName} onChange={(value) => updateProfile('displayName', value)} required maxLength={120} />
            <Field label="البريد الإلكتروني للشركة" value={profile.email} onChange={(value) => updateProfile('email', value)} type="email" required maxLength={255} />
          </div>
        </Section>

        <Section title="السجل التجاري والبطاقة الضريبية" icon={<FileText size={20} />} tone="amber">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="رقم السجل التجاري" value={profile.commercialRegisterNumber} onChange={(value) => updateProfile('commercialRegisterNumber', value)} required maxLength={100} placeholder="أدخل الرقم كما يظهر في المستند" />
            <Field label="رقم البطاقة الضريبية (Tax ID)" value={profile.taxId} onChange={(value) => updateProfile('taxId', value)} required maxLength={100} placeholder="أدخل الرقم الضريبي" />
          </div>
        </Section>

        <Section title="عنوان المستودع الرئيسي" icon={<MapPin size={20} />} tone="teal">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">المحافظة</span><select className={inputClass} required value={profile.warehouseAddress.governorate} onChange={(event) => updateAddress('governorate', event.target.value)}><option value="">اختر المحافظة</option>{egyptGovernorates.map((governorate) => <option key={governorate} value={governorate}>{governorate}</option>)}</select></label>
            <Field label="المدينة" value={profile.warehouseAddress.city} onChange={(value) => updateAddress('city', value)} required maxLength={240} placeholder="مثال: مدينة نصر" />
            <div className="sm:col-span-2"><Field label="الشارع والعنوان التفصيلي" value={profile.warehouseAddress.street} onChange={(value) => updateAddress('street', value)} required maxLength={240} placeholder="اسم الشارع ورقم المبنى وأقرب علامة مميزة" /></div>
          </div>
        </Section>

        <Section title="المستندات المطلوبة" icon={<Upload size={20} />} tone="rose">
          <p className="mb-4 text-xs leading-6 text-slate-500">ارفع البطاقة الشخصية والسجل التجاري وإثبات عنوان المستودع بصيغة PDF أو JPG أو PNG، بحد أقصى 10 ميجابايت لكل ملف. الملفات خاصة ومحفوظة في قاعدة البيانات، وتظهر للمراجعين المخولين فقط.</p>
          <div className="space-y-3">{documentTypes.map(({ key, label }) => {
            const hasExisting = canReuseExistingDocuments && existingDocuments.has(key);
            const selectedFile = files[key];
            return <label key={key} className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${hasExisting || selectedFile ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700">{key === 'commercialRegister' ? <FileCheck2 size={19} /> : key === 'propertyContract' ? <Home size={19} /> : <ShieldCheck size={19} />}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{label}</span><span className="mt-1 block text-xs text-slate-500">{selectedFile ? `ملف جديد: ${selectedFile.name}` : hasExisting ? `مرفوع ومحفوظ (${Math.ceil((request.documents.find((item) => item.documentType === key).sizeBytes || 0) / 1024)} كيلوبايت)` : 'لم يتم رفع هذا المستند'}</span></span>
              <span className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white"><Upload size={15} />{selectedFile || hasExisting ? 'اختيار بديل' : 'اختيار ملف'}<input type="file" accept={acceptedFiles} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) setFiles((current) => ({ ...current, [key]: file })); event.target.value = ''; }} /></span>
            </label>;
          })}</div>
        </Section>

        <Section title="وسيلة التحويل المالي المفضلة" icon={<Wallet size={20} />} tone="emerald">
          <div className="grid gap-3 sm:grid-cols-3">{payoutMethods.map((method) => <button key={method.value} type="button" onClick={() => updateProfile('payoutMethod', method.value)} className={`rounded-xl border-2 p-4 text-right transition ${profile.payoutMethod === method.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}><span className={`mb-3 block h-3 w-3 rounded-full ${profile.payoutMethod === method.value ? 'bg-brand-600' : 'bg-slate-300'}`} /><span className="text-sm font-semibold text-slate-800">{method.label}</span></button>)}</div>
          <div className="mt-4"><Field label={profile.payoutMethod === 'bank' ? 'رقم الـ IBAN' : 'رقم المحفظة أو الحساب'} value={profile.payoutNumber} onChange={(value) => updateProfile('payoutNumber', value)} required maxLength={100} dir="ltr" placeholder={profile.payoutMethod === 'bank' ? 'EGXX XXXX XXXX XXXX XXXX XX' : 'أدخل رقم الحساب أو المحفظة'} /></div>
          <p className="mt-3 text-xs leading-5 text-slate-500"><CreditCard className="ml-1 inline h-3.5 w-3.5" />لا تدخل بيانات بطاقة دفع أو رمز تحقق. بيانات التحويل لا تظهر في صفحات المتجر العامة.</p>
        </Section>

        {(error || remoteError) && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{error || remoteError}</p>}
        <button type="submit" disabled={saving} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 font-bold text-white transition hover:bg-brand-800 disabled:cursor-wait disabled:opacity-60">{saving ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={17} />}{saving ? 'جارٍ حفظ الملف ورفع المستندات...' : pending ? 'حفظ تحديثات الطلب وإرسالها للمراجعة' : 'حفظ الملف وإرسال طلب إنشاء المتجر'}</button>
      </form>}

      {remoteError && approved && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{remoteError}</p>}
      <button type="button" disabled={loading} onClick={onRefresh} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">{loading ? <LoaderCircle className="animate-spin" size={17} /> : <RefreshCw size={16} />}تحديث حالة طلب المتجر</button>
    </main>
  );
}
