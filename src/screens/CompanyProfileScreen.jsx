import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Building2, CheckCircle2, CreditCard, Download, FileCheck2,
  FileText, Home, Loader2, MapPin, Save, ShieldCheck, Upload, Wallet,
} from 'lucide-react';
import { companyProfileApi } from '@/api/client';
import { egyptGovernorates } from '@/data/egyptGovernorates';

const documentTypes = [
  { key: 'nationalId', label: 'البطاقة الشخصية لصاحب الحساب', icon: ShieldCheck },
  { key: 'commercialRegister', label: 'السجل التجاري', icon: FileCheck2 },
  { key: 'propertyContract', label: 'عقد أو بوليصة إثبات عنوان المستودع', icon: Home },
];
const payoutMethods = [
  { value: 'vodafone_cash', label: 'فودافون كاش' },
  { value: 'instapay', label: 'InstaPay' },
  { value: 'bank', label: 'حساب بنكي' },
];
const acceptedFiles = '.pdf,.jpg,.jpeg,.png';
const maxFileBytes = 10 * 1024 * 1024;

function formFromProfile(profile, fallbackEmail) {
  const company = profile?.company || {};
  const address = company.warehouse_address || company.warehouseAddress || {};
  return {
    legalName: company.legal_name || company.legalName || '',
    displayName: company.display_name || company.displayName || '',
    email: company.email || fallbackEmail || '',
    commercialRegisterNumber: company.commercial_register_number || company.commercialRegisterNumber || '',
    taxId: company.tax_id || company.taxId || '',
    warehouseAddress: {
      governorate: address.governorate || '',
      city: address.city || '',
      street: address.street || '',
    },
    payoutMethod: company.payout_method || company.payoutMethod || '',
    payoutNumber: company.payout_number || company.payoutNumber || '',
  };
}

