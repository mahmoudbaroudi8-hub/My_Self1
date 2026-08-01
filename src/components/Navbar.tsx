import React, { useState } from 'react';
import { Bell, Settings, User, X, CheckCircle2, Clock, AlertTriangle, ChevronRight, Receipt, Database, Smartphone, Monitor, LayoutGrid, Package } from 'lucide-react';
import { ScreenView, Sale, Client, TeamMember, POSITION_LABELS } from '../types';

interface NavbarProps {
  currentScreen: ScreenView;
  onNavigate: (screen: ScreenView) => void;
  sales?: Sale[];
  clients?: Client[];
  currentUser?: TeamMember | null;
  onOpenBackup?: () => void;
  onOpenInstallPwa?: () => void;
  isAppInstalled?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  sales = [],
  clients = [],
  currentUser = null,
  onOpenBackup,
  onOpenInstallPwa,
  isAppInstalled = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'home':
        return 'الرئيسية';
      case 'pos':
        return 'نقطة البيع';
      case 'add-client':
        return 'إضافة عميل جديد';
      case 'clients':
        return 'سجل العملاء';
      case 'packages':
        return 'إدارة الباقات';
      case 'sector':
        return 'قطاعات الأعمال';
      case 'sales':
        return 'سجل المبيعات والخدمات';
      case 'expenses':
        return 'المصروفات والمشتريات';
      case 'reports':
        return 'التقارير المالية';
      case 'team':
        return 'الفريق والأدوار والصلاحيات';
      default:
        return 'الرئيسية';
    }
  };

  // Derive notifications
  const pendingCollectionSales = sales.filter((s) => s.status === 'morsal_qabl_dafa');
  const debtSales = sales.filter((s) => s.finalInvoice > s.paidAmount && s.status === 'mowakad');
  const recentSales = sales.slice(0, 3);

  const totalAlertsCount = pendingCollectionSales.length + debtSales.length;

  return (
    <>
      <header className="sticky top-0 z-[100] w-full shrink-0 px-4 py-2.5 bg-[#070918] backdrop-blur-2xl border-b-2 border-[#FF7A1A]/30 shadow-[0_8px_30px_rgba(0,0,0,0.8)] flex items-center justify-between transition-all">
        {/* Right side: App Owner Info & Team Navigation */}
        <button
          type="button"
          onClick={() => onNavigate('team')}
          className="flex items-center gap-2.5 text-right cursor-pointer hover:opacity-80 transition-opacity"
          title="إدارة فريق العمل، البوسيشن والصلاحيات"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-0.5 shadow-md shadow-[#FF7A1A]/10">
            <div className="w-full h-full rounded-full bg-[#0B1220]/90 flex items-center justify-center">
              <User className="w-4 h-4 text-[#FF7A1A]" />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block leading-tight font-medium">
              أهلاً بك ({currentUser?.name || 'الفريق'})
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              {currentUser
                ? (currentUser.position === 'custom'
                    ? currentUser.customPositionTitle || 'وظيفة مخصصة'
                    : POSITION_LABELS[currentUser.position] || 'عضو فريق')
                : 'مدير وصاحب المشروع'}
            </span>
          </div>
        </button>

        {/* Title center */}
        <div className="text-center">
          <h1 className="text-sm font-bold text-[#FF7A1A]">{getScreenTitle()}</h1>
        </div>

        {/* Left side actions */}
        <div className="flex items-center gap-1.5">
          {/* Packages & Offers Catalog Button */}
          <button
            onClick={() => onNavigate('packages')}
            className={`w-8 h-8 rounded-full glass-button flex items-center justify-center transition-transform active:scale-95 ${
              currentScreen === 'packages' ? 'text-[#FF7A1A] bg-[#FF7A1A]/20 border border-[#FF7A1A]' : 'text-amber-400 hover:text-amber-300'
            }`}
            title="كتالوج الباقات والعروض"
          >
            <Package className="w-4 h-4" />
          </button>

          {/* Notifications Button */}
          <button
            onClick={() => setShowNotifications(true)}
            className="w-8 h-8 rounded-full glass-button flex items-center justify-center text-gray-300 hover:text-white relative active:scale-95 transition-transform"
            title="التنبيهات والقيود"
          >
            <Bell className="w-4 h-4" />
            {totalAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF7A1A] text-white text-[9px] font-extrabold flex items-center justify-center border border-[#0B1220] animate-pulse">
                {totalAlertsCount}
              </span>
            )}
          </button>

          {/* General Settings Button */}
          <button
            onClick={() => {
              if (onOpenBackup) onOpenBackup();
              else onNavigate('team');
            }}
            className="w-8 h-8 rounded-full glass-button flex items-center justify-center text-gray-300 hover:text-white transition-transform active:scale-95"
            title="إعدادات النظام وفريق العمل والصلاحيات"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Notifications Drawer / Modal - Backdrop Click-to-Close */}
      {showNotifications && (
        <div
          onClick={() => setShowNotifications(false)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0B1220]/95 backdrop-blur-2xl border-2 border-[#FF7A1A]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-right"
          >
            {/* Unified Modal Header */}
            <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#121C30] via-[#16233B] to-[#0E1524]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#FF7A1A]/20 border border-[#FF7A1A]/40 flex items-center justify-center text-[#FF7A1A] shadow-md">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white">مركز التنبيهات والإشعارات</h3>
                    {totalAlertsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#FF7A1A] text-white text-[10px] font-black animate-pulse">
                        {totalAlertsCount} تنبيه عاجل
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">تابع العمليات المعلقة والديون المتبقية والنشاطات الأخيرة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-300 flex items-center justify-center border border-white/10 transition-colors active:scale-95"
                title="إغلاق التنبيهات (X)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Unified Scrollable Body Container */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* 1. Pending Collections */}
              {pendingCollectionSales.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-amber-400 text-xs font-bold border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>فواتير قيد التحصيل (مرسلة قبل الدفع)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                      {pendingCollectionSales.length} عملية
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pendingCollectionSales.map((sale) => (
                      <div
                        key={sale.id}
                        onClick={() => {
                          setShowNotifications(false);
                          onNavigate('sales');
                        }}
                        className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-all group shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                            {sale.shopName ? sale.shopName.slice(0, 2) : '🛒'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                              {sale.shopName || sale.clientName}
                            </p>
                            <p className="text-[10px] text-amber-300/80">
                              العميل: {sale.clientName} — <span className="underline">لم يتم التحصيل بعد</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-extrabold text-[#FF7A1A] block">
                            {sale.finalInvoice.toLocaleString()} ج.م
                          </span>
                          <span className="text-[9px] text-gray-400 block">{sale.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Outstanding Debts */}
              {debtSales.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-red-400 text-xs font-bold border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>متبقي مبالغ غير محصلة بالكامل</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">
                      {debtSales.length} دَيْن
                    </span>
                  </div>
                  <div className="space-y-2">
                    {debtSales.map((sale) => {
                      const remaining = sale.finalInvoice - sale.paidAmount;
                      return (
                        <div
                          key={sale.id}
                          onClick={() => {
                            setShowNotifications(false);
                            onNavigate('sales');
                          }}
                          className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between cursor-pointer hover:bg-red-500/20 transition-all group shadow-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs">
                              💸
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">
                                {sale.shopName || sale.clientName}
                              </p>
                              <p className="text-[10px] text-red-300 font-semibold">
                                باقي للتحصيل: {remaining.toLocaleString()} ج.م
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-extrabold text-white block">
                              {sale.finalInvoice.toLocaleString()} ج.م
                            </span>
                            <span className="text-[9px] text-gray-400 block">{sale.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Recent Sales Activity */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-emerald-400 text-xs font-bold border-b border-white/10 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>أحدث العمليات المسجلة</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('sales');
                    }}
                    className="text-[10px] text-[#FF7A1A] font-bold hover:underline flex items-center gap-0.5"
                  >
                    عرض سجل المبيعات <ChevronRight className="w-3 h-3 rotate-180" />
                  </button>
                </div>

                {recentSales.length === 0 ? (
                  <div className="p-4 text-center rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-400">لا توجد عمليات مبيعات مسجلة حتى الآن</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentSales.map((sale) => (
                      <div
                        key={sale.id}
                        onClick={() => {
                          setShowNotifications(false);
                          onNavigate('sales');
                        }}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#FF7A1A]/15 text-[#FF7A1A] flex items-center justify-center font-bold text-xs">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{sale.shopName || sale.clientName}</p>
                            <p className="text-[10px] text-gray-400">{sale.packageName || sale.system}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-emerald-400 block">
                            +{sale.finalInvoice.toLocaleString()} ج.م
                          </span>
                          <span className="text-[9px] text-gray-400 block">{sale.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {totalAlertsCount === 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                  <p className="text-xs font-bold text-emerald-300">🎉 لا توجد ديون أو فواتير معلقة عاجلة</p>
                  <p className="text-[10px] text-gray-400">جميع الفواتير محصلة ومؤكدة بالكامل</p>
                </div>
              )}
            </div>

            {/* Unified Modal Footer */}
            <div className="p-3 border-t border-white/10 bg-[#0E1524] flex items-center gap-2">
              <button
                onClick={() => {
                  setShowNotifications(false);
                  onNavigate('sales');
                }}
                className="flex-1 btn-orange py-2 text-xs font-bold rounded-xl shadow-md text-center"
              >
                الانتقال إلى سجل المبيعات والتحصيل
              </button>
              <button
                onClick={() => setShowNotifications(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
