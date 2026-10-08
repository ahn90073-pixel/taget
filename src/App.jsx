import { useCallback, useEffect, useState } from 'react';
import { initialFinancialData, mockVouchers } from '@/data/mockData';
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
  const storeName = company.display_name || company.displayName || company.legal_name || company.legalName || 'متجري';
  return {
    apiCompanyId: company.id,
    vendorName: user?.full_name || user?.fullName || user?.email?.split('@')[0] || 'التاجر',
    email: user?.email || company.email || '',
    phone: user?.phone || '',
    storeName,
    storeNameEn: company.slug || '',
    status: 'connected',
    warehouseAddress: { governorate: 'مصر', city: '', street: '' },
    payoutMethod: '',
  };
}

function App() {
  const [otaStatus, setOtaStatus] = useState({ status: 'checking', message: 'جاري تجهيز فحص التحديث الهوائي...' });
  const [otaRefreshing, setOtaRefreshing] = useState(false);
  const [screen, setScreen] = useState('REGISTER');
  const [vendor, setVendor] = useState(null);
  const [authToken, setAuthToken] = useState(sessionStore.getToken());
  const [financialData, setFinancialData] = useState(initialFinancialData);
  const [vouchers, setVouchers] = useState(mockVouchers);

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
    sessionStore.setToken(token);
    setAuthToken(token);
    let companies = await authApi.companies();
    if (!Array.isArray(companies)) companies = companies?.items || [];
    let company = companies[0];
    if (!company) {
      const suggestedName = requestedStoreName || user?.full_name || user?.email?.split('@')[0] || 'متجري';
      company = await authApi.createCompany({
        slug: makeCompanySlug(suggestedName),
        legalName: suggestedName,
        displayName: suggestedName,
        email: user?.email,
      });
    }
    if (!company?.id) throw new Error('تم تسجيل الدخول، لكن الخادم لم يُرجع بيانات المتجر. راجع استجابة API الخاصة بالشركات.');
    sessionStore.setCompany(company);
    setVendor(companyToVendor(company, user));
    setScreen('DASHBOARD');
  }, []);

  const handleAuthComplete = async ({ mode, vendorName, email, phone, password, storeName }) => {
    const result = mode === 'register'
      ? await authApi.register({ email, password, fullName: vendorName, phone })
      : await authApi.login({ email, password });
    if (!result?.token || !result?.user) throw new Error('استجابة المصادقة لا تحتوي على بيانات المستخدم أو رمز الجلسة.');
    await acceptSession(result.token, result.user, storeName);
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

  const handleLogout = () => {
    sessionStore.clear();
    setAuthToken(null);
    setVendor(null);
    setScreen('REGISTER');
  };
  const handlePaymentReceived = (amount) => {
    setFinancialData((prev) => ({ ...prev, owedBalance: prev.owedBalance - amount }));
    const newVoucher = {
      id: String(Date.now()), receiptNumber: `PAY-2025-${String(vouchers.length + 1).padStart(4, '0')}`,
      date: new Date().toLocaleDateString('ar-EG'), amount,
      remaining: financialData.owedBalance - amount, whatsappSent: true, vendor: vendor?.storeName || '',
    };
    setVouchers([newVoucher, ...vouchers]);
  };

  if (!vendor || !authToken) return <RegisterScreen onAuthComplete={handleAuthComplete} />;
  return <DashboardLayout currentScreen={screen} onNavigate={setScreen} vendor={vendor} onLogout={handleLogout} otaStatus={otaStatus} onOtaRefresh={runOtaCheck} otaRefreshing={otaRefreshing}>
    {screen === 'DASHBOARD' && <DashboardScreen vendor={vendor} financialData={financialData} onPaymentReceived={handlePaymentReceived} vouchers={vouchers} />}
    {screen === 'PRODUCTS' && <ProductsScreen vendor={vendor} token={authToken} />}
    {screen === 'VOUCHERS' && <VouchersScreen vendor={vendor} vouchers={vouchers} financialData={financialData} />}
    {screen === 'ORDERS' && <OrdersScreen vendor={vendor} />}
    <div className="sr-only" aria-hidden="true">API: {API_BASE_URL}</div>
  </DashboardLayout>;
}
export default App;
