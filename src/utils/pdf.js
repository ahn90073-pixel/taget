import { formatEGP } from './format';
function payoutLabel(method) {
    if (method === 'vodafone_cash')
        return 'فودافون كاش';
    if (method === 'instapay')
        return 'InstaPay';
    if (method === 'bank')
        return 'حساب بنكي';
    return '—';
}
export function generateVoucherPDF(vendor, voucher) {
    const html = buildVoucherHTML(vendor, voucher);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc)
        return;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.onload = () => {
        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 300);
    };
}
function buildVoucherHTML(vendor, voucher) {
    const verifyCode = voucher.receiptNumber.replace(/[^0-9]/g, '').slice(-8);
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>إيصال سداد ${voucher.receiptNumber}</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Tajawal', 'Cairo', Arial, sans-serif; }
  body { padding: 40px; background: #fff; }
  .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #059669, #047857); color: #fff; padding: 32px; text-align: center; }
  .header h1 { font-size: 24px; margin-bottom: 4px; }
  .header .receipt-num { font-size: 14px; opacity: 0.8; font-family: monospace; }
  .body { padding: 32px; }
  .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
  .row .label { color: #64748b; font-size: 14px; }
  .row .value { font-weight: 700; color: #1e293b; font-size: 14px; }
  .amount-box { background: #ecfdf5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
  .amount-box .label { color: #047857; font-size: 14px; margin-bottom: 8px; }
  .amount-box .amount { font-size: 36px; font-weight: 800; color: #059669; }
  .footer-section { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-radius: 12px; padding: 20px; margin-top: 16px; }
  .footer-section .remaining .label { color: #94a3b8; font-size: 12px; }
  .footer-section .remaining .value { font-weight: 700; color: #1e293b; font-size: 18px; }
  .qr-placeholder { width: 80px; height: 80px; border: 2px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #64748b; }
  .verify-code { text-align: center; margin-top: 16px; font-size: 12px; color: #94a3b8; }
  .verify-code strong { color: #1e293b; font-family: monospace; }
  .brand { text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8; }
</style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>إيصال سداد مالي</h1>
      <div class="receipt-num">${voucher.receiptNumber}</div>
    </div>
    <div class="body">
      <div class="row"><span class="label">اسم التاجر</span><span class="value">${vendor.vendorName}</span></div>
      <div class="row"><span class="label">المتجر</span><span class="value">${vendor.storeName}</span></div>
      <div class="row"><span class="label">تاريخ السداد</span><span class="value">${voucher.date}</span></div>
      <div class="row"><span class="label">وسيلة التحويل</span><span class="value">${payoutLabel(vendor.payoutMethod)}</span></div>
      <div class="row"><span class="label">رقم الحساب</span><span class="value">${vendor.payoutNumber || '—'}</span></div>
      <div class="amount-box">
        <div class="label">المبلغ المسدد</div>
        <div class="amount">${formatEGP(voucher.amount)}</div>
      </div>
      <div class="footer-section">
        <div class="remaining">
          <div class="label">الرصيد المتبقي بعد السداد</div>
          <div class="value">${formatEGP(voucher.remaining)}</div>
        </div>
        <div class="qr-placeholder">كود التحقق</div>
      </div>
      <div class="verify-code">رمز التحقق: <strong>${verifyCode}</strong></div>
    </div>
  </div>
  <div class="brand">منصة السوق المصري — نظام إدارة التاجر المتقدم</div>
</body>
</html>`;
}
