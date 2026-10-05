export const initialFinancialData = {
    totalSales: 487500,
    pendingTransit: 187500,
    owedBalance: 300000,
    currency: 'ج.م',
};
export const mockProducts = [
    { id: '1', name: 'كابل شحن سريع Type-C 3A', category: 'إكسسوارات', price: 85, stock: 240, weight: 0.08, status: 'active' },
    { id: '2', name: 'سماعات بلوتوث TWS Pro', category: 'إلكترونيات', price: 320, stock: 75, weight: 0.15, status: 'active' },
    { id: '3', name: 'جراب حماية شفاف iPhone 15', category: 'إكسسوارات', price: 45, stock: 0, weight: 0.03, status: 'active' },
    { id: '4', name: 'شاحن سفر 65W ثلاثي منافذ', category: 'إلكترونيات', price: 195, stock: 50, weight: 0.22, status: 'active' },
    { id: '5', name: 'حامل موبايل مغناطيسي للسيارة', category: 'إكسسوارات', price: 60, stock: 120, weight: 0.1, status: 'draft' },
    { id: '6', name: 'ساعة ذكية Smart Watch S9', category: 'إلكترونيات', price: 750, stock: 30, weight: 0.35, status: 'active' },
    { id: '7', name: 'كفر لابتوب 15.6 بوصة', category: 'إكسسوارات', price: 110, stock: 45, weight: 0.25, status: 'active' },
];
export const mockVouchers = [
    { id: '1', receiptNumber: 'PAY-2025-0142', date: '٢٠٢٥/٠٩/٢٨', amount: 50000, remaining: 250000, whatsappSent: true, vendor: 'متجر الأمل للتجارة' },
    { id: '2', receiptNumber: 'PAY-2025-0138', date: '٢٠٢٥/٠٩/١٥', amount: 75000, remaining: 300000, whatsappSent: true, vendor: 'متجر الأمل للتجارة' },
    { id: '3', receiptNumber: 'PAY-2025-0129', date: '٢٠٢٥/٠٨/٣٠', amount: 100000, remaining: 375000, whatsappSent: true, vendor: 'متجر الأمل للتجارة' },
    { id: '4', receiptNumber: 'PAY-2025-0115', date: '٢٠٢٥/٠٨/١٢', amount: 60000, remaining: 475000, whatsappSent: false, vendor: 'متجر الأمل للتجارة' },
    { id: '5', receiptNumber: 'PAY-2025-0098', date: '٢٠٢٥/٠٧/٢٨', amount: 120000, remaining: 535000, whatsappSent: true, vendor: 'متجر الأمل للتجارة' },
];
export const mockOrders = [
    { id: '1', orderNumber: 'ORD-5847', customerName: 'محمد عبد الرحمن', customerPhone: '+20 101 234 5678', product: 'سماعات بلوتوث TWS Pro', amount: 320, carrier: 'Bosta', status: 'preparing', date: '٢٠٢٥/١٠/٠٢', governorate: 'القاهرة' },
    { id: '2', orderNumber: 'ORD-5846', customerName: 'سارة إبراهيم', customerPhone: '+20 122 345 6789', product: 'شاحن سفر 65W', amount: 195, carrier: 'Aramex', status: 'picked_up', date: '٢٠٢٥/١٠/٠١', governorate: 'الجيزة' },
    { id: '3', orderNumber: 'ORD-5845', customerName: 'أحمد سمير', customerPhone: '+20 100 456 7890', product: 'ساعة ذكية Smart Watch S9', amount: 750, carrier: 'Bosta', status: 'delivered', date: '٢٠٢٥/٠٩/٣٠', governorate: 'الإسكندرية' },
    { id: '4', orderNumber: 'ORD-5844', customerName: 'نورا حسن', customerPhone: '+20 111 567 8901', product: 'كابل شحن سريع Type-C', amount: 85, carrier: 'Mylerz', status: 'delivered', date: '٢٠٢٥/٠٩/٢٩', governorate: 'القاهرة' },
    { id: '5', orderNumber: 'ORD-5843', customerName: 'كريم وليد', customerPhone: '+20 109 876 5432', product: 'حامل موبايل مغناطيسي', amount: 60, carrier: 'Bosta', status: 'returned', date: '٢٠٢٥/٠٩/٢٨', governorate: 'الدقهلية' },
    { id: '6', orderNumber: 'ORD-5842', customerName: 'فاطمة محمود', customerPhone: '+20 128 765 4321', product: 'جراب حماية شفاف', amount: 45, carrier: 'Aramex', status: 'picked_up', date: '٢٠٢٥/٠٩/٢٧', governorate: 'الجيزة' },
    { id: '7', orderNumber: 'ORD-5841', customerName: 'عمر خالد', customerPhone: '+20 100 654 3210', product: 'كفر لابتوب 15.6', amount: 110, carrier: 'Bosta', status: 'delivered', date: '٢٠٢٥/٠٩/٢٦', governorate: 'القليوبية' },
];
export const egyptGovernorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية', 'القليوبية',
    'المنوفية', 'الغربية', 'كفر الشيخ', 'البحيرة', 'الإسماعيلية', 'بورسعيد',
    'السويس', 'الأقصر', 'أسوان', 'سوهاج', 'قنا', 'أسيوط', 'المنيا', 'الفيوم',
    'بني سويف', 'الوادي الجديد', 'مطروح', 'البحر الأحمر', 'شمال سيناء', 'جنوب سيناء',
];
export const productCategories = ['إلكترونيات', 'إكسسوارات', 'ملابس', 'منزل ومطبخ', 'جمال وعناية', 'ألعاب', 'رياضة'];
