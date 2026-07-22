import React from 'react';
import {
  TrendingUp,
  CreditCard,
  Building2,
  Store,
  Dumbbell,
  AppWindow,
  Layers,
  ArrowUpLeft,
  DollarSign,
  Clock,
  ChevronLeft,
  Smartphone,
  Download
} from 'lucide-react';
import { Sale, Expense, SystemType, ScreenView } from '../types';

interface HomeScreenProps {
  sales: Sale[];
  expenses: Expense[];
  onNavigate: (screen: ScreenView, sector?: SystemType) => void;
  onOpenInstallPwa?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ sales, expenses, onNavigate, onOpenInstallPwa }) => {
  // 1. Calculate confirmed total revenue
  const confirmedSales = sales.filter((s) => s.status === 'mowakad');
  const totalRevenue = confirmedSales.reduce((acc, curr) => acc + (curr.finalInvoice || 0), 0);

  // 2. Calculate total expenses
  const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  // 3. Calculate total debt (Total Invoice - Paid Amount)
  const totalDebt = sales.reduce((acc, curr) => {
    const debt = (curr.finalInvoice || 0) - (curr.paidAmount || 0);
    return acc + (debt > 0 ? debt : 0);
  }, 0);

  // Helper function to get revenue per system
  const getSystemRevenue = (sys: SystemType) => {
    return sales
      .filter((s) => s.system === sys && s.status === 'mowakad')
      .reduce((acc, curr) => acc + (curr.finalInvoice || 0), 0);
  };

  // Systems config - 'أخرى' in 4th place, 'برامج' at bottom taking full width (both places)
  const main4Systems: { name: SystemType; icon: React.ReactNode; count: number }[] = [
    {
      name: 'محلات',
      icon: <Store className="w-6 h-6 text-[#FF7A1A]" />,
      count: sales.filter((s) => s.system === 'محلات').length,
    },
    {
      name: 'شركات',
      icon: <Building2 className="w-6 h-6 text-blue-400" />,
      count: sales.filter((s) => s.system === 'شركات').length,
    },
    {
      name: 'صالات جيم',
      icon: <Dumbbell className="w-6 h-6 text-emerald-400" />,
      count: sales.filter((s) => s.system === 'صالات جيم').length,
    },
    {
      name: 'أخرى',
      icon: <Layers className="w-6 h-6 text-amber-300" />,
      count: sales.filter((s) => s.system === 'أخرى').length,
    },
  ];

  const softwareSystem = {
    name: 'برامج' as SystemType,
    icon: <AppWindow className="w-6 h-6 text-purple-400" />,
    count: sales.filter((s) => s.system === 'برامج').length,
  };

  // Recent 4 sales
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-4 pb-24 pt-2">
      {/* PWA Install Banner */}
      {onOpenInstallPwa && (
        <div
          onClick={onOpenInstallPwa}
          className="p-3 bg-gradient-to-r from-[#FF7A1A]/20 via-amber-500/10 to-[#FF7A1A]/20 border border-[#FF7A1A]/40 rounded-2xl flex items-center justify-between cursor-pointer shadow-lg hover:border-[#FF7A1A] transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF7A1A] to-amber-500 flex items-center justify-center text-white shadow-md shadow-[#FF7A1A]/30 group-hover:scale-105 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1">
                تثبيت التطبيق على الموبايل
                <span className="text-[10px] bg-[#FF7A1A] text-white px-1.5 py-0.2 rounded-full font-bold">PWA</span>
              </h4>
              <p className="text-[11px] text-gray-300">استخدم البرنامج كأبلكيشن مستقل على هاتفك</p>
            </div>
          </div>
          <button className="px-3 py-1.5 bg-[#FF7A1A] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-[#FF7A1A]/30">
            <Download className="w-3.5 h-3.5" />
            تثبيت
          </button>
        </div>
      )}

      {/* 1. Card: Total Revenue */}
      <div className="glass-card p-5 relative overflow-hidden bg-gradient-to-br from-[#121C30]/90 to-[#0B1220]/90 border border-white/10 shadow-xl">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#FF7A1A]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-300">إجمالي الإيرادات المؤكدة</span>
          <div className="w-8 h-8 rounded-full bg-[#FF7A1A]/15 flex items-center justify-center text-[#FF7A1A]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-extrabold text-[#FF7A1A] tracking-tight">
            {totalRevenue.toLocaleString('ar-EG')}
          </span>
          <span className="text-xs font-bold text-gray-400">ج.م</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
          <span className="bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            +12.5% مقارنة بالشهر الماضي
          </span>
        </div>
      </div>

      {/* 2. Expenses & Debt Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Expenses Card */}
        <div
          onClick={() => onNavigate('expenses')}
          className="glass-card glass-card-hover p-4 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-300">المصاريف</span>
            <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {totalExpenses.toLocaleString('ar-EG')} <span className="text-xs font-normal text-gray-400">ج.م</span>
            </div>
            <span className="text-[10px] text-gray-400">تكاليف التشغيل والزيارات</span>
          </div>
        </div>

        {/* Debts Card */}
        <div
          onClick={() => onNavigate('sales')}
          className="glass-card glass-card-hover p-4 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-300">إجمالي الديون</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-400">
              {totalDebt.toLocaleString('ar-EG')} <span className="text-xs font-normal text-gray-400">ج.م</span>
            </div>
            <span className="text-[10px] text-gray-400">مبالغ متبقية لدى العملاء</span>
          </div>
        </div>
      </div>

      {/* 3. Systems Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-gray-300 tracking-wide uppercase">الأنظمة والأعمال</h2>
          <span className="text-[10px] text-gray-400">اختر قطاع لمشاهدة التفاصيل</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {main4Systems.map((sys) => {
            const revenue = getSystemRevenue(sys.name);
            return (
              <div
                key={sys.name}
                onClick={() => onNavigate('sector', sys.name)}
                className="glass-card glass-card-hover p-3.5 cursor-pointer flex flex-col justify-between h-28 border border-white/5 hover:border-[#FF7A1A]/40"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-xl bg-white/5">{sys.icon}</div>
                  <span className="text-[10px] bg-white/10 text-gray-300 px-1.5 py-0.5 rounded-md">
                    {sys.count} مبيعات
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white mb-0.5">{sys.name}</h3>
                  <div className="text-xs font-semibold text-[#FF7A1A]">
                    {revenue.toLocaleString('ar-EG')} <span className="text-[9px] text-gray-400">ج.م</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Software System ('برامج') taking full width across both columns */}
          <div
            onClick={() => onNavigate('sector', softwareSystem.name)}
            className="col-span-2 glass-card glass-card-hover p-4 cursor-pointer flex items-center justify-between border border-purple-500/30 bg-gradient-to-r from-purple-900/20 via-slate-900/40 to-slate-900/60 hover:border-purple-400/60 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/30">
                {softwareSystem.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white">{softwareSystem.name}</h3>
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                    تطبيقات وبرامج
                  </span>
                </div>
                <p className="text-[11px] text-purple-200/80 mt-0.5">
                  إدارية • استثمارية • برامج سطح المكتب • أنظمة شخصية
                </p>
              </div>
            </div>

            <div className="text-left shrink-0">
              <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-md block mb-1">
                {softwareSystem.count} مبيعات
              </span>
              <div className="text-xs font-extrabold text-[#FF7A1A]">
                {getSystemRevenue(softwareSystem.name).toLocaleString('ar-EG')} <span className="text-[9px] text-gray-400">ج.م</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Sales Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-gray-300 tracking-wide uppercase">آخر العمليات التسويقية</h2>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs font-semibold text-[#FF7A1A] hover:underline flex items-center gap-0.5"
          >
            <span>عرض الكل</span>
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {recentSales.length === 0 ? (
            <div className="glass-card p-6 text-center text-gray-400 text-xs">
              لا توجد عمليات مبيعات مضافة حتى الآن.
            </div>
          ) : (
            recentSales.map((sale) => (
              <div
                key={sale.id}
                onClick={() => onNavigate('sales')}
                className="glass-card glass-card-hover p-3 flex items-center justify-between cursor-pointer border-l-2 border-l-[#FF7A1A]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FF7A1A]/10 text-[#FF7A1A] flex items-center justify-center font-bold text-xs">
                    {sale.shopName ? sale.shopName.charAt(0) : 'ن'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{sale.shopName}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {sale.system} • {sale.category} • {sale.clientName}
                    </p>
                  </div>
                </div>

                <div className="text-left">
                  <div className="text-xs font-bold text-[#FF7A1A]">
                    {(sale.finalInvoice || 0).toLocaleString('ar-EG')} ج.م
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                      sale.status === 'mowakad'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {sale.status === 'mowakad' ? 'مؤكد' : 'مرسل قبل الدفع'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
