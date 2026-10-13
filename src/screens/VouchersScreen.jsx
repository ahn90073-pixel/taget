import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Receipt, RefreshCw, Wallet } from 'lucide-react';
import { walletApi } from '@/api/client';

function formatMoney(value, currency = 'EGP') {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: /^[A-Z]{3}$/.test(currency || '') ? currency : 'EGP',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('ar-EG', { dateStyle: 'medium' }).format(date);
}

const statusLabels = {
  completed: { label: 'تم السداد', className: 'bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
  pending: { label: 'قيد الانتظار', className: 'bg-amber-50 text-amber-700', Icon: Clock3 },
};

export default function VouchersScreen({ vendor, token }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadWallet = useCallback(async () => {
    if (!vendor?.apiCompanyId || vendor?.isDemo) return;
    setLoading(true);
    setError('');
    try {
      setWallet(await walletApi.get(vendor.apiCompanyId));
    } catch (requestError) {
      setError(requestError.message || 'تعذر تحميل بيانات المحفظة.');
    } finally {
      setLoading(false);
    }
  }, [vendor?.apiCompanyId, vendor?.isDemo]);

  useEffect(() => {
    setWallet(null);
    if (!vendor?.isDemo && vendor?.apiCompanyId) void loadWallet();
  }, [loadWallet, token, vendor?.apiCompanyId, vendor?.isDemo]);

  if (vendor?.isDemo) {
    return (
      <div className="space-y-6" dir="rtl">
        <div><h1 className="text-xl font-bold text-slate-900">المحفظة والإيصالات</h1><p className="mt-1 text-sm text-slate-500">ملخص الرصيد وسجل السدادات المعتمدة من الإدارة.</p></div>
        <section className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
          <div><h2 className="font-bold text-amber-900">المحفظة غير مفعّلة في المتجر التجريبي</h2><p className="mt-2 text-sm leading-6 text-amber-900/80">ستظهر البيانات المالية بعد اعتماد المتجر وربطه ببيانات المبيعات والسدادات الفعلية. لا يعرض التطبيق أرصدة أو معاملات تجريبية.</p></div>
        </section>
      </div>
    );
  }

  const currency = wallet?.currency || 'EGP';
  const stats = [
    { label: 'إجمالي المبيعات', value: wallet?.totalSales, className: 'text-slate-900', Icon: Receipt },
    { label: 'عمولة المنصة', value: wallet?.commissionAmount, className: 'text-amber-700', Icon: Wallet, detail: wallet ? (wallet.commissionType === 'percentage' ? `النسبة ${wallet.commissionValue}%` : `رسوم ثابتة ${formatMoney(wallet.commissionValue, currency)}`) : '' },
    { label: 'المبلغ المسدد', value: wallet?.settledAmount, className: 'text-slate-700', Icon: CheckCircle2 },
    { label: 'الصافي المستحق', value: wallet?.netBalance, className: 'text-emerald-700', Icon: Wallet },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-xl font-bold text-slate-900">المحفظة والإيصالات</h1><p className="mt-1 text-sm text-slate-500">الأرقام محسوبة من بيانات الخادم وبنفس طريقة لوحة الإدارة.</p></div>
        <button type="button" onClick={loadWallet} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />تحديث البيانات</button>
      </div>

      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><button type="button" onClick={loadWallet} className="font-bold underline">إعادة المحاولة</button></div>}
      {loading && !wallet && <div role="status" className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-700"><RefreshCw className="h-4 w-4 animate-spin" />جارٍ تحميل بيانات المحفظة من الخادم...</div>}

      <section aria-label="ملخص المحفظة" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, className, Icon, detail }) => (
          <article key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-5 w-5" /></div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${className}`}>{wallet ? formatMoney(value, currency) : '—'}</p>
            {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
          </article>
        ))}
      </section>

      {wallet && <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">سجل السدادات من الإدارة</h2><p className="mt-1 text-xs text-slate-500">يعرض آخر 50 سندًا غير ملغى؛ الرصيد المسدد يحتسب السندات المكتملة فقط.</p></div>
        {wallet.settlements?.length ? <>
          <div className="hidden overflow-x-auto md:block"><table className="w-full text-right text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">السند / المرجع</th><th className="px-5 py-3">التاريخ والفترة</th><th className="px-5 py-3">الإجمالي</th><th className="px-5 py-3">العمولة</th><th className="px-5 py-3">الصافي</th><th className="px-5 py-3">طريقة الدفع</th><th className="px-5 py-3">الحالة</th></tr></thead><tbody className="divide-y divide-slate-100">{wallet.settlements.map((item) => { const status = statusLabels[item.status] || { label: item.status || 'غير محدد', className: 'bg-slate-100 text-slate-600', Icon: Clock3 }; const StatusIcon = status.Icon; return <tr key={item.id}><td className="px-5 py-4"><p className="font-medium text-slate-800">{item.reference || item.id}</p><p className="text-xs text-slate-400">{item.id}</p></td><td className="px-5 py-4 text-slate-600">{formatDate(item.date)}<p className="mt-1 text-xs text-slate-400">{item.period || '—'}</p></td><td className="px-5 py-4">{formatMoney(item.amount, item.currency)}</td><td className="px-5 py-4 text-amber-700">{formatMoney(item.commissionDeducted, item.currency)}</td><td className="px-5 py-4 font-semibold text-emerald-700">{formatMoney(item.netAmount, item.currency)}</td><td className="px-5 py-4 text-slate-600">{item.method || '—'}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}><StatusIcon className="h-3.5 w-3.5" />{status.label}</span></td></tr>; })}</tbody></table></div>
          <ul className="divide-y divide-slate-100 md:hidden">{wallet.settlements.map((item) => { const status = statusLabels[item.status] || { label: item.status || 'غير محدد', className: 'bg-slate-100 text-slate-600', Icon: Clock3 }; const StatusIcon = status.Icon; return <li key={item.id} className="space-y-2 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-800">{item.reference || item.id}</p><p className="mt-1 text-xs text-slate-500">{formatDate(item.date)} · {item.period || '—'}</p></div><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}><StatusIcon className="h-3.5 w-3.5" />{status.label}</span></div><div className="grid grid-cols-2 gap-2 text-xs"><p className="text-slate-500">الإجمالي: <b className="text-slate-800">{formatMoney(item.amount, item.currency)}</b></p><p className="text-slate-500">العمولة: <b className="text-amber-700">{formatMoney(item.commissionDeducted, item.currency)}</b></p><p className="text-slate-500">الصافي: <b className="text-emerald-700">{formatMoney(item.netAmount, item.currency)}</b></p><p className="text-slate-500">طريقة الدفع: <b className="text-slate-700">{item.method || '—'}</b></p></div></li>; })}</ul>
        </> : <div className="p-10 text-center"><Receipt className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="text-sm text-slate-500">لا توجد سندات سداد مسجلة لهذا المتجر بعد.</p></div>}
      </section>}
    </div>
  );
}
