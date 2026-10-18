import { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { RefreshCw, Store } from 'lucide-react';
import { recordAppLaunch } from '@/plugins/nativeStorage';
import { initializeMerchantCache } from '@/lib/merchantLocalCache';
import { checkForOtaUpdate } from '@/utils/liveUpdates';
import { signInWithGoogle, signOutGoogle } from '@/lib/firebaseAuth';
import { API_BASE_URL, authApi, companyProfileApi, sessionStore, notificationsApi } from '@/api/client';
import RegisterScreen from '@/screens/RegisterScreen';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardScreen from '@/screens/DashboardScreen';
import ProductsScreen from '@/screens/ProductsScreen';
import VouchersScreen from '@/screens/VouchersScreen';
import OrdersScreen from '@/screens/OrdersScreen';
import CompanyProfileScreen from '@/screens/CompanyProfileScreen';
import StoreRequestScreen from '@/screens/StoreRequestScreen';
import { egyptGovernorates } from '@/data/egyptGovernorates';

function companyToVendor(company, user) {
  return {
    apiCompanyId: company.id,
    userId: user?.id || user?.email || '',
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

function createDemoVendor(user, request = null) {
  return {
    apiCompanyId: null,
    userId: user?.id || user?.email || '',
    companyRole: 'owner',
    vendorName: user?.full_name || user?.fullName || 'التاجر',
    email: user?.email || '',
    phone: user?.phone || '',
    storeName: request?.storeName || 'متجري التجريبي',
    isDemo: true,
  };
}

function StartupSplash() {
  return (
    <main className="merchant-startup-splash" dir="rtl" aria-label="منصة السوق المصري">
      <div className="merchant-startup-brand">
        <div className="merchant-startup-icon"><Store size={34} strokeWidth={1.8} /></div>
        <h1>تاجر</h1>
        <div className="merchant-startup-line" />
        <p>منصة السوق المصري</p>
      </div>
    </main>
  );
}

function SessionRestoreScreen({ loading, error, onRetry, onUseAnotherAccount }) {
  if (loading) return <StartupSplash />;
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-lg">
        <>
          <h1 className="text-lg font-bold text-slate-900">تعذر استعادة الجلسة الآن</h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
          <button type="button" onClick={onRetry} className="btn-primary mt-5 w-full">
            <RefreshCw size={17} /> إعادة المحاولة
          </button>
          <button type="button" onClick={onUseAnotherAccount} className="mt-3 text-sm font-semibold text-slate-500 underline">
            تسجيل الدخول بحساب آخر
          </button>
        </>
      </section>
    </main>
  );
}

function App() {
  const [otaStatus, setOtaStatus] = useState({ status: 'current', message: '' });
  const [otaRefreshing, setOtaRefreshing] = useState(false);
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState('DASHBOARD');
  const [vendor, setVendor] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [accountUser, setAccountUser] = useState(null);
  const [storeRequest, setStoreRequest] = useState(null);
  const [storeRequestError, setStoreRequestError] = useState('');
  const [storeRequestRefreshing, setStoreRequestRefreshing] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(false);
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

  const acceptSession = useCallback(async (token, user, refreshToken) => {
    await sessionStore.setToken(token);
    if (refreshToken) await sessionStore.setRefreshToken(refreshToken);
    await sessionStore.setUser(user);
    setIsRestoringSession(true);
    setAuthToken(token);
    setAccountUser(user);
    setSessionRestoreError('');

    if (!sessionStore.getRefreshToken()) {
      try {
        const persistentSession = await authApi.createRefreshToken();
        if (persistentSession?.refreshToken) await sessionStore.setRefreshToken(persistentSession.refreshToken);
      } catch (error) {
        console.info('Could not upgrade the existing session to a refresh token yet.', error);
      }
    }

    let companies;
    try {
      companies = await authApi.companies();
    } catch (error) {
      const cachedCompany = sessionStore.getCompany();
      if (cachedCompany?.id) {
        setVendor(companyToVendor(cachedCompany, user));
        setScreen('DASHBOARD');
      } else {
        const demoUser = sessionStore.getDemoUser() || user;
        await sessionStore.setDemoUser(demoUser);
        setAccountUser(demoUser);
        setVendor(createDemoVendor(demoUser));
        setStoreRequestError(error.message || 'تعذر التحقق من حالة الطلب. سيظل المتجر التجريبي محفوظًا على هذا الجهاز.');
      }
      setIsRestoringSession(false);
      return;
    }
    if (!Array.isArray(companies)) companies = companies?.items || [];
    const company = companies[0];
    if (!company?.id) {
      await sessionStore.clearCompany();
      await sessionStore.setDemoUser(user);
      setCompanyProfile(null);
      setPendingGovernorate(null);
      setStoreRequestError('');
      setScreen('DASHBOARD');
      setVendor(createDemoVendor(user));
      try {
        const request = await authApi.storeRequest();
        setStoreRequest(request?.status === 'none' ? null : request || null);
        setVendor(createDemoVendor(user, request));
      } catch (error) {
        setStoreRequestError(error.message || 'تعذر تحميل حالة طلب المتجر. يمكنك إعادة المحاولة من ملف التقديم.');
      }
      setIsRestoringSession(false);
      return;
    }
    await sessionStore.setCompany(company);
    await sessionStore.clearDemoUser();
    if (!company.governorate) {
      setPendingGovernorate({ token, user, company });
      setGovernorateError('');
      setAuthToken(token);
      setSessionRestoreError('');
      setIsRestoringSession(false);
      return;
    }
    setPendingGovernorate(null);
    setStoreRequest(null);
    setStoreRequestError('');
    setSessionRestoreError('');
    setIsRestoringSession(false);
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
      await acceptSession(token, user);
    } catch (error) {
      console.warn('Saved session could not be restored', error);
      const cachedCompany = sessionStore.getCompany();
      const cachedUser = sessionStore.getUser() || sessionStore.getDemoUser();
      if (cachedCompany?.id && cachedUser) {
        setAccountUser(cachedUser);
        setVendor(companyToVendor(cachedCompany, cachedUser));
        setScreen('DASHBOARD');
        setSessionRestoreError('');
      } else if (sessionStore.getDemoUser()) {
        const demoUser = sessionStore.getDemoUser();
        setAccountUser(demoUser);
        setVendor(createDemoVendor(demoUser));
        setScreen('DASHBOARD');
        setSessionRestoreError('');
      } else {
        setSessionRestoreError(error?.status === 401 || error?.status === 404
          ? 'تعذر التحقق من الجلسة لدى الخادم. لم نسجل خروجك تلقائيًا؛ تحقق من الاتصال أو سجّل الدخول مجددًا عند الحاجة.'
          : 'تحقق من اتصال الإنترنت ثم أعد المحاولة. احتفظنا ببيانات الدخول ولم نسجّل خروجك.');
      }
    } finally {
      restoreInFlight.current = false;
      setIsRestoringSession(false);
    }
  }, [acceptSession]);

  const handleAuthComplete = async ({ mode, vendorName, email, phone, password, storeLocation }) => {
    const result = mode === 'register'
      ? await authApi.register({ email, password, fullName: vendorName, phone })
      : await authApi.login({ email, password });
    if (!result?.token || !result?.user) throw new Error('استجابة المصادقة لا تحتوي على بيانات المستخدم أو رمز الجلسة.');
    if (mode === 'register' && storeLocation && result.user?.id) {
      try { window.localStorage.setItem(`taget_pending_store_location_${result.user.id}`, JSON.stringify(storeLocation)); } catch { /* device storage may be unavailable */ }
    }
    await acceptSession(result.token, result.user, result.refreshToken);
  };

  const handleGoogleAuthComplete = async () => {
    const idToken = pendingGoogleIdToken.current || await signInWithGoogle();
    try {
      const result = await authApi.google({ idToken });
      if (!result?.token || !result?.user) throw new Error('استجابة المصادقة لا تحتوي على بيانات المستخدم أو رمز الجلسة.');
      pendingGoogleIdToken.current = null;
      await acceptSession(result.token, result.user, result.refreshToken);
    } catch (error) {
      pendingGoogleIdToken.current = null;
      throw error;
    }
  };

  const handleGoogleAuthRestart = async () => {
    pendingGoogleIdToken.current = null;
    await signOutGoogle();
  };

  const handleStoreRequestSubmit = async (application) => {
    const { documents = {}, ...profileApplication } = application;
    let request = await authApi.saveStoreRequestProfile(profileApplication);
    setStoreRequest(request);
    for (const [documentType, file] of Object.entries(documents)) {
      if (!file) continue;
      request = await authApi.uploadStoreRequestDocument(documentType, file);
      setStoreRequest(request);
    }
    request = await authApi.finalizeStoreRequest();
    setStoreRequest(request);
    setVendor((current) => current?.isDemo ? { ...current, storeName: application.profileData?.displayName || request?.storeName || current.storeName } : current);
    setStoreRequestError('');
    return request;
  };

  const handleStoreRequestRefresh = async () => {
    if (!authToken || !accountUser) return;
    setStoreRequestRefreshing(true);
    setStoreRequestError('');
    try { await acceptSession(authToken, accountUser); }
    finally { setStoreRequestRefreshing(false); }
  };

  const handleGovernorateComplete = async (governorate) => {
    if (!pendingGovernorate) return;
    setGovernorateSaving(true);
    setGovernorateError('');
    try {
      const updated = await authApi.setCompanyGovernorate(pendingGovernorate.company.id, governorate);
      const company = { ...pendingGovernorate.company, ...updated };
      await sessionStore.setCompany(company);
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
    const companyId = vendor?.apiCompanyId;
    const userId = accountUser?.id;
    if (!companyId || !userId) return;
    let location;
    try { location = JSON.parse(window.localStorage.getItem(`taget_pending_store_location_${userId}`) || 'null'); } catch { return; }
    if (!location) return;
    notificationsApi.saveLocation(companyId, location).then(() => {
      try {
        window.localStorage.setItem(`taget_saved_store_location_${userId}`, JSON.stringify(location));
        window.localStorage.removeItem(`taget_pending_store_location_${userId}`);
      } catch { /* Successful server sync remains authoritative. */ }
    }).catch((error) => console.warn('Could not sync the merchant-approved location yet.', error));
  }, [vendor?.apiCompanyId, accountUser?.id]);

  useEffect(() => {
    let active = true;
    recordAppLaunch().catch(() => {});
    void runOtaCheck();
    const splashMinimum = new Promise((resolve) => window.setTimeout(resolve, 1800));
    void (async () => {
      await Promise.all([initializeMerchantCache(), sessionStore.initialize()]);
      if (!active) return;
      const token = sessionStore.getToken();
      const cachedCompany = sessionStore.getCompany();
      const cachedUser = sessionStore.getUser() || sessionStore.getDemoUser() || (cachedCompany?.id
        ? { id: cachedCompany.id, full_name: 'التاجر', email: cachedCompany.email || '' }
        : null);
      setAuthToken(token);
      setAccountUser(cachedUser);
      if (token && cachedCompany?.id) {
        setVendor(companyToVendor(cachedCompany, cachedUser));
        setScreen('DASHBOARD');
      }
      if (token) {
        void restoreSession();
      } else {
        setIsRestoringSession(false);
      }
      await splashMinimum;
      if (active) setBooting(false);
    })();
    return () => { active = false; };
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

  const handleLogout = () => {
    const refreshToken = sessionStore.getRefreshToken();
    if (refreshToken) authApi.logout(refreshToken).catch((error) => console.warn('Could not revoke the refresh session during logout.', error));
    void sessionStore.clear();
    signOutGoogle().catch((error) => console.warn('Firebase sign-out failed', error));
    setAuthToken(null);
    setVendor(null);
    setCompanyProfile(null);
    setPendingGovernorate(null);
    setAccountUser(null);
    setStoreRequest(null);
    setStoreRequestError('');
    setScreen('DASHBOARD');
  };

  if (booting) return <StartupSplash />;
  if (authToken && !vendor && isRestoringSession) return <SessionRestoreScreen loading />;
  if (authToken && !vendor && sessionRestoreError) return <SessionRestoreScreen error={sessionRestoreError} onRetry={restoreSession} onUseAnotherAccount={handleLogout} />;
  if (authToken && pendingGovernorate) return <GovernorateRequiredScreen saving={governorateSaving} error={governorateError} onSubmit={handleGovernorateComplete} onLogout={handleLogout} />;
  if (!authToken) return <RegisterScreen onAuthComplete={handleAuthComplete} onGoogleAuthComplete={handleGoogleAuthComplete} onGoogleAuthRestart={handleGoogleAuthRestart} />;
  return <DashboardLayout currentScreen={screen} onNavigate={setScreen} vendor={vendor} onLogout={handleLogout} otaStatus={otaStatus} onOtaRefresh={runOtaCheck} otaRefreshing={otaRefreshing} profileCompletion={companyProfile?.completion || null} profileLoading={profileLoading} profileLoadError={profileLoadError}>
    {screen === 'DASHBOARD' && <DashboardScreen vendor={vendor} token={authToken} />}
    {screen === 'STORE_PROFILE' && vendor.isDemo && <StoreRequestScreen user={accountUser} request={storeRequest} loading={storeRequestRefreshing} error={storeRequestError} onSubmit={handleStoreRequestSubmit} onRefresh={handleStoreRequestRefresh} onLogout={handleLogout} />}
    {screen === 'COMPANY_PROFILE' && <CompanyProfileScreen key={`${vendor.apiCompanyId}:${profileRevision}`} companyId={vendor.apiCompanyId} vendor={vendor} profile={companyProfile} loading={profileLoading} loadError={profileLoadError} onRetry={refreshCompanyProfile} onProfileUpdated={handleProfileUpdated} />}
    {screen === 'PRODUCTS' && <ProductsScreen vendor={vendor} token={authToken} />}
    {screen === 'VOUCHERS' && <VouchersScreen vendor={vendor} token={authToken} />}
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
