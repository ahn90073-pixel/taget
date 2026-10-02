import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, Download, MessageCircle, X, QrCode, CheckCircle2,
  Wallet, Calendar, FileText, Eye, ArrowDownCircle, ArrowUpCircle,
  TrendingDown, Loader2
} from 'lucide-react';
import type { VendorData, Voucher, FinancialData } from '@/types';
import { formatEGP } from '@/utils/format';
import { generateVoucherPDF } from '@/utils/pdf';

interface VouchersScreenProps {
  vendor: VendorData;
  vouchers: Voucher[];
  financialData: FinancialData;
}

export default function VouchersScreen({ vendor, vouchers, financialData }: VouchersScreenProps) {
  const [previewVoucher, setPreviewVoucher] = useState<Voucher | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const totalPaid = vouchers.reduce((sum, v) => sum + v.amount, 0);
  const currentBalance = financialData.owedBalance;

  // Animated counters
  const [displayPaid, setDisplayPaid] = useState(0);
  const [displayBalance, setDisplayBalance] = useState(currentBalance);
  const balanceRef = useRef(currentBalance);
  const paidRef = useRef(0);

  useEffect(() => {
    const startBal = balanceRef.current;
    const endBal = currentBalance;
    const startPaid = paidRef.current;
    const endPaid = totalPaid;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayBalance(Math.round(startBal + (endBal - startBal) * eased));
      setDisplayPaid(Math.round(startPaid + (endPaid - startPaid) * eased));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        balanceRef.current = endBal;
        paidRef.current = endPaid;
      }
    };
    requestAnimationFrame(animate);
  }, [currentBalance, totalPaid]);

  const handleDownloadPDF = (voucher: Voucher) => {
    setDownloadingId(voucher.id);
    setTimeout(() => {
      generateVoucherPDF(vendor, voucher);
      setDownloadingId(null);
    }, 600);
  };

  const payoutLabel = (method: string) => {
    if (method === 'vodafone_cash') return 'فودافون كاش';
    if (method === 'instapay') return 'InstaPay';
    if (method === 'bank') return 'حساب بنكي';
    return '—';
  };

  return (
    <div className="space-y-6">
      {/* Elegant Balance Counters — Side by Side at Top */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
      >
        {/* Total Paid Counter */}
        <div className="relative bg-gradient-to-br from-financial-600 to-financial-800 rounded-2xl p-6 text-white overflow-hidden shadow-lg shadow-financial-200">
          <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-financial-400/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                  <ArrowDownCircle className="w-6 h-6" />
                </div>
                <span className="font-semibold text-financial-50 text-sm">إجمالي المسدد</span>
              </div>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-financial-200" />
                {vouchers.length} إيصال
              </span>
            </div>
            <div className="text-4xl font-bold font-display tracking-tight tabular-nums">
              {formatEGP(displayPaid)}
            </div>
            <div className="mt-3 h-1.5 bg-white/15 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/40 rounded-full"
                animate={{ width: `${totalPaid > 0 ? Math.min((totalPaid / (totalPaid + currentBalance)) * 100, 100) : 0}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <p className="text-financial-100 text-xs mt-2">
              نسبة التحصيل: {totalPaid + currentBalance > 0 ? Math.round((totalPaid / (totalPaid + currentBalance)) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Remaining Balance Counter */}
        <div className="relative bg-gradient-to-br from-alert-500 to-alert-700 rounded-2xl p-6 text-white overflow-hidden shadow-lg shadow-alert-200">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-alert-300/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                  <ArrowUpCircle className="w-6 h-6" />
                </div>
                <span className="font-semibold text-alert-50 text-sm">الرصيد الباقي (المستحق)</span>
              </div>
              <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-alert-200 animate-pulse" />
                مستحق للسحب
              </span>
            </div>
            <div className="text-4xl font-bold font-display tracking-tight tabular-nums">
              {formatEGP(displayBalance)}
            </div>
            <div className="mt-3 h-1.5 bg-white/15 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/40 rounded-full"
                animate={{ width: `${totalPaid + currentBalance > 0 ? Math.min((currentBalance / (totalPaid + currentBalance)) * 100, 100) : 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <p className="text-alert-100 text-xs mt-2">
              المتبقي من إجمالي: {formatEGP(totalPaid + currentBalance)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Compact Summary Row */}
      <div className="flex flex-wrap gap-3">
        <SummaryChip
          icon={<Receipt className="w-4 h-4" />}
          label="عدد الإيصالات"
          value={`${vouchers.length}`}
          color="bg-brand-50 text-brand-700"
        />
        <SummaryChip
          icon={<TrendingDown className="w-4 h-4" />}
          label="متوسط الدفعة"
          value={formatEGP(vouchers.length > 0 ? Math.round(totalPaid / vouchers.length) : 0)}
          color="bg-slate-100 text-slate-700"
        />
        <SummaryChip
          icon={<Wallet className="w-4 h-4" />}
          label="الإجمالي التراكمي"
          value={formatEGP(totalPaid + currentBalance)}
          color="bg-financial-50 text-financial-700"
        />
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 font-display">سجل المحفظة وإيصالات السداد</h2>
          <p className="text-slate-400 text-sm mt-1">جميع عمليات التحويل من إدارة المنصة — يمكنك تحميل الإيصالات PDF</p>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">رقم الإيصال</th>
                <th className="text-right px-4 py-4 text-sm font-semibold text-slate-600">التاريخ</th>
                <th className="text-right px-4 py-4 text-sm font-semibold text-slate-600">المبلغ المدفوع</th>
                <th className="text-right px-4 py-4 text-sm font-semibold text-slate-600">المتبقي</th>
                <th className="text-right px-4 py-4 text-sm font-semibold text-slate-600 hidden sm:table-cell">حالة الواتساب</th>
                <th className="text-right px-4 py-4 text-sm font-semibold text-slate-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {vouchers.map((voucher, i) => (
                <motion.tr
                  key={voucher.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-800 text-sm font-mono">{voucher.receiptNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-600 text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {voucher.date}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-financial-600 text-sm">{formatEGP(voucher.amount)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-slate-700 text-sm font-semibold">{formatEGP(voucher.remaining)}</span>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      voucher.whatsappSent
                        ? 'bg-financial-100 text-financial-700'
                        : 'bg-alert-100 text-alert-700'
                    }`}>
                      {voucher.whatsappSent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
                      {voucher.whatsappSent ? 'تم الإرسال' : 'لم يُرسل'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewVoucher(voucher)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-brand-100 hover:text-brand-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        معاينة
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(voucher)}
                        disabled={downloadingId === voucher.id}
                        className="px-3 py-1.5 rounded-lg bg-financial-100 text-financial-700 hover:bg-financial-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60"
                      >
                        {downloadingId === voucher.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        PDF
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Voucher Preview Modal */}
      <AnimatePresence>
        {previewVoucher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewVoucher(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-l from-financial-600 to-financial-700 p-6 text-white relative">
                <button
                  onClick={() => setPreviewVoucher(null)}
                  className="absolute top-4 left-4 text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <Receipt className="w-6 h-6" />
                  <h3 className="text-lg font-bold font-display">شيك سداد / إيصال مالي</h3>
                </div>
                <p className="text-financial-100 text-sm font-mono">{previewVoucher.receiptNumber}</p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailRow label="اسم التاجر" value={vendor.vendorName} />
                  <DetailRow label="المتجر" value={vendor.storeName} />
                  <DetailRow label="تاريخ السداد" value={previewVoucher.date} />
                  <DetailRow label="وسيلة التحويل" value={payoutLabel(vendor.payoutMethod)} />
                </div>

                <div className="bg-financial-50 rounded-xl p-4 text-center">
                  <p className="text-financial-700 text-sm mb-1">المبلغ المسدد</p>
                  <p className="text-3xl font-bold text-financial-600 font-display">{formatEGP(previewVoucher.amount)}</p>
                </div>

                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">الرصيد المتبقي بعد السداد</p>
                    <p className="font-bold text-slate-800">{formatEGP(previewVoucher.remaining)}</p>
                  </div>
                  {/* QR Code placeholder */}
                  <div className="w-20 h-20 bg-white border-2 border-slate-200 rounded-xl flex flex-col items-center justify-center">
                    <QrCode className="w-12 h-12 text-slate-700" />
                    <span className="text-[8px] text-slate-400 mt-1">تحقق</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm">
                    <MessageCircle className="w-4 h-4" />
                    إرسال عبر واتساب
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(previewVoucher)}
                    disabled={downloadingId === previewVoucher.id}
                    className="flex-1 py-3 rounded-xl bg-financial-600 hover:bg-financial-700 text-white font-bold transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                  >
                    {downloadingId === previewVoucher.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    تحميل PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${color}`}>
      {icon}
      <span className="text-xs font-semibold opacity-80">{label}</span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400 text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-slate-800 text-sm">{value}</p>
    </div>
  );
}
