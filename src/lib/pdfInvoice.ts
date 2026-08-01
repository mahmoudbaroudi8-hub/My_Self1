import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Sale } from '../types';

export async function generateInvoicePdf(sale: Partial<Sale>): Promise<File> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '794px';
  container.style.backgroundColor = '#0B1220';
  container.style.color = '#FFFFFF';
  container.style.fontFamily = 'Cairo, sans-serif';
  container.style.direction = 'rtl';
  container.style.padding = '32px';
  container.style.boxSizing = 'border-box';

  const subtotal = (sale.packagePrice || 0) + (sale.devicesTotal || 0) + (sale.visitsTotal || 0);
  const finalInvoice = sale.finalInvoice || (subtotal - (sale.discount || 0));
  const paidAmount = sale.paidAmount !== undefined ? sale.paidAmount : finalInvoice;
  const remaining = finalInvoice - paidAmount;

  const activeDevices = (sale.devices || []).filter((d) => d.enabled);
  const activeVisits = (sale.visits || []).filter((v) => v.enabled);

  container.innerHTML = `
    <div style="border: 2px solid #FF7A1A; border-radius: 16px; padding: 24px; background: linear-gradient(to bottom, #121C30, #0B1220);">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(255,122,26,0.3); padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <h1 style="margin: 0; color: #FF7A1A; font-size: 24px; font-weight: 800;">Business Manager</h1>
          <p style="margin: 4px 0 0 0; color: #9CA3AF; font-size: 12px;">إدارة وحلول البرمجيات والمبيعات</p>
        </div>
        <div style="text-align: left;">
          <span style="background: rgba(255,122,26,0.2); color: #FF7A1A; border: 1px solid #FF7A1A; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold;">
            فاتورة مبيعات
          </span>
          <p style="margin: 6px 0 0 0; color: #9CA3AF; font-size: 11px;">التاريخ: ${sale.date || new Date().toISOString().split('T')[0]}</p>
        </div>
      </div>

      <!-- Client Info Box -->
      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
        <div>
          <span style="color: #9CA3AF; display: block; font-size: 11px;">العميل / المحل:</span>
          <strong style="color: #FFFFFF; font-size: 15px;">${sale.shopName || sale.clientName || 'عميل'}</strong>
          ${sale.clientName && sale.shopName ? `<span style="color: #D1D5DB; font-size: 12px; display: block;">(${sale.clientName})</span>` : ''}
        </div>
        <div>
          <span style="color: #9CA3AF; display: block; font-size: 11px;">رقم الهاتف:</span>
          <strong style="color: #FF7A1A;">${sale.phone || 'غير مدخل'}</strong>
        </div>
        <div>
          <span style="color: #9CA3AF; display: block; font-size: 11px;">القطاع / النشاط:</span>
          <span style="color: #E5E7EB;">${sale.system || '-'} • ${sale.category || '-'}</span>
        </div>
        <div>
          <span style="color: #9CA3AF; display: block; font-size: 11px;">تاريخ التسليم:</span>
          <span style="color: #E5E7EB;">${sale.deliveryDate || '-'}</span>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
        <thead>
          <tr style="background: rgba(255,122,26,0.15); color: #FF7A1A; text-align: right;">
            <th style="padding: 10px; border-radius: 0 8px 8px 0;">البند / البيان</th>
            <th style="padding: 10px;">النوع</th>
            <th style="padding: 10px; text-align: left; border-radius: 8px 0 0 8px;">السعر (ج.م)</th>
          </tr>
        </thead>
        <tbody>
          ${sale.packageName ? `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
              <td style="padding: 10px; font-weight: bold; color: #FFFFFF;">${sale.packageName}</td>
              <td style="padding: 10px; color: #9CA3AF;">باقة / اشتراك النظام</td>
              <td style="padding: 10px; text-align: left; font-weight: bold; color: #FFFFFF;">${(sale.packagePrice || 0).toLocaleString('ar-EG')} ج.م</td>
            </tr>
          ` : ''}

          ${activeDevices.map(d => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
              <td style="padding: 10px; color: #E5E7EB;">${d.name}</td>
              <td style="padding: 10px; color: #9CA3AF;">أجهزة ملحقة</td>
              <td style="padding: 10px; text-align: left; color: #E5E7EB;">${d.price.toLocaleString('ar-EG')} ج.م</td>
            </tr>
          `).join('')}

          ${activeVisits.map(v => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
              <td style="padding: 10px; color: #E5E7EB;">${v.type}</td>
              <td style="padding: 10px; color: #9CA3AF;">زيارات وتدريب</td>
              <td style="padding: 10px; text-align: left; color: #E5E7EB;">${v.price.toLocaleString('ar-EG')} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals Box -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <div style="width: 280px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #D1D5DB;">
            <span>المجموع قبل الخصم:</span>
            <span>${subtotal.toLocaleString('ar-EG')} ج.م</span>
          </div>
          ${(sale.discount || 0) > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #F87171;">
              <span>الخصم المسموح:</span>
              <span>- ${(sale.discount || 0).toLocaleString('ar-EG')} ج.م</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px; margin-top: 6px; font-size: 15px; font-weight: bold; color: #FF7A1A;">
            <span>إجمالي الفاتورة:</span>
            <span>${finalInvoice.toLocaleString('ar-EG')} ج.م</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 6px; color: #34D399; font-size: 12px;">
            <span>المدفوع:</span>
            <span>${paidAmount.toLocaleString('ar-EG')} ج.م</span>
          </div>
          ${remaining > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-top: 6px; color: #FBBF24; font-size: 12px; font-weight: bold;">
              <span>المتبقي (دين):</span>
              <span>${remaining.toLocaleString('ar-EG')} ج.م</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Footer -->
      <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; text-align: center; color: #9CA3AF; font-size: 11px;">
        شكراً لتعاملكم معنا • Business Manager • نعتز بخدمتكم دائماً
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0B1220',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const blob = pdf.output('blob');
    const filename = `Invoice_${(sale.shopName || sale.clientName || 'client').replace(/\s+/g, '_')}_${sale.date || 'date'}.pdf`;

    return new File([blob], filename, { type: 'application/pdf' });
  } finally {
    document.body.removeChild(container);
  }
}

export async function shareInvoicePdf(sale: Partial<Sale>): Promise<void> {
  const pdfFile = await generateInvoicePdf(sale);

  const cleanPhone = (sale.phone || '').replace(/[^0-9]/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
  const clientTitle = sale.shopName || sale.clientName || 'العميل';

  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [pdfFile] })
  ) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: `فاتورة مبيعات - ${clientTitle}`,
        text: `مرفق فاتورة المبيعات الخاصة بـ ${clientTitle} - Business Manager`,
      });
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('Navigator share failed, executing fallback:', err);
    }
  }

  // Fallback: Trigger direct PDF download and open WhatsApp link
  const url = URL.createObjectURL(pdfFile);
  const a = document.createElement('a');
  a.href = url;
  a.download = pdfFile.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);

  const msg = `مرحباً ${clientTitle}، مرفق فاتورة المبيعات الخاصة بك من Business Manager (تم تحضير وتحميل ملف الـ PDF على جهازك).`;
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  window.open(waUrl, '_blank');
}
