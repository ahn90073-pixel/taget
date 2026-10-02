import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, Receipt, Truck, Store, Menu, X,
  LogOut, ShieldCheck, ChevronLeft, Bell
} from 'lucide-react';
import type { ScreenName, VendorData } from '@/types';

interface DashboardLayoutProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
  vendor: VendorData;
  children: React.ReactNode;
}

const navItems: { screen: ScreenName; label: string; icon: React.ReactNode }[] = [
  { screen: 'DASHBOARD', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-5 h-5" /> },
  { screen: 'PRODUCTS', label: 'إدارة المنتجات', icon: <Package className="w-5 h-5" /> },
  { screen: 'ORDERS', label: 'طلبات الشحن', icon: <Truck className="w-5 h-5" /> },
  { screen: 'VOUCHERS', label: 'سجل المحفظة والإيصالات', icon: <Receipt className="w-5 h-5" /> },
];

export default function DashboardLayout({ currentScreen, onNavigate, vendor, children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLabel = navItems.find(n => n.screen === currentScreen)?.label || 'لوحة التحكم';

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-700/50">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center flex-shrink-0">
          <Store className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-white font-bold font-display text-sm truncate">منصة السوق المصري</h1>
          <p className="text-slate-400 text-xs truncate">{vendor.storeName}</p>
        </div>
      </div>

      {/* Vendor Status Badge */}
      <div className="px-4 pt-4">
        <div className={`rounded-xl p-3 flex items-center gap-3 ${
          vendor.status === 'verified'
            ? 'bg-financial-900/40 border border-financial-700/50'
            : 'bg-alert-900/40 border border-alert-700/50'
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            vendor.status === 'verified' ? 'bg-financial-500/20 text-financial-400' : 'bg-alert-500/20 text-alert-400'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold">
              {vendor.status === 'verified' ? 'حساب موثق' : 'قيد المراجعة'}
            </p>
            <p className="text-slate-400 text-xs truncate">{vendor.vendorName}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map(item => (
          <button
            key={item.screen}
            onClick={() => {
              onNavigate(item.screen);
              setMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-right group ${
              currentScreen === item.screen
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className={`transition-transform ${currentScreen === item.screen ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </span>
            <span className="font-semibold text-sm flex-1 text-right">{item.label}</span>
            {currentScreen === item.screen && <ChevronLeft className="w-4 h-4" />}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-alert-400 hover:bg-alert-900/20 transition-all text-right">
          <LogOut className="w-5 h-5" />
          <span className="font-semibold text-sm">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 flex-shrink-0 fixed inset-y-0 right-0 z-30">
        {sidebar}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 right-0 w-72 bg-slate-900 z-50 lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white z-10"
              >
                <X className="w-6 h-6" />
              </button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:mr-64 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between glass">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">{currentLabel}</h2>
              <p className="text-slate-400 text-xs hidden sm:block">
                {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-alert-500" />
            </button>
            <div className="flex items-center gap-2 pr-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
                {vendor.vendorName.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{vendor.vendorName}</p>
                <p className="text-xs text-slate-400">{vendor.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
