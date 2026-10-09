import { AlertCircle, Truck } from 'lucide-react';

export default function OrdersScreen() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">طلبات الشحن</h1>
        <p className="mt-1 text-sm text-slate-500">بيانات الطلبات التي تصل إلى متجرك من الخادم فقط.</p>
      </div>
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
          <div>
            <h2 className="font-bold text-amber-900">بيانات الطلبات غير متاحة من الخادم حاليًا</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">واجهة التاجر لا توفر حتى الآن نقطة API لقراءة طلبات هذا المتجر. أزلنا سجلات الطلبات وبوالص الشحن التجريبية، ولن نعرض بيانات أو أرقامًا غير مستلمة من الخادم.</p>
          </div>
        </div>
      </section>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
        <Truck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-500">لن تظهر طلبات هنا حتى يتيح الخادم بياناتها الفعلية.</p>
      </div>
    </div>
  );
}
