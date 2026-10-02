import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Mail, Phone, Lock, User, Building2, ArrowLeft, CheckCircle2, Database, Loader2, ShieldCheck } from 'lucide-react';

interface RegisterScreenProps {
  onRegisterComplete: (vendor: {
    vendorName: string;
    email: string;
    phone: string;
    storeName: string;
  }) => void;
}

type Phase = 'form' | 'creating_schema' | 'schema_done';

export default function RegisterScreen({ onRegisterComplete }: RegisterScreenProps) {
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [schemaStep, setSchemaStep] = useState(0);

  const schemaSteps = [
    'تشفير بيانات التاجر وإنشاء المفتاح الخاص...',
    'إنشاء قاعدة بيانات مستقلة للسكويما...',
    'تهيئة جداول المنتجات والمبيعات والشحن...',
    'تفعيل سياسات الأمان والحماية (RLS)...',
    'ربط حساب التاجر بالنظام المالي...',
  ];

  const schemaName = storeName
    ? 'tenant_' + storeName.replace(/[^a-zA-Zأ-ي]/g, '').toLowerCase().substring(0, 10) || 'tenant_new'
    : 'tenant_newstore';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !email || !phone || !password || !storeName) return;
    setPhase('creating_schema');

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < schemaSteps.length) {
        setSchemaStep(step);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setPhase('schema_done');
          setTimeout(() => {
            onRegisterComplete({ vendorName, email, phone, storeName });
          }, 1200);
        }, 600);
      }
    }, 900);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Right Panel - Branding (RTL: appears on right) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-brand-500 blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-financial-500 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display">منصة السوق المصري</h1>
            <p className="text-slate-400 text-sm">لوحة تحكم التاجر المتقدمة</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold font-display leading-relaxed">
            ابدأ رحلتك التجارية<br />
            <span className="text-brand-400">في أكبر سوق إلكتروني بمصر</span>
          </h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            انضم لآلاف التجار الذين يديرون متاجرهم بكفاءة عبر منصتنا السحابية متعددة المستأجرين.
            بياناتك معزولة بالكامل ومحمية بأعلى معايير الأمان.
          </p>
          <div className="space-y-3 pt-4">
            {[
              'قاعدة بيانات مستقلة (Schema) لكل متجر',
              'عداد مالي مباشر ومتابعة الأرباح لحظياً',
              'تكامل مع شركات الشحن المصرية (Bosta, Aramex, Mylerz)',
              'إيصالات سداد PDF مع إرسال تلقائي عبر واتساب',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-financial-400 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-slate-400 text-sm">
          <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> تشفير SSL</span>
          <span>•</span>
          <span>معتمد من هيئة التنمية</span>
        </div>
      </div>

      {/* Left Panel - Form / Schema Animation */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* Form Phase */}
            {phase === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.3 }}
              >
                <div className="lg:hidden flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-lg font-bold text-slate-900 font-display">منصة السوق المصري</h1>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 font-display mb-2">إنشاء حساب تاجر جديد</h2>
                <p className="text-slate-500 mb-8">املأ البيانات التالية لإنشاء متجرك على المنصة</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <FormField
                    icon={<User className="w-5 h-5" />}
                    label="اسم التاجر"
                    placeholder="مثال: أحمد محمد"
                    value={vendorName}
                    onChange={setVendorName}
                  />
                  <FormField
                    icon={<Mail className="w-5 h-5" />}
                    label="البريد الإلكتروني"
                    type="email"
                    placeholder="merchant@email.com"
                    value={email}
                    onChange={setEmail}
                  />
                  <FormField
                    icon={<Phone className="w-5 h-5" />}
                    label="رقم الهاتف"
                    type="tel"
                    placeholder="+20 1XX XXX XXXX"
                    value={phone}
                    onChange={setPhone}
                  />
                  <FormField
                    icon={<Lock className="w-5 h-5" />}
                    label="كلمة المرور"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                  />
                  <FormField
                    icon={<Building2 className="w-5 h-5" />}
                    label="اسم الشركة / المتجر"
                    placeholder="مثال: متجر الأمل للتجارة"
                    value={storeName}
                    onChange={setStoreName}
                  />

                  <button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group"
                  >
                    إنشاء حساب التاجر
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                  </button>
                </form>

                <p className="text-center text-slate-400 text-sm mt-6">
                  بإنشائك حساباً، فإنك توافق على <span className="text-brand-600 cursor-pointer">شروط الاستخدام</span> و <span className="text-brand-600 cursor-pointer">سياسة الخصوصية</span>
                </p>
              </motion.div>
            )}

            {/* Schema Creation Phase */}
            {phase === 'creating_schema' && (
              <motion.div
                key="schema"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center"
              >
                <div className="relative inline-block mb-8">
                  <div className="w-24 h-24 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto">
                    <Database className="w-12 h-12 text-brand-400 animate-pulse" />
                  </div>
                  <div className="absolute -inset-2 rounded-2xl border-2 border-brand-400/30 animate-ping" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900 font-display mb-2">
                  جاري إنشاء السكيما الخاصة بمتجرك
                </h2>
                <p className="text-slate-500 mb-8">
                  نقوم بتجهيز قاعدة بيانات مستقلة وآمنة لكل بيانات متجرك
                </p>

                <div className="bg-slate-900 rounded-xl p-5 text-right mb-6 font-mono text-sm">
                  <div className="text-slate-400 mb-1">$ SQL &gt;</div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-brand-400"
                  >
                    CREATE SCHEMA <span className="text-financial-400">{schemaName}</span>;
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-slate-500 mt-1"
                  >
                    → تهيئة الجداول والصلاحيات...
                  </motion.div>
                </div>

                <div className="space-y-3 text-right">
                  {schemaSteps.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 transition-all duration-500 ${
                        i <= schemaStep ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      {i < schemaStep ? (
                        <CheckCircle2 className="w-5 h-5 text-financial-500 flex-shrink-0" />
                      ) : i === schemaStep ? (
                        <Loader2 className="w-5 h-5 text-brand-500 animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${i <= schemaStep ? 'text-slate-700' : 'text-slate-400'}`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-l from-brand-500 to-financial-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${((schemaStep + 1) / schemaSteps.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-slate-400 text-sm mt-2">
                    {Math.round(((schemaStep + 1) / schemaSteps.length) * 100)}% مكتمل
                  </p>
                </div>
              </motion.div>
            )}

            {/* Schema Done Phase */}
            {phase === 'schema_done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="w-24 h-24 rounded-full bg-financial-100 flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="w-14 h-14 text-financial-600" />
                </motion.div>
                <h2 className="text-2xl font-bold text-slate-900 font-display mb-2">
                  تم إنشاء متجرك بنجاح!
                </h2>
                <p className="text-slate-500">
                  السكيما <span className="font-mono text-financial-600 font-bold">{schemaName}</span> جاهزة للاستخدام
                </p>
                <p className="text-slate-400 text-sm mt-4">جاري التحويل لإكمال الملف التجاري...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface FormFieldProps {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}

function FormField({ icon, label, placeholder, value, onChange, type = 'text' }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
        />
      </div>
    </div>
  );
}
