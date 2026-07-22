import * as XLSX from 'xlsx';
import { Sale, Client, Expense, Package, Offer } from '../types';

/**
 * Helper to trigger browser download of XLSX file
 */
function downloadWorkbook(workbook: XLSX.WorkBook, fileName: string) {
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export Sales log to a formatted Excel file
 */
export function exportSalesToExcel(sales: Sale[]) {
  const data = sales.map((s, index) => {
    const debt = (s.finalInvoice || 0) - (s.paidAmount || 0);
    return {
      'م': index + 1,
      'تاريخ البيع': s.date || '',
      'تاريخ التسليم': s.deliveryDate || '',
      'اسم المحل / الشركة': s.shopName || '',
      'اسم العميل / المالك': s.clientName || '',
      'رقم التليفون': s.phone || '',
      'القطاع / النظام': s.system || '',
      'القسم الفرعي': s.category || '',
      'اسم الباقة': s.packageName || 'بدون باقة',
      'إجمالي الأجهزة (ج.م)': s.devicesTotal || 0,
      'إجمالي الزيارات (ج.م)': s.visitsTotal || 0,
      'المجموع قبل الخصم (ج.م)': s.subtotal || 0,
      'الخصم (ج.م)': s.discount || 0,
      'إجمالي الفاتورة (ج.م)': s.finalInvoice || 0,
      'المبلغ المدفوع (ج.م)': s.paidAmount || 0,
      'المتبقي / الدين (ج.م)': debt > 0 ? debt : 0,
      'حالة البيع': s.status === 'mowakad' ? 'مؤكد ومسدد' : 'مرسل قبل الدفع',
      'رابط مشروع العميل': s.projectUrl || '-',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto column widths
  const colWidths = [
    { wch: 5 },  // م
    { wch: 12 }, // تاريخ
    { wch: 12 }, // تسليم
    { wch: 25 }, // محل
    { wch: 20 }, // عميل
    { wch: 15 }, // تليفون
    { wch: 12 }, // نظام
    { wch: 15 }, // قسم
    { wch: 20 }, // باقة
    { wch: 15 }, // أجهزة
    { wch: 15 }, // زيارات
    { wch: 15 }, // مجموع
    { wch: 12 }, // خصم
    { wch: 18 }, // صافي
    { wch: 18 }, // مدفوع
    { wch: 18 }, // دين
    { wch: 15 }, // حالة
    { wch: 30 }, // رابط
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير المبيعات');

  downloadWorkbook(workbook, `تقرير_المبيعات_الفواتير_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export Clients directory to Excel
 */
export function exportClientsToExcel(clients: Client[], sales: Sale[]) {
  const data = clients.map((c, index) => {
    const clientSales = sales.filter((s) => s.clientName === c.name || s.phone === c.phone || s.shopName === c.shopName);
    const totalSpent = clientSales.reduce((acc, curr) => acc + (curr.finalInvoice || 0), 0);
    const totalPaid = clientSales.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
    const totalDebt = totalSpent - totalPaid;

    return {
      'م': index + 1,
      'اسم العميل': c.name || '',
      'اسم المحل / النشاط': c.shopName || '',
      'رقم التليفون': c.phone || '',
      'العنوان': c.address || '',
      'القطاع': c.system || '',
      'القسم الفرعي': c.category || '',
      'تاريخ الإضافة': c.createdAt ? new Date(c.createdAt).toLocaleDateString('ar-EG') : '',
      'عدد المشتريات': clientSales.length,
      'إجمالي التعاملات (ج.م)': totalSpent,
      'المسدد (ج.م)': totalPaid,
      'الديون / المستحق (ج.م)': totalDebt > 0 ? totalDebt : 0,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 5 },  // م
    { wch: 22 }, // اسم
    { wch: 25 }, // محل
    { wch: 15 }, // فون
    { wch: 30 }, // عنوان
    { wch: 12 }, // قطاع
    { wch: 15 }, // قسم
    { wch: 15 }, // تاريخ
    { wch: 12 }, // عدد
    { wch: 18 }, // إجمالي
    { wch: 15 }, // مسدد
    { wch: 15 }, // ديون
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'دليل العملاء');

  downloadWorkbook(workbook, `دليل_العملاء_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export Expenses to Excel
 */
export function exportExpensesToExcel(expenses: Expense[]) {
  const data = expenses.map((e, index) => ({
    'م': index + 1,
    'تاريخ المصروف': e.date || '',
    'بيان المصروف / البند': e.title || '',
    'المبلغ (ج.م)': e.amount || 0,
    'التصنيف': e.category || '',
    'القطاع': e.system || '',
    'ملاحظات': e.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 30 },
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 30 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'سجل المصروفات');

  downloadWorkbook(workbook, `سجل_المصروفات_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export Comprehensive Multi-Sheet Business Report
 */
export function exportFullReportToExcel(params: {
  sales: Sale[];
  clients: Client[];
  expenses: Expense[];
  packages: Package[];
}) {
  const { sales, clients, expenses, packages } = params;

  const totalSalesVal = sales.reduce((a, b) => a + (b.finalInvoice || 0), 0);
  const totalPaidVal = sales.reduce((a, b) => a + (b.paidAmount || 0), 0);
  const totalDebtsVal = totalSalesVal - totalPaidVal;
  const totalExpensesVal = expenses.reduce((a, b) => a + (b.amount || 0), 0);
  const netProfit = totalPaidVal - totalExpensesVal;

  // Sheet 1: Summary Dashboard
  const summaryData = [
    { 'البند الأخصائي': 'إجمالي المبيعات والفواتير', 'القيمة (ج.م)': totalSalesVal },
    { 'البند الأخصائي': 'المبالغ المحصلة فعلياً', 'القيمة (ج.م)': totalPaidVal },
    { 'البند الأخصائي': 'إجمالي الديون المتبقية لدى العملاء', 'القيمة (ج.م)': totalDebtsVal },
    { 'البند الأخصائي': 'إجمالي المصروفات والمشتريات', 'القيمة (ج.م)': totalExpensesVal },
    { 'البند الأخصائي': 'صافي الأرباح المحصلة', 'القيمة (ج.م)': netProfit },
    { 'البند الأخصائي': 'إجمالي عدد العملاء المسجلين', 'القيمة (ج.م)': clients.length },
    { 'البند الأخصائي': 'إجمالي عدد الباقات المتاحة', 'القيمة (ج.م)': packages.length },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 35 }, { wch: 20 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'الملخص المالي العام');

  // Sheet 2: Sales
  exportSalesSheet(workbook, sales);

  // Sheet 3: Clients
  exportClientsSheet(workbook, clients, sales);

  // Sheet 4: Expenses
  exportExpensesSheet(workbook, expenses);

  downloadWorkbook(workbook, `تقرير_بيزنس_مانجر_الشامل_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function exportSalesSheet(workbook: XLSX.WorkBook, sales: Sale[]) {
  const data = sales.map((s, index) => ({
    'م': index + 1,
    'تاريخ البيع': s.date || '',
    'اسم المحل': s.shopName || '',
    'اسم العميل': s.clientName || '',
    'التليفون': s.phone || '',
    'الباقة': s.packageName || '-',
    'إجمالي الفاتورة': s.finalInvoice || 0,
    'المدفوع': s.paidAmount || 0,
    'الدين المتبقي': (s.finalInvoice || 0) - (s.paidAmount || 0),
    'الحالة': s.status === 'mowakad' ? 'مؤكد' : 'قبل الدفع',
  }));
  const sheet = XLSX.utils.json_to_sheet(data);
  sheet['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 22 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, sheet, 'تفاصيل المبيعات');
}

function exportClientsSheet(workbook: XLSX.WorkBook, clients: Client[], sales: Sale[]) {
  const data = clients.map((c, index) => {
    const cSales = sales.filter((s) => s.clientName === c.name || s.phone === c.phone);
    const spent = cSales.reduce((a, b) => a + (b.finalInvoice || 0), 0);
    const paid = cSales.reduce((a, b) => a + (b.paidAmount || 0), 0);
    return {
      'م': index + 1,
      'اسم العميل': c.name || '',
      'اسم المحل': c.shopName || '',
      'رقم التليفون': c.phone || '',
      'القطاع': c.system || '',
      'إجمالي التعاملات': spent,
      'المدفوع': paid,
      'المستحق (ديون)': spent - paid,
    };
  });
  const sheet = XLSX.utils.json_to_sheet(data);
  sheet['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 22 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, sheet, 'دليل العملاء');
}

function exportExpensesSheet(workbook: XLSX.WorkBook, expenses: Expense[]) {
  const data = expenses.map((e, index) => ({
    'م': index + 1,
    'التاريخ': e.date || '',
    'البيان': e.title || '',
    'المبلغ': e.amount || 0,
    'التصنيف': e.category || '',
  }));
  const sheet = XLSX.utils.json_to_sheet(data);
  sheet['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 28 }, { wch: 15 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, sheet, 'المصروفات');
}
