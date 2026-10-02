export type ScreenName = 'REGISTER' | 'COMPLETE_PROFILE' | 'DASHBOARD' | 'PRODUCTS' | 'VOUCHERS' | 'ORDERS';

export type AccountStatus = 'pending' | 'verified';

export interface VendorData {
  vendorName: string;
  email: string;
  phone: string;
  storeName: string;
  storeNameEn: string;
  status: AccountStatus;
  commercialRegister: string;
  taxId: string;
  warehouseAddress: {
    governorate: string;
    city: string;
    street: string;
  };
  payoutMethod: 'vodafone_cash' | 'instapay' | 'bank' | '';
  payoutNumber: string;
  uploadedDocs: {
    nationalId: boolean;
    commercialRegister: boolean;
    propertyContract: boolean;
  };
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  weight: number;
  status: 'active' | 'draft';
}

export interface Voucher {
  id: string;
  receiptNumber: string;
  date: string;
  amount: number;
  remaining: number;
  whatsappSent: boolean;
  vendor: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  product: string;
  amount: number;
  carrier: 'Bosta' | 'Aramex' | 'Mylerz';
  status: 'preparing' | 'picked_up' | 'delivered' | 'returned';
  date: string;
  governorate: string;
}

export interface FinancialData {
  totalSales: number;
  pendingTransit: number;
  owedBalance: number;
  currency: string;
}
