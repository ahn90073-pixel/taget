import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, FileText, MapPin, Wallet, Upload, CheckCircle2, CreditCard, Building, Home, Lock, ShieldCheck, Loader2, IdCard, FileCheck, FileSignature, FastForward, AlertCircle } from 'lucide-react';
import { egyptGovernorates } from '@/data/mockData';
export default function CompleteProfileScreen({ vendorData, onComplete }) {
    const [commercialRegister, setCommercialRegister] = useState('');
    const [taxId, setTaxId] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [city, setCity] = useState('');
    const [street, setStreet] = useState('');
    const [payoutMethod, setPayoutMethod] = useState('');
    const [payoutNumber, setPayoutNumber] = useState('');
    const [uploadedDocs, setUploadedDocs] = useState({
        nationalId: false,
        commercialRegister: false,
        propertyContract: false,
    });
    const [submitting, setSubmitting] = useState(false);
    const checks = [
        { key: 'cr', done: !!commercialRegister && commercialRegister.length >= 5 },
        { key: 'tax', done: !!taxId && taxId.length >= 5 },
        { key: 'addr', done: !!governorate && !!city && !!street },
        { key: 'id', done: uploadedDocs.nationalId },
        { key: 'crDoc', done: uploadedDocs.commercialRegister },
        { key: 'propDoc', done: uploadedDocs.propertyContract },
        { key: 'payout', done: !!payoutMethod && !!payoutNumber },
    ];
    const progress = Math.round((checks.filter(c => c.done).length / checks.length) * 100);
    const isComplete = progress === 100;
    const handleDocUpload = (key) => {
        setUploadedDocs(prev => ({ ...prev, [key]: true }));
    };
    const handleSubmit = () => {
        if (!isComplete)
            return;
        setSubmitting(true);
        setTimeout(() => {
            onComplete({
                vendorName: vendorData.vendorName || '',
                email: vendorData.email || '',
                phone: vendorData.phone || '',
                storeName: vendorData.storeName || '',
                storeNameEn: '',
                status: 'verified',
                commercialRegister,
                taxId,
                warehouseAddress: { governorate, city, street },
                payoutMethod,
                payoutNumber,
                uploadedDocs,
            });
        }, 1800);
    };
    const handleSkipForDev = () => {
        onComplete({
            vendorName: vendorData.vendorName || 'تاجر تجريبي',
            email: vendorData.email || 'dev@store.test',
            phone: vendorData.phone || '+20 100 000 0000',
            storeName: vendorData.storeName || 'متجر تجريبي',
            storeNameEn: '',
            status: 'verified',
            commercialRegister: commercialRegister || 'DEV-00000',
            taxId: taxId || 'DEV-TAX-000',
            warehouseAddress: {
                governorate: governorate || 'القاهرة',
                city: city || 'مدينة نصر',
                street: street || 'عنوان تجريبي — وضع التطوير',
            },
            payoutMethod: payoutMethod || 'vodafone_cash',
            payoutNumber: payoutNumber || '01000000000',
            uploadedDocs: {
                nationalId: true,
                commercialRegister: true,
                propertyContract: true,
            },
        });
    };
    return (_jsx("div", { className: "min-h-screen bg-slate-50 py-8 px-4", children: _jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsxs("div", { className: "inline-flex items-center gap-2 bg-brand-50 text-brand-700 px-4 py-2 rounded-full text-sm font-semibold mb-4", children: [_jsx(ShieldCheck, { className: "w-4 h-4" }), "\u062E\u0637\u0648\u0629 \u0625\u0644\u0632\u0627\u0645\u064A\u0629 \u2014 \u0627\u0644\u062A\u062D\u0642\u0642 \u0627\u0644\u062A\u062C\u0627\u0631\u064A (KYC)"] }), _jsx("h1", { className: "text-3xl font-bold text-slate-900 font-display mb-2", children: "\u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u062A\u062C\u0627\u0631\u064A" }), _jsx("p", { className: "text-slate-500", children: "\u064A\u062C\u0628 \u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u062C\u0645\u064A\u0639 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0644\u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628\u0643 \u0648\u0627\u0644\u0628\u062F\u0621 \u0641\u064A \u0627\u0644\u0628\u064A\u0639" })] }), _jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: `rounded-2xl p-5 mb-6 flex items-start gap-4 border-2 transition-all ${isComplete
                        ? 'bg-financial-50 border-financial-200'
                        : 'bg-alert-50 border-alert-200'}`, children: [_jsx("div", { className: `flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${isComplete ? 'bg-financial-100' : 'bg-alert-100'}`, children: isComplete ? _jsx(CheckCircle2, { className: "w-6 h-6 text-financial-600" }) : _jsx(AlertTriangle, { className: "w-6 h-6 text-alert-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: `font-bold mb-1 ${isComplete ? 'text-financial-800' : 'text-alert-800'}`, children: isComplete ? 'اكتمل الملف التجاري!' : 'حسابك قيد المراجعة أو غير مكتمل البيانات' }), _jsx("p", { className: `text-sm ${isComplete ? 'text-financial-700' : 'text-alert-700'}`, children: isComplete
                                        ? 'يمكنك الآن تفعيل حسابك والبدء في إضافة المنتجات واستلام الأرباح.'
                                        : 'لا يمكنك إضافة منتجات جديدة أو سحب أرباح حتى استكمال البيانات الوثائقية الرسمية.' })] })] }), _jsxs("div", { className: "bg-white rounded-2xl p-6 mb-6 shadow-sm border border-slate-100", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("span", { className: "text-sm font-semibold text-slate-700", children: "\u0646\u0633\u0628\u0629 \u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0627\u0644\u0645\u0644\u0641" }), _jsxs(motion.span, { initial: { scale: 1.2 }, animate: { scale: 1 }, className: `text-2xl font-bold font-display ${isComplete ? 'text-financial-600' : 'text-brand-600'}`, children: [progress, "%"] }, progress)] }), _jsx("div", { className: "h-3 bg-slate-100 rounded-full overflow-hidden", children: _jsx(motion.div, { className: `h-full rounded-full transition-all ${isComplete
                                    ? 'bg-gradient-to-l from-financial-400 to-financial-600'
                                    : 'bg-gradient-to-l from-brand-400 to-brand-600'}`, animate: { width: `${progress}%` }, transition: { duration: 0.5, ease: 'easeOut' } }) }), _jsx("div", { className: "flex gap-1.5 mt-3", children: checks.map((c, i) => (_jsx("div", { className: `flex-1 h-1.5 rounded-full transition-all ${c.done ? 'bg-financial-400' : 'bg-slate-100'}` }, i))) })] }), _jsx(Section, { title: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062A\u062C\u0627\u0631\u064A \u0648\u0627\u0644\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0636\u0631\u064A\u0628\u064A\u0629", icon: _jsx(Building, { className: "w-5 h-5" }), children: _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx(TextInput, { label: "\u0631\u0642\u0645 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062A\u062C\u0627\u0631\u064A", placeholder: "\u0645\u062B\u0627\u0644: \u0668\u0667\u0665\u0664\u0663", value: commercialRegister, onChange: setCommercialRegister, icon: _jsx(FileText, { className: "w-5 h-5" }), done: !!commercialRegister && commercialRegister.length >= 5 }), _jsx(TextInput, { label: "\u0631\u0642\u0645 \u0627\u0644\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0636\u0631\u064A\u0628\u064A\u0629 (Tax ID)", placeholder: "\u0645\u062B\u0627\u0644: \u0661\u0660\u0660-\u0662\u0660\u0660-\u0663\u0660\u0660", value: taxId, onChange: setTaxId, icon: _jsx(CreditCard, { className: "w-5 h-5" }), done: !!taxId && taxId.length >= 5 })] }) }), _jsxs(Section, { title: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639 \u0627\u0644\u0631\u0626\u064A\u0633\u064A", icon: _jsx(MapPin, { className: "w-5 h-5" }), children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-slate-700 mb-1.5", children: "\u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629" }), _jsxs("select", { value: governorate, onChange: (e) => setGovernorate(e.target.value), className: `w-full px-4 py-3 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${governorate ? 'border-financial-300' : 'border-slate-200'}`, children: [_jsx("option", { value: "", children: "\u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u062D\u0627\u0641\u0638\u0629" }), egyptGovernorates.map(g => _jsx("option", { value: g, children: g }, g))] })] }), _jsx(TextInput, { label: "\u0627\u0644\u0645\u062F\u064A\u0646\u0629", placeholder: "\u0645\u062B\u0627\u0644: \u0645\u062F\u064A\u0646\u0629 \u0646\u0635\u0631", value: city, onChange: setCity, icon: _jsx(MapPin, { className: "w-5 h-5" }), done: !!city })] }), _jsx("div", { className: "mt-4", children: _jsx(TextInput, { label: "\u0627\u0644\u0634\u0627\u0631\u0639 / \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062A\u0641\u0635\u064A\u0644\u064A", placeholder: "\u0645\u062B\u0627\u0644: \u0634\u0627\u0631\u0639 \u0639\u0628\u0627\u0633 \u0627\u0644\u0639\u0642\u0627\u062F\u060C \u0628\u062C\u0648\u0627\u0631 \u0645\u0633\u062C\u062F \u0627\u0644\u0631\u062D\u0645\u0629", value: street, onChange: setStreet, icon: _jsx(Home, { className: "w-5 h-5" }), done: !!street }) })] }), _jsx(Section, { title: "\u0631\u0641\u0639 \u0627\u0644\u0635\u0648\u0631 \u0648\u0627\u0644\u0648\u062B\u0627\u0626\u0642", icon: _jsx(Upload, { className: "w-5 h-5" }), children: _jsxs("div", { className: "space-y-4", children: [_jsx(UploadZone, { label: "\u0635\u0648\u0631\u0629 \u0627\u0644\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 (\u0648\u062C\u0647 \u0623\u0645\u0627\u0645\u064A)", icon: _jsx(IdCard, { className: "w-8 h-8" }), uploaded: uploadedDocs.nationalId, onUpload: () => handleDocUpload('nationalId') }), _jsx(UploadZone, { label: "\u0635\u0648\u0631\u0629 \u0627\u0644\u0633\u062C\u0644 \u0627\u0644\u062A\u062C\u0627\u0631\u064A", icon: _jsx(FileCheck, { className: "w-8 h-8" }), uploaded: uploadedDocs.commercialRegister, onUpload: () => handleDocUpload('commercialRegister') }), _jsx(UploadZone, { label: "\u0635\u0648\u0631\u0629 \u0628\u0648\u0644\u064A\u0635\u0629 / \u0639\u0642\u062F \u0627\u0644\u0645\u0645\u062A\u0644\u0643\u0627\u062A", icon: _jsx(FileSignature, { className: "w-8 h-8" }), uploaded: uploadedDocs.propertyContract, onUpload: () => handleDocUpload('propertyContract') })] }) }), _jsxs(Section, { title: "\u0648\u0633\u064A\u0644\u0629 \u0627\u0644\u062A\u062D\u0648\u064A\u0644 \u0627\u0644\u0645\u0627\u0644\u064A \u0627\u0644\u0645\u0641\u0636\u0644\u0629", icon: _jsx(Wallet, { className: "w-5 h-5" }), children: [_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4", children: [
                                { key: 'vodafone_cash', label: 'فودافون كاش', color: 'bg-red-500' },
                                { key: 'instapay', label: 'InstaPay', color: 'bg-purple-500' },
                                { key: 'bank', label: 'حساب بنكي', color: 'bg-brand-600' },
                            ].map(opt => (_jsxs("button", { onClick: () => setPayoutMethod(opt.key), className: `p-4 rounded-xl border-2 transition-all text-right ${payoutMethod === opt.key
                                    ? 'border-brand-500 bg-brand-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300'}`, children: [_jsx("div", { className: `w-3 h-3 rounded-full ${opt.color} mb-2` }), _jsx("span", { className: "font-semibold text-slate-800 text-sm", children: opt.label })] }, opt.key))) }), _jsx(TextInput, { label: payoutMethod === 'bank' ? 'رقم الـ IBAN' : 'رقم المحفظة / الحساب', placeholder: payoutMethod === 'bank' ? 'EGXX XXXX XXXX XXXX XXXX XX' : 'مثال: 01012345678', value: payoutNumber, onChange: setPayoutNumber, icon: _jsx(Wallet, { className: "w-5 h-5" }), done: !!payoutMethod && !!payoutNumber })] }), _jsxs("div", { className: "mt-8", children: [_jsx(motion.button, { onClick: handleSubmit, disabled: !isComplete || submitting, className: `w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${isComplete && !submitting
                                ? 'bg-financial-600 hover:bg-financial-700 text-white shadow-lg shadow-financial-200'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`, whileTap: isComplete ? { scale: 0.98 } : {}, children: submitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-5 h-5 animate-spin" }), "\u062C\u0627\u0631\u064A \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628..."] })) : isComplete ? (_jsxs(_Fragment, { children: [_jsx(ShieldCheck, { className: "w-5 h-5" }), "\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628 \u0648\u0627\u0644\u0628\u062F\u0621 \u0641\u064A \u0627\u0644\u0628\u064A\u0639"] })) : (_jsxs(_Fragment, { children: [_jsx(Lock, { className: "w-5 h-5" }), "\u0623\u0643\u0645\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628 (", progress, "%)"] })) }), !isComplete && (_jsx("p", { className: "text-center text-slate-400 text-sm mt-3", children: "\u064A\u062C\u0628 \u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u062C\u0645\u064A\u0639 \u0627\u0644\u062D\u0642\u0648\u0644 \u0648\u0631\u0641\u0639 \u062C\u0645\u064A\u0639 \u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0644\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628" }))] }), _jsxs("div", { className: "mt-4 border-t border-dashed border-slate-200 pt-4", children: [_jsxs("div", { className: "flex items-start gap-2 mb-3", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-slate-400 text-xs leading-relaxed", children: "\u0648\u0636\u0639 \u0627\u0644\u062A\u0637\u0648\u064A\u0631: \u064A\u0645\u0643\u0646\u0643 \u062A\u062E\u0637\u064A \u0627\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0625\u0644\u0632\u0627\u0645\u064A\u0629 \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0644\u062A\u062C\u0631\u0628\u0629. \u0633\u064A\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628 \u0628\u0628\u064A\u0627\u0646\u0627\u062A \u062A\u062C\u0631\u064A\u0628\u064A\u0629." })] }), _jsxs("button", { onClick: handleSkipForDev, className: "w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-semibold text-sm hover:border-brand-400 hover:text-brand-600 transition-all flex items-center justify-center gap-2", children: [_jsx(FastForward, { className: "w-4 h-4" }), "\u062A\u062E\u0637\u064A \u0644\u0644\u062A\u0637\u0648\u064A\u0631 (Dev Bypass)"] })] })] }) }));
}
function Section({ title, icon, children }) {
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "bg-white rounded-2xl p-6 mb-6 shadow-sm border border-slate-100", children: [_jsxs("div", { className: "flex items-center gap-3 mb-5", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center", children: icon }), _jsx("h2", { className: "text-lg font-bold text-slate-900 font-display", children: title })] }), children] }));
}
function TextInput({ label, placeholder, value, onChange, icon, done, type = 'text' }) {
    return (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-slate-700 mb-1.5", children: label }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: `absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${done ? 'text-financial-500' : 'text-slate-400'}`, children: done ? _jsx(CheckCircle2, { className: "w-5 h-5" }) : icon }), _jsx("input", { type: type, value: value, onChange: (e) => onChange(e.target.value), placeholder: placeholder, className: `w-full pr-11 pl-4 py-3 rounded-xl border bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${done
                            ? 'border-financial-300 focus:ring-financial-500'
                            : 'border-slate-200 focus:ring-brand-500'}` })] })] }));
}
function UploadZone({ label, icon, uploaded, onUpload }) {
    const [hovering, setHovering] = useState(false);
    return (_jsxs("div", { onClick: onUpload, onDragOver: (e) => { e.preventDefault(); setHovering(true); }, onDragLeave: () => setHovering(false), onDrop: (e) => { e.preventDefault(); setHovering(false); onUpload(); }, className: `relative rounded-xl border-2 border-dashed p-6 flex items-center gap-4 cursor-pointer transition-all ${uploaded
            ? 'border-financial-300 bg-financial-50'
            : hovering
                ? 'border-brand-400 bg-brand-50'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`, children: [_jsx("div", { className: `flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${uploaded ? 'bg-financial-100 text-financial-600' : 'bg-slate-100 text-slate-400'}`, children: uploaded ? _jsx(CheckCircle2, { className: "w-8 h-8" }) : icon }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: `font-semibold ${uploaded ? 'text-financial-800' : 'text-slate-700'}`, children: label }), _jsx("p", { className: `text-sm ${uploaded ? 'text-financial-600' : 'text-slate-400'}`, children: uploaded ? 'تم رفع الملف بنجاح' : 'اضغط أو اسحب الملف هنا (JPG, PNG, PDF)' })] }), !uploaded && (_jsx("div", { className: "flex-shrink-0 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-500 text-sm font-medium", children: "\u062A\u0635\u0641\u062D" }))] }));
}
