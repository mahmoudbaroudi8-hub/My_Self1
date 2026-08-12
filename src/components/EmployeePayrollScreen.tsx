import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Filter,
  FileSpreadsheet,
  Receipt,
  Printer,
  ChevronDown,
  Award,
  ArrowUpRight,
  Send,
  Building2,
  Percent,
  Search,
  MessageSquare
} from 'lucide-react';
import { Sale, TeamMember, POSITION_LABELS } from '../types';

interface EmployeePayrollScreenProps {
  sales: Sale[];
  teamMembers: TeamMember[];
  currentUser: TeamMember | null;
  onViewSaleDetails?: (sale: Sale) => void;
}

// Helper: Get Saturday-to-Friday week boundaries for a given date
function getWeekRange(dateObj: Date) {
  const d = new Date(dateObj);
  const day = d.getDay(); // 0 is Sunday, 6 is Saturday
  // Distance to previous Saturday (in Egypt, work week often starts Sat or Sun)
  const diffToSat = (day + 1) % 7;
  const sat = new Date(d);
  sat.setDate(d.getDate() - diffToSat);
  sat.setHours(0, 0, 0, 0);

  const fri = new Date(sat);
  fri.setDate(sat.getDate() + 6);
  fri.setHours(23, 59, 59, 999);

  return { sat, fri };
}

