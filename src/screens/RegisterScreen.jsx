import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Mail, Phone, Lock, User, Building2, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function RegisterScreen({ onAuthComplete }) {
  const [mode, setMode] = useState('register');
  const [vendorName, setVendorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isLogin = mode === 'login';
  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await onAuthComplete({ mode, vendorName: vendorName.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password, storeName: storeName.trim() }); }
    catch (err) { setError(err.message || 'تعذر إتمام العملية. حاول مرة أخرى.'); }
    finally { setBusy(false); }
  };
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-11 text-slate-900 placeholder-slate-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500';
  return <div className="flex min-h-screen bg-slate-50" dir="rtl">
    <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex">
      <div className="absolute -right-16 top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"/><div className="absolute -bottom-20 left-0 h-96 w-96 rounded-full bg-financial-500/20 blur-3xl"/>
      <div className="relative flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500"><Store className="h-6 w-6"/></div><div><h1 className="font-display text-xl font-bold">منصة السوق المصري</h1><p className="text-sm text-slate-400">لوحة تحكم التاجر</p></div></div>
      <div className="relative max-w-lg space-y-5"><h2 className="font-display text-3xl font-bold leading-relaxed">ابدأ رحلتك التجارية<br/><span className="text-brand-400">وأدر متجرك من مكان واحد</span></h2><p className="text-lg leading-relaxed text-slate-300">تسجيل آمن وربط مباشر ببيانات متجرك ومنتجاتك.</p><div className="flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="h-5 w-5 text-financial-400"/> اتصال مشفر عبر HTTPS</div></div><p className="relative text-sm text-slate-500">سوق اون لاين</p>
    </section>
    <main className="flex flex-1 items-center justify-center p-5 sm:p-10"><motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="w-full max-w-md">
      <div className="mb-8 flex items-center gap-3 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white"><Store className="h-6 w-6"/></div><h1 className="font-display text-lg font-bold text-slate-900">منصة السوق المصري</h1></div>
      <h2 className="mb-2 font-display text-2xl font-bold text-slate-900">{isLogin?'تسجيل الدخول':'إنشاء حساب تاجر'}</h2><p className="mb-7 text-sm text-slate-500">{isLogin?'أدخل بيانات حسابك للمتابعة إلى متجرك.':'أدخل بياناتك لإنشاء حسابك وربط متجرك بالمنصة.'}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin&&<><Field icon={<User className="h-5 w-5"/>} label="اسم التاجر" value={vendorName} onChange={setVendorName} placeholder="الاسم بالكامل" className={inputClass} required/><Field icon={<Phone className="h-5 w-5"/>} label="رقم الهاتف" value={phone} onChange={setPhone} placeholder="+20 1XX XXX XXXX" className={inputClass} type="tel" required/><Field icon={<Building2 className="h-5 w-5"/>} label="اسم المتجر" value={storeName} onChange={setStoreName} placeholder="اسم الشركة أو المتجر" className={inputClass} required/></>}
        <Field icon={<Mail className="h-5 w-5"/>} label="البريد الإلكتروني" value={email} onChange={setEmail} placeholder="merchant@email.com" className={inputClass} type="email" required/><Field icon={<Lock className="h-5 w-5"/>} label="كلمة المرور" value={password} onChange={setPassword} placeholder="6 أحرف على الأقل" className={inputClass} type="password" minLength={6} required/>
        {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">{error}</div>}
        <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60">{busy?<><Loader2 className="h-5 w-5 animate-spin"/> جارٍ الاتصال بالخادم...</>:<>{isLogin?'دخول إلى الحساب':'إنشاء الحساب والمتجر'}<ArrowLeft className="h-5 w-5"/></>}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">{isLogin?'ليس لديك حساب؟':'لديك حساب بالفعل؟'}{' '}<button type="button" disabled={busy} onClick={()=>{setError('');setMode(isLogin?'register':'login');}} className="font-bold text-brand-600 hover:text-brand-700">{isLogin?'إنشاء حساب جديد':'تسجيل الدخول'}</button></p>
    </motion.div></main>
  </div>;
}
function Field({icon,label,value,onChange,className,...props}) { return <label className="block"><span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span><span className="relative block"><span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span><input {...props} value={value} onChange={event=>onChange(event.target.value)} className={className}/></span></label>; }
