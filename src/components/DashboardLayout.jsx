import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Package, Receipt, Truck, Store, Menu, X, LogOut, ShieldCheck, ChevronLeft, RefreshCw, Building2, AlertTriangle, Bell } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { exitAndroidApp, registerAndroidBackButton } from '@/utils/androidBackButton';
import { notificationsApi } from '@/api/client';
import { getStoredFcmToken, initializePushNotifications } from '@/utils/pushNotifications';

export default function DashboardLayout({ currentScreen, onNavigate, vendor, children, otaStatus, onOtaRefresh, otaRefreshing, onLogout, profileCompletion, profileLoading, profileLoadError }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState(() => vendor?.apiCompanyId && !vendor?.isDemo && getStoredFcmToken() ? 'enabled' : 'idle');
  const canManageProfile = vendor?.isDemo || ['owner', 'admin'].includes(vendor?.companyRole);
  const canViewWallet = vendor?.isDemo || ['owner', 'admin'].includes(vendor?.companyRole);
  const profileScreen = vendor?.isDemo ? 'STORE_PROFILE' : 'COMPANY_PROFILE';
  const navItems = [
    { screen: 'DASHBOARD', label: 'لوحة التحكم', icon: LayoutDashboard },
    { screen: profileScreen, label: vendor?.isDemo ? 'ملف طلب المتجر الحقيقي' : 'ملف الشركة', icon: Building2, profile: true },
    { screen: 'PRODUCTS', label: vendor?.isDemo ? 'منتجات تجريبية محلية' : 'إدارة المنتجات', icon: Package },
    { screen: 'ORDERS', label: 'طلبات الشحن', icon: Truck },
    { screen: 'VOUCHERS', label: 'سجل المحفظة والإيصالات', icon: Receipt },
  ];
  const currentLabel = navItems.find((item) => item.screen === currentScreen && (!item.profile || canManageProfile))?.label || 'لوحة التحكم';
  const profileIncomplete = !vendor?.isDemo && canManageProfile && !profileCompletion?.isComplete;
  const profilePercentage = profileCompletion?.percentage ?? 0;
  const otaState = otaStatus?.status || 'checking';
  const otaLabel = otaState === 'current' || otaState === 'updated'
    ? 'التطبيق محدّث'
    : otaState === 'error' ? 'تعذّر فحص التحديث' : 'فحص التحديث الهوائي';
  const otaColor = otaState === 'error'
    ? 'text-alert-400'
    : otaState === 'current' || otaState === 'updated' ? 'text-financial-400' : 'text-brand-400';
  const canEnablePush = Boolean(vendor?.apiCompanyId && !vendor?.isDemo);

  useEffect(() => {
    if (!canEnablePush) return undefined;
    const handleTokenReady = () => setPushStatus('enabled');
    window.addEventListener('fcm-token-ready', handleTokenReady);
    return () => window.removeEventListener('fcm-token-ready', handleTokenReady);
  }, [canEnablePush]);

  const handlePushActivation = async () => {
    if (!canEnablePush || pushStatus === 'activating') return;
    setPushStatus('activating');
    try {
      const result = await initializePushNotifications();
      if (!result.enabled) {
        setPushStatus(result.reason === 'permission-denied' ? 'denied' : 'unavailable');
        return;
      }
      const token = result.token || getStoredFcmToken();
      if (!token) {
        setPushStatus('error');
        return;
      }
      await notificationsApi.registerToken(vendor.apiCompanyId, {
        token,
        platform: Capacitor.getPlatform(),
        appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      });
      setPushStatus('enabled');
    } catch (error) {
      console.warn('Merchant notification activation failed', error);
      setPushStatus('error');
    }
  };

  useEffect(() => {
    let active = true;
    let removeListener = () => {};
    registerAndroidBackButton(() => {
      if (mobileOpen) return setMobileOpen(false);
      if (currentScreen !== 'DASHBOARD') return onNavigate('DASHBOARD');
      return exitAndroidApp();
    }).then((remove) => {
      if (active) removeListener = remove;
      else remove();
    });
    return () => { active = false; removeListener(); };
  }, [currentScreen, mobileOpen, onNavigate]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-700/50 px-6 py-6">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500">
          <Store className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-sm font-bold text-white">منصة السوق المصري</h1>
          <p className="truncate text-xs text-slate-400">{vendor.storeName}</p>
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className={`flex items-center gap-3 rounded-xl border p-3 ${vendor.apiCompanyId ? 'border-brand-700/50 bg-brand-900/40' : 'border-alert-700/50 bg-alert-900/40'}`}>
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${vendor.apiCompanyId ? 'bg-brand-500/20 text-brand-300' : 'bg-alert-500/20 text-alert-400'}`}>
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">{vendor.isDemo ? 'متجر تجريبي محلي' : vendor.apiCompanyId ? 'المتجر متصل' : 'قيد المراجعة'}</p>
            <p className="truncate text-xs text-slate-400">{vendor.vendorName}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6 scrollbar-thin">
        {navItems.filter((item) => (!item.profile || canManageProfile) && (item.screen !== 'VOUCHERS' || canViewWallet)).map(({ screen, label, icon: Icon, profile }) => (
          <button key={screen} onClick={() => { onNavigate(screen); setMobileOpen(false); }} className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right transition-all ${currentScreen === screen ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <span className={`transition-transform ${currentScreen === screen ? 'scale-110' : 'group-hover:scale-110'}`}><Icon className="h-5 w-5" /></span>
            <span className="flex-1 text-right text-sm font-semibold">{label}</span>
            {profile && profileIncomplete && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${currentScreen === screen ? 'bg-white/20 text-white' : 'bg-alert-500/15 text-alert-300'}`}>{profileLoading ? '…' : `${profilePercentage}%`}</span>}
            {currentScreen === screen && <ChevronLeft className="h-4 w-4" />}
          </button>
        ))}

        <button type="button" onClick={onOtaRefresh} disabled={otaRefreshing || otaState === 'downloading'} title={otaStatus?.message || 'تحقق من وجود تحديثات'} className={`mt-3 flex w-full items-center gap-3 rounded-xl border border-slate-700/70 px-4 py-3 text-right transition-all hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70 ${otaColor}`}>
          <RefreshCw className={`h-5 w-5 flex-shrink-0 ${otaRefreshing || otaState === 'downloading' ? 'animate-spin' : ''}`} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{otaLabel}</span>
            <span className="block truncate text-[10px] text-slate-500">{otaStatus?.message || 'اضغط للفحص الآن'}</span>
          </span>
        </button>
      </nav>

      <div className="border-t border-slate-700/50 px-4 py-4">
        <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-slate-400 transition-all hover:bg-alert-900/20 hover:text-alert-400">
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-semibold">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 bg-slate-900 lg:flex">{sidebar}</aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }} className="fixed inset-y-0 right-0 z-50 w-72 bg-slate-900 lg:hidden">
              <button onClick={() => setMobileOpen(false)} className="absolute left-4 top-4 z-10 text-slate-400 hover:text-white"><X className="h-6 w-6" /></button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="min-w-0 lg:mr-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-4 glass sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 lg:hidden"><Menu className="h-5 w-5" /></button>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">{currentLabel}</h2>
              <p className="hidden text-xs text-slate-400 sm:block">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canEnablePush && <button type="button" onClick={handlePushActivation} disabled={pushStatus === 'activating'} className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-100 disabled:cursor-default disabled:opacity-70" title="تفعيل إشعارات الطلبات">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{pushStatus === 'activating' ? 'جارٍ التفعيل' : pushStatus === 'enabled' ? 'الإشعارات مفعلة' : pushStatus === 'denied' ? 'السماح بالإشعارات' : pushStatus === 'unavailable' ? 'فعّلها من تطبيق الهاتف' : pushStatus === 'error' ? 'إعادة المحاولة' : 'تفعيل الإشعارات'}</span>
            </button>}
            <div className="flex items-center gap-2 pr-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">{vendor.vendorName.charAt(0)}</div>
              <div className="hidden sm:block"><p className="text-sm font-semibold text-slate-800">{vendor.vendorName}</p><p className="text-xs text-slate-400">{vendor.email}</p></div>
            </div>
          </div>
        </header>
        {vendor.isDemo && (
          <section role="status" className="border-b border-brand-200 bg-brand-50 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-brand-700" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-brand-900">أنت تستخدم متجرًا تجريبيًا محفوظًا على هذا الجهاز</p>
                <p className="text-xs leading-5 text-brand-800">المنتجات التجريبية لا تُرفع ولا تنتقل إلى المتجر الحقيقي. لا تُنشأ قاعدة بيانات المتجر إلا بعد موافقة الإدارة.</p>
              </div>
              <button type="button" onClick={() => onNavigate(profileScreen)} className="shrink-0 rounded-xl bg-brand-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-800">ملف التقديم</button>
            </div>
          </section>
        )}
        {profileIncomplete && (
          <section role="status" className="border-b border-alert-200 bg-alert-50 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-alert-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-alert-900">ملف الشركة غير مكتمل</p>
                <p className="truncate text-xs text-alert-800">{profileLoading ? 'جارٍ التحقق من الملف المحفوظ...' : profileLoadError ? 'تعذر التحقق من البيانات؛ سيظل التنبيه ظاهرًا حتى إعادة المحاولة.' : `نسبة الاكتمال ${profilePercentage}%. أكمل البيانات وارفع المستندات المطلوبة.`}</p>
              </div>
              <button type="button" onClick={() => onNavigate('COMPANY_PROFILE')} className="shrink-0 rounded-xl bg-alert-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-alert-700">استكمال الملف</button>
            </div>
          </section>
        )}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
