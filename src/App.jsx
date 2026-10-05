import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { initialFinancialData, mockVouchers } from '@/data/mockData';
import { recordAppLaunch } from '@/plugins/nativeStorage';
import { checkForOtaUpdate } from '@/utils/liveUpdates';
import RegisterScreen from '@/screens/RegisterScreen';
import CompleteProfileScreen from '@/screens/CompleteProfileScreen';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardScreen from '@/screens/DashboardScreen';
import ProductsScreen from '@/screens/ProductsScreen';
import VouchersScreen from '@/screens/VouchersScreen';
import OrdersScreen from '@/screens/OrdersScreen';
import OtaStatusCard from '@/components/OtaStatusCard';
function App() {
    const [otaStatus, setOtaStatus] = useState({ status: 'checking', message: 'جاري تجهيز فحص التحديث الهوائي...' });
    const [otaRefreshing, setOtaRefreshing] = useState(false);
    const runOtaCheck = useCallback(async () => {
        setOtaRefreshing(true);
        try {
            const result = await checkForOtaUpdate({ onStatus: setOtaStatus });
            if (result?.reason === 'web') {
                setOtaStatus({ status: 'web', message: 'التحديث الهوائي يعمل داخل تطبيق الهاتف' });
            }
        }
        catch (error) {
            console.warn('OTA update check failed', error);
            setOtaStatus({ status: 'error', message: 'تعذّر الاتصال بخادم التحديث، حاول مرة أخرى' });
        }
        finally {
            setOtaRefreshing(false);
        }
    }, []);
    useEffect(() => {
        // Uses Kotlin/Swift on native builds and localStorage on the web.
        recordAppLaunch().catch(() => {
            // Native capabilities are optional; the existing dashboard remains usable.
        });
        runOtaCheck();
    }, [runOtaCheck]);
    const [screen, setScreen] = useState('REGISTER');
    const [vendor, setVendor] = useState({});
    const [financialData, setFinancialData] = useState(initialFinancialData);
    const [vouchers, setVouchers] = useState(mockVouchers);
    const handleRegisterComplete = (data) => {
        setVendor({ ...data, status: 'pending' });
        setScreen('COMPLETE_PROFILE');
    };
    const handleProfileComplete = (data) => {
        setVendor(data);
        setScreen('DASHBOARD');
    };
    const handlePaymentReceived = (amount) => {
        setFinancialData(prev => ({ ...prev, owedBalance: prev.owedBalance - amount }));
        const newVoucher = {
            id: String(Date.now()),
            receiptNumber: `PAY-2025-${String(vouchers.length + 1).padStart(4, '0')}`,
            date: new Date().toLocaleDateString('ar-EG'),
            amount,
            remaining: financialData.owedBalance - amount,
            whatsappSent: true,
            vendor: vendor.storeName || '',
        };
        setVouchers([newVoucher, ...vouchers]);
    };
    // Render screens outside the dashboard layout
    if (screen === 'REGISTER') {
        return _jsx(RegisterScreen, { onRegisterComplete: handleRegisterComplete });
    }
    if (screen === 'COMPLETE_PROFILE') {
        return _jsx(CompleteProfileScreen, { vendorData: vendor, onComplete: handleProfileComplete });
    }
    // Dashboard screens with layout
    const fullVendor = vendor;
    return (_jsxs(DashboardLayout, { currentScreen: screen, onNavigate: setScreen, vendor: fullVendor, children: [_jsx(OtaStatusCard, { status: otaStatus, onRefresh: runOtaCheck, refreshing: otaRefreshing }), screen === 'DASHBOARD' && (_jsx(DashboardScreen, { vendor: fullVendor, financialData: financialData, onPaymentReceived: handlePaymentReceived, vouchers: vouchers })), screen === 'PRODUCTS' && _jsx(ProductsScreen, { vendor: fullVendor }), screen === 'VOUCHERS' && _jsx(VouchersScreen, { vendor: fullVendor, vouchers: vouchers, financialData: financialData }), screen === 'ORDERS' && _jsx(OrdersScreen, { vendor: fullVendor })] }));
}
export default App;
