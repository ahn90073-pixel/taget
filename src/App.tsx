import { useState } from 'react';
import type { ScreenName, VendorData, FinancialData, Voucher } from '@/types';
import { initialFinancialData, mockVouchers } from '@/data/mockData';
import RegisterScreen from '@/screens/RegisterScreen';
import CompleteProfileScreen from '@/screens/CompleteProfileScreen';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardScreen from '@/screens/DashboardScreen';
import ProductsScreen from '@/screens/ProductsScreen';
import VouchersScreen from '@/screens/VouchersScreen';
import OrdersScreen from '@/screens/OrdersScreen';

function App() {
  const [screen, setScreen] = useState<ScreenName>('REGISTER');
  const [vendor, setVendor] = useState<Partial<VendorData>>({});
  const [financialData, setFinancialData] = useState<FinancialData>(initialFinancialData);
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);

  const handleRegisterComplete = (data: { vendorName: string; email: string; phone: string; storeName: string }) => {
    setVendor({ ...data, status: 'pending' });
    setScreen('COMPLETE_PROFILE');
  };

  const handleProfileComplete = (data: VendorData) => {
    setVendor(data);
    setScreen('DASHBOARD');
  };

  const handlePaymentReceived = (amount: number) => {
    setFinancialData(prev => ({ ...prev, owedBalance: prev.owedBalance - amount }));
    const newVoucher: Voucher = {
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
    return <RegisterScreen onRegisterComplete={handleRegisterComplete} />;
  }

  if (screen === 'COMPLETE_PROFILE') {
    return <CompleteProfileScreen vendorData={vendor} onComplete={handleProfileComplete} />;
  }

  // Dashboard screens with layout
  const fullVendor = vendor as VendorData;

  return (
    <DashboardLayout
      currentScreen={screen}
      onNavigate={setScreen}
      vendor={fullVendor}
    >
      {screen === 'DASHBOARD' && (
        <DashboardScreen
          vendor={fullVendor}
          financialData={financialData}
          onPaymentReceived={handlePaymentReceived}
          vouchers={vouchers}
        />
      )}
      {screen === 'PRODUCTS' && <ProductsScreen vendor={fullVendor} />}
      {screen === 'VOUCHERS' && <VouchersScreen vendor={fullVendor} vouchers={vouchers} financialData={financialData} />}
      {screen === 'ORDERS' && <OrdersScreen vendor={fullVendor} />}
    </DashboardLayout>
  );
}

export default App;
