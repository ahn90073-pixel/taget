import { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { LoaderCircle, RefreshCw } from 'lucide-react';
import { recordAppLaunch } from '@/plugins/nativeStorage';
import { checkForOtaUpdate } from '@/utils/liveUpdates';
import { initializePushNotifications } from '@/utils/pushNotifications';
import { signInWithGoogle, signOutGoogle } from '@/lib/firebaseAuth';
import { API_BASE_URL, authApi, companyProfileApi, makeCompanySlug, sessionStore } from '@/api/client';
import RegisterScreen from '@/screens/RegisterScreen';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardScreen from '@/screens/DashboardScreen';
import ProductsScreen from '@/screens/ProductsScreen';
import VouchersScreen from '@/screens/VouchersScreen';
import OrdersScreen from '@/screens/OrdersScreen';
import CompanyProfileScreen from '@/screens/CompanyProfileScreen';
import { egyptGovernorates } from '@/data/egyptGovernorates';

function companyToVendor(company, user) {
  return {
    apiCompanyId: company.id,
    companyRole: company.role || '',
    vendorName: user?.full_name || user?.fullName || '',
    email: user?.email || company.email || '',
    phone: user?.phone || '',
    storeName: company.display_name || company.displayName || company.legal_name || company.legalName || '',
    storeNameEn: company.slug || '',
    status: company.status || '',
    warehouseAddress: company.warehouse_address || company.warehouseAddress || null,
    payoutMethod: company.payout_method || company.payoutMethod || '',
  };
}

function SessionRestoreScreen({ loading, error, onRetry, onUseAnotherAccount }) {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-lg">
        {loading ? <>
          <LoaderCircle size={28} className="mx-auto animate-spin text-primary-600" />
          <p className="mt-4 font-semibold text-slate-800">جارٍ استعادة جلسة الدخول...</p>
        </> : <>
          <h1 className="text-lg font-bold text-slate-900">تعذر استعادة الجلسة الآن</h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
          <button type="button" onClick={onRetry} className="btn-primary mt-5 w-full">
            <RefreshCw size={17} /> إعادة المحاولة
          </button>
          <button type="button" onClick={onUseAnotherAccount} className="mt-3 text-sm font-semibold text-slate-500 underline">
            تسجيل الدخول بحساب آخر
          </button>
        </>}
      </section>
    </main>
  );
}

