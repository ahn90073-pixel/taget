import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Truck, Wallet, Package, Users, AlertCircle,
  CheckCircle2, MessageCircle, Download, ArrowUpRight, ArrowDownRight,
  DollarSign, Loader2, Sparkles, Receipt
} from 'lucide-react';
import type { VendorData, FinancialData, Voucher } from '@/types';
import { formatEGP, formatNumber } from '@/utils/format';
import { mockProducts, mockOrders } from '@/data/mockData';

interface DashboardScreenProps {
  vendor: VendorData;
  financialData: FinancialData;
  onPaymentReceived: (amount: number) => void;
  vouchers: Voucher[];
}

export default function DashboardScreen({ vendor, financialData, onPaymentReceived, vouchers }: DashboardScreenProps) {
  const [displayBalance, setDisplayBalance] = useState(financialData.owedBalance);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(200000);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showWhatsAppAlert, setShowWhatsAppAlert] = useState(false);
  const prevBalanceRef = useRef(financialData.owedBalance);

  // Animate balance changes
  useEffect(() => {
    const startVal = prevBalanceRef.current;
    const endVal = financialData.owedBalance;
    if (startVal === endVal) return;

    const duration = 1000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * eased);
      setDisplayBalance(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevBalanceRef.current = endVal;
      }
    };
    requestAnimationFrame(animate);
  }, [financialData.owedBalance]);

  const handlePaymentSubmit = () => {
    setProcessingPayment(true);
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentSuccess(true);
      onPaymentReceived(paymentAmount);
      setTimeout(() => {
        setPaymentSuccess(false);
        setShowPaymentModal(false);
        setShowWhatsAppAlert(true);
        setTimeout(() => setShowWhatsAppAlert(false), 5000);
      }, 1500);
    }, 2000);
  };

  const recentOrders = mockOrders.slice(0, 4);
  const activeProducts = mockProducts.filter(p => p.status === 'active').length;
  const deliveredCount = mockOrders.filter(o => o.status === 'delivered').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-l from-slate-900 to-brand-800 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-brand-300 text-sm mb-1">مرحباً،</p>
            <h2 className="text-2xl font-bold font-display">{vendor.vendorName}</h2>
            <p className="text-slate-300 text-sm mt-1">{vendor.storeName} • {vendor.warehouseAddress.governorate}</p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-xl">
            <Sparkles className="w-5 h-5 text-financial-400" />
            <span className="text-sm">حساب موثق — نشط</span>
          </div>
        </div>
      </motion.div>

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="إجمالي المبيعات"
          value={formatEGP(financialData.totalSales)}
          icon={<TrendingUp className="w-6 h-6" />}
          color="brand"
          trend="+12.5%"
          trendUp={true}
        />
        <StatCard
          title="الرصيد المعلق (في الطريق)"
          value={formatEGP(financialData.pendingTransit)}
          icon={<Truck className="w-6 h-6" />}
          color="alert"
          trend={`${mockOrders.filter(o => o.status === 'picked_up').length} شحنة`}
          trendUp={false}
        />
        <StatCard
          title="الرصيد المستحق"
          value={formatEGP(financialData.owedBalance)}
          icon={<Wallet className="w-6 h-6" />}
          color="financial"
          trend="محصّل وجاهز للسحب"
          trendUp={true}
          highlight
        />
      </div>

      {/* Live Owed Counter Widget */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden"
      >
        <div className="bg-gradient-to-l from-financial-600 to-financial-700 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <DollarSign className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display">العداد المالي المستحق (Live)</h3>
                <p className="text-financial-100 text-sm">المبالغ المحصّة الجاهزة للاستلام من الإدارة</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-financial-300 animate-pulse" />
              مباشر
            </div>
          </div>

          <motion.div
            key={displayBalance}
            className="text-4xl sm:text-5xl font-bold font-display tracking-tight"
          >
            {formatEGP(displayBalance)}
          </motion.div>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 bg-white text-financial-700 font-bold py-3 rounded-xl hover:bg-financial-50 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              تسجيل سداد من الإدارة
            </button>
            <div className="flex-1 bg-white/10 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
              <span className="text-financial-100">آخر تحديث:</span>
              <span className="font-semibold">منذ ٥ دقائق</span>
            </div>
          </div>
        </div>

        {/* Ledger Breakdown */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LedgerItem
            label="إجمالي المبيعات"
            value={formatEGP(financialData.totalSales)}
            icon={<TrendingUp className="w-5 h-5" />}
            color="text-brand-600 bg-brand-50"
          />
          <LedgerItem
            label="معلّق في الشحن"
            value={formatEGP(financialData.pendingTransit)}
            icon={<Truck className="w-5 h-5" />}
            color="text-alert-600 bg-alert-50"
          />
          <LedgerItem
            label="صافي المستحق"
            value={formatEGP(financialData.owedBalance)}
            icon={<Wallet className="w-5 h-5" />}
            color="text-financial-600 bg-financial-50"
          />
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat icon={<Package className="w-5 h-5" />} label="منتجات نشطة" value={`${activeProducts}`} color="bg-brand-50 text-brand-600" />
        <MiniStat icon={<Truck className="w-5 h-5" />} label="شحنات مسلّمة" value={`${deliveredCount}`} color="bg-financial-50 text-financial-600" />
        <MiniStat icon={<Users className="w-5 h-5" />} label="عملاء" value={formatNumber(1248)} color="bg-purple-50 text-purple-600" />
        <MiniStat icon={<Receipt className="w-5 h-5" />} label="إيصالات سداد" value={`${vouchers.length}`} color="bg-alert-50 text-alert-600" />
      </div>

      {/* Recent Orders Preview */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 font-display">أحدث الطلبات</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {recentOrders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                order.status === 'delivered' ? 'bg-financial-100 text-financial-600' :
                order.status === 'returned' ? 'bg-red-100 text-red-600' :
                'bg-alert-100 text-alert-600'
              }`}>
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{order.customerName}</p>
                <p className="text-slate-400 text-xs truncate">{order.product} • {order.carrier}</p>
              </div>
              <div className="text-left">
                <p className="font-bold text-slate-800 text-sm">{formatEGP(order.amount)}</p>
                <OrderStatusBadge status={order.status} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <Modal onClose={() => !processingPayment && !paymentSuccess && setShowPaymentModal(false)}>
            {paymentSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-financial-100 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-12 h-12 text-financial-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-slate-900 font-display mb-2">تم تسجيل السداد بنجاح!</h3>
                <p className="text-slate-500 mb-4">
                  تم خصم {formatEGP(paymentAmount)} من رصيدك المستحق
                </p>
                <p className="text-financial-600 font-semibold text-sm">
                  سيتم إرسال إيصال السداد إلى واتساب الخاص بك
                </p>
              </motion.div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-display mb-2">تسجيل سداد من الإدارة</h3>
                <p className="text-slate-500 text-sm mb-6">
                  هذه عملية تجريبية لمحاكاة استلام دفعة من إدارة المنصة
                </p>

                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="text-slate-500 text-sm mb-1">الرصيد المستحق الحالي</p>
                  <p className="text-2xl font-bold text-financial-600 font-display">{formatEGP(financialData.owedBalance)}</p>
                </div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">مبلغ السداد</label>
                <div className="relative mb-4">
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-financial-500 text-lg font-bold"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">ج.م</span>
                </div>

                <div className="bg-financial-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-financial-700">الرصيد بعد السداد:</span>
                    <span className="font-bold text-financial-700">{formatEGP(financialData.owedBalance - paymentAmount)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePaymentSubmit}
                  disabled={processingPayment || paymentAmount <= 0 || paymentAmount > financialData.owedBalance}
                  className="w-full bg-financial-600 hover:bg-financial-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      جاري معالجة السداد...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      تأكيد السداد
                    </>
                  )}
                </button>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>

      {/* WhatsApp Alert Toast */}
      <AnimatePresence>
        {showWhatsAppAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-20 left-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-financial-200 p-4 flex items-center gap-3 max-w-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-financial-100 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-7 h-7 text-financial-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">تم إصدار شيك سداد وإرساله للواتساب الخاص بك</p>
              <p className="text-slate-400 text-xs mt-0.5">رقم الإيصال: PAY-2025-{String(vouchers.length + 1).padStart(4, '0')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'brand' | 'alert' | 'financial';
  trend: string;
  trendUp: boolean;
  highlight?: boolean;
}

function StatCard({ title, value, icon, color, trend, trendUp, highlight }: StatCardProps) {
  const colorMap = {
    brand: 'bg-brand-50 text-brand-600',
    alert: 'bg-alert-50 text-alert-600',
    financial: 'bg-financial-50 text-financial-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-6 shadow-sm border transition-all hover:shadow-md ${
        highlight ? 'border-financial-200 ring-2 ring-financial-100' : 'border-slate-100'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-financial-600' : 'text-alert-600'}`}>
          {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {trend}
        </div>
      </div>
      <p className="text-slate-400 text-sm mb-1">{title}</p>
      <p className="text-2xl font-bold text-slate-900 font-display">{value}</p>
    </motion.div>
  );
}

function LedgerItem({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="font-bold text-slate-800 text-sm">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900 font-display">{value}</p>
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    preparing: { label: 'جاري التجهيز', color: 'bg-alert-100 text-alert-700' },
    picked_up: { label: 'استلمها المندوب', color: 'bg-brand-100 text-brand-700' },
    delivered: { label: 'تم التسليم', color: 'bg-financial-100 text-financial-700' },
    returned: { label: 'مرتجع', color: 'bg-red-100 text-red-700' },
  };
  const s = map[status] || map.preparing;
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>{s.label}</span>;
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
