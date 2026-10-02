import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, Package, MapPin, Phone, Printer, Search,
  PackageCheck, Truck as TruckIcon, Home, RotateCcw,
  Filter, X
} from 'lucide-react';
import type { Order, VendorData } from '@/types';
import { formatEGP } from '@/utils/format';
import { mockOrders } from '@/data/mockData';

interface OrdersScreenProps {
  vendor: VendorData;
}

const statusConfig: Record<Order['status'], { label: string; color: string; icon: React.ReactNode; step: number }> = {
  preparing: { label: 'جاري التجهيز', color: 'alert', icon: <Package className="w-4 h-4" />, step: 1 },
  picked_up: { label: 'استلمها المندوب', color: 'brand', icon: <TruckIcon className="w-4 h-4" />, step: 2 },
  delivered: { label: 'تم التسليم', color: 'financial', icon: <Home className="w-4 h-4" />, step: 3 },
  returned: { label: 'مرتجع', color: 'red', icon: <RotateCcw className="w-4 h-4" />, step: 0 },
};

const carrierColors: Record<string, string> = {
  Bosta: 'bg-orange-100 text-orange-700',
  Aramex: 'bg-red-100 text-red-700',
  Mylerz: 'bg-blue-100 text-blue-700',
};

export default function OrdersScreen({ vendor: VendorData }: OrdersScreenProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCarrier, setFilterCarrier] = useState('all');
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  const filtered = mockOrders.filter(o =>
    (o.customerName.includes(search) || o.orderNumber.includes(search) || o.product.includes(search)) &&
    (filterStatus === 'all' || o.status === filterStatus) &&
    (filterCarrier === 'all' || o.carrier === filterCarrier)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 font-display">طلبات الشحن وتتبع الشحنات</h2>
        <p className="text-slate-400 text-sm mt-1">
          متابعة الطلبات الواردة وحالة الشحن مع شركات الشحن
        </p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['preparing', 'picked_up', 'delivered', 'returned'] as Order['status'][]).map(status => {
          const count = mockOrders.filter(o => o.status === status).length;
          const config = statusConfig[status];
          const colorMap: Record<string, string> = {
            alert: 'bg-alert-50 text-alert-600',
            brand: 'bg-brand-50 text-brand-600',
            financial: 'bg-financial-50 text-financial-600',
            red: 'bg-red-50 text-red-600',
          };
          return (
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[config.color]}`}>
                {config.icon}
              </div>
              <p className="text-2xl font-bold text-slate-900 font-display">{count}</p>
              <p className="text-slate-400 text-xs mt-0.5">{config.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث برقم الطلب، اسم العميل، أو المنتج..."
            className="w-full pr-11 pl-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
        >
          <option value="all">جميع الحالات</option>
          <option value="preparing">جاري التجهيز</option>
          <option value="picked_up">استلمها المندوب</option>
          <option value="delivered">تم التسليم</option>
          <option value="returned">مرتجع</option>
        </select>
        <select
          value={filterCarrier}
          onChange={(e) => setFilterCarrier(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
        >
          <option value="all">جميع الشركات</option>
          <option value="Bosta">Bosta</option>
          <option value="Aramex">Aramex</option>
          <option value="Mylerz">Mylerz</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filtered.map((order, i) => {
          const config = statusConfig[order.status];
          const colorMap: Record<string, { bg: string; text: string; border: string }> = {
            alert: { bg: 'bg-alert-50', text: 'text-alert-600', border: 'border-alert-200' },
            brand: { bg: 'bg-brand-50', text: 'text-brand-600', border: 'border-brand-200' },
            financial: { bg: 'bg-financial-50', text: 'text-financial-600', border: 'border-financial-200' },
            red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
          };
          const c = colorMap[config.color];

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono font-bold text-slate-800 text-sm">{order.orderNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${carrierColors[order.carrier]}`}>
                        {order.carrier}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 text-sm mb-1">{order.customerName}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {order.customerPhone}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {order.governorate}</span>
                      <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" /> {order.product}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-slate-900">{formatEGP(order.amount)}</p>
                    <p className="text-xs text-slate-400">{order.date}</p>
                  </div>

                  {/* Status Badge & Print */}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
                      {config.icon}
                      {config.label}
                    </span>
                    <button
                      onClick={() => setPrintOrder(order)}
                      className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 hover:bg-brand-100 hover:text-brand-600 flex items-center justify-center transition-colors flex-shrink-0"
                      title="طباعة بوليصة الشحن"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Shipping Progress Tracker */}
                {order.status !== 'returned' && (
                  <div className="mt-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-1">
                      {[
                        { step: 1, label: 'التجهيز', icon: <Package className="w-4 h-4" /> },
                        { step: 2, label: 'المندوب', icon: <TruckIcon className="w-4 h-4" /> },
                        { step: 3, label: 'التسليم', icon: <Home className="w-4 h-4" /> },
                      ].map((s, idx) => {
                        const isDone = config.step >= s.step;
                        const isCurrent = config.step === s.step;
                        return (
                          <div key={s.step} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                isDone ? 'bg-financial-500 text-white' : 'bg-slate-100 text-slate-400'
                              } ${isCurrent ? 'ring-4 ring-financial-100' : ''}`}>
                                {isDone ? <PackageCheck className="w-4 h-4" /> : s.icon}
                              </div>
                              <span className={`text-xs ${isDone ? 'text-financial-600 font-semibold' : 'text-slate-400'}`}>
                                {s.label}
                              </span>
                            </div>
                            {idx < 2 && (
                              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                                config.step > s.step ? 'bg-financial-400' : 'bg-slate-100'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400">لا توجد طلبات مطابقة</p>
        </div>
      )}

      {/* Print Label Modal */}
      {printOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setPrintOrder(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full z-10 overflow-hidden"
          >
            <div className="bg-slate-900 p-4 flex items-center justify-between">
              <h3 className="text-white font-bold font-display">بوليصة شحن — {printOrder.carrier}</h3>
              <button onClick={() => setPrintOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center border-b-2 border-dashed border-slate-200 pb-4">
                <p className="font-mono font-bold text-slate-800 text-lg">{printOrder.orderNumber}</p>
                <p className="text-slate-400 text-sm">{printOrder.date}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">المرسل إليه</p>
                  <p className="font-bold text-slate-800">{printOrder.customerName}</p>
                  <p className="text-slate-600 text-sm">{printOrder.customerPhone}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">العنوان</p>
                  <p className="text-slate-700 text-sm">{printOrder.governorate}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-0.5">المحتوى</p>
                  <p className="text-slate-700 text-sm">{printOrder.product}</p>
                </div>
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <span className="text-slate-400 text-sm">قيمة الشحنة</span>
                  <span className="font-bold text-slate-800">{formatEGP(printOrder.amount)}</span>
                </div>
              </div>
              {/* Barcode placeholder */}
              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-center">
                <div className="flex gap-0.5">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="w-0.5 bg-slate-800" style={{ height: 32, opacity: Math.random() > 0.3 ? 1 : 0.3 }} />
                  ))}
                </div>
              </div>
              <button className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors flex items-center justify-center gap-2">
                <Printer className="w-5 h-5" />
                طباعة البوليصة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
