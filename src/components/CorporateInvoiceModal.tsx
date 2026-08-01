import React, { useState, useRef } from 'react';
import { X, Printer, Send, ShieldCheck, CheckCircle, FileText, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Sale } from '../types';

interface CorporateInvoiceModalProps {
  sale: Sale;
  onClose: () => void;
}

export const CorporateInvoiceModal: React.FC<CorporateInvoiceModalProps> = ({ sale, onClose }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const debt = (sale.finalInvoice || 0) - (sale.paidAmount || 0);
  const invoiceNumber = `INV-2026-${sale.id ? sale.id.slice(0, 6).toUpperCase() : '101'}`;

  // Sanitize phone number for WhatsApp link
  const getCleanPhone = (p: string) => {
    let clean = p.replace(/\D/g, '');
    if (clean.startsWith('01')) {
      clean = '2' + clean; // Egypt country code
    }
    return clean;
  };

  // Generate WhatsApp Message
  const generateWhatsAppMessage = () => {
    const text = `*مؤسسة Baroudi System للحلول والأنظمة البرمجية* 🏢
*فاتورة مبيعات معتمدة رقم:* ${invoiceNumber}
-----------------------------------
👤 *العميل:* ${sale.clientName}
🏪 *المحل/الشركة:* ${sale.shopName}
📱 *التليفون:* ${sale.phone}
📅 *التاريخ:* ${sale.date}
-----------------------------------
📦 *الباقة:* ${sale.packageName || sale.system}
💰 *المجموع قبل الخصم:* ${(sale.subtotal || 0).toLocaleString('ar-EG')} ج.م
🎁 *الخصم المقدم:* ${(sale.discount || 0).toLocaleString('ar-EG')} ج.م
إجمالي الفاتورة الصافي: ${(sale.finalInvoice || 0).toLocaleString('ar-EG')} ج.م
💵 *المبلغ المدفوع:* ${(sale.paidAmount || 0).toLocaleString('ar-EG')} ج.م
${debt > 0 ? `⚠️ *المتبقي (دين مستحق):* ${debt.toLocaleString('ar-EG')} ج.م` : '✅ *الحالة:* الفاتورة مسددة بالكامل'}
${sale.projectUrl ? `🌐 *رابط معاينة النظام الخاص بكم:* ${sale.projectUrl}` : ''}
-----------------------------------
ختم الاعتماد الرسمي: معتمد ومسدد 🎖️
نشكركم لتعاملكم مع مؤسسة Baroudi System!
للتواصل والدعم الفني: 01012345678`;

    return encodeURIComponent(text);
  };

  const whatsappUrl = `https://wa.me/${getCleanPhone(sale.phone)}?text=${generateWhatsAppMessage()}`;

  // Download REAL PDF File using html2canvas & jsPDF
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High DPI clean crisp image
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Baroudi_System_Invoice_${sale.shopName.replace(/\s+/g, '_')}_${invoiceNumber}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('حدث خطأ أثناء استخراج ملف الـ PDF، سيتم فتح نافذة الطباعة المباشرة بدلاً من ذلك.');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0D1527] border border-[#FF7A1A]/40 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] my-auto">
        
        {/* Modal Control Top Bar (Non-printable) */}
        <div className="p-3 bg-[#0B1220] border-b border-white/10 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF7A1A]/20 text-[#FF7A1A] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">فاتورة Baroudi System معتمدة</h3>
              <p className="text-[10px] text-gray-400">رقم الفاتورة: {invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct WhatsApp Share button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              title="إرسال الفاتورة عبر واتساب للعميل"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال للواتساب</span>
            </a>

            {/* Real PDF Download Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 bg-[#FF7A1A] hover:bg-[#FF7A1A]/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
              title="تحميل الفاتورة كملف PDF حقيقي"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الاستخراج...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل PDF</span>
                </>
              )}
            </button>

            {/* Browser Print Button */}
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="طباعة عبر المتصفح"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE BODY */}
        <div
          ref={invoiceRef}
          id="printable-invoice"
          className="p-5 sm:p-8 bg-white text-gray-900 overflow-y-auto space-y-6 font-['Cairo',sans-serif]"
        >
          {/* Corporate Header */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#0B1220] text-[#FF7A1A] flex items-center justify-center font-black text-lg">
                  BS
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-slate-900 tracking-tight">مؤسسة Baroudi System للأنظمة الإلكترونية</h1>
                  <p className="text-[10px] text-slate-600 font-semibold">Baroudi System Software Solutions & POS Systems</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                سجل تجاري: <span className="font-mono font-bold text-slate-700">104598</span> | بطاقة ضريبية: <span className="font-mono font-bold text-slate-700">589-321-410</span>
              </p>
            </div>

            <div className="text-center sm:text-left space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-[#FF7A1A] bg-[#FF7A1A]/10 px-2.5 py-0.5 rounded-full block w-max mx-auto sm:ml-0">
                فاتورة توريد وتركيب معتمدة
              </span>
              <p className="text-xs font-extrabold font-mono text-slate-900">{invoiceNumber}</p>
              <p className="text-[11px] text-slate-600">التاريخ: <span className="font-bold">{sale.date}</span></p>
              <p className="text-[11px] text-slate-600">التسليم: <span className="font-bold">{sale.deliveryDate}</span></p>
            </div>
          </div>

          {/* Client & Company Details Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">بيانات العميل والنشاط</span>
              <p className="font-bold text-slate-900 text-sm">{sale.shopName}</p>
              <p className="text-slate-700">المالك / المسؤول: <span className="font-semibold">{sale.clientName}</span></p>
              <p className="text-slate-700">الهاتف: <span className="font-mono font-bold">{sale.phone}</span></p>
            </div>

            <div className="space-y-1 sm:text-left">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">تصنيف الخدمة والنظام</span>
              <p className="font-bold text-[#FF7A1A]">{sale.system} • {sale.category}</p>
              <p className="text-slate-700">الباقة المطبقة: <span className="font-bold text-slate-900">{sale.packageName || 'حسب الطلب'}</span></p>
              {sale.projectUrl && (
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-emerald-700 block">رابط مشروع العميل:</span>
                  <a href={sale.projectUrl} target="_blank" rel="noreferrer" className="text-[11px] text-emerald-600 underline font-mono break-all">
                    {sale.projectUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold text-[11px]">
                  <th className="p-2.5 rounded-r-lg">البيان / تفاصيل العقد والخدمات</th>
                  <th className="p-2.5 text-center">النوع</th>
                  <th className="p-2.5 text-left rounded-l-lg">السعر (ج.م)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {/* Package Row */}
                <tr className="bg-slate-50/50 font-semibold">
                  <td className="p-2.5">
                    <span className="font-bold text-slate-900">برنامج {sale.packageName || sale.system}</span>
                    <p className="text-[10px] text-slate-500 font-normal">شامل الترخيص وتهيئة قاعدة البيانات والصلاحيات</p>
                  </td>
                  <td className="p-2.5 text-center text-slate-500">باقة برمجية</td>
                  <td className="p-2.5 text-left font-mono font-bold">{(sale.packagePrice || 0).toLocaleString('ar-EG')}</td>
                </tr>

                {/* Devices Rows */}
                {sale.devices && sale.devices.map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5">
                      <span>• {d.name}</span>
                    </td>
                    <td className="p-2.5 text-center text-slate-500">أجهزة ومعدات</td>
                    <td className="p-2.5 text-left font-mono">{(d.price || 0).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}

                {/* Visits Rows */}
                {sale.visits && sale.visits.map((v, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5">
                      <span>• {v.type}</span>
                    </td>
                    <td className="p-2.5 text-center text-slate-500">خدمات ودعم</td>
                    <td className="p-2.5 text-left font-mono">{(v.price || 0).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Official Seal Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t-2 border-slate-900 items-center">
            
            {/* OFFICIAL COMPANY STAMP (ختم الشركة المعتمد) */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-blue-800/40 bg-blue-50/30 text-blue-950 relative overflow-hidden">
              <div className="flex items-center gap-3">
                {/* SVG Vector Circular Stamp */}
                <div className="w-24 h-24 rounded-full border-4 border-blue-800 flex flex-col items-center justify-center text-center p-1 relative shadow-inner rotate-[-6deg] bg-blue-900/5">
                  <div className="w-full h-full rounded-full border border-blue-800 border-dashed flex flex-col items-center justify-center">
                    <span className="text-[7px] font-black uppercase text-blue-900 tracking-tighter">BAROUDI SYSTEM</span>
                    <span className="text-[10px] font-extrabold text-red-700 my-0.5">مؤسسة معتمدة</span>
                    <div className="flex items-center gap-0.5 text-blue-900">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span className="text-[8px] font-bold">تم السداد</span>
                    </div>
                    <span className="text-[7px] font-mono font-bold text-blue-900">2026 OFFICIAL</span>
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-xs font-black text-blue-900 block">الختم والتوقيع المعتمد</span>
                  <p className="text-[10px] text-slate-600">تم اعتماد هذه الفاتورة إلكترونياً من قسم الحسابات بمؤسسة Baroudi System.</p>
                  <p className="text-[9px] font-mono text-slate-500">التوقيع: ____________________</p>
                </div>
              </div>
            </div>

            {/* Financial Summary Box */}
            <div className="space-y-1.5 text-xs bg-slate-900 text-white p-4 rounded-xl font-medium">
              <div className="flex justify-between text-slate-300">
                <span>المجموع الكلي:</span>
                <span className="font-mono">{(sale.subtotal || 0).toLocaleString('ar-EG')} ج.م</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>الخصم الخاص:</span>
                  <span className="font-mono">-{(sale.discount || 0).toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-[#FF7A1A] font-extrabold text-sm pt-1 border-t border-slate-700">
                <span>إجمالي الفاتورة الصافي:</span>
                <span className="font-mono">{(sale.finalInvoice || 0).toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>المبلغ المدفوع:</span>
                <span className="font-mono">{(sale.paidAmount || 0).toLocaleString('ar-EG')} ج.م</span>
              </div>
              {debt > 0 ? (
                <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-slate-800">
                  <span>المتبقي (دين مستحق):</span>
                  <span className="font-mono">{debt.toLocaleString('ar-EG')} ج.م</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold pt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>الفاتورة مسددة بالكامل</span>
                </div>
              )}
            </div>

          </div>

          {/* Footer Notes */}
          <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-200">
            شروط الضمان: الضمان يشمل العيوب البرمجية والدعم الفني المجاني حسب نوع الباقة المعتمدة لدى مؤسسة Baroudi System.
          </div>

        </div>

      </div>
    </div>
  );
};

