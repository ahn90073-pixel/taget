import { useState } from 'react';
import { CheckCircle2, CloudCog, CloudDownload, Info, RefreshCw, WifiOff, XCircle } from 'lucide-react';

const statusConfig = {
  checking: {
    icon: CloudCog,
    title: 'فحص التحديث الهوائي',
    tone: 'brand',
    defaultMessage: 'جاري البحث عن آخر تحديث...',
  },
  downloading: {
    icon: CloudDownload,
    title: 'تحديث هوائي متاح',
    tone: 'brand',
    defaultMessage: 'جاري تحميل الواجهة الجديدة...',
  },
  current: {
    icon: CheckCircle2,
    title: 'التطبيق محدّث',
    tone: 'success',
    defaultMessage: 'أنت تستخدم أحدث إصدار من الواجهة',
  },
  updated: {
    icon: CheckCircle2,
    title: 'تم التحديث بنجاح',
    tone: 'success',
    defaultMessage: 'سيتم تشغيل النسخة الجديدة الآن',
  },
  error: {
    icon: XCircle,
    title: 'تعذّر فحص التحديث',
    tone: 'danger',
    defaultMessage: 'تحقق من اتصال الإنترنت وحاول مرة أخرى',
  },
  web: {
    icon: Info,
    title: 'التحديث الهوائي للهاتف',
    tone: 'neutral',
    defaultMessage: 'هذه الميزة تعمل داخل تطبيق الهاتف',
  },
};

const toneClasses = {
  brand: 'border-brand-200 bg-gradient-to-l from-brand-50 to-white text-brand-900',
  success: 'border-financial-200 bg-gradient-to-l from-financial-50 to-white text-financial-900',
  danger: 'border-alert-200 bg-gradient-to-l from-alert-50 to-white text-alert-900',
  neutral: 'border-slate-200 bg-gradient-to-l from-slate-50 to-white text-slate-800',
};

const iconClasses = {
  brand: 'bg-brand-100 text-brand-600',
  success: 'bg-financial-100 text-financial-600',
  danger: 'bg-alert-100 text-alert-600',
  neutral: 'bg-slate-100 text-slate-600',
};

export default function OtaStatusCard({ status, onRefresh, refreshing, compact = false }) {
  const [collapsed, setCollapsed] = useState(compact);
  const config = statusConfig[status?.status] || statusConfig.checking;
  const Icon = config.icon;
  const progress = Math.max(0, Math.min(100, status?.progress || 0));
  const isBusy = refreshing || status?.status === 'checking' || status?.status === 'downloading';

  return (
    <section className={`${compact ? 'mb-0' : 'mb-6'} overflow-hidden rounded-2xl border shadow-sm ${toneClasses[config.tone]}`} dir="rtl">
      <button
        type="button"
        onClick={() => setCollapsed(value => !value)}
        className="flex w-full items-center gap-3 p-4 text-right"
        aria-expanded={!collapsed}
      >
        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${iconClasses[config.tone]}`}>
          <Icon className={`h-6 w-6 ${isBusy ? 'animate-spin' : ''}`} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <strong className="text-sm font-bold">{config.title}</strong>
            {status?.status === 'downloading' && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">OTA</span>
            )}
          </span>
          <span className="mt-1 block truncate text-xs opacity-70">{status?.message || config.defaultMessage}</span>
        </span>
        <span className="text-xs font-bold opacity-60">{collapsed ? 'عرض' : 'إخفاء'}</span>
      </button>

      {!collapsed && (
        <div className="border-t border-current/10 px-4 pb-4">
          {status?.status === 'downloading' && (
            <div className="mb-3 pt-3">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold opacity-70">
                <span>نسبة التحميل</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-brand-500 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 pt-3">
            <span className="text-[11px] opacity-60">يتم تحديث الواجهة دون تغيير إصدار التطبيق</span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isBusy}
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-bold shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy ? <WifiOff className="h-4 w-4 animate-pulse" /> : <RefreshCw className="h-4 w-4" />}
              إعادة الفحص
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
