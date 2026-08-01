import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Wallet, Store, ShieldCheck, AlertCircle, PieChart, FileSpreadsheet } from 'lucide-react';
import { Sale, Expense, Client, Package, Payment, SystemType } from '../types';
import { exportFullReportToExcel } from '../lib/excelExport';

interface ReportsScreenProps {
  sales: Sale[];
  expenses: Expense[];
  payments?: Payment[];
  clients?: Client[];
  packages?: Package[];
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ sales, expenses, payments = [], clients = [], packages = [] }) => {
  const initialSalesPaid = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalExtraPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalRevenue = initialSalesPaid + totalExtraPayments;

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const totalInvoiced = sales.reduce((acc, curr) => acc + (curr.finalInvoice || 0), 0);
  const totalDebt = Math.max(0, totalInvoiced - totalRevenue);

  const pendingSalesTotal = sales
    .filter((s) => s.status === 'morsal_qabl_dafa')
    .reduce((sum, s) => sum + (s.finalInvoice || 0), 0);

  // Revenue breakdown by system
  const systemsList: SystemType[] = ['محلات', 'شركات', 'صالات جيم', 'برامج', 'أخرى'];
  const sectorBreakdown = systemsList.map((sys) => {
    const sysRevenue = sales
      .filter((s) => s.system === sys && s.status === 'mowakad')
      .reduce((sum, s) => sum + (s.finalInvoice || 0), 0);

    const percentage = totalRevenue > 0 ? Math.round((sysRevenue / totalRevenue) * 100) : 0;
    return { name: sys, revenue: sysRevenue, percentage };
  });

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* Header */}
      <div className="glass-card p-4 flex items-center justify-between border-b-2 border-b-[#FF7A1A]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#FF7A1A]/15 text-[#FF7A1A] flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">التقارير والأداء المالي</h2>
            <p className="text-[11px] text-gray-300">تحليل الأرباح والإيرادات والديون المستحقة</p>
          </div>
        </div>

        <button
          onClick={() => exportFullReportToExcel({ sales, clients, expenses, packages })}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          title="تصدير التقرير المالي الشامل إلى Excel"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="hidden sm:inline">تقرير Excel الشامل</span>
        </button>
      </div>

      {/* Net Profit Card */}
      <div className="glass-card p-5 bg-gradient-to-br from-[#121C30] to-[#0B1220] border border-emerald-500/30">
        <span className="text-xs font-semibold text-gray-300 block mb-1">صافي الربح التقديري (الإيرادات - المصاريف)</span>
        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-2xl font-extrabold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {netProfit.toLocaleString('ar-EG')}
          </span>
          <span className="text-xs text-gray-400">ج.م</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/10">
          <span>إجمالي الإيرادات: <strong className="text-white">{totalRevenue.toLocaleString('ar-EG')} ج.م</strong></span>
          <span>إجمالي التكاليف: <strong className="text-red-400">{totalExpenses.toLocaleString('ar-EG')} ج.م</strong></span>
        </div>
      </div>

      {/* Financial Status Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-bold">الديون المستحقة</span>
          </div>
          <div className="text-lg font-extrabold text-amber-400">
            {totalDebt.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
          </div>
          <p className="text-[10px] text-gray-400">مبالغ متبقية لم يتم تحصيلها</p>
        </div>

        <div className="glass-card p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-400">
            <PieChart className="w-4 h-4" />
            <span className="text-xs font-bold">فواتير متوقعة</span>
          </div>
          <div className="text-lg font-extrabold text-blue-400">
            {pendingSalesTotal.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
          </div>
          <p className="text-[10px] text-gray-400">فواتير مرسلة قبل الدفع</p>
        </div>
      </div>

      {/* Sector Revenue Breakdown */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-[#FF7A1A]" /> توزيع الإيرادات حسب القطاع
        </h3>

        <div className="space-y-3 pt-1">
          {sectorBreakdown.map((sec) => (
            <div key={sec.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-200 font-semibold">{sec.name}</span>
                <span className="text-[#FF7A1A] font-bold">
                  {sec.revenue.toLocaleString('ar-EG')} ج.م ({sec.percentage}%)
                </span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#FF7A1A] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, sec.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="glass-card p-4 space-y-2">
        <h3 className="text-xs font-bold text-gray-300">ملاحظات الأداء التشغيلي</h3>
        <ul className="space-y-1.5 text-xs text-gray-300">
          <li className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>تم ربط جميع الحسابات والإحصائيات ببيانات Firestore الحقيقية.</span>
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF7A1A]" />
            <span>يمكنك تسجيل عمليات بيع جديدة ومتابعة حالة التحصيل بشكل مباشر.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
