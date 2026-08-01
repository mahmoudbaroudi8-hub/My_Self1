import React, { useState } from 'react';
import { Bell, Settings, User, X, CheckCircle2, Clock, AlertTriangle, ChevronRight, Receipt, Database, Smartphone, Monitor, LayoutGrid, Package, LogOut, UserCheck, Calendar, Phone } from 'lucide-react';
import { ScreenView, Sale, Client, TeamMember, Lead, POSITION_LABELS } from '../types';
import { isScreenAllowedForUser } from '../lib/permissions';

interface NavbarProps {
  currentScreen: ScreenView;
  onNavigate: (screen: ScreenView) => void;
  sales?: Sale[];
  clients?: Client[];
  leads?: Lead[];
  currentUser?: TeamMember | null;
  onOpenBackup?: () => void;
  onOpenInstallPwa?: () => void;
  onLogout?: () => void;
  isAppInstalled?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  sales = [],
  clients = [],
  leads = [],
  currentUser = null,
  onOpenBackup,
  onOpenInstallPwa,
  onLogout,
  isAppInstalled = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isOwner = !currentUser || currentUser.position === 'owner';

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

  // Derive notifications filtered by authority / relationship
  const pendingCollectionSales = isOwner
    ? sales.filter((s) => s.status === 'morsal_qabl_dafa')
    : sales.filter(
        (s) =>
          s.status === 'morsal_qabl_dafa' &&
          (s.assignedEmployeeId === currentUser?.id ||
            currentUser?.assignedClientIds?.includes(s.clientId || '') ||
            s.employeeCommissions?.some((ec) => ec.employeeId === currentUser?.id))
      );

  const debtSales = isOwner
    ? sales.filter((s) => s.finalInvoice > s.paidAmount && s.status === 'mowakad')
    : sales.filter(
        (s) =>
          s.finalInvoice > s.paidAmount &&
          s.status === 'mowakad' &&
          (s.assignedEmployeeId === currentUser?.id ||
            currentUser?.assignedClientIds?.includes(s.clientId || '') ||
            s.employeeCommissions?.some((ec) => ec.employeeId === currentUser?.id))
      );

  const assignedLeads = isOwner
    ? leads.filter((l) => l.status === 'محتمل')
    : leads.filter(
        (l) =>
          l.status === 'محتمل' &&
          l.assignedEmployeeIds &&
          l.assignedEmployeeIds.includes(currentUser?.id || '')
      );

  const assignedVisits = isOwner
    ? sales.filter((s) => Boolean(s.nextVisitDate))
    : sales.filter(
        (s) =>
          Boolean(s.nextVisitDate) &&
          (s.assignedEmployeeId === currentUser?.id ||
            currentUser?.assignedClientIds?.includes(s.clientId || '') ||
            s.employeeCommissions?.some((ec) => ec.employeeId === currentUser?.id))
      );

  const recentSales = isOwner
    ? sales.slice(0, 3)
    : sales
        .filter(
          (s) =>
            s.assignedEmployeeId === currentUser?.id ||
            currentUser?.assignedClientIds?.includes(s.clientId || '') ||
            s.employeeCommissions?.some((ec) => ec.employeeId === currentUser?.id)
        )
        .slice(0, 3);

  const totalAlertsCount = isOwner
    ? pendingCollectionSales.length + debtSales.length + assignedLeads.length
    : pendingCollectionSales.length + debtSales.length + assignedLeads.length + assignedVisits.length;

  const canAccessPackages = isScreenAllowedForUser(currentUser, 'packages');
  const canAccessTeam = isScreenAllowedForUser(currentUser, 'team');