function App() {
  const [otaStatus, setOtaStatus] = useState({ status: 'checking', message: 'جاري تجهيز فحص التحديث الهوائي...' });
  const [otaRefreshing, setOtaRefreshing] = useState(false);
  const [screen, setScreen] = useState('DASHBOARD');
  const [vendor, setVendor] = useState(null);
  const [authToken, setAuthToken] = useState(sessionStore.getToken());
  const [isRestoringSession, setIsRestoringSession] = useState(() => Boolean(sessionStore.getToken()));
  const [sessionRestoreError, setSessionRestoreError] = useState('');
  const [companyProfile, setCompanyProfile] = useState(null);
  const [profileRevision, setProfileRevision] = useState(0);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState('');
  const [pendingGovernorate, setPendingGovernorate] = useState(null);
  const [governorateSaving, setGovernorateSaving] = useState(false);
  const [governorateError, setGovernorateError] = useState('');
  const pendingGoogleIdToken = useRef(null);
  const restoreInFlight = useRef(false);

  const runOtaCheck = useCallback(async () => {
    setOtaRefreshing(true);
    try {
      const result = await checkForOtaUpdate({ onStatus: setOtaStatus });
      if (result?.reason === 'web') setOtaStatus({ status: 'web', message: 'التحديث الهوائي يعمل داخل تطبيق الهاتف' });
    } catch (error) {
      console.warn('OTA update check failed', error);
      setOtaStatus({ status: 'error', message: 'تعذّر الاتصال بخادم التحديث، حاول مرة أخرى' });
    } finally { setOtaRefreshing(false); }
  }, []);

  const acceptSession = useCallback(async (token, user, requestedStoreName = '', requestedGovernorate = '') => {
    // The company endpoints require this Bearer token.
    sessionStore.setToken(token);
    let companies = await authApi.companies();
    if (!Array.isArray(companies)) companies = companies?.items || [];
    let company = companies[0];
    if (!company && requestedStoreName.trim()) {
      company = await authApi.createCompany({
        slug: makeCompanySlug(requestedStoreName),
        legalName: requestedStoreName,
        displayName: requestedStoreName,
        email: user?.email,
        governorate: requestedGovernorate,
      });
    }
    if (!company?.id) {
      throw new Error('لم يعثر الخادم على متجر مرتبط بهذا الحساب. لم ننشئ بيانات متجر افتراضية؛ تواصل مع إدارة المنصة لربط المتجر بحسابك.');
    }
    if (!company.governorate && requestedGovernorate) {
      company = { ...company, ...(await authApi.setCompanyGovernorate(company.id, requestedGovernorate)) };
    }
    if (!company.governorate) {
      setPendingGovernorate({ token, user, company });
      setGovernorateError('');
      setAuthToken(token);
      setSessionRestoreError('');
      setIsRestoringSession(false);
      return;
    }
    setPendingGovernorate(null);
    setAuthToken(token);
    setSessionRestoreError('');
    setIsRestoringSession(false);
    sessionStore.setCompany(company);
    setVendor(companyToVendor(company, user));
    setScreen('DASHBOARD');
  }, []);

  const restoreSession = useCallback(async () => {
    if (restoreInFlight.current) return;
    const token = sessionStore.getToken();
    if (!token) {
      setIsRestoringSession(false);
      return;
    }

    restoreInFlight.current = true;
    setIsRestoringSession(true);
    setSessionRestoreError('');
    try {
      const user = await authApi.me();
      await acceptSession(token, user, '');
    } catch (error) {
      console.warn('Saved session could not be restored', error);
      if (error?.status === 401 || error?.status === 404) {
        // Only discard a session when the server explicitly rejects it.
        sessionStore.clear();
        setAuthToken(null);
      } else {
        // Offline/server errors are temporary; keep the saved token and allow retry.
        setSessionRestoreError('تحقق من اتصال الإنترنت ثم أعد المحاولة. احتفظنا ببيانات الدخول ولم نسجّل خروجك.');
      }
    } finally {
      restoreInFlight.current = false;
      setIsRestoringSession(false);
    }
  }, [acceptSession]);

  const handleAuthComplete = async ({ mode, vendorName, email, phone, password, storeName, governorate }) => {
    const result = mode === 'register'
      ? await authApi.register({ email, password, fullName: vendorName, phone })
      : await authApi.login({ email, password });
    if (!result?.token || !result?.user) throw new Error('استجابة المصادقة لا تحتوي على بيانات المستخدم أو رمز الجلسة.');
    await acceptSession(result.token, result.user, mode === 'register' ? storeName : '', mode === 'register' ? governorate : '');
  };

  const handleGoogleAuthComplete = async ({ storeName = '', phone = '', governorate = '' }) => {
    const idToken = pendingGoogleIdToken.current || await signInWithGoogle();
    try {
      const result = await authApi.google({ idToken, storeName, phone, governorate });
      if (!result?.token || !result?.user) throw new Error('استجابة المصادقة لا تحتوي على بيانات المستخدم أو رمز الجلسة.');
      pendingGoogleIdToken.current = null;
      await acceptSession(result.token, result.user, storeName || '', governorate || '');
    } catch (error) {
      if (error.status === 400 && error.message.includes('أدخل اسم المتجر')) {
        pendingGoogleIdToken.current = idToken;
        error.code = 'GOOGLE_STORE_NAME_REQUIRED';
      } else {
        pendingGoogleIdToken.current = null;
      }
      throw error;
    }
  };

  const handleGoogleAuthRestart = async () => {
    pendingGoogleIdToken.current = null;
    await signOutGoogle();
  };

  const handleGovernorateComplete = async (governorate) => {
    if (!pendingGovernorate) return;
    setGovernorateSaving(true);
    setGovernorateError('');
    try {
      const updated = await authApi.setCompanyGovernorate(pendingGovernorate.company.id, governorate);
      const company = { ...pendingGovernorate.company, ...updated };
      sessionStore.setCompany(company);
      setVendor(companyToVendor(company, pendingGovernorate.user));
      setAuthToken(pendingGovernorate.token);
      setPendingGovernorate(null);
      setSessionRestoreError('');
      setScreen('DASHBOARD');
    } catch (error) {
      setGovernorateError(error.message || 'تعذر حفظ المحافظة. حاول مرة أخرى.');
    } finally {
      setGovernorateSaving(false);
    }
  };

  const refreshCompanyProfile = useCallback(async () => {
    if (!vendor?.apiCompanyId || !['owner', 'admin'].includes(vendor.companyRole)) return null;
    setProfileLoading(true);
    setProfileLoadError('');
    try {
      const profile = await companyProfileApi.get(vendor.apiCompanyId);
      setCompanyProfile(profile);
      setProfileRevision((revision) => revision + 1);
      return profile;
    } catch (error) {
      setCompanyProfile(null);
      setProfileLoadError(error.message || 'تعذر التحقق من اكتمال ملف الشركة.');
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [vendor?.apiCompanyId, vendor?.companyRole]);

  const handleProfileUpdated = (profile) => {
    setCompanyProfile(profile);
    const company = profile?.company;
    if (company) {
      setVendor((current) => current ? {
        ...current,
        storeName: company.display_name || company.displayName || company.legal_name || current.storeName,
        email: company.email || current.email,
      } : current);
    }
  };

  useEffect(() => {
    recordAppLaunch().catch(() => {});
    initializePushNotifications().catch(() => {});
    runOtaCheck();
    void restoreSession();
  }, [restoreSession, runOtaCheck]);

  useEffect(() => {
    if (vendor || !sessionStore.getToken()) return undefined;
    let listener;
    let active = true;
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive && sessionStore.getToken()) void restoreSession();
    }).then((handle) => {
      if (active) listener = handle;
      else handle.remove();
    }).catch((error) => console.warn('Could not watch Android app resume state', error));
    return () => {
      active = false;
      listener?.remove();
    };
  }, [restoreSession, vendor]);

  useEffect(() => {
    if (!vendor?.apiCompanyId || !authToken || !['owner', 'admin'].includes(vendor.companyRole)) {
      setCompanyProfile(null);
      setProfileLoadError('');
      setProfileLoading(false);
      return;
    }
    refreshCompanyProfile();
  }, [vendor?.apiCompanyId, vendor?.companyRole, authToken, refreshCompanyProfile]);

  useEffect(() => {
    const handleExpiredSession = () => {
      sessionStore.clear();
      setAuthToken(null);
      setVendor(null);
      setCompanyProfile(null);
      setPendingGovernorate(null);
      setScreen('DASHBOARD');
    };
    window.addEventListener('tager:auth-expired', handleExpiredSession);
    return () => window.removeEventListener('tager:auth-expired', handleExpiredSession);
  }, []);

  const handleLogout = () => {
    sessionStore.clear();
    signOutGoogle().catch((error) => console.warn('Firebase sign-out failed', error));
    setAuthToken(null);
    setVendor(null);
    setCompanyProfile(null);
    setPendingGovernorate(null);
    setScreen('DASHBOARD');
  };

  if (authToken && !vendor && isRestoringSession) return <SessionRestoreScreen loading />;
  if (authToken && !vendor && sessionRestoreError) return <SessionRestoreScreen error={sessionRestoreError} onRetry={restoreSession} onUseAnotherAccount={() => { sessionStore.clear(); setAuthToken(null); setSessionRestoreError(''); }} />;
  if (authToken && pendingGovernorate) return <GovernorateRequiredScreen saving={governorateSaving} error={governorateError} onSubmit={handleGovernorateComplete} onLogout={handleLogout} />;
  if (!vendor || !authToken) return <RegisterScreen onAuthComplete={handleAuthComplete} onGoogleAuthComplete={handleGoogleAuthComplete} onGoogleAuthRestart={handleGoogleAuthRestart} />;
  return <DashboardLayout currentScreen={screen} onNavigate={setScreen} vendor={vendor} onLogout={handleLogout} otaStatus={otaStatus} onOtaRefresh={runOtaCheck} otaRefreshing={otaRefreshing} profileCompletion={companyProfile?.completion || null} profileLoading={profileLoading} profileLoadError={profileLoadError}>
    {screen === 'DASHBOARD' && <DashboardScreen vendor={vendor} token={authToken} />}
    {screen === 'COMPANY_PROFILE' && <CompanyProfileScreen key={`${vendor.apiCompanyId}:${profileRevision}`} companyId={vendor.apiCompanyId} vendor={vendor} profile={companyProfile} loading={profileLoading} loadError={profileLoadError} onRetry={refreshCompanyProfile} onProfileUpdated={handleProfileUpdated} />}
    {screen === 'PRODUCTS' && <ProductsScreen vendor={vendor} token={authToken} />}
    {screen === 'VOUCHERS' && <VouchersScreen vendor={vendor} />}
    {screen === 'ORDERS' && <OrdersScreen vendor={vendor} token={authToken} />}
    <div className="sr-only" aria-hidden="true">API: {API_BASE_URL}</div>
  </DashboardLayout>;
}

function GovernorateRequiredScreen({ saving, error, onSubmit, onLogout }) {
  const [governorate, setGovernorate] = useState('');
  const submit = (event) => {
    event.preventDefault();
    if (governorate) void onSubmit(governorate);
  };
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-lg">
        <h1 className="text-lg font-bold text-slate-900">أكمل بيانات موقع المتجر</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">اختيار المحافظة مطلوب لربط متجرك بالخدمات الإدارية المناسبة. لن تحتاج إلى إدخالها في كل مرة تسجل فيها الدخول.</p>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">محافظة المتجر (إلزامي)</span>
            <select required value={governorate} onChange={(event) => setGovernorate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100">
              <option value="">اختر المحافظة</option>
              {egyptGovernorates.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={saving || !governorate} className="btn-primary w-full disabled:cursor-wait disabled:opacity-60">
            {saving ? 'جارٍ حفظ المحافظة...' : 'حفظ ومتابعة'}
          </button>
        </form>
        <button type="button" onClick={onLogout} className="mt-4 w-full text-sm font-semibold text-slate-500 underline">تسجيل الخروج</button>
      </section>
    </main>
  );
}

export default App;
