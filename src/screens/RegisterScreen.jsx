import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Store,
  MapPin,
  CheckCircle2,
  User,
} from 'lucide-react';
import { isAndroidNative, isGoogleNativeAuthAvailable } from '@/lib/firebaseAuth';

export default function RegisterScreen({ onAuthComplete, onGoogleAuthComplete, onGoogleAuthRestart }) {
  const androidApp = isAndroidNative();
  const googleNative = isGoogleNativeAuthAvailable();
  const [mode, setMode] = useState(() => androidApp && !googleNative ? 'login' : 'register');
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [storeLocation, setStoreLocation] = useState(null);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isLogin = mode === 'login';

  const handleRequestLocation = () => {
    setLocationMessage('');
    if (!navigator.geolocation) { setLocationMessage('متصفحك لا يدعم تحديد الموقع. يمكنك المتابعة دون مشاركة موقعك.'); return; }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setStoreLocation({ latitude: coords.latitude, longitude: coords.longitude }); setLocationMessage('تم تحديد الموقع. لن تتم مشاركته إلا مع إدارة المنصة لتسهيل الشحن.'); setLocationBusy(false); },
      (err) => { setLocationMessage(err.code === 1 ? 'لم يتم السماح بالوصول للموقع. يمكنك تغيير الإذن من إعدادات الجهاز أو المتابعة دون الموقع.' : 'تعذر تحديد الموقع الآن. يمكنك المحاولة لاحقًا أو المتابعة دون مشاركة موقعك.'); setLocationBusy(false); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (googleNative) {
        await onGoogleAuthComplete({});
      } else {
        await onAuthComplete({
          mode,
          vendorName: vendorName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          storeLocation,
        });
      }
    } catch (err) {
      setError(err.message || 'تعذر إتمام العملية. حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleAuthRestart = async () => {
    setError('');
    setBusy(true);
    try {
      await onGoogleAuthRestart?.();
      setPhone('');
    } catch (err) {
      setError(err.message || 'تعذر تغيير حساب Google. حاول مرة أخرى.');
    } finally {
      setBusy(false);
    }
  };

  const inputClass = 'w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-4 pr-11 text-base text-slate-900 placeholder-slate-400 transition focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100';

  return (
    <div className="min-h-screen bg-gradient-to-bl from-brand-50 via-slate-50 to-white px-4 py-6 sm:px-6 sm:py-10" dir="rtl">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_28px_90px_-36px_rgba(15,23,42,0.28)] lg:grid-cols-[0.92fr_1.08fr]">
          <section className="relative hidden overflow-hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-12">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-28 -top-24 h-80 w-80 rounded-full bg-brand-500/20 blur-3xl" />
              <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-brand-500/[0.08]" />
            </div>

            <BrandLockup light />

            <div className="relative max-w-md space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                مساحة واحدة لإدارة متجرك
              </span>
              <div className="space-y-3">
                <h1 className="font-display text-3xl font-bold leading-[1.5] xl:text-4xl">
                  تجارتك أوضح،<br />
                  <span className="text-brand-300">وإدارتها أسهل.</span>
                </h1>
                <p className="max-w-sm text-base leading-8 text-slate-300">
                  تابع منتجاتك وطلباتك من لوحة بسيطة مصممة للتاجر.
                </p>
              </div>
              <div className="inline-flex items-center gap-2.5 text-sm text-slate-300">
                <ShieldCheck className="h-5 w-5 text-emerald-300" aria-hidden="true" />
                اتصال آمن لحماية حسابك
              </div>
            </div>

            <p className="relative text-xs tracking-wide text-slate-500">سوق اون لاين · لوحة تحكم التاجر</p>
          </section>

          <main className="flex items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="w-full max-w-md"
            >
              <div className="mb-8 flex items-center justify-between lg:hidden">
                <BrandLockup />
                <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">بوابة التاجر</span>
              </div>

              <div className="mb-7 space-y-2.5">
                <p className="text-xs font-bold tracking-wide text-brand-700">مرحبًا بك في متجرك</p>
                <h2 className="font-display text-2xl font-bold text-slate-950 sm:text-[1.75rem]">
                  {googleNative ? 'الدخول إلى متجرك' : isLogin ? 'تسجيل الدخول' : 'إنشاء حساب تاجر'}
                </h2>
                <p className="max-w-sm text-sm leading-7 text-slate-500">
                  {googleNative
                    ? 'تابع بحساب Google؛ الحساب الجديد يدخل إلى متجر تجريبي محلي، ويمكنك تقديم طلب إنشاء متجر حقيقي من الملف الشخصي.'
                    : isLogin
                      ? 'أدخل بيانات حسابك للمتابعة إلى متجرك.'
                      : 'أنشئ حسابك وادخل إلى متجر تجريبي محفوظ على هذا الجهاز. أرسل طلب إنشاء المتجر الحقيقي من الملف الشخصي بعد الدخول.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {googleNative ? (
                  <>
                    <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 px-4 py-3.5 text-xs leading-6 text-slate-500">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <p>الحساب المرتبط بمتجر معتمد يدخل إلى متجره، والحساب الجديد يبدأ بمتجر تجريبي محلي دون إنشاء مخطط بيانات.</p>
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="group flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 font-bold text-slate-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60"
                    >
                      {busy ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin text-brand-600" aria-hidden="true" />
                          <span>جارٍ التحقق من Google...</span>
                        </>
                      ) : (
                        <>
                          <GoogleMark className="h-6 w-6 shrink-0" />
                          <span>المتابعة باستخدام Google</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleGoogleAuthRestart}
                      className="w-full py-1 text-sm font-semibold text-slate-500 transition hover:text-brand-700 disabled:opacity-50"
                    >
                      استخدام حساب Google آخر
                    </button>
                  </>
                ) : (
                  <>
                    {androidApp && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-6 text-amber-800">
                        نسخة التطبيق الحالية لا تحتوي على تسجيل Google الأصلي. يمكنك الدخول بحسابك الحالي، أو تثبيت آخر إصدار Android لاستخدام Google.
                      </div>
                    )}
                    {!isLogin && (
                      <>
                        <Field icon={<User className="h-5 w-5" />} label="اسم التاجر" value={vendorName} onChange={setVendorName} placeholder="الاسم بالكامل" className={inputClass} required />
                        <Field icon={<Phone className="h-5 w-5" />} label="رقم الهاتف" value={phone} onChange={setPhone} placeholder="+20 1XX XXX XXXX" className={inputClass} type="tel" required />
                      </>
                    )}
                    <Field icon={<Mail className="h-5 w-5" />} label="البريد الإلكتروني" value={email} onChange={setEmail} placeholder="merchant@email.com" className={inputClass} type="email" required />
                    <Field icon={<Lock className="h-5 w-5" />} label="كلمة المرور" value={password} onChange={setPassword} placeholder="6 أحرف على الأقل" className={inputClass} type="password" minLength={6} required />
                    {!isLogin && (
                      <section className="rounded-2xl border border-brand-100 bg-brand-50/70 p-4" aria-label="مشاركة موقع المتجر">
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-800">هل ترغب في إضافة موقع المتجر؟</p>
                            <p className="mt-1 text-xs leading-6 text-slate-600">مشاركة الموقع اختيارية، وتساعد فريق الإدارة ومندوب الشحن على الوصول إليك وتسهيل تجهيز الطلبات وتسريع الاستجابة. لن نطلب الإذن إلا بعد ضغطك على الزر، ويمكنك المتابعة بدونه.</p>
                            <button type="button" onClick={handleRequestLocation} disabled={locationBusy || Boolean(storeLocation)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs font-bold text-brand-800 hover:bg-brand-100 disabled:opacity-60">
                              {storeLocation ? <CheckCircle2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                              {locationBusy ? 'جارٍ تحديد الموقع...' : storeLocation ? 'تم تحديد الموقع' : 'السماح بتحديد موقع المتجر'}
                            </button>
                            {locationMessage && <p role="status" className="mt-2 text-xs leading-5 text-slate-600">{locationMessage}</p>}
                          </div>
                        </div>
                      </section>
                    )}
                    <button
                      type="submit"
                      disabled={busy}
                      className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3.5 font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-brand-200 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60"
                    >
                      {busy ? (
                        <><Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> جارٍ الاتصال بالخادم...</>
                      ) : (
                        <>{isLogin ? 'دخول إلى الحساب' : 'إنشاء الحساب والمتابعة'}<ArrowLeft className="h-5 w-5" aria-hidden="true" /></>
                      )}
                    </button>
                  </>
                )}

                {error && (
                  <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-700">
                    {error}
                  </div>
                )}
              </form>

              {!androidApp && (
                <p className="mt-7 text-center text-sm text-slate-500">
                  {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setError('');
                      setMode(isLogin ? 'register' : 'login');
                    }}
                    className="font-bold text-brand-700 underline-offset-4 hover:text-brand-800 hover:underline disabled:opacity-50"
                  >
                    {isLogin ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
                  </button>
                </p>
              )}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

function BrandLockup({ light = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${light ? 'bg-brand-500 text-white' : 'bg-brand-600 text-white'}`}>
        <Store className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>
        <span className={`block font-display text-base font-bold ${light ? 'text-white' : 'text-slate-950'}`}>منصة السوق المصري</span>
        <span className={`mt-0.5 block text-xs ${light ? 'text-slate-400' : 'text-slate-500'}`}>لوحة تحكم التاجر</span>
      </span>
    </div>
  );
}

function GoogleMark({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      role="img"
      aria-label="Google"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.71 7.18l7.57 5.89c4.42-4.08 7.18-10.08 7.18-17.54Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.91l-7.57-5.89c-2.1 1.41-4.79 2.26-8.33 2.26-6.42 0-11.86-4.33-13.82-10.14l-7.98 6.19C6.14 42.68 14.54 48 24 48Z" />
      <path fill="#FBBC05" d="M10.18 28.32c-.5-1.4-.78-2.9-.78-4.32 0-1.42.28-2.92.78-4.32l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.9.94 7.58 2.56 10.78l7.62-6.46Z" />
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
    </svg>
  );
}

function Field({ icon, label, value, onChange, className, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative block">
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">{icon}</span>
        <input
          {...props}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      </span>
    </label>
  );
}
