import React, { useState } from 'react';
import { Bell, Settings, User, X, CheckCircle2, Clock, AlertTriangle, ChevronRight, Receipt, Database, Smartphone, Monitor, LayoutGrid } from 'lucide-react';
import { ScreenView, Sale, Client } from '../types';

interface NavbarProps {
  currentScreen: ScreenView;
  onNavigate: (screen: ScreenView) => void;
  sales?: Sale[];
  clients?: Client[];
  onOpenBackup?: () => void;
  onOpenInstallPwa?: () => void;
  isDesktopWide?: boolean;
  onToggleDesktopWide?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  sales = [],
  clients = [],
  onOpenBackup,
  onOpenInstallPwa,
  isDesktopWide = true,
  onToggleDesktopWide
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
      <header className="sticky top-0 z-30 px-4 py-3 bg-[#0B1220]/75 backdrop-blur-xl border-b border-white/10 flex items-center justify-between">
        {/* Right side: App Owner Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-0.5 shadow-md shadow-[#FF7A1A]/10">
            <div className="w-full h-full rounded-full bg-[#0B1220]/90 flex items-center justify-center">
              <User className="w-4 h-4 text-[#FF7A1A]" />
            </div>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 block leading-tight font-medium">أهلاً بك</span>
            <span className="text-xs font-bold text-white tracking-wide">مدير الأعمال</span>
          </div>
        </div>

        {/* Title center */}
        <div className="text-center">
          <h1 className="text-sm font-bold text-[#FF7A1A]">{getScreenTitle()}</h1>
        </div>

        {/* Left side actions */}
        <div className="flex items-center gap-1.5">
          {/* PC Widescreen Toggle (hidden on small mobile screens) */}
          {onToggleDesktopWide && (
            <button
              onClick={onToggleDesktopWide}
              className={`hidden md:flex w-8 h-8 rounded-full glass-button items-center justify-center transition-all ${
                isDesktopWide ? 'text-sky-400 bg-sky-500/10 border-sky-500/30' : 'text-gray-400'
              }`}
              title={isDesktopWide ? 'التبديل إلى العرض المحذى (شاشة الموبايل)' : 'التبديل إلى العرض الكامل (شاشة الكمبيوتر)'}
            >
              {isDesktopWide ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            </button>
          )}

          {/* PWA Mobile Install Button */}
          {onOpenInstallPwa && (
            <button
              onClick={onOpenInstallPwa}
              className="w-8 h-8 rounded-full glass-button flex items-center justify-center text-amber-400 hover:text-amber-300 active:scale-95 transition-transform relative"
              title="تثبيت التطبيق على الموبايل (PWA)"
            >
              <Smartphone className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF7A1A]" />
            </button>
          )}

          {/* Backup & DB button */}
          {onOpenBackup && (
            <button
              onClick={onOpenBackup}
              className="w-8 h-8 rounded-full glass-button flex items-center justify-center text-emerald-400 hover:text-emerald-300 active:scale-95 transition-transform"
              title="قاعدة البيانات والنسخ الاحتياطي (Backup)"
            >
              <Database className="w-4 h-4" />
            </button>
          )}

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

          <button
            onClick={() => onNavigate('packages')}
            className="w-8 h-8 rounded-full glass-button flex items-center justify-center text-gray-300 hover:text-white active:scale-95 transition-transform"
            title="إدارة الباقات والعروض (الاعدادات)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Notifications Drawer / Modal */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-14 animate-fadeIn">
          <div className="w-full max-w-md bg-[#0B1220]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#FF7A1A]/20 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[#FF7A1A]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">التنبيهات والإشعارات</h3>
                  <p className="text-[10px] text-gray-400">تابع العمليات المعلقة والديون المستحقة</p>
                </div>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* 1. Pending Collections */}
              {pendingCollectionSales.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-amber-400 text-xs font-bold">
                    <Clock className="w-4 h-4" />
                    <span>فواتير مرسلة قبل الدفع ({pendingCollectionSales.length})</span>
                  </div>
                  <div className="space-y-2">
                    {pendingCollectionSales.map((sale) => (
                      <div
                        key={sale.id}
                        onClick={() => {
                          setShowNotifications(false);
                          onNavigate('sales');
                        }}
                        className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                            {sale.shopName.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{sale.shopName}</p>
                            <p className="text-[10px] text-amber-300">{sale.clientName} - لم يتم التحصيل بعد</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-[#FF7A1A]">
                            {sale.finalInvoice.toLocaleString()} ج.م
                          </span>
                          <span className="block text-[9px] text-gray-400">{sale.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Outstanding Debts */}
              {debtSales.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2 text-red-400 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <span>متبقي مبالغ للتحصيل ({debtSales.length})</span>
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
                          className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between cursor-pointer hover:bg-red-500/20 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs">
                              {sale.shopName.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{sale.shopName}</p>
                              <p className="text-[10px] text-red-300">متبقي: {remaining.toLocaleString()} ج.م</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-bold text-white">
                              {sale.finalInvoice.toLocaleString()} ج.م
                            </span>
                            <span className="block text-[9px] text-gray-400">{sale.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Recent Sales Activity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>آخر العمليات المضافة</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('sales');
                    }}
                    className="text-[10px] text-[#FF7A1A] font-bold hover:underline flex items-center gap-0.5"
                  >
                    عرض الكل <ChevronRight className="w-3 h-3 rotate-180" />
                  </button>
                </div>

                {recentSales.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4 bg-white/5 rounded-xl">
                    لا توجد عمليات مبيعات حديثة
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#FF7A1A]/15 text-[#FF7A1A] flex items-center justify-center font-bold text-xs">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{sale.shopName}</p>
                            <p className="text-[10px] text-gray-400">{sale.packageName || sale.system}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold text-emerald-400">
                            +{sale.finalInvoice.toLocaleString()} ج.م
                          </span>
                          <span className="block text-[9px] text-gray-400">{sale.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-white/10 bg-white/5 text-center">
              <button
                onClick={() => {
                  setShowNotifications(false);
                  onNavigate('sales');
                }}
                className="w-full btn-orange py-2 text-xs font-bold rounded-xl shadow-md"
              >
                الانتقال إلى سجل المبيعات والتحصيل
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
