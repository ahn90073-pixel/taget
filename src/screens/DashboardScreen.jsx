import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock3, Package, RefreshCw, XCircle } from 'lucide-react';
import { mapBackendProduct, productsApi } from '@/api/client';
import { formatNumber } from '@/utils/format';

const statusLabels = {
  active: 'نشط',
  pending: 'قيد المراجعة',
  rejected: 'مرفوض',
  draft: 'مسودة',
  archived: 'مؤرشف',
};

export default function DashboardScreen({ vendor, token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(Boolean(vendor.apiCompanyId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!vendor.apiCompanyId) {
      setLoading(false);
      setError('لم يربط الخادم هذا الحساب بمتجر؛ لا توجد بيانات متجر لعرضها.');
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError('');
    productsApi.list(vendor.apiCompanyId)
      .then((result) => {
        if (active) setProducts((result.items || []).map(mapBackendProduct));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'تعذر جلب بيانات المنتجات من الخادم.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [vendor.apiCompanyId, token]);

  const counts = useMemo(() => ({
    total: products.length,
    active: products.filter((product) => product.status === 'active').length,
    pending: products.filter((product) => product.status === 'pending').length,
    rejected: products.filter((product) => product.status === 'rejected').length,
  }), [products]);

  const stats = [
    { label: 'إجمالي المنتجات', value: counts.total, icon: Package, style: 'bg-brand-50 text-brand-700' },
    { label: 'منتجات نشطة', value: counts.active, icon: CheckCircle2, style: 'bg-financial-50 text-financial-700' },
    { label: 'قيد المراجعة', value: counts.pending, icon: Clock3, style: 'bg-amber-50 text-amber-700' },
    { label: 'منتجات مرفوضة', value: counts.rejected, icon: XCircle, style: 'bg-red-50 text-red-700' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-gradient-to-l from-[#102a43] via-[#0f766e] to-[#0f3d56] p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm text-teal-100">لوحة متجر متصلة بالبيانات الفعلية</p>
        <h1 className="mt-1 text-2xl font-bold">{vendor.storeName || 'اسم المتجر غير متاح'}</h1>
        {vendor.vendorName && <p className="mt-2 text-sm text-teal-100">{vendor.vendorName}</p>}
      </motion.section>

      <div role="status" className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
        <p>تعرض هذه اللوحة أعداد المنتجات التي جلبها التطبيق مباشرة من الخادم. لا توفر واجهة التاجر حاليًا بيانات المبيعات أو الطلبات أو المحفظة؛ لذلك لن تظهر هنا أرقام تقديرية أو سجلات تجريبية.</p>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="flex items-center gap-2 rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm text-brand-700"><RefreshCw className="h-4 w-4 animate-spin" />جارٍ تحميل بيانات المتجر من الخادم...</div>}

      <section aria-label="ملخص المنتجات الفعلي" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, style }) => (
          <article key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${style}`}><Icon className="h-5 w-5" /></div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{loading || error ? '—' : formatNumber(value)}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-bold text-slate-900">منتجات المتجر من الخادم</h2></div>
        {loading ? <p className="p-6 text-sm text-slate-500">جارٍ تحميل المنتجات...</p> : error ? <p className="p-6 text-sm text-slate-500">لم نعرض بيانات قديمة أو تجريبية؛ أصلح الاتصال بالخادم ثم أعد المحاولة.</p> : products.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">الخادم لا يعيد منتجات لهذا المتجر حاليًا.</p> : (
          <ul className="divide-y divide-slate-100">
            {products.slice(0, 5).map((product) => <li key={product.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 text-slate-500">{product.image ? <img src={product.image} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5" />}</div>
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{product.name || 'اسم المنتج غير متاح'}</p><p className="mt-0.5 text-xs text-slate-500">{product.category || 'التصنيف غير متاح'}</p></div>
              </div>
              <span className="flex-shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{statusLabels[product.status] || 'حالة غير معروفة'}</span>
            </li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