export default function CompanyProfileScreen({ companyId, vendor, profile, loading, loadError, onRetry, onProfileUpdated }) {
  const [form, setForm] = useState(() => formFromProfile(profile, vendor?.email));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [downloading, setDownloading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const documents = profile?.documents || [];
  const completion = profile?.completion || { percentage: 0, completedCount: 0, totalCount: 8, isComplete: false, checks: [] };
  const documentByType = new Map(documents.map((document) => [document.document_type || document.documentType, document]));

  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const changeAddress = (field, value) => setForm((current) => ({
    ...current,
    warehouseAddress: { ...current.warehouseAddress, [field]: value },
  }));

  const saveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await companyProfileApi.save(companyId, form);
      setForm(formFromProfile(updated, vendor?.email));
      onProfileUpdated(updated);
      setSuccess('تم حفظ بيانات الشركة. سيبقى التنبيه ظاهرًا حتى استكمال بقية المتطلبات.');
    } catch (requestError) {
      setError(requestError.message || 'تعذر حفظ بيانات الشركة. حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const uploadDocument = async (documentType, file) => {
    if (!file) return;
    setError('');
    setSuccess('');
    if (file.size > maxFileBytes) {
      setError('حجم الملف يتجاوز 10 ميجابايت. اختر ملفًا أصغر.');
      return;
    }
    setUploading(documentType);
    try {
      const updated = await companyProfileApi.uploadDocument(companyId, documentType, file);
      onProfileUpdated(updated);
      setSuccess('تم حفظ المستند في التخزين الخاص بأمان.');
    } catch (requestError) {
      setError(requestError.message || 'تعذر رفع المستند. تحقق من اتصال الإنترنت وحاول مرة أخرى.');
    } finally {
      setUploading('');
    }
  };

  const downloadDocument = async (documentType) => {
    setError('');
    setDownloading(documentType);
    try {
      const blob = await companyProfileApi.downloadDocument(companyId, documentType);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentType}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (requestError) {
      setError(requestError.message || 'تعذر تنزيل المستند.');
    } finally {
      setDownloading('');
    }
  };

  if (loading && !profile) {
    return <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-5 text-sm text-brand-800"><Loader2 className="h-5 w-5 animate-spin" />جارٍ تحميل ملف الشركة المحفوظ...</div>;
  }

  if (loadError && !profile) {
    return (
      <section className="rounded-2xl border border-alert-200 bg-alert-50 p-5" dir="rtl" role="alert">
        <div className="flex items-start gap-3 text-alert-800"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><p className="text-sm leading-6">تعذر تحميل بيانات ملف الشركة. سيظل تنبيه الاستكمال ظاهرًا حتى يتم التحقق من الملف.</p></div>
        <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-alert-600 px-4 py-2 text-sm font-bold text-white hover:bg-alert-700">إعادة المحاولة</button>
      </section>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-2xl bg-gradient-to-l from-[#102a43] via-[#0f766e] to-[#0f3d56] p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Building2 className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-teal-100">بيانات المنشأة والتحقق التجاري</p>
            <h1 className="mt-1 text-2xl font-bold">ملف الشركة</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-teal-50">احفظ بيانات الشركة والعنوان ووسيلة التحويل، ثم ارفع المستندات المطلوبة. لا يتم اعتماد الملف تلقائيًا بمجرد الحفظ.</p>
          </div>
        </div>
      </section>

      {!completion.isComplete && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border-2 border-alert-200 bg-alert-50 p-4 text-alert-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-alert-600" />
          <div><p className="font-bold">ملف الشركة غير مكتمل ({completion.percentage}%)</p><p className="mt-1 text-sm leading-6">سيظل التنبيه ظاهرًا في القائمة حتى حفظ البيانات ورفع المستندات المطلوبة.</p></div>
        </div>
      )}
      {completion.isComplete && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-financial-200 bg-financial-50 p-4 text-financial-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><p className="font-semibold">اكتمل الملف التجاري. تم حفظ البيانات والمستندات، ويظل أي اعتماد رسمي خاضعًا لمراجعة المنصة.</p>
        </div>
      )}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-financial-200 bg-financial-50 p-3 text-sm leading-6 text-financial-800">{success}</div>}

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6" aria-label="نسبة اكتمال الملف">
        <div className="mb-3 flex items-center justify-between gap-3"><span className="text-sm font-semibold text-slate-700">نسبة استكمال الملف</span><span className="text-2xl font-bold tabular-nums text-brand-700">{completion.percentage}%</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100"><motion.div initial={false} animate={{ width: `${completion.percentage}%` }} transition={{ duration: 0.45 }} className={`h-full rounded-full ${completion.isComplete ? 'bg-financial-500' : 'bg-brand-600'}`} /></div>
        <p className="mt-3 text-xs text-slate-500">اكتمل {completion.completedCount} من {completion.totalCount} متطلبات الملف.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {completion.checks.map((check) => <li key={check.key} className={`flex items-center gap-2 text-xs ${check.complete ? 'text-financial-700' : 'text-slate-500'}`}>
            {check.complete ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0 rounded-full border border-slate-300" />}{check.label}
          </li>)}
        </ul>
      </section>

      <form onSubmit={saveProfile} className="space-y-6">
        <Section title="بيانات الشركة الأساسية" icon={<Building2 className="h-5 w-5" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="الاسم القانوني للشركة" value={form.legalName} onChange={(value) => change('legalName', value)} required maxLength={160} />
            <TextField label="اسم المتجر الظاهر للعملاء" value={form.displayName} onChange={(value) => change('displayName', value)} required maxLength={120} />
            <TextField label="البريد الإلكتروني للشركة" value={form.email} onChange={(value) => change('email', value)} type="email" required maxLength={255} />
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0 text-financial-600" />لا تُعرض بيانات السجل والتحويل والمستندات إلا لصاحب الشركة أو مدير مخوّل.</div>
          </div>
        </Section>

        <Section title="السجل التجاري والبطاقة الضريبية" icon={<FileText className="h-5 w-5" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="رقم السجل التجاري" value={form.commercialRegisterNumber} onChange={(value) => change('commercialRegisterNumber', value)} icon={<FileText className="h-5 w-5" />} maxLength={100} placeholder="أدخل الرقم كما يظهر في المستند" />
            <TextField label="رقم البطاقة الضريبية (Tax ID)" value={form.taxId} onChange={(value) => change('taxId', value)} icon={<CreditCard className="h-5 w-5" />} maxLength={100} placeholder="أدخل الرقم الضريبي" />
          </div>
        </Section>

        <Section title="عنوان المستودع الرئيسي" icon={<MapPin className="h-5 w-5" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="warehouse-governorate" className="mb-1.5 block text-sm font-semibold text-slate-700">المحافظة</label>
              <select id="warehouse-governorate" value={form.warehouseAddress.governorate} onChange={(event) => changeAddress('governorate', event.target.value)} className={inputClass}>
                <option value="">اختر المحافظة</option>{egyptGovernorates.map((governorate) => <option key={governorate} value={governorate}>{governorate}</option>)}
              </select>
            </div>
            <TextField label="المدينة" value={form.warehouseAddress.city} onChange={(value) => changeAddress('city', value)} icon={<MapPin className="h-5 w-5" />} maxLength={240} placeholder="مثال: مدينة نصر" />
          </div>
          <div className="mt-4"><TextField label="الشارع والعنوان التفصيلي" value={form.warehouseAddress.street} onChange={(value) => changeAddress('street', value)} icon={<Home className="h-5 w-5" />} maxLength={240} placeholder="اسم الشارع ورقم المبنى وأقرب علامة مميزة" /></div>
        </Section>

        <Section title="المستندات المطلوبة" icon={<Upload className="h-5 w-5" />}>
          <p className="mb-4 text-xs leading-6 text-slate-500">الملفات تحفظ في Cloudflare KV ولا تُعرض للعامة. الأنواع المقبولة PDF وJPG وPNG، بحد أقصى 10 ميجابايت للملف. قد يستغرق ظهور الملف في مناطق Cloudflare الأخرى دقيقة أو أكثر.</p>
          <div className="space-y-3">
            {documentTypes.map(({ key, label, icon: Icon }) => {
              const document = documentByType.get(key);
              return <article key={key} className={`rounded-2xl border p-4 ${document ? 'border-financial-200 bg-financial-50/60' : 'border-slate-200 bg-white'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${document ? 'bg-financial-100 text-financial-700' : 'bg-slate-100 text-slate-500'}`}>{document ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}</div>
                  <div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">{label}</p><p className="mt-1 text-xs text-slate-500">{document ? `مرفوع ومحفوظ (${Math.ceil(document.size_bytes / 1024)} كيلوبايت)` : 'لم يتم رفع هذا المستند بعد'}</p></div>
                  {document && <button type="button" onClick={() => downloadDocument(key)} disabled={downloading === key} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-brand-300 disabled:opacity-50"><Download className="h-4 w-4" />{downloading === key ? 'جارٍ التجهيز...' : 'تنزيل'}</button>}
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-700 has-[:disabled]:cursor-wait has-[:disabled]:opacity-60">
                    {uploading === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploading === key ? 'جارٍ الرفع...' : document ? 'استبدال الملف' : 'اختيار ورفع ملف'}
                    <input type="file" accept={acceptedFiles} className="sr-only" disabled={Boolean(uploading)} onChange={(event) => { const file = event.target.files?.[0]; uploadDocument(key, file); event.target.value = ''; }} />
                  </label>
                </div>
              </article>;
            })}
          </div>
        </Section>

        <Section title="وسيلة التحويل المالي المفضلة" icon={<Wallet className="h-5 w-5" />}>
          <div className="grid gap-3 sm:grid-cols-3">
            {payoutMethods.map((method) => <button key={method.value} type="button" onClick={() => change('payoutMethod', method.value)} className={`rounded-xl border-2 p-4 text-right transition ${form.payoutMethod === method.value ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <span className={`mb-3 block h-3 w-3 rounded-full ${form.payoutMethod === method.value ? 'bg-brand-600' : 'bg-slate-300'}`} /><span className="text-sm font-semibold text-slate-800">{method.label}</span>
            </button>)}
          </div>
          <div className="mt-4"><TextField label={form.payoutMethod === 'bank' ? 'رقم الـ IBAN' : 'رقم المحفظة أو الحساب'} value={form.payoutNumber} onChange={(value) => change('payoutNumber', value)} type="text" dir="ltr" icon={<Wallet className="h-5 w-5" />} maxLength={100} placeholder={form.payoutMethod === 'bank' ? 'EGXX XXXX XXXX XXXX XXXX XX' : 'أدخل رقم الحساب أو المحفظة'} /></div>
          <p className="mt-3 text-xs leading-5 text-slate-500">تُحفظ بيانات التحويل في Neon ولا تظهر في صفحات المتجر العامة؛ لا تدخل بيانات بطاقة دفع أو رمز تحقق.</p>
        </Section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">يمكنك حفظ الملف على مراحل؛ لن يُعتبر مكتملًا حتى حفظ جميع البيانات ورفع المستندات الثلاثة.</p>
          <button type="submit" disabled={saving || loading} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-wait disabled:opacity-60">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}{saving ? 'جارٍ حفظ الملف...' : 'حفظ بيانات الشركة'}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

function TextField({ label, value, onChange, type = 'text', icon, required = false, maxLength, placeholder = '', dir = 'auto' }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}
    <span className="relative mt-1.5 block">
      {icon && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <input type={type} dir={dir} value={value} onChange={(event) => onChange(event.target.value)} required={required} maxLength={maxLength} placeholder={placeholder} className={`${inputClass} ${icon ? 'pr-11' : ''}`} />
    </span>
  </label>;
}

function Section({ title, icon, children }) {
  return <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">{icon}</div><h2 className="font-display text-lg font-bold text-slate-900">{title}</h2></div>{children}
  </motion.section>;
}