  return (
    <>
      <header className="sticky top-0 z-[100] w-full shrink-0 px-4 py-2.5 bg-[#070918] backdrop-blur-2xl border-b-2 border-[#FF7A1A]/30 shadow-[0_8px_30px_rgba(0,0,0,0.8)] flex items-center justify-between transition-all">
        {/* Right side: App Owner/Employee Profile Dropdown */}
        <button
          type="button"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-2.5 text-right cursor-pointer hover:opacity-80 transition-opacity"
          title="معلومات الحساب وتعديل الملف الشخصي وتسجيل الخروج"
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
                ? currentUser.position === 'custom'
                  ? currentUser.customPositionTitle || 'وظيفة مخصصة'
                  : POSITION_LABELS[currentUser.position] || 'عضو فريق'
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
          {/* Packages & Offers Catalog Button (Hidden if unauthorized) */}
          {canAccessPackages && (
            <button
              onClick={() => onNavigate('packages')}
              className={`w-8 h-8 rounded-full glass-button flex items-center justify-center transition-transform active:scale-95 ${
                currentScreen === 'packages'
                  ? 'text-[#FF7A1A] bg-[#FF7A1A]/20 border border-[#FF7A1A]'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
              title="كتالوج الباقات والعروض"
            >
              <Package className="w-4 h-4" />
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

          {/* General Settings / Team Button (Hidden if unauthorized) */}
          {(isOwner || canAccessTeam) && (
            <button
              onClick={() => {
                if (onOpenBackup && isOwner) onOpenBackup();
                else onNavigate('team');
              }}
              className="w-8 h-8 rounded-full glass-button flex items-center justify-center text-gray-300 hover:text-white transition-transform active:scale-95"
              title="إعدادات النظام وفريق العمل والصلاحيات"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* User Profile Dropdown Menu / Modal */}
      {showProfileMenu && (
        <div
          onClick={() => setShowProfileMenu(false)}
          className="fixed inset-0 z-[200] flex items-start justify-start p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-[#0B1220]/95 backdrop-blur-2xl border-2 border-[#FF7A1A]/40 rounded-2xl shadow-2xl p-4 text-right space-y-4 mt-12 animate-slide-down"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF7A1A]/20 border border-[#FF7A1A]/40 flex items-center justify-center text-[#FF7A1A]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">{currentUser?.name || 'صاحب المشروع'}</h3>
                  <span className="text-[10px] text-[#FF7A1A] font-bold block">
                    {currentUser
                      ? currentUser.position === 'custom'
                        ? currentUser.customPositionTitle || 'وظيفة مخصصة'
                        : POSITION_LABELS[currentUser.position] || 'عضو فريق'
                      : 'مدير وصاحب المشروع (البارودي)'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileMenu(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-gray-300">
              {currentUser?.phone && (
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{currentUser.phone}</span>
                </div>
              )}

              {canAccessTeam && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onNavigate('team');
                  }}
                  className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-2 transition-colors font-medium text-xs"
                >
                  <UserCheck className="w-4 h-4 text-[#FF7A1A]" />
                  <span>إدارة الفريق والصلاحيات</span>
                </button>
              )}

              {isOwner && onOpenBackup && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenBackup();
                  }}
                  className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-2 transition-colors font-medium text-xs"
                >
                  <Database className="w-4 h-4 text-blue-400" />
                  <span>النسخ الاحتياطي وإعدادات النظام</span>
                </button>
              )}
            </div>

            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onLogout) onLogout();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>تسجيل الخروج من الحساب</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Drawer / Modal */}
      {showNotifications && (
        <div
          onClick={() => setShowNotifications(false)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0B1220]/95 backdrop-blur-2xl border-2 border-[#FF7A1A]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-right"
          >
            {/* Header */}
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
                        {totalAlertsCount} تنبيه
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400">
                    {isOwner
                      ? 'متابعة العمليات المعلقة والديون الإجمالية للشركة'
                      : 'متابعة العملاء والعمليات والزيارات المُسندة إليك فقط'}
                  </p>
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

            {/* Scrollable Body Container */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Assigned Leads (for Employee & Owner) */}
              {assignedLeads.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-blue-400 text-xs font-bold border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" />
                      <span>عملاء محتملين قيد المتابعة ({assignedLeads.length})</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {assignedLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => {
                          setShowNotifications(false);
                          onNavigate('clients');
                        }}
                        className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between cursor-pointer hover:bg-blue-500/20 transition-all group shadow-sm"
                      >
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                            {lead.name} ({lead.system})
                          </p>
                          <p className="text-[10px] text-blue-200">
                            هاتف: {lead.phone} {lead.notes ? `• ${lead.notes}` : ''}
                          </p>
                        </div>
                        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                          عميل محتمل
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. Pending Collections */}
              {pendingCollectionSales.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-amber-400 text-xs font-bold border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>
                        {isOwner ? 'فواتير قيد التحصيل (مرسلة قبل الدفع)' : 'فواتير عملائك قيد التحصيل'}
                      </span>
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
                      <span>{isOwner ? 'متبقي مبالغ غير محصلة بالكامل' : 'ديون عملائك المتبقية'}</span>
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

              {/* 3. Assigned Upcoming Visits (Non-owner focus) */}
              {!isOwner && assignedVisits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-emerald-400 text-xs font-bold border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>مواعيد الزيارات والمتابعات الخاصة بك</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {assignedVisits.map((sale) => (
                      <div
                        key={sale.id}
                        onClick={() => {
                          setShowNotifications(false);
                          onNavigate('sales');
                        }}
                        className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between cursor-pointer hover:bg-emerald-500/20 transition-all"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{sale.shopName || sale.clientName}</p>
                          <p className="text-[10px] text-emerald-300">
                            موعد الزيارة: <strong>{sale.nextVisitDate}</strong>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Recent Sales Activity */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-emerald-400 text-xs font-bold border-b border-white/10 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isOwner ? 'أحدث العمليات المسجلة' : 'أحدث عملياتك المسجلة'}</span>
                  </div>
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
                  <p className="text-xs font-bold text-emerald-300">🎉 لا توجد ديون أو تنبيهات عاجلة</p>
                  <p className="text-[10px] text-gray-400">جميع العمليات والمتابعات مستقرة بالكامل</p>
                </div>
              )}
            </div>

            {/* Footer */}
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
