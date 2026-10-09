import { useCallback, useEffect, useState } from 'react';
import { recordAppLaunch } from '@/plugins/nativeStorage';
import { checkForOtaUpdate } from '@/utils/liveUpdates';
import { initializePushNotifications } from '@/utils/pushNotifications';
import { API_BASE_URL, authApi, makeCompanySlug, sessionStore } from '@/api/client';
import RegisterScreen from '@/screens/RegisterScreen';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardScreen from '@/screens/DashboardScreen';
import ProductsScreen from '@/screens/ProductsScreen';
import VouchersScreen from '@/screens/VouchersScreen';
import OrdersScreen from '@/screens/OrdersScreen';

function companyToVendor(company, user) {
  return {
    apiCompanyId: company.id,
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

function App() {
  const [otaStatus, setOtaStatus] = useState({ status: 'checking', message: 'جاري تجهيز فحص التحديث الهوائي...' });
  const [otaRefreshing, setOtaRefreshing] = useState(false);
  const [screen, setScreen] = useState('DASHBOARD');
  const [vendor, setVendor] = useState(null);
  const [authToken, setAuthToken] = useState(sessionStore.getToken());

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

  const acceptSession = useCallback(async (token, user, requestedStoreName = '') => {
    let companies = await authApi.companies();
    if (!Array.isArray(companies)) companies = companies?.items || [];
    let company = companies[0];
    if (!company && requestedStoreName.trim()) {
      company = await authApi.createCompany({
        slug: makeCompanySlug(requestedStoreName),
        legalName: requestedStoreName,
        displayName: requestedStoreName,
        email: user?.email,
      });
    }
    if (!company?.id) {
      throw new Error('لم يعثر الخادم على متجر مرتبط بهذا الحساب. لم ننشئ بيانات متجر افتراضية؛ تواصل مع إدارة المنصة لربط المتجر بحسابك.');
    }
    sessionStore.setToken(token);
    setAuthToken(token);
    sessionStore.setCompany(company);
    setVendor(companyToVendor(company, user));
    setScreen('DASHBOARD');
  }, []);

  const handleAuthComplete = async ({ mode, vendorName, email, phone, password, storeName }) => {
    const result = mode === 'register'
      ? await authApi.register({ email, password, fullName: vendorName, phone })
      : await authApi.login({ email, password });
    if (!result?.token || !result?.user) throw new Error('استجابة المصادقة لا تحتوي على بيانات المستخدم أو رمز الجلسة.');
    await acceptSession(result.token, result.user, mode === 'register' ? storeName : '');
  };

  useEffect(() => {
    recordAppLaunch().catch(() => {});
    initializePushNotifications().catch(() => {});
    runOtaCheck();
    const restore = async () => {
      const token = sessionStore.getToken();
      if (!token) return;
      try {
        const user = await authApi.me();
        await acceptSession(token, user, '');
      } catch (error) {
        console.warn('Saved session could not be restored', error);
        sessionStore.clear();
        setAuthToken(null);
      }
    };
    restore();
  }, [acceptSession, runOtaCheck]);

  useEffect(() => {
    const handleExpiredSession = () => {
      sessionStore.clear();
      setAuthToken(null);
      setVendor(null);
      setScreen('DASHBOARD');
    };
    window.addEventListener('tager:auth-expired', handleExpiredSession);
    return () => window.removeEventListener('tager:auth-expired', handleExpiredSession);
  }, []);

  const handleLogout = () => {
    sessionStore.clear();
    setAuthToken(null);
    setVendor(null);
    setScreen('DASHBOARD');
  };

  if (!vendor || !authToken) return <RegisterScreen onAuthComplete={handleAuthComplete} />;
  return <DashboardLayout currentScreen={screen} onNavigate={setScreen} vendor={vendor} onLogout={handleLogout} otaStatus={otaStatus} onOtaRefresh={runOtaCheck} otaRefreshing={otaRefreshing}>
    {screen === 'DASHBOARD' && <DashboardScreen vendor={vendor} token={authToken} />}
    {screen === 'PRODUCTS' && <ProductsScreen vendor={vendor} token={authToken} />}
    {screen === 'VOUCHERS' && <VouchersScreen vendor={vendor} />}
    {screen === 'ORDERS' && <OrdersScreen vendor={vendor} token={authToken} />}
    <div className="sr-only" aria-hidden="true">API: {API_BASE_URL}</div>
  </DashboardLayout>;
}
export default App;
