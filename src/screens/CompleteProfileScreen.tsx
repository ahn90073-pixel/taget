import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, FileText, MapPin, Wallet, Upload, CheckCircle2,
  CreditCard, Building, Home, Lock, ShieldCheck, ArrowLeft, Loader2,
  IdCard, FileCheck, FileSignature, FastForward, AlertCircle
} from 'lucide-react';
import type { VendorData } from '@/types';
import { egyptGovernorates } from '@/data/mockData';

interface CompleteProfileScreenProps {
  vendorData: Partial<VendorData>;
  onComplete: (vendor: VendorData) => void;
}

type DocKey = 'nationalId' | 'commercialRegister' | 'propertyContract';

export default function CompleteProfileScreen({ vendorData, onComplete }: CompleteProfileScreenProps) {
  const [commercialRegister, setCommercialRegister] = useState('');
  const [taxId, setTaxId] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<VendorData['payoutMethod']>('');
  const [payoutNumber, setPayoutNumber] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<Record<DocKey, boolean>>({
    nationalId: false,
    commercialRegister: false,
    propertyContract: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const checks = [
    { key: 'cr' as const, done: !!commercialRegister && commercialRegister.length >= 5 },
    { key: 'tax' as const, done: !!taxId && taxId.length >= 5 },
    { key: 'addr' as const, done: !!governorate && !!city && !!street },
    { key: 'id' as const, done: uploadedDocs.nationalId },
    { key: 'crDoc' as const, done: uploadedDocs.commercialRegister },
    { key: 'propDoc' as const, done: uploadedDocs.propertyContract },
    { key: 'payout' as const, done: !!payoutMethod && !!payoutNumber },
  ];

  const progress = Math.round((checks.filter(c => c.done).length / checks.length) * 100);
  const isComplete = progress === 100;

  const handleDocUpload = (key: DocKey) => {
    setUploadedDocs(prev => ({ ...prev, [key]: true }));
  };

  const handleSubmit = () => {
    if (!isComplete) return;
    setSubmitting(true);
    setTimeout(() => {
      onComplete({
        vendorName: vendorData.vendorName || '',
        email: vendorData.email || '',
        phone: vendorData.phone || '',
        storeName: vendorData.storeName || '',
        storeNameEn: '',
        status: 'verified',
        commercialRegister,
        taxId,
        warehouseAddress: { governorate, city, street },
        payoutMethod,
        payoutNumber,
        uploadedDocs,
      });
    }, 1800);
  };

  const handleSkipForDev = () => {
    onComplete({
      vendorName: vendorData.vendorName || 'تاجر تجريبي',
      email: vendorData.email || 'dev@store.test',
      phone: vendorData.phone || '+20 100 000 0000',
      storeName: vendorData.storeName || 'متجر تجريبي',
      storeNameEn: '',
      status: 'verified',
      commercialRegister: commercialRegister || 'DEV-00000',
      taxId: taxId || 'DEV-TAX-000',
      warehouseAddress: {
        governorate: governorate || 'القاهرة',
        city: city || 'مدينة نصر',
        street: street || 'عنوان تجريبي — وضع التطوير',
      },
      payoutMethod: payoutMethod || 'vodafone_cash',
      payoutNumber: payoutNumber || '01000000000',
      uploadedDocs: {
        nationalId: true,
        commercialRegister: true,
        propertyContract: true,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <ShieldCheck className="w-4 h-4" />
            خطوة إلزامية — التحقق التجاري (KYC)
          </div>
          <h1 className="text-3xl font-bold text-slate-900 font-display mb-2">
            إكمال الملف التجاري
          </h1>
          <p className="text-slate-500">
            يجب استكمال جميع البيانات والوثائق لتفعيل حسابك والبدء في البيع
          </p>
        </div>

        {/* Lock Alert Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 mb-6 flex items-start gap-4 border-2 transition-all ${
            isComplete
              ? 'bg-financial-50 border-financial-200'
              : 'bg-alert-50 border-alert-200'
          }`}
        >
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            isComplete ? 'bg-financial-100' : 'bg-alert-100'
          }`}>
            {isComplete ? <CheckCircle2 className="w-6 h-6 text-financial-600" /> : <AlertTriangle className="w-6 h-6 text-alert-600" />}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold mb-1 ${isComplete ? 'text-financial-800' : 'text-alert-800'}`}>
              {isComplete ? 'اكتمل الملف التجاري!' : 'حسابك قيد المراجعة أو غير مكتمل البيانات'}
            </h3>
            <p className={`text-sm ${isComplete ? 'text-financial-700' : 'text-alert-700'}`}>
              {isComplete
                ? 'يمكنك الآن تفعيل حسابك والبدء في إضافة المنتجات واستلام الأرباح.'
                : 'لا يمكنك إضافة منتجات جديدة أو سحب أرباح حتى استكمال البيانات الوثائقية الرسمية.'}
            </p>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">نسبة استكمال الملف</span>
            <motion.span
              key={progress}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`text-2xl font-bold font-display ${
                isComplete ? 'text-financial-600' : 'text-brand-600'
              }`}
            >
              {progress}%
            </motion.span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-all ${
                isComplete
                  ? 'bg-gradient-to-l from-financial-400 to-financial-600'
                  : 'bg-gradient-to-l from-brand-400 to-brand-600'
              }`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="flex gap-1.5 mt-3">
            {checks.map((c, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  c.done ? 'bg-financial-400' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Commercial Register & Tax ID */}
        <Section title="بيانات السجل التجاري والبطاقة الضريبية" icon={<Building className="w-5 h-5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="رقم السجل التجاري"
              placeholder="مثال: ٨٧٥٤٣"
              value={commercialRegister}
              onChange={setCommercialRegister}
              icon={<FileText className="w-5 h-5" />}
              done={!!commercialRegister && commercialRegister.length >= 5}
            />
            <TextInput
              label="رقم البطاقة الضريبية (Tax ID)"
              placeholder="مثال: ١٠٠-٢٠٠-٣٠٠"
              value={taxId}
              onChange={setTaxId}
              icon={<CreditCard className="w-5 h-5" />}
              done={!!taxId && taxId.length >= 5}
            />
          </div>
        </Section>

        {/* Warehouse Address */}
        <Section title="عنوان المستودع الرئيسي" icon={<MapPin className="w-5 h-5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">المحافظة</label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                  governorate ? 'border-financial-300' : 'border-slate-200'
                }`}
              >
                <option value="">اختر المحافظة</option>
                {egyptGovernorates.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <TextInput
              label="المدينة"
              placeholder="مثال: مدينة نصر"
              value={city}
              onChange={setCity}
              icon={<MapPin className="w-5 h-5" />}
              done={!!city}
            />
          </div>
          <div className="mt-4">
            <TextInput
              label="الشارع / العنوان التفصيلي"
              placeholder="مثال: شارع عباس العقاد، بجوار مسجد الرحمة"
              value={street}
              onChange={setStreet}
              icon={<Home className="w-5 h-5" />}
              done={!!street}
            />
          </div>
        </Section>

        {/* Document Uploads */}
        <Section title="رفع الصور والوثائق" icon={<Upload className="w-5 h-5" />}>
          <div className="space-y-4">
            <UploadZone
              label="صورة البطاقة الشخصية (وجه أمامي)"
              icon={<IdCard className="w-8 h-8" />}
              uploaded={uploadedDocs.nationalId}
              onUpload={() => handleDocUpload('nationalId')}
            />
            <UploadZone
              label="صورة السجل التجاري"
              icon={<FileCheck className="w-8 h-8" />}
              uploaded={uploadedDocs.commercialRegister}
              onUpload={() => handleDocUpload('commercialRegister')}
            />
            <UploadZone
              label="صورة بوليصة / عقد الممتلكات"
              icon={<FileSignature className="w-8 h-8" />}
              uploaded={uploadedDocs.propertyContract}
              onUpload={() => handleDocUpload('propertyContract')}
            />
          </div>
        </Section>

        {/* Payout Method */}
        <Section title="وسيلة التحويل المالي المفضلة" icon={<Wallet className="w-5 h-5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[
              { key: 'vodafone_cash' as const, label: 'فودافون كاش', color: 'bg-red-500' },
              { key: 'instapay' as const, label: 'InstaPay', color: 'bg-purple-500' },
              { key: 'bank' as const, label: 'حساب بنكي', color: 'bg-brand-600' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setPayoutMethod(opt.key)}
                className={`p-4 rounded-xl border-2 transition-all text-right ${
                  payoutMethod === opt.key
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${opt.color} mb-2`} />
                <span className="font-semibold text-slate-800 text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
          <TextInput
            label={payoutMethod === 'bank' ? 'رقم الـ IBAN' : 'رقم المحفظة / الحساب'}
            placeholder={payoutMethod === 'bank' ? 'EGXX XXXX XXXX XXXX XXXX XX' : 'مثال: 01012345678'}
            value={payoutNumber}
            onChange={setPayoutNumber}
            icon={<Wallet className="w-5 h-5" />}
            done={!!payoutMethod && !!payoutNumber}
          />
        </Section>

        {/* Submit Button */}
        <div className="mt-8">
          <motion.button
            onClick={handleSubmit}
            disabled={!isComplete || submitting}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              isComplete && !submitting
                ? 'bg-financial-600 hover:bg-financial-700 text-white shadow-lg shadow-financial-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            whileTap={isComplete ? { scale: 0.98 } : {}}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري تفعيل الحساب...
              </>
            ) : isComplete ? (
              <>
                <ShieldCheck className="w-5 h-5" />
                تفعيل الحساب والبدء في البيع
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                أكمل البيانات لتفعيل الحساب ({progress}%)
              </>
            )}
          </motion.button>

          {!isComplete && (
            <p className="text-center text-slate-400 text-sm mt-3">
              يجب استكمال جميع الحقول ورفع جميع الوثائق لتفعيل الحساب
            </p>
          )}
        </div>

        {/* Skip for Development */}
        <div className="mt-4 border-t border-dashed border-slate-200 pt-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-400 text-xs leading-relaxed">
              وضع التطوير: يمكنك تخطي المتطلبات الإلزامية مؤقتاً للتجربة. سيتم تفعيل الحساب ببيانات تجريبية.
            </p>
          </div>
          <button
            onClick={handleSkipForDev}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-semibold text-sm hover:border-brand-400 hover:text-brand-600 transition-all flex items-center justify-center gap-2"
          >
            <FastForward className="w-4 h-4" />
            تخطي للتطوير (Dev Bypass)
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-slate-100"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-slate-900 font-display">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

interface TextInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  done: boolean;
  type?: string;
}

function TextInput({ label, placeholder, value, onChange, icon, done, type = 'text' }: TextInputProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${done ? 'text-financial-500' : 'text-slate-400'}`}>
          {done ? <CheckCircle2 className="w-5 h-5" /> : icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pr-11 pl-4 py-3 rounded-xl border bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${
            done
              ? 'border-financial-300 focus:ring-financial-500'
              : 'border-slate-200 focus:ring-brand-500'
          }`}
        />
      </div>
    </div>
  );
}

interface UploadZoneProps {
  label: string;
  icon: React.ReactNode;
  uploaded: boolean;
  onUpload: () => void;
}

function UploadZone({ label, icon, uploaded, onUpload }: UploadZoneProps) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      onClick={onUpload}
      onDragOver={(e) => { e.preventDefault(); setHovering(true); }}
      onDragLeave={() => setHovering(false)}
      onDrop={(e) => { e.preventDefault(); setHovering(false); onUpload(); }}
      className={`relative rounded-xl border-2 border-dashed p-6 flex items-center gap-4 cursor-pointer transition-all ${
        uploaded
          ? 'border-financial-300 bg-financial-50'
          : hovering
            ? 'border-brand-400 bg-brand-50'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
      }`}
    >
      <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${
        uploaded ? 'bg-financial-100 text-financial-600' : 'bg-slate-100 text-slate-400'
      }`}>
        {uploaded ? <CheckCircle2 className="w-8 h-8" /> : icon}
      </div>
      <div className="flex-1">
        <p className={`font-semibold ${uploaded ? 'text-financial-800' : 'text-slate-700'}`}>{label}</p>
        <p className={`text-sm ${uploaded ? 'text-financial-600' : 'text-slate-400'}`}>
          {uploaded ? 'تم رفع الملف بنجاح' : 'اضغط أو اسحب الملف هنا (JPG, PNG, PDF)'}
        </p>
      </div>
      {!uploaded && (
        <div className="flex-shrink-0 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-500 text-sm font-medium">
          تصفح
        </div>
      )}
    </div>
  );
}
