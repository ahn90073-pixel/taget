import { RefreshCw } from 'lucide-react';

const statusColors = {
  checking: 'bg-brand-500',
  downloading: 'bg-brand-500',
  updated: 'bg-financial-500',
  current: 'bg-financial-500',
  error: 'bg-alert-500',
  'native-required': 'bg-alert-500',
  web: 'bg-slate-400',
};

export default function OtaUpdateButton({ status, onRefresh, refreshing }) {
  const state = status?.status || 'checking';
  const message = status?.message || 'تحقق من وجود تحديثات';

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={refreshing || state === 'downloading'}
      title={`${message} — اضغط للتحقق الآن`}
      aria-label="تحقق من التحديثات الآن"
      className="fixed right-4 top-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white hover:text-brand-600 disabled:cursor-wait disabled:opacity-70"
    >
      <RefreshCw className={`h-5 w-5 ${refreshing || state === 'downloading' ? 'animate-spin text-brand-600' : ''}`} />
      <span className={`absolute -left-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${statusColors[state] || statusColors.checking}`} />
    </button>
  );
}
