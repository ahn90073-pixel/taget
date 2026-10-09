import { AlertCircle, Receipt } from 'lucide-react';

export default function VouchersScreen() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">المحفظة والإيصالات</h1>
        <p className="mt-1 text-sm text-slate-500">لا نعرض سوى المعاملات المالية التي يؤكدها الخادم.</p>
      </div>
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
          <div>
            <h2 className="font-bold text-amber-900">بيانات المحفظة غير متاحة من الخادم حاليًا</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">لا توفر واجهة التاجر حاليًا خدمة لقراءة الأرصدة أو الإيصالات أو لتسجيل دفعة. أزلنا المبالغ والإيصالات ومحاكاة الدفع الافتراضية، ولن يتغير أي رصيد من داخل التطبيق دون تأكيد فعلي من الخادم.</p>
          </div>
        </div>
      </section>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
        <Receipt className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-500">لن تظهر معاملات هنا حتى يربط الخادم بيانات المحفظة الفعلية.</p>
      </div>
    </div>
  );
}