function formatDateFormatted(d: Date): string {
  return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toISODateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const EmployeePayrollScreen: React.FC<EmployeePayrollScreenProps> = ({
  sales = [],
  teamMembers = [],
  currentUser,
}) => {
  const isOwner = currentUser?.position === 'owner';

  // Selected Employee (Owner can view anyone, employee views only self)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(() => {
    if (!isOwner && currentUser) return currentUser.id;
    // Default to first non-owner or current user
    const firstEmp = teamMembers.find((m) => m.position !== 'owner') || currentUser;
    return firstEmp ? firstEmp.id : '';
  });

  // Week selection: 'current' (الأسبوع الحالي), 'last' (الأسبوع الماضي), '2weeks' (منذ أسبوعين), 'all' (كل الفترات)
  const [weekFilter, setWeekFilter] = useState<string>('current');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const targetEmployee = useMemo(() => {
    return teamMembers.find((m) => m.id === selectedEmployeeId) || currentUser;
  }, [teamMembers, selectedEmployeeId, currentUser]);

  // Generate predefined week ranges for the dropdown selector
  const weekOptions = useMemo(() => {
    const now = new Date();
    const options = [];

    // Current Week
    const currentRange = getWeekRange(now);
    options.push({
      id: 'current',
      label: `الأسبوع الحالي (${formatDateFormatted(currentRange.sat)} - ${formatDateFormatted(currentRange.fri)})`,
      start: currentRange.sat,
      end: currentRange.fri,
    });

    // Last Week (1 week ago)
    const lastSat = new Date(currentRange.sat);
    lastSat.setDate(lastSat.getDate() - 7);
    const lastFri = new Date(currentRange.fri);
    lastFri.setDate(lastFri.getDate() - 7);
    options.push({
      id: 'last',
      label: `الأسبوع الماضي (${formatDateFormatted(lastSat)} - ${formatDateFormatted(lastFri)})`,
      start: lastSat,
      end: lastFri,
    });

    // 2 Weeks ago
    const w2Sat = new Date(lastSat);
    w2Sat.setDate(w2Sat.getDate() - 7);
    const w2Fri = new Date(lastFri);
    w2Fri.setDate(w2Fri.getDate() - 7);
    options.push({
      id: '2weeks',
      label: `منذ أسبوعين (${formatDateFormatted(w2Sat)} - ${formatDateFormatted(w2Fri)})`,
      start: w2Sat,
      end: w2Fri,
    });

    // 3 Weeks ago
    const w3Sat = new Date(w2Sat);
    w3Sat.setDate(w3Sat.getDate() - 7);
    const w3Fri = new Date(w2Fri);
    w3Fri.setDate(w3Fri.getDate() - 7);
    options.push({
      id: '3weeks',
      label: `منذ 3 أسابيع (${formatDateFormatted(w3Sat)} - ${formatDateFormatted(w3Fri)})`,
      start: w3Sat,
      end: w3Fri,
    });

    // All Time option
    options.push({
      id: 'all',
      label: 'كافة الفترات والأسابيع السابقة',
      start: new Date(2020, 0, 1),
      end: new Date(2030, 11, 31),
    });

    return options;
  }, []);

  const activeWeekOption = weekOptions.find((w) => w.id === weekFilter) || weekOptions[0];

  // Filter sales assigned to targetEmployee within selected week
  const employeeSalesCalculated = useMemo(() => {
    if (!targetEmployee) return [];

    return sales.filter((sale) => {
      // 1. Check if sale is assigned to this employee
      let isAssigned = false;
      let commissionPercent = targetEmployee.defaultCommissionRate || 10;

      if (sale.assignedEmployeeId === targetEmployee.id) {
        isAssigned = true;
        if (sale.employeeCommissionRate !== undefined) {
          commissionPercent = sale.employeeCommissionRate;
        }
      }

      if (sale.employeeCommissions && sale.employeeCommissions.length > 0) {
        const item = sale.employeeCommissions.find((c) => c.employeeId === targetEmployee.id);
        if (item) {
          isAssigned = true;
          commissionPercent = item.commissionPercent;
        }
      }

      if (!isAssigned) return false;

      // 2. Filter by date range (unless weekFilter is 'all')
      if (weekFilter !== 'all') {
        const saleDate = new Date(sale.date || sale.createdAt);
        if (saleDate < activeWeekOption.start || saleDate > activeWeekOption.end) {
          return false;
        }
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const clientMatch = sale.clientName?.toLowerCase().includes(q);
        const shopMatch = sale.shopName?.toLowerCase().includes(q);
        const systemMatch = sale.system?.toLowerCase().includes(q);
        if (!clientMatch && !shopMatch && !systemMatch) return false;
      }

      return true;
    }).map((sale) => {
      // Determine effective commission percentage for this sale
      let commRate = targetEmployee.defaultCommissionRate || 10;
      if (sale.assignedEmployeeId === targetEmployee.id && sale.employeeCommissionRate !== undefined) {
        commRate = sale.employeeCommissionRate;
      }
      if (sale.employeeCommissions && sale.employeeCommissions.length > 0) {
        const item = sale.employeeCommissions.find((c) => c.employeeId === targetEmployee.id);
        if (item) {
          commRate = item.commissionPercent;
        }
      }

      const invoiceAmount = sale.finalInvoice || 0;
      const packagePrice = Number(sale.packagePrice) || 0;
      const devicesTotal = (sale.devices || []).reduce((acc, d) => acc + (Number(d.price) || 0), 0);
      const profitBase = Math.max(0, invoiceAmount - (packagePrice + devicesTotal));
      const commissionAmount = (profitBase * commRate) / 100;

      return {
        sale,
        commRate,
        profitBase,
        commissionAmount,
        invoiceAmount,
      };
    });
  }, [sales, targetEmployee, weekFilter, activeWeekOption, searchQuery]);

  // Financial Summaries for the selected period
  const totalSalesInvoiceValue = employeeSalesCalculated.reduce((acc, item) => acc + item.invoiceAmount, 0);
  const totalCommissionEarned = employeeSalesCalculated.reduce((acc, item) => acc + item.commissionAmount, 0);
  const totalPaidAmount = employeeSalesCalculated.reduce((acc, item) => acc + (item.sale.paidAmount || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const shareViaWhatsApp = () => {
    if (!targetEmployee) return;
    const phone = targetEmployee.whatsappPhone || targetEmployee.phone || '';
    const text = `*كشف حساب وعمولات الموظف الأسبوعي:* %0A` +
      `👤 *الموظف:* ${targetEmployee.name} (${POSITION_LABELS[targetEmployee.position] || targetEmployee.position})%0A` +
      `📅 *الفترة:* ${activeWeekOption.label}%0A` +
      `📊 *عدد العمليات:* ${employeeSalesCalculated.length}%0A` +
      `💰 *إجمالي الفواتير:* ${totalSalesInvoiceValue.toLocaleString('ar-EG')} ج.م%0A` +
      `🎉 *الراتب / إجمالي العمولات المستحقة:* ${totalCommissionEarned.toLocaleString('ar-EG')} ج.م%0A` +
      `--- %0A*تطوير وإدارة الأنظمة والبرامج*`;
    
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5 animate-fade-in pb-16">
      {/* Top Header Card */}
      <div className="glass-card p-4 bg-gradient-to-r from-[#0E1B33] via-[#122242] to-[#0E1B33] border-2 border-[#FF7A1A]/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF7A1A] to-amber-500 flex items-center justify-center text-white shadow-lg shadow-[#FF7A1A]/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white">كشف حساب الموظف والعمولات الأسبوعية</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF7A1A]/20 text-[#FF7A1A] border border-[#FF7A1A]/30">
                  Payroll & Commissions
                </span>
              </div>
              <p className="text-xs text-gray-300">
                متابعة دقيقة لكل عملية بيع مُسندة، العمولات المحسوبة، وكشف الراتب الأسبوعي
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={shareViaWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              title="مشاركة كشف الحساب عبر الواتساب"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>إرسال عبر الواتساب</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكشف</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector Filters Bar: Employee & Week Filter */}
      <div className="glass-card p-3.5 space-y-3 bg-[#0B1220]/90 border border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* 1. Employee Selector (Visible to Owner, or disabled info badge for employee) */}
          <div className="lg:col-span-5">
            <label className="text-[11px] font-bold text-gray-300 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#FF7A1A]" />
              الموظف صاحب كشف الحساب:
            </label>
            {isOwner ? (
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="glass-input w-full p-2.5 text-xs font-bold text-[#FF7A1A] border border-[#FF7A1A]/30 focus:border-[#FF7A1A]"
              >
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({POSITION_LABELS[m.position] || m.position}) - نسبة: {m.defaultCommissionRate || 10}%
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-extrabold text-white flex items-center justify-between">
                <span>{targetEmployee?.name}</span>
                <span className="text-[10px] text-[#FF7A1A] bg-[#FF7A1A]/20 px-2 py-0.5 rounded border border-[#FF7A1A]/30">
                  {POSITION_LABELS[targetEmployee?.position || 'custom']}
                </span>
              </div>
            )}
          </div>

          {/* 2. Week Filter Selector */}
          <div className="lg:col-span-4">
            <label className="text-[11px] font-bold text-gray-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              تحديد الأسبوع المالي (Payroll Week):
            </label>
            <select
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              className="glass-input w-full p-2.5 text-xs font-bold text-white border border-amber-500/30"
            >
              {weekOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Search inside list */}
          <div className="lg:col-span-3">
            <label className="text-[11px] font-bold text-gray-300 mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-blue-400" />
              بحث بالعميل أو النشاط:
            </label>
            <input
              type="text"
              placeholder="ابحث باسم العميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full p-2.5 text-xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Weekly Payroll Summary Banner (Big Stat Card) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1. Primary Highlight: Total Weekly Commission (الراتب / المستحقات) */}
        <div className="glass-card p-4 bg-gradient-to-br from-[#FF7A1A]/20 via-amber-500/10 to-[#FF7A1A]/10 border-2 border-[#FF7A1A]/60 shadow-xl space-y-2 relative">
          <div className="flex items-center justify-between text-xs text-gray-300 font-bold">
            <span className="flex items-center gap-1 text-[#FF7A1A]">
              <DollarSign className="w-4 h-4" />
              إجمالي العمولات / الراتب المستحق
            </span>
            <span className="text-[10px] bg-[#FF7A1A] text-white px-2 py-0.5 rounded-full font-bold">
              صافي الراتب
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1.5">
            <span>{totalCommissionEarned.toLocaleString('ar-EG')}</span>
            <span className="text-xs text-[#FF7A1A] font-bold">جنيه مصري</span>
          </div>
          <p className="text-[11px] text-gray-300">
            محسوبة بنسبة العمولة المحددة لكل فاتورة مُسندة لهذا الأسبوع
          </p>
        </div>

        {/* 2. Number of Assigned Sales */}
        <div className="glass-card p-4 bg-black/40 border border-white/10 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-300 font-bold">
            <span className="flex items-center gap-1 text-blue-400">
              <Receipt className="w-4 h-4" />
              عدد عمليات المبيعات والمشاريع
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-500/30">
              {employeeSalesCalculated.length} عملية
            </span>
          </div>
          <div className="text-xl font-extrabold text-white">
            {employeeSalesCalculated.length} <span className="text-xs text-gray-400 font-medium">عملية بيع مُسندة</span>
          </div>
          <p className="text-[11px] text-gray-400">
            النسبة الافتراضية للموظف: <strong className="text-white">{targetEmployee?.defaultCommissionRate || 10}%</strong>
          </p>
        </div>

        {/* 3. Total Invoice Value of Sales */}
        <div className="glass-card p-4 bg-black/40 border border-white/10 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-300 font-bold">
            <span className="flex items-center gap-1 text-emerald-400">
              <Building2 className="w-4 h-4" />
              إجمالي فواتير العمليات المُسندة
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
              الفواتير الإجمالية
            </span>
          </div>
          <div className="text-xl font-extrabold text-emerald-300">
            {totalSalesInvoiceValue.toLocaleString('ar-EG')} <span className="text-xs font-bold text-gray-400">ج.م</span>
          </div>
          <p className="text-[11px] text-gray-400">
            المدفوع منها للشركة: <strong className="text-emerald-400">{totalPaidAmount.toLocaleString('ar-EG')} ج.م</strong>
          </p>
        </div>
      </div>

      {/* Detailed Sales & Commissions Table */}
      <div className="glass-card p-4 space-y-4 border border-white/10 bg-[#0B1220]/80">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF7A1A]/20 flex items-center justify-center text-[#FF7A1A]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-white">تفاصيل كشف العمليات والعمولات للأسبوع المحدد</h2>
              <p className="text-[10px] text-gray-400">
                قائمة بالفواتير المسندة لـ ({targetEmployee?.name}) خلال الفترة ({activeWeekOption.label})
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
            {employeeSalesCalculated.length} فاتورة
          </span>
        </div>

        {employeeSalesCalculated.length === 0 ? (
          <div className="p-8 text-center text-gray-400 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-gray-600 mb-2" />
            <p className="text-xs font-bold text-gray-300">لا توجد مبيعات أو مشاريع مُسندة لهذا الموظف خلال هذا الأسبوع.</p>
            <p className="text-[11px] text-gray-500">اختر أسبوعاً آخر من القائمة أو تأكد من إسناد الفواتير للموظف في شاشة نقطة البيع.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs dir-rtl">
              <thead>
                <tr className="bg-white/5 text-gray-300 font-bold border-b border-white/10">
                  <th className="p-3">#</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">اسم العميل والنشاط</th>
                  <th className="p-3">حالة العملية</th>
                  <th className="p-3 text-left">قيمة الفاتورة الإجمالية</th>
                  <th className="p-3 text-center">نسبة العمولة %</th>
                  <th className="p-3 text-left">عمولة الموظف المستحقة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {employeeSalesCalculated.map((item, idx) => {
                  const s = item.sale;
                  return (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-gray-400 text-[11px]">{idx + 1}</td>
                      <td className="p-3 font-medium text-gray-300 text-[11px]">
                        {s.date || s.createdAt?.split('T')[0] || '-'}
                      </td>
                      <td className="p-3 font-bold text-white">
                        <div>
                          <span>{s.clientName}</span>
                          <div className="text-[10px] text-[#FF7A1A] font-medium flex items-center gap-1">
                            <span>{s.shopName}</span>
                            <span>•</span>
                            <span className="text-gray-400">{s.system}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            s.status === 'mowakad'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {s.status === 'mowakad' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>مؤكد وقيد التنفيذ</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>قبل الدفع (مسودة)</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-left font-extrabold text-white text-xs">
                        {item.invoiceAmount.toLocaleString('ar-EG')} <span className="text-[10px] text-gray-400 font-normal">ج.م</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-1 rounded bg-[#FF7A1A]/20 text-[#FF7A1A] border border-[#FF7A1A]/30 font-bold text-xs">
                          {item.commRate}%
                        </span>
                      </td>
                      <td className="p-3 text-left font-black text-emerald-400 text-sm">
                        {item.commissionAmount.toLocaleString('ar-EG')} <span className="text-[10px] font-bold">ج.م</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-[#FF7A1A]/20 to-emerald-500/20 font-black text-white border-t-2 border-[#FF7A1A]">
                  <td colSpan={4} className="p-3.5 text-xs text-white">
                    إجمالي المستحقات والراتب للفترة المحسوبة:
                  </td>
                  <td className="p-3.5 text-left text-sm text-white">
                    {totalSalesInvoiceValue.toLocaleString('ar-EG')} ج.م
                  </td>
                  <td className="p-3.5 text-center text-xs text-amber-300">
                    معدل صافي
                  </td>
                  <td className="p-3.5 text-left text-base text-emerald-300">
                    {totalCommissionEarned.toLocaleString('ar-EG')} ج.م
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
