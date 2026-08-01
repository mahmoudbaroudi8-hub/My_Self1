import React, { useState, useRef } from 'react';
import { X, Printer, Send, ShieldCheck, CheckCircle, FileText, Download, Loader2, Store, MapPin, Phone, User, Calendar, AlertTriangle } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Client, Sale } from '../types';

interface ClientStatementModalProps {
  client: Client;
  sales: Sale[];
  onClose: () => void;
}

export const ClientStatementModal: React.FC<ClientStatementModalProps> = ({ client, sales, onClose }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const statementRef = useRef<HTMLDivElement>(null);

  // Filter sales for this client
  const clientSales = sales.filter(
    (s) => s.clientId === client.id || s.clientName === client.id || s.shopName === client.shopName || s.phone === client.phone
  );

  const totalInvoiced = clientSales.reduce((sum, s) => sum + (s.finalInvoice || 0), 0);
  const totalPaid = clientSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const netDebt = totalInvoiced - totalPaid;

  const currentDateStr = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getCleanPhone = (p: string) => {
    let clean = p.replace(/\D/g, '');
    if (clean.startsWith('01')) {
      clean = '2' + clean;
    }
    return clean;
  };

  const generateWhatsAppMessage = () => {
    const text = `*مؤسسة Baroudi System للحلول والأنظمة البرمجية* 🏢
*كشف حساب مالي تفصيلي معتمد*
-----------------------------------
🏪 *المحل/الشركة:* ${client.shopName}
👤 *المالك:* ${client.name}
📱 *الهاتف:* ${client.phone}
📅 *تاريخ كشف الحساب:* ${currentDateStr}
-----------------------------------
💰 *إجمالي التعاملات والخدمات:* ${totalInvoiced.toLocaleString('ar-EG')} ج.م
💵 *إجمالي المبالغ المسددة:* ${totalPaid.toLocaleString('ar-EG')} ج.م
${netDebt > 0 ? `⚠️ *إجمالي الدين المستحق الحالي:* ${netDebt.toLocaleString('ar-EG')} ج.م` : '✅ *الحالة:* جميع التعاملات مسددة بالكامل (لا توجد ديون)'}
-----------------------------------
ختم الحسابات الرسمي: معتمد 🎖️
مؤسسة Baroudi System - خدمة العملاء والدعم الفني: 01012345678`;

    return encodeURIComponent(text);
  };

  const whatsappUrl = `https://wa.me/${getCleanPhone(client.phone)}?text=${generateWhatsAppMessage()}`;

  // Download REAL PDF File
  const handleDownloadPDF = async () => {
    if (!statementRef.current) return;
    setIsGeneratingPdf(true);

    try {
      const element = statementRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
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

      const imgWidth = 210;
      const pageHeight = 297;
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

      const fileName = `Baroudi_System_كشف_حساب_${client.shopName.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating statement PDF:', err);
      alert('حدث خطأ أثناء استخراج ملف الـ PDF لكشف الحساب، سيتم فتح نافذة الطباعة المباشرة بدلاً من ذلك.');
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0D1527] border border-[#FF7A1A]/40 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] my-auto">
        
        {/* Top Control Header */}
        <div className="p-3 bg-[#0B1220] border-b border-white/10 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF7A1A]/20 text-[#FF7A1A] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">كشف حساب عميل معتمد - Baroudi System</h3>
              <p className="text-[10px] text-gray-400">العميل: {client.shopName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              title="إرسال كشف الحساب عبر واتساب"
            >
              <Send className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </a>

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 bg-[#FF7A1A] hover:bg-[#FF7A1A]/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50"
              title="تحميل كشف الحساب كملف PDF حقيقي"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري الاستخراج...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل كشف حساب PDF</span>
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
              title="طباعة عبر المتصفح"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE STATEMENT BODY */}
        <div
          ref={statementRef}
          id="printable-statement"
          className="p-6 sm:p-8 bg-white text-gray-900 overflow-y-auto space-y-6 font-['Cairo',sans-serif]"
        >
          {/* Header Bar */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#0B1220] text-[#FF7A1A] flex items-center justify-center font-black text-xl">
                  BS
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">مؤسسة Baroudi System للأنظمة الإلكترونية</h1>
                  <p className="text-[11px] text-slate-600 font-semibold">Baroudi System Software Solutions & POS Systems</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                سجل تجاري: <span className="font-mono font-bold text-slate-700">104598</span> | بطاقة ضريبية: <span className="font-mono font-bold text-slate-700">589-321-410</span>
              </p>
            </div>

            <div className="text-center sm:text-left space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-blue-900 bg-blue-100 px-3 py-1 rounded-full block w-max mx-auto sm:ml-0">
                كشف حساب مالي تفصيلي
              </span>
              <p className="text-[11px] text-slate-600 mt-1">تاريخ الإصدار: <span className="font-bold">{currentDateStr}</span></p>
              <p className="text-[11px] text-slate-600">عدد الفواتير والعمليات: <span className="font-mono font-bold">{clientSales.length}</span></p>
            </div>
          </div>

          {/* Client Profile Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">بيانات العميل الحسابية</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">المحل / النشاط التجاري:</span>
                <span className="font-extrabold text-slate-900 text-sm">{client.shopName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">المالك / المسؤول:</span>
                <span className="font-bold text-slate-800">{client.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">رقم الهاتف / الموبايل:</span>
                <span className="font-mono font-bold text-slate-800">{client.phone}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">قطاع العمل والمجال:</span>
                <span className="font-semibold text-[#FF7A1A]">{client.system} ({client.category})</span>
              </div>
              {client.address && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block text-[10px]">العنوان والفرع:</span>
                  <span className="font-medium text-slate-700">{client.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ledger Transactions Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-extrabold text-slate-900">سجل المعاملات والفواتير الصادرة</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px]">
                    <th className="p-2.5">التاريخ</th>
                    <th className="p-2.5">رقم الفاتورة</th>
                    <th className="p-2.5">الباقة / البيان</th>
                    <th className="p-2.5 text-center">إجمالي الفاتورة</th>
                    <th className="p-2.5 text-center">المدفوع</th>
                    <th className="p-2.5 text-center">المتبقي (الدين)</th>
                    <th className="p-2.5 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {clientSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-slate-400">
                        لا توجد فواتير أو معاملات مسجلة لهذا العميل حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    clientSales.map((sale) => {
                      const debt = (sale.finalInvoice || 0) - (sale.paidAmount || 0);
                      const invNo = `INV-2026-${sale.id ? sale.id.slice(0, 6).toUpperCase() : '101'}`;
                      return (
                        <tr key={sale.id} className="hover:bg-slate-50 font-medium">
                          <td className="p-2.5 text-[11px] font-mono">{sale.date}</td>
                          <td className="p-2.5 text-[11px] font-mono font-bold text-slate-900">{invNo}</td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900">{sale.packageName || sale.system}</span>
                            <span className="text-[10px] text-slate-500 block">{sale.category}</span>
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-900">
                            {(sale.finalInvoice || 0).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                            {(sale.paidAmount || 0).toLocaleString('ar-EG')} ج.م
                          </td>
                          <td className={`p-2.5 text-center font-mono font-bold ${debt > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {debt > 0 ? `${debt.toLocaleString('ar-EG')} ج.م` : '0 ج.م'}
                          </td>
                          <td className="p-2.5 text-center">
                            {debt <= 0 ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                مسدد بالكامل
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                آجل (متبقي)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statement Financial Totals & Stamp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t-2 border-slate-900 items-center">
            
            {/* OFFICIAL STAMP */}
            <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 border-dashed border-blue-800/40 bg-blue-50/30 text-blue-950 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-24 h-24 rounded-full border-4 border-blue-800 flex flex-col items-center justify-center text-center p-1 relative shadow-inner rotate-[-6deg] bg-blue-900/5">
                  <div className="w-full h-full rounded-full border border-blue-800 border-dashed flex flex-col items-center justify-center">
                    <span className="text-[7px] font-black uppercase text-blue-900 tracking-tighter">BAROUDI SYSTEM</span>
                    <span className="text-[9px] font-extrabold text-red-700 my-0.5">قسم الحسابات</span>
                    <div className="flex items-center gap-0.5 text-blue-900">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span className="text-[8px] font-bold">كشف معتمد</span>
                    </div>
                    <span className="text-[7px] font-mono font-bold text-blue-900">2026 OFFICIAL</span>
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-xs font-black text-blue-900 block">اعتماد قسم الحسابات</span>
                  <p className="text-[10px] text-slate-600">تم مراجعة كافة التعاملات المالية واستخراج هذا الكشف رسمياً من مؤسسة Baroudi System.</p>
                  <p className="text-[9px] font-mono text-slate-500">التوقيع: ____________________</p>
                </div>
              </div>
            </div>

            {/* Overall Statement Summary */}
            <div className="space-y-2 text-xs bg-slate-900 text-white p-4 rounded-xl font-medium">
              <div className="flex justify-between text-slate-300">
                <span>إجمالي التعاملات والخدمات:</span>
                <span className="font-mono font-bold">{totalInvoiced.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>إجمالي المدفوعات المسددة:</span>
                <span className="font-mono">{totalPaid.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between text-[#FF7A1A] font-extrabold text-sm pt-1.5 border-t border-slate-700">
                <span>صافي رصيد الدين المستحق:</span>
                <span className={`font-mono ${netDebt > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {netDebt.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
              {netDebt <= 0 && (
                <div className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold pt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>لا توجد ديون - حساب العميل متزن ومسدد</span>
                </div>
              )}
            </div>

          </div>

          {/* Footer Note */}
          <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-200">
            ملاحظة: هذا الكشف يعتبر وثيقة مالية رسمية صادرة من مؤسسة Baroudi System برقم سجل تجاري 104598.
          </div>

        </div>

      </div>
    </div>
  );
};
